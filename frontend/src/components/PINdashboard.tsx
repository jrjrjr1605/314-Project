"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AppSidebar } from "@/components/pin-app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search as SearchIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type PinRequest = {
  id: number
  pin_user_id: number
  title: string
  description?: string | null
  status: "pending" | "assigned" | "completed"
  created_at?: string | null
  updated_at?: string | null
  view?: number
  shortlistees_count?: number
  category_name?: string | null
  category_id?: number | null
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

export default function PINDashboard() {
  const [searchParams] = useSearchParams()
  let pinId = searchParams.get("pin_user_id")

  if (!pinId) {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    pinId = user.pin_user_id ? String(user.pin_user_id) : null
  }

  const [requests, setRequests] = useState<PinRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🟩 Categories
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Viewer
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selected, setSelected] = useState<PinRequest | null>(null)

  // Editor
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PinRequest | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Search
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "assigned" | "completed"
  >("all")

  const buildListUrl = (id: string, filter?: string) => {
    const u = new URL(`${API_BASE}/api/pin-requests`)
    u.searchParams.set("id", id)
    if (filter && filter.trim()) u.searchParams.set("filter", filter.trim())
    return u.toString()
  }
  const buildUpdateUrl = (reqId: number) =>
    `${API_BASE}/api/pin-requests/${reqId}`
  const buildDeleteUrl = (reqId: number) =>
    `${API_BASE}/api/pin-requests/${reqId}`

  // ----------- Fetch Requests -----------
  const fetchRequests = async (id: string, filter: string = "", signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildListUrl(id, filter), {
        signal,
        headers: { Accept: "application/json" },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : data.items ?? []
      setRequests(list)
    } catch (e: any) {
      if (e?.name !== "AbortError")
        setError(e?.message || "Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  // ----------- Fetch Categories -----------
  const fetchCategories = async () => {
    setLoadingCategories(true)
    try {
      const res = await fetch(`${API_BASE}/api/categories`)
      if (!res.ok) throw new Error("Failed to fetch categories")
      const data = await res.json()
      setCategories(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingCategories(false)
    }
  }

  // --- Manual search hitting a different API ---
  const handleSearch = async () => {
    if (!pinId || !query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${API_BASE}/api/pin-requests/search?search_input=${encodeURIComponent(
          query.trim()
        )}&pin_user_id=${pinId}`,
        { headers: { Accept: "application/json" } }
      )

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const list = Array.isArray(data) ? data : data.items ?? []
      setRequests(list)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Search failed")
    } finally {
      setLoading(false)
    }
  }

  // --- Reset search ---
  const handleReset = async () => {
    if (!pinId) return
    setQuery("")
    await fetchRequests(pinId, "")
  }

  // ----------- Delete -----------
  const handleDelete = async (req: PinRequest) => {
    if (req.status !== "pending") return
    if (!window.confirm("Delete request? This cannot be undone.")) return
    try {
      const res = await fetch(buildDeleteUrl(req.id), { method: "DELETE" })
      const result = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(result.detail || `HTTP ${res.status}`)

      if (result === true) {
        // ✅ Success — remove from list silently
        setRequests((prev) => prev.filter((r) => r.id !== req.id))
      } else if (typeof result === "string") {
        // ⚠️ Show backend error message
        alert(result)
      }
    } catch (e: any) {
      alert(e?.message || "Failed to delete request")
    }
  }


  // ----------- Viewer -----------
  const openViewer = (r: PinRequest) => {
    setSelected(r)
    setViewerOpen(true)
  }

  // ----------- Editor -----------
  const openEditor = async (r: PinRequest) => {
    setEditTarget(r)
    setEditTitle(r.title)
    setEditDescription(r.description ?? "")
    setEditCategoryId(r.category_id ?? null)
    setSaveError(null)
    await fetchCategories()
    setEditOpen(true)
  }

  // Save edits
  const handleSave = async () => {
    if (!editTarget) return
    const body = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      category_id: editCategoryId,
    }
    if (!body.title) {
      setSaveError("Title is required.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(buildUpdateUrl(editTarget.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      })

      const result = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(result.detail || `HTTP ${res.status}`)

      if (result === true) {
        // ✅ Success — refresh list and close modal
        await fetchRequests(pinId!, "")
        setEditOpen(false)
        setEditTarget(null)
      } else if (typeof result === "string") {
        // ⚠️ Show backend validation / logic error
        setSaveError(result)
      }
    } catch (e: any) {
      setSaveError(e?.message || "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  // ----------- Lifecycle -----------
  useEffect(() => {
    if (!pinId) return
    const ctrl = new AbortController()
    fetchRequests(pinId, undefined, ctrl.signal)
    return () => ctrl.abort()
  }, [pinId])

  const filtered = useMemo(() => {
    let base = requests
    if (filterStatus !== "all") base = base.filter((r) => r.status === filterStatus)
    return base
  }, [requests, filterStatus])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const at = a.created_at ? new Date(a.created_at).getTime() : 0
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0
      return bt - at
    })
  }, [filtered])

  const totals = useMemo(() => {
    let pending = 0, assigned = 0, completed = 0
    for (const r of requests) {
      if (r.status === "pending") pending++
      else if (r.status === "assigned") assigned++
      else if (r.status === "completed") completed++
    }
    return {
      total: requests.length,
      pending,
      assigned,
      completed,
      active: pending + assigned,
      past: completed,
    }
  }, [requests])

  // ----------- UI -----------
  if (!pinId) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 bg-gray-50 p-6">
            <Card className="max-w-xl">
              <CardHeader>
                <CardTitle>No PIN selected</CardTitle>
                <CardDescription>
                  Append <code>?id=&lt;pin_user_id&gt;</code> to the URL.
                </CardDescription>
              </CardHeader>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 bg-gray-50 p-6 space-y-10">
          {/* --- Summary Cards --- */}
          <div className="flex flex-wrap gap-6">
            <Card className="w-[370px] h-[180px]">
              <CardHeader className="pb-2">
                <CardTitle>Total Number of Requests</CardTitle>
                <CardDescription>Active / Past</CardDescription>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <p className="text-4xl font-bold text-gray-800">{totals.total}</p>
                <div className="text-right">
                  <div className="text-green-600 font-semibold">
                    Active: {totals.active}
                  </div>
                  <div className="text-red-600 font-semibold">
                    Past: {totals.past}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="w-[420px] h-[180px]">
              <CardHeader className="pb-2">
                <CardTitle>Filter by status</CardTitle>
                <CardDescription>Show requests by status</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {["all", "pending", "assigned", "completed"].map((s) => (
                  <Button
                    key={s}
                    variant={filterStatus === s ? "default" : "outline"}
                    onClick={() => setFilterStatus(s as typeof filterStatus)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="w-[375px] h-[180px]">
              <CardHeader className="pb-2">
                <CardTitle>Search requests</CardTitle>
                <CardDescription>Title or description</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <Button onClick={() => setSearchOpen(true)}>
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* --- Grid --- */}
          {loading && <p>Loading requests…</p>}
          {error && <p className="text-red-600">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
            {!loading && !error &&
              sorted.map((r) => (
                <Card
                  key={r.id}
                  className="h-full flex flex-col hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">
                        {r.title}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="bg-100 text-gray-900 border border-gray-200 capitalize"
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <CardDescription className="italic text-gray-600">
                      {r.category_name || "Misc"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3 grow">
                    {r.description && (
                      <p className="text-sm text-gray-700 line-clamp-4">{r.description}</p>
                    )}
                    <div className="mt-auto flex gap-2">
                      <Button size="sm" onClick={() => openViewer(r)}>View</Button>
                      {r.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:text-red-700 hover:border-red-400"
                          onClick={() => handleDelete(r)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

                    {/* --- View Dialog --- */}
          <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-3">
                  <span>{selected?.title ?? "Request"}</span>
                  {selected && (
                    <Badge
                      variant="outline"
                      className="capitalize bg-gray-100 text-gray-900 border border-gray-200"
                    >
                      {selected.status}
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {selected?.description && (
                  <p className="text-sm text-gray-800 whitespace-pre-line">
                    {selected.description}
                  </p>
                )}
                <div className="text-xs text-gray-500 grid grid-cols-2 gap-y-1">
                  <span>Category:</span>
                  <span className="text-right">{selected?.category_name ?? "Misc"}</span>
                  <span>Created:</span>
                  <span className="text-right">{formatDT(selected?.created_at)}</span>
                  <span>Updated:</span>
                  <span className="text-right">{formatDT(selected?.updated_at)}</span>
                  <span>Views:</span>
                  <span className="text-right">{selected?.view ?? 0}</span>
                  <span>Shortlistees:</span>
                  <span className="text-right">{selected?.shortlistees_count ?? 0}</span>
                </div>
              </div>
              <DialogFooter className="mt-4 flex justify-between">
                {selected?.status === "pending" && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setViewerOpen(false)
                      openEditor(selected)
                    }}
                  >
                    Edit
                  </Button>
                )}
                <Button onClick={() => setViewerOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* --- Edit Dialog --- */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Request</DialogTitle>
                <DialogDescription>
                  Update the title, description, and category.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter a title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Describe the request"
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <select
                    id="edit-category"
                    value={editCategoryId ?? ""}
                    onChange={(e) =>
                      setEditCategoryId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    disabled={loadingCategories}
                  >
                    <option value="">No category / Not sure</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              </div>

              <DialogFooter className="mt-2">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !editTitle.trim()}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* --- Search Dialog --- */}
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Search Requests</DialogTitle>
                <DialogDescription>
                  Enter a keyword to filter by title or description.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Search requests..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearchOpen(false)
                      handleSearch()
                    }
                  }}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSearchOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setSearchOpen(false)
                    handleSearch()
                  }}
                >
                  Search
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  )
}
