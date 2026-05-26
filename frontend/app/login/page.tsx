"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Eye, EyeOff, Loader2, BadgeCheck, Lock, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = await signIn("credentials", { email, password, redirect: false })
    if (result?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      setLoading(false)
    } else {
      router.push("/cases")
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0a1f3d 0%, #0F2C59 50%, #1a3d73 100%)" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-5 shadow-lg">
          <ShieldCheck className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">JusticeFlow</h1>
        <p className="text-blue-300/80 text-xs font-semibold tracking-[0.2em] uppercase mt-1.5">
          Case Management System
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-gray-900">ลงชื่อเข้าใช้งาน</h2>
          <p className="text-sm text-gray-500 mt-1">
            กรุณาตรวจสอบสิทธิ์การเข้าถึงข้อมูลของท่านก่อนดำเนินการ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              อีเมลเจ้าหน้าที่ <span className="text-gray-400">(@police.go.th)</span>
            </label>
            <div className="relative">
              <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 h-[18px] w-[18px]" />
              <input
                type="email"
                placeholder="username@police.go.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F2C59] focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">รหัสผ่าน</label>
              <button type="button" className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                ลืมรหัสผ่าน?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-[18px] w-[18px]" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 pl-10 pr-11 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F2C59] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-3 cursor-pointer bg-gray-50 rounded-lg px-4 py-3 border border-gray-100 hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-[#0F2C59]"
            />
            <span className="text-sm text-gray-600">บันทึกข้อมูลการเข้าสู่ระบบไว้ปลอดภัยนั้น</span>
          </label>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 rounded-xl bg-[#0F2C59] hover:bg-[#1a3d73] text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-70 py-3.5"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" />กำลังเข้าสู่ระบบ...</>
            ) : (
              <>เข้าสู่ระบบ <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 border-t border-gray-100" />

        {/* Badges */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-gray-400" />
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-gray-500" />
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center leading-relaxed max-w-xs">
            ระบบนี้ได้รับการคุ้มครองโดยพระราชบัญญัติ ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์
            สงวนสิทธิ์สำหรับเจ้าหน้าที่ผู้ได้รับอนุญาตเท่านั้น
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-blue-300/50 text-center">
        ต้องการความช่วยเหลือด้านเทคนิค?{" "}
        <span className="text-blue-300/80 underline underline-offset-2 cursor-pointer hover:text-blue-300 transition-colors">
          ติดต่อแผนกเทคโนโลยีสารสนเทศ
        </span>
      </p>
    </div>
  )
}
