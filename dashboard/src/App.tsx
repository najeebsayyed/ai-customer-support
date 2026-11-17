import { useEffect, useState } from "react"
import { Layout } from "@/components/layout/Layout"
import type { NavTab } from "@/components/layout/Sidebar"
import { fetchOverview, isLoggedIn } from "@/lib/api"
import { EventsPage } from "@/pages/Events"
import { KnowledgeBasePage } from "@/pages/KnowledgeBase"
import { LoginPage } from "@/pages/Login"
import { OverviewPage } from "@/pages/Overview"
import { TicketsPage } from "@/pages/Tickets"

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [currentTab, setCurrentTab] = useState<NavTab>("overview")
  const [openCounts, setOpenCounts] = useState<{ openTickets?: number; failedEvents?: number }>({})

  // Periodically fetch open counts to show notification badges in sidebar
  useEffect(() => {
    if (!loggedIn) return

    let mounted = true
    const loadCounts = async () => {
      try {
        const stats = await fetchOverview()
        if (mounted) {
          setOpenCounts({
            openTickets: stats.open_tickets,
            failedEvents: stats.failed_events,
          })
        }
      } catch {
        // Silently ignore background badge errors
      }
    }

    loadCounts()
    const timer = setInterval(loadCounts, 20000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [loggedIn])

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />
  }

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onLogout={() => setLoggedIn(false)}
      openCounts={openCounts}
    >
      {currentTab === "overview" && <OverviewPage onNavigateToTab={setCurrentTab} />}
      {currentTab === "events" && <EventsPage />}
      {currentTab === "tickets" && <TicketsPage />}
      {currentTab === "knowledge-base" && <KnowledgeBasePage />}
    </Layout>
  )
}
