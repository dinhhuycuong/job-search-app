import { LinkedInJobPosting } from '../linkedin/types'
import { JobMatch } from '@/types'

export interface SearchCriteria {
  keywords: string
  location: string
  distance: string
  timePosted?: string
  salaryRange?: {
    min: number
    max: number
  }
  seniorityRange?: {
    min: string
    max: string
  }
  includedCompanies?: string[]
  excludedCompanies?: string[]
  excludeAgencies?: boolean
}

export interface SearchResult {
  jobs: LinkedInJobPosting[]
  totalFound: number
  cached?: boolean
}

export interface MatchResult {
  jobMatches: JobMatch[]
  cached?: boolean
}
