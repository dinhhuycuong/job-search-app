import { ClaudeService } from '../claude/service'
import { LinkedInJobPosting } from '../linkedin/types'
import { MatchResult } from './types'
import { cacheService } from './CacheService'

export class ResumeService {
  private claudeService: ClaudeService;
  private readonly BATCH_SIZE = 2; // Reduced to 2 jobs at a time
  private readonly DELAY_BETWEEN_BATCHES = 3000; // Increased to 3 seconds

  constructor() {
    this.claudeService = new ClaudeService();
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async processBatch(
    jobs: LinkedInJobPosting[],
    resumeText: string
  ): Promise<JobMatch[]> {
    const matches = await Promise.allSettled(
      jobs.map(async (job, index) => {
        // Add delay between individual job analyses
        if (index > 0) await this.sleep(1500);
        return this.claudeService.analyzeJobMatch(job, resumeText);
      })
    );

    return matches
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to analyze job ${jobs[index].id}:`, result.reason);
          return {
            jobId: jobs[index].id,
            score: 50,
            matchDetails: {
              skillsMatch: 50,
              experienceMatch: 50,
              educationMatch: 50,
              roleMatch: 50
            }
          };
        }
      });
  }

  async analyzeJobMatches(
    jobs: LinkedInJobPosting[],
    resumeText: string
  ): Promise<MatchResult> {
    // Take only first 5 jobs for analysis
    const jobsToAnalyze = jobs.slice(0, 5);
    console.log(`Analyzing ${jobsToAnalyze.length} jobs`);

    const allMatches: JobMatch[] = [];
    
    for (let i = 0; i < jobsToAnalyze.length; i += this.BATCH_SIZE) {
      const batch = jobsToAnalyze.slice(i, i + this.BATCH_SIZE);
      const batchMatches = await this.processBatch(batch, resumeText);
      allMatches.push(...batchMatches);
      
      if (i + this.BATCH_SIZE < jobsToAnalyze.length) {
        await this.sleep(this.DELAY_BETWEEN_BATCHES);
      }
    }

    return { jobMatches: allMatches };
  }
}

export const resumeService = new ResumeService();