"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { createApi } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserPlus, Loader2, ShieldCheck, User, Search, Users, Shield, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"

type Officer = {
  id: string
  name: string
  badgeNumber: string
  email: string
  role: string
  stationName: string
  createdAt: string
}

const PAGE_SIZE = 10
const defaultForm = { name: "", badgeNumber: "", email: "", password: "", role: "OFFICER", stationName: "" }

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

export default function OfficersPage() {
  const { data: session } = useSession()
  const [officers, setOfficers] = useState<Officer[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const isAdmin = session?.user?.role === "ADMIN"

  const fetchOfficers = () => {
    if (!session?.accessToken) return
    createApi(session.accessToken)
      .get("/officers")
      .then((res) => setOfficers(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOfficers() }, [session])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.accessToken) return
    setSubmitting(true)
    try {
      await createApi(session.accessToken).post("/officers", form)
      toast.success("เพิ่มเจ้าหน้าที่เรียบร้อยแล้ว")
      setOpen(false)
      setForm(defaultForm)
      fetchOfficers()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = officers.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      o.badgeNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.stationName.toLowerCase().includes(search.toLowerCase()),
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const adminCount = officers.filter((o) => o.role === "ADMIN").length
  const officerCount = officers.filter((o) => o.role === "OFFICER").length

  const currentUser = officers.find((o) => o.name === session?.user?.name)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายชื่อบุคลากรทั้งหมด</h1>
          <p className="text-sm text-gray-500 mt-0.5">สรุปข้อมูลเจ้าหน้าที่ในสังกัดกองงานพัฒนาปราบปราม</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setOpen(true)} className="bg-[#0F2C59] hover:bg-[#1a3d73]">
            <UserPlus className="h-4 w-4 mr-2" />เพิ่มเจ้าหน้าที่ใหม่
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">เจ้าหน้าที่ทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{officers.length} <span className="text-sm font-normal text-gray-400">คน</span></p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ผู้ดูแลระบบ</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{adminCount} <span className="text-sm font-normal text-gray-400">คน</span></p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">เจ้าหน้าที่</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{officerCount} <span className="text-sm font-normal text-gray-400">คน</span></p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <User className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ค้นหาชื่อ อีเมล รหัส หรือสถานี..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />กำลังโหลด...
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Users className="h-10 w-10 mb-3" />
              <p>ไม่พบรายชื่อเจ้าหน้าที่</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>รหัสพนักงาน</TableHead>
                  <TableHead>อีเมลติดต่อ</TableHead>
                  <TableHead>สถานี/สังกัด</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead className="w-32">วันที่เข้าร่วม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((o) => (
                  <TableRow key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full ${getAvatarColor(o.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {getInitials(o.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm leading-tight">{o.name}</p>
                          <p className="text-xs text-gray-400">{o.stationName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-blue-700">{o.badgeNumber}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{o.email}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{o.stationName}</TableCell>
                    <TableCell>
                      {o.role === "ADMIN" ? (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 border" variant="outline">
                          <ShieldCheck className="h-3 w-3 mr-1" />Admin
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 border" variant="outline">
                          <User className="h-3 w-3 mr-1" />เจ้าหน้าที่
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(o.createdAt).toLocaleDateString("th-TH")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                แสดง {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...")
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">...</span>
                    ) : (
                      <Button
                        key={p}
                        variant={page === p ? "default" : "ghost"}
                        size="icon"
                        className={`h-8 w-8 text-sm ${page === p ? "bg-[#0F2C59] hover:bg-[#1a3d73]" : ""}`}
                        onClick={() => setPage(p as number)}
                      >
                        {p}
                      </Button>
                    ),
                  )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom section */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#0F2C59]" />
              การตั้งค่าสิทธิ์และความปลอดภัย
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              ระบบอนุญาตให้ Admin เท่านั้นสามารถเข้าถึงข้อมูลผ่านผลผ่านระดับชั้นความลับของแต่ละ โดยเจ้าหน้าที่และตำแหน่งจะได้รับมอบหมายเฉพาะที่ได้รับมอบหมายมาเท่านั้น เพื่อป้องกันข้อมูลรั่วไหล
            </p>
            <div className="flex items-center gap-6 pt-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ยืนยันตัวตน 2 ชั้น (2FA)
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                บันทึกการเข้าใช้งาน (Log)
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ตรวจสอบประวัติสมาชิก
              </div>
            </div>
          </CardContent>
        </Card>

        {currentUser && (
          <Card className="bg-[#0F2C59] text-white">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className={`h-16 w-16 rounded-full ${getAvatarColor(currentUser.name)} flex items-center justify-center text-white text-xl font-bold border-4 border-white/20`}>
                {getInitials(currentUser.name)}
              </div>
              <div>
                <p className="font-semibold text-base leading-tight">{currentUser.name}</p>
                <p className="text-blue-300 text-xs mt-1">{currentUser.stationName}</p>
              </div>
              <div className="w-full grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-2xl font-bold">{currentUser.role === "ADMIN" ? adminCount + officerCount : officerCount}</p>
                  <p className="text-blue-300 text-xs mt-0.5">บุคลากร</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-2xl font-bold">{currentUser.role === "ADMIN" ? "Admin" : "Officer"}</p>
                  <p className="text-blue-300 text-xs mt-0.5">บทบาท</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add officer dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มเจ้าหน้าที่ใหม่</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>ชื่อ-สกุล <span className="text-red-500">*</span></Label>
                <Input placeholder="ชื่อเต็มพร้อมยศ" value={form.name} onChange={set("name")} required />
              </div>
              <div className="space-y-1.5">
                <Label>เลขประจำตัว <span className="text-red-500">*</span></Label>
                <Input placeholder="OFF001" value={form.badgeNumber} onChange={set("badgeNumber")} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล <span className="text-red-500">*</span></Label>
              <Input type="email" placeholder="officer@justiceflow.local" value={form.email} onChange={set("email")} required />
            </div>
            <div className="space-y-1.5">
              <Label>รหัสผ่าน <span className="text-red-500">*</span></Label>
              <Input type="password" placeholder="อย่างน้อย 8 ตัวอักษร" value={form.password} onChange={set("password")} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>สถานี <span className="text-red-500">*</span></Label>
                <Input placeholder="ชื่อสถานีตำรวจ" value={form.stationName} onChange={set("stationName")} required />
              </div>
              <div className="space-y-1.5">
                <Label>ตำแหน่ง</Label>
                <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v ?? "OFFICER" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFICER">เจ้าหน้าที่</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button type="submit" disabled={submitting} className="bg-[#0F2C59] hover:bg-[#1a3d73]">
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />กำลังบันทึก...</> : "บันทึก"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
