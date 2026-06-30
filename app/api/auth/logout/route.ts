import { NextResponse } from "next/server";
import { COOKIE_OPTIONS } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return res;
}