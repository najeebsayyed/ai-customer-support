import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  CheckCheck,
  CheckCircle2,
  Clock,
  Inbox,
  Mail,
  RefreshCw,
  XCircle,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchOverview, pollInbox } from "@/lib/api"
import { formatDate, timeAgo, type OverviewStats } from "@/lib/types"

interface OverviewPageProps {
  onNavigateToTab: (tab: "events" | "tickets" | "knowledge-base") => void
}

export function OverviewPage({ onNavigateToTab }: OverviewPageProps) {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const [pollResult, setPollResult] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchOverview()
      setStats(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load overview data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    async function init() {
      try {
        setError(null)
        const data = await fetchOverview()
        if (!ignore) {
          setStats(data)
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load overview data")
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }
    void init()
    return () => {
      ignore = true
    }
  }, [])

  async function handleCheckInbox() {
    try {
      setPolling(true)
      setPollResult(null)
      const res = await pollInbox()
      setPollResult(
        res.messages > 0
          ? `Polled inbox successfully: processed ${res.messages} new message(s)!`
          : "Checked inbox: no new messages found."
      )
      await loadData()
    } catch (err: unknown) {
      setPollResult(err instanceof Error ? `Polling failed: ${err.message}` : "Failed to check inbox")
    } finally {
      setPolling(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading overview statistics...</p>
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <XCircle className="mx-auto h-10 w-10 text-rose-500" />
        <h3 className="mt-2 text-sm font-semibold text-rose-800">Failed to load overview</h3>
        <p className="mt-1 text-xs text-rose-600">{error}</p>
        <Button onClick={loadData} variant="outline" size="sm" className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Overview</h1>
          <p className="text-sm text-slate-500">
            Real-time customer support operations powered by OpenAI &amp; PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            disabled={loading || polling}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={handleCheckInbox}
            loading={polling}
            size="sm"
            className="text-xs"
          >
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Check Inbox Now
          </Button>
        </div>
      </div>

      {pollResult && (
        <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/80 p-3.5 text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            <span>{pollResult}</span>
          </div>
          <button
            onClick={() => setPollResult(null)}
            className="text-indigo-500 hover:text-indigo-800 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Open Tickets */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Open Tickets
            </CardTitle>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 border border-amber-200">
              <Inbox className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.open_tickets ?? 0}</div>
            <p className="mt-1 text-xs text-slate-500">Awaiting customer or agent action</p>
          </CardContent>
        </Card>

        {/* Answered Tickets */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Answered Tickets
            </CardTitle>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 border border-emerald-200">
              <CheckCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.answered_tickets ?? 0}</div>
            <p className="mt-1 text-xs text-slate-500">Autonomous AI replies sent</p>
          </CardContent>
        </Card>

        {/* Escalated Tickets */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Escalated Tickets
            </CardTitle>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 border border-rose-200">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.escalated_tickets ?? 0}</div>
            <p className="mt-1 text-xs text-slate-500">Transferred to human support</p>
          </CardContent>
        </Card>

        {/* Processed Emails */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Processed Emails
            </CardTitle>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 border border-indigo-200">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.processed_emails ?? 0}</div>
            <p className="mt-1 text-xs text-slate-500">Total pipeline email executions</p>
          </CardContent>
        </Card>

        {/* Failed Events */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Failed Events
            </CardTitle>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600 border border-slate-200">
              <XCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.failed_events ?? 0}</div>
            <p className="mt-1 text-xs text-slate-500">Ingestion or handling errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tickets Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest customer conversations and threads</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToTab("tickets")}
              className="text-xs text-indigo-600"
            >
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {(!stats?.recent_tickets || stats.recent_tickets.length === 0) ? (
              <p className="py-6 text-center text-xs text-slate-400">No tickets found in database.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recent_tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => onNavigateToTab("tickets")}
                    className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {ticket.subject || "(No Subject)"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span>{ticket.customer_email}</span>
                        {ticket.category && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 font-medium">{ticket.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={ticket.status} />
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(ticket.updated_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Events Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Ingestion Events</CardTitle>
              <CardDescription>Gmail message intake log and processing attempts</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToTab("events")}
              className="text-xs text-indigo-600"
            >
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {(!stats?.recent_events || stats.recent_events.length === 0) ? (
              <p className="py-6 text-center text-xs text-slate-400">No events recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recent_events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onNavigateToTab("events")}
                    className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          #{event.id}
                        </span>
                        <span className="font-mono text-xs text-slate-500 truncate">
                          {event.gmail_message_id}
                        </span>
                      </div>
                      {event.error && (
                        <p className="truncate text-xs text-rose-600 mt-0.5">{event.error}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={event.status} />
                      <span className="text-[11px] text-slate-400">
                        {formatDate(event.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
