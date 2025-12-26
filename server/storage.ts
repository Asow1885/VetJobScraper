import { 
  type User, 
  type InsertUser, 
  type CreateUser,
  type Job, 
  type InsertJob,
  type ScrapingSource,
  type InsertScrapingSource,
  type ScrapingLog,
  type InsertScrapingLog,
  type KazaConnectLog,
  type InsertKazaConnectLog,
  type JobRecommendation,
  type InsertJobRecommendation,
  users,
  jobs,
  scrapingSources,
  scrapingLogs,
  kazaConnectLogs,
  jobRecommendations
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and, count, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  createUser(user: CreateUser): Promise<User>;
  createUserWithHash(data: {
    username: string;
    email: string;
    password_hash: string;
    fullName?: string;
    role?: string;
  }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserPassword(id: string, passwordHash: string): Promise<boolean>;
  updateUserLastLogin(id: string): Promise<void>;
  deactivateUser(id: string): Promise<boolean>;
  activateUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;

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

  // Job Recommendations
  getRecommendationsForUser(userId: string, limit?: number): Promise<JobRecommendation[]>;
  createRecommendation(recommendation: InsertJobRecommendation): Promise<JobRecommendation>;
  createRecommendations(recommendations: InsertJobRecommendation[]): Promise<JobRecommendation[]>;
  dismissRecommendation(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jobs: Map<string, Job>;
  private scrapingSources: Map<string, ScrapingSource>;
  private scrapingLogs: Map<string, ScrapingLog>;
  private kazaConnectLogs: Map<string, KazaConnectLog>;
  private recommendations: Map<string, JobRecommendation>;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.scrapingSources = new Map();
    this.scrapingLogs = new Map();
    this.kazaConnectLogs = new Map();
    this.recommendations = new Map();

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

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === usernameOrEmail || user.email === usernameOrEmail,
    );
  }

  async createUser(insertUser: CreateUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      passwordHash: insertUser.passwordHash,
      role: insertUser.role || 'user',
      isActive: insertUser.isActive ?? true,
      emailVerified: insertUser.emailVerified ?? false,
      lastLogin: null,
      fullName: insertUser.fullName || null,
      email: insertUser.email || null,
      militaryBranch: insertUser.militaryBranch || null,
      yearsOfService: insertUser.yearsOfService || null,
      skills: insertUser.skills || null,
      desiredJobTypes: insertUser.desiredJobTypes || null,
      desiredLocations: insertUser.desiredLocations || null,
      minSalary: insertUser.minSalary || null,
      clearanceLevel: insertUser.clearanceLevel || null,
      preferences: insertUser.preferences || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createUserWithHash(data: {
    username: string;
    email: string;
    password_hash: string;
    fullName?: string;
    role?: string;
  }): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: data.username,
      passwordHash: data.password_hash,
      role: data.role || 'user',
      isActive: true,
      emailVerified: false,
      lastLogin: null,
      fullName: data.fullName || null,
      email: data.email,
      militaryBranch: null,
      yearsOfService: null,
      skills: null,
      desiredJobTypes: null,
      desiredLocations: null,
      minSalary: null,
      clearanceLevel: null,
      preferences: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    user.passwordHash = passwordHash;
    user.updatedAt = new Date();
    this.users.set(id, user);
    return true;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLogin = new Date();
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  async deactivateUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    user.isActive = false;
    user.updatedAt = new Date();
    this.users.set(id, user);
    return true;
  }

  async activateUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    user.isActive = true;
    user.updatedAt = new Date();
    this.users.set(id, user);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getUserCount(): Promise<number> {
    return this.users.size;
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

  // Job Recommendations
  async getRecommendationsForUser(userId: string, limit: number = 20): Promise<JobRecommendation[]> {
    const userRecs = Array.from(this.recommendations.values())
      .filter(rec => rec.userId === userId && !rec.dismissed)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
    return userRecs;
  }

  async createRecommendation(recommendation: InsertJobRecommendation): Promise<JobRecommendation> {
    const id = randomUUID();
    const rec: JobRecommendation = {
      ...recommendation,
      id,
      createdAt: new Date(),
      dismissed: recommendation.dismissed ?? false,
      matchReasons: recommendation.matchReasons ?? null,
      skillMatches: recommendation.skillMatches ?? null,
      locationMatch: recommendation.locationMatch ?? false,
      salaryMatch: recommendation.salaryMatch ?? false,
      veteranMatch: recommendation.veteranMatch ?? false,
      matchDetails: recommendation.matchDetails ?? null,
    };
    this.recommendations.set(id, rec);
    return rec;
  }

  async createRecommendations(recommendations: InsertJobRecommendation[]): Promise<JobRecommendation[]> {
    const created: JobRecommendation[] = [];
    for (const rec of recommendations) {
      const created_rec = await this.createRecommendation(rec);
      created.push(created_rec);
    }
    return created;
  }

  async dismissRecommendation(id: string): Promise<boolean> {
    const rec = this.recommendations.get(id);
    if (rec) {
      rec.dismissed = true;
      return true;
    }
    return false;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return user;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return undefined;
    }
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.username, usernameOrEmail),
            eq(users.email, usernameOrEmail)
          )
        )
        .limit(1);
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async createUser(insertUser: CreateUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createUserWithHash(data: {
    username: string;
    email: string;
    password_hash: string;
    fullName?: string;
    role?: string;
  }): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          username: data.username,
          email: data.email,
          passwordHash: data.password_hash,
          fullName: data.fullName || null,
          role: data.role || 'user',
          isActive: true,
          emailVerified: false,
        })
        .returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
    const result = await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          lastLogin: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, id));
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  async deactivateUser(id: string): Promise<boolean> {
    try {
      const [updated] = await db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return !!updated;
    } catch (error) {
      console.error('Error deactivating user:', error);
      return false;
    }
  }

  async activateUser(id: string): Promise<boolean> {
    try {
      const [updated] = await db
        .update(users)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return !!updated;
    } catch (error) {
      console.error('Error activating user:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt));
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  async getUserCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(users);
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
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

  // Job Recommendations
  async getRecommendationsForUser(userId: string, limit: number = 20): Promise<JobRecommendation[]> {
    const result = await db.select().from(jobRecommendations)
      .where(and(
        eq(jobRecommendations.userId, userId),
        eq(jobRecommendations.dismissed, false)
      ))
      .orderBy(desc(jobRecommendations.matchScore))
      .limit(limit);
    return result;
  }

  async createRecommendation(recommendation: InsertJobRecommendation): Promise<JobRecommendation> {
    const result = await db.insert(jobRecommendations).values(recommendation).returning();
    return result[0];
  }

  async createRecommendations(recommendations: InsertJobRecommendation[]): Promise<JobRecommendation[]> {
    if (recommendations.length === 0) return [];
    const result = await db.insert(jobRecommendations).values(recommendations).returning();
    return result;
  }

  async dismissRecommendation(id: string): Promise<boolean> {
    const result = await db.update(jobRecommendations)
      .set({ dismissed: true })
      .where(eq(jobRecommendations.id, id))
      .returning();
    return result.length > 0;
  }
}

// Initialize and export storage
const dbStorage = new DbStorage();
dbStorage.initializeDefaultSources().catch(console.error);

export const storage = dbStorage;
