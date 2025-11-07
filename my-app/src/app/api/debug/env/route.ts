// src/app/api/debug/env/route.js
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    TWITTER_CLIENT_ID_set: !!process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET_set: !!process.env.TWITTER_CLIENT_SECRET,
    NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
    NEXTGRQ: process.env.NEXTGRQ || null
  });
}
