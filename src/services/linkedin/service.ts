'use client';

import { LinkedInSearchParams, LinkedInJobPosting } from './types';
import { RATE_LIMIT } from './constants';

export class LinkedInJobsService {
  private lastRequestTime: number = 0;
  private currentPage: number = 1;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  private async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT.DELAY_BETWEEN_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.DELAY_BETWEEN_REQUESTS - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(params: LinkedInSearchParams, page: number): Promise<LinkedInJobPosting[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch('/api/linkedin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...params, page })
        });

        if (response.status === 429) {
          const retryAfter = Number(response.headers.get('Retry-After')) || 60;
          await this.sleep(retryAfter * 1000);
          continue;
        }

        if (!response.ok) {
          throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.jobs || [];

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Attempt ${attempt} failed:`, lastError);

        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt);
          continue;
        }
      }
    }

    throw lastError || new Error('Failed to fetch jobs after multiple attempts');
  }

  private filterJobs(jobs: LinkedInJobPosting[], params: LinkedInSearchParams): LinkedInJobPosting[] {
    return jobs.filter(job => {
      // Apply included companies filter
      if (params.includedCompanies?.length > 0) {
        const companies = params.includedCompanies.toLowerCase().split('\n');
        if (!companies.some(company => job.company.toLowerCase().includes(company.trim()))) {
          return false;
        }
      }

      // Apply excluded companies filter
      if (params.excludedCompanies?.length > 0) {
        const companies = params.excludedCompanies.toLowerCase().split('\n');
        if (companies.some(company => job.company.toLowerCase().includes(company.trim()))) {
          return false;
        }
      }

      // Apply agency filter
      if (params.excludeAgencies) {
        const agencyKeywords = ['staffing', 'recruiting', 'talent', 'consultants', 'recruitment'];
        if (agencyKeywords.some(keyword => job.company.toLowerCase().includes(keyword))) {
          return false;
        }
      }

      return true;
    });
  }

  public async searchJobs(params: LinkedInSearchParams): Promise<LinkedInJobPosting[]> {
    try {
      await this.waitForRateLimit();
      const jobs = await this.fetchWithRetry(params, 1);
      return this.filterJobs(jobs, params);
    } catch (error) {
      console.error('LinkedIn search error:', error);
      throw error;
    }
  }

  public async searchJobsWithPagination(params: LinkedInSearchParams): Promise<LinkedInJobPosting[]> {
    const allJobs: LinkedInJobPosting[] = [];
    const maxPages = 3; // Limit to 3 pages for now
    
    try {
      for (let page = 1; page <= maxPages; page++) {
        await this.waitForRateLimit();
        const jobs = await this.fetchWithRetry(params, page);
        
        if (!jobs.length) {
          break;
        }
        
        allJobs.push(...jobs);
        
        // Stop if we have enough jobs
        if (allJobs.length >= 20) {
          break;
        }
      }
      
      return this.filterJobs(allJobs.slice(0, 20), params);
    } catch (error) {
      console.error('LinkedIn pagination error:', error);
      throw new Error('Failed to fetch jobs: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

export const linkedInService = new LinkedInJobsService();