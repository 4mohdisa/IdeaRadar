"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  RefreshCw, 
  ChevronLeft,
  Play,
  Square,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Brain,
  Settings,
  Loader2
} from "lucide-react"

interface FineTuningJob {
  id: string
  openaiJobId: string | null
  modelBase: string
  modelFineTuned: string | null
  trainingFileId: string | null
  validationFileId: string | null
  hyperparameters: Record<string, unknown> | null
  status: "pending" | "uploading" | "queued" | "running" | "succeeded" | "failed" | "cancelled"
  errorMessage: string | null
  trainingExamplesCount: number | null
  validationExamplesCount: number | null
  trainedTokens: number | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  notes: string | null
  createdBy: string | null
}

function StatusBadge({ status }: { status: FineTuningJob["status"] }) {
  const config = {
    pending: { icon: Clock, color: "bg-gray-500/20 text-gray-400", label: "Pending" },
    uploading: { icon: Loader2, color: "bg-blue-500/20 text-blue-500", label: "Uploading" },
    queued: { icon: Clock, color: "bg-yellow-500/20 text-yellow-500", label: "Queued" },
    running: { icon: Loader2, color: "bg-blue-500/20 text-blue-500", label: "Running" },
    succeeded: { icon: CheckCircle, color: "bg-green-500/20 text-green-500", label: "Succeeded" },
    failed: { icon: XCircle, color: "bg-red-500/20 text-red-500", label: "Failed" },
    cancelled: { icon: Square, color: "bg-gray-500/20 text-gray-400", label: "Cancelled" },
  }

  const { icon: Icon, color, label } = config[status]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${color}`}>
      <Icon className={`h-4 w-4 ${status === "running" || status === "uploading" ? "animate-spin" : ""}`} />
      {label}
    </span>
  )
}

function CreateJobModal({ 
  onClose, 
  onCreated 
}: { 
  onClose: () => void
  onCreated: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    modelBase: "gpt-4o-mini-2024-07-18",
    validationSplit: 0.2,
    minEngagementScore: 0,
    minQualityRating: 0,
    nEpochs: 3,
    notes: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/fine-tuning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelBase: formData.modelBase,
          validationSplit: formData.validationSplit,
          minEngagementScore: formData.minEngagementScore || undefined,
          minQualityRating: formData.minQualityRating || undefined,
          hyperparameters: {
            nEpochs: formData.nEpochs,
          },
          notes: formData.notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create job")
      }

      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Create Fine-Tuning Job</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Base Model</label>
            <select
              value={formData.modelBase}
              onChange={(e) => setFormData({ ...formData, modelBase: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="gpt-4o-mini-2024-07-18">gpt-4o-mini-2024-07-18 (Recommended)</option>
              <option value="gpt-4o-2024-08-06">gpt-4o-2024-08-06 (Higher Quality)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Validation Split</label>
              <select
                value={formData.validationSplit}
                onChange={(e) => setFormData({ ...formData, validationSplit: parseFloat(e.target.value) })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="0">No Validation</option>
                <option value="0.1">10%</option>
                <option value="0.2">20% (Recommended)</option>
                <option value="0.3">30%</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Epochs</label>
              <select
                value={formData.nEpochs}
                onChange={(e) => setFormData({ ...formData, nEpochs: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="1">1 Epoch</option>
                <option value="2">2 Epochs</option>
                <option value="3">3 Epochs (Recommended)</option>
                <option value="4">4 Epochs</option>
                <option value="5">5 Epochs</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Min Engagement Score</label>
              <input
                type="number"
                value={formData.minEngagementScore}
                onChange={(e) => setFormData({ ...formData, minEngagementScore: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                min="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Min Quality Rating</label>
              <select
                value={formData.minQualityRating}
                onChange={(e) => setFormData({ ...formData, minQualityRating: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="0">Any Rating</option>
                <option value="1">1+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="5">5 Stars Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              rows={2}
              placeholder="Add notes about this training run..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Training
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FineTuningPage() {
  const [jobs, setJobs] = useState<FineTuningJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshingJob, setRefreshingJob] = useState<string | null>(null)

  async function fetchJobs() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/fine-tuning")
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Unauthorized. You must be an admin.")
          return
        }
        throw new Error("Failed to fetch jobs")
      }

      const data = await res.json()
      setJobs(data.jobs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs")
    } finally {
      setLoading(false)
    }
  }

  async function refreshJobStatus(jobId: string) {
    setRefreshingJob(jobId)
    
    try {
      const res = await fetch(`/api/admin/fine-tuning?jobId=${jobId}`)
      if (!res.ok) throw new Error("Failed to refresh")
      
      const data = await res.json()
      
      // Update the job in the list
      setJobs(jobs.map(j => j.id === jobId ? data.job : j))
    } catch (err) {
      console.error("Error refreshing job:", err)
    } finally {
      setRefreshingJob(null)
    }
  }

  async function cancelJob(jobId: string) {
    if (!confirm("Are you sure you want to cancel this job?")) return

    try {
      const res = await fetch(`/api/admin/fine-tuning?jobId=${jobId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to cancel")

      fetchJobs()
    } catch (err) {
      console.error("Error cancelling job:", err)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  // Auto-refresh running jobs
  useEffect(() => {
    const runningJobs = jobs.filter(j => j.status === "running" || j.status === "queued" || j.status === "uploading")
    
    if (runningJobs.length === 0) return

    const interval = setInterval(() => {
      runningJobs.forEach(job => refreshJobStatus(job.id))
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [jobs])

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
            <h1 className="text-3xl font-bold">Fine-Tuning Jobs</h1>
            <p className="mt-1 text-text-muted">
              Manage OpenAI fine-tuning jobs for the scoring model
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
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface"
        >
          Training Data
        </Link>
        <Link
          href="/admin/fine-tuning"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Fine-Tuning Jobs
        </Link>
      </div>

      {/* Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Brain className="h-8 w-8 text-accent" />
          <div>
            <p className="font-medium">Create a new fine-tuning job</p>
            <p className="text-sm text-text-muted">
              Train a custom model using your validated training data
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchJobs}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-surface"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            <Play className="h-4 w-4" />
            New Job
          </button>
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <Settings className="mx-auto h-12 w-12 text-text-muted" />
          <h3 className="mt-4 text-lg font-medium">No Fine-Tuning Jobs</h3>
          <p className="mt-2 text-text-muted">
            Create your first fine-tuning job to train a custom scoring model
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            <Play className="h-4 w-4" />
            Create Job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-lg border border-border bg-surface p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-accent/10 p-3">
                    <Brain className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{job.modelBase}</p>
                      <StatusBadge status={job.status} />
                    </div>
                    {job.modelFineTuned && (
                      <p className="mt-1 font-mono text-sm text-accent">
                        {job.modelFineTuned}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-text-muted">
                      <span>
                        Training: {job.trainingExamplesCount || 0} examples
                      </span>
                      {job.validationExamplesCount && job.validationExamplesCount > 0 && (
                        <span>
                          Validation: {job.validationExamplesCount} examples
                        </span>
                      )}
                      {job.trainedTokens && (
                        <span>
                          Tokens: {job.trainedTokens.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {job.notes && (
                      <p className="mt-2 text-sm text-text-muted">
                        Note: {job.notes}
                      </p>
                    )}
                    {job.errorMessage && (
                      <p className="mt-2 text-sm text-red-500">
                        Error: {job.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(job.status === "running" || job.status === "queued") && (
                    <button
                      onClick={() => cancelJob(job.id)}
                      className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => refreshJobStatus(job.id)}
                    disabled={refreshingJob === job.id}
                    className="rounded-lg border border-border p-2 hover:bg-background disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshingJob === job.id ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex gap-4 border-t border-border pt-4 text-xs text-text-muted">
                <span>Created: {new Date(job.createdAt).toLocaleString()}</span>
                {job.startedAt && (
                  <span>Started: {new Date(job.startedAt).toLocaleString()}</span>
                )}
                {job.completedAt && (
                  <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
                )}
                {job.openaiJobId && (
                  <span className="font-mono">OpenAI ID: {job.openaiJobId}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateJobModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchJobs}
        />
      )}
    </div>
  )
}
