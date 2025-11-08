"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

type FormState = {
  username: string
  email_address: string
  role: string | null
  status: "active" | "suspended"
  password: string
}

export default function CreateUserAccount() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>({
    username: "",
    email_address: "",
    role: null,
    status: "active",
    password: "",
  })

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.username.trim()) return alert("Username is required")
    if (!form.email_address.trim()) return alert("Email is required")
    if (!form.password.trim()) return alert("Password is required")

    const payload = {
      username: form.username.trim(),
      email_address: form.email_address.trim(),
      status: form.status,
      role: form.role ?? null,
      password: form.password,
    }

    try {
      setSubmitting(true)
      const res = await fetch("http://localhost:8000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(`Failed to create user: ${res.status}`)

      if (result === true) {
        alert("✅ User created successfully!")
        navigate("/ua/dashboard")
      } else if (typeof result === "string") {
        // e.g., "Username already exists" or "Failed to create user"
        alert(`⚠️ ${result}`)
      } else {
        alert("❌ Unexpected response from server.")
      }
    } catch (err) {
      console.error(err)
      alert("❌ Failed to create user. Check console for details.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create User Account</CardTitle>
          <CardDescription>Fill in the details to create a new user.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                placeholder="e.g. admin123"
                required
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email_address">Email</Label>
              <Input
                id="email_address"
                type="email"
                value={form.email_address}
                onChange={(e) => update("email_address", e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            {/* Role (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="role">Role (optional)</Label>
              <Select
                value={form.role ?? undefined}
                onValueChange={(val) =>
                  update("role", val === "__NONE__" ? null : (val as FormState["role"]))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No role selected" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">No role (optional)</SelectItem>
                  <SelectItem value="PLATFORM">PLATFORM</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="CSR">CSR</SelectItem>
                  <SelectItem value="PIN">PIN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val: "active" | "suspended") => update("status", val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Enter a password..."
                required
              />
            </div>

            <CardFooter className="flex justify-end gap-2 px-0">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create User"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
