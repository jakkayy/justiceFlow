import axios from "axios"

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api"

export function createApi(token: string) {
  return axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  })
}

export const CaseStatusLabel: Record<string, string> = {
  RECEIVED: "รับเรื่องแล้ว",
  INVESTIGATING: "อยู่ระหว่างสืบสวน",
  PROSECUTING: "ส่งฟ้องอัยการ",
  CLOSED: "ปิดคดีแล้ว",
}

export const CaseStatusOptions = Object.entries(CaseStatusLabel).map(([value, label]) => ({ value, label }))
