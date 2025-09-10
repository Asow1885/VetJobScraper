import json
import sys
import os
from datetime import datetime, timedelta
import argparse

# Add the parent directory to the path to import from attached_assets
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'attached_assets'))

try:
    import sys
    import os
    # Add the .pythonlibs to the path
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, os.path.join(project_root, ".pythonlibs", "lib", "python3.11", "site-packages"))
    
    from jobspy import scrape_jobs
    JOBSPY_AVAILABLE = True
except ImportError as e:
    print(f"JobSpy import error: {e}", file=sys.stderr)
    # Return empty array if JobSpy not available instead of exiting
    JOBSPY_AVAILABLE = False

class JobScraper:
    def __init__(self):
        # Veteran-friendly indicator keywords (used to flag jobs, not filter)
        self.veteran_keywords = [
            "veteran", "military", "clearance", "security clearance",
            "veteran friendly", "military experience", "veteran preferred",
            "former military", "ex-military", "military background",
            "veteran hiring", "military transition", "veteran owned"
        ]
        
        # Comprehensive job search terms for broader international coverage
        self.search_terms = [
            # Technology roles
            "software engineer", "full stack developer", "frontend developer", 
            "backend developer", "devops engineer", "data scientist", "data analyst",
            "machine learning engineer", "cloud engineer", "cybersecurity specialist",
            "mobile developer", "web developer", "QA engineer", "ui ux designer",
            
            # Business roles  
            "project manager", "product manager", "business analyst", "scrum master",
            "marketing manager", "digital marketing", "sales representative", "account manager",
            "operations manager", "hr specialist", "finance analyst", "consultant",
            
            # Healthcare & Education
            "nurse", "healthcare assistant", "teacher", "education coordinator",
            "medical technician", "therapist",
            
            # Customer service & Support
            "customer service", "technical support", "help desk", "call center",
            
            # Trade & Manufacturing
            "maintenance technician", "warehouse worker", "logistics coordinator",
            "manufacturing supervisor", "quality control",
            
            # Remote-first opportunities
            "remote", "work from home", "virtual assistant", "online tutor"
        ]
        
        # Comprehensive international locations for broader coverage
        self.locations = [
            # English-speaking markets
            "United States", "Canada", "United Kingdom", "Australia", "New Zealand", "Ireland",
            
            # Major European markets
            "Germany", "France", "Netherlands", "Sweden", "Norway", "Denmark", "Switzerland",
            "Austria", "Belgium", "Finland", "Spain", "Italy", "Portugal",
            
            # Asia-Pacific regions
            "Singapore", "Hong Kong", "Japan", "South Korea", 
            
            # Emerging markets
            "India", "Israel", "United Arab Emirates",
            
            # Remote/flexible work
            "Remote", "Worldwide Remote", "Europe Remote", "Americas Remote"
        ]
        
        # Optimized scraping configuration
        self.scraping_config = {
            "max_sites_per_search": 2,  # LinkedIn + Indeed (most reliable)
            "max_search_terms": 4,      # Limit search terms to avoid rate limits
            "max_locations": 3,         # Limit locations per run
            "jobs_per_combination": 2,  # Small batches to avoid blocks
            "hours_old_limit": 168,     # 1 week for better results
            "retry_attempts": 2,        # Retry failed requests
            "delay_between_requests": 1 # Second delay between requests
        }
    
    def has_veteran_keywords(self, text):
        """Check if job description contains veteran-related keywords"""
        if not text or not isinstance(text, str):
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
        
        # Import here to avoid unbound variable warning
        from jobspy import scrape_jobs
        
        all_jobs = []
        
        # Optimized scraping with configurable parameters
        config = self.scraping_config
        search_terms_to_use = self.search_terms[:config["max_search_terms"]]
        locations_to_use = self.locations[:config["max_locations"]]
        
        print(f"Scraping {len(search_terms_to_use)} search terms across {len(locations_to_use)} locations")
        
        import time
        for i, search_term in enumerate(search_terms_to_use):
            for j, location in enumerate(locations_to_use):
                # Add delay between requests to be respectful
                if i > 0 or j > 0:
                    time.sleep(config["delay_between_requests"])
                for attempt in range(config["retry_attempts"]):
                    try:
                        # JobSpy country parameter mapping (based on supported values)
                        country_mapping = {
                            "United States": "usa", "Canada": "canada", "United Kingdom": "uk",
                            "Germany": "germany", "France": "france", "Australia": "australia", 
                            "Netherlands": "netherlands", "Spain": "spain", "Italy": "italy",
                            "Norway": "norway", "Sweden": "sweden", "Denmark": "denmark",
                            "Switzerland": "switzerland", "Austria": "austria", "Belgium": "belgium",
                            "Finland": "finland", "Portugal": "portugal", "Ireland": "ireland",
                            "New Zealand": "new zealand", "Singapore": "singapore", 
                            "Hong Kong": "hong kong", "Japan": "japan", "South Korea": "south korea",
                            "India": "india", "Israel": "israel", "United Arab Emirates": "united arab emirates"
                        }
                        country_param = country_mapping.get(location, "usa")
                        
                        print(f"Scraping '{search_term}' in '{location}' (attempt {attempt + 1})")
                        
                        # Scrape jobs with optimized parameters
                        jobs = scrape_jobs(
                            site_name=["linkedin", "indeed"][:config["max_sites_per_search"]],
                            search_term=search_term,
                            location=location,
                            results_wanted=config["jobs_per_combination"],
                            hours_old=config["hours_old_limit"],
                            country_indeed=country_param
                        )
                    
                        if jobs is not None and len(jobs) > 0:
                            # Convert to list of dictionaries
                            job_list = jobs.to_dict('records')
                            all_jobs.extend(job_list)
                            print(f"Successfully scraped {len(job_list)} jobs")
                            break  # Success, no need to retry
                        else:
                            print(f"No jobs found for '{search_term}' in '{location}'")
                            break  # No retry needed for empty results
                        
                    except Exception as e:
                        print(f"Error scraping '{search_term}' in '{location}' (attempt {attempt + 1}): {str(e)}", file=sys.stderr)
                        if attempt == config["retry_attempts"] - 1:
                            print(f"Max retries reached for '{search_term}' in '{location}'", file=sys.stderr)
                        else:
                            time.sleep(2)  # Wait before retry
        
        return all_jobs
    
    def process_jobs(self, raw_jobs):
        """Process all jobs and add veteran-friendly indicator"""
        processed_jobs = []
        
        for job in raw_jobs:
            # Check if job has veteran-friendly keywords (for indicator, not filtering)
            title_keywords = self.has_veteran_keywords(job.get('title', ''))
            desc_keywords = self.has_veteran_keywords(job.get('description', ''))
            
            # Combine all found keywords
            all_keywords = list(set(title_keywords + desc_keywords))
            is_veteran_friendly = len(all_keywords) > 0
            
            # Process ALL jobs, not just veteran ones
            # Handle potential non-string values
            description = job.get('description', '')
            if not isinstance(description, str):
                description = str(description) if description is not None else ''
            
            processed_job = {
                'title': str(job.get('title', 'Unknown')),
                'company': str(job.get('company', 'Unknown')),
                'location': str(job.get('location', 'Unknown')),
                'job_type': str(job.get('job_type', 'full-time')),
                'salary_min': job.get('min_amount') if str(job.get('min_amount')).lower() != 'nan' else None,
                'salary_max': job.get('max_amount') if str(job.get('max_amount')).lower() != 'nan' else None,
                'description': description[:1000],  # Limit description length
                'url': str(job.get('job_url_direct', job.get('job_url', ''))),
                'source': str(job.get('site', 'unknown')),
                'veteran_keywords': all_keywords,  # Empty if no veteran keywords
                'is_veteran_friendly': is_veteran_friendly,  # Boolean indicator
                'scraped_date': datetime.now().isoformat(),
                'expires_on': (datetime.now() + timedelta(days=30)).isoformat(),
                'metadata': {
                    'date_posted': str(job.get('date_posted')) if job.get('date_posted') else None,
                    'compensation': str(job.get('compensation')) if job.get('compensation') else None,
                    'benefits': str(job.get('benefits')) if job.get('benefits') else None,
                    'veteran_friendly': is_veteran_friendly
                }
            }
            processed_jobs.append(processed_job)
        
        return processed_jobs
    
    def run_scraping(self, max_jobs=50):
        """Run the complete scraping process and return JSON"""
        if not JOBSPY_AVAILABLE:
            # Return empty array if JobSpy not available
            return []
        
        # 1. Scrape new jobs
        raw_jobs = self.scrape_jobs_jobspy(max_jobs)
        
        if not raw_jobs:
            return []
        
        # 2. Process all jobs and add veteran indicator
        processed_jobs = self.process_jobs(raw_jobs)
        
        return processed_jobs

def main():
    parser = argparse.ArgumentParser(description='International Job Scraper with Veteran Indicator')
    parser.add_argument('--max-jobs', type=int, default=50, help='Maximum number of jobs to scrape')
    
    args = parser.parse_args()
    
    scraper = JobScraper()
    jobs = scraper.run_scraping(args.max_jobs)
    
    # Output JSON to stdout for Node.js to consume
    print(json.dumps(jobs, indent=2))

if __name__ == "__main__":
    main()
