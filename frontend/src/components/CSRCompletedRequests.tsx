"use client"

import { useEffect, useMemo, useState } from "react"
import { AppSidebar } from "@/components/csr-app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type PinRequest = {
  id: number
  pin_user_id: number
  title: string
  description?: string | null
  status: "pending" | "assigned" | "completed"
  created_at?: string | null
  updated_at?: string | null
  completed_at?: string | null
  service_type?: string | null
  my_shortlisted?: boolean
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

export default function CSRCompletedRequests() {
  const [requests, setRequests] = useState<PinRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [service, setService] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const PAGE_SIZE = 24
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // 🟩 Filter by completion date (completed_at)
  const buildUrl = (opts: { limit: number; offset: number }) => {
    const u = new URL(`${API_BASE}/api/requests`)
    u.searchParams.set("limit", String(opts.limit))
    u.searchParams.set("offset", String(opts.offset))
    u.searchParams.set("status", "completed")

    if (query.trim()) u.searchParams.set("q", query.trim())
    if (service && service !== "all") u.searchParams.set("service_type", service)
    if (startDate) u.searchParams.set("completed_after", startDate)
    if (endDate) u.searchParams.set("completed_before", endDate)

    return u.toString()
  }

  const fetchPage = async (reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const url = buildUrl({
        limit: PAGE_SIZE,
        offset: reset ? 0 : offset,
      })
      const res = await fetch(url, { headers: { Accept: "application/json" } })
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`)
      const data = (await res.json()) as PinRequest[] | { items: PinRequest[] }
      const list = Array.isArray(data) ? data : (data.items ?? [])
      if (reset) {
        setRequests(list)
        setOffset(list.length)
      } else {
        setRequests(prev => [...prev, ...list])
        setOffset(prev => prev + list.length)
      }
      setHasMore(list.length === PAGE_SIZE)
    } catch (e: any) {
      setError(e?.message || "Failed to load completed requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // initial load

  // 🟩 Auto-fetch when service type changes
  useEffect(() => {
    if (!loading) fetchPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return requests.filter(r =>
      !q ||
      r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      String(r.id).includes(q)
    )
  }, [requests, query])

  // 🟩 Sort by completed_at instead of updated_at
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const at = a.completed_at ? new Date(a.completed_at).getTime() : 0
      const bt = b.completed_at ? new Date(b.completed_at).getTime() : 0
      return bt - at
    })
  }, [filtered])

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 bg-50 p-6 space-y-8">
          <div>
            <h1 className="text-xl font-semibold mb-4">Completed Services History</h1>

            {/* Filters row */}
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label>Search by keyword</Label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Try: "food", "elderly", or Service Type'
                  className="w-[260px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Basic Needs">Basic Needs</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Financial & Legal Aid">Financial & Legal Aid</SelectItem>
                    <SelectItem value="Case & Social Support">Case & Social Support</SelectItem>
                    <SelectItem value="Misc">Misc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 🟩 Filter by completion date only */}
              <div className="space-y-2">
                <Label>Completed After</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Completed Before</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="pt-5">
                <Button onClick={() => fetchPage(true)}>Search</Button>
              </div>
            </div>
          </div>

          {/* Loading/Error */}
          {loading && <div className="text-sm text-gray-600">Loading completed requests…</div>}
          {error && <div className="text-sm text-red-600">Failed to load: {error}</div>}

          {/* Results grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-fr">
            {!loading && !error && sorted.map((r) => (
              <Card key={r.id} className="h-full flex flex-col hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{r.title}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {r.status}
                    </Badge>
                  </div>
                  <CardDescription>{r.service_type || "Misc"}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 grow">
                  {r.description && <p className="text-sm text-gray-700 line-clamp-4">{r.description}</p>}
                  <div className="text-xs text-gray-500 mt-auto">
                    {/* 🟩 Show actual completed_at date */}
                    <div>Completed: {formatDT(r.completed_at)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pager */}
          {!loading && hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => fetchPage(false)}>Load more</Button>
            </div>
          )}
          {!loading && !hasMore && requests.length > 0 && (
            <div className="text-center text-xs text-gray-500">No more results.</div>
          )}
          {!loading && !error && sorted.length === 0 && (
            <div className="text-sm text-gray-600">No completed services found.</div>
          )}
        </main>
      </div>
    </SidebarProvider>
  )
}
