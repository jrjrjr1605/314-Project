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
}

type Category = {
  id: number
  name: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

function formatDT(dt?: string | null) {
  if (!dt) return ""
  try {
    return new Date(dt).toLocaleString("en-SG", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return dt ?? ""
  }
}

export default function PINCompletedRequests() {
  const [requests, setRequests] = useState<PinRequest[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Filters
  const [query, setQuery] = useState("")
  const [service, setService] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  // --- Fetch categories from backend ---
  const fetchCategories = async () => {
    setLoadingCategories(true)
    try {
      const res = await fetch(`${API_BASE}/api/categories`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error(e)
      setError("Failed to load service categories")
    } finally {
      setLoadingCategories(false)
    }
  }

  // --- Fetch all completed requests ---
  const fetchAllCompletedRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/requests/completed/pin`, {
        headers: { Accept: "application/json" },
      })
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`)
      const data = await res.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || "Failed to load completed requests")
    } finally {
      setLoading(false)
    }
  }

  // --- Search completed requests ---
  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    try {
      const body = {
        search_input: query.trim(),
        service_type: service === "all" ? null : service,
        completed_after: startDate || null,
        completed_before: endDate || null,
      }

      const res = await fetch(`${API_BASE}/api/requests/search/completed/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`)
      const data = await res.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || "Search failed")
    } finally {
      setLoading(false)
    }
  }

  // --- Reset filters ---
  const handleReset = () => {
    setQuery("")
    setService("all")
    setStartDate("")
    setEndDate("")
    fetchAllCompletedRequests()
  }

  // --- Lifecycle ---
  useEffect(() => {
    fetchCategories()
    fetchAllCompletedRequests()
  }, [])

  // --- Sort by completion date ---
  const sorted = useMemo(() => {
    return [...requests].sort((a, b) => {
      const at = a.completed_at ? new Date(a.completed_at).getTime() : 0
      const bt = b.completed_at ? new Date(b.completed_at).getTime() : 0
      return bt - at
    })
  }, [requests])

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 bg-50 p-6 space-y-8">
          <div>
            <h1 className="text-xl font-semibold mb-4">Completed Services History</h1>

            {/* --- Filters Row --- */}
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
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingCategories && <p className="text-xs text-gray-500">Loading...</p>}
              </div>

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

              <div className="pt-5 flex gap-2">
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={loading}>
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* --- Results --- */}
          {loading && <div className="text-sm text-gray-600">Loading completed requests…</div>}
          {error && <div className="text-sm text-red-600">Failed to load: {error}</div>}

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
                  {r.description && (
                    <p className="text-sm text-gray-700 line-clamp-4">{r.description}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-auto">
                    <div>Completed: {formatDT(r.completed_at)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!loading && !error && sorted.length === 0 && (
            <div className="text-sm text-gray-600">No completed services found.</div>
          )}
        </main>
      </div>
    </SidebarProvider>
  )
}
