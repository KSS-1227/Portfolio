import Link from "next/link";
import { ReducedMotionToggle } from "./ReducedMotionToggle";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#030303] py-12 w-full">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono text-zinc-500">
        <div>
          <span>© {new Date().getFullYear()} Karthik Sherigara.</span>
          <span className="hidden sm:inline"> Final-year Computer Engineering · graduating 2027.</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="#work" className="hover:text-zinc-300 transition-colors">
            Work
          </Link>
          <Link href="#about" className="hover:text-zinc-300 transition-colors">
            About
          </Link>
          <Link href="#contact" className="hover:text-zinc-300 transition-colors">
            Contact
          </Link>
          <ReducedMotionToggle compact={true} />
        </div>
      </div>
    </footer>
  );
}
