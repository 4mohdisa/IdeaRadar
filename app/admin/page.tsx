"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Brain, 
  Users, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Bookmark,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Calendar,
  Target,
  BarChart3,
  Activity,
  Zap,
  Database
} from "lucide-react"

interface OverviewData {
  platform: {
    ideas: {
      total: number
      today: number
      yesterday: number
      last7Days: number
      last30Days: number
      growth: number
    }
    users: {
      total: number
      today: number
      last7Days: number
      last30Days: number
    }
    comments: {
      total: number
      today: number
      last7Days: number
    }
    votes: {
      total: number
      upvotes: number
      downvotes: number
      today: number
      last7Days: number
    }
    bookmarks: number
    sourceDistribution: {
      reddit: number
      user: number
    }
    statusDistribution: {
      published: number
      draft: number
      archived: number
    }
  }
  scores: {
    average: number
    max: number
    min: number
    distribution: {
      excellent: number
      good: number
      moderate: number
      low: number
      unscored: number
    }
  }
  engagement: {
    totalUpvotes: number
    totalDownvotes: number
    totalComments: number
    avgUpvotesPerIdea: number
    avgCommentsPerIdea: number
    topByScore: Array<{ id: string; score: number }>
    topByEngagement: Array<{ id: string; netVotes: number }>
  }
  training: {
    total: number
    validated: number
    trained: number
    pendingValidation: number
    readyForTraining: number
    avgEngagement: number
    recentlyAdded: number
  }
  ai: {
    currentModel: string
    baseModel: string
    fineTunedModel: string | null
    hasFineTunedModel: boolean
  }
  fineTuning: {
    totalJobs: number
    successful: number
    failed: number
    running: number
    recentJobs: Array<{
      status: string
      model_fine_tuned: string | null
      created_at: string
    }>
  }
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle,
  trend,
  color = "accent"
}: { 
  title: string
  value: number | string
  icon: React.ElementType
  subtitle?: string
  trend?: { value: number; label: string }
  color?: "accent" | "green" | "yellow" | "red" | "blue" | "purple"
}) {
  const colorClasses = {
    accent: "bg-accent/10 text-accent",
    green: "bg-green-500/10 text-green-500",
    yellow: "bg-yellow-500/10 text-yellow-500",
    red: "bg-red-500/10 text-red-500",
    blue: "bg-blue-500/10 text-blue-500",
    purple: "bg-purple-500/10 text-purple-500",
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-muted">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
          {trend && (
            <div className={`mt-2 flex items-center gap-1 text-xs ${trend.value >= 0 ? "text-green-500" : "text-red-500"}`}>
              {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function MiniStatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon?: React.ElementType }) {
  return (
    <div className="rounded-lg bg-background p-3 text-center">
      <div className="flex items-center justify-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-text-muted" />}
        <p className="text-xl font-bold">{value}</p>
      </div>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
    </div>
  )
}

function ProgressBar({ value, max, label, color = "accent" }: { value: number; max: number; label: string; color?: string }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  
  const colorClass = {
    accent: "bg-accent",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
  }[color] || "bg-accent"
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-text-muted">{label}</span>
        <span className="font-medium">{value} / {max}</span>
      </div>
      <div className="h-2 rounded-full bg-border">
        <div 
          className={`h-2 rounded-full transition-all ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function ScoreBar({ label, value, maxValue = 100, color }: { label: string; value: number; maxValue?: number; color: string }) {
  const percentage = (value / maxValue) * 100
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-text-muted">{label}</span>
      <div className="flex-1">
        <div className="h-6 rounded bg-border">
          <div 
            className={`h-6 rounded ${color} flex items-center justify-end pr-2`}
            style={{ width: `${Math.max(percentage, 10)}%` }}
          >
            <span className="text-xs font-medium text-white">{value}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/overview")

      if (!res.ok) {
        if (res.status === 401) {
          setError("Unauthorized. You must be an admin to access this page.")
          return
        }
        throw new Error("Failed to fetch data")
      }

      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-accent" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-text-muted">{error}</p>
          <Link 
            href="/"
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-text-muted">Platform analytics and AI training management</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-border"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8 flex gap-2 border-b border-border pb-4">
        <Link
          href="/admin"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
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
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface"
        >
          Fine-Tuning Jobs
        </Link>
      </div>

      {/* Key Metrics Row */}
      <section className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Activity className="h-5 w-5 text-accent" />
          Key Metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <StatCard
            title="Total Ideas"
            value={data.platform.ideas.total}
            icon={Lightbulb}
            subtitle={`+${data.platform.ideas.today} today`}
            trend={data.platform.ideas.growth !== 0 ? { value: data.platform.ideas.growth, label: "vs yesterday" } : undefined}
          />
          <StatCard
            title="Total Users"
            value={data.platform.users.total}
            icon={Users}
            subtitle={`+${data.platform.users.today} today`}
            color="blue"
          />
          <StatCard
            title="Comments"
            value={data.platform.comments.total}
            icon={MessageSquare}
            subtitle={`+${data.platform.comments.today} today`}
            color="green"
          />
          <StatCard
            title="Total Votes"
            value={data.platform.votes.total}
            icon={ThumbsUp}
            subtitle={`↑${data.platform.votes.upvotes} ↓${data.platform.votes.downvotes}`}
            color="yellow"
          />
          <StatCard
            title="Bookmarks"
            value={data.platform.bookmarks}
            icon={Bookmark}
            color="red"
          />
          <StatCard
            title="Avg Score"
            value={data.scores.average}
            icon={Target}
            subtitle={`Max: ${data.scores.max} | Min: ${data.scores.min}`}
            color="purple"
          />
        </div>
      </section>

      {/* Time-based Analytics */}
      <section className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Calendar className="h-5 w-5 text-accent" />
          Activity Over Time
        </h2>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-medium text-text-muted">Ideas</h3>
            <div className="grid grid-cols-3 gap-2">
              <MiniStatCard label="Today" value={data.platform.ideas.today} />
              <MiniStatCard label="7 Days" value={data.platform.ideas.last7Days} />
              <MiniStatCard label="30 Days" value={data.platform.ideas.last30Days} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-medium text-text-muted">Users</h3>
            <div className="grid grid-cols-3 gap-2">
              <MiniStatCard label="Today" value={data.platform.users.today} />
              <MiniStatCard label="7 Days" value={data.platform.users.last7Days} />
              <MiniStatCard label="30 Days" value={data.platform.users.last30Days} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-medium text-text-muted">Comments</h3>
            <div className="grid grid-cols-2 gap-2">
              <MiniStatCard label="Today" value={data.platform.comments.today} />
              <MiniStatCard label="7 Days" value={data.platform.comments.last7Days} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-medium text-text-muted">Votes</h3>
            <div className="grid grid-cols-2 gap-2">
              <MiniStatCard label="Today" value={data.platform.votes.today} />
              <MiniStatCard label="7 Days" value={data.platform.votes.last7Days} />
            </div>
          </div>
        </div>
      </section>

      {/* Score Distribution & Engagement */}
      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        {/* Score Distribution */}
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-accent" />
            Score Distribution
          </h2>
          <div className="space-y-3">
            <ScoreBar 
              label="Excellent" 
              value={data.scores.distribution.excellent} 
              maxValue={data.platform.ideas.total || 1}
              color="bg-green-500" 
            />
            <ScoreBar 
              label="Good" 
              value={data.scores.distribution.good} 
              maxValue={data.platform.ideas.total || 1}
              color="bg-blue-500" 
            />
            <ScoreBar 
              label="Moderate" 
              value={data.scores.distribution.moderate} 
              maxValue={data.platform.ideas.total || 1}
              color="bg-yellow-500" 
            />
            <ScoreBar 
              label="Low" 
              value={data.scores.distribution.low} 
              maxValue={data.platform.ideas.total || 1}
              color="bg-red-500" 
            />
            <ScoreBar 
              label="Unscored" 
              value={data.scores.distribution.unscored} 
              maxValue={data.platform.ideas.total || 1}
              color="bg-gray-500" 
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border pt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-green-500">80+</p>
              <p className="text-xs text-text-muted">Excellent</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-500">60-79</p>
              <p className="text-xs text-text-muted">Good</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-yellow-500">40-59</p>
              <p className="text-xs text-text-muted">Moderate</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-500">&lt;40</p>
              <p className="text-xs text-text-muted">Low</p>
            </div>
          </div>
        </section>

        {/* Engagement Stats */}
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Zap className="h-5 w-5 text-accent" />
            Engagement Analytics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-background p-4">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{data.engagement.totalUpvotes}</span>
              </div>
              <p className="mt-1 text-sm text-text-muted">Total Upvotes</p>
              <p className="text-xs text-text-muted">~{data.engagement.avgUpvotesPerIdea} per idea</p>
            </div>
            <div className="rounded-lg bg-background p-4">
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{data.engagement.totalDownvotes}</span>
              </div>
              <p className="mt-1 text-sm text-text-muted">Total Downvotes</p>
            </div>
            <div className="rounded-lg bg-background p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{data.engagement.totalComments}</span>
              </div>
              <p className="mt-1 text-sm text-text-muted">Total Comments</p>
              <p className="text-xs text-text-muted">~{data.engagement.avgCommentsPerIdea} per idea</p>
            </div>
            <div className="rounded-lg bg-background p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span className="text-2xl font-bold">
                  {Math.round((data.engagement.totalUpvotes / (data.engagement.totalUpvotes + data.engagement.totalDownvotes || 1)) * 100)}%
                </span>
              </div>
              <p className="mt-1 text-sm text-text-muted">Positive Rate</p>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <h4 className="mb-2 text-sm font-medium">Idea Sources</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-accent" />
                <span className="text-sm">Community: {data.platform.sourceDistribution.user}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm">Reddit: {data.platform.sourceDistribution.reddit}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Training Data & AI Model */}
      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        {/* Training Data */}
        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Database className="h-5 w-5 text-accent" />
              Training Data
            </h2>
            <Link
              href="/admin/training"
              className="text-sm text-accent hover:underline"
            >
              Manage →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-background p-3 text-center">
              <p className="text-2xl font-bold">{data.training.total}</p>
              <p className="text-xs text-text-muted">Total Records</p>
            </div>
            <div className="rounded-lg bg-green-500/10 p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{data.training.validated}</p>
              <p className="text-xs text-text-muted">Validated</p>
            </div>
            <div className="rounded-lg bg-accent/10 p-3 text-center">
              <p className="text-2xl font-bold text-accent">{data.training.trained}</p>
              <p className="text-xs text-text-muted">Used in Training</p>
            </div>
          </div>

          <div className="space-y-3">
            <ProgressBar
              value={data.training.validated}
              max={data.training.total || 1}
              label="Validation Progress"
              color="green"
            />
            <ProgressBar
              value={data.training.readyForTraining}
              max={50}
              label="Ready for Training (need 50+)"
              color="accent"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            <div className="rounded-lg bg-background p-3">
              <p className="text-lg font-bold">{data.training.pendingValidation}</p>
              <p className="text-xs text-text-muted">Pending Validation</p>
            </div>
            <div className="rounded-lg bg-background p-3">
              <p className="text-lg font-bold">{data.training.avgEngagement}</p>
              <p className="text-xs text-text-muted">Avg Engagement Score</p>
            </div>
          </div>
        </section>

        {/* AI Model Status */}
        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Brain className="h-5 w-5 text-accent" />
              AI Model Status
            </h2>
            <Link
              href="/admin/fine-tuning"
              className="text-sm text-accent hover:underline"
            >
              Manage →
            </Link>
          </div>

          <div className="rounded-lg bg-background p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${data.ai.hasFineTunedModel ? "bg-green-500/20" : "bg-yellow-500/20"}`}>
                <Brain className={`h-6 w-6 ${data.ai.hasFineTunedModel ? "text-green-500" : "text-yellow-500"}`} />
              </div>
              <div>
                <p className="text-sm text-text-muted">Current Model</p>
                <p className="font-mono text-sm font-medium truncate max-w-[250px]">
                  {data.ai.currentModel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-background p-3">
              <p className="text-xs text-text-muted">Base Model</p>
              <p className="mt-1 font-mono text-xs truncate">{data.ai.baseModel}</p>
            </div>
            <div className="rounded-lg bg-background p-3">
              <p className="text-xs text-text-muted">Fine-Tuned</p>
              <p className="mt-1 font-mono text-xs truncate">
                {data.ai.fineTunedModel ? data.ai.fineTunedModel.slice(0, 25) + "..." : "None"}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="mb-3 text-sm font-medium">Fine-Tuning Jobs</h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg bg-background p-2 text-center">
                <p className="text-lg font-bold">{data.fineTuning.totalJobs}</p>
                <p className="text-xs text-text-muted">Total</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-2 text-center">
                <p className="text-lg font-bold text-green-500">{data.fineTuning.successful}</p>
                <p className="text-xs text-text-muted">Success</p>
              </div>
              <div className="rounded-lg bg-red-500/10 p-2 text-center">
                <p className="text-lg font-bold text-red-500">{data.fineTuning.failed}</p>
                <p className="text-xs text-text-muted">Failed</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-2 text-center">
                <p className="text-lg font-bold text-blue-500">{data.fineTuning.running}</p>
                <p className="text-xs text-text-muted">Running</p>
              </div>
            </div>
          </div>

          {data.fineTuning.recentJobs.length > 0 && (
            <div className="mt-4 space-y-2">
              {data.fineTuning.recentJobs.slice(0, 3).map((job, i) => (
                <div key={i} className="flex items-center justify-between rounded bg-background p-2 text-sm">
                  <span className="flex items-center gap-2">
                    {job.status === "succeeded" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : job.status === "running" || job.status === "queued" ? (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="capitalize">{job.status}</span>
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Status Distribution */}
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Activity className="h-5 w-5 text-accent" />
          Idea Status Distribution
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-green-500/10 p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{data.platform.statusDistribution.published}</p>
            <p className="text-sm text-text-muted">Published</p>
          </div>
          <div className="rounded-lg bg-yellow-500/10 p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">{data.platform.statusDistribution.draft}</p>
            <p className="text-sm text-text-muted">Draft</p>
          </div>
          <div className="rounded-lg bg-gray-500/10 p-4 text-center">
            <p className="text-3xl font-bold text-gray-400">{data.platform.statusDistribution.archived}</p>
            <p className="text-sm text-text-muted">Archived</p>
          </div>
        </div>
      </section>
    </div>
  )
}
