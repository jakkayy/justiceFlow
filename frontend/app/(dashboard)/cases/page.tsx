"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createApi, CaseStatusOptions } from "@/lib/api"
import { StatusBadge } from "@/components/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, FolderOpen, Loader2, Filter, X, ChevronLeft, ChevronRight, TrendingUp, Scale, CheckCircle2 } from "lucide-react"

type Case = {
  id: string
  caseNumber: string
  title: string
  status: string
  victimName: string
  officer: { name: string; stationName: string }
  createdAt: string
}

const PAGE_SIZE = 10

const TABS = [
  { label: "ทั้งหมด", value: "ALL" },
  { label: "คดีใหม่", value: "RECEIVED" },
  { label: "อยู่ระหว่างดำเนินการ", value: "ACTIVE" },
]

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-indigo-500", "bg-pink-500", "bg-teal-500",
]

function getInitials(name: string) {
  const parts = name.split(" ").filter((p) => !p.includes(".") && p.length > 0)
  if (parts.length === 0) return name.charAt(0).toUpperCase()
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function CasesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [dateFilter, setDateFilter] = useState("")
  const [tab, setTab] = useState("ALL")
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!session?.accessToken) return
    createApi(session.accessToken)
      .get("/cases")
      .then((res) => setCases(res.data))
      .finally(() => setLoading(false))
  }, [session])

  const receivedCount = cases.filter((c) => c.status === "RECEIVED").length
  const investigatingCount = cases.filter((c) => c.status === "INVESTIGATING").length
  const closedCount = cases.filter((c) => c.status === "CLOSED").length

  const filtered = cases.filter((c) => {
    const matchSearch =
      !search ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.victimName.toLowerCase().includes(search.toLowerCase()) ||
      c.officer?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter
    const matchTab =
      tab === "ALL" ||
      (tab === "RECEIVED" && c.status === "RECEIVED") ||
      (tab === "ACTIVE" && (c.status === "INVESTIGATING" || c.status === "PROSECUTING"))
    const matchDate = !dateFilter || c.createdAt.startsWith(dateFilter)
    return matchSearch && matchStatus && matchTab && matchDate
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const hasFilters = search || statusFilter !== "ALL" || dateFilter

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("ALL")
    setDateFilter("")
    setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-gray-900">รายการคดี <span className="text-gray-400 font-normal text-lg">(Case List)</span></h1>
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => { setTab(t.value); setPage(1) }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  tab === t.value
                    ? "border-[#0F2C59] text-[#0F2C59]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ค้นหาเลขคดี, ชื่อเหยื่อ หรือผู้รับผิดชอบ..."
              className="pl-9 w-72 text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <Link href="/cases/new" className={buttonVariants() + " bg-[#0F2C59] hover:bg-[#1a3d73] gap-2"}>
            <Plus className="h-4 w-4" />เพิ่มคดีใหม่
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 font-medium">คดีที่รอดำเนินการ</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-bold text-gray-900">{receivedCount}</p>
              <span className="text-xs text-emerald-600 font-medium mb-1 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />คดีใหม่
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 font-medium">กำลังสืบสวน</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-bold text-blue-600">{investigatingCount}</p>
              <span className="text-xs text-gray-400 mb-1">จาก {cases.length} ทั้งหมด</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 font-medium">ส่งฟ้องอัยการ</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-bold text-orange-500">
                {cases.filter((c) => c.status === "PROSECUTING").length}
              </p>
              <span className="flex items-center gap-0.5 text-xs text-gray-400 mb-1">
                <Scale className="h-3 w-3" />คดี
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 font-medium">ปิดสำเร็จแล้ว</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-bold text-emerald-600">{closedCount}</p>
              <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-medium mb-1">
                <CheckCircle2 className="h-3 w-3" />
                {cases.length > 0 ? Math.round((closedCount / cases.length) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
          <Filter className="h-4 w-4" />
          <span className="font-medium">ตัวกรอง:</span>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "ALL"); setPage(1) }}>
          <SelectTrigger className="w-48 h-8 text-sm border-gray-200">
            <SelectValue placeholder="สถานะคดีทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">สถานะคดีทั้งหมด</SelectItem>
            {CaseStatusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-gray-200 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />กำลังโหลด...
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FolderOpen className="h-10 w-10 mb-3" />
              <p>ไม่พบรายการคดี</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-40 font-semibold text-gray-600 text-xs uppercase tracking-wide">เลขคดี (CASE ID)</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wide">หัวข้อเรื่อง</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wide">ผู้เสียหาย/เหยื่อ</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wide">สถานะ</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wide">ผู้รับผิดชอบ</TableHead>
                  <TableHead className="w-28 font-semibold text-gray-600 text-xs uppercase tracking-wide">วันที่ลงทะเบียน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                    onClick={() => router.push(`/cases/${c.id}`)}
                  >
                    <TableCell>
                      <span className="font-mono text-sm font-bold text-[#0F2C59]">#{c.caseNumber}</span>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-900 text-sm leading-tight">{c.title}</p>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">{c.victimName}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell>
                      {c.officer?.name ? (
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-full ${getAvatarColor(c.officer.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {getInitials(c.officer.name)}
                          </div>
                          <span className="text-sm text-gray-700">{c.officer.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(c.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                แสดง {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} จากทั้งหมด {filtered.length} คดี
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...")
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                          page === p
                            ? "bg-[#0F2C59] text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
