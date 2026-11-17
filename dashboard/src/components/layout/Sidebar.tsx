import React from "react"
import { Activity, BookOpen, Bot, ChevronRight, Inbox, LayoutDashboard, Sparkles } from "lucide-react"

export type NavTab = "overview" | "events" | "tickets" | "knowledge-base"

interface SidebarProps {
  currentTab: NavTab
  onSelectTab: (tab: NavTab) => void
  openCounts?: {
    openTickets?: number
    failedEvents?: number
  }
}

export const NAV_ITEMS: { id: NavTab; label: string; icon: React.ElementType; desc: string }[] = [
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

export function Sidebar({ currentTab, onSelectTab, openCounts }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Brand header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            Harbor &amp; Pine
            <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />
          </h1>
          <p className="text-xs text-slate-500 font-medium">AI Support Automation</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <div>
                  <div className="leading-tight">{item.label}</div>
                  <div
                    className={`text-[11px] font-normal ${
                      isActive ? "text-indigo-500" : "text-slate-400"
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>

              {item.id === "tickets" && (openCounts?.openTickets ?? 0) > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  {openCounts?.openTickets}
                </span>
              )}

              {item.id === "events" && (openCounts?.failedEvents ?? 0) > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
                  {openCounts?.failedEvents}
                </span>
              )}

              {isActive && (
                <ChevronRight className="h-4 w-4 text-indigo-500 opacity-60" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="border-t border-slate-200 p-4 bg-slate-50/50">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700">
            <span>AI Model Engine</span>
            <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              OpenAI
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Classifier: gpt-6-luna
            <br />
            Agent: gpt-6.1-sol
          </p>
        </div>
      </div>
    </aside>
  )
}
