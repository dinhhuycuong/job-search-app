export interface JobSearchCriteria {
  jobTitle: string;
  postedDate: 'last24h' | 'lastWeek' | 'lastMonth' | 'anytime';
  location: {
    city: string;
    state: string;
  };
  maxDistance: number;
  salaryRange: {
    min: number;
    max: number;
  };
  seniorityRange: {
    min: string;
    max: string;
  };
  includedCompanies: string;
  excludedCompanies: string;
  excludeAgencies: boolean;
  resume: File | null;
}

export interface JobMatch {
  jobId: string;
  score: number;
  matchDetails: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    roleMatch: number;
  };
}
