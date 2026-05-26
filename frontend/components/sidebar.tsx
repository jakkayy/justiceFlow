"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { FolderOpen, PlusCircle, Users, LogOut, ShieldCheck } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/cases", label: "รายการคดี", icon: FolderOpen },
  { href: "/cases/new", label: "เพิ่มคดีใหม่", icon: PlusCircle },
]

const adminItems = [
  { href: "/officers", label: "จัดการเจ้าหน้าที่", icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <aside className="fixed left-0 top-0 h-full w-60 flex flex-col bg-[#0F2C59] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">JusticeFlow</p>
          <p className="text-xs text-blue-300">ระบบติดตามคดี</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === href || (href !== "/cases" && pathname.startsWith(href))
                ? "bg-blue-600 text-white"
                : "text-blue-200 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <Separator className="my-3 bg-white/10" />
            <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-blue-400">ผู้ดูแลระบบ</p>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-blue-600 text-white"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="border-t border-white/10 px-4 py-4">
        <p className="text-sm font-medium truncate">{session?.user?.name}</p>
        <p className="text-xs text-blue-300 truncate">{session?.user?.stationName}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
