"use client";

import { GitHubRepo } from "@/types";
import { formatRelativeDate, getLanguageColor } from "@/lib/utils";
import { Star, GitFork, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export function GithubRepoCard({ repo, index }: { repo: GitHubRepo; index: number }) {
  const langColor = getLanguageColor(repo.language);

  return (
    <motion.a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="group flex flex-col justify-between p-5 rounded-lg border border-white/[0.06] bg-[#070709] hover:bg-[#0c0c0f] hover:border-white/20 transition-all duration-200"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-base font-medium text-zinc-200 group-hover:text-white transition-colors truncate font-mono">
            {repo.name}
          </h4>
          <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
        </div>

        <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed min-h-[32px]">
          {repo.description || "Public repository and code exploration."}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-400 font-mono">
        {/* Language */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: langColor }}
          />
          <span>{repo.language || "Code"}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title="Stars">
            <Star className="w-3.5 h-3.5 text-zinc-500" />
            <span>{repo.stargazers_count}</span>
          </div>
          {repo.forks_count > 0 && (
            <div className="flex items-center gap-1" title="Forks">
              <GitFork className="w-3.5 h-3.5 text-zinc-500" />
              <span>{repo.forks_count}</span>
            </div>
          )}
          <span className="text-zinc-500" title={`Updated: ${repo.updated_at}`}>
            {formatRelativeDate(repo.updated_at)}
          </span>
        </div>
      </div>
    </motion.a>
  );
}
