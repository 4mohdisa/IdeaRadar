import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "IdeaRadar Terms of Service - Terms and conditions for using our service.",
};

export default function TermsPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-4xl space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Terms of Service</h1>
          <p className="text-text-muted">Last updated: November 29, 2025</p>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="leading-relaxed text-text-muted">
              By accessing and using IdeaRadar, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Description of Service</h2>
            <p className="leading-relaxed text-text-muted">
              IdeaRadar is a web application that aggregates and displays publicly available startup ideas and discussions from various Reddit communities. The service provides:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-text-muted">
              <li>Access to curated content from public Reddit posts</li>
              <li>Search and filtering capabilities</li>
              <li>Organized display of startup ideas and related discussions</li>
              <li>Links to original Reddit posts and communities</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. User Responsibilities</h2>
            <p className="leading-relaxed text-text-muted">
              You agree to use IdeaRadar only for lawful purposes. You are prohibited from:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-text-muted">
              <li>Using the service to violate any local, state, national, or international law</li>
              <li>Attempting to gain unauthorized access to the service or its related systems</li>
              <li>Interfering with or disrupting the service or servers</li>
              <li>Using automated means to scrape or download content beyond normal browsing</li>
              <li>Impersonating any person or entity</li>
              <li>Transmitting any viruses, malware, or other malicious code</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Content and Intellectual Property</h2>
            <p className="leading-relaxed text-text-muted">
              All content displayed on IdeaRadar is sourced from publicly available Reddit posts. The original content remains the property of its respective Reddit authors and is subject to Reddit&apos;s Terms of Service and Content Policy.
            </p>
            <p className="leading-relaxed text-text-muted">
              IdeaRadar&apos;s original content, including but not limited to the website design, interface, code, and organization of content, is protected by copyright and other intellectual property rights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Third-Party Content and Links</h2>
            <p className="leading-relaxed text-text-muted">
              IdeaRadar displays content from Reddit and may contain links to external websites. We are not responsible for:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-text-muted">
              <li>The accuracy, legality, or appropriateness of content from third-party sources</li>
              <li>Any damages or losses caused by reliance on such content</li>
              <li>The privacy practices of third-party websites</li>
              <li>Content that may be offensive, inaccurate, or inappropriate</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Disclaimer of Warranties</h2>
            <p className="leading-relaxed text-text-muted">
              IdeaRadar is provided &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind, either express or implied, including but not limited to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-text-muted">
              <li>Warranties of merchantability or fitness for a particular purpose</li>
              <li>Warranties that the service will be uninterrupted, timely, secure, or error-free</li>
              <li>Warranties regarding the accuracy or reliability of content</li>
              <li>Warranties that defects will be corrected</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Limitation of Liability</h2>
            <p className="leading-relaxed text-text-muted">
              To the maximum extent permitted by law, IdeaRadar and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-text-muted">
              <li>Your use or inability to use the service</li>
              <li>Any unauthorized access to or use of our servers</li>
              <li>Any bugs, viruses, or other harmful code</li>
              <li>Any content obtained from the service</li>
              <li>Any errors or omissions in content</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Indemnification</h2>
            <p className="leading-relaxed text-text-muted">
              You agree to indemnify, defend, and hold harmless IdeaRadar and its operators from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the service or violation of these terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Service Modifications</h2>
            <p className="leading-relaxed text-text-muted">
              We reserve the right to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Reddit Compliance</h2>
            <p className="leading-relaxed text-text-muted">
              IdeaRadar uses the Reddit API to collect publicly available data and complies with Reddit&apos;s API Terms of Use and Developer Terms. Users accessing content through IdeaRadar are also subject to Reddit&apos;s policies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Removal Requests</h2>
            <p className="leading-relaxed text-text-muted">
              If you are a Reddit user and wish to have your content removed from IdeaRadar, please contact us with the specific post URL and we will process your request in a timely manner.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Changes to Terms</h2>
            <p className="leading-relaxed text-text-muted">
              We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on this page. Your continued use of the service after such changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">13. Governing Law</h2>
            <p className="leading-relaxed text-text-muted">
              These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">14. Contact Information</h2>
            <p className="leading-relaxed text-text-muted">
              If you have any questions about these Terms of Service, please contact us through our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

