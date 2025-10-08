import { Job, User, InsertJobRecommendation } from "@shared/schema";

interface MatchingCriteria {
  skills: string[];
  locations: string[];
  jobTypes: string[];
  minSalary?: number;
  clearanceLevel?: string;
  militaryBranch?: string;
  veteranPreference: boolean;
}

interface MatchResult {
  matchScore: number;
  matchReasons: string[];
  skillMatches: string[];
  locationMatch: boolean;
  salaryMatch: boolean;
  veteranMatch: boolean;
  matchDetails: any;
}

export class JobMatchingService {
  private static readonly WEIGHTS = {
    SKILLS: 35,
    VETERAN_KEYWORDS: 25,
    LOCATION: 15,
    SALARY: 15,
    JOB_TYPE: 10,
  };

  static calculateMatch(job: Job, user: User): MatchResult {
    const criteria: MatchingCriteria = {
      skills: user.skills || [],
      locations: user.desiredLocations || [],
      jobTypes: user.desiredJobTypes || [],
      minSalary: user.minSalary || undefined,
      clearanceLevel: user.clearanceLevel || undefined,
      militaryBranch: user.militaryBranch || undefined,
      veteranPreference: true,
    };

    let totalScore = 0;
    const matchReasons: string[] = [];
    const skillMatches: string[] = [];
    let locationMatch = false;
    let salaryMatch = false;
    let veteranMatch = false;

    // 1. Skills matching (35%)
    const skillScore = this.calculateSkillScore(job, criteria.skills, skillMatches);
    totalScore += (skillScore / 100) * this.WEIGHTS.SKILLS;
    if (skillScore > 0) {
      matchReasons.push(`${skillMatches.length} matching skills found`);
    }

    // 2. Veteran keywords matching (25%)
    const veteranScore = this.calculateVeteranScore(job, user);
    totalScore += (veteranScore / 100) * this.WEIGHTS.VETERAN_KEYWORDS;
    if (veteranScore > 60) {
      veteranMatch = true;
      matchReasons.push("Strong veteran-friendly indicators");
    }

    // 3. Location matching (15%)
    const locationScore = this.calculateLocationScore(job, criteria.locations);
    totalScore += (locationScore / 100) * this.WEIGHTS.LOCATION;
    if (locationScore > 50) {
      locationMatch = true;
      matchReasons.push("Location matches your preferences");
    }

    // 4. Salary matching (15%)
    const salaryScore = this.calculateSalaryScore(job, criteria.minSalary);
    totalScore += (salaryScore / 100) * this.WEIGHTS.SALARY;
    if (salaryScore > 50) {
      salaryMatch = true;
      matchReasons.push("Salary meets your requirements");
    }

    // 5. Job type matching (10%)
    const jobTypeScore = this.calculateJobTypeScore(job, criteria.jobTypes);
    totalScore += (jobTypeScore / 100) * this.WEIGHTS.JOB_TYPE;
    if (jobTypeScore > 50) {
      matchReasons.push("Job type matches your preferences");
    }

    // Bonus points for clearance level match
    if (criteria.clearanceLevel && this.hasClearanceMatch(job, criteria.clearanceLevel)) {
      totalScore = Math.min(100, totalScore + 10);
      matchReasons.push("Security clearance requirement matches");
    }

    return {
      matchScore: Math.round(totalScore),
      matchReasons,
      skillMatches,
      locationMatch,
      salaryMatch,
      veteranMatch,
      matchDetails: {
        skillScore,
        veteranScore,
        locationScore,
        salaryScore,
        jobTypeScore,
        breakdown: {
          skills: `${Math.round((skillScore / 100) * this.WEIGHTS.SKILLS)}/${this.WEIGHTS.SKILLS}`,
          veteran: `${Math.round((veteranScore / 100) * this.WEIGHTS.VETERAN_KEYWORDS)}/${this.WEIGHTS.VETERAN_KEYWORDS}`,
          location: `${Math.round((locationScore / 100) * this.WEIGHTS.LOCATION)}/${this.WEIGHTS.LOCATION}`,
          salary: `${Math.round((salaryScore / 100) * this.WEIGHTS.SALARY)}/${this.WEIGHTS.SALARY}`,
          jobType: `${Math.round((jobTypeScore / 100) * this.WEIGHTS.JOB_TYPE)}/${this.WEIGHTS.JOB_TYPE}`,
        },
      },
    };
  }

  private static calculateSkillScore(job: Job, userSkills: string[], skillMatches: string[]): number {
    if (userSkills.length === 0) return 0;

    const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim());

    for (const skill of normalizedUserSkills) {
      if (jobText.includes(skill)) {
        skillMatches.push(skill);
      }
    }

