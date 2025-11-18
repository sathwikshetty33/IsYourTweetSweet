import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    console.log("🔍 Debug route called");
    
    // Get the session first
    const session = await getServerSession(authOptions);
    
    let dbInfo = {
      users: [],
      tweets: [],
      prismaInitialized: false,
      error: null
    };

    // Try to get Prisma client with better error handling
    try {
      // Use dynamic import to avoid build-time issues
      const { prisma } = await import("@/lib/prisma");
      
      // Test the connection
      await prisma.$connect();
      dbInfo.prismaInitialized = true;
      
      // Get users and tweets
      dbInfo.users = await prisma.user.findMany();
      dbInfo.tweets = await prisma.tweet.findMany();
      
    } catch (prismaError) {
      console.error("❌ Prisma error:", prismaError);
      dbInfo.error = prismaError instanceof Error ? prismaError.message : String(prismaError);
    }

    return NextResponse.json({
      session: {
        hasSession: !!session,
        user: session?.user ? {
          twitterId: session.user.twitterId,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          hasAccessToken: !!session.user.accessToken,
          accessTokenLength: session.user.accessToken?.length || 0
        } : null
      },
      database: dbInfo,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasTwitterClientId: !!process.env.TWITTER_CLIENT_ID,
        vercel: process.env.VERCEL ? "yes" : "no"
      }
    });

  } catch (error) {
    console.error("💥 Debug route error:", error);
    return NextResponse.json(
      { 
        error: "Debug route failed", 
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 });}}