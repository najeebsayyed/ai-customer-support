import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Bot,
  Clock,
  Inbox,
  Mail,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  User,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { fetchTicketMessages, fetchTickets } from "@/lib/api"
import { formatDate, timeAgo, type Message, type Ticket } from "@/lib/types"

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [error, setError] = useState<string | null>(null)

  const openTicket = useCallback(async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setLoadingMessages(true)
    try {
      const msgs = await fetchTicketMessages(ticket.id)
      setMessages(msgs)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load conversation history")
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  const loadTickets = useCallback(async () => {
    try {
      setLoadingTickets(true)
      setError(null)
      const data = await fetchTickets()
      setTickets(data)

      if (selectedTicket) {
        const found = data.find((t) => t.id === selectedTicket.id)
        if (found) setSelectedTicket(found)
      } else if (data.length > 0) {
        void openTicket(data[0])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tickets")
    } finally {
      setLoadingTickets(false)
    }
  }, [openTicket, selectedTicket])

  useEffect(() => {
    let ignore = false
    async function init() {
      try {
        setError(null)
        const data = await fetchTickets()
        if (!ignore) {
          setTickets(data)
          if (data.length > 0) {
            void openTicket(data[0])
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load tickets")
        }
      } finally {
        if (!ignore) {
          setLoadingTickets(false)
        }
      }
    }
    void init()
    return () => {
      ignore = true
    }
  }, [openTicket])

  // Derive categories from existing tickets
  const availableCategories = useMemo(() => {
    const cats = new Set<string>()
    tickets.forEach((t) => {
      if (t.category) cats.add(t.category)
    })
    return Array.from(cats).sort()
  }, [tickets])

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        q === "" ||
        t.customer_email.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.proposed_action && t.proposed_action.toLowerCase().includes(q)) ||
        String(t.id).includes(q)

      const matchesStatus =
        statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase()

      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "none" && !t.category) ||
        t.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [tickets, search, statusFilter, categoryFilter])

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Inbox className="h-6 w-6 text-indigo-600" />
            Support Tickets
          </h1>
          <p className="text-sm text-slate-500">
            Customer inquiries classified and responded to by the autonomous AI agent.
          </p>
        </div>

        <Button
          onClick={loadTickets}
          variant="outline"
          size="sm"
          disabled={loadingTickets}
          className="text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingTickets ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tickets by customer email, subject, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 hidden sm:inline">Status:</span>
              {["all", "open", "answered", "escalated"].map((status) => (
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

          {availableCategories.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Category:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`rounded px-2 py-0.5 text-xs transition-colors ${
                    categoryFilter === "all"
                      ? "bg-indigo-100 text-indigo-800 font-semibold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  All
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded px-2 py-0.5 text-xs transition-colors ${
                      categoryFilter === cat
                        ? "bg-indigo-100 text-indigo-800 font-semibold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-Column Split Layout */}
      <div className="grid gap-6 lg:grid-cols-12 min-h-[550px]">
        {/* Left Column: Tickets List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tickets ({filteredTickets.length})
            </span>
          </div>

          {loadingTickets && tickets.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
              <Inbox className="h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs font-medium text-slate-600">No tickets matching filter</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {filteredTickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id
                return (
                  <div
                    key={ticket.id}
                    onClick={() => openTicket(ticket)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {ticket.subject || "(No Subject)"}
                      </h3>
                      <StatusBadge status={ticket.status} />
                    </div>

                    <p className="mt-1 text-xs text-slate-600 truncate flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      {ticket.customer_email}
                    </p>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        {ticket.category ? (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                            {ticket.category}
                          </span>
                        ) : (
                          <span className="italic text-slate-300">Uncategorized</span>
                        )}
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(ticket.updated_at)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Ticket Details & Message History (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <Card className="h-full flex flex-col shadow-sm">
              {/* Ticket Detail Header */}
              <div className="border-b border-slate-200 p-5 bg-slate-50/50 rounded-t-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        Ticket #{selectedTicket.id}
                      </span>
                      <StatusBadge status={selectedTicket.status} />
                      {selectedTicket.category && (
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-200">
                          {selectedTicket.category}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 text-lg font-bold text-slate-900">
                      {selectedTicket.subject || "(No Subject)"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      From: <span className="font-medium text-slate-700">{selectedTicket.customer_email}</span>
                      <span className="mx-1">•</span>
                      <span>Last updated: {formatDate(selectedTicket.updated_at)}</span>
                    </p>
                  </div>
                </div>

                {selectedTicket.proposed_action && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-700 block mb-0.5">
                      AI Proposed Action
                    </span>
                    <p>{selectedTicket.proposed_action}</p>
                  </div>
                )}
              </div>

              {/* Messages Thread Container */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[600px] bg-white">
                <div className="text-center">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                    Conversation Thread
                  </span>
                </div>

                {loadingMessages ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No message history recorded for this ticket.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAiReply = msg.direction === "out"
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAiReply ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-4 shadow-xs ${
                            isAiReply
                              ? "bg-indigo-600 text-white rounded-tr-xs"
                              : "bg-slate-100 text-slate-900 border border-slate-200 rounded-tl-xs"
                          }`}
                        >
                          <div
                            className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-medium ${
                              isAiReply ? "text-indigo-200" : "text-slate-500"
                            }`}
                          >
                            {isAiReply ? (
                              <>
                                <Bot className="h-3.5 w-3.5 text-indigo-200" />
                                <span>Harbor &amp; Pine AI Assistant</span>
                                <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
                              </>
                            ) : (
                              <>
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                <span>{msg.from_address}</span>
                              </>
                            )}
                            <span className="mx-1">•</span>
                            <span>{formatDate(msg.created_at)}</span>
                          </div>

                          <p className="text-xs whitespace-pre-wrap leading-relaxed font-sans">
                            {msg.body}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <Inbox className="h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-700">No ticket selected</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                Select a support ticket from the list on the left to inspect its classification,
                proposed action, and complete customer conversation thread.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
