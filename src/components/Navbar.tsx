"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReducedMotionToggle } from "./ReducedMotionToggle";

export function Navbar() {
  return (
    <div className="sticky top-0 z-50 w-full pt-4 pb-2 px-4 pointer-events-none">
      <header className="max-w-4xl mx-auto rounded-full border border-white/[0.08] bg-[#0c0c0e]/85 backdrop-blur-xl px-5 sm:px-6 py-2.5 flex items-center justify-between shadow-2xl shadow-black/80 pointer-events-auto transition-all">
        {/* Brand Name in Elegant Serif */}
        <Link
          href="/"
          className="group flex items-center gap-2 font-serif text-lg sm:text-xl text-white hover:text-zinc-200 transition-colors tracking-tight"
        >
          <span>Karthik Sherigara</span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-5 sm:gap-7 text-xs sm:text-sm text-zinc-400 font-sans">
          <Link
            href="/#work"
            className="hover:text-white transition-colors"
          >
            Work
          </Link>
          <Link
            href="/#about"
            className="hover:text-white transition-colors"
          >
            About
          </Link>

          {/* Let's Talk CTA Pill */}
          <a
            href="https://www.linkedin.com/in/karthik-sherigara-780a82323/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/[0.05] hover:bg-white/[0.12] hover:border-white/30 text-xs text-white font-medium transition-all"
          >
            <span>Let&apos;s talk</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
          </a>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <ReducedMotionToggle compact={true} />
        </nav>
      </header>
    </div>
  );
}
