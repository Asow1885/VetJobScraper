import { Job } from "@shared/schema";
import { storage } from "../storage";

interface KazaConnectJobData {
  title: string;
  company: string;
  location: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  url: string;
  tags: string[];
  isVeteranFriendly: boolean;
  source: string;
}

interface KazaConnectResponse {
  success: boolean;
  jobId?: string;
  message?: string;
  error?: string;
}

class KazaConnectService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.KAZA_CONNECT_API_URL || process.env.KAZA_API_URL || "https://api.kazaconnect.com";
    this.apiKey = process.env.KAZA_CONNECT_API_KEY || process.env.KAZA_API_KEY || "";
  }

  private transformJobForKaza(job: Job): KazaConnectJobData {
    return {
      title: job.title,
      company: job.company,
      location: job.location || "",
      jobType: job.jobType || "full-time",
      salaryMin: job.salaryMin || undefined,
      salaryMax: job.salaryMax || undefined,
      description: job.description || "",
      url: job.url,
      tags: job.veteranKeywords || [],
      isVeteranFriendly: (job.veteranKeywords && job.veteranKeywords.length > 0) || false,
      source: job.source
    };
  }

  async postJob(job: Job): Promise<KazaConnectResponse> {
    try {
      if (!this.apiKey) {
        throw new Error("KazaConnect API key not configured");
      }

      const jobData = this.transformJobForKaza(job);

      const response = await fetch(`${this.apiUrl}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "X-API-Source": "veteran-job-scraper"
        },
        body: JSON.stringify(jobData)
      });

      const result = await response.json();

      if (response.ok) {
        // Update job status
        await storage.updateJob(job.id, {
          postedToKaza: true,
          status: "posted",
          kazaPostId: result.jobId
        });

        // Log success
        await storage.createKazaConnectLog({
          jobId: job.id,
          action: "post",
          status: "success",
          response: result
        });

        return {
          success: true,
          jobId: result.jobId,
          message: "Job posted successfully"
        };
      } else {
        // Log error
        await storage.createKazaConnectLog({
          jobId: job.id,
          action: "post",
          status: "error",
          response: result
        });

        // Update job status
        await storage.updateJob(job.id, {
          status: "failed"
        });

        return {
          success: false,
          error: result.message || "Failed to post job"
        };
      }
    } catch (error) {
      // Log error
      await storage.createKazaConnectLog({
        jobId: job.id,
        action: "post",
        status: "error",
        response: { error: error instanceof Error ? error.message : String(error) }
      });

      // Update job status
      await storage.updateJob(job.id, {
        status: "failed"
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  async bulkPostJobs(jobIds: string[]): Promise<{
    success: number;
    failed: number;
    results: KazaConnectResponse[];
  }> {
    const results: KazaConnectResponse[] = [];
    let success = 0;
    let failed = 0;

    for (const jobId of jobIds) {
      const job = await storage.getJob(jobId);
      if (!job) {
        results.push({
          success: false,
          error: `Job ${jobId} not found`
        });
        failed++;
        continue;
      }

      if (job.postedToKaza) {
        results.push({
          success: true,
          message: "Job already posted"
        });
        success++;
        continue;
      }

      const result = await this.postJob(job);
      results.push(result);

      if (result.success) {
        success++;
      } else {
        failed++;
      }

      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { success, failed, results };
  }

  async updateJob(job: Job): Promise<KazaConnectResponse> {
    try {
      if (!this.apiKey || !job.kazaPostId) {
        throw new Error("KazaConnect API key not configured or job not posted yet");
      }

      const jobData = this.transformJobForKaza(job);

      const response = await fetch(`${this.apiUrl}/api/jobs/${job.kazaPostId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "X-API-Source": "veteran-job-scraper"
        },
        body: JSON.stringify(jobData)
      });

      const result = await response.json();

      // Log result
      await storage.createKazaConnectLog({
        jobId: job.id,
        action: "update",
        status: response.ok ? "success" : "error",
        response: result
      });

      return {
        success: response.ok,
        ...(response.ok ? { message: "Job updated successfully" } : { error: result.message })
      };
    } catch (error) {
      await storage.createKazaConnectLog({
        jobId: job.id,
        action: "update",
        status: "error",
        response: { error: error instanceof Error ? error.message : String(error) }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  getConnectionStatus(): { connected: boolean; apiUrl: string; hasApiKey: boolean } {
    return {
      connected: !!this.apiKey,
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey
    };
  }
}

export const kazaConnectService = new KazaConnectService();
