"use client";

import { motion } from "framer-motion";
import { projectsConfig } from "@/data/projects";
import { ProjectCard } from "./ProjectCard";
import { Sparkles } from "lucide-react";

export function SelectedWork() {
  const featured = projectsConfig.filter((p) => p.isFeatured);

  return (
    <section id="work" className="py-28 sm:py-36 border-b border-white/[0.06] relative w-full">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Editorial Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 pb-6 border-b border-white/[0.06] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
              <span className="text-amber-500/90 font-semibold">01 /</span>
              <span>FLAGSHIP PROJECTS</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white">
              Selected Work
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-mono text-zinc-400 max-w-md">
            Architectural case studies across GraphRAG, multi-agent systems, explainable ML models, and durable action protocols.
          </p>
        </div>

        {/* 2x2 Flagship Project Cards - expansive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full">
          {featured.map((project, idx) => (
            <ProjectCard key={project.slug} project={project} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
