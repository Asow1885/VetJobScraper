import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { jobScraperService } from "./services/jobScraper";
import { kazaConnectService } from "./services/kazaConnectApi";
import { schedulerService } from "./services/scheduler";
import { insertJobSchema, insertScrapingSourceSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Job endpoints
  app.get("/api/jobs", async (req, res) => {
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

  app.get("/api/jobs/:id", async (req, res) => {
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

  app.post("/api/jobs", async (req, res) => {
    try {
      const validatedData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error) {
      res.status(400).json({ message: "Invalid job data", error });
    }
  });

  app.patch("/api/jobs/:id", async (req, res) => {
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

  app.delete("/api/jobs/:id", async (req, res) => {
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
  app.post("/api/scrape/run", async (req, res) => {
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
  app.post("/api/kaza-connect/post/:jobId", async (req, res) => {
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

  app.post("/api/kaza-connect/bulk-post", async (req, res) => {
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
