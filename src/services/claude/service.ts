'use client';

import { JobMatch } from '@/types';
import { LinkedInJobPosting } from '../linkedin/types';

class ClaudeService {
  private retryCount = 2;
  private retryDelay = 2000;

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async analyzeJobMatch(
    job: LinkedInJobPosting,
    resumeText: string
  ): Promise<JobMatch> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await fetch('/api/claude', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobDetails: {
              title: job.title,
              company: job.company,
              description: job.description
            },
            resumeText
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // The response should now be the direct JSON analysis
        return {
          jobId: job.id,
          score: data.score,
          matchDetails: data.matchDetails
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Attempt ${attempt} failed:`, lastError);

        if (attempt < this.retryCount) {
          await this.sleep(this.retryDelay * attempt);
          continue;
        }
      }
    }

    // If all retries failed, return a default score
    console.warn(`All attempts failed for job ${job.id}, using default score`);
    return {
      jobId: job.id,
      score: 50,
      matchDetails: {
        skillsMatch: 50,
        experienceMatch: 50,
        educationMatch: 50,
        roleMatch: 50
      }
    };
  }
}

const claudeService = new ClaudeService();
export { claudeService, ClaudeService };