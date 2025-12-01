"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IoChevronBack } from "react-icons/io5";
import { IoMdAdd } from "react-icons/io";
import { HiDotsVertical } from "react-icons/hi";
import { MdEdit, MdDelete } from "react-icons/md";
import { FiFile } from "react-icons/fi";
import type { Idea } from "@/lib/types";
import { IdeaCard } from "@/components/ui/idea-card";

export default function MyIdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/dashboard/ideas?status=${filter}`);
        if (response.ok) {
          const data = await response.json();
          setIdeas(data.ideas || []);
        }
      } catch (error) {
        console.error("Error fetching ideas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, [filter]);

  const handleDelete = async (ideaId: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;
    
    setOpenMenuId(null); // Close menu
    
    try {
      const response = await fetch(`/api/ideas/${ideaId}`, { method: 'DELETE' });
      if (response.ok) {
        setIdeas(ideas.filter((idea) => idea.id !== ideaId));
      } else {
        alert("Failed to delete idea");
      }
    } catch (error) {
      console.error("Error deleting idea:", error);
      alert("Failed to delete idea");
    }
  };

  const toggleMenu = (ideaId: string) => {
    setOpenMenuId(openMenuId === ideaId ? null : ideaId);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown-menu]')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // TODO: Implement status change functionality
  // const handleStatusChange = async (
  //   ideaId: string,
  //   newStatus: "draft" | "published" | "archived"
  // ) => {
  //   // API call to update status
  //   await fetch(`/api/ideas/${ideaId}`, {
  //     method: 'PATCH',
  //     body: JSON.stringify({ status: newStatus }),
  //   });
  //   setIdeas(
  //     ideas.map((idea) => (idea.id === ideaId ? { ...idea, status: newStatus } : idea))
  //   );
  // };

  return (
    <div className="container px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="overflow-hidden">
          <Link
            href="/dashboard"
            className="mb-2 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-accent"
          >
            <IoChevronBack className="h-4 w-4 shrink-0" />
            Back to Dashboard
          </Link>
          <h1 className="break-words text-2xl font-bold text-text-main sm:text-3xl">My Ideas</h1>
        </div>
        <Link
          href="/create"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          <IoMdAdd className="h-5 w-5" />
          Create New Idea
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {(["all", "published", "draft", "archived"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === status
                ? "bg-accent text-accent-foreground"
                : "border border-border bg-surface hover:bg-border"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-border"></div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && ideas.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <FiFile className="mx-auto mb-4 h-16 w-16 text-text-muted" />
          <h3 className="mb-2 text-xl font-semibold text-text-main">No ideas yet</h3>
          <p className="mb-6 text-text-muted">
            {filter === "all"
              ? "Start by creating your first idea!"
              : `No ${filter} ideas found.`}
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            <IoMdAdd className="h-5 w-5" />
            Create Your First Idea
          </Link>
        </div>
      )}

      {/* Ideas Grid */}
      {!loading && ideas.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <div key={idea.id} className="relative overflow-hidden">
              <IdeaCard idea={idea} userVote={null} isBookmarked={false} />
              
              {/* Three-Dot Menu */}
              <div className="absolute right-16 top-4 z-10 sm:right-[72px]" data-dropdown-menu>
                <button
                  onClick={() => toggleMenu(idea.id)}
                  className="rounded-lg bg-surface/90 p-2 backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground"
                  title="Options"
                  aria-label="Open menu"
                >
                  <HiDotsVertical className="h-5 w-5" />
                </button>

                {/* Dropdown Menu */}
                {openMenuId === idea.id && (
                  <div className="absolute right-0 top-12 z-20 min-w-[160px] overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                    <Link
                      href={`/edit/${idea.id}`}
                      onClick={() => setOpenMenuId(null)}
                      className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent/10 hover:text-accent"
                    >
                      <MdEdit className="h-4 w-4 shrink-0" />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <MdDelete className="h-4 w-4 shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

