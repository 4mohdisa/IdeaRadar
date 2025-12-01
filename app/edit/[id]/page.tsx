"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

export default function EditIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    body_text: "",
    status: "draft" as "draft" | "published" | "archived",
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchIdea = async () => {
      try {
        const response = await fetch(`/api/ideas/${id}`);
        if (!response.ok) {
          alert("Idea not found or you don't have permission to edit it.");
          router.push('/dashboard/ideas');
          return;
        }
        const data = await response.json();

        setFormData({
          title: data.title || '',
          description: data.description || '',
          body_text: data.body_text || '',
          status: data.status || 'draft',
        });
      } catch (error) {
        console.error("Error fetching idea:", error);
        alert("Failed to load idea.");
        router.push('/dashboard/ideas');
      } finally {
        setLoading(false);
      }
    };
    fetchIdea();
  }, [id, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      const response = await fetch(`/api/ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update idea');
      }

      router.push(`/idea/${id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update idea. Please try again.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-border"></div>
          <div className="h-12 animate-pulse rounded bg-border"></div>
          <div className="h-32 animate-pulse rounded bg-border"></div>
          <div className="h-64 animate-pulse rounded bg-border"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/ideas"
          className="mb-2 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-accent"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Ideas
        </Link>
        <h1 className="text-3xl font-bold text-text-main">Edit Idea</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-text-main">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full rounded-lg border ${
              errors.title ? "border-red-500" : "border-border"
            } bg-surface px-4 py-3 text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
          <p className="mt-1 text-sm text-text-muted">
            {formData.title.length}/200 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-text-main">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            className={`w-full rounded-lg border ${
              errors.description ? "border-red-500" : "border-border"
            } bg-surface px-4 py-3 text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-400">{errors.description}</p>
          )}
          <p className="mt-1 text-sm text-text-muted">
            {formData.description.length}/1000 characters
          </p>
        </div>

        {/* Body Text */}
        <div>
          <label htmlFor="body_text" className="mb-2 block text-sm font-medium text-text-main">
            Extended Details <span className="text-text-muted">(optional)</span>
          </label>
          <textarea
            id="body_text"
            name="body_text"
            value={formData.body_text}
            onChange={handleChange}
            rows={10}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="mb-2 block text-sm font-medium text-text-main">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-3 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
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
                Saving...
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
                Save Changes
              </>
            )}
          </button>

          <Link
            href="/dashboard/ideas"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-8 py-3 font-medium transition-colors hover:bg-border"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

