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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft, Paperclip, Trash2, Loader2, Download, User,
  FileText, ImageIcon, Plus, ShieldCheck, Calendar,
} from "lucide-react"

type Attachment = { id: string; fileName: string; fileType: string; fileSize: number; uploadedAt: string }
type HistoryEntry = { status: string; note: string; changedAt: string; changedByName?: string }
type Case = {
  id: string; caseNumber: string; title: string; description: string; status: string
  victimName: string; victimPhone: string; victimLineId?: string
  officer: { name: string; stationName: string }
  statusHistory: HistoryEntry[]
  attachments: Attachment[]
  createdAt: string; updatedAt: string
}

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: "รับเรื่องแล้ว",
  INVESTIGATING: "อยู่ระหว่างสืบสวน",
  PROSECUTING: "ส่งฟ้องอัยการ",
  CLOSED: "ปิดคดีแล้ว",
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString("th-TH", { dateStyle: "medium" }),
    time: d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
  }
}

function FileCard({ att, onDownload, onDelete }: {
  att: Attachment
  onDownload: () => void
  onDelete: () => void
}) {
  const isImage = att.fileType.startsWith("image/")
  const isPdf = att.fileType === "application/pdf"

  const bg = isImage
    ? "bg-gradient-to-br from-blue-400 to-indigo-500"
    : isPdf
    ? "bg-gradient-to-br from-red-400 to-rose-500"
    : "bg-gradient-to-br from-slate-400 to-gray-500"

  const { date } = formatDateTime(att.uploadedAt)

  return (
    <div className="group relative rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`${bg} h-28 flex items-center justify-center`}>
        {isImage ? (
          <ImageIcon className="h-10 w-10 text-white/80" />
        ) : (
          <FileText className="h-10 w-10 text-white/80" />
        )}
      </div>
      <div className="p-2.5 bg-white">
        <p className="text-xs font-medium text-gray-800 truncate">{att.fileName}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatSize(att.fileSize)} · {date}</p>
      </div>
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full"
          onClick={onDownload}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8 rounded-full"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
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

  const handleDownload = async (attachmentId: string) => {
    if (!api) return
    try {
      const res = await api.get(`/cases/${id}/attachments/${attachmentId}/download`)
      window.open(res.data.url, "_blank")
    } catch {
      toast.error("ดาวน์โหลดไม่สำเร็จ")
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
        <Loader2 className="h-6 w-6 animate-spin mr-2" />กำลังโหลด...
      </div>
    )
  }

  if (!caseData) return null

  const history = [...caseData.statusHistory].reverse()
  const { date: createdDate, time: createdTime } = formatDateTime(caseData.createdAt)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Back link */}
      <Link href="/cases" className={buttonVariants({ variant: "ghost", size: "sm" }) + " text-gray-500 -ml-2"}>
        <ArrowLeft className="h-4 w-4 mr-1" />กลับรายการคดี
      </Link>

      <div className="grid grid-cols-3 gap-5">
        {/* ===== Left (2/3) ===== */}
        <div className="col-span-2 space-y-5">

          {/* Case info card */}
          <Card className="overflow-hidden">
            <CardContent className="p-6 space-y-5">
              {/* Status + badge row */}
              <div className="flex items-start justify-between">
                <StatusBadge status={caseData.status} />
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {caseData.title}{" "}
                  <span className="text-lg font-normal text-gray-400">(คดี #{caseData.caseNumber})</span>
                </h1>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  วันที่รับแจ้ง: {createdDate} | {createdTime} น.
                </p>
              </div>

              <Separator />

              {/* Victim + Officer */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">ข้อมูลผู้เสียหาย</p>
                    <p className="font-semibold text-gray-900 text-sm">{caseData.victimName}</p>
                    <p className="text-sm text-gray-500">{caseData.victimPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">เจ้าหน้าที่ผู้รับผิดชอบ</p>
                    <p className="font-semibold text-gray-900 text-sm">{caseData.officer?.name}</p>
                    <p className="text-sm text-gray-500">{caseData.officer?.stationName}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">รายละเอียดเนื้องต้น</p>
                <p className="text-gray-700 leading-relaxed text-sm">{caseData.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Update status card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">อัปเดตสถานะคดี</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1.5">สถานะใหม่</p>
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
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1.5">บันทึกเพิ่มเติม</p>
                  <Textarea
                    placeholder="ระบุรายละเอียดคืบหน้า..."
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updating || !newStatus} className="bg-[#0F2C59] hover:bg-[#1a3d73]">
                    {updating
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />กำลังบันทึก...</>
                      : "บันทึกการอัปเดต"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Attachments card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  เอกสารและหลักฐาน
                </CardTitle>
                {caseData.attachments.length > 0 && (
                  <span className="text-xs text-gray-400">{caseData.attachments.length} ไฟล์</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
              <div className="grid grid-cols-3 gap-3">
                {caseData.attachments.map((att) => (
                  <FileCard
                    key={att.id}
                    att={att}
                    onDownload={() => handleDownload(att.id)}
                    onDelete={() => handleDeleteAttachment(att.id)}
                  />
                ))}
                {/* Add file card */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl border-2 border-dashed border-gray-200 h-[calc(7rem+52px)] flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors disabled:opacity-50"
                >
                  {uploading
                    ? <Loader2 className="h-6 w-6 animate-spin" />
                    : <Plus className="h-6 w-6" />}
                  <span className="text-xs">{uploading ? "กำลังอัปโหลด..." : "เพิ่มไฟล์"}</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== Right (1/3) — timeline ===== */}
        <div className="col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">ประวัติการดำเนินคดี</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">ยังไม่มีการอัปเดตสถานะ</p>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

                  <div className="space-y-5">
                    {history.map((h, i) => {
                      const { date, time } = formatDateTime(h.changedAt)
                      return (
                        <div key={i} className="relative pl-6">
                          {/* Dot */}
                          <div className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
                            i === 0
                              ? "bg-[#0F2C59] border-[#0F2C59]"
                              : "bg-white border-gray-300"
                          }`} />

                          <p className="text-xs text-gray-400 mb-1">{date} · {time} น.</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {STATUS_LABEL[h.status] ?? h.status}
                          </p>
                          {h.note && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              "{h.note}"
                            </p>
                          )}
                          {h.changedByName && (
                            <p className="text-xs text-gray-400 mt-1">— โดย {h.changedByName}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
