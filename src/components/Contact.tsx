"use client";

import { Mail, Github, Linkedin, FileText, ArrowUpRight, Send } from "lucide-react";

export function Contact() {
  return (
    <section id="contact" className="py-28 sm:py-36 relative w-full">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="rounded-2xl border border-white/[0.08] bg-[#070709] p-8 sm:p-14 lg:p-16 relative overflow-hidden w-full">
          {/* Subtle warm halo glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[360px] bg-amber-500/[0.025] blur-[120px] pointer-events-none" />

          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 mb-4">
              <span className="text-amber-500/90 font-semibold">03 /</span>
              <span>GET IN TOUCH</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white leading-tight">
              Let&apos;s discuss internship opportunities, projects, or collaborations.
            </h2>

            <p className="mt-6 text-base sm:text-lg text-zinc-400 leading-relaxed font-light">
              I am actively interviewing for AI/ML Engineering, AI Engineering, Backend, Full-Stack, and DevOps internships. If you have an open opportunity or an interesting engineering problem, feel free to reach out.
            </p>

            {/* Contact Actions Grid - 4 columns on wide screens */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {/* LinkedIn (Primary) */}
              <a
                href="https://www.linkedin.com/in/karthik-sherigara-780a82323/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all min-h-[110px]"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-white/[0.05] text-zinc-300">
                    <Linkedin className="w-4 h-4 text-sky-400" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div>
                  <span className="text-xs font-mono text-zinc-500 block">LinkedIn</span>
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate block">
                    karthik-sherigara
                  </span>
                </div>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/KSS-1227"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all min-h-[110px]"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-white/[0.05] text-zinc-300">
                    <Github className="w-4 h-4 text-zinc-300" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div>
                  <span className="text-xs font-mono text-zinc-500 block">GitHub</span>
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate block">
                    github.com/KSS-1227
                  </span>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:placeholder@sherigara.dev"
                className="group flex flex-col justify-between p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all min-h-[110px]"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-white/[0.05] text-zinc-300">
                    <Mail className="w-4 h-4 text-emerald-400" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div>
                  <span className="text-xs font-mono text-zinc-500 block">Email Me</span>
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate block">
                    placeholder@sherigara.dev
                  </span>
                </div>
              </a>

              {/* Resume Placeholder */}
              <a
                href="/resume-placeholder.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all min-h-[110px]"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-white/[0.05] text-zinc-300">
                    <FileText className="w-4 h-4 text-amber-400" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div>
                  <span className="text-xs font-mono text-zinc-500 block">Curriculum Vitae</span>
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate block">
                    Resume (PDF)
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
