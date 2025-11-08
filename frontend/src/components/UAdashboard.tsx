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
  const [totalUsers, setTotalUsers] = useState(0)
  const [activeUsers, setActiveUsers] = useState(0)
  const [suspendedUsers, setSuspendedUsers] = useState(0)
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [loading, setLoading] = useState(false)

  // --- Fetch all users and update stats ---
  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8000/api/users")
      if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`)
      const data = await res.json()

      // Sort ascending by ID before saving
      const sortedData = [...data].sort((a, b) => a.id - b.id)
      setUsers(sortedData)

      const total = sortedData.length
      const active = sortedData.filter(
        (u: any) => u.status?.toLowerCase() === "active"
      ).length
      const suspended = sortedData.filter(
        (u: any) => u.status?.toLowerCase() === "suspended"
      ).length

      // --- Role-based counts (ACTIVE users only) ---
      const counts: Record<string, number> = {}
      sortedData
        .filter((u: any) => u.status?.toLowerCase() === "active")
        .forEach((u: any) => {
          const role = u.role?.toUpperCase() || "UNASSIGNED"
          counts[role] = (counts[role] || 0) + 1
        })

      setTotalUsers(total)
      setActiveUsers(active)
      setSuspendedUsers(suspended)
      setRoleCounts(counts)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // --- Update user info ---
  async function UpdateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return

    try {
      const userToUpdate = {
        ...selectedUser,
        role:
          selectedUser.role?.toUpperCase() === "UNASSIGNED"
            ? null
            : selectedUser.role,
      }

      const res = await fetch(
        `http://localhost:8000/api/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userToUpdate),
        }
      )

      const result = await res.json()

      if (!res.ok) throw new Error(`Failed to update user: ${res.status}`)

      if (result === true) {
        alert(`${selectedUser.username} updated successfully!`)
        setOpen(false)
        await fetchUsers()
      } else if (typeof result === "string") {
        alert(`${result}`)
      } else {
        alert("Unexpected response from server.")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user. Check console for details.")
    }
  }

  // --- Suspend or Reactivate user ---
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
        alert(
          user.status === "active"
            ? `${user.username} has been suspended.`
            : `${user.username} has been reactivated.`
        )
        await fetchUsers() // Always reload sorted ascending
      } else if (typeof result === "string") {
        alert(`${result}`)
      } else {
        alert("Unexpected response from server.")
      }
    } catch (error) {
      console.error(`Error trying to ${action} user:`, error)
      alert(`Failed to ${action} user.`)
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />

        {/* Main content */}
        <main className="flex-1 bg-gray-50 p-6 space-y-10">
          {/* --- First Row: Summary Cards --- */}
          <div className="flex flex-wrap gap-10 justify-start">
            <Card className="w-[360px] h-[150px] flex-shrink-0">
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

            <Card className="w-[360px] h-[150px] flex-shrink-0">
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Accounts currently active</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">
                  {loading ? "..." : activeUsers}
                </p>
              </CardContent>
            </Card>

            <Card className="w-[360px] h-[150px] flex-shrink-0">
              <CardHeader>
                <CardTitle>Suspended Users</CardTitle>
                <CardDescription>Accounts that are deactivated</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-red-600">
                  {loading ? "..." : suspendedUsers}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* --- Second Row: Role Breakdown --- */}
          <div className="flex flex-wrap gap-10 justify-start">
            {["PLATFORM", "ADMIN", "CSR", "PIN", "UNASSIGNED"].map((role) => (
              <Card key={role} className="w-[200px] h-[170px] flex-shrink-0">
                <CardHeader>
                  <CardTitle>{role}</CardTitle>
                  <CardDescription>
                    Active User Accounts with {role} role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">
                    {loading ? "..." : roleCounts[role] ?? 0}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* --- User Accounts Table --- */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center justify-between pb-3 border-b flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                User Accounts
              </h2>
              <div className="flex items-center gap-3">
                <Select
                  value={roleFilter}
                  onValueChange={(value) => setRoleFilter(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="PLATFORM">PLATFORM</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="CSR">CSR</SelectItem>
                    <SelectItem value="PIN">PIN</SelectItem>
                    <SelectItem value="UNASSIGNED">UNASSIGNED</SelectItem>
                  </SelectContent>
                </Select>

                <input
                  type="text"
                  placeholder="Search by username, role, or email..."
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
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
                {users
                  .filter((user) => {
                    if (
                      roleFilter !== "ALL" &&
                      (user.role?.toUpperCase() || "UNASSIGNED") !== roleFilter
                    )
                      return false
                    if (!searchTerm) return true
                    const lower = searchTerm.toLowerCase()
                    return (
                      user.username.toLowerCase().includes(lower) ||
                      user.role?.toLowerCase().includes(lower) ||
                      user.email_address.toLowerCase().includes(lower) ||
                      user.status.toLowerCase().includes(lower)
                    )
                  })
                  .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.role ?? ""}</TableCell>
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

                      {/* Actions */}
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
                      value={selectedUser.role?.toUpperCase() || "UNASSIGNED"}
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
                        <SelectItem value="PLATFORM">PLATFORM</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="CSR">CSR</SelectItem>
                        <SelectItem value="PIN">PIN</SelectItem>
                        <SelectItem value="UNASSIGNED">UNASSIGNED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter className="flex justify-end gap-2">
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
