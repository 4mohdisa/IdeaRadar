import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "IdeaRadar Privacy Policy - Learn how we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-4xl space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Privacy Policy</h1>
          <p className="text-text-muted">Last updated: November 29, 2025</p>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Introduction</h2>
            <p className="leading-relaxed text-text-muted">
              Welcome to IdeaRadar. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Information We Collect</h2>
            <p className="leading-relaxed text-text-muted">
              IdeaRadar collects and displays publicly available information from Reddit communities. We collect:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-text-muted">
              <li>Public Reddit posts from selected subreddits</li>
              <li>Post metadata (titles, authors, upvotes, comments, timestamps)</li>
              <li>Basic analytics data (page views, user interactions) for improving our service</li>
              <li>Technical data (IP address, browser type, device information) through standard web logs</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
            <p className="leading-relaxed text-text-muted">
              We use the information we collect to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-text-muted">
              <li>Provide and maintain our service</li>
              <li>Display publicly available Reddit content in an organized manner</li>
              <li>Improve and optimize our website</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Ensure the security and integrity of our service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Data Storage and Security</h2>
            <p className="leading-relaxed text-text-muted">
              We store collected Reddit posts and metadata in a secure Supabase PostgreSQL database. We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Third-Party Services</h2>
            <p className="leading-relaxed text-text-muted">
              IdeaRadar uses the following third-party services:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-text-muted">
              <li><strong>Reddit API:</strong> To collect publicly available posts from Reddit communities</li>
              <li><strong>Supabase:</strong> For database storage and management</li>
              <li><strong>Vercel/Next.js:</strong> For hosting and web infrastructure</li>
            </ul>
            <p className="leading-relaxed text-text-muted">
              These services may have their own privacy policies, which we encourage you to review.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Cookies and Tracking</h2>
            <p className="leading-relaxed text-text-muted">
              We use minimal cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Your Rights</h2>
            <p className="leading-relaxed text-text-muted">
              You have the right to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-text-muted">
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Data Retention</h2>
            <p className="leading-relaxed text-text-muted">
              We retain publicly available Reddit data indefinitely to provide our service. If a Reddit post is deleted by its author or removed by moderators, we may still retain the data in our database unless specifically requested to remove it.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Children&apos;s Privacy</h2>
            <p className="leading-relaxed text-text-muted">
              Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal data, please contact us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Changes to This Privacy Policy</h2>
            <p className="leading-relaxed text-text-muted">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Contact Us</h2>
            <p className="leading-relaxed text-text-muted">
              If you have any questions about this Privacy Policy, please contact us through our website or via email.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

