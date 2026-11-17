import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Filter,
  Mail,
  RefreshCw,
  Search,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchEvents, pollInbox } from "@/lib/api"
import { formatDate, type SupportEvent } from "@/lib/types"

export function EventsPage() {
  const [events, setEvents] = useState<SupportEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [pollMessage, setPollMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchEvents()
      setEvents(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load events")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    async function init() {
      try {
        setError(null)
        const data = await fetchEvents()
        if (!ignore) {
          setEvents(data)
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load events")
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
    setChecking(true)
    setPollMessage(null)
    try {
      const res = await pollInbox()
      setPollMessage(
        res.messages > 0
          ? `Polled inbox: ${res.messages} new message(s) ingested and processed!`
          : "Checked inbox: 0 new unhandled messages."
      )
      await loadEvents()
    } catch (err: unknown) {
      setError(err instanceof Error ? `Polling failed: ${err.message}` : "Failed to poll inbox")
    } finally {
      setChecking(false)
    }
  }

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesSearch =
        search.trim() === "" ||
        ev.gmail_message_id.toLowerCase().includes(search.toLowerCase()) ||
        (ev.error && ev.error.toLowerCase().includes(search.toLowerCase())) ||
        String(ev.id).includes(search)

      const matchesStatus =
        statusFilter === "all" || ev.status.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [events, search, statusFilter])

  return (
    <div className="space-y-4">
      {/* Page Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-600" />
            Ingestion Events
          </h1>
          <p className="text-sm text-slate-500">
            Audit log of incoming Gmail messages processed through the pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={loadEvents}
            variant="outline"
            size="sm"
            disabled={loading || checking}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={handleCheckInbox}
            loading={checking}
            size="sm"
            className="text-xs"
          >
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Check Inbox Now
          </Button>
        </div>
      </div>

      {pollMessage && (
        <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/80 p-3 text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            <span>{pollMessage}</span>
          </div>
          <button
            onClick={() => setPollMessage(null)}
            className="text-indigo-500 hover:text-indigo-800 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by event ID, Gmail message ID, or error message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
              <div className="flex flex-wrap gap-1">
                {["all", "processing", "processed", "skipped", "failed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                      statusFilter === status
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      {loading && events.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-slate-200 bg-white">
          <div className="text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-600" />
            <p className="mt-2 text-xs text-slate-500 font-medium">Loading events...</p>
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <Activity className="h-8 w-8 text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-700">No events found</h3>
          <p className="mt-1 text-xs text-slate-400">
            {search || statusFilter !== "all"
              ? "Try adjusting your search query or status filter."
              : "No incoming message events recorded yet. Click 'Check Inbox Now' to poll Gmail."}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead>Gmail Message ID</TableHead>
              <TableHead className="w-24">Attempts</TableHead>
              <TableHead>Error Details</TableHead>
              <TableHead className="w-44">Created At</TableHead>
              <TableHead className="w-44">Processed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((ev) => (
              <TableRow key={ev.id}>
                <TableCell className="font-mono text-xs font-semibold text-slate-900">
                  #{ev.id}
                </TableCell>
                <TableCell>
                  <StatusBadge status={ev.status} />
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600">
                  {ev.gmail_message_id}
                </TableCell>
                <TableCell className="text-xs text-slate-600">{ev.attempts}</TableCell>
                <TableCell className="max-w-md">
                  {ev.error ? (
                    <span className="text-xs text-rose-600 font-mono line-clamp-2" title={ev.error}>
                      {ev.error}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(ev.created_at)}
                </TableCell>
                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(ev.processed_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
