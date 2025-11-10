"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function UADashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [roleMap, setRoleMap] = useState<Record<number, string>>({})
  const [totalUsers, setTotalUsers] = useState(0)
  const [activeUsers, setActiveUsers] = useState(0)
  const [suspendedUsers, setSuspendedUsers] = useState(0)
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  // --- Fetch all user profiles (roles) ---
  async function fetchRoles() {
    try {
      const res = await fetch("http://localhost:8000/api/user_profiles")
      const data = await res.json()
      const map: Record<number, string> = {}
      data.forEach((r: any) => {
        map[r.id] = r.name.toUpperCase()
      })
      setRoleMap(map)
    } catch (err) {
      console.error("Error fetching roles:", err)
    }
  }

  // --- Fetch all users ---
  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8000/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      const data = await res.json()
      const sorted = [...data].sort((a, b) => a.id - b.id)
      setUsers(sorted)
      setFilteredUsers(sorted)
      setTotalUsers(sorted.length)
    } catch (err) {
      console.error("Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }

  // --- Wait for both users & roles before computing counts ---
  useEffect(() => {
    if (Object.keys(roleMap).length > 0 && users.length > 0) {
      const active = users.filter((u) => u.status === "active").length
      const suspended = users.filter((u) => u.status === "suspended").length

      const counts: Record<string, number> = {}
      users
        .filter((u) => u.status === "active")
        .forEach((u) => {
          const roleName = getRoleName(u.role)
          counts[roleName] = (counts[roleName] || 0) + 1
        })

      setActiveUsers(active)
      setSuspendedUsers(suspended)
      setRoleCounts(counts)
    }
  }, [roleMap, users])

  // --- Initial load ---
  useEffect(() => {
    fetchRoles().then(fetchUsers)
  }, [])

  // --- Helper to resolve role name ---
  function getRoleName(role: any): string {
    if (!role) return "UNASSIGNED"
    if (typeof role === "object" && role.name) return role.name.toUpperCase()
    if (typeof role === "number") return roleMap[role] || `ROLE #${role}`
    if (typeof role === "string") return role.toUpperCase()
    return "UNKNOWN"
  }

  // --- Manual search ---
  async function handleSearch() {
    const query = new URLSearchParams({ search_input: searchTerm }).toString()
    const res = await fetch(`http://localhost:8000/api/users/search?${query}`)
    const data = await res.json()
    setFilteredUsers(data)
  }

  function resetFilters() {
    setSearchTerm("")
    setFilteredUsers(users)
  }

  // --- Update user info ---
  async function UpdateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return

    // Convert role name → ID for backend
    let roleValue: number | null = null
    if (selectedUser.role && typeof selectedUser.role === "string") {
      const match = Object.entries(roleMap).find(
        ([, name]) => name === selectedUser.role.toUpperCase()
      )
      roleValue = match ? Number(match[0]) : null
    } else if (typeof selectedUser.role === "number") {
      roleValue = selectedUser.role
    }

    const updatedUser = {
      ...selectedUser,
      role: roleValue,
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedUser),
        }
      )

      const result = await res.json()
      if (result === true) {
        // ✅ backend success: just refresh silently
        setOpen(false)
        fetchUsers()
      } else if (typeof result === "string") {
        // ⚠️ backend returned failure message
        alert(result)
      }
    } catch (err) {
      console.error("Error updating user:", err)
      alert("Failed to update user.")
    }
  }

  // --- Suspend / Reactivate user ---
  async function toggleUserStatus(user: any) {
    const action = user.status === "active" ? "suspend" : "reactivate"
    const confirmMsg =
      user.status === "active"
        ? `Suspend ${user.username}?`
        : `Reactivate ${user.username}?`

    if (!confirm(confirmMsg)) return

    try {
      const res = await fetch(
        `http://localhost:8000/api/users/${action}/${user.id}`,
        { method: "PUT" }
      )

      const result = await res.json()
      if (result === true) {
        // ✅ success → silent refresh
        fetchUsers()
      } else if (typeof result === "string") {
        // ⚠️ failure message from backend
        alert(result)
      }
    } catch (err) {
      console.error(`Error trying to ${action} user:`, err)
      alert(`Failed to ${action} user.`)
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 bg-gray-50 p-6 space-y-10">
          {/* --- Summary Cards --- */}
          <div className="flex flex-wrap gap-10 justify-start">
            <Card className="w-[360px] h-[150px]">
              <CardHeader>
                <CardTitle>User Accounts</CardTitle>
                <CardDescription>Total number of user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-gray-800">
                  {loading ? "..." : totalUsers}
                </p>
              </CardContent>
            </Card>

            <Card className="w-[360px] h-[150px]">
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Currently active accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">
                  {loading ? "..." : activeUsers}
                </p>
              </CardContent>
            </Card>

            <Card className="w-[360px] h-[150px]">
              <CardHeader>
                <CardTitle>Suspended Users</CardTitle>
                <CardDescription>Accounts that are inactive</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-red-600">
                  {loading ? "..." : suspendedUsers}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* --- Role Breakdown --- */}
          <div className="flex flex-wrap gap-10 justify-start">
            {["PLATFORM", "ADMIN", "CSR", "PIN", "UNASSIGNED"].map((role) => (
              <Card key={role} className="w-[200px] h-[170px]">
                <CardHeader>
                  <CardTitle>{role}</CardTitle>
                  <CardDescription>Active {role} users</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">
                    {loading ? "..." : roleCounts[role] ?? 0}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* --- Table --- */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                User Accounts
              </h2>
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  placeholder="Search by username, role, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-[250px]"
                />
                <Button onClick={handleSearch}>Search</Button>
                <Button variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </div>

            <Table>
              <TableCaption>List of all user accounts</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{getRoleName(user.role)}</TableCell>
                    <TableCell>{user.email_address}</TableCell>
                    <TableCell
                      className={
                        user.status === "active"
                          ? "text-green-600 font-semibold"
                          : "text-red-500 font-semibold"
                      }
                    >
                      {user.status}
                    </TableCell>
                    <TableCell>
                      {user.last_login
                        ? new Date(user.last_login).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : ""}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setOpen(true)
                          }}
                        >
                          Update
                        </Button>
                        <Button
                          variant={
                            user.status === "active"
                              ? "destructive"
                              : "default"
                          }
                          size="sm"
                          onClick={() => toggleUserStatus(user)}
                        >
                          {user.status === "active"
                            ? "Suspend"
                            : "Reactivate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* --- Update User Modal --- */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Update User</DialogTitle>
                <DialogDescription>
                  Modify user account information and save changes.
                </DialogDescription>
              </DialogHeader>

              {selectedUser && (
                <form onSubmit={UpdateUser} className="space-y-4 mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={selectedUser.username}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          username: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={selectedUser.email_address}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          email_address: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={getRoleName(selectedUser.role)}
                      onValueChange={(value) =>
                        setSelectedUser({
                          ...selectedUser,
                          role: value === "UNASSIGNED" ? null : value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(roleMap).map((rname) => (
                          <SelectItem key={rname} value={rname}>
                            {rname}
                          </SelectItem>
                        ))}
                        <SelectItem value="UNASSIGNED">UNASSIGNED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  )
}
