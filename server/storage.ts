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
  type InsertKazaConnectLog,
  users,
  jobs,
  scrapingSources,
  scrapingLogs,
  kazaConnectLogs
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and, count } from "drizzle-orm";

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
  updateJobStatus(id: string, status: string): Promise<Job | undefined>;
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

  async updateJobStatus(id: string, status: string): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updatedJob = { ...job, status };
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

export class DbStorage implements IStorage {
  // Initialize default sources if they don't exist
  async initializeDefaultSources() {
    const existingSources = await db.select().from(scrapingSources);
    
    if (existingSources.length === 0) {
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

      await db.insert(scrapingSources).values(defaultSources);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Jobs
  async getJobs(filters?: { 
    source?: string; 
    status?: string; 
    veteranOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Job[]> {
    const conditions = [];

    if (filters?.source) {
      conditions.push(eq(jobs.source, filters.source));
    }

    if (filters?.status) {
      conditions.push(eq(jobs.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const result = await db
      .select()
      .from(jobs)
      .where(whereClause)
      .orderBy(desc(jobs.scrapedDate))
      .offset(filters?.offset || 0)
      .limit(filters?.limit || 1000);
    
    if (filters?.veteranOnly) {
      return result.filter(job => job.veteranKeywords && job.veteranKeywords.length > 0);
    }

    return result;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id));
    return result[0];
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(insertJob).returning();
    return result[0];
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const result = await db.update(jobs).set(updates).where(eq(jobs.id, id)).returning();
    return result[0];
  }

  async updateJobStatus(id: string, status: string): Promise<Job | undefined> {
    const result = await db.update(jobs).set({ status }).where(eq(jobs.id, id)).returning();
    return result[0];
  }

  async deleteJob(id: string): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return result.rowCount > 0;
  }

  async getJobStats(): Promise<{
    total: number;
    veteran: number;
    postedToKaza: number;
    pending: number;
  }> {
    const totalResult = await db.select({ count: count() }).from(jobs);
    const postedResult = await db.select({ count: count() }).from(jobs).where(eq(jobs.postedToKaza, true));
    const pendingResult = await db.select({ count: count() }).from(jobs).where(eq(jobs.status, "pending"));
    
    // Get all jobs to count veteran ones (since we need to check array length)
    const allJobs = await db.select({ veteranKeywords: jobs.veteranKeywords }).from(jobs);
    const veteran = allJobs.filter(job => job.veteranKeywords && job.veteranKeywords.length > 0).length;
    
    return {
      total: totalResult[0]?.count || 0,
      veteran,
      postedToKaza: postedResult[0]?.count || 0,
      pending: pendingResult[0]?.count || 0
    };
  }

  // Scraping Sources
  async getScrapingSources(): Promise<ScrapingSource[]> {
    const result = await db.select().from(scrapingSources).orderBy(scrapingSources.name);
    return result;
  }

  async getScrapingSource(id: string): Promise<ScrapingSource | undefined> {
    const result = await db.select().from(scrapingSources).where(eq(scrapingSources.id, id));
    return result[0];
  }

  async createScrapingSource(insertSource: InsertScrapingSource): Promise<ScrapingSource> {
    const result = await db.insert(scrapingSources).values(insertSource).returning();
    return result[0];
  }

  async updateScrapingSource(id: string, updates: Partial<ScrapingSource>): Promise<ScrapingSource | undefined> {
    const result = await db.update(scrapingSources).set(updates).where(eq(scrapingSources.id, id)).returning();
    return result[0];
  }

  // Scraping Logs
  async getScrapingLogs(limit: number = 50): Promise<ScrapingLog[]> {
    const result = await db.select().from(scrapingLogs)
      .orderBy(desc(scrapingLogs.timestamp))
      .limit(limit);
    return result;
  }

  async createScrapingLog(insertLog: InsertScrapingLog): Promise<ScrapingLog> {
    const result = await db.insert(scrapingLogs).values(insertLog).returning();
    return result[0];
  }

  // KazaConnect Logs
  async getKazaConnectLogs(limit: number = 50): Promise<KazaConnectLog[]> {
    const result = await db.select().from(kazaConnectLogs)
      .orderBy(desc(kazaConnectLogs.timestamp))
      .limit(limit);
    return result;
  }

  async createKazaConnectLog(insertLog: InsertKazaConnectLog): Promise<KazaConnectLog> {
    const result = await db.insert(kazaConnectLogs).values(insertLog).returning();
    return result[0];
  }
}

// Initialize and export storage
const dbStorage = new DbStorage();
dbStorage.initializeDefaultSources().catch(console.error);

export const storage = dbStorage;
