import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ status: "Vercel is reaching the src/app/api folder" });
}
