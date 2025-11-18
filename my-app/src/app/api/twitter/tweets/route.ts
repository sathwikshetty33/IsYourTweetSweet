// // // // // src/app/api/twitter/tweets/route.ts
// // // // import { NextResponse } from "next/server";
// // // // import { getServerSession } from "next-auth/next";
// // // // import { authOptions } from "@/lib/auth";

// // // // export async function GET(request: Request) {
// // // //   const session = await getServerSession(authOptions);

// // // //   if (!session?.user?.accessToken || !session?.user?.twitterId) {
// // // //     return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
// // // //   }

// // // //   const accessToken = session.user.accessToken as string;
// // // //   const userId = session.user.twitterId as string;

// // // //   try {
// // // //     const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=created_at,text,author_id`;
// // // //     const r = await fetch(url, {
// // // //       headers: { Authorization: `Bearer ${accessToken}` },
// // // //     });

// // // //     const text = await r.text();
// // // //     if (!r.ok) {
// // // //       // forward the Twitter error payload
// // // //       try {
// // // //         // if it's JSON, return structured JSON
// // // //         const json = JSON.parse(text);
// // // //         return NextResponse.json(json, { status: r.status });
// // // //       } catch {
// // // //         return new NextResponse(text || JSON.stringify({ error: "Twitter API error" }), { status: r.status });
// // // //       }
// // // //     }

// // // //     return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/json" } });
// // // //   } catch (err: unknown) {
// // // //     const detail = err instanceof Error ? err.message : String(err);
// // // //     return NextResponse.json({ error: "Server error", detail }, { status: 500 });
// // // //   }
// // // // }
// // // // src/app/api/twitter/tweets/route.ts
// // // import { NextResponse } from "next/server";
// // // import { getServerSession } from "next-auth/next";
// // // import { authOptions } from "@/lib/auth";

// // // export async function GET(request: Request) {
// // //   const session = await getServerSession(authOptions);

// // //   if (!session?.user?.accessToken || !session?.user?.twitterId) {
// // //     return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
// // //   }

// // //   const accessToken = session.user.accessToken as string;
// // //   const userId = session.user.twitterId as string;

// // //   try {
// // //     const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=created_at,text,author_id`;
// // //     const r = await fetch(url, {
// // //       headers: { Authorization: `Bearer ${accessToken}` },
// // //     });

// // //     const text = await r.text();
// // //     if (!r.ok) {
// // //       try {
// // //         const json = JSON.parse(text);
// // //         return NextResponse.json(json, { status: r.status });
// // //       } catch {
// // //         return new NextResponse(text || JSON.stringify({ error: "Twitter API error" }), { status: r.status });
// // //       }
// // //     }

// // //     return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/json" } });
// // //   } catch (err: unknown) {
// // //     const detail = err instanceof Error ? err.message : String(err);
// // //     return NextResponse.json({ error: "Server error", detail }, { status: 500 });
// // //   }
// // // }

// // // export async function POST(request: Request) {
// // //   const session = await getServerSession(authOptions);

// // //   if (!session?.user?.accessToken) {
// // //     return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
// // //   }

// // //   const accessToken = session.user.accessToken as string;

// // //   try {
// // //     // Parse the request body
// // //     const body = await request.json();
// // //     const { text } = body;

// // //     if (!text || typeof text !== 'string' || text.trim().length === 0) {
// // //       return NextResponse.json({ error: "Tweet text is required" }, { status: 400 });
// // //     }

// // //     if (text.length > 280) {
// // //       return NextResponse.json({ error: "Tweet is too long (max 280 characters)" }, { status: 400 });
// // //     }

// // //     // Post tweet to Twitter API
// // //     const url = "https://api.twitter.com/2/tweets";
// // //     const r = await fetch(url, {
// // //       method: "POST",
// // //       headers: {
// // //         "Authorization": `Bearer ${accessToken}`,
// // //         "Content-Type": "application/json",
// // //       },
// // //       body: JSON.stringify({ text: text.trim() }),
// // //     });

// // //     const responseText = await r.text();
    
// // //     if (!r.ok) {
// // //       console.error("Twitter API error:", responseText);
// // //       try {
// // //         const json = JSON.parse(responseText);
// // //         return NextResponse.json(
// // //           { error: json.detail || json.title || "Failed to post tweet", ...json }, 
// // //           { status: r.status }
// // //         );
// // //       } catch {
// // //         return NextResponse.json(
// // //           { error: "Failed to post tweet", detail: responseText }, 
// // //           { status: r.status }
// // //         );
// // //       }
// // //     }

// // //     // Parse successful response
// // //     const data = JSON.parse(responseText);
// // //     return NextResponse.json({ 
// // //       success: true, 
// // //       data,
// // //       message: "Tweet posted successfully" 
// // //     }, { status: 201 });

// // //   } catch (err: unknown) {
// // //     console.error("POST /api/twitter/tweets error:", err);
// // //     const detail = err instanceof Error ? err.message : String(err);
// // //     return NextResponse.json({ 
// // //       error: "Failed to post tweet", 
// // //       detail 
// // //     }, { status: 500 });
// // //   }
// // // }
// // // src/app/api/twitter/tweets/route.ts
// // import { NextResponse } from "next/server";
// // import { getServerSession } from "next-auth/next";
// // import { authOptions } from "@/lib/auth";
// // import { prisma } from "@/lib/prisma";

// // // Helper function to load initial tweets (first time or when DB is empty)
// // async function loadInitialTweets(userId: string, accessToken: string, dbUserId: string) {
// //   const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=created_at,text,author_id`;
// //   const r = await fetch(url, {
// //     headers: { Authorization: `Bearer ${accessToken}` },
// //   });

// //   if (!r.ok) {
// //     throw new Error("Failed to fetch tweets from Twitter");
// //   }

// //   const data = await r.json();
// //   const tweets = data?.data || [];

// //   // Bulk insert tweets
// //   for (const tweet of tweets) {
// //     await prisma.tweet.upsert({
// //       where: { tweetId: tweet.id },
// //       update: {
// //         text: tweet.text,
// //         createdAt: new Date(tweet.created_at),
// //         authorId: tweet.author_id,
// //       },
// //       create: {
// //         tweetId: tweet.id,
// //         text: tweet.text,
// //         createdAt: new Date(tweet.created_at),
// //         authorId: tweet.author_id,
// //         ownerId: dbUserId,
// //       },
// //     });
// //   }

// //   return tweets.length;
// // }

// // export async function GET(request: Request) {
// //   const session = await getServerSession(authOptions);

// //   if (!session?.user?.accessToken || !session?.user?.twitterId) {
// //     return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
// //   }

// //   const accessToken = session.user.accessToken as string;
// //   const userId = session.user.twitterId as string;

// //   try {
// //     // Fetch tweets from Twitter API
// //     const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=created_at,text,author_id`;
// //     const r = await fetch(url, {
// //       headers: { Authorization: `Bearer ${accessToken}` },
// //     });

// //     const text = await r.text();
// //     if (!r.ok) {
// //       try {
// //         const json = JSON.parse(text);
// //         return NextResponse.json(json, { status: r.status });
// //       } catch {
// //         return new NextResponse(text || JSON.stringify({ error: "Twitter API error" }), { status: r.status });
// //       }
// //     }

// //     const data = JSON.parse(text);
// //     const fetchedTweets = data?.data || [];

// //     // Ensure user exists in database
// //     await prisma.user.upsert({
// //       where: { twitterId: userId },
// //       update: {
// //         name: session.user.name,
// //         image: session.user.image,
// //         accessToken: accessToken,
// //       },
// //       create: {
// //         twitterId: userId,
// //         name: session.user.name,
// //         image: session.user.image,
// //         accessToken: accessToken,
// //       },
// //     });

// //     // Get user from database
// //     const dbUser = await prisma.user.findUnique({
// //       where: { twitterId: userId },
// //     });

// //     if (!dbUser) {
// //       throw new Error("Failed to create/find user");
// //     }

// //     // Sync tweets with database
// //     const fetchedTweetIds = new Set(fetchedTweets.map((t: any) => t.id));

// //     // Get existing tweets from database
// //     const existingTweets = await prisma.tweet.findMany({
// //       where: { ownerId: dbUser.id },
// //     });

// //     const existingTweetIds = new Set(existingTweets.map(t => t.tweetId));

// //     // Find tweets to delete (in DB but not in fetched)
// //     const tweetsToDelete = existingTweets
// //       .filter(t => !fetchedTweetIds.has(t.tweetId))
// //       .map(t => t.tweetId);

// //     // Delete removed tweets
// //     if (tweetsToDelete.length > 0) {
// //       await prisma.tweet.deleteMany({
// //         where: {
// //           tweetId: { in: tweetsToDelete },
// //           ownerId: dbUser.id,
// //         },
// //       });
// //       console.log(`Deleted ${tweetsToDelete.length} tweets`);
// //     }

// //     // Upsert fetched tweets
// //     for (const tweet of fetchedTweets) {
// //       await prisma.tweet.upsert({
// //         where: { tweetId: tweet.id },
// //         update: {
// //           text: tweet.text,
// //           createdAt: new Date(tweet.created_at),
// //           authorId: tweet.author_id,
// //         },
// //         create: {
// //           tweetId: tweet.id,
// //           text: tweet.text,
// //           createdAt: new Date(tweet.created_at),
// //           authorId: tweet.author_id,
// //           ownerId: dbUser.id,
// //         },
// //       });
// //     }

// //     // Fetch all tweets from database for this user
// //     const allTweets = await prisma.tweet.findMany({
// //       where: { ownerId: dbUser.id },
// //       orderBy: { createdAt: 'desc' },
// //     });

// //     // Format tweets to match Twitter API response
// //     const formattedTweets = allTweets.map(tweet => ({
// //       id: tweet.tweetId,
// //       text: tweet.text,
// //       created_at: tweet.createdAt.toISOString(),
// //       author_id: tweet.authorId,
// //     }));

// //     return NextResponse.json({
// //       data: formattedTweets,
// //       meta: {
// //         result_count: formattedTweets.length,
// //         synced_from_db: true,
// //         deleted_count: tweetsToDelete.length,
// //       }
// //     }, { status: 200 });

// //   } catch (err: unknown) {
// //     console.error("GET /api/twitter/tweets error:", err);
// //     const detail = err instanceof Error ? err.message : String(err);
// //     return NextResponse.json({ error: "Server error", detail }, { status: 500 });
// //   }
// // }

// // export async function POST(request: Request) {
// //   const session = await getServerSession(authOptions);

// //   if (!session?.user?.accessToken || !session?.user?.twitterId) {
// //     return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
// //   }

// //   const accessToken = session.user.accessToken as string;
// //   const userId = session.user.twitterId as string;

// //   try {
// //     const body = await request.json();
// //     const { text } = body;

// //     if (!text || typeof text !== 'string' || text.trim().length === 0) {
// //       return NextResponse.json({ error: "Tweet text is required" }, { status: 400 });
// //     }

// //     if (text.length > 280) {
// //       return NextResponse.json({ error: "Tweet is too long (max 280 characters)" }, { status: 400 });
// //     }

// //     // Post tweet to Twitter API
// //     const url = "https://api.twitter.com/2/tweets";
// //     const r = await fetch(url, {
// //       method: "POST",
// //       headers: {
// //         "Authorization": `Bearer ${accessToken}`,
// //         "Content-Type": "application/json",
// //       },
// //       body: JSON.stringify({ text: text.trim() }),
// //     });

// //     const responseText = await r.text();
    
// //     if (!r.ok) {
// //       console.error("Twitter API error:", responseText);
// //       try {
// //         const json = JSON.parse(responseText);
// //         return NextResponse.json(
// //           { error: json.detail || json.title || "Failed to post tweet", ...json }, 
// //           { status: r.status }
// //         );
// //       } catch {
// //         return NextResponse.json(
// //           { error: "Failed to post tweet", detail: responseText }, 
// //           { status: r.status }
// //         );
// //       }
// //     }

// //     // Parse successful response
// //     const data = JSON.parse(responseText);
// //     const newTweet = data.data;

// //     // Get user from database
// //     const dbUser = await prisma.user.findUnique({
// //       where: { twitterId: userId },
// //     });

// //     if (dbUser) {
// //       // Save new tweet to database
// //       await prisma.tweet.create({
// //         data: {
// //           tweetId: newTweet.id,
// //           text: newTweet.text,
// //           createdAt: new Date(),
// //           authorId: userId,
// //           ownerId: dbUser.id,
// //         },
// //       });
// //     }

// //     return NextResponse.json({ 
// //       success: true, 
// //       data: newTweet,
// //       message: "Tweet posted successfully" 
// //     }, { status: 201 });

// //   } catch (err: unknown) {
// //     console.error("POST /api/twitter/tweets error:", err);
// //     const detail = err instanceof Error ? err.message : String(err);
// //     return NextResponse.json({ 
// //       error: "Failed to post tweet", 
// //       detail 
// //     }, { status: 500 });
// //   }
// // }
// // src/app/api/twitter/tweets/route.ts
// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";

// // Helper function to get Prisma client with dynamic import
// async function getPrisma() {
//   const { prisma } = await import("@/lib/prisma");
//   return prisma;
// }

// export async function GET(request: Request) {
//   const session = await getServerSession(authOptions);

//   if (!session?.user?.accessToken || !session?.user?.twitterId) {
//     return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//   }

//   const accessToken = session.user.accessToken as string;
//   const userId = session.user.twitterId as string;

//   try {
//     // Fetch tweets from Twitter API first
//     const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=created_at,text,author_id`;
//     const r = await fetch(url, {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     });

//     const text = await r.text();
//     if (!r.ok) {
//       try {
//         const json = JSON.parse(text);
//         return NextResponse.json(json, { status: r.status });
//       } catch {
//         return new NextResponse(text || JSON.stringify({ error: "Twitter API error" }), { status: r.status });
//       }
//     }

//     const data = JSON.parse(text);
//     const fetchedTweets = data?.data || [];

//     // Get Prisma client dynamically
//     const prisma = await getPrisma();

//     // Ensure user exists in database
//     await prisma.user.upsert({
//       where: { twitterId: userId },
//       update: {
//         name: session.user.name,
//         image: session.user.image,
//         accessToken: accessToken,
//       },
//       create: {
//         twitterId: userId,
//         name: session.user.name,
//         image: session.user.image,
//         accessToken: accessToken,
//       },
//     });

//     // Get user from database
//     const dbUser = await prisma.user.findUnique({
//       where: { twitterId: userId },
//     });

//     if (!dbUser) {
//       throw new Error("Failed to create/find user");
//     }

//     // Rest of your database logic remains the same...
//     const fetchedTweetIds = new Set(fetchedTweets.map((t: any) => t.id));

//     const existingTweets = await prisma.tweet.findMany({
//       where: { ownerId: dbUser.id },
//     });

//     const existingTweetIds = new Set(existingTweets.map(t => t.tweetId));

//     const tweetsToDelete = existingTweets
//       .filter(t => !fetchedTweetIds.has(t.tweetId))
//       .map(t => t.tweetId);

//     if (tweetsToDelete.length > 0) {
//       await prisma.tweet.deleteMany({
//         where: {
//           tweetId: { in: tweetsToDelete },
//           ownerId: dbUser.id,
//         },
//       });
//       console.log(`Deleted ${tweetsToDelete.length} tweets`);
//     }

//     for (const tweet of fetchedTweets) {
//       await prisma.tweet.upsert({
//         where: { tweetId: tweet.id },
//         update: {
//           text: tweet.text,
//           createdAt: new Date(tweet.created_at),
//           authorId: tweet.author_id,
//         },
//         create: {
//           tweetId: tweet.id,
//           text: tweet.text,
//           createdAt: new Date(tweet.created_at),
//           authorId: tweet.author_id,
//           ownerId: dbUser.id,
//         },
//       });
//     }

//     const allTweets = await prisma.tweet.findMany({
//       where: { ownerId: dbUser.id },
//       orderBy: { createdAt: 'desc' },
//     });

//     const formattedTweets = allTweets.map(tweet => ({
//       id: tweet.tweetId,
//       text: tweet.text,
//       created_at: tweet.createdAt.toISOString(),
//       author_id: tweet.authorId,
//     }));

//     return NextResponse.json({
//       data: formattedTweets,
//       meta: {
//         result_count: formattedTweets.length,
//         synced_from_db: true,
//         deleted_count: tweetsToDelete.length,
//       }
//     }, { status: 200 });

