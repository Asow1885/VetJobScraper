import json
import sys
import os
from datetime import datetime, timedelta
import argparse

# Add the parent directory to the path to import from attached_assets
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'attached_assets'))

try:
    from jobspy import scrape_jobs
    JOBSPY_AVAILABLE = True
except ImportError:
    print("JobSpy not installed. Install with: pip install python-jobspy", file=sys.stderr)
    JOBSPY_AVAILABLE = False
    sys.exit(1)

class VeteranJobScraper:
    def __init__(self):
        # Veteran-specific keywords
        self.veteran_keywords = [
            "veteran", "military", "clearance", "security clearance",
            "veteran friendly", "military experience", "veteran preferred",
            "former military", "ex-military", "military background",
            "veteran hiring", "military transition", "veteran owned"
        ]
        
        # Job search terms
        self.search_terms = [
            "veteran preferred",
            "military experience", 
            "security clearance",
            "veteran friendly"
        ]
    
    def has_veteran_keywords(self, text):
        """Check if job description contains veteran-related keywords"""
        if not text:
            return []
        
        text_lower = text.lower()
        found_keywords = []
        
        for keyword in self.veteran_keywords:
            if keyword.lower() in text_lower:
                found_keywords.append(keyword)
        
        return found_keywords
    
    def scrape_jobs_jobspy(self, max_jobs=50):
        """Scrape jobs using JobSpy library"""
        if not JOBSPY_AVAILABLE:
            return []
        
        all_jobs = []
        
        # Scrape from multiple search terms
        for search_term in self.search_terms:
            try:
                # Scrape jobs (JobSpy is free!)
                jobs = scrape_jobs(
                    site_name=["linkedin", "indeed", "glassdoor"],  # Free sites
                    search_term=search_term,
                    location="United States",
                    results_wanted=max_jobs // len(self.search_terms),  # Distribute across search terms
                    hours_old=24,  # Only jobs from last 24 hours
                    country_indeed='USA'
                )
                
                if jobs is not None and len(jobs) > 0:
                    # Convert to list of dictionaries
                    job_list = jobs.to_dict('records')
                    all_jobs.extend(job_list)
                
            except Exception as e:
                print(f"Error scraping '{search_term}': {str(e)}", file=sys.stderr)
                continue
        
        return all_jobs
    
    def process_jobs(self, raw_jobs):
        """Filter and process jobs for veteran relevance"""
        veteran_jobs = []
        
        for job in raw_jobs:
            # Check if job is veteran-related
            title_keywords = self.has_veteran_keywords(job.get('title', ''))
            desc_keywords = self.has_veteran_keywords(job.get('description', ''))
            
            # Combine all found keywords
            all_keywords = list(set(title_keywords + desc_keywords))
            
            if all_keywords:  # Only include jobs with veteran keywords
                processed_job = {
                    'title': job.get('title', 'Unknown'),
                    'company': job.get('company', 'Unknown'),
                    'location': job.get('location', 'Unknown'),
                    'job_type': job.get('job_type', 'Unknown'),
                    'salary_min': job.get('min_amount'),
                    'salary_max': job.get('max_amount'),
                    'description': job.get('description', '')[:1000] if job.get('description') else '',  # Limit description length
                    'url': job.get('job_url_direct', job.get('job_url', '')),
                    'source': job.get('site', 'unknown'),
                    'veteran_keywords': all_keywords,
                    'scraped_date': datetime.now().isoformat(),
                    'expires_on': (datetime.now() + timedelta(days=30)).isoformat(),
                    'metadata': {
                        'date_posted': job.get('date_posted'),
                        'compensation': job.get('compensation'),
                        'benefits': job.get('benefits')
                    }
                }
                veteran_jobs.append(processed_job)
        
        return veteran_jobs
    
    def run_scraping(self, max_jobs=50):
        """Run the complete scraping process and return JSON"""
        # 1. Scrape new jobs
        raw_jobs = self.scrape_jobs_jobspy(max_jobs)
        
        if not raw_jobs:
            return []
        
        # 2. Filter for veteran jobs
        veteran_jobs = self.process_jobs(raw_jobs)
        
        return veteran_jobs

def main():
    parser = argparse.ArgumentParser(description='Veteran Job Scraper')
    parser.add_argument('--max-jobs', type=int, default=50, help='Maximum number of jobs to scrape')
    
    args = parser.parse_args()
    
    scraper = VeteranJobScraper()
    jobs = scraper.run_scraping(args.max_jobs)
    
    # Output JSON to stdout for Node.js to consume
    print(json.dumps(jobs, indent=2))

if __name__ == "__main__":
    main()
