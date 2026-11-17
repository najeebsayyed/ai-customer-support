import React from "react"
import { Activity, BookOpen, Inbox, LayoutDashboard } from "lucide-react"

export type NavTab = "overview" | "events" | "tickets" | "knowledge-base"

export interface NavItem {
  id: NavTab
  label: string
  icon: React.ElementType
  desc: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    desc: "Metrics & live activity",
  },
  {
    id: "events",
    label: "Events",
    icon: Activity,
    desc: "Ingestion log & inbox poller",
  },
  {
    id: "tickets",
    label: "Tickets",
    icon: Inbox,
    desc: "Customer emails & AI replies",
  },
  {
    id: "knowledge-base",
    label: "Knowledge Base",
    icon: BookOpen,
    desc: "Edit company policies & docs",
  },
]
