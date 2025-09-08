import { 
  type User, 
  type InsertUser, 
  type Job, 
  type InsertJob,
  type ScrapingSource,
  type InsertScrapingSource,
  type ScrapingLog,
  type InsertScrapingLog,
  type KazaConnectLog,
  type InsertKazaConnectLog
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Jobs
  getJobs(filters?: { 
    source?: string; 
    status?: string; 
    veteranOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;
  deleteJob(id: string): Promise<boolean>;
  getJobStats(): Promise<{
    total: number;
    veteran: number;
    postedToKaza: number;
    pending: number;
  }>;

  // Scraping Sources
  getScrapingSources(): Promise<ScrapingSource[]>;
  getScrapingSource(id: string): Promise<ScrapingSource | undefined>;
  createScrapingSource(source: InsertScrapingSource): Promise<ScrapingSource>;
  updateScrapingSource(id: string, updates: Partial<ScrapingSource>): Promise<ScrapingSource | undefined>;

  // Scraping Logs
  getScrapingLogs(limit?: number): Promise<ScrapingLog[]>;
  createScrapingLog(log: InsertScrapingLog): Promise<ScrapingLog>;

  // KazaConnect Logs
  getKazaConnectLogs(limit?: number): Promise<KazaConnectLog[]>;
  createKazaConnectLog(log: InsertKazaConnectLog): Promise<KazaConnectLog>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jobs: Map<string, Job>;
  private scrapingSources: Map<string, ScrapingSource>;
  private scrapingLogs: Map<string, ScrapingLog>;
  private kazaConnectLogs: Map<string, KazaConnectLog>;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.scrapingSources = new Map();
    this.scrapingLogs = new Map();
    this.kazaConnectLogs = new Map();

    // Initialize default scraping sources
    this.initializeDefaultSources();
  }

  private initializeDefaultSources() {
    const defaultSources: InsertScrapingSource[] = [
      {
        name: "LinkedIn",
        type: "jobspy",
        isActive: true,
        config: { site_name: "linkedin" }
      },
      {
        name: "Indeed",
        type: "jobspy",
        isActive: true,
        config: { site_name: "indeed" }
      },
      {
        name: "Glassdoor",
        type: "jobspy",
        isActive: true,
        config: { site_name: "glassdoor" }
      },
      {
        name: "Google Jobs",
        type: "jobspy",
        isActive: true,
        config: { site_name: "google" }
      }
    ];

    defaultSources.forEach(source => {
      const id = randomUUID();
      const sourceWithDefaults: ScrapingSource = {
        ...source,
        id,
        url: source.url || null,
        isActive: source.isActive ?? true,
        lastScrape: source.lastScrape || null,
        config: source.config || null
      };
      this.scrapingSources.set(id, sourceWithDefaults);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Jobs
  async getJobs(filters?: { 
    source?: string; 
    status?: string; 
    veteranOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Job[]> {
    let jobs = Array.from(this.jobs.values());

    if (filters?.source) {
      jobs = jobs.filter(job => job.source === filters.source);
    }

    if (filters?.status) {
      jobs = jobs.filter(job => job.status === filters.status);
    }

    if (filters?.veteranOnly) {
      jobs = jobs.filter(job => job.veteranKeywords && job.veteranKeywords.length > 0);
    }

    // Sort by scrapedDate descending
    jobs.sort((a, b) => {
      const dateA = a.scrapedDate ? new Date(a.scrapedDate).getTime() : 0;
      const dateB = b.scrapedDate ? new Date(b.scrapedDate).getTime() : 0;
      return dateB - dateA;
    });

    const offset = filters?.offset || 0;
    const limit = filters?.limit || jobs.length;
    
    return jobs.slice(offset, offset + limit);
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = { 
      ...insertJob, 
      id,
      scrapedDate: new Date(),
      status: "pending",
      postedToKaza: false,
      metadata: insertJob.metadata || null,
      description: insertJob.description || null,
      kazaPostId: insertJob.kazaPostId || null,
      location: insertJob.location || null,
      jobType: insertJob.jobType || null,
      salaryMin: insertJob.salaryMin || null,
      salaryMax: insertJob.salaryMax || null,
      veteranKeywords: insertJob.veteranKeywords || [],
      expiresOn: insertJob.expiresOn || null
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updatedJob = { ...job, ...updates };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async deleteJob(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async getJobStats(): Promise<{
    total: number;
    veteran: number;
    postedToKaza: number;
    pending: number;
  }> {
    const jobs = Array.from(this.jobs.values());
    
    return {
      total: jobs.length,
      veteran: jobs.filter(job => job.veteranKeywords && job.veteranKeywords.length > 0).length,
      postedToKaza: jobs.filter(job => job.postedToKaza).length,
      pending: jobs.filter(job => job.status === "pending").length
    };
  }

  // Scraping Sources
  async getScrapingSources(): Promise<ScrapingSource[]> {
    return Array.from(this.scrapingSources.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getScrapingSource(id: string): Promise<ScrapingSource | undefined> {
    return this.scrapingSources.get(id);
  }

  async createScrapingSource(insertSource: InsertScrapingSource): Promise<ScrapingSource> {
    const id = randomUUID();
    const source: ScrapingSource = { 
      ...insertSource, 
      id,
      url: insertSource.url || null,
      isActive: insertSource.isActive ?? true,
      lastScrape: insertSource.lastScrape || null,
      config: insertSource.config || null
    };
    this.scrapingSources.set(id, source);
    return source;
  }

  async updateScrapingSource(id: string, updates: Partial<ScrapingSource>): Promise<ScrapingSource | undefined> {
    const source = this.scrapingSources.get(id);
    if (!source) return undefined;

    const updatedSource = { ...source, ...updates };
    this.scrapingSources.set(id, updatedSource);
    return updatedSource;
  }

  // Scraping Logs
  async getScrapingLogs(limit: number = 50): Promise<ScrapingLog[]> {
    const logs = Array.from(this.scrapingLogs.values());
    return logs
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  async createScrapingLog(insertLog: InsertScrapingLog): Promise<ScrapingLog> {
    const id = randomUUID();
    const log: ScrapingLog = { 
      ...insertLog, 
      id,
      timestamp: new Date(),
      sourceId: insertLog.sourceId || null,
      jobsFound: insertLog.jobsFound ?? 0,
      details: insertLog.details || null
    };
    this.scrapingLogs.set(id, log);
    return log;
  }

  // KazaConnect Logs
  async getKazaConnectLogs(limit: number = 50): Promise<KazaConnectLog[]> {
    const logs = Array.from(this.kazaConnectLogs.values());
    return logs
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  async createKazaConnectLog(insertLog: InsertKazaConnectLog): Promise<KazaConnectLog> {
    const id = randomUUID();
    const log: KazaConnectLog = { 
      ...insertLog, 
      id,
      timestamp: new Date(),
      jobId: insertLog.jobId || null,
      response: insertLog.response || null
    };
    this.kazaConnectLogs.set(id, log);
    return log;
  }
}

export const storage = new MemStorage();
