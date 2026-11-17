import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Folder,
  RefreshCw,
  Save,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { fetchKnowledgeBase, updateKnowledgeBase } from "@/lib/api"
import { formatDate, type KnowledgeBaseEntry } from "@/lib/types"

export function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeBaseEntry | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const isDirty =
    selectedEntry !== null &&
    (title !== selectedEntry.title || content !== selectedEntry.content)

  const selectEntry = useCallback(
    (entry: KnowledgeBaseEntry, checkDirty = true) => {
      if (checkDirty && isDirty) {
        const confirmDiscard = window.confirm(
          "You have unsaved changes in this entry. Do you want to discard them?"
        )
        if (!confirmDiscard) return
      }

      setSelectedEntry(entry)
      setTitle(entry.title)
      setContent(entry.content)
      setActiveSection(entry.section)
      setSaveSuccess(null)
      setError(null)
    },
    [isDirty]
  )

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchKnowledgeBase()
      setEntries(data)

      if (data.length > 0) {
        if (!activeSection) {
          setActiveSection(data[0].section)
        }
        if (!selectedEntry) {
          selectEntry(data[0], false)
        } else {
          const updated = data.find((e) => e.id === selectedEntry.id)
          if (updated) {
            setSelectedEntry(updated)
            setTitle(updated.title)
            setContent(updated.content)
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load knowledge base")
    } finally {
      setLoading(false)
    }
  }, [activeSection, selectedEntry, selectEntry])

  useEffect(() => {
    let ignore = false
    async function init() {
      try {
        setError(null)
        const data = await fetchKnowledgeBase()
        if (!ignore) {
          setEntries(data)
          if (data.length > 0) {
            setActiveSection(data[0].section)
            selectEntry(data[0], false)
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load knowledge base")
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
  }, [selectEntry])

  function handleDiscard() {
    if (!selectedEntry) return
    setTitle(selectedEntry.title)
    setContent(selectedEntry.content)
    setSaveSuccess(null)
    setError(null)
  }

  async function handleSave() {
    if (!selectedEntry) return
    if (!title.trim() || !content.trim()) {
      setError("Title and content cannot be empty.")
      return
    }

    setSaving(true)
    setError(null)
    setSaveSuccess(null)

    try {
      const updated = await updateKnowledgeBase(selectedEntry.id, title.trim(), content)
      setEntries((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      )
      setSelectedEntry(updated)
      setTitle(updated.title)
      setContent(updated.content)
      setSaveSuccess(`Entry "${updated.title}" successfully saved to PostgreSQL!`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save knowledge base entry")
    } finally {
      setSaving(false)
    }
  }

  const sections = Array.from(new Set(entries.map((e) => e.section))).sort()

  const entriesForCurrentSection = entries.filter((e) => e.section === activeSection)

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            Knowledge Base
          </h1>
          <p className="text-sm text-slate-500">
            Edit company policies, product specs, and escalation rules consulted by the AI agent.
          </p>
        </div>

        <Button
          onClick={loadEntries}
          variant="outline"
          size="sm"
          disabled={loading || saving}
          className="text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {saveSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{saveSuccess}</span>
          </div>
          <button
            onClick={() => setSaveSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold"
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

      {/* Main Grid: Section / Entry Navigation + Editor */}
      <div className="grid gap-6 lg:grid-cols-12 min-h-[600px]">
        {/* Left Column: Sections & Entries (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Sections ({sections.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sections.map((section) => (
                  <button
                    key={section}
                    onClick={() => {
                      if (isDirty) {
                        const confirmDiscard = window.confirm(
                          "You have unsaved changes in this entry. Do you want to discard them?"
                        )
                        if (!confirmDiscard) return
                      }
                      setActiveSection(section)
                      const first = entries.find((e) => e.section === section)
                      if (first) {
                        setSelectedEntry(first)
                        setTitle(first.title)
                        setContent(first.content)
                        setSaveSuccess(null)
                        setError(null)
                      }
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      activeSection === section
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Folder className="h-3 w-3" />
                    <span>{section}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Entries in &quot;{activeSection}&quot; ({entriesForCurrentSection.length})
                </span>
              </div>

              {loading && entries.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {entriesForCurrentSection.map((entry) => {
                    const isSelected = selectedEntry?.id === entry.id
                    return (
                      <button
                        key={entry.id}
                        onClick={() => selectEntry(entry)}
                        className={`group flex w-full items-center justify-between rounded-lg p-2.5 text-left text-xs transition-all ${
                          isSelected
                            ? "bg-indigo-50 text-indigo-900 font-semibold border border-indigo-200"
                            : "text-slate-700 hover:bg-slate-100 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                            }`}
                          />
                          <span className="truncate">{entry.title}</span>
                        </div>
                        {isSelected && isDirty && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                            Unsaved
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Entry Editor (8 cols) */}
        <div className="lg:col-span-8">
          {selectedEntry ? (
            <Card className="h-full flex flex-col shadow-sm">
              <div className="border-b border-slate-200 p-5 bg-slate-50/50 rounded-t-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 uppercase">
                      Section: {selectedEntry.section}
                    </span>
                    <span className="text-xs text-slate-400">ID #{selectedEntry.id}</span>
                    {isDirty && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        Unsaved Edits
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Last modified in PostgreSQL: {formatDate(selectedEntry.updated_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isDirty && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDiscard}
                      className="text-xs"
                    >
                      <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                      Discard
                    </Button>
                  )}
                  <Button
                    onClick={handleSave}
                    loading={saving}
                    disabled={!isDirty || saving}
                    size="sm"
                    className="text-xs"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save Changes
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-5 space-y-4 flex flex-col">
                <div className="space-y-1.5">
                  <label
                    htmlFor="entry-title"
                    className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
                  >
                    Entry Title
                  </label>
                  <Input
                    id="entry-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Inflatable Paddle Boards (All-Rounder Series)"
                    className="font-medium text-sm"
                  />
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label
                    htmlFor="entry-content"
                    className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
                  >
                    Markdown Content
                  </label>
                  <Textarea
                    id="entry-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write detailed policy or product information in markdown..."
                    className="flex-1 min-h-[350px] font-mono text-xs leading-relaxed resize-y"
                  />
                  <p className="text-[11px] text-slate-400">
                    This content is retrieved dynamically by the AI agent during customer email
                    classification and answer drafting.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <BookOpen className="h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-700">No entry selected</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                Select an entry from the list on the left to edit its title and content.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
