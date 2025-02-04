export const LINKEDIN_SEARCH_URL = 'https://www.linkedin.com/jobs/search';

export const RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 5,
  DELAY_BETWEEN_REQUESTS: 12000,
  MAX_PAGES_PER_SEARCH: 8,
};

export const TIME_FILTERS = {
  PAST_24_HOURS: 'r86400',
  PAST_WEEK: 'r604800',
  PAST_MONTH: 'r2592000',
};

export const ERROR_MESSAGES = {
  RATE_LIMIT: 'Rate limit exceeded. Please wait before trying again.',
  INVALID_PARAMS: 'Invalid search parameters provided.',
  NETWORK_ERROR: 'Network error occurred while fetching jobs.',
};
