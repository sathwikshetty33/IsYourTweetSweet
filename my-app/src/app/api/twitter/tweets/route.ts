// // src/app/api/twitter/tweets/route.ts
// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";

// export async function GET(request: Request) {
//   const session = await getServerSession(authOptions);

//   if (!session?.user?.accessToken || !session?.user?.twitterId) {
//     return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//   }

//   const accessToken = session.user.accessToken as string;
//   const userId = session.user.twitterId as string;

//   try {
//     const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=created_at,text,author_id`;
//     const r = await fetch(url, {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     });

//     const text = await r.text();
//     if (!r.ok) {
//       // forward the Twitter error payload
//       try {
//         // if it's JSON, return structured JSON
//         const json = JSON.parse(text);
//         return NextResponse.json(json, { status: r.status });
//       } catch {
//         return new NextResponse(text || JSON.stringify({ error: "Twitter API error" }), { status: r.status });
//       }
//     }

//     return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/json" } });
//   } catch (err: unknown) {
//     const detail = err instanceof Error ? err.message : String(err);
//     return NextResponse.json({ error: "Server error", detail }, { status: 500 });
//   }
// }
// src/app/api/twitter/tweets/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken || !session?.user?.twitterId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = session.user.accessToken as string;
  const userId = session.user.twitterId as string;

  try {
    const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=created_at,text,author_id`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const text = await r.text();
    if (!r.ok) {
      try {
        const json = JSON.parse(text);
        return NextResponse.json(json, { status: r.status });
      } catch {
        return new NextResponse(text || JSON.stringify({ error: "Twitter API error" }), { status: r.status });
      }
    }

    return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Server error", detail }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = session.user.accessToken as string;

  try {
    // Parse the request body
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: "Tweet text is required" }, { status: 400 });
    }

    if (text.length > 280) {
      return NextResponse.json({ error: "Tweet is too long (max 280 characters)" }, { status: 400 });
    }

    // Post tweet to Twitter API
    const url = "https://api.twitter.com/2/tweets";
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text.trim() }),
    });

    const responseText = await r.text();
    
    if (!r.ok) {
      console.error("Twitter API error:", responseText);
      try {
        const json = JSON.parse(responseText);
        return NextResponse.json(
          { error: json.detail || json.title || "Failed to post tweet", ...json }, 
          { status: r.status }
        );
      } catch {
        return NextResponse.json(
          { error: "Failed to post tweet", detail: responseText }, 
          { status: r.status }
        );
      }
    }

    // Parse successful response
    const data = JSON.parse(responseText);
    return NextResponse.json({ 
      success: true, 
      data,
      message: "Tweet posted successfully" 
    }, { status: 201 });

  } catch (err: unknown) {
    console.error("POST /api/twitter/tweets error:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ 
      error: "Failed to post tweet", 
      detail 
    }, { status: 500 });
  }
}
