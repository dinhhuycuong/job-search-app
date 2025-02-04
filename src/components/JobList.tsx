'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LinkedInJobPosting } from '@/services/linkedin/types';
import type { JobMatch } from '@/types';
import { CalendarDays, MapPin, Building, BarChart, Briefcase } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MatchedJob extends LinkedInJobPosting {
  match?: JobMatch;
}

interface JobListProps {
  jobs: MatchedJob[];
  isLoading: boolean;
}

export default function JobList({ jobs, isLoading }: JobListProps) {
  console.log('JobList received:', jobs);

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold text-primary">Searching for jobs...</h2>
        <div className="flex items-center space-x-4">
          <Progress value={33} className="w-2/3" />
          <span className="text-sm text-muted-foreground">Please wait</span>
        </div>
      </div>
    );
  }

  if (!jobs?.length) {
    return (
      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold text-primary">No jobs found</h2>
      </div>
    );
  }

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-2xl font-bold text-primary">Search Results ({jobs.length})</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-primary line-clamp-2">
                    {job.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4 flex-shrink-0" />
                    <span>{job.postedDate}</span>
                  </div>
                </div>
                {job.match && (
                  <div className="mb-4 bg-muted p-3 rounded-md">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-primary">
                      <BarChart className="w-4 h-4" />
                      Match Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {Object.entries(job.match.matchDetails).map(([type, value]) => (
                        <div key={`${job.id}-${type}`} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="capitalize">{type.replace('Match', '')}:</span>
                            <span className="font-medium">{value}%</span>
                          </div>
                          <Progress value={value} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {job.match && (
                <div className="mb-4 bg-muted p-3 rounded-md">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-primary">
                    <BarChart className="w-4 h-4" />
                    Match Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(job.match.matchDetails).map(([key, value]) => (
                      <div key={`match-detail-${job.id}-${key}`} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="capitalize">{key}:</span>
                          <span className="font-medium">{value}%</span>
                        </div>
                        <Progress value={value} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm text-muted-foreground line-clamp-3">{job.description}</div>
              <div className="mt-4 flex justify-end">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  Apply
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
