"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IoChevronBack } from "react-icons/io5";
import { IoMdAdd } from "react-icons/io";
import { HiDotsVertical } from "react-icons/hi";
import { MdEdit, MdDelete } from "react-icons/md";
import { FiFile } from "react-icons/fi";
import { IdeaCard } from "@/components/ui/idea-card";
import { PageTransition } from "@/components/ui/page-transition";
import { useGetUserIdeasQuery, useDeleteIdeaMutation } from "@/lib/store";

export default function MyIdeasPage() {
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading: loading } = useGetUserIdeasQuery({ 
    page: 1, 
    status: filter === "all" ? undefined : filter 
  });
  const [deleteIdea] = useDeleteIdeaMutation();
  
  const ideas = data?.ideas || [];

  const handleDelete = async (ideaId: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;
    
    setOpenMenuId(null);
    setDeletingId(ideaId);
    
    try {
      await deleteIdea(ideaId).unwrap();
      setTimeout(() => {
        setDeletingId(null);
      }, 400);
    } catch (error) {
      console.error("Error deleting idea:", error);
      setDeletingId(null);
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
    <PageTransition>
      <div className="container px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="overflow-hidden">
            <Link
              href="/dashboard"
              className="mb-2 inline-flex items-center gap-1 text-sm text-text-muted transition-smooth hover:text-accent"
            >
              <IoChevronBack className="h-4 w-4 shrink-0" />
              Back to Dashboard
            </Link>
            <h1 className="break-words text-2xl font-bold text-text-main sm:text-3xl">My Ideas</h1>
          </div>
          <Link
            href="/create"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-smooth hover:opacity-90 hover-lift press-effect"
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
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-smooth press-effect ${
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
              <div key={i} className="h-64 animate-shimmer rounded-lg"></div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && ideas.length === 0 && (
          <div className="animate-scale-in rounded-lg border border-border bg-surface p-12 text-center">
            <FiFile className="mx-auto mb-4 h-16 w-16 text-text-muted" />
            <h3 className="mb-2 text-xl font-semibold text-text-main">No ideas yet</h3>
            <p className="mb-6 text-text-muted">
              {filter === "all"
                ? "Start by creating your first idea!"
                : `No ${filter} ideas found.`}
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-smooth hover:opacity-90 hover-lift press-effect"
            >
              <IoMdAdd className="h-5 w-5" />
              Create Your First Idea
            </Link>
          </div>
        )}

        {/* Ideas Grid */}
        {!loading && ideas.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea, index) => (
              <div
                key={idea.id}
                className={`relative overflow-hidden transition-all duration-300 ${
                  deletingId === idea.id ? "animate-delete" : "animate-scale-in"
                }`}
                style={{ animationDelay: deletingId ? "0ms" : `${index * 50}ms` }}
              >
                <IdeaCard idea={idea} userVote={null} isBookmarked={false} showStatus={true} />
                
                {/* Three-Dot Menu */}
                <div className="absolute right-16 top-4 z-10 sm:right-[72px]" data-dropdown-menu>
                  <button
                    onClick={() => toggleMenu(idea.id)}
                    className="rounded-lg bg-surface/90 p-2 backdrop-blur transition-smooth hover:bg-accent hover:text-accent-foreground press-effect"
                    title="Options"
                    aria-label="Open menu"
                  >
                    <HiDotsVertical className="h-5 w-5" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === idea.id && (
                    <div className="absolute right-0 top-12 z-20 min-w-[160px] animate-scale-in overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                      <Link
                        href={`/edit/${idea.id}`}
                        onClick={() => setOpenMenuId(null)}
                        className="flex items-center gap-3 px-4 py-3 text-sm transition-smooth hover:bg-accent/10 hover:text-accent"
                      >
                        <MdEdit className="h-4 w-4 shrink-0" />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(idea.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-smooth hover:bg-red-500/10 hover:text-red-400"
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
    </PageTransition>
  );
}

