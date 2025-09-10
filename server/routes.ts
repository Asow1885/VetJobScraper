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
import { insertJobSchema, insertScrapingSourceSchema } from "@shared/schema";

// Security middleware
const securityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const scrapingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit scraping to 5 requests per 5 minutes
  message: { error: "Scraping rate limit exceeded, please wait before trying again" },
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500,
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
  // Apply security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
  app.use(securityLimiter);
  app.use(speedLimiter);
  
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

  app.patch("/api/jobs/:id", [
    param('id').isUUID().withMessage('Invalid job ID format'),
    body('status').optional().isIn(['pending', 'posted', 'failed']),
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

  const httpServer = createServer(app);
  return httpServer;
}