//   } catch (err: unknown) {
//     console.error("GET /api/twitter/tweets error:", err);
//     const detail = err instanceof Error ? err.message : String(err);
//     return NextResponse.json({ error: "Server error", detail }, { status: 500 });
//   }
// }

// export async function POST(request: Request) {
//   const session = await getServerSession(authOptions);

//   if (!session?.user?.accessToken || !session?.user?.twitterId) {
//     return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//   }

//   const accessToken = session.user.accessToken as string;
//   const userId = session.user.twitterId as string;

//   try {
//     const body = await request.json();
//     const { text } = body;

//     if (!text || typeof text !== 'string' || text.trim().length === 0) {
//       return NextResponse.json({ error: "Tweet text is required" }, { status: 400 });
//     }

//     if (text.length > 280) {
//       return NextResponse.json({ error: "Tweet is too long (max 280 characters)" }, { status: 400 });
//     }

//     // Post tweet to Twitter API
//     const url = "https://api.twitter.com/2/tweets";
//     const r = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${accessToken}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ text: text.trim() }),
//     });

//     const responseText = await r.text();
    
//     if (!r.ok) {
//       console.error("Twitter API error:", responseText);
//       try {
//         const json = JSON.parse(responseText);
//         return NextResponse.json(
//           { error: json.detail || json.title || "Failed to post tweet", ...json }, 
//           { status: r.status }
//         );
//       } catch {
//         return NextResponse.json(
//           { error: "Failed to post tweet", detail: responseText }, 
//           { status: r.status }
//         );
//       }
//     }

//     const data = JSON.parse(responseText);
//     const newTweet = data.data;

//     // Get Prisma client dynamically
//     const prisma = await getPrisma();

//     const dbUser = await prisma.user.findUnique({
//       where: { twitterId: userId },
//     });

//     if (dbUser) {
//       await prisma.tweet.create({
//         data: {
//           tweetId: newTweet.id,
//           text: newTweet.text,
//           createdAt: new Date(),
//           authorId: userId,
//           ownerId: dbUser.id,
//         },
//       });
//     }

//     return NextResponse.json({ 
//       success: true, 
//       data: newTweet,
//       message: "Tweet posted successfully" 
//     }, { status: 201 });

//   } catch (err: unknown) {
//     console.error("POST /api/twitter/tweets error:", err);
//     const detail = err instanceof Error ? err.message : String(err);
//     return NextResponse.json({ 
//       error: "Failed to post tweet", 
//       detail 
//     }, { status: 500 });
//   }
// }
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken || !session?.user?.twitterId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const accessToken = session.user.accessToken;
    const userId = session.user.twitterId;

    // Fetch tweets from Twitter API
    const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=created_at,text,author_id`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Twitter API error", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const fetchedTweets = data?.data || [];

    // Try to save to database, but don't fail if it doesn't work
    try {
      const prisma = await getPrisma();
      
      // Check if users table exists
      const tables: any = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      `;
      
      if (tables.length > 0) {
        // Database tables exist, proceed with saving
        const dbUser = await prisma.user.upsert({
          where: { twitterId: userId },
          update: {
            name: session.user.name,
            image: session.user.image,
            accessToken: accessToken,
          },
          create: {
            twitterId: userId,
            name: session.user.name,
            image: session.user.image,
            accessToken: accessToken,
          },
        });

        // Save tweets
        for (const tweet of fetchedTweets) {
          await prisma.tweet.upsert({
            where: { tweetId: tweet.id },
            update: {
              text: tweet.text,
              createdAt: new Date(tweet.created_at),
              authorId: tweet.author_id,
            },
            create: {
              tweetId: tweet.id,
              text: tweet.text,
              createdAt: new Date(tweet.created_at),
              authorId: tweet.author_id,
              ownerId: dbUser.id,
            },
          });
        }
        
        console.log("✅ Data saved to database");
      } else {
        console.log("⚠️ Database tables don't exist yet");
      }
      
    } catch (dbError) {
      console.error("Database operation failed:", dbError);
      // Continue without failing
    }

    return NextResponse.json({
      data: fetchedTweets,
      meta: {
        result_count: fetchedTweets.length,
        saved_to_db: false // We'll update this when DB works
      }
    });

  } catch (error) {
    console.error("Error in tweets route:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}