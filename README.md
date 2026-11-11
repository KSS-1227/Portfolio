# Karthik Sherigara — Personal Portfolio Website

Personal portfolio website for **Karthik Sherigara**, a final-year Computer Engineering student seeking AI/ML, backend, and full-stack internships.

Built with **Next.js (App Router)**, **Tailwind CSS**, and **Framer Motion**, deploy-ready for **Vercel**.

---

## 🎨 Design System

- **Background:** `#030303` (ultra-dark)
- **Typography:** Large editorial scale with monospace accents
- **Motion:** Subtle scroll-triggered Framer Motion reveals with a global **Reduced-Motion toggle** (also respects `prefers-reduced-motion`)
- **Responsive:** Mobile-first, fluid layout across all screen breakpoints

---

## 📁 Sections & Structure

- **Hero:** Personal positioning, student profile, availability indicator, and primary CTAs.
- **Selected Work:** Flagship project cards with tags, live links, and full case-study pages (`/projects/[slug]`).
- **More on GitHub:** Live integration with GitHub API for user `KSS-1227` displaying non-featured public repositories with stars, language badge, and relative last-updated date.
- **About:** Academic background (Computer Engineering '25), core competencies across systems, ML, and full-stack engineering.
- **Contact:** Clean editorial contact cards with direct email, GitHub, LinkedIn, and resume placeholders.

---

## 🛠 Project Data Configuration

Featured projects and case studies are managed in:
```
src/data/projects.ts
```

To feature a project in the flagship grid:
1. Add an entry to `projectsConfig` with `isFeatured: true`.
2. Provide `title`, `slug`, `tagline`, `description`, `tags`, and optional links (`demoUrl`, `githubUrl`).
3. Fill in the `caseStudy` object to automatically generate a rich case study page at `/projects/<slug>`.

Any repositories on GitHub (`KSS-1227`) that are **not** marked as featured will automatically populate the "More on GitHub" section with live GitHub metadata.

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your portfolio.

### 3. Build for production
```bash
npm run build
```

---

## 🚢 Deploying to Vercel

1. Push this repository to GitHub under your account (`KSS-1227`).
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Next.js App Router defaults will be automatically detected.
4. Click **Deploy**.
