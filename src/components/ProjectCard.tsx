"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FeaturedProject } from "@/types";
import { ArrowUpRight, Github, ExternalLink, BookOpen, Trophy } from "lucide-react";

export function ProjectCard({ project, index }: { project: FeaturedProject; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative rounded-xl border border-white/[0.08] bg-[#08080a] p-7 sm:p-9 hover:border-white/20 transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Header metadata */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-4 pb-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">{project.role}</span>
            {project.isHackathon && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                <Trophy className="w-3 h-3" />
                Hackathon Build
              </span>
            )}
          </div>
          <span>{project.year}</span>
        </div>

        {/* Title & Tagline */}
        <Link href={`/projects/${project.slug}`} className="block group-hover:text-white">
          <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-100 group-hover:text-white transition-colors">
            {project.title}
          </h3>
          <p className="mt-2 text-sm text-zinc-400 font-normal leading-relaxed">
            {project.tagline}
          </p>
        </Link>

        {/* Brief Description */}
        <p className="mt-4 text-xs sm:text-sm text-zinc-500 leading-relaxed">
          {project.description}
        </p>
      </div>

      <div className="mt-6 pt-5 border-t border-white/[0.05]">
        {/* Tech Stack Pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs font-mono rounded bg-white/[0.03] text-zinc-300 border border-white/[0.06]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white group-hover:translate-x-0.5 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>Read Case Study</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center gap-3">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Live Demo"
                className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
