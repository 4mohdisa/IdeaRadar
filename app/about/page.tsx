import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About IdeaRadar - AI-Powered Startup Idea Discovery",
  description:
    "IdeaRadar helps entrepreneurs discover, validate, and score startup ideas using AI. Submit your ideas, get instant feedback, and find your next big opportunity.",
  keywords: [
    "about idearadar",
    "startup idea platform",
    "AI idea scoring",
    "entrepreneurship platform",
    "business idea discovery",
    "startup validation",
  ],
  openGraph: {
    title: "About IdeaRadar - AI-Powered Startup Idea Discovery",
    description:
      "Discover, validate, and score startup ideas using AI. Join our community of entrepreneurs.",
    url: "https://idearadar.com/about",
    type: "website",
  },
  alternates: {
    canonical: "https://idearadar.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-4xl space-y-16">
        {/* Hero Section */}
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <Image
              src="/logo-icon.png"
              alt="IdeaRadar"
              width={80}
              height={80}
              className="h-20 w-20"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About IdeaRadar</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-text-muted">
            Your AI-powered platform for discovering, validating, and scoring startup ideas. Find your next big opportunity.
          </p>
        </div>

        {/* Mission Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Our Mission</h2>
          <div className="space-y-4 text-text-muted">
            <p className="leading-relaxed">
              IdeaRadar was built to help entrepreneurs and innovators turn ideas into reality. We believe that great ideas deserve proper validation before you invest your time and resources building them.
            </p>
            <p className="leading-relaxed">
              Our AI-powered scoring system analyzes each idea across multiple dimensions—market potential, scalability, feasibility, and competitive landscape—giving you instant, actionable insights to make better decisions.
            </p>
            <p className="leading-relaxed">
              Whether you&apos;re an aspiring entrepreneur looking for your next venture, a developer seeking side project inspiration, or an investor scouting opportunities, IdeaRadar helps you discover and evaluate ideas efficiently.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3 rounded-lg border border-border bg-surface p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <span className="text-2xl font-bold text-accent">1</span>
              </div>
              <h3 className="text-lg font-semibold">Submit Your Idea</h3>
              <p className="text-sm leading-relaxed text-text-muted">
                Share your startup idea with our community. Describe the problem you&apos;re solving and your proposed solution.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-surface p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <span className="text-2xl font-bold text-accent">2</span>
              </div>
              <h3 className="text-lg font-semibold">AI Analysis</h3>
              <p className="text-sm leading-relaxed text-text-muted">
                Our AI instantly scores your idea (0-100) based on market demand, scalability, feasibility, and competitive positioning.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-surface p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <span className="text-2xl font-bold text-accent">3</span>
              </div>
              <h3 className="text-lg font-semibold">Community Feedback</h3>
              <p className="text-sm leading-relaxed text-text-muted">
                Get votes, comments, and feedback from fellow entrepreneurs to refine and validate your concept.
              </p>
            </div>
          </div>
        </section>

        {/* AI Scoring Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">AI-Powered Scoring</h2>
          <p className="text-text-muted">
            Our advanced AI evaluates each idea across 10 key dimensions to provide a comprehensive market potential score:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
              <h3 className="font-semibold text-accent">Market & Timing</h3>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>• <strong>Market Demand</strong> - Current demand and problem urgency</li>
                <li>• <strong>Market Timing</strong> - Trend alignment and readiness</li>
              </ul>
            </div>
            <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
              <h3 className="font-semibold text-accent">Business Viability</h3>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>• <strong>Revenue Clarity</strong> - Clear monetization path</li>
                <li>• <strong>Scalability</strong> - Growth potential and network effects</li>
              </ul>
            </div>
            <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
              <h3 className="font-semibold text-accent">Competitive Position</h3>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>• <strong>Unique Value</strong> - Differentiation and innovation</li>
                <li>• <strong>Competitive Moat</strong> - Barriers to entry</li>
              </ul>
            </div>
            <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
              <h3 className="font-semibold text-accent">Execution & Risk</h3>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>• <strong>Technical Feasibility</strong> - Can it be built?</li>
                <li>• <strong>Execution Complexity</strong> - Resource requirements</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Features</h2>
          <div className="space-y-4">
            <div className="flex gap-4 rounded-lg border border-border bg-surface p-6">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <span className="text-accent">🤖</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">AI-Powered Scoring</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  Get instant, objective scores for any startup idea based on market potential, feasibility, and competitive landscape.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-border bg-surface p-6">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <span className="text-accent">🔍</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Powerful Search & Filters</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  Find ideas by keyword, filter by score, sort by popularity, and discover trending opportunities.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-border bg-surface p-6">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <span className="text-accent">🏆</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Leaderboard</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  See the top-rated ideas ranked by community votes and AI scores. Discover what&apos;s trending.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-border bg-surface p-6">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <span className="text-accent">💬</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Community Discussion</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  Comment on ideas, share feedback, and collaborate with fellow entrepreneurs to refine concepts.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-border bg-surface p-6">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <span className="text-accent">🔖</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Bookmarks & Dashboard</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  Save interesting ideas, track your submissions, and manage everything from your personal dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Built With Modern Tech</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-6">
              <h3 className="mb-2 font-semibold">Frontend</h3>
              <p className="text-sm text-text-muted">Next.js 16, React, TypeScript, Tailwind CSS, RTK Query</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-6">
              <h3 className="mb-2 font-semibold">Backend & AI</h3>
              <p className="text-sm text-text-muted">Supabase PostgreSQL, Google Gemini AI, Clerk Auth</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-lg border border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 p-8 text-center">
          <h2 className="mb-4 text-2xl font-semibold">Ready to Discover Your Next Big Idea?</h2>
          <p className="mb-6 text-text-muted">
            Join our community of entrepreneurs and start exploring AI-scored startup ideas today.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Browse Ideas
            </Link>
            <Link
              href="/create"
              className="inline-flex items-center justify-center rounded-lg border border-accent px-6 py-3 font-medium text-accent transition-colors hover:bg-accent/10"
            >
              Submit Your Idea
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

