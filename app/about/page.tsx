import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About IdeaRadar - Discover Startup Ideas from Reddit",
  description:
    "Learn how IdeaRadar aggregates startup ideas from 17+ Reddit communities including r/startup_ideas, r/entrepreneur, and r/SideProject. Find your next big idea today.",
  keywords: [
    "about idearadar",
    "startup idea aggregator",
    "reddit startup communities",
    "entrepreneurship platform",
    "business idea discovery",
  ],
  openGraph: {
    title: "About IdeaRadar - Discover Startup Ideas from Reddit",
    description:
      "Learn how IdeaRadar helps you discover startup ideas from Reddit's top entrepreneurial communities.",
    url: "https://idearadar.com/about",
    type: "website",
  },
  alternates: {
    canonical: "https://idearadar.com/about",
  },
};

export default function AboutPage() {
  const subreddits = [
    { name: "r/startup_ideas", category: "Startup Ideas" },
    { name: "r/SideProject", category: "Startup Ideas" },
    { name: "r/entrepreneur", category: "Startup Ideas" },
    { name: "r/EntrepreneurRideAlong", category: "Startup Ideas" },
    { name: "r/smallbusiness", category: "Startup Ideas" },
    { name: "r/Startups", category: "Startup Ideas" },
    { name: "r/indiehackers", category: "Startup Ideas" },
    { name: "r/saas", category: "Startup Ideas" },
    { name: "r/AppIdeas", category: "App Ideas" },
    { name: "r/CrazyIdeas", category: "App Ideas" },
    { name: "r/Business_Ideas", category: "App Ideas" },
    { name: "r/ProductManagement", category: "App Ideas" },
    { name: "r/AItools", category: "AI Ideas" },
    { name: "r/ArtificialInteligence", category: "AI Ideas" },
    { name: "r/MachineLearning", category: "AI Ideas" },
    { name: "r/LocalLLaMA", category: "AI Ideas" },
    { name: "r/ChatGPT", category: "AI Ideas" },
  ];

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
            Your gateway to discovering innovative startup ideas from Reddit&apos;s most active entrepreneurial communities.
          </p>
        </div>

        {/* Mission Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Our Mission</h2>
          <div className="space-y-4 text-text-muted">
            <p className="leading-relaxed">
              IdeaRadar was created to solve a simple problem: finding great startup ideas scattered across multiple Reddit communities is time-consuming and inefficient. We aggregate, organize, and present thousands of startup ideas in one convenient location.
            </p>
            <p className="leading-relaxed">
              Whether you&apos;re an aspiring entrepreneur looking for your next venture, a developer seeking side project inspiration, or simply curious about what problems people want solved, IdeaRadar makes it easy to explore and discover opportunities.
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
              <h3 className="text-lg font-semibold">Automated Scraping</h3>
              <p className="text-sm leading-relaxed text-text-muted">
                We automatically collect posts from carefully selected Reddit communities daily using the Reddit API.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-surface p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <span className="text-2xl font-bold text-accent">2</span>
              </div>
              <h3 className="text-lg font-semibold">Smart Organization</h3>
              <p className="text-sm leading-relaxed text-text-muted">
                Ideas are organized with metadata including upvotes, comments, and timestamps for easy browsing.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-surface p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <span className="text-2xl font-bold text-accent">3</span>
              </div>
              <h3 className="text-lg font-semibold">Easy Discovery</h3>
              <p className="text-sm leading-relaxed text-text-muted">
                Search, filter, and explore thousands of ideas without visiting multiple subreddits.
              </p>
            </div>
          </div>
        </section>

        {/* Subreddits Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Communities We Monitor</h2>
          <p className="text-text-muted">
            We collect ideas from {subreddits.length} active Reddit communities with over 100,000 members each:
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {["Startup Ideas", "App Ideas", "AI Ideas"].map((category) => (
              <div key={category} className="space-y-4 rounded-lg border border-border bg-surface p-6">
                <h3 className="font-semibold text-accent">{category}</h3>
                <ul className="space-y-2">
                  {subreddits
                    .filter((sub) => sub.category === category)
                    .map((sub) => (
                      <li key={sub.name} className="text-sm text-text-muted">
                        {sub.name}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Features</h2>
          <div className="space-y-4">
            <div className="flex gap-4 rounded-lg border border-border bg-surface p-6">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <span className="text-accent">🔍</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Powerful Search</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  Find specific ideas using keywords, filter by subreddit, time range, and popularity.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-border bg-surface p-6">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <span className="text-accent">📱</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Clean Interface</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  Browse ideas in a beautiful, distraction-free card view with all essential information at a glance.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-border bg-surface p-6">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <span className="text-accent">🔄</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Daily Updates</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  New ideas are added automatically every day, keeping the collection fresh and relevant.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-border bg-surface p-6">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <span className="text-accent">🔗</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Direct Links</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  Every idea links directly to the original Reddit post so you can join the discussion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Built With</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-6">
              <h3 className="mb-2 font-semibold">Frontend</h3>
              <p className="text-sm text-text-muted">Next.js, React, TypeScript, Tailwind CSS</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-6">
              <h3 className="mb-2 font-semibold">Backend</h3>
              <p className="text-sm text-text-muted">Python, Reddit API (PRAW), Supabase PostgreSQL</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-lg border border-border bg-surface p-8 text-center">
          <h2 className="mb-4 text-2xl font-semibold">Ready to Discover Ideas?</h2>
          <p className="mb-6 text-text-muted">
            Start exploring thousands of startup ideas from Reddit&apos;s best communities.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Browse Ideas
          </Link>
        </section>
      </div>
    </div>
  );
}

