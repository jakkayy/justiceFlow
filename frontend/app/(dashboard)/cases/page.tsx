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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PlusCircle, Search, FolderOpen, Loader2 } from "lucide-react"

type Case = {
  id: string
  caseNumber: string
  title: string
  status: string
  victimName: string
  officer: { name: string; stationName: string }
  createdAt: string
}

export default function CasesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  useEffect(() => {
    if (!session?.accessToken) return
    createApi(session.accessToken)
      .get("/cases")
      .then((res) => setCases(res.data))
      .finally(() => setLoading(false))
  }, [session])

  const filtered = cases.filter((c) => {
    const matchSearch =
      c.caseNumber.includes(search) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.victimName.includes(search)
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายการคดี</h1>
          <p className="text-sm text-gray-500 mt-0.5">ทั้งหมด {cases.length} คดี</p>
        </div>
        <Link href="/cases/new" className={buttonVariants({ variant: "default" }) + " bg-[#0F2C59] hover:bg-[#1a3d73]"}>
          <PlusCircle className="h-4 w-4 mr-2" />
          เพิ่มคดีใหม่
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาด้วยเลขคดี ชื่อเรื่อง หรือชื่อผู้เสียหาย..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="กรองตามสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกสถานะ</SelectItem>
                {CaseStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> กำลังโหลด...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FolderOpen className="h-10 w-10 mb-3" />
              <p>ไม่พบรายการคดี</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-36">เลขคดี</TableHead>
                  <TableHead>ชื่อเรื่อง</TableHead>
                  <TableHead>ผู้เสียหาย</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>เจ้าหน้าที่</TableHead>
                  <TableHead className="w-32">วันที่รับเรื่อง</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                    onClick={() => router.push(`/cases/${c.id}`)}
                  >
                    <TableCell className="font-mono text-sm font-medium text-blue-700">{c.caseNumber}</TableCell>
                    <TableCell className="font-medium text-gray-900">{c.title}</TableCell>
                    <TableCell className="text-gray-600">{c.victimName}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-gray-600 text-sm">{c.officer?.name}</TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(c.createdAt).toLocaleDateString("th-TH")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
