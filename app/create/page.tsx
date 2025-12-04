"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IoChevronBack, IoCheckmarkCircle } from "react-icons/io5";
import { PageTransition } from "@/components/ui/page-transition";

export default function CreateIdeaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    body_text: "",
    status: "draft" as "draft" | "published",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 10) {
      newErrors.title = "Title must be at least 10 characters";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must not exceed 200 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 50) {
      newErrors.description = "Description must be at least 50 characters";
    } else if (formData.description.length > 1000) {
      newErrors.description = "Description must not exceed 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create idea');
      }

      // Show success state with animation
      setIsSuccess(true);
      
      // Wait for animation, then navigate
      setTimeout(() => {
        router.push(`/idea/${data.idea.id}`);
      }, 800);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create idea. Please try again.";
      alert(message);
      setIsSubmitting(false);
    }
  };

  // Success overlay
  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="animate-scale-in text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 animate-success-pulse">
            <IoCheckmarkCircle className="h-12 w-12 text-accent" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-text-main">Idea Created!</h2>
          <p className="text-text-muted">Redirecting to your idea...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-2 inline-flex items-center gap-1 text-sm text-text-muted transition-smooth hover:text-accent"
          >
            <IoChevronBack className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-text-main">Create New Idea</h1>
          <p className="mt-2 text-text-muted">
            Share your startup idea with the community
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
          {/* Title */}
          <div className="animate-slide-in-bottom" style={{ animationDelay: "50ms" }}>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-text-main">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="E.g., AI-powered platform for automated code reviews"
              className={`w-full rounded-lg border transition-smooth ${
                errors.title ? "border-red-500 animate-shake" : "border-border"
              } bg-surface px-4 py-3 text-text-main placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent`}
            />
            {errors.title && <p className="mt-1 animate-fade-in text-sm text-red-400">{errors.title}</p>}
            <p className="mt-1 text-sm text-text-muted">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div className="animate-slide-in-bottom" style={{ animationDelay: "100ms" }}>
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-text-main">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Provide a clear and concise summary of your idea. What problem does it solve? Who is the target audience?"
              className={`w-full rounded-lg border transition-smooth ${
                errors.description ? "border-red-500" : "border-border"
              } bg-surface px-4 py-3 text-text-main placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent`}
            />
            {errors.description && (
              <p className="mt-1 animate-fade-in text-sm text-red-400">{errors.description}</p>
            )}
            <p className="mt-1 text-sm text-text-muted">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Body Text (Optional) */}
          <div className="animate-slide-in-bottom" style={{ animationDelay: "150ms" }}>
            <label htmlFor="body_text" className="mb-2 block text-sm font-medium text-text-main">
              Extended Details <span className="text-text-muted">(optional)</span>
            </label>
            <textarea
              id="body_text"
              name="body_text"
              value={formData.body_text}
              onChange={handleChange}
              rows={10}
              placeholder="Add more details about your idea, such as implementation notes, potential features, monetization strategies, etc."
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-main transition-smooth placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Status */}
          <div className="animate-slide-in-bottom" style={{ animationDelay: "200ms" }}>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-text-main">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-main transition-smooth focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="draft">Draft (Only visible to you)</option>
              <option value="published">Published (Visible to everyone)</option>
            </select>
            <p className="mt-1 text-sm text-text-muted">
              You can change this later from your dashboard.
            </p>
          </div>

          {/* Info Box */}
          <div className="animate-slide-in-bottom rounded-lg border border-accent/20 bg-accent/5 p-4" style={{ animationDelay: "250ms" }}>
            <h3 className="mb-2 flex items-center gap-2 font-medium text-accent">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              AI-Powered Insights
            </h3>
            <p className="text-sm text-text-muted">
              Once published, our AI will analyze your idea and generate a Market Potential Score
              based on market relevance, scalability, monetization opportunities, and competition.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 animate-slide-in-bottom" style={{ animationDelay: "300ms" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-3 font-medium text-accent-foreground transition-smooth hover:opacity-90 hover-lift press-effect disabled:opacity-50 disabled:hover:transform-none"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {formData.status === "draft" ? "Save as Draft" : "Publish Idea"}
                </>
              )}
            </button>

            <Link
              href="/dashboard/ideas"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-8 py-3 font-medium transition-smooth hover:bg-border press-effect"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}

