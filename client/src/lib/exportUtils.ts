import { Job } from "@shared/schema";

export function convertJobsToCSV(jobs: Job[]): string {
  if (jobs.length === 0) return "";

  // Define CSV headers
  const headers = [
    "ID",
    "Title",
    "Company",
    "Location",
    "Job Type",
    "Salary Min",
    "Salary Max",
    "Description",
    "URL",
    "Source",
    "Veteran Friendly",
    "Veteran Keywords",
    "Status",
    "Scraped Date",
    "Posted to Kaza"
  ];

  // Helper to escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined || value === 'nan' || value === 'None') return "";
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Create CSV rows
  const rows = jobs.map(job => [
    escapeCSV(job.id),
    escapeCSV(job.title),
    escapeCSV(job.company),
    escapeCSV(job.location),
    escapeCSV(job.jobType),
    escapeCSV(job.salaryMin),
    escapeCSV(job.salaryMax),
    escapeCSV(job.description?.substring(0, 200)), // Truncate description
    escapeCSV(job.url),
    escapeCSV(job.source),
    escapeCSV(job.veteranKeywords && job.veteranKeywords.length > 0 ? "Yes" : "No"),
    escapeCSV(job.veteranKeywords?.join("; ") || ""),
    escapeCSV(job.status),
    escapeCSV(job.scrapedDate ? new Date(job.scrapedDate).toLocaleDateString() : ""),
    escapeCSV(job.postedToKaza ? "Yes" : "No")
  ].join(','));

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

export function convertJobsToJSON(jobs: Job[]): string {
  return JSON.stringify(jobs, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
