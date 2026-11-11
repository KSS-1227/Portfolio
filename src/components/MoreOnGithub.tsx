"use client";

import { GitHubRepo } from "@/types";
import { projectsConfig } from "@/data/projects";
import { GithubRepoCard } from "./GithubRepoCard";
import { Github, ArrowUpRight } from "lucide-react";

interface MoreOnGithubProps {
  repos: GitHubRepo[];
}

export function MoreOnGithub({ repos }: MoreOnGithubProps) {
  // Get list of featured repository names
  const featuredRepoNames = new Set(
    projectsConfig
      .filter((p) => p.isFeatured)
      .map((p) => p.repoName.toLowerCase())
  );

  // Filter out featured ones to show non-featured repositories
  const nonFeaturedRepos = repos.filter(
    (repo) => !featuredRepoNames.has(repo.name.toLowerCase())
  );

  return (
    <section id="github" className="py-28 sm:py-36 border-b border-white/[0.06] relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Editorial Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 pb-6 border-b border-white/[0.06] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
              <span className="text-amber-500/90 font-semibold">03 /</span>
              <span>OPEN SOURCE & EXPLORATIONS</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-white">
              More on GitHub
            </h2>
          </div>
          <a
            href="https://github.com/KSS-1227"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
          >
            <span>View All on GitHub (KSS-1227)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Repos Grid */}
        {nonFeaturedRepos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {nonFeaturedRepos.map((repo, idx) => (
              <GithubRepoCard key={repo.id} repo={repo} index={idx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-lg text-zinc-500 text-sm font-mono">
            No additional public repositories found.
          </div>
        )}
      </div>
    </section>
  );
}
