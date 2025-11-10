"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type UserProfile = {
  id: number
  name: string
  status: "active" | "suspended"
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

export default function UAUserProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
  const [newProfile, setNewProfile] = useState({ name: "" })
  const [searchInput, setSearchInput] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  // --- Fetch all profiles ---
  async function fetchProfiles() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/user_profiles`)
      if (!res.ok) throw new Error("Failed to fetch user profiles")
      const data = await res.json()
      setProfiles(data)
    } catch (err) {
      console.error(err)
      alert("❌ Failed to load profiles.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

    // --- Manual search function ---
    async function handleSearch() {
    if (!searchInput.trim()) {
        // If the search bar is empty, reload all profiles
        return fetchProfiles()
    }

    setLoading(true)
    try {
        const res = await fetch(
        `${API_BASE}/api/user_profiles/search?search_input=${encodeURIComponent(searchInput)}`
        )

        if (res.status === 404) {
        // No profiles found
        alert(`⚠️ No profiles found matching "${searchInput}".`)
        setProfiles([]) // clear the table
        return
        }

        if (!res.ok) throw new Error("Failed to search profiles")

        const data = await res.json()
        setProfiles(data)
    } catch (err) {
        console.error(err)
        alert("❌ Search failed. Please try again.")
    } finally {
        setLoading(false)
    }
    }

    // --- Create new profile ---
    async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault()
    setActionLoading(true)
    try {
        const res = await fetch(`${API_BASE}/api/user_profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfile),
        })

        // Try to parse JSON, fallback to text if not valid JSON
        const contentType = res.headers.get("content-type")
        let result: any

        if (contentType && contentType.includes("application/json")) {
        result = await res.json()
        } else {
        result = await res.text()
        }

        // 🔍 Handle result depending on what backend sent
        if (typeof result === "string") {
        // Backend returned a raw string (custom error message)
        alert(`❌ ${result}`)
        return
        }

        if (!res.ok) {
        // If backend raised HTTPException or similar
        throw new Error(result.detail || "Failed to create profile")
        }

        // ✅ Success (True or JSON success message)
        alert("✅ User profile created successfully!")
        setNewProfile({ name: "" })
        setOpenDialog(false)
        fetchProfiles()
    } catch (err: any) {
        console.error(err)
        alert(`❌ ${err.message}`)
    } finally {
        setActionLoading(false)
    }
    }


  // --- Update profile name ---
  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProfile) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/user_profiles/${selectedProfile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedProfile.name }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result.detail || "Failed to update profile")

      alert(`✅ Profile renamed to "${selectedProfile.name}" successfully!`)
      setEditDialog(false)
      setSelectedProfile(null)
      fetchProfiles()
    } catch (err: any) {
      console.error(err)
      alert(`❌ ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // --- Suspend / Reactivate handlers ---
  async function handleSuspend(profile: UserProfile) {
    if (!confirm(`⚠️ Are you sure you want to suspend "${profile.name}"?`)) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/user_profiles/suspend/${profile.id}`, {
        method: "PUT",
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result.detail || "Failed to suspend profile")

      alert(`🟠 "${profile.name}" has been suspended.`)
      fetchProfiles()
    } catch (err: any) {
      console.error(err)
      alert(`❌ ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReactivate(profile: UserProfile) {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/user_profiles/reactivate/${profile.id}`, {
        method: "PUT",
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result.detail || "Failed to reactivate profile")

      alert(`✅ "${profile.name}" has been reactivated.`)
      fetchProfiles()
    } catch (err: any) {
      console.error(err)
      alert(`❌ ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />

        <main className="flex-1 p-8 space-y-6">
          {/* --- Header Controls --- */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-2xl font-bold">User Profiles</h1>

            <div className="flex gap-3 items-center">
              <Input
                placeholder="Enter profile name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-[250px]"
              />
              <Button
                onClick={handleSearch}
                disabled={searching || loading}
              >
                {searching ? "Searching..." : "Search"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput("")
                  fetchProfiles()
                }}
                disabled={loading}
              >
                Reset
              </Button>
              <Button variant="outline" onClick={() => setOpenDialog(true)}>
                + Create User Profile
              </Button>
            </div>
          </div>

          {/* --- Table Section --- */}
          <div className="bg-white shadow rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Loading profiles...
                    </TableCell>
                  </TableRow>
                ) : profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No profiles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>{profile.id}</TableCell>
                      <TableCell>{profile.name}</TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            profile.status === "active"
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {profile.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={profile.status === "suspended" || actionLoading}
                          onClick={() => {
                            setSelectedProfile(profile)
                            setEditDialog(true)
                          }}
                        >
                          Edit
                        </Button>
                        {profile.status === "active" ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleSuspend(profile)}
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleReactivate(profile)}
                          >
                            Reactivate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      {/* --- Create Dialog --- */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User Profile</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateProfile} className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                value={newProfile.name}
                onChange={(e) => setNewProfile({ name: e.target.value })}
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Edit Dialog --- */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          {selectedProfile && (
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={selectedProfile.name}
                  onChange={(e) =>
                    setSelectedProfile({ ...selectedProfile, name: e.target.value })
                  }
                  required
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialog(false)}
                  disabled={actionLoading}
                >
                  Close
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
