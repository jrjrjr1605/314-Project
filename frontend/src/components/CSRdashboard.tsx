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
  const [viewMode, setViewMode] = useState<"available" | "shortlisted">("available")
  const [query, setQuery] = useState("")

  const csrId = useCsrId()
  const [shortlistBusy, setShortlistBusy] = useState<number | null>(null)

  // -------- BASE URLs --------
  const buildAvailableUrl = () => {
    const u = new URL(`${API_BASE}/api/requests/available`)
    if (csrId) u.searchParams.set("csr_user_id", String(csrId))
    return u.toString()
  }

  const buildShortlistedUrl = () => {
    const u = new URL(`${API_BASE}/api/requests/shortlisted`)
    if (csrId) u.searchParams.set("csr_user_id", String(csrId))
    return u.toString()
  }

  const buildAvailableSearchUrl = (q: string) => {
    const u = new URL(`${API_BASE}/api/requests/search/available`)
    u.searchParams.set("search_input", q.trim())
    if (csrId) u.searchParams.set("csr_user_id", String(csrId))
    return u.toString()
  }

  const buildShortlistedSearchUrl = (q: string) => {
    const u = new URL(`${API_BASE}/api/requests/search/shortlisted`)
    u.searchParams.set("search_input", q.trim())
    if (csrId) u.searchParams.set("csr_user_id", String(csrId))
    return u.toString()
  }

  // -------- FETCH FUNCTIONS --------
  const get_csr_requests_available = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildAvailableUrl(), { headers: { Accept: "application/json" } })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || "Failed to load available requests")
    } finally {
      setLoading(false)
    }
  }

  const get_csr_requests_shortlisted = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildShortlistedUrl(), { headers: { Accept: "application/json" } })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || "Failed to load shortlisted requests")
    } finally {
      setLoading(false)
    }
  }

  // -------- SEARCH FUNCTIONS --------
  const search_csr_requests_available = async () => {
    if (!query.trim()) return get_csr_requests_available()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildAvailableSearchUrl(query), { headers: { Accept: "application/json" } })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || "Failed to search available requests")
    } finally {
      setLoading(false)
    }
  }

  const search_csr_requests_shortlisted = async () => {
    if (!query.trim()) return get_csr_requests_shortlisted()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildShortlistedSearchUrl(query), { headers: { Accept: "application/json" } })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || "Failed to search shortlisted requests")
    } finally {
      setLoading(false)
    }
  }

  // -------- HANDLERS --------
  const handleSearch = () => {
    if (viewMode === "available") search_csr_requests_available()
    else search_csr_requests_shortlisted()
  }

  const handleReset = () => {
    setQuery("")
    if (viewMode === "available") get_csr_requests_available()
    else get_csr_requests_shortlisted()
  }

  // -------- SHORTLIST HANDLER --------
  const shortlist_csr_requests = async (req: PinRequest) => {
    if (!csrId) return alert("Please log in as a CSR.")
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

      // ✅ Follow backend: true → do nothing; string → show alert + refresh
      if (typeof result === "string") {
        alert(result)
        if (viewMode === "available") get_csr_requests_available()
        else get_csr_requests_shortlisted()
      }
      // If backend returns true, just refresh silently
      else if (result === true) {
        if (viewMode === "available") get_csr_requests_available()
        else get_csr_requests_shortlisted()
      }
    } catch (e: any) {
      alert(e?.message || "Failed to update shortlist.")
    } finally {
      setShortlistBusy(null)
    }
  }

  // -------- LIFECYCLE --------
  useEffect(() => {
    if (csrId !== null) {
      if (viewMode === "available") get_csr_requests_available()
      else get_csr_requests_shortlisted()
    }
  }, [viewMode, csrId])

  const sorted = useMemo(() => {
    return [...requests].sort((a, b) => {
      const at = a.created_at ? new Date(a.created_at).getTime() : 0
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0
      return bt - at
    })
  }, [requests])

  // -------- UI --------
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 bg-50 p-6 space-y-8">
          {/* --- Search and Filters --- */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Search</div>
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={`Search ${viewMode === "available" ? "available" : "shortlisted"} requests`}
                  className="w-[320px]"
                />
                <Button variant="outline" onClick={handleSearch} disabled={loading}>
                  Search
                </Button>
                <Button variant="secondary" onClick={handleReset} disabled={loading}>
                  Reset
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

          {/* --- Results Grid --- */}
          {loading && <div className="text-sm text-gray-600">Loading requests…</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}

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
                      <Button size="sm" variant="outline" className="mt-2">View</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{r.title}</DialogTitle>
                        <DialogDescription>{r.category_name || "Misc"}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 text-sm">
                        {r.description && <p className="text-gray-700 whitespace-pre-line">{r.description}</p>}
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
                          onClick={() => shortlist_csr_requests(r)}
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
        </main>
      </div>
    </SidebarProvider>
  )
}
