"use client"

import { useEffect, useMemo, useState } from "react"
import { AppSidebar } from "@/components/csr-app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"

type PinRequest = {
  id: number
  pin_user_id: string
  title: string
  description?: string | null
  status: "pending" | "assigned" | "completed"
  category_name?: string | null
  created_at?: string | null
  updated_at?: string | null
  my_shortlisted?: boolean
  shortlistees_count?: number
  view_count?: number 
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

function formatDT(dt?: string | null) {
  if (!dt) return ""
  try {
    return new Date(dt).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })
  } catch {
    return dt ?? ""
  }
}

function useCsrId(): number | null {
  const [id, setId] = useState<number | null>(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user")
      if (!raw) return
      const u = JSON.parse(raw)
      if ((u?.role || "").toUpperCase() === "CSR") setId(Number(u.id) || null)
    } catch {}
  }, [])
  return id
}

export default function CSRDashboard() {
  const [requests, setRequests] = useState<PinRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const [viewMode, setViewMode] = useState<"available" | "shortlisted">("available")
  const [query, setQuery] = useState("")
  const PAGE_SIZE = 24
  const [offset, setOffset] = useState(0)

  const csrId = useCsrId()
  const [shortlistBusy, setShortlistBusy] = useState<number | null>(null)

  // ✅ normal listing endpoint
  const buildListUrl = (opts: { limit: number; offset: number }) => {
    const u = new URL(`${API_BASE}/api/requests`)
    if (csrId) u.searchParams.set("csr_id", String(csrId))
    if (viewMode === "available") u.searchParams.set("status", "pending")
    else u.searchParams.set("status", "shortlisted")
    u.searchParams.set("limit", String(opts.limit))
    u.searchParams.set("offset", String(opts.offset))
    return u.toString()
  }

  // ✅ new search endpoint
  const buildSearchUrl = (q: string) => {
    const u = new URL(`${API_BASE}/api/requests/search`)
    u.searchParams.set("q", q.trim())
    if (csrId) u.searchParams.set("csr_id", String(csrId))
    return u.toString()
  }

  // ✅ fetch regular list
  const fetchPage = async (reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const url = buildListUrl({ limit: PAGE_SIZE, offset: reset ? 0 : offset })
      const res = await fetch(url, { headers: { Accept: "application/json" } })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      const filtered =
        viewMode === "available"
          ? list.filter(r => !r.my_shortlisted && r.status === "pending")
          : list.filter(r => r.my_shortlisted && r.status === "pending")

      if (reset) {
        setRequests(filtered)
        setOffset(filtered.length)
      } else {
        setRequests(prev => [...prev, ...filtered])
        setOffset(prev => prev + filtered.length)
      }
      setHasMore(filtered.length === PAGE_SIZE)
    } catch (e: any) {
      setError(e?.message || "Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  // ✅ fetch from search endpoint
  const fetchSearchResults = async () => {
    if (!query.trim()) {
      // empty query resets to default list
      fetchPage(true)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const url = buildSearchUrl(query)
      const res = await fetch(url, { headers: { Accept: "application/json" } })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = Array.isArray(data) ? data : []

      // Same shortlist filtering for consistency
      const filtered =
        viewMode === "available"
          ? list.filter(r => !r.my_shortlisted && r.status === "pending")
          : list.filter(r => r.my_shortlisted && r.status === "pending")

      setRequests(filtered)
      setHasMore(false) // search doesn’t paginate
    } catch (e: any) {
      setError(e?.message || "Failed to search requests")
    } finally {
      setLoading(false)
    }
  }

  const toggleShortlist = async (req: PinRequest) => {
    if (!csrId) {
      alert("Please log in as a CSR.")
      return
    }

    setShortlistBusy(req.id)
    try {
      const url = `${API_BASE}/api/requests/${req.id}/shortlist`
      const method = req.my_shortlisted ? "DELETE" : "POST"
      const res = await fetch(
        req.my_shortlisted ? `${url}?csr_id=${csrId}` : url,
        {
          method,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: req.my_shortlisted ? undefined : JSON.stringify({ csr_id: csrId }),
        }
      )

      if (!res.ok) throw new Error(await res.text())
      const result = await res.json()

      if (result === true) {
        if (req.my_shortlisted) {
          // 🟥 removing
          alert("❌ Removed from shortlist.")
          if (viewMode === "shortlisted") {
            setRequests(prev => prev.filter(r => r.id !== req.id))
          } else {
            setRequests(prev =>
              prev.map(r =>
                r.id === req.id
                  ? { ...r, my_shortlisted: false, shortlistees_count: (r.shortlistees_count ?? 1) - 1 }
                  : r
              )
            )
          }
        } else {
          // 🟩 adding
          alert("✅ Added to shortlist.")
          if (viewMode === "available") {
            setRequests(prev => prev.filter(r => r.id !== req.id))
          } else {
            setRequests(prev =>
              prev.map(r =>
                r.id === req.id
                  ? { ...r, my_shortlisted: true, shortlistees_count: (r.shortlistees_count ?? 0) + 1 }
                  : r
              )
            )
          }
        }
      } else if (typeof result === "string") {
        alert(result)
      }

    } catch (e: any) {
      alert(e?.message || "Failed to update shortlist.")
    } finally {
      setShortlistBusy(null)
    }
  }



  useEffect(() => {
    if (csrId !== null) fetchPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, csrId])

  const sorted = useMemo(() => {
    return [...requests].sort((a, b) => {
      const at = a.created_at ? new Date(a.created_at).getTime() : 0
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0
      return bt - at
    })
  }, [requests])

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 bg-50 p-6 space-y-8">
          {/* Controls row */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Search</div>
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchSearchResults()
                  }}
                  placeholder='Try: "food", "emergency", or Service Type'
                  className="w-[320px]"
                />
                <Button variant="outline" onClick={fetchSearchResults}>
                  Search
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "available" ? "default" : "outline"}
                onClick={() => setViewMode("available")}
              >
                Available
              </Button>
              <Button
                variant={viewMode === "shortlisted" ? "default" : "outline"}
                onClick={() => setViewMode("shortlisted")}
              >
                Shortlisted
              </Button>
            </div>
          </div>

          {/* Loading/Error */}
          {loading && <div className="text-sm text-gray-600">Loading requests…</div>}
          {error && <div className="text-sm text-red-600">Failed to load: {error}</div>}

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-fr">
            {!loading && !error && sorted.map((r) => (
              <Card key={r.id} className="h-full flex flex-col hover:shadow-md transition-shadow w-70">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2 h-13">
                    <CardTitle className="text-base leading-tight">{r.title}</CardTitle>
                    <Badge variant="outline" className="bg-100 text-gray-900 border border-gray-200 capitalize">
                      {r.status}
                    </Badge>
                  </div>
                  <CardDescription className="italic text-gray-600">
                    {r.category_name || "Misc"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 grow">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_BASE}/api/requests/${r.id}/view`, { method: "POST" })
                              if (!res.ok) throw new Error(await res.text())
                              const result = await res.json()

                              if (result === true) {
                                // Backend says "success" — increment locally
                                setRequests(prev =>
                                  prev.map(x =>
                                    x.id === r.id
                                      ? { ...x, view_count: (x.view_count ?? 0) + 1 }
                                      : x
                                  )
                                )
                              } else if (typeof result === "string") {
                                // Backend returned error message
                                alert(`❌ ${result}`)
                              } else {
                                // Fallback for unexpected data
                                console.warn("Unexpected response format:", result)
                              }
                            } catch (e: any) {
                              console.warn("Failed to increment view count", e)
                              alert(e?.message || "Failed to increment view count.")
                            }
                          }}
                      >
                        View
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{r.title}</DialogTitle>
                        <DialogDescription>{r.category_name || "Misc"}</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-3 text-sm">
                        {r.description && (
                          <p className="text-gray-700 whitespace-pre-line">{r.description}</p>
                        )}
                        <div className="text-gray-500">
                          <div>Created: {formatDT(r.created_at)}</div>
                          <div>Updated: {formatDT(r.updated_at)}</div>
                          <div>Requested by: PIN ID #{r.pin_user_id}</div>
                          <div>Shortlists: {r.shortlistees_count ?? 0}</div>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button
                          size="sm"
                          variant={r.my_shortlisted ? "secondary" : "default"}
                          onClick={() => toggleShortlist(r)}
                          disabled={shortlistBusy === r.id}
                        >
                          {shortlistBusy === r.id
                            ? "Updating…"
                            : r.my_shortlisted
                              ? "Cancel Shortlist"
                              : "Shortlist"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pager */}
          {!loading && hasMore && !query && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => fetchPage(false)}>Load more</Button>
            </div>
          )}
          {!loading && !hasMore && requests.length > 0 && (
            <div className="text-center text-xs text-gray-500">No more results.</div>
          )}
          {!loading && !error && sorted.length === 0 && (
            <div className="text-sm text-gray-600">No requests found.</div>
          )}
        </main>
      </div>
    </SidebarProvider>
  )
}