    // Score based on percentage of skills matched
    const matchPercentage = (skillMatches.length / normalizedUserSkills.length) * 100;
    
    // Bonus for multiple matches
    if (skillMatches.length >= 3) {
      return Math.min(100, matchPercentage + 20);
    }
    
    return Math.min(100, matchPercentage);
  }

  private static calculateVeteranScore(job: Job, user: User): number {
    const veteranKeywords = job.veteranKeywords || [];
    const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
    
    let score = 0;

    // Check veteran keywords from job
    if (veteranKeywords.length > 0) {
      score += 40; // Base score for having veteran keywords
      
      // Extra points for specific keywords
      if (veteranKeywords.some(k => k.toLowerCase().includes('veteran'))) {
        score += 20;
      }
      if (veteranKeywords.some(k => k.toLowerCase().includes('military'))) {
        score += 15;
      }
      if (veteranKeywords.some(k => k.toLowerCase().includes('clearance'))) {
        score += 15;
      }
    }

    // Check military branch alignment
    if (user.militaryBranch && jobText.includes(user.militaryBranch.toLowerCase())) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private static calculateLocationScore(job: Job, desiredLocations: string[]): number {
    if (desiredLocations.length === 0) return 50; // Neutral score if no preference
    if (!job.location) return 30; // Lower score if location not specified

    const jobLocation = job.location.toLowerCase();
    
    // Check for remote/hybrid opportunities
    if (jobLocation.includes('remote') || jobLocation.includes('hybrid')) {
      return 90;
    }

    // Check for location matches
    for (const location of desiredLocations) {
      const normalizedLocation = location.toLowerCase().trim();
      if (jobLocation.includes(normalizedLocation) || normalizedLocation.includes(jobLocation)) {
        return 100;
      }
    }

    return 20; // Low score for non-matching location
  }

  private static calculateSalaryScore(job: Job, minSalary?: number): number {
    if (!minSalary) return 50; // Neutral if no salary preference
    if (!job.salaryMin && !job.salaryMax) return 50; // Neutral if salary not specified

    const jobMinSalary = job.salaryMin || job.salaryMax || 0;
    
    if (jobMinSalary >= minSalary) {
      // Calculate how much it exceeds the minimum
      const excess = jobMinSalary - minSalary;
      const percentageIncrease = (excess / minSalary) * 100;
      
      return Math.min(100, 70 + Math.min(30, percentageIncrease / 2));
    }

    // Below minimum - calculate how close it is
    const shortfall = minSalary - jobMinSalary;
    const percentageShortfall = (shortfall / minSalary) * 100;
    
    return Math.max(0, 50 - percentageShortfall);
  }

  private static calculateJobTypeScore(job: Job, desiredJobTypes: string[]): number {
    if (desiredJobTypes.length === 0) return 50; // Neutral if no preference
    if (!job.jobType) return 40;

    const jobType = job.jobType.toLowerCase();
    
    for (const type of desiredJobTypes) {
      if (jobType.includes(type.toLowerCase()) || type.toLowerCase().includes(jobType)) {
        return 100;
      }
    }

    return 25;
  }

  private static hasClearanceMatch(job: Job, userClearanceLevel: string): boolean {
    const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
    const clearanceLevels = ['secret', 'top secret', 'ts/sci', 'confidential', 'clearance'];
    
    if (!clearanceLevels.some(level => jobText.includes(level))) {
      return false; // Job doesn't require clearance
    }

    // If job requires clearance and user has it, it's a match
    return !!(userClearanceLevel && userClearanceLevel.length > 0);
  }

  static generateRecommendation(job: Job, user: User): InsertJobRecommendation | null {
    const matchResult = this.calculateMatch(job, user);
    
    // Only recommend jobs with score >= 40
    if (matchResult.matchScore < 40) {
      return null;
    }

    return {
      userId: user.id,
      jobId: job.id,
      matchScore: matchResult.matchScore,
      matchReasons: matchResult.matchReasons,
      skillMatches: matchResult.skillMatches,
      locationMatch: matchResult.locationMatch,
      salaryMatch: matchResult.salaryMatch,
      veteranMatch: matchResult.veteranMatch,
      matchDetails: matchResult.matchDetails,
      dismissed: false,
    };
  }

  static async generateRecommendationsForUser(
    user: User,
    jobs: Job[],
    limit: number = 20
  ): Promise<InsertJobRecommendation[]> {
    const recommendations: InsertJobRecommendation[] = [];

    for (const job of jobs) {
      const recommendation = this.generateRecommendation(job, user);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Sort by match score descending and take top N
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }
}