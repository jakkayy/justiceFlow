"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createApi } from "@/lib/api"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function NewCasePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    caseNumber: "",
    title: "",
    description: "",
    victimName: "",
    victimPhone: "",
    victimLineId: "",
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.accessToken) return
    setLoading(true)
    try {
      const res = await createApi(session.accessToken).post("/cases", form)
      toast.success("สร้างคดีเรียบร้อยแล้ว")
      router.push(`/cases/${res.data.id}`)
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cases" className={buttonVariants({ variant: "ghost", size: "sm" }) + " text-gray-500"}>
          <ArrowLeft className="h-4 w-4 mr-1" />กลับ
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เพิ่มคดีใหม่</h1>
          <p className="text-sm text-gray-500">กรอกข้อมูลคดีให้ครบถ้วน</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">ข้อมูลคดี</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>เลขคดี <span className="text-red-500">*</span></Label>
                <Input placeholder="เช่น 001/2567" value={form.caseNumber} onChange={set("caseNumber")} required />
              </div>
              <div className="space-y-1.5">
                <Label>ชื่อเรื่อง <span className="text-red-500">*</span></Label>
                <Input placeholder="ระบุชื่อเรื่องคดี" value={form.title} onChange={set("title")} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>รายละเอียด <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="อธิบายรายละเอียดของคดี..."
                rows={4}
                value={form.description}
                onChange={set("description")}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">ข้อมูลผู้เสียหาย</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>ชื่อ-นามสกุล <span className="text-red-500">*</span></Label>
                <Input placeholder="ชื่อผู้เสียหาย" value={form.victimName} onChange={set("victimName")} required />
              </div>
              <div className="space-y-1.5">
                <Label>เบอร์โทรศัพท์ <span className="text-red-500">*</span></Label>
                <Input placeholder="08x-xxx-xxxx" value={form.victimPhone} onChange={set("victimPhone")} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>LINE User ID <span className="text-gray-400 font-normal">(ถ้ามี)</span></Label>
              <Input placeholder="U1234567890abcdef..." value={form.victimLineId} onChange={set("victimLineId")} />
              <p className="text-xs text-gray-400">ใช้สำหรับแจ้งสถานะผ่าน LINE OA</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/cases" className={buttonVariants({ variant: "outline" })}>ยกเลิก</Link>
          <Button type="submit" disabled={loading} className="bg-[#0F2C59] hover:bg-[#1a3d73]">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />กำลังบันทึก...</> : "บันทึกคดี"}
          </Button>
        </div>
      </form>
    </div>
  )
}
