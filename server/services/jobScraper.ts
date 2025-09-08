import { spawn } from "child_process";
import path from "path";
import { storage } from "../storage";
import { InsertJob } from "@shared/schema";

class JobScraperService {
  private isRunning = false;

  async runScraping(maxJobs: number = 50): Promise<void> {
    if (this.isRunning) {
      console.log("Scraping already in progress");
      return;
    }

    this.isRunning = true;
    console.log(`Starting job scraping with max ${maxJobs} jobs`);

    try {
      // Log scraping start
      await storage.createScrapingLog({
        status: "success",
        message: "Scraping started",
        jobsFound: 0
      });

      const pythonScriptPath = path.join(process.cwd(), "python", "veteran_job_scraper.py");
      
      const pythonProcess = spawn("python3", [pythonScriptPath, "--max-jobs", maxJobs.toString()], {
        stdio: ["pipe", "pipe", "pipe"]
      });

      let output = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on("close", async (code) => {
        this.isRunning = false;

        if (code === 0) {
          try {
            // Parse the JSON output from the Python script
            const scrapedJobs = JSON.parse(output);
            
            if (Array.isArray(scrapedJobs)) {
              let successCount = 0;
              
              for (const jobData of scrapedJobs) {
                try {
                  const job: InsertJob = {
                    title: jobData.title,
                    company: jobData.company,
                    location: jobData.location,
                    jobType: jobData.job_type,
                    salaryMin: jobData.salary_min,
                    salaryMax: jobData.salary_max,
                    description: jobData.description,
                    url: jobData.url,
                    source: jobData.source,
                    veteranKeywords: jobData.veteran_keywords || [],
                    expiresOn: jobData.expires_on ? new Date(jobData.expires_on) : null,
                    metadata: jobData.metadata || {}
                  };

                  await storage.createJob(job);
                  successCount++;
                } catch (error) {
                  console.error("Failed to save job:", error);
                }
              }

              await storage.createScrapingLog({
                status: "success",
                message: `Scraping completed successfully. Found ${successCount} jobs.`,
                jobsFound: successCount
              });

              console.log(`Scraping completed. Saved ${successCount} jobs.`);
            } else {
              throw new Error("Invalid output format from Python script");
            }
          } catch (error) {
            await storage.createScrapingLog({
              status: "error",
              message: `Failed to parse scraping results: ${error}`,
              jobsFound: 0,
              details: { output, error: errorOutput }
            });
            console.error("Failed to parse scraping results:", error);
          }
        } else {
          await storage.createScrapingLog({
            status: "error",
            message: `Python script failed with code ${code}`,
            jobsFound: 0,
            details: { error: errorOutput }
          });
          console.error(`Python script failed with code ${code}:`, errorOutput);
        }
      });

      pythonProcess.on("error", async (error) => {
        this.isRunning = false;
        await storage.createScrapingLog({
          status: "error",
          message: `Failed to start Python script: ${error.message}`,
          jobsFound: 0
        });
        console.error("Failed to start Python script:", error);
      });

    } catch (error) {
      this.isRunning = false;
      await storage.createScrapingLog({
        status: "error",
        message: `Scraping failed: ${error}`,
        jobsFound: 0
      });
      console.error("Scraping failed:", error);
      throw error;
    }
  }

  getStatus(): { isRunning: boolean } {
    return { isRunning: this.isRunning };
  }
}

export const jobScraperService = new JobScraperService();
