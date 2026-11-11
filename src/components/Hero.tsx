"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SignalCanvas } from "./SignalCanvas";

export function Hero() {
  return (
    <section className="relative min-h-[96vh] flex flex-col justify-between pt-4 pb-12 px-4 sm:px-8 lg:px-12 overflow-hidden border-b border-white/[0.06] w-full">
      {/* Full-Screen Edge-to-Edge Particle Canvas */}
      <SignalCanvas />

      {/* Edge Annotations spanning the full width of the viewport */}
      <div className="w-full max-w-[1600px] mx-auto flex items-start justify-between text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.24em] text-zinc-500 pt-2 select-none relative z-20 pointer-events-none">
        <span className="hidden sm:inline-block">ENGINEER. BUILDER. RESEARCHER.</span>
        <span className="text-zinc-500 ml-auto sm:ml-0">BASED IN INDIA · THINKING BEYOND</span>
      </div>

      {/* Top Eyebrow - positioned gracefully ABOVE the head */}
      <div className="w-full max-w-[1600px] mx-auto flex justify-center pt-3 sm:pt-4 z-20 pointer-events-none select-none">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-zinc-400 drop-shadow pointer-events-auto"
        >
          A SYSTEMS PERSPECTIVE ON INTELLIGENT AGENTS
        </motion.div>
      </div>

      {/* Side Presence Indicator (left side vertical layout) */}
      <div className="hidden 2xl:flex flex-col gap-1.5 absolute left-12 top-1/3 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600 select-none pointer-events-none z-20">
        <span className="text-amber-500/90 font-semibold mb-1">/ PRESENCE</span>
        <span>ENGINEERING</span>
        <span>GRAPH-RAG</span>
        <span>MULTI-AGENT</span>
        <span>SYSTEMS ARCH</span>
      </div>

      {/* Center Hero Content Container */}
      <div className="relative max-w-6xl mx-auto w-full flex flex-col items-center justify-center my-auto pt-56 sm:pt-64 md:pt-72 pb-6 z-20 pointer-events-none">
        <div className="flex flex-col items-center text-center w-full px-4">
          {/* Signature Editorial Name in Serif Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="font-serif text-6xl sm:text-8xl md:text-9xl lg:text-[10.5rem] text-white tracking-tight leading-none drop-shadow-[0_25px_60px_rgba(0,0,0,0.95)] select-none pointer-events-auto"
          >
            Karthik <span className="font-serif italic font-normal text-[#f4f4f5]">Sherigara</span>
          </motion.h1>

          {/* Concise, factual sub-copy */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-6 text-sm sm:text-base md:text-lg text-zinc-300 font-sans max-w-2xl leading-relaxed pointer-events-auto"
          >
            Final-year Computer Engineering · graduating 2027.
            <br />
            Building GraphRAG pipelines, multi-agent systems, and backend APIs.
          </motion.p>

          {/* Action Buttons matching the reference pill layout */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs sm:text-sm pointer-events-auto"
          >
            <Link
              href="#work"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/20 bg-white/[0.04] hover:bg-white/[0.12] hover:border-white/40 text-white font-medium transition-all shadow-xl shadow-black/70 backdrop-blur-sm"
            >
              <span>Explore my work</span>
              <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />
            </Link>

            <a
              href="https://www.linkedin.com/in/karthik-sherigara-780a82323/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-zinc-400 hover:text-white font-medium transition-colors border-b border-transparent hover:border-zinc-500 backdrop-blur-sm"
            >
              <span>Start a conversation</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
            </a>
          </motion.div>
        </div>
      </div>

      {/* Bottom Footer Note spanning full width */}
      <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-600 pt-6 select-none relative z-20 pointer-events-none">
        <span className="hidden sm:inline-block">AVAILABLE FOR INTERNSHIPS</span>
        <span className="mx-auto sm:mx-0">BUILDING & RESEARCHING · AN ONGOING EXPLORATION</span>
      </div>
    </section>
  );
}
