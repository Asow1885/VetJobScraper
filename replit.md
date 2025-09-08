# Overview

VetJobScraper is a full-stack job scraping application specifically designed to identify and collect veteran-friendly job postings from multiple sources. The application automatically scrapes job listings from platforms like LinkedIn, Indeed, and Glassdoor, filters them for veteran-relevant keywords, and provides integration with KazaConnect for posting jobs to a veteran-focused platform. It features a modern React frontend with real-time monitoring capabilities and an Express.js backend with automated scheduling.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript and follows a component-based architecture with ShadCN UI components. The application uses Wouter for client-side routing and TanStack Query for server state management with automatic caching and background refetching. The UI implements a sidebar navigation layout with dedicated pages for dashboard monitoring, job management, source configuration, and settings. Styling is handled through Tailwind CSS with a comprehensive design system including custom CSS variables for theming.

## Backend Architecture  
The backend follows a service-oriented architecture built on Express.js with TypeScript. Core services include a job scraper service that interfaces with Python scripts, a KazaConnect API service for external job posting, and a scheduler service using node-cron for automated operations. The API provides RESTful endpoints for job management, scraping control, and system monitoring. Request/response logging is implemented with custom middleware for debugging and monitoring.

## Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema includes tables for jobs, users, scraping sources, scraping logs, and KazaConnect logs. Job data includes veteran-specific metadata like keywords and posting status. The storage layer implements an abstraction interface allowing for future database changes while maintaining consistent data operations.

## Job Scraping Implementation
Job scraping is handled through Python scripts using the JobSpy library for multi-platform scraping capabilities. The system identifies veteran-friendly jobs by scanning for specific keywords like "veteran," "military," "clearance," and "security clearance." Scraped data is processed and stored with expiration tracking and duplicate prevention. The scraper supports configurable limits and scheduling intervals.

## External Service Integrations
KazaConnect integration allows automatic posting of veteran-friendly jobs to an external veteran job platform. The system includes retry logic, error handling, and comprehensive logging of all posting attempts. Status tracking ensures jobs are only posted once and failed posts can be retried. The integration supports configurable API endpoints and authentication.

## Authentication and Scheduling
The application includes user authentication capabilities though the current implementation appears to be set up for future expansion. The scheduler service runs automated scraping every 2 hours and KazaConnect posting every 30 minutes. All scheduled operations include error handling and logging for monitoring and debugging purposes.

# External Dependencies

- **Database**: PostgreSQL with Neon serverless hosting (@neondatabase/serverless)
- **ORM**: Drizzle ORM for type-safe database operations with Zod schema validation
- **Job Scraping**: Python JobSpy library for multi-platform job data collection
- **UI Framework**: React with ShadCN UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **State Management**: TanStack React Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Scheduling**: node-cron for automated task scheduling
- **Date Handling**: date-fns for date formatting and manipulation
- **External API**: KazaConnect API for veteran job posting integration
- **Development**: Vite for build tooling and development server with Replit integration