import type { KnowledgeBaseEntry, Message, OverviewStats, SupportEvent, Ticket } from "./types"

const AUTH_KEY = "dashboard-login"
const USER_KEY = "dashboard-username"

export function saveLogin(username: string, password: string): void {
  sessionStorage.setItem(AUTH_KEY, btoa(`${username}:${password}`))
  sessionStorage.setItem(USER_KEY, username)
}

export function logout(): void {
  sessionStorage.removeItem(AUTH_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export function isLoggedIn(): boolean {
  return sessionStorage.getItem(AUTH_KEY) !== null
}

export function getUsername(): string {
  return sessionStorage.getItem(USER_KEY) || "admin"
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem(AUTH_KEY)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  }

  if (token) {
    headers.Authorization = `Basic ${token}`
  }

  const response = await fetch(`/api${path}`, {
    ...init,
    headers,
  })

  if (response.status === 401) {
    logout()
    throw new Error("Wrong username or password")
  }

  if (!response.ok) {
    let errorDetail = `Request failed: ${response.statusText}`
    try {
      const errorJson = await response.json()
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail)
      }
    } catch {
      const text = await response.text()
      if (text) errorDetail = text
    }
    throw new Error(errorDetail)
  }

  return response.json() as Promise<T>
}

// Typed API operations
export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch("/health")
  if (!response.ok) throw new Error("Health check failed")
  return response.json()
}

export function login(): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>("/login")
}

export function fetchOverview(): Promise<OverviewStats> {
  return api<OverviewStats>("/overview")
}

export function fetchEvents(): Promise<SupportEvent[]> {
  return api<SupportEvent[]>("/events")
}

export function fetchTickets(): Promise<Ticket[]> {
  return api<Ticket[]>("/tickets")
}

export function fetchTicketMessages(ticketId: number): Promise<Message[]> {
  return api<Message[]>(`/tickets/${ticketId}/messages`)
}

export function fetchKnowledgeBase(): Promise<KnowledgeBaseEntry[]> {
  return api<KnowledgeBaseEntry[]>("/knowledge-base")
}

export function updateKnowledgeBase(
  entryId: number,
  title: string,
  content: string
): Promise<KnowledgeBaseEntry> {
  return api<KnowledgeBaseEntry>(`/knowledge-base/${entryId}`, {
    method: "PUT",
    body: JSON.stringify({ title, content }),
  })
}

export function pollInbox(): Promise<{ messages: number }> {
  return api<{ messages: number }>("/poll", { method: "POST" })
}
