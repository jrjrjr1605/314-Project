"use client"

import { useEffect, useState, useMemo } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/pm-app-sidebar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import * as XLSX from "xlsx"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

type DailyReportData = {
  date: string
  summary: {
    total: number
    created: number
    assigned: number
    completed: number
  }
  requests: {
    id: number
    title: string
    status: string
    category: string
    created_at?: string | null
    updated_at?: string | null
    completed_at?: string | null
  }[]
}

export default function PMDailyReport() {
  const [data, setData] = useState<DailyReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🟩 Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/pm-daily-report`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err?.message || "Failed to load daily report")
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [])

  const formatDate = (dt?: string | null) => {
    if (!dt) return "-"
    return new Date(dt).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })
  }

  // 🟩 Derived + filtered requests
  const filteredRequests = useMemo(() => {
    if (!data) return []
    let result = [...data.requests]

    // Filter by status
    if (statusFilter !== "all") result = result.filter((r) => r.status === statusFilter)

    // Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      )
    }

    // Sort ascending by ID
    result.sort((a, b) => a.id - b.id)
    return result
  }, [data, statusFilter, searchTerm])

  // 🟩 Export to Excel
  const exportToExcel = () => {
    if (!data) return
    const wb = XLSX.utils.book_new()

    // Summary Sheet
    const summarySheet = XLSX.utils.json_to_sheet([
      {
        "Date": data.date,
        "Total Created": data.summary.created,
        "Total Assigned": data.summary.assigned,
        "Total Completed": data.summary.completed,
        "Total Requests": data.summary.total,
      },
    ])
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary")

    // Requests Sheet
    const requestsSheet = XLSX.utils.json_to_sheet(
      data.requests.map((r) => ({
        ID: r.id,
        Title: r.title,
        Status: r.status,
        Category: r.category,
        Created: r.created_at,
        Updated: r.updated_at,
        Completed: r.completed_at,
      }))
    )
    XLSX.utils.book_append_sheet(wb, requestsSheet, "Requests")

    // Save File
    const fileName = `pm_daily_report_${new Date().toISOString().split("T")[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 p-8 bg-gray-50">
            <div className="max-w-full mx-auto space-y-8">
                {/* 🟢 Header */}
                <div>
                <h1 className="text-2xl font-bold text-gray-800">Daily Report</h1>
                <p className="text-gray-600">
                    Activity summary for {data ? new Date(data.date).toLocaleDateString("en-SG") : "—"}
                </p>
                </div>

                {/* 🟢 Summary Section */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="bg-white shadow rounded-lg p-6 text-center">
                    <h3 className="text-sm text-gray-500">Created</h3>
                    <p className="text-3xl font-semibold text-indigo-600">{data?.summary.created ?? 0}</p>
                </div>
                <div className="bg-white shadow rounded-lg p-6 text-center">
                    <h3 className="text-sm text-gray-500">Assigned</h3>
                    <p className="text-3xl font-semibold text-blue-600">{data?.summary.assigned ?? 0}</p>
                </div>
                <div className="bg-white shadow rounded-lg p-6 text-center">
                    <h3 className="text-sm text-gray-500">Completed</h3>
                    <p className="text-3xl font-semibold text-green-600">{data?.summary.completed ?? 0}</p>
                </div>
                <div className="bg-white shadow rounded-lg p-6 text-center">
                    <h3 className="text-sm text-gray-500">Total</h3>
                    <p className="text-3xl font-semibold text-gray-800">{data?.summary.total ?? 0}</p>
                </div>
                </div>

                {/* 🟢 Filters */}
                <div className="flex items-center justify-between gap-6 mt-6 w-full">
                <div className="flex gap-3">
                    {["all", "pending", "assigned", "completed"].map((status) => (
                    <Button
                        key={status}
                        variant={statusFilter === status ? "default" : "outline"}
                        onClick={() => setStatusFilter(status)}
                        className="px-5"
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                    ))}
                </div>

                <div className="flex-grow max-w-md w-55">
                    <Input
                    placeholder="Search by title or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                    />
                </div>
                </div>

                {/* 🟢 Requests Table */}
                <div className="bg-white shadow rounded-lg p-6 mt-4">
                <h3 className="text-lg font-semibold mb-3">Requests Today</h3>
                {filteredRequests.length === 0 ? (
                    <p className="text-gray-500 text-sm">No requests found for this filter.</p>
                ) : (
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead>Completed</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredRequests.map((r) => (
                            <TableRow key={r.id}>
                            <TableCell>{r.id}</TableCell>
                            <TableCell>{r.title}</TableCell>
                            <TableCell>{r.status}</TableCell>
                            <TableCell>{r.category}</TableCell>
                            <TableCell>{formatDate(r.created_at)}</TableCell>
                            <TableCell>{formatDate(r.updated_at)}</TableCell>
                            <TableCell>{formatDate(r.completed_at)}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </div>
                )}

                <div className="text-right mt-6">
                    <Button onClick={exportToExcel} className="bg-black text-white hover:bg-gray-800">
                    Download XLS
                    </Button>
                </div>
                </div>
            </div>
            </main>
      </div>
    </SidebarProvider>
  )
}
