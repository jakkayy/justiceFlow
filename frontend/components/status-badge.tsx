import { Badge } from "@/components/ui/badge"
import { CaseStatusLabel } from "@/lib/api"

const colorMap: Record<string, string> = {
  RECEIVED: "bg-blue-100 text-blue-800 border-blue-200",
  INVESTIGATING: "bg-amber-100 text-amber-800 border-amber-200",
  PROSECUTING: "bg-orange-100 text-orange-800 border-orange-200",
  CLOSED: "bg-green-100 text-green-800 border-green-200",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`${colorMap[status] ?? "bg-gray-100 text-gray-800"} font-medium border`} variant="outline">
      {CaseStatusLabel[status] ?? status}
    </Badge>
  )
}
