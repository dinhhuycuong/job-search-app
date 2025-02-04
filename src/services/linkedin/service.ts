'use client';

import { LinkedInSearchParams, LinkedInJobPosting } from './types';
import { RATE_LIMIT } from './constants';

export class LinkedInJobsService {
  private lastRequestTime: number = 0;

  private async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT.DELAY_BETWEEN_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.DELAY_BETWEEN_REQUESTS - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  private async fetchJobs(params: LinkedInSearchParams): Promise<LinkedInJobPosting[]> {
    const response = await fetch('/api/linkedin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (response.status === 429) {
      const data = await response.json();
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
    }

    if (!response.ok) {
      throw new Error('Failed to fetch LinkedIn jobs');
    }

    const data = await response.json();
    return data.jobs;
  }

  public async searchJobs(params: LinkedInSearchParams): Promise<LinkedInJobPosting[]> {
    try {
      await this.waitForRateLimit();
      return this.fetchJobs(params);
    } catch (error) {
      console.error('LinkedIn search error:', error);
      throw error;
    }
  }

  public async searchJobsWithPagination(params: LinkedInSearchParams): Promise<LinkedInJobPosting[]> {
    return this.searchJobs(params);
  }
}

export const linkedInService = new LinkedInJobsService();