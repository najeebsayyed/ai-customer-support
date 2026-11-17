export type SupportEvent = {
  id: number
  gmail_message_id: string
  status: "processing" | "processed" | "skipped" | "failed" | string
  attempts: number
  error: string | null
  result?: Record<string, unknown> | null
  created_at: string
  processed_at?: string | null
}

export type Ticket = {
  id: number
  gmail_thread_id?: string
  customer_email: string
  subject: string
  category: string | null
  status: "open" | "answered" | "escalated" | string
  proposed_action: string | null
  created_at: string
  updated_at: string
}

export type Message = {
  id: number
  ticket_id: number
  gmail_message_id?: string
  direction: "in" | "out"
  from_address: string
  body: string
  created_at: string
}

export type KnowledgeBaseEntry = {
  id: number
  section: string
  title: string
  content: string
  updated_at: string
}

export type OverviewStats = {
  processed_emails: number
  failed_events: number
  total_events: number
  open_tickets: number
  answered_tickets: number
  escalated_tickets: number
  total_tickets: number
  recent_events: SupportEvent[]
  recent_tickets: Ticket[]
}

export function formatDate(value?: string | null): string {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch {
    return value
  }
}

export function timeAgo(value?: string | null): string {
  if (!value) return "—"
  try {
    const diff = (Date.now() - new Date(value).getTime()) / 1000
    if (diff < 60) return "Just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  } catch {
    return value
  }
}
