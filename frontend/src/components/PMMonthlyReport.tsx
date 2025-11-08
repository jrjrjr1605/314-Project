"use client"

import { useEffect, useState, useMemo } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/pm-app-sidebar"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import * as XLSX from "xlsx"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

type MonthlyReportData = {
  month: string
  summary: {
    created: number
    completed: number
    completion_rate: number
    avg_completion_time: number
    active_categories: number
    growth_vs_last_month?: number // ✅ optional and consistent
  }
  by_category: Record<string, number>
  by_week?: { week: number; created: number; completed: number }[]
  top_shortlisted?: { id: number; title: string; shortlist_count: number }[]
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

export default function PMMonthlyReport() {
  const [data, setData] = useState<MonthlyReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/pm-monthly-report`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.warn("⚠️ Using mock data for demo.")
        setData({
          month: "2025-10",
          summary: {
            created: 120,
            completed: 105,
            completion_rate: 87.5,
            avg_completion_time: 1.8,
            active_categories: 6,
            growth_vs_last_month: 12.3,
          },
          by_week: [
            { week: 43, created: 25, completed: 20 },
            { week: 44, created: 30, completed: 27 },
          ],
          by_category: {
            "Case & Social Support": 40,
            "Financial Aid": 30,
            "Medical": 25,
            "Food Assistance": 15,
            "Education": 10,
          },
          top_shortlisted: [
            { id: 1, title: "Medical Aid Request", shortlist_count: 8 },
            { id: 2, title: "Education Support", shortlist_count: 6 },
            { id: 3, title: "Food Voucher Program", shortlist_count: 5 },
            { id: 4, title: "Financial Counseling", shortlist_count: 4 },
            { id: 5, title: "Case Management", shortlist_count: 3 },
          ],
          requests: [],
        })
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [])

  const formatDate = (dt?: string | null) =>
    dt ? new Date(dt).toLocaleDateString("en-SG") : "-"

  const COLORS = ["#4F46E5", "#16A34A", "#F59E0B", "#EF4444", "#06B6D4", "#8B5CF6"]

  const filteredRequests = useMemo(() => {
    if (!data) return []
    let result = [...data.requests]

    if (statusFilter !== "all")
      result = result.filter((r) => r.status === statusFilter)

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      )
    }

    return result.sort((a, b) => a.id - b.id)
  }, [data, statusFilter, searchTerm])

  const exportToExcel = () => {
    if (!data) return
    const wb = XLSX.utils.book_new()
    const summarySheet = XLSX.utils.json_to_sheet([data.summary])
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary")
    const requestsSheet = XLSX.utils.json_to_sheet(data.requests)
    XLSX.utils.book_append_sheet(wb, requestsSheet, "Requests")
    XLSX.writeFile(wb, "pm_monthly_report.xlsx")
  }

  if (loading) return <p className="p-8 text-gray-500">Loading monthly report...</p>
  if (error) return <p className="p-8 text-red-500">{error}</p>

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 p-8 bg-gray-50 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Monthly Report</h1>
            <p className="text-gray-600">
              Platform health and growth summary for{" "}
              {data
                ? new Date(data.month + "-01").toLocaleString("en-SG", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>

          {/* 🟢 Summary Cards */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <SummaryCard title="Created" value={data.summary.created} color="text-indigo-600" />
              <SummaryCard title="Completed" value={data.summary.completed} color="text-green-600" />
              <SummaryCard title="Completion Rate" value={`${data.summary.completion_rate}%`} color="text-blue-600" />
              <SummaryCard title="Avg Completion Time" value={`${data.summary.avg_completion_time} days`} color="text-orange-500" />
              <SummaryCard title="Active Categories" value={data.summary.active_categories} color="text-purple-500" />
              {"growth_vs_last_month" in data.summary && (
                <SummaryCard
                  title="Growth vs Last Month"
                  value={`${data.summary.growth_vs_last_month}%`}
                  color={
                    (data.summary.growth_vs_last_month ?? 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                />
              )}
            </div>
          )}

          {/* 🟣 Charts Section */}
          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Pie Chart */}
              <ChartCard title="Category Distribution">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={Object.entries(data.by_category).map(([name, value]) => ({
                        name,
                        value,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label={({ value }) => value}
                    >
                      {Object.keys(data.by_category).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Bar Chart */}
              <ChartCard title="Requests by Week">
                <ResponsiveContainer>
                  <BarChart data={data.by_week || []}>
                    <XAxis dataKey="week" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="created" fill="#6366F1" name="Created" />
                    <Bar dataKey="completed" fill="#22C55E" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Top Shortlisted */}
              <ChartCard title="Top 5 Most Shortlisted Requests">
                {data.top_shortlisted?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Shortlists</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.top_shortlisted.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.id}</TableCell>
                          <TableCell>{r.title}</TableCell>
                          <TableCell>{r.shortlist_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500">No shortlisted requests this month.</p>
                )}
              </ChartCard>
            </div>
          )}

          {/* 🟢 Requests Table */}
          <FilterAndTable
            data={filteredRequests}
            statusFilter={statusFilter}
            searchTerm={searchTerm}
            setStatusFilter={setStatusFilter}
            setSearchTerm={setSearchTerm}
            formatDate={formatDate}
            exportToExcel={exportToExcel}
          />
        </main>
      </div>
    </SidebarProvider>
  )
}

/* ----- Helper Components ----- */
function SummaryCard({ title, value, color }: { title: string; value: any; color: string }) {
  return (
    <Card className="p-4 text-center">
      <p className="text-gray-600 text-sm">{title}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </Card>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">{children}</CardContent>
    </Card>
  )
}

function FilterAndTable({
  data,
  statusFilter,
  searchTerm,
  setStatusFilter,
  setSearchTerm,
  formatDate,
  exportToExcel,
}: any) {
  return (
    <>
      <div className="flex items-center justify-between gap-6 mt-6">
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

        <div className="flex-grow max-w-md">
          <Input
            placeholder="Search by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Requests This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
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
                  {data.map((r: any) => (
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
        </CardContent>
      </Card>
    </>
  )
}
