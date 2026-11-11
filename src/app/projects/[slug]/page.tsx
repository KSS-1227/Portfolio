import { notFound } from "next/navigation";
import Link from "next/link";
import { projectsConfig } from "@/data/projects";
import { ArrowLeft, ArrowUpRight, Github, ExternalLink, Cpu, Layers, AlertCircle, Trophy, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return projectsConfig.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = projectsConfig.find((p) => p.slug === params.slug);
  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.title} | Karthik Sherigara`,
    description: project.tagline,
  };
}

export default function CaseStudyPage({ params }: Props) {
  const project = projectsConfig.find((p) => p.slug === params.slug);

  if (!project) {
    notFound();
  }

  const { caseStudy } = project;

  return (
    <article className="min-h-screen bg-[#030303] text-zinc-200 py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Navigation back */}
        <Link
          href="/#work"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Selected Work</span>
        </Link>

        {/* Header Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-500 mb-4 pb-4 border-b border-white/[0.06]">
          <span className="uppercase text-emerald-400">{project.role}</span>
          <span>•</span>
          <span>{project.year}</span>
          {project.isHackathon && (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-amber-400">
                <Trophy className="w-3 h-3" />
                Hackathon Build (AWS Hackathon)
              </span>
            </>
          )}
          <span>•</span>
          <span>Repository: {project.repoName}</span>
        </div>

        {/* Project Title & Tagline */}
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
          {project.title}
        </h1>

        <p className="mt-4 text-lg sm:text-xl text-zinc-400 font-light leading-relaxed">
          {project.tagline}
        </p>

        {/* Quick Links & Tags */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-mono rounded bg-white/[0.03] text-zinc-300 border border-white/[0.08]"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-white/10 bg-white/[0.02] text-xs font-mono text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white text-black text-xs font-mono font-medium hover:bg-zinc-200 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Live Demo</span>
              </a>
            )}
          </div>
        </div>

        {/* Structured Case Study */}
        <div className="mt-16 space-y-14 border-t border-white/[0.06] pt-12">
          {/* 1. Problem */}
          <section className="p-7 rounded-xl border border-white/[0.06] bg-[#070709]">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400/90 mb-3">
              <AlertCircle className="w-4 h-4" />
              <span>1. The Problem</span>
            </div>
            <p className="text-base text-zinc-300 leading-relaxed font-light">
              {caseStudy.problem}
            </p>
          </section>

          {/* 2. Architecture */}
          <section className="p-7 rounded-xl border border-white/[0.06] bg-[#08080a]">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-300 mb-3">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>2. System Architecture</span>
            </div>
            <p className="text-base text-zinc-300 leading-relaxed font-light">
              {caseStudy.architecture}
            </p>
          </section>

          {/* 3. Tech Stack */}
          <section>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 mb-4">
              <Cpu className="w-4 h-4" />
              <span>3. Verified Technical Stack</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {caseStudy.stack.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 text-xs font-mono rounded bg-white/[0.04] text-zinc-200 border border-white/[0.08]"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          {/* 4. What I Built */}
          <section className="p-8 rounded-xl border border-white/[0.06] bg-[#070709]">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-300 mb-5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>4. What I Built</span>
            </div>
            <ul className="space-y-3.5">
              {caseStudy.whatIBuilt.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Limitations & Next Steps */}
          <section className="p-7 rounded-xl border border-white/[0.06] bg-white/[0.01]">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>5. Limitations & Next Steps</span>
            </div>
            <ul className="space-y-2.5">
              {caseStudy.limitationsAndNextSteps.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-20 pt-8 border-t border-white/[0.06] flex items-center justify-between">
          <Link
            href="/#work"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Portfolio</span>
          </Link>

          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
          >
            <span>View Source on GitHub</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
