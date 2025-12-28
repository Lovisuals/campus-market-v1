import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ 
    status: "ALIVE", 
    detected_at: "root_app_folder",
    time: new Date().toISOString() 
  });
}
