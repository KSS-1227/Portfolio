export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  fork: boolean;
  topics?: string[];
}

export interface CaseStudyData {
  problem: string;
  architecture: string;
  stack: string[];
  whatIBuilt: string[];
  limitationsAndNextSteps: string[];
}

export interface FeaturedProject {
  repoName: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  tags: string[];
  demoUrl?: string;
  githubUrl: string;
  isFeatured: boolean;
  year: string;
  role: string;
  isHackathon?: boolean;
  caseStudy: CaseStudyData;
}
