import React, { useState } from "react"
import { Header } from "./Header"
import { Sidebar, type NavTab } from "./Sidebar"

interface LayoutProps {
  currentTab: NavTab
  onSelectTab: (tab: NavTab) => void
  onLogout: () => void
  openCounts?: {
    openTickets?: number
    failedEvents?: number
  }
  children: React.ReactNode
}

export function Layout({
  currentTab,
  onSelectTab,
  onLogout,
  openCounts,
  children,
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSelectTab = (tab: NavTab) => {
    onSelectTab(tab)
    setMobileMenuOpen(false)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          openCounts={openCounts}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          openCounts={openCounts}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          currentTab={currentTab}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
