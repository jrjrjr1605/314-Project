"use client"

import { useEffect, useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/pm-app-sidebar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

type Category = {
  id: number
  name: string
  created_at?: string | null
  updated_at?: string | null
}

export default function PMDashboard() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [dailyReportOpen, setDailyReportOpen] = useState(false)
  const [weeklyReportOpen, setWeeklyReportOpen] = useState(false)
  const [monthlyReportOpen, setMonthlyReportOpen] = useState(false)

  const fetchAllCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/categories`, { headers: { Accept: "application/json" } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as Category[]
      setCategories(data)
    } catch (e: any) {
      setError(e?.message || "Failed to fetch categories")
    } finally {
      setLoading(false)
    }
  }

  const fetchSearchedCategories = async (term: string) => {
    if (!term.trim()) return fetchAllCategories()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/categories/search?search_input=${encodeURIComponent(term)}`, {
        headers: { Accept: "application/json" },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as Category[]
      setCategories(data)
    } catch (e: any) {
      setError(e?.message || "Failed to search categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllCategories()
  }, [])

  const handleCreate = async () => {
    if (!categoryName.trim()) return alert("Name is required")
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim() }),
      })
      const result = await res.json()
      if (result === true) {
        alert("✅ Category created successfully!")
        await fetchAllCategories()
        setNewOpen(false)
        setCategoryName("")
      } else if (typeof result === "string") {
        alert(`❌ ${result}`)
      } else {
        alert("⚠️ Unexpected response from server.")
      }
    } catch (e: any) {
      alert(e?.message || "Failed to create category")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedCategory) return
    if (!categoryName.trim()) return alert("Name is required")
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/api/categories/${selectedCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim() }),
      })
      const result = await res.json()
      if (result === true) {
        alert("✅ Category updated successfully!")
        await fetchAllCategories()
        setEditOpen(false)
        setSelectedCategory(null)
        setCategoryName("")
      } else if (typeof result === "string") {
        alert(`❌ ${result}`)
      } else {
        alert("⚠️ Unexpected response from server.")
      }
    } catch (e: any) {
      alert(e?.message || "Failed to update category")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    const ok = window.confirm(`Delete category "${cat.name}"?\n\nAll requests using this category will be updated to have no category.`)
    if (!ok) return
    try {
      const res = await fetch(`${API_BASE}/api/categories/${cat.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      })
      let data: any = null
      try {
        data = await res.json()
      } catch {
        data = await res.text()
      }
      if (!res.ok) throw new Error(typeof data === "string" ? data : "Failed to delete category")
      if (data === true || data?.success === true) {
        alert(`✅ Category "${cat.name}" deleted. Requests using it were set to no category.`)
        setCategories(prev => prev.filter(c => c.id !== cat.id))
      } else if (typeof data === "string") {
        alert(`⚠️ ${data}`)
      } else {
        alert("❌ Failed to delete category. Please try again.")
      }
    } catch (e: any) {
      alert(e?.message || "Failed to delete category")
    }
  }

  const handleSearch = () => {
    if (searchTerm.trim()) fetchSearchedCategories(searchTerm)
    else fetchAllCategories()
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AppSidebar />
        <main className="flex-1 flex flex-col items-center p-8 w-full space-y-8">
          {/* Reports */}
          <section className="w-full max-w-6xl">
            <div className="flex flex-col items-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold mb-2">Generate Reports</h2>
              <p className="text-gray-600 mb-6 text-center max-w-2xl">
                Quickly generate daily, weekly, or monthly summaries for all categories and requests.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button onClick={async () => {
                  const res = await fetch(`${API_BASE}/api/pm-daily-report`)
                  if (res.ok) setDailyReportOpen(true)
                  else alert("Failed to generate daily report")
                }}>Daily Report</Button>
                <Button onClick={async () => {
                  const res = await fetch(`${API_BASE}/api/pm-weekly-report`)
                  if (res.ok) setWeeklyReportOpen(true)
                  else alert("Failed to generate weekly report")
                }}>Weekly Report</Button>
                <Button onClick={async () => {
                  const res = await fetch(`${API_BASE}/api/pm-monthly-report`)
                  if (res.ok) setMonthlyReportOpen(true)
                  else alert("Failed to generate monthly report")
                }}>Monthly Report</Button>
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="w-full max-w-6xl">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">Manage Service Categories</h2>
                <p className="text-gray-600 text-sm mb-4">
                  View, search, add, edit, or delete service categories available in the system.
                </p>

                {/* Search + Add Category on same line */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Input
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="sm:w-80"
                    />
                    <Button onClick={handleSearch}>Search</Button>
                    <Button variant="outline" onClick={() => { setSearchTerm(""); fetchAllCategories() }}>Reset</Button>
                  </div>
                  <Button className="whitespace-nowrap" onClick={() => setNewOpen(true)}>+ Add Category</Button>
                </div>
              </div>

              {/* Table */}
              {loading && <p className="text-sm text-gray-500">Loading categories…</p>}
              {error && <p className="text-sm text-red-600">Error: {error}</p>}
              {!loading && !error && categories.length === 0 && (
                <p className="text-sm text-gray-600">No categories found.</p>
              )}
              {!loading && !error && categories.length > 0 && (
                <div className="overflow-x-auto w-full">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell>{cat.id}</TableCell>
                          <TableCell>{cat.name}</TableCell>
                          <TableCell>{cat.created_at ? new Date(cat.created_at).toLocaleDateString("en-SG") : "—"}</TableCell>
                          <TableCell>{cat.updated_at ? new Date(cat.updated_at).toLocaleDateString("en-SG") : "—"}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedCategory(cat); setCategoryName(cat.name); setEditOpen(true) }}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(cat)}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </section>
          {/* 🟩 New Category Dialog */}
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new service category for assignment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Name</Label>
                <Input
                  placeholder="Enter category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setNewOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 🟩 Edit Category Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update the name of this category.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Name</Label>
                <Input
                  placeholder="Enter category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={saving}>
                  {saving ? "Saving..." : "Update"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* 🟩 Report Generated Dialogs */}
          <Dialog open={dailyReportOpen} onOpenChange={setDailyReportOpen}>
            <DialogContent className="sm:max-w-md text-center">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-green-600">
                  ✅ Daily Report Generated!
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2">
                  Your daily report has been successfully generated.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-4 flex justify-center">
                <Button
                  onClick={() => {
                    window.open("/pm-daily-report", "_blank")
                  }}
                >
                  View Full Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={weeklyReportOpen} onOpenChange={setWeeklyReportOpen}>
            <DialogContent className="sm:max-w-md text-center">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-green-600">
                  ✅ Weekly Report Generated!
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2">
                  Your weekly report has been successfully generated.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-4 flex justify-center">
                <Button
                  onClick={() => {
                    window.open("/pm-weekly-report", "_blank")
                  }}
                >
                  View Full Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={monthlyReportOpen} onOpenChange={setMonthlyReportOpen}>
            <DialogContent className="sm:max-w-md text-center">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-green-600">
                  ✅ Monthly Report Generated!
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2">
                  Your monthly report has been successfully generated.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-4 flex justify-center">
                <Button
                  onClick={() => {
                    window.open("/pm-monthly-report", "_blank")
                  }}
                >
                  View Full Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  )
}
