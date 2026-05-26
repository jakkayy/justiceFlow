"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createApi, CaseStatusOptions } from "@/lib/api"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Paperclip, Trash2, Upload, Loader2, Clock } from "lucide-react"

type Attachment = { id: string; fileName: string; fileType: string; fileSize: number; uploadedAt: string }
type HistoryEntry = { status: string; note: string; changedAt: string }
type Case = {
  id: string; caseNumber: string; title: string; description: string; status: string
  victimName: string; victimPhone: string; victimLineId?: string
  officer: { name: string; stationName: string }
  statusHistory: HistoryEntry[]
  attachments: Attachment[]
  createdAt: string; updatedAt: string
}

export default function CaseDetailPage() {
  const { data: session } = useSession()
  const { id } = useParams<{ id: string }>()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState("")
  const [note, setNote] = useState("")
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const api = session?.accessToken ? createApi(session.accessToken) : null

  const fetchCase = async () => {
    if (!api) return
    const res = await api.get(`/cases/${id}`)
    setCaseData(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchCase() }, [session, id])

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!api || !newStatus) return
    setUpdating(true)
    try {
      await api.patch(`/cases/${id}/status`, { status: newStatus, note })
      toast.success("อัปเดตสถานะเรียบร้อยแล้ว")
      setNote("")
      setNewStatus("")
      fetchCase()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setUpdating(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!api || !e.target.files?.[0]) return
    const file = e.target.files[0]
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      await api.post(`/cases/${id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      toast.success(`อัปโหลด ${file.name} สำเร็จ`)
      fetchCase()
    } catch {
      toast.error("อัปโหลดไฟล์ไม่สำเร็จ")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!api) return
    try {
      await api.delete(`/cases/${id}/attachments/${attachmentId}`)
      toast.success("ลบไฟล์เรียบร้อยแล้ว")
      fetchCase()
    } catch {
      toast.error("ลบไฟล์ไม่สำเร็จ")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> กำลังโหลด...
      </div>
    )
  }

  if (!caseData) return null

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cases" className={buttonVariants({ variant: "ghost", size: "sm" }) + " text-gray-500"}>
            <ArrowLeft className="h-4 w-4 mr-1" />กลับ
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{caseData.title}</h1>
              <StatusBadge status={caseData.status} />
            </div>
            <p className="text-sm text-gray-500 font-mono mt-0.5">คดีหมายเลข {caseData.caseNumber}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-5">
          {/* Case info */}
          <Card>
            <CardHeader><CardTitle className="text-base">ข้อมูลคดี</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">รายละเอียด</p>
                <p className="text-gray-800 leading-relaxed">{caseData.description}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">ผู้เสียหาย</p>
                  <p className="text-gray-800 font-medium">{caseData.victimName}</p>
                  <p className="text-gray-500 text-sm">{caseData.victimPhone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">เจ้าหน้าที่รับผิดชอบ</p>
                  <p className="text-gray-800 font-medium">{caseData.officer?.name}</p>
                  <p className="text-gray-500 text-sm">{caseData.officer?.stationName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">วันที่รับเรื่อง</p>
                <p className="text-gray-800">{new Date(caseData.createdAt).toLocaleDateString("th-TH", { dateStyle: "long" })}</p>
              </div>
            </CardContent>
          </Card>

          {/* Update status */}
          <Card>
            <CardHeader><CardTitle className="text-base">อัปเดตสถานะคดี</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>สถานะใหม่</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      {CaseStatusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>หมายเหตุ</Label>
                  <Textarea
                    placeholder="ระบุรายละเอียดการเปลี่ยนแปลงสถานะ..."
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={updating || !newStatus} className="bg-[#0F2C59] hover:bg-[#1a3d73]">
                  {updating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />กำลังบันทึก...</> : "บันทึกสถานะ"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">ไฟล์แนบ ({caseData.attachments.length})</CardTitle>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading
                    ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />กำลังอัปโหลด...</>
                    : <><Upload className="h-4 w-4 mr-1" />อัปโหลดไฟล์</>
                  }
                </Button>
                <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
              </div>
            </CardHeader>
            <CardContent>
              {caseData.attachments.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <Paperclip className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">คลิกเพื่ออัปโหลดไฟล์</p>
                  <p className="text-xs text-gray-300">รองรับไฟล์ทุกประเภท ขนาดไม่เกิน 20 MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {caseData.attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{att.fileName}</p>
                          <p className="text-xs text-gray-400">{formatSize(att.fileSize)} · {new Date(att.uploadedAt).toLocaleDateString("th-TH")}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                        onClick={() => handleDeleteAttachment(att.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - status history */}
        <div className="col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />ประวัติสถานะ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.statusHistory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีการอัปเดตสถานะ</p>
              ) : (
                <div className="space-y-4">
                  {[...caseData.statusHistory].reverse().map((h, i) => (
                    <div key={i} className="relative pl-4 border-l-2 border-blue-200">
                      <StatusBadge status={h.status} />
                      {h.note && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{h.note}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(h.changedAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
