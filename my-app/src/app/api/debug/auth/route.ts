import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    let dbInfo = {
      users: [],
      tweets: [],
      prismaInitialized: false,
      error: null,
      tableCount: 0
    };

    try {
      const { prisma } = await import("@/lib/prisma");
      
      // Test connection with a simple query
      const tableCount: any = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      dbInfo.prismaInitialized = true;
      dbInfo.tableCount = parseInt(tableCount[0].count);
      
      // Only try to query if tables exist
      if (dbInfo.tableCount > 0) {
        dbInfo.users = await prisma.user.findMany();
        dbInfo.tweets = await prisma.tweet.findMany();
      } else {
        dbInfo.error = "No tables found in database";
      }
      
    } catch (prismaError) {
      console.error("Database error:", prismaError);
      dbInfo.error = prismaError instanceof Error ? prismaError.message : String(prismaError);
    }

    return NextResponse.json({
      session: {
        hasSession: !!session,
        user: session?.user ? {
          twitterId: session.user.twitterId,
          name: session.user.name,
          image: session.user.image,
          hasAccessToken: !!session.user.accessToken,
          accessTokenLength: session.user.accessToken?.length || 0
        } : null
      },
      database: dbInfo,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseType: process.env.DATABASE_URL?.includes("postgresql") ? "PostgreSQL" : "Unknown",
        hasTwitterClientId: !!process.env.TWITTER_CLIENT_ID,
        vercel: process.env.VERCEL ? "yes" : "no"
      }
    });

  } catch (error) {
    console.error("Debug route error:", error);
    return NextResponse.json(
      { 
        error: "Debug route failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}