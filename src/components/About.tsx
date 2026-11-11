"use client";

import { motion } from "framer-motion";
import { User, Server, Brain, Layout, Terminal, Cloud, GraduationCap, CheckCircle2, ArrowUpRight } from "lucide-react";

export function About() {
  const competencyGroups = [
    {
      icon: Brain,
      title: "1. AI Engineering",
      description:
        "Building end-to-end RAG and GraphRAG pipelines, autonomous multi-agent systems, LLM application workflows, verification & evaluation agents, and NLP with transformer models (e.g., FinBERT).",
      tags: [
        "RAG & GraphRAG",
        "Multi-Agent Systems",
        "LLM Applications",
        "Verification Agents",
        "Transformers (FinBERT)",
        "LangChain",
      ],
    },
    {
      icon: Terminal,
      title: "2. AI / ML",
      description:
        "Engineering machine-learning signal models, performing systematic model training, historical backtesting, and quantitative evaluation.",
      tags: ["ML Signal Models", "Model Training & Eval", "XGBoost", "scikit-learn", "Backtesting"],
    },
    {
      icon: Server,
      title: "3. Backend Engineering",
      description:
        "Designing modular REST APIs, type-safe data validation, relational database modeling, and vector search integrations.",
      tags: ["Python", "Node.js", "PostgreSQL / Supabase", "REST APIs", "FastAPI"],
    },
    {
      icon: Layout,
      title: "4. Full-Stack",
      description:
        "Building responsive, high-performance web applications with modern component architectures and type safety across client and server.",
      tags: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    },
    {
      icon: Cloud,
      title: "5. DevOps & Cloud",
      description:
        "Containerizing backend services, setting up automated CI/CD test workflows, deploying to Vercel, and integrating verified AWS cloud services via boto3.",
      tags: [
        "Docker",
        "CI/CD Pipelines",
        "Vercel",
        "Amazon S3",
        "Amazon Bedrock",
        "Amazon DynamoDB",
        "AWS SDK (boto3)",
      ],
    },
  ];

  return (
    <section id="about" className="py-28 sm:py-36 border-b border-white/[0.06] relative w-full">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 pb-6 border-b border-white/[0.06] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
              <span className="text-amber-500/90 font-semibold">02 /</span>
              <span>BACKGROUND & CAPABILITIES</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white">
              About Karthik
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Final-year Computer Engineering · graduating 2027</span>
          </div>
        </div>

        {/* Narrative */}
        <div className="max-w-4xl mb-16 space-y-5 text-base sm:text-lg text-zinc-300 leading-relaxed font-light">
          <p>
            I am a final-year Computer Engineering student graduating in 2027, focusing on intelligent agent architectures, GraphRAG systems, and robust backend engineering. My work centers on converting unstructured enterprise data into structured knowledge graphs, developing multi-agent pipelines with verification agents, and training ML signal models.
          </p>
          <p className="text-zinc-400 text-sm sm:text-base">
            I am actively seeking internship opportunities across AI/ML Engineering, AI Engineering, Backend, Full-Stack, and DevOps where I can apply rigorous systems thinking and write clean, auditable production code.
          </p>

          <div className="pt-2">
            <a
              href="https://www.linkedin.com/in/karthik-sherigara-780a82323/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white hover:text-amber-400 transition-colors"
            >
              <span>View LinkedIn Profile</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 5 Competency Groups - Full width 5-column layout on wide screens, 3 on laptop, 2 on tablet, 1 on mobile */}
        <div className="space-y-5 w-full">
          <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Core Competencies (5 Groups)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 w-full">
            {competencyGroups.map((group, idx) => {
              const Icon = group.icon;
              return (
                <motion.div
                  key={group.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="p-6 rounded-xl border border-white/[0.08] bg-[#070709] flex flex-col justify-between hover:border-white/25 hover:bg-[#0b0b0e] transition-all duration-200"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-zinc-300 mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-medium text-white mb-2">{group.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-sans">
                      {group.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/[0.05]">
                    {group.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-zinc-300 border border-white/[0.06]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
