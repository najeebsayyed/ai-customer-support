import { useEffect, useState } from "react"
import { CheckCircle2, LogOut, Menu, User, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { checkHealth, getUsername, logout } from "@/lib/api"
import type { NavTab } from "./Sidebar"
import { NAV_ITEMS } from "./Sidebar"

interface HeaderProps {
  currentTab: NavTab
  onToggleMobileMenu: () => void
  onLogout: () => void
}

export function Header({ currentTab, onToggleMobileMenu, onLogout }: HeaderProps) {
  const [healthStatus, setHealthStatus] = useState<"online" | "offline" | "checking">("checking")
  const username = getUsername()

  const currentItem = NAV_ITEMS.find((item) => item.id === currentTab)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const res = await checkHealth()
        if (mounted) {
          setHealthStatus(res.status === "ok" ? "online" : "offline")
        }
      } catch {
        if (mounted) {
          setHealthStatus("offline")
        }
      }
    }

    check()
    const interval = setInterval(check, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  function handleLogout() {
    logout()
    onLogout()
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h2 className="text-base font-semibold text-slate-900 leading-tight">
            {currentItem?.label || "Dashboard"}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            {currentItem?.desc || "Manage customer support operations"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
          {healthStatus === "online" ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium text-emerald-700">API Online</span>
            </>
          ) : healthStatus === "offline" ? (
            <>
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              <span className="font-medium text-rose-700">API Offline</span>
            </>
          ) : (
            <span className="text-slate-500">Checking...</span>
          )}
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
          <User className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-medium text-slate-700">{username}</span>
        </div>

        {/* Log out */}
        <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs">
          <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  )
}
