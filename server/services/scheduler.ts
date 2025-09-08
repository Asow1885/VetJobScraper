import * as cron from "node-cron";
import { jobScraperService } from "./jobScraper";
import { kazaConnectService } from "./kazaConnectApi";
import { storage } from "../storage";

class SchedulerService {
  private scrapingTask: cron.ScheduledTask | null = null;
  private postingTask: cron.ScheduledTask | null = null;
  private isRunning = false;

  start(): void {
    if (this.isRunning) {
      console.log("Scheduler is already running");
      return;
    }

    // Schedule scraping every 2 hours
    this.scrapingTask = cron.schedule("0 */2 * * *", async () => {
      console.log("Running scheduled job scraping...");
      try {
        await jobScraperService.runScraping(50);
      } catch (error) {
        console.error("Scheduled scraping failed:", error);
      }
    });

    // Schedule KazaConnect posting every 30 minutes
    this.postingTask = cron.schedule("*/30 * * * *", async () => {
      console.log("Running scheduled KazaConnect posting...");
      try {
        await this.processUnpostedJobs();
      } catch (error) {
        console.error("Scheduled posting failed:", error);
      }
    });

    this.isRunning = true;
    console.log("Scheduler started successfully");
  }

  stop(): void {
    if (this.scrapingTask) {
      this.scrapingTask.stop();
      this.scrapingTask = null;
    }

    if (this.postingTask) {
      this.postingTask.stop();
      this.postingTask = null;
    }

    this.isRunning = false;
    console.log("Scheduler stopped");
  }

  private async processUnpostedJobs(): Promise<void> {
    try {
      // Get unposted jobs
      const unpostedJobs = await storage.getJobs({
        status: "pending",
        limit: 20 // Process in batches
      });

      if (unpostedJobs.length === 0) {
        console.log("No unposted jobs to process");
        return;
      }

      console.log(`Processing ${unpostedJobs.length} unposted jobs`);

      // Bulk post to KazaConnect
      const jobIds = unpostedJobs.map(job => job.id);
      const result = await kazaConnectService.bulkPostJobs(jobIds);

      console.log(`Posted ${result.success} jobs successfully, ${result.failed} failed`);

      // Log the bulk operation
      await storage.createKazaConnectLog({
        action: "bulk_post",
        status: result.failed === 0 ? "success" : "partial",
        response: {
          processed: unpostedJobs.length,
          success: result.success,
          failed: result.failed
        }
      });

    } catch (error) {
      console.error("Error processing unposted jobs:", error);
      
      await storage.createKazaConnectLog({
        action: "bulk_post",
        status: "error",
        response: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  getStatus(): {
    isRunning: boolean;
    scrapingScheduled: boolean;
    postingScheduled: boolean;
  } {
    return {
      isRunning: this.isRunning,
      scrapingScheduled: !!this.scrapingTask,
      postingScheduled: !!this.postingTask
    };
  }
}

export const schedulerService = new SchedulerService();

// Auto-start scheduler if enabled in environment
if (process.env.AUTO_START_SCHEDULER === "true") {
  schedulerService.start();
}
