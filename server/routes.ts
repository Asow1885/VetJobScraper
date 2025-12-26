import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import helmet from "helmet";
import { body, param, query, validationResult } from "express-validator";
import { storage } from "./storage";
import { jobScraperService } from "./services/jobScraper";
import { kazaConnectService } from "./services/kazaConnectApi";
import { schedulerService } from "./services/scheduler";
import { insertJobSchema, insertScrapingSourceSchema, insertUserSchema } from "@shared/schema";
import { JobMatchingService } from "./services/job-matching";
import path from "path";
import { 
  AuthRequest, 
  generateToken, 
  hashPassword, 
  comparePassword, 
  requireAuth, 
  requireAdmin, 
  optionalAuth 
} from "./auth";

// Security middleware
const securityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (more permissive for development)
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const scrapingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit scraping to 5 requests per 5 minutes
  message: { error: "Scraping rate limit exceeded, please wait before trying again" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit auth attempts to 10 per 15 minutes
  message: { error: "Too many authentication attempts, please try again later" },
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 500, // increased from 50 to 500
  delayMs: () => 100, // reduced from 500ms to 100ms
});

// Validation helpers
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: "Validation failed", 
      details: errors.array() 
    });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Download endpoint for project zip
  app.get("/api/download-project", (req: Request, res: Response) => {
    const zipPath = path.join(process.cwd(), "project-export.zip");
    res.download(zipPath, "project-export.zip", (err) => {
      if (err) {
        res.status(404).json({ error: "File not found" });
      }
    });
  });

  // Apply security middleware  
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    } : false,  // Disable CSP in development to allow Vite
  }));
  app.use(securityLimiter);
  app.use(speedLimiter);
  
  // ========== Authentication Endpoints ==========
  
  app.post("/api/auth/register", [
    authLimiter,
    body('username').isString().trim().isLength({ min: 3, max: 50 }).escape(),
    body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('email').optional().isEmail().normalizeEmail(),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const { username, password, email } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
      
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        username,
        passwordHash,
        email: email || null,
        role: 'user',
        isActive: true,
        emailVerified: false,
      });
      
      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email || '',
        role: user.role as 'admin' | 'user'
      });
      
      res.status(201).json({
        message: "Registration successful",
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", [
    authLimiter,
    body('username').isString().trim().escape(),
    body('password').isString(),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ error: "Account is deactivated" });
      }
      
      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      await storage.updateUser(user.id, { lastLogin: new Date() });
      
      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email || '',
        role: user.role as 'admin' | 'user'
      });
      
      res.json({
        message: "Login successful",
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.patch("/api/auth/password", [
    requireAuth,
    body('currentPassword').isString(),
    body('newPassword').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    handleValidationErrors
  ], async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const isValidPassword = await comparePassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      const newPasswordHash = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, newPasswordHash);
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // ========== Admin User Management ==========
  
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/role", [
    requireAuth,
    requireAdmin,
    param('id').isString().trim(),
    body('role').isIn(['admin', 'user']),
    handleValidationErrors
  ], async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (id === req.user!.id) {
        return res.status(400).json({ error: "Cannot change your own role" });
      }
      
      const user = await storage.updateUser(id, { role });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ message: "User role updated", user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.patch("/api/admin/users/:id/status", [
    requireAuth,
    requireAdmin,
    param('id').isString().trim(),
    body('isActive').isBoolean(),
    handleValidationErrors
  ], async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (id === req.user!.id) {
        return res.status(400).json({ error: "Cannot deactivate your own account" });
      }
      
      const user = await storage.updateUser(id, { isActive });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ message: `User ${isActive ? 'activated' : 'deactivated'}`, user: { id: user.id, username: user.username, isActive: user.isActive } });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Job endpoints
  app.get("/api/jobs", [
    query('source').optional().isString().trim().escape(),
    query('status').optional().isString().trim().escape(),
    query('veteranOnly').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const { source, status, veteranOnly, limit, offset } = req.query;
      const jobs = await storage.getJobs({
        source: source as string,
        status: status as string,
        veteranOnly: veteranOnly === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", [
    param('id').isUUID().withMessage('Invalid job ID format'),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", [
    body('title').isString().trim().isLength({ min: 1, max: 500 }).escape(),
    body('company').isString().trim().isLength({ min: 1, max: 200 }).escape(),
    body('location').isString().trim().isLength({ min: 1, max: 200 }).escape(),
    body('url').isURL().normalizeEmail(),
    body('source').isString().trim().escape(),
    body('description').optional().isString().trim().isLength({ max: 10000 }),
    body('veteranKeywords').optional().isArray(),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const validatedData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error) {
      res.status(400).json({ message: "Invalid job data", error });
    }
  });

  // Job approval endpoints
  app.patch("/api/jobs/:id/approve", [
    param('id').isUUID().withMessage('Invalid job ID format'),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const job = await storage.updateJobStatus(req.params.id, 'approved');
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json({ message: "Job approved successfully", job });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve job" });
    }
  });

  app.patch("/api/jobs/:id/reject", [
    param('id').isUUID().withMessage('Invalid job ID format'),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const job = await storage.updateJobStatus(req.params.id, 'rejected');
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json({ message: "Job rejected successfully", job });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject job" });
    }
  });

  app.patch("/api/jobs/:id", [
    param('id').isUUID().withMessage('Invalid job ID format'),
    body('status').optional().isIn(['pending', 'approved', 'rejected', 'posted', 'failed']),
    body('title').optional().isString().trim().isLength({ min: 1, max: 500 }).escape(),
    body('company').optional().isString().trim().isLength({ min: 1, max: 200 }).escape(),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const job = await storage.updateJob(req.params.id, req.body);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", [
    param('id').isUUID().withMessage('Invalid job ID format'),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteJob(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getJobStats();
      const sources = await storage.getScrapingSources();
      const activeSources = sources.filter(s => s.isActive).length;
      
      res.json({
        ...stats,
        activeSources
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Scraping endpoints
  app.post("/api/scrape/run", [
    scrapingLimiter,
    body('maxJobs').optional().isInt({ min: 1, max: 100 }).withMessage('maxJobs must be between 1 and 100'),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const { maxJobs = 50 } = req.body;
      jobScraperService.runScraping(maxJobs);
      res.json({ message: "Scraping started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start scraping" });
    }
  });

  app.get("/api/scrape/status", async (req, res) => {
    try {
      const status = jobScraperService.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scraping status" });
    }
  });

  app.get("/api/scraping/sources", async (req, res) => {
    try {
      const sources = await storage.getScrapingSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sources" });
    }
  });

  app.post("/api/scraping/sources", async (req, res) => {
    try {
      const validatedData = insertScrapingSourceSchema.parse(req.body);
      const source = await storage.createScrapingSource(validatedData);
      res.status(201).json(source);
    } catch (error) {
      res.status(400).json({ message: "Invalid source data", error });
    }
  });

  app.patch("/api/scraping/sources/:id", async (req, res) => {
    try {
      const source = await storage.updateScrapingSource(req.params.id, req.body);
      if (!source) {
        return res.status(404).json({ message: "Source not found" });
      }
      res.json(source);
    } catch (error) {
      res.status(500).json({ message: "Failed to update source" });
    }
  });

  // Logs endpoints
  app.get("/api/logs/scraping", async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const logs = await storage.getScrapingLogs(parseInt(limit as string));
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scraping logs" });
    }
  });

  app.get("/api/logs/kaza-connect", async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const logs = await storage.getKazaConnectLogs(parseInt(limit as string));
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch KazaConnect logs" });
    }
  });

  // KazaConnect integration endpoints
  app.post("/api/kaza-connect/post/:jobId", [
    param('jobId').isUUID().withMessage('Invalid job ID format'),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const result = await kazaConnectService.postJob(job);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to post job to KazaConnect" });
    }
  });

  app.post("/api/kaza-connect/bulk-post", [
    body('jobIds').isArray({ min: 1, max: 50 }).withMessage('jobIds must be an array with 1-50 items'),
    body('jobIds.*').isUUID().withMessage('Each job ID must be a valid UUID'),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const { jobIds } = req.body;
      if (!Array.isArray(jobIds)) {
        return res.status(400).json({ message: "jobIds must be an array" });
      }

      const results = await kazaConnectService.bulkPostJobs(jobIds);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to bulk post jobs" });
    }
  });

  // Scheduler endpoints
  app.post("/api/scheduler/start", async (req, res) => {
    try {
      schedulerService.start();
      res.json({ message: "Scheduler started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start scheduler" });
    }
  });

  app.post("/api/scheduler/stop", async (req, res) => {
    try {
      schedulerService.stop();
      res.json({ message: "Scheduler stopped" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop scheduler" });
    }
  });

  app.get("/api/scheduler/status", async (req, res) => {
    try {
      const status = schedulerService.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scheduler status" });
    }
  });

  // User profile endpoints
  app.get("/api/users/:id", [
    param('id').isString().trim(),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", [
    param('id').isString().trim(),
    body('fullName').optional().isString().trim(),
    body('email').optional().isEmail(),
    body('militaryBranch').optional().isString().trim(),
    body('yearsOfService').optional().isInt({ min: 0, max: 50 }),
    body('skills').optional().isArray(),
    body('desiredJobTypes').optional().isArray(),
    body('desiredLocations').optional().isArray(),
    body('minSalary').optional().isInt({ min: 0 }),
    body('clearanceLevel').optional().isString().trim(),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Job Recommendation endpoints
  app.get("/api/recommendations/:userId", [
    param('userId').isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const recommendations = await storage.getRecommendationsForUser(userId, limit);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/recommendations/generate/:userId", [
    param('userId').isString().trim(),
    body('limit').optional().isInt({ min: 1, max: 100 }),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = req.body.limit || 20;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all available jobs
      const jobs = await storage.getJobs({ limit: 1000 });

      // Generate recommendations
      const recommendations = await JobMatchingService.generateRecommendationsForUser(
        user,
        jobs,
        limit
      );

      // Save recommendations to database
      const savedRecommendations = await storage.createRecommendations(recommendations);

      res.json({
        message: `Generated ${savedRecommendations.length} recommendations`,
        recommendations: savedRecommendations
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.patch("/api/recommendations/:id/dismiss", [
    param('id').isString().trim(),
    handleValidationErrors
  ], async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.dismissRecommendation(id);
      if (!success) {
        return res.status(404).json({ message: "Recommendation not found" });
      }
      res.json({ message: "Recommendation dismissed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to dismiss recommendation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
