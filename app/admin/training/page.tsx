"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Check,
  X,
  Star,
  Eye,
  Trash2,
  Filter,
  Download,
  AlertCircle
} from "lucide-react"

interface TrainingDataRecord {
  id: string
  idea_id: string
  idea_title: string
  idea_description: string
  idea_body: string | null
  comments_context: string | null
  score: number
  score_breakdown: Record<string, number> | null
  ai_summary: string | null
  strengths: string[] | null
  challenges: string[] | null
  target_market: string | null
  next_steps: string[] | null
  upvotes: number
  downvotes: number
  comments_count: number
  bookmarks_count: number
  engagement_score: number
  is_validated: boolean
  validation_source: string | null
  quality_rating: number | null
  included_in_training: boolean
  training_job_id: string | null
  training_batch: string | null
  created_at: string
  updated_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function RatingStars({ 
  rating, 
  onRate 
}: { 
  rating: number | null
  onRate: (rating: number) => void 
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate(star)}
          className={`transition-colors ${
            rating && star <= rating ? "text-yellow-500" : "text-border hover:text-yellow-500/50"
          }`}
        >
          <Star className="h-4 w-4 fill-current" />
        </button>
      ))}
    </div>
  )
}

function ScoreBreakdownModal({ 
  record, 
  onClose 
}: { 
  record: TrainingDataRecord
  onClose: () => void 
}) {
  const breakdown = record.score_breakdown || {}
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Training Data Details</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title & Score */}
          <div>
            <p className="text-sm text-text-muted">Title</p>
            <p className="font-medium">{record.idea_title}</p>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-text-muted">Total Score</p>
              <p className="text-2xl font-bold text-accent">{record.score}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Engagement</p>
              <p className="text-2xl font-bold">{record.engagement_score}</p>
            </div>
          </div>

          {/* Score Breakdown */}
          {Object.keys(breakdown).length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-text-muted">Score Breakdown</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(breakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between rounded bg-background p-2 text-sm">
                    <span className="text-text-muted">{key.replace(/_/g, " ")}</span>
                    <span className="font-medium">{value}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {record.ai_summary && (
            <div>
              <p className="mb-2 text-sm font-medium text-text-muted">AI Summary</p>
              <p className="rounded bg-background p-3 text-sm">{record.ai_summary}</p>
            </div>
          )}

          {/* Strengths & Challenges */}
          <div className="grid grid-cols-2 gap-4">
            {record.strengths && record.strengths.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-green-500">Strengths</p>
                <ul className="space-y-1">
                  {record.strengths.map((s, i) => (
                    <li key={i} className="text-sm">• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {record.challenges && record.challenges.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-red-500">Challenges</p>
                <ul className="space-y-1">
                  {record.challenges.map((c, i) => (
                    <li key={i} className="text-sm">• {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Comments Context */}
          {record.comments_context && (
            <div>
              <p className="mb-2 text-sm font-medium text-text-muted">Comments Context</p>
              <p className="max-h-40 overflow-y-auto rounded bg-background p-3 text-sm">
                {record.comments_context}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
            <div>
              <span className="text-text-muted">Validation Source:</span>{" "}
              <span className="capitalize">{record.validation_source || "None"}</span>
            </div>
            <div>
              <span className="text-text-muted">Training Batch:</span>{" "}
              <span>{record.training_batch || "Not trained"}</span>
            </div>
            <div>
              <span className="text-text-muted">Created:</span>{" "}
              <span>{new Date(record.created_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-text-muted">Idea ID:</span>{" "}
              <span className="font-mono text-xs">{record.idea_id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TrainingDataPage() {
  const [data, setData] = useState<TrainingDataRecord[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<TrainingDataRecord | null>(null)
  
  // Filters
  const [validatedFilter, setValidatedFilter] = useState<string>("all")
  const [trainedFilter, setTrainedFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      })

      if (validatedFilter !== "all") {
        params.set("validated", validatedFilter)
      }
      if (trainedFilter !== "all") {
        params.set("trained", trainedFilter)
      }

      const res = await fetch(`/api/admin/training-data?${params}`)
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Unauthorized. You must be an admin.")
          return
        }
        throw new Error("Failed to fetch data")
      }

      const result = await res.json()
      setData(result.data || [])
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, validatedFilter, trainedFilter, sortBy, sortOrder])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function updateRecord(id: string, updates: Record<string, unknown>) {
    try {
      const res = await fetch("/api/admin/training-data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!res.ok) throw new Error("Failed to update")

      // Refresh data
      fetchData()
    } catch (err) {
      console.error("Error updating record:", err)
    }
  }

  async function deleteRecord(id: string) {
    if (!confirm("Are you sure you want to delete this training data?")) return

    try {
      const res = await fetch(`/api/admin/training-data?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      fetchData()
    } catch (err) {
      console.error("Error deleting record:", err)
    }
  }

  async function exportJSONL() {
    try {
      const res = await fetch("/api/admin/training-data/export")
      if (!res.ok) throw new Error("Failed to export")
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `training_data_${new Date().toISOString().split("T")[0]}.jsonl`
      a.click()
    } catch (err) {
      console.error("Error exporting:", err)
    }
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-text-muted">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-text-muted hover:text-text-main">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Training Data</h1>
            <p className="mt-1 text-text-muted">
              {pagination.total} records • {data.filter(d => d.is_validated).length} validated on this page
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8 flex gap-2 border-b border-border pb-4">
        <Link
          href="/admin"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface"
        >
          Overview
        </Link>
        <Link
          href="/admin/training"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Training Data
        </Link>
        <Link
          href="/admin/fine-tuning"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface"
        >
          Fine-Tuning Jobs
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
          <select
            value={validatedFilter}
            onChange={(e) => {
              setValidatedFilter(e.target.value)
              setPagination(p => ({ ...p, page: 1 }))
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="all">All Validation</option>
            <option value="true">Validated</option>
            <option value="false">Not Validated</option>
          </select>

          <select
            value={trainedFilter}
            onChange={(e) => {
              setTrainedFilter(e.target.value)
              setPagination(p => ({ ...p, page: 1 }))
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="all">All Training</option>
            <option value="true">Used in Training</option>
            <option value="false">Not Trained</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split("-")
              setSortBy(by)
              setSortOrder(order)
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="engagement_score-desc">Highest Engagement</option>
            <option value="score-desc">Highest Score</option>
            <option value="score-asc">Lowest Score</option>
          </select>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-surface"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportJSONL}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
          >
            <Download className="h-4 w-4" />
            Export JSONL
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-surface">
            <tr className="text-left text-sm text-text-muted">
              <th className="p-4">Title</th>
              <th className="p-4">Score</th>
              <th className="p-4">Engagement</th>
              <th className="p-4">Validated</th>
              <th className="p-4">Quality</th>
              <th className="p-4">Trained</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-accent" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-muted">
                  No training data found
                </td>
              </tr>
            ) : (
              data.map((record) => (
                <tr key={record.id} className="hover:bg-surface/50">
                  <td className="max-w-xs p-4">
                    <p className="truncate font-medium">{record.idea_title}</p>
                    <p className="truncate text-xs text-text-muted">
                      {record.idea_description.slice(0, 60)}...
                    </p>
                  </td>
                  <td className="p-4">
                    <span className={`font-bold ${
                      record.score >= 80 ? "text-green-500" :
                      record.score >= 60 ? "text-blue-500" :
                      record.score >= 40 ? "text-yellow-500" : "text-red-500"
                    }`}>
                      {record.score}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-medium">{record.engagement_score}</span>
                    <p className="text-xs text-text-muted">
                      ↑{record.upvotes} ↓{record.downvotes} 💬{record.comments_count}
                    </p>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => updateRecord(record.id, { 
                        isValidated: !record.is_validated,
                        validationSource: !record.is_validated ? "manual" : null
                      })}
                      className={`rounded-full p-1 ${
                        record.is_validated 
                          ? "bg-green-500/20 text-green-500" 
                          : "bg-border text-text-muted hover:bg-yellow-500/20 hover:text-yellow-500"
                      }`}
                    >
                      {record.is_validated ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="p-4">
                    <RatingStars
                      rating={record.quality_rating}
                      onRate={(rating) => updateRecord(record.id, { qualityRating: rating })}
                    />
                  </td>
                  <td className="p-4">
                    {record.included_in_training ? (
                      <span className="rounded-full bg-accent/20 px-2 py-1 text-xs text-accent">
                        Trained
                      </span>
                    ) : (
                      <span className="rounded-full bg-border px-2 py-1 text-xs text-text-muted">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="rounded p-1 text-text-muted hover:bg-surface hover:text-text-main"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteRecord(record.id)}
                        className="rounded p-1 text-text-muted hover:bg-red-500/20 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex items-center px-3 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <ScoreBreakdownModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  )
}
