"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

type RequestItem = {
  id: number
  pin_user_id: number
  title: string
  description?: string | null
  status: "pending" | "assigned" | "completed"
  service_type?: string | null
  assigned_to?: number | null
  created_at?: string | null
  updated_at?: string | null
  shortlistees?: CSRItem[]
}

type CSRItem = {
  user_id: number
  name: string
  email_address?: string | null
}

export default function AssignmentPage() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null)
  const [csrOptions, setCsrOptions] = useState<CSRItem[]>([])
  const [saving, setSaving] = useState(false)

  // 🟩 Fetch all requests (pending, assigned, completed)
  const fetchRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/show-all-requests`, {
        headers: { Accept: "application/json" },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as RequestItem[]
      setRequests(data)
    } catch (e: any) {
      setError(e?.message || "Failed to fetch requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // 🟦 Derived lists
  const pendingRequests = useMemo(() => requests.filter(r => r.status === "pending"), [requests])
  const assignedRequests = useMemo(() => requests.filter(r => r.status === "assigned"), [requests])

  // 🟩 Open assign modal and fetch shortlistees
  const handleOpenAssign = async (req: RequestItem) => {
    setSelectedRequest(req)
    setAssignOpen(true)
    try {
      const shortlistRes = await fetch(`${API_BASE}/api/show-all-requests/${req.id}`)
      if (shortlistRes.ok) {
        const data = await shortlistRes.json()
        setCsrOptions(data.shortlistees || [])
      } else {
        setCsrOptions([])
      }
    } catch (e) {
      console.warn("Could not load shortlistees:", e)
      setCsrOptions([])
    }
  }

  // 🟩 Assign random CSR and auto-refresh
  const handleAssignRandom = async () => {
    if (!selectedRequest || csrOptions.length === 0) return

    const randomCSR = csrOptions[Math.floor(Math.random() * csrOptions.length)]
    setSaving(true)

    try {
      const body = { assigned_to: randomCSR.user_id, status: "assigned" }
      const res = await fetch(`${API_BASE}/api/requests/${selectedRequest.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(await res.text())

      // 🟩 Refresh list automatically after assignment
      await fetchRequests()

      setAssignOpen(false)
      setSelectedRequest(null)
    } catch (e: any) {
      alert(e?.message || "Failed to assign request")
    } finally {
      setSaving(false)
    }
  }

  // 🟩 Mark as complete and auto-refresh
  const handleComplete = async (req: RequestItem) => {
    const ok = window.confirm(`Mark "${req.title}" as completed?`)
    if (!ok) return

    try {
      const res = await fetch(`${API_BASE}/api/requests/${req.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      })

      if (!res.ok) throw new Error(await res.text())

      // 🟩 Auto-refresh after completion
      await fetchRequests()
    } catch (e: any) {
      alert(e?.message || "Failed to complete request")
    }
  }

  return (
    <main className="p-6 bg-gray-50 min-h-screen space-y-10">
      <h1 className="text-2xl font-bold">Requests Assignment</h1>

      {loading && <p className="text-sm text-gray-500">Loading requests…</p>}
      {error && <p className="text-sm text-red-600">Error: {error}</p>}

      {/* 🟡 Pending Requests */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Pending Requests</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No pending requests.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pendingRequests.map(r => (
              <Card key={r.id} className="flex flex-col hover:shadow-sm transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{r.title}</CardTitle>
                    <Badge variant="outline" className="border-gray-300 capitalize">{r.status}</Badge>
                  </div>
                  {r.service_type && (
                    <CardDescription className="capitalize">{r.service_type}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col grow">
                  <p className="text-sm text-gray-700 line-clamp-3">{r.description}</p>
                  <div className="mt-auto">
                    <Button
                      className="w-full"
                      onClick={() => handleOpenAssign(r)}
                      disabled={saving}
                    >
                      {saving && selectedRequest?.id === r.id ? "Processing..." : "Assign"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 🔵 Assigned Requests */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Assigned Requests</h2>
        {assignedRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No assigned requests.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assignedRequests.map(r => (
              <Card key={r.id} className="flex flex-col hover:shadow-sm transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{r.title}</CardTitle>
                    <Badge
                      variant="outline"
                      className="border-blue-400 text-blue-600 capitalize"
                    >
                      {r.status}
                    </Badge>
                  </div>
                  {r.service_type && (
                    <CardDescription className="capitalize">{r.service_type}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col grow">
                  <p className="text-sm text-gray-700 line-clamp-3">{r.description}</p>
                  <div className="mt-auto">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleComplete(r)}
                      disabled={saving}
                    >
                      {saving && selectedRequest?.id === r.id ? "Saving..." : "Complete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 🟩 Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Request</DialogTitle>
            <DialogDescription>Select a CSR from the shortlist.</DialogDescription>
          </DialogHeader>

          {csrOptions.length === 0 ? (
            <p className="text-sm text-gray-500">No shortlistees found.</p>
          ) : (
            <div className="space-y-3">
              <Label>Assignment Mode</Label>
              <p className="text-sm text-gray-600">A random CSR will be automatically chosen from the shortlist.</p>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleAssignRandom} disabled={saving || csrOptions.length === 0}>
              {saving ? "Assigning..." : "Assign Random CSR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
