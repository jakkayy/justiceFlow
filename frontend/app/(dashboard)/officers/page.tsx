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
import { UserPlus, Users, Loader2, ShieldCheck, User } from "lucide-react"

type Officer = {
  id: string
  name: string
  badgeNumber: string
  email: string
  role: string
  stationName: string
  createdAt: string
}

const defaultForm = { name: "", badgeNumber: "", email: "", password: "", role: "OFFICER", stationName: "" }

export default function OfficersPage() {
  const { data: session } = useSession()
  const [officers, setOfficers] = useState<Officer[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(defaultForm)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการเจ้าหน้าที่</h1>
          <p className="text-sm text-gray-500 mt-0.5">ทั้งหมด {officers.length} คน</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setOpen(true)} className="bg-[#0F2C59] hover:bg-[#1a3d73]">
            <UserPlus className="h-4 w-4 mr-2" />เพิ่มเจ้าหน้าที่
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />กำลังโหลด...
            </div>
          ) : officers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Users className="h-10 w-10 mb-3" />
              <p>ยังไม่มีเจ้าหน้าที่</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>ชื่อ-สกุล</TableHead>
                  <TableHead>เลขประจำตัว</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>สถานี</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead className="w-32">วันที่เพิ่ม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {officers.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium text-gray-900">{o.name}</TableCell>
                    <TableCell className="font-mono text-sm text-blue-700">{o.badgeNumber}</TableCell>
                    <TableCell className="text-gray-600">{o.email}</TableCell>
                    <TableCell className="text-gray-600">{o.stationName}</TableCell>
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
        </CardContent>
      </Card>

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
