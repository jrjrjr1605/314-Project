"use client"

import { useEffect, useState, useMemo } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/pm-app-sidebar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts" // 🟢 Added missing imports
import * as XLSX from "xlsx"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

type ReportData = {
  range: { start: string; end: string }
  summary: { total: number; created: number; assigned: number; completed: number }
  categories: Record<string, number>
  created_by_category: Record<string, number>
  assigned_by_category: Record<string, number>
  completed_by_category: Record<string, number>
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

export default function PMWeeklyReport() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/pm-weekly-report`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err?.message || "Failed to load report")
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [])

  const COLORS = ["#4F46E5", "#16A34A", "#F59E0B", "#EF4444", "#06B6D4", "#8B5CF6"]

  const formatDate = (dt?: string | null) => {
    if (!dt) return "-"
    return new Date(dt).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })
  }

  const filteredRequests = useMemo(() => {
    if (!data) return []
    let result = [...data.requests]

    result = result.filter(
      (r) => r.status === "pending" || r.status === "assigned" || r.status === "completed"
    )

    if (statusFilter !== "all") result = result.filter((r) => r.status === statusFilter)

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => a.id - b.id)
    return result
  }, [data, statusFilter, searchTerm])

    const exportToExcel = () => {
    if (!data) return;

    // 🟩 Create a new workbook
    const wb = XLSX.utils.book_new();

    // 🟩 1️⃣ Summary sheet
    const summarySheet = XLSX.utils.json_to_sheet([
        {
        "Total Created": data.summary.created,
        "Total Assigned": data.summary.assigned,
        "Total Completed": data.summary.completed,
        },
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // 🟩 2️⃣ Category breakdown sheet (from pie/bar chart)
    const categories = Object.keys({
        ...data.created_by_category,
        ...data.assigned_by_category,
        ...data.completed_by_category,
    });

    const categoryRows = categories.map((cat) => ({
        Category: cat,
        Created: data.created_by_category[cat] || 0,
        Assigned: data.assigned_by_category[cat] || 0,
        Completed: data.completed_by_category[cat] || 0,
    }));

    const categorySheet = XLSX.utils.json_to_sheet(categoryRows);
    XLSX.utils.book_append_sheet(wb, categorySheet, "By Category");

    // 🟩 3️⃣ Detailed requests sheet (existing)
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
    );
    XLSX.utils.book_append_sheet(wb, requestsSheet, "Requests");

    // 🟩 4️⃣ Write the Excel file
    XLSX.writeFile(wb, "pm_weekly_report_full.xlsx");
    };


  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6 bg-gray-50">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance Report</CardTitle>
              <CardDescription>
                Report period:{" "}
                {data
                  ? `${new Date(data.range.start).toLocaleDateString()} → ${new Date(
                      data.range.end
                    ).toLocaleDateString()}`
                  : "Loading..."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {loading && <p className="text-gray-500">Loading report data...</p>}
              {error && <p className="text-red-600">Error: {error}</p>}
              {!loading && !error && data && (
                <>
                  {/* 🟢 Summary counts */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10 text-center">
                    <Card className="p-4">
                      <h3 className="text-gray-600 text-sm">Total Created</h3>
                      <p className="text-xl font-semibold text-indigo-600">{data.summary.created}</p>
                    </Card>
                    <Card className="p-4">
                      <h3 className="text-gray-600 text-sm">Total Assigned</h3>
                      <p className="text-xl font-semibold text-blue-600">{data.summary.assigned}</p>
                    </Card>
                    <Card className="p-4">
                      <h3 className="text-gray-600 text-sm">Total Completed</h3>
                      <p className="text-xl font-semibold text-green-600">{data.summary.completed}</p>
                    </Card>
                  </div>

                  {/* 🟢 Charts Section */}
                  <div className="mt-4 mb-12 grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* 🟣 1️⃣ Overall Requests by Categories (Pie) */}
                    <div className="h-110 bg-white rounded-md p-4 shadow-sm">
                      <h4 className="font-semibold text-center mb-3">Overall Requests by Categories</h4>
                      <ResponsiveContainer>
                        <PieChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                          <Pie
                            data={Object.entries(data.categories).map(([name, value]) => ({
                              name,
                              value,
                            }))}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={90}
                            labelLine={false}
                            label={({ name, value }) => `${value}`}
                          >
                            {Object.keys(data.categories).map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 🟢 2️⃣ Created vs Assigned vs Completed (Bar Graph) */}
                    <div className="h-110 bg-white rounded-md p-4 shadow-sm col-span-2">
                      <h4 className="font-semibold text-center mb-3">
                        Created / Assigned / Completed Requests by Category
                      </h4>
                      <ResponsiveContainer>
                        <BarChart
                          data={(() => {
                            const categories = Object.keys({
                              ...data.created_by_category,
                              ...data.assigned_by_category,
                              ...data.completed_by_category,
                            })
                            return categories.map((cat) => ({
                              category: cat,
                              Created: data.created_by_category[cat] || 0,
                              Assigned: data.assigned_by_category[cat] || 0,
                              Completed: data.completed_by_category[cat] || 0,
                            }))
                          })()}
                          margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
                        >
                          <Tooltip />
                          <Legend verticalAlign="bottom" />
                          <XAxis
                          dataKey="category"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-35}
                          textAnchor="end"
                          height={95}
                          dy={10}
                          />
                          <YAxis allowDecimals={false} />
                          <Bar dataKey="Created" fill="#6366F1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Assigned" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Completed" fill="#22C55E" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 🟢 Filters */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-10 items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                      {["all", "pending", "assigned", "completed"].map((status) => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? "default" : "outline"}
                          onClick={() => setStatusFilter(status)}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      ))}
                    </div>

                    <Input
                      placeholder="Search title or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>

                  {/* 🟢 Requests Table */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Requests This Week</h3>
                    {filteredRequests.length === 0 ? (
                      <p className="text-gray-500 text-sm">No requests found for this filter.</p>
                    ) : (
                      <div className="overflow-x-auto bg-white rounded-md border">
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
                  </div>

                  {/* 🟢 Download Button */}
                  <div className="mt-6 text-right">
                    <Button onClick={exportToExcel}>Download XLS</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  )
}
