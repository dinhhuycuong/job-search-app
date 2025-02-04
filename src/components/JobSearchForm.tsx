'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { LinkedInJobsService } from '@/services/linkedin/service';
import { ClaudeService } from '@/services/claude/service';
import { TIME_FILTERS } from '@/services/linkedin/constants';
import type { LinkedInJobPosting } from '@/services/linkedin/types';
import type { JobMatch } from '@/types';
import JobList from '@/components/JobList';
import { cn } from '@/lib/utils';

interface MatchedJob extends LinkedInJobPosting {
  match?: JobMatch;
}

export default function JobSearchForm() {
  // Form Data State
  const [formData, setFormData] = useState({
    jobTitle: '',
    postedDate: 'anytime',
    location: { city: '', state: '' },
    maxDistance: 50,
    salaryRange: { min: 50000, max: 300000 },
    seniorityRange: { min: 'Associate', max: 'Director' },
    includedCompanies: '',
    excludedCompanies: '',
    excludeAgencies: false,
    resume: null as File | null,
  });

  // Results State
  const [jobs, setJobs] = useState<MatchedJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Constants
  const seniorityLevels = [
    'Associate',
    'Sr. Associate',
    'Manager',
    'Sr. Manager',
    'Director',
    'Sr. Director',
  ];

  const salaryConfig = {
    min: 0,
    max: 300000,
    step: 5000,
    formatter: (value: number) => `$${value.toLocaleString()}`,
  };

  // Helper Functions
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Initialize services
      const linkedInService = new LinkedInJobsService();
      const claudeService = new ClaudeService();

      // Search for jobs
      const searchParams = {
        keywords: formData.jobTitle,
        location: `${formData.location.city}, ${formData.location.state}`,
        distance: formData.maxDistance.toString(),
        f_TPR:
          formData.postedDate === 'last24h'
            ? TIME_FILTERS.PAST_24_HOURS
            : formData.postedDate === 'lastWeek'
              ? TIME_FILTERS.PAST_WEEK
              : formData.postedDate === 'lastMonth'
                ? TIME_FILTERS.PAST_MONTH
                : undefined,
      };

      const jobs = await linkedInService.searchJobsWithPagination(searchParams);
      console.log('Jobs from LinkedIn:', jobs);

      // If resume is provided, analyze matches
      if (formData.resume) {
        const resumeText = await readFileAsText(formData.resume);

        const matchPromises = jobs.map((job) => claudeService.analyzeJobMatch(job, resumeText));

        const matches = await Promise.all(matchPromises);

        // Combine jobs with their match scores
        const matchedJobs = jobs.map((job) => ({
          ...job,
          match: matches.find((m) => m.jobId === job.id),
        }));

        // Sort by match score
        matchedJobs.sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0));

        setJobs(matchedJobs);
      } else {
        setJobs(jobs);

        console.log('Matches from Claude:', matches);
        console.log('Final matched jobs:', matchedJobs);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(
        error instanceof Error ? error.message : 'An error occurred while searching for jobs'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">Find Your Dream Job</CardTitle>
        </CardHeader>
        <CardContent className={cn('p-6', 'custom-slider')}>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="text-lg font-medium">
                  Job Title
                </Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="e.g., Senior Product Manager"
                  className="w-full"
                />
              </div>

              {/* Posted Date */}
              <div className="space-y-2">
                <Label htmlFor="posted-date">Posted Date</Label>
                <Select
                  id="posted-date"
                  value={formData.postedDate}
                  onValueChange={(value) => setFormData({ ...formData, postedDate: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last24h">Past 24 hours</SelectItem>
                    <SelectItem value="lastWeek">Past week</SelectItem>
                    <SelectItem value="lastMonth">Past month</SelectItem>
                    <SelectItem value="anytime">Anytime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-lg font-medium">Location</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="city"
                  value={formData.location.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, city: e.target.value },
                    })
                  }
                  placeholder="City"
                />
                <Input
                  id="state"
                  value={formData.location.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, state: e.target.value },
                    })
                  }
                  placeholder="ST"
                  maxLength={2}
                />
              </div>
            </div>

            {/* Max Distance */}
            <div className="space-y-2">
              <Label className="text-lg font-medium">
                Max Distance: {formData.maxDistance} miles
              </Label>
              <Slider
                value={[formData.maxDistance]}
                onValueChange={([value]) => setFormData({ ...formData, maxDistance: value })}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Salary Range */}
            <div className="space-y-2">
              <Label className="text-lg font-medium">
                Salary Range: {salaryConfig.formatter(formData.salaryRange.min)} -{' '}
                {salaryConfig.formatter(formData.salaryRange.max)}
              </Label>
              <Slider
                value={[formData.salaryRange.min, formData.salaryRange.max]}
                onValueChange={([min, max]) => {
                  const newMin = Math.min(min, formData.salaryRange.max);
                  const newMax = Math.max(max, formData.salaryRange.min);
                  setFormData({
                    ...formData,
                    salaryRange: { min: newMin, max: newMax },
                  });
                }}
                min={salaryConfig.min}
                max={salaryConfig.max}
                step={salaryConfig.step}
                minStepsBetweenThumbs={1}
                className="w-full"
              />
            </div>

            {/* Seniority Level */}
            <div className="space-y-2">
              <Label className="text-lg font-medium">
                Seniority Range: {formData.seniorityRange.min} - {formData.seniorityRange.max}
              </Label>
              <div className="relative pt-6">
                <Slider
                  value={[
                    seniorityLevels.indexOf(formData.seniorityRange.min),
                    seniorityLevels.indexOf(formData.seniorityRange.max),
                  ]}
                  onValueChange={([minIdx, maxIdx]) => {
                    setFormData({
                      ...formData,
                      seniorityRange: {
                        min: seniorityLevels[Math.min(minIdx, maxIdx)],
                        max: seniorityLevels[Math.max(minIdx, maxIdx)],
                      },
                    });
                  }}
                  max={seniorityLevels.length - 1}
                  step={1}
                  minStepsBetweenThumbs={1}
                  className="w-full"
                />
                <div className="absolute top-0 left-0 right-0 flex justify-between">
                  {seniorityLevels.map((level, index) => (
                    <span
                      key={`seniority-${index}`}
                      className="text-xs text-muted-foreground"
                      style={{ left: `${(index / (seniorityLevels.length - 1)) * 100}%` }}
                    >
                      {level.replace('Associate', 'Assoc.').replace('Director', 'Dir.')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Company Filters */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="includedCompanies" className="text-lg font-medium">
                  Included Companies
                </Label>
                <textarea
                  id="includedCompanies"
                  value={formData.includedCompanies}
                  onChange={(e) => setFormData({ ...formData, includedCompanies: e.target.value })}
                  placeholder="Enter each company name on a new line"
                  className="w-full min-h-24 p-2 border rounded-md resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excludedCompanies" className="text-lg font-medium">
                  Excluded Companies
                </Label>
                <textarea
                  id="excludedCompanies"
                  value={formData.excludedCompanies}
                  onChange={(e) => setFormData({ ...formData, excludedCompanies: e.target.value })}
                  placeholder="Enter each company name on a new line"
                  className="w-full min-h-24 p-2 border rounded-md resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="excludeAgencies"
                  checked={formData.excludeAgencies}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, excludeAgencies: checked })
                  }
                />
                <Label htmlFor="excludeAgencies" className="text-lg font-medium">
                  Exclude Hiring Agencies
                </Label>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <Label htmlFor="resume" className="text-lg font-medium">
                Upload Resume
              </Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    document.getElementById('resume-upload')?.click();
                  }}
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  {formData.resume ? formData.resume.name : 'No file selected'}
                </span>
                <Input
                  id="resume-upload"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, resume: file });
                    }
                  }}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-md transition-all hover:from-blue-600 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Find Jobs'}
            </Button>
          </form>

          {/* Job List Component */}
          <div className="mt-8">
            <JobList jobs={jobs} isLoading={isLoading} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
