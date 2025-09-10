import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type ScrapingSource = typeof scrapingSources.$inferSelect;
export type InsertScrapingSource = z.infer<typeof insertScrapingSourceSchema>;

export type ScrapingLog = typeof scrapingLogs.$inferSelect;
export type InsertScrapingLog = z.infer<typeof insertScrapingLogSchema>;

export type KazaConnectLog = typeof kazaConnectLogs.$inferSelect;
export type InsertKazaConnectLog = z.infer<typeof insertKazaConnectLogSchema>;
