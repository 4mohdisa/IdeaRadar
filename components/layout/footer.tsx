import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Left side - Legal links and copyright */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-text-muted sm:justify-start">
            <Link href="/about" className="transition-colors hover:text-accent">
              About
            </Link>
            <span>·</span>
            <Link href="/privacy" className="transition-colors hover:text-accent">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link href="/terms" className="transition-colors hover:text-accent">
              Terms of Service
            </Link>
            <span>·</span>
            <span>© {currentYear} IdeaRadar. All rights reserved.</span>
          </div>

          {/* Right side - Built by */}
          <div className="text-sm text-text-muted">
            Built by{" "}
            <a
              href="https://github.com/4mohdisa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent transition-opacity hover:opacity-80"
            >
              4mohdisa
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

