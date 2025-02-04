import { LinkedInJobsService } from '../linkedin/service'
import { SearchCriteria, SearchResult } from './types'
import { cacheService } from './CacheService'

export class JobSearchService {
  private linkedInService: LinkedInJobsService

  constructor() {
    this.linkedInService = new LinkedInJobsService()
  }

  async searchJobs(criteria: SearchCriteria): Promise<SearchResult> {
    // Check cache first
    const cached = cacheService.get<SearchResult>('jobs', criteria)
    if (cached) {
      return { ...cached, cached: true }
    }

    // Perform search
    const jobs = await this.linkedInService.searchJobsWithPagination({
      keywords: criteria.keywords,
      location: criteria.location,
      distance: criteria.distance,
      f_TPR: criteria.timePosted
    })

    // Filter results based on additional criteria
    const filteredJobs = jobs.filter(job => {
      // Apply company filters
      if (criteria.includedCompanies?.length && 
          !criteria.includedCompanies.includes(job.company)) {
        return false
      }
      if (criteria.excludedCompanies?.length && 
          criteria.excludedCompanies.includes(job.company)) {
        return false
      }
      return true
    })

    const result = {
      jobs: filteredJobs,
      totalFound: filteredJobs.length
    }

    // Cache results
    cacheService.set('jobs', criteria, result)

    return result
  }
}

export const jobSearchService = new JobSearchService()
