"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type CurrentUser = {
  id: number
  username: string
  role: string | null
  email_address: string
  status: string
  last_login?: string | null
  pin_user_id?: number | null
}

type Category = {
  id: number
  name: string
}

type FormState = {
  pin_user_id: number | null
  title: string
  description: string
  category_id: number | null
  status: "pending"
}

export default function RequestForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 🟩 Load user from localStorage (with pin_user_id)
  const [currentUser] = useState<CurrentUser | null>(() => {
    try {
      const raw = localStorage.getItem("user")
      return raw ? (JSON.parse(raw) as CurrentUser) : null
    } catch {
      return null
    }
  })

  const paramId = searchParams.get("id")

  // 🟩 Use pin_user_id from backend response if available
  const resolvedPinId = useMemo(() => {
    if (currentUser?.pin_user_id) return currentUser.pin_user_id
    if (paramId && !Number.isNaN(Number(paramId))) return Number(paramId)
    return null
  }, [currentUser?.pin_user_id, paramId])

  // 🟩 Categories
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🟩 Form state
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>({
    pin_user_id: resolvedPinId,
    title: "",
    description: "",
    category_id: null,
    status: "pending",
  })

  // Keep pin_user_id synced if user changes
  useEffect(() => {
    if (resolvedPinId && form.pin_user_id !== resolvedPinId) {
      setForm((p) => ({ ...p, pin_user_id: resolvedPinId }))
    }
  }, [resolvedPinId])

  // 🟩 Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true)
      try {
        const res = await fetch("http://localhost:8000/api/categories")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setCategories(data)
      } catch (err: any) {
        console.error(err)
        setError("Failed to load categories.")
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  // 🟩 Submit request to backend
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.pin_user_id) {
      alert("Missing PIN user ID. Please sign in as a PIN user.")
      return
    }
    if (!form.title.trim()) return alert("Title is required")

    const payload = {
      pin_user_id: form.pin_user_id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id,
      status: "pending" as const,
    }

    try {
      setSubmitting(true)
      const res = await fetch("http://localhost:8000/api/pin-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      let parsed: any
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = text
      }

      // 🟩 Follow backend rules exactly:
      // true → redirect only
      // string → show as error
      if (res.ok && parsed === true) {
        navigate(`/pin/dashboard/user?pin_user_id=${encodeURIComponent(String(form.pin_user_id))}`)
      } else {
        const message = typeof parsed === "string" ? parsed : "Failed to create request"
        alert(message)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to create request. Check console for details.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Request</CardTitle>
          <CardDescription>
            Submit a new request. Status will start as{" "}
            <span className="font-semibold">pending</span>.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PIN User ID */}
            <div className="grid gap-2">
              <Label htmlFor="pin_user_id">PIN User ID</Label>
              <Input
                id="pin_user_id"
                value={form.pin_user_id ?? ""}
                readOnly
                placeholder="Auto-filled"
              />
              {!form.pin_user_id && (
                <p className="text-xs text-red-600">
                  Unable to determine PIN id. Please sign in as a PIN user.
                </p>
              )}
            </div>

            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Emergency food assistance"
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Provide any useful details..."
                rows={5}
              />
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category_id">Category (optional)</Label>
              <select
                id="category_id"
                value={form.category_id ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  update("category_id", val ? Number(val) : null)
                }}
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
              {loadingCategories && (
                <p className="text-xs text-gray-500">Loading categories...</p>
              )}
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label>Status</Label>
              <Input value="pending" readOnly />
              <p className="text-xs text-gray-500">
                New requests are created as{" "}
                <span className="font-medium">pending</span>.
              </p>
            </div>

            <CardFooter className="flex justify-end gap-2 px-0">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !form.pin_user_id}>
                {submitting ? "Creating..." : "Create Request"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
