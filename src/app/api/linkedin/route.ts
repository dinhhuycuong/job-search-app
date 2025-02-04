import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { RateLimiter } from '@/utils/rateLimiter';

// Initialize rate limiter: 10 requests per minute
const rateLimiter = new RateLimiter(60000, 10);

export async function POST(request: Request) {
  // Check rate limit
  if (!rateLimiter.tryRequest()) {
    const nextAllowedTime = rateLimiter.getNextAllowedTime();
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        nextAllowedTime,
        message: 'Too many requests. Please try again later.'
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((nextAllowedTime - Date.now()) / 1000).toString()
        }
      }
    );
  }

  try {
    const params = await request.json();
    
    // Build LinkedIn search URL
    const baseUrl = 'https://www.linkedin.com/jobs/search';
    const queryParams = new URLSearchParams({
      keywords: params.keywords || '',
      location: params.location || '',
      distance: params.distance || '',
      f_TPR: params.f_TPR || '',
      start: params.start?.toString() || '0'
    });
    
    const url = `${baseUrl}?${queryParams.toString()}`;
    console.log('Fetching LinkedIn URL:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`LinkedIn request failed: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const jobs = [];

    // Parse job cards
    $('.job-search-card').each((_, element) => {
      const $el = $(element);
      const job = {
        id: $el.attr('data-entity-urn')?.split(':').pop() || `job-${_}`,
        title: $el.find('.job-search-card__title').text().trim(),
        company: $el.find('.job-search-card__company-name').text().trim(),
        location: $el.find('.job-search-card__location').text().trim(),
        postedDate: $el.find('time').text().trim(),
        description: $el.find('.job-search-card__snippet').text().trim(),
        applicationUrl: $el.find('a.job-search-card__title-link').attr('href') || '',
        experienceLevel: $el.find('.description__job-criteria-text').eq(0).text().trim(),
        employmentType: $el.find('.description__job-criteria-text').eq(1).text().trim(),
        workplaceType: $el.find('.description__job-criteria-text').eq(2).text().trim()
      };

      // Clean up and validate job data
      if (job.id && job.title && job.company) {
        jobs.push(job);
      }
    });

    console.log(`Parsed ${jobs.length} jobs`);
    return NextResponse.json({ 
      jobs,
      rateLimit: {
        remaining: 10 - rateLimiter.timestamps.length,
        reset: rateLimiter.getNextAllowedTime()
      }
    });

  } catch (error) {
    console.error('LinkedIn proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LinkedIn data' },
      { status: 500 }
    );
  }
}
