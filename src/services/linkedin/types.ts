export interface LinkedInSearchParams {
  keywords: string;
  location: string;
  distance: string;
  f_TPR?: string;
  start?: number;
}

export interface LinkedInJobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  postedDate: string;
  salary?: string;
  description: string;
  experienceLevel?: string;
  employmentType?: string;
  workplaceType?: string;
  applicationUrl: string;
}
