import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  emailVerified: boolean("email_verified").default(false),
  lastLogin: timestamp("last_login"),
  fullName: text("full_name"),
  email: text("email").unique(),
  militaryBranch: text("military_branch"),
  yearsOfService: integer("years_of_service"),
  skills: text("skills").array(),
  desiredJobTypes: text("desired_job_types").array(),
  desiredLocations: text("desired_locations").array(),
  minSalary: integer("min_salary"),
  clearanceLevel: text("clearance_level"),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  jobType: text("job_type"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  description: text("description"),
  url: text("url").notNull(),
  source: text("source").notNull(),
  veteranKeywords: text("veteran_keywords").array(),
  scrapedDate: timestamp("scraped_date").defaultNow(),
  expiresOn: timestamp("expires_on"),
  postedToKaza: boolean("posted_to_kaza").default(false),
  kazaPostId: text("kaza_post_id"),
  status: text("status").default("pending"), // pending, approved, rejected, posted, failed, expired
  metadata: jsonb("metadata"),
});

export const scrapingSources = pgTable("scraping_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // jobspy, custom
  url: text("url"),
  isActive: boolean("is_active").default(true),
  lastScrape: timestamp("last_scrape"),
  config: jsonb("config"),
});

export const scrapingLogs = pgTable("scraping_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").references(() => scrapingSources.id),
  status: text("status").notNull(), // success, error, warning
  message: text("message").notNull(),
  jobsFound: integer("jobs_found").default(0),
  timestamp: timestamp("timestamp").defaultNow(),
  details: jsonb("details"),
});

export const kazaConnectLogs = pgTable("kaza_connect_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id),
  action: text("action").notNull(), // post, update, delete
  status: text("status").notNull(), // success, error
  response: jsonb("response"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const jobRecommendations = pgTable("job_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  matchScore: integer("match_score").notNull(), // 0-100
  matchReasons: text("match_reasons").array(),
  skillMatches: text("skill_matches").array(),
  locationMatch: boolean("location_match").default(false),
  salaryMatch: boolean("salary_match").default(false),
  veteranMatch: boolean("veteran_match").default(false),
  matchDetails: jsonb("match_details"),
  createdAt: timestamp("created_at").defaultNow(),
  dismissed: boolean("dismissed").default(false),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const createUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const registerUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain uppercase, lowercase, and number'),
  fullName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  scrapedDate: true,
});

export const insertScrapingSourceSchema = createInsertSchema(scrapingSources).omit({
  id: true,
});

export const insertScrapingLogSchema = createInsertSchema(scrapingLogs).omit({
  id: true,
  timestamp: true,
});

export const insertKazaConnectLogSchema = createInsertSchema(kazaConnectLogs).omit({
  id: true,
  timestamp: true,
});

export const insertJobRecommendationSchema = createInsertSchema(jobRecommendations).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type ScrapingSource = typeof scrapingSources.$inferSelect;
export type InsertScrapingSource = z.infer<typeof insertScrapingSourceSchema>;

export type ScrapingLog = typeof scrapingLogs.$inferSelect;
export type InsertScrapingLog = z.infer<typeof insertScrapingLogSchema>;

export type KazaConnectLog = typeof kazaConnectLogs.$inferSelect;
export type InsertKazaConnectLog = z.infer<typeof insertKazaConnectLogSchema>;

export type JobRecommendation = typeof jobRecommendations.$inferSelect;
export type InsertJobRecommendation = z.infer<typeof insertJobRecommendationSchema>;
