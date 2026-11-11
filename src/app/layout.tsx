import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Karthik Sherigara | Portfolio — Final-year Computer Engineering",
  description:
    "Personal portfolio of Karthik Sherigara, a final-year Computer Engineering student graduating in 2027 seeking AI/ML, AI Engineering, Backend, Full-Stack, and DevOps internships.",
  keywords: [
    "Karthik Sherigara",
    "Computer Engineering",
    "Portfolio",
    "AI/ML Engineering",
    "AI Engineering",
    "Backend Engineer",
    "Full-Stack",
    "DevOps",
    "GraphRAG",
    "Multi-Agent Systems",
    "Next.js",
  ],
  authors: [{ name: "Karthik Sherigara" }],
  openGraph: {
    title: "Karthik Sherigara | Portfolio",
    description:
      "Final-year Computer Engineering student graduating 2027 building GraphRAG pipelines, multi-agent systems, and scalable backend services.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#030303",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#030303] text-zinc-100 font-sans antialiased selection:bg-white selection:text-black">
        <MotionProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </MotionProvider>
      </body>
    </html>
  );
}
