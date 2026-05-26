"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { createApi } from "@/lib/api"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, FileText, Loader2, QrCode, Save, User } from "lucide-react"

const LINE_OA_URL = `https://line.me/R/ti/p/${process.env.NEXT_PUBLIC_LINE_OA_ID ?? ""}`

export default function NewCasePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [createdCase, setCreatedCase] = useState<{ id: string; caseNumber: string; victimName: string } | null>(null)
  const [form, setForm] = useState({
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
      setCreatedCase({ id: res.data.id, caseNumber: res.data.caseNumber, victimName: form.victimName })
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        {/* Page title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          เพิ่มคดีใหม่ <span className="text-gray-400 font-normal">(Add New Case)</span>
        </h1>

        {/* Section: Case info */}
        <div className="rounded-xl overflow-hidden border border-gray-200 mb-5">
          <div className="flex items-center gap-2.5 bg-gray-100 px-5 py-3.5 border-b border-gray-200">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">ข้อมูลคดี (Case Information)</span>
          </div>
          <div className="bg-white px-5 py-5 space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                หัวข้อคดี <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="ระบุหัวข้อคดีที่สั้นและชัดเจน"
                className="h-11 text-sm"
                value={form.title}
                onChange={set("title")}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                รายละเอียดคดี <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="อธิบายเหตุการณ์ สถานที่ และรายละเอียดที่เกี่ยวข้อง..."
                rows={6}
                className="text-sm resize-none"
                value={form.description}
                onChange={set("description")}
                required
              />
            </div>
          </div>
        </div>

        {/* Section: Victim info */}
        <div className="rounded-xl overflow-hidden border border-gray-200 mb-8">
          <div className="flex items-center gap-2.5 bg-gray-100 px-5 py-3.5 border-b border-gray-200">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">ข้อมูลผู้เสียหาย (Victim Information)</span>
          </div>
          <div className="bg-white px-5 py-5 space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="ชื่อจริง และ นามสกุล"
                className="h-11 text-sm"
                value={form.victimName}
                onChange={set("victimName")}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="0XX-XXX-XXXX"
                  className="h-11 text-sm"
                  value={form.victimPhone}
                  onChange={set("victimPhone")}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">LINE ID</label>
                <Input
                  placeholder="@username"
                  className="h-11 text-sm"
                  value={form.victimLineId}
                  onChange={set("victimLineId")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-200 pt-5 flex items-center justify-end gap-3">
          <Link href="/cases" className={buttonVariants({ variant: "outline" }) + " h-11 px-6"}>
            ยกเลิก
          </Link>
          <Button type="submit" disabled={loading} className="bg-[#0F2C59] hover:bg-[#1a3d73] h-11 px-6 gap-2">
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" />กำลังบันทึก...</>
              : <><Save className="h-4 w-4" />บันทึกข้อมูลคดี</>}
          </Button>
        </div>
      </form>

      {/* Success dialog with QR code */}
      <Dialog open={!!createdCase} onOpenChange={() => router.push(`/cases/${createdCase?.id}`)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              บันทึกคดีเรียบร้อยแล้ว
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm space-y-0.5">
              <p className="text-gray-500 text-xs">หมายเลขคดี</p>
              <p className="font-mono font-semibold text-[#0F2C59] text-base">{createdCase?.caseNumber}</p>
              <p className="text-gray-600 text-xs mt-1">ผู้เสียหาย: {createdCase?.victimName}</p>
            </div>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <QrCode className="h-4 w-4" />
                แสดง QR Code ให้ผู้เสียหายสแกน
              </div>
              <div className="rounded-2xl border-4 border-white shadow-md p-3 bg-white">
                <QRCodeSVG value={LINE_OA_URL} size={180} bgColor="#ffffff" fgColor="#0F2C59" level="M" />
              </div>
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                สแกนเพื่อเพิ่ม LINE OA แล้วส่ง<br />
                <span className="font-mono font-medium text-gray-600">{createdCase?.caseNumber} + เบอร์โทรศัพท์</span><br />
                เพื่อตรวจสอบสถานะคดี
              </p>
            </div>
            <Button
              className="w-full bg-[#0F2C59] hover:bg-[#1a3d73]"
              onClick={() => router.push(`/cases/${createdCase?.id}`)}
            >
              ไปยังหน้าคดี
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
