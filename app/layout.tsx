import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import StoreProvider from "./StoreProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://idearadar.com"),
  title: {
    default: "IdeaRadar - Discover Startup Ideas from Reddit",
    template: "%s | IdeaRadar",
  },
  description:
    "Discover and explore startup ideas from Reddit's most active entrepreneurial communities. Browse thousands of ideas from r/startup_ideas, r/SideProject, r/entrepreneur, and more.",
  keywords: [
    "startup ideas",
    "reddit startup ideas",
    "side project ideas",
    "entrepreneurship",
    "business ideas",
    "app ideas",
    "AI ideas",
    "SaaS ideas",
    "entrepreneur",
    "indie hacker",
    "startup inspiration",
    "business opportunities",
  ],
  authors: [{ name: "IdeaRadar" }],
  creator: "IdeaRadar",
  publisher: "IdeaRadar",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://idearadar.com",
    title: "IdeaRadar - Discover Startup Ideas from Reddit",
    description:
      "Discover and explore startup ideas from Reddit's most active entrepreneurial communities. Browse thousands of ideas from r/startup_ideas, r/SideProject, r/entrepreneur, and more.",
    siteName: "IdeaRadar",
    images: [
      {
        url: "/logo-icon.png",
        width: 512,
        height: 512,
        alt: "IdeaRadar Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IdeaRadar - Discover Startup Ideas from Reddit",
    description:
      "Discover and explore startup ideas from Reddit's most active entrepreneurial communities.",
    images: ["/logo-icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicons/favicon.ico" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/favicons/android-chrome-192x192.png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/favicons/android-chrome-512x512.png",
      },
    ],
  },
  manifest: "/favicons/site.webmanifest",
  alternates: {
    canonical: "https://idearadar.com",
  },
  verification: {
    // Add these when you set them up
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
        <GoogleTagManager gtmId="GTM-NZVJSLXN" />
        <body className="flex min-h-screen flex-col" suppressHydrationWarning>
          <StoreProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </StoreProvider>
        </body>
        <GoogleAnalytics gaId="G-0KH23SZ43Y" />
      </html>
    </ClerkProvider>
  );
}
