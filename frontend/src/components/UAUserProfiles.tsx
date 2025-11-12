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
  async function get_user_profiles() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/user_profiles`)
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
    get_user_profiles()
  }, [])

  // --- Search ---
  async function search_user_profiles() {
    if (!searchInput.trim()) return get_user_profiles()
    setSearching(true)
    try {
      const res = await fetch(
        `${API_BASE}/api/user_profiles/search?search_input=${encodeURIComponent(searchInput)}`
      )
      const data = await res.json()
      setProfiles(data)
      if (!data.length) alert(`⚠️ No profiles found matching "${searchInput}".`)
    } catch (err) {
      console.error(err)
      alert("❌ Search failed. Please try again.")
    } finally {
      setSearching(false)
    }
  }

  // --- Create profile ---
  async function create_user_profile(e: React.FormEvent) {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/user_profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfile),
      })

      let result: any
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await res.json()
      } else {
        result = await res.text()
      }

      // ✅ Handle backend logic
      if (result === true) {
        setNewProfile({ name: "" })
        setOpenDialog(false)
        get_user_profiles()
      } else if (typeof result === "string") {
        alert(result)
      } else {
        alert("❌ Unexpected response.")
      }
    } catch (err: any) {
      console.error(err)
      alert(`❌ ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // --- Update profile ---
  async function update_user_profile(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProfile) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/user_profiles/${selectedProfile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedProfile.name }),
      })
      let result: any
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await res.json()
      } else {
        result = await res.text()
      }

      if (result === true) {
        setEditDialog(false)
        setSelectedProfile(null)
        get_user_profiles()
      } else if (typeof result === "string") {
        alert(result)
      } else {
        alert("❌ Unexpected response.")
      }
    } catch (err: any) {
      console.error(err)
      alert(`❌ ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // --- Suspend profile ---
  async function suspend_user_profile(profile: UserProfile) {
    try {
      const res = await fetch(`${API_BASE}/api/user_profiles/suspend/${profile.id}`, {
        method: "PUT",
      })
      let result: any
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await res.json()
      } else {
        result = await res.text()
      }

      if (result === true) {
        get_user_profiles()
      } else if (typeof result === "string") {
        alert(result)
      } else {
        alert("❌ Unexpected response.")
      }
    } catch (err: any) {
      console.error(err)
      alert(`❌ ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // --- Reactivate profile ---
  async function handleReactivate(profile: UserProfile) {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/user_profiles/reactivate/${profile.id}`, {
        method: "PUT",
      })
      let result: any
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await res.json()
      } else {
        result = await res.text()
      }

      if (result === true) {
        get_user_profiles()
      } else if (typeof result === "string") {
        alert(result)
      } else {
        alert("❌ Unexpected response.")
      }
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
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-2xl font-bold">User Profiles</h1>

            <div className="flex gap-3 items-center">
              <Input
                placeholder="Enter profile name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-[250px]"
              />
              <Button onClick={search_user_profiles} disabled={searching || loading}>
                {searching ? "Searching..." : "Search"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput("")
                  get_user_profiles()
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
                            onClick={() => suspend_user_profile(profile)}
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

          <form onSubmit={create_user_profile} className="space-y-3">
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
            <form onSubmit={update_user_profile} className="space-y-3">
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
