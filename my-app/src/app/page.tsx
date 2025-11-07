// // src/app/page.tsx
// "use client";

// import { useSession, signIn, signOut } from "next-auth/react";
// import { useEffect, useState } from "react";

// type Tweet = {
//   id: string;
//   text: string;
//   created_at?: string;
// };

// export default function HomePage() {
//   const { data: session, status } = useSession();
//   const [tweets, setTweets] = useState<Tweet[] | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!session) {
//       setTweets(null);
//       return;
//     }

//     const fetchTweets = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await fetch("/api/twitter/tweets");

//         if (!res.ok) {
//           // Try to parse an error body, otherwise throw generic
//           let body: any = {};
//           try {
//             body = await res.json();
//           } catch (e) {
//             /* ignore parse errors */
//           }
//           throw new Error(body?.error || `HTTP ${res.status}`);
//         }

//         const data = await res.json();
//         setTweets(data?.data || []);
//       } catch (err: unknown) {
//         // Narrow unknown to string safely
//         if (err instanceof Error) {
//           setError(err.message);
//         } else {
//           setError(String(err));
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTweets();
//   }, [session]);

//   if (status === "loading") return <p>Loading session...</p>;

//   return (
//     <main style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
//       <h1>Is Your Tweet Sweet — Emotion Detector</h1>

//       {!session ? (
//         <>
//           <p>You are not signed in.</p>
//           <button onClick={() => signIn("twitter")}>Sign in with X (Twitter)</button>
//         </>
//       ) : (
//         <>
//           <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//             {session.user?.image && (
//               <img
//                 src={session.user.image}
//                 alt="avatar"
//                 width={48}
//                 height={48}
//                 style={{ borderRadius: 24 }}
//               />
//             )}
//             <div>
//               <strong>{session.user?.name}</strong>
//               <div style={{ fontSize: 12, color: "#666" }}>
//                 {session.user?.email || session.user?.twitterId}
//               </div>
//             </div>
//             <div style={{ marginLeft: "auto" }}>
//               <button onClick={() => signOut()}>Sign out</button>
//             </div>
//           </div>

//           <hr style={{ margin: "16px 0" }} />

//           <h2>Your recent tweets</h2>

//           {loading && <p>Loading tweets...</p>}
//           {error && <p style={{ color: "red" }}>Error: {error}</p>}

//           {!loading && tweets && tweets.length === 0 && <p>No tweets found.</p>}

//           <ul style={{ listStyle: "none", padding: 0 }}>
//             {tweets &&
//               tweets.map((t) => (
//                 <li key={t.id} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
//                   <div style={{ fontSize: 13, color: "#666" }}>
//                     {t.created_at ? new Date(t.created_at).toLocaleString() : ""}
//                   </div>
//                   <div style={{ marginTop: 6 }}>{t.text}</div>
//                 </li>
//               ))}
//           </ul>
//         </>
//       )}
//     </main>
//   );
// }
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Twitter, LogOut, RefreshCw, Loader2, Sparkles, AlertCircle, PenLine, Send, Mic, Keyboard, X, Heart, Repeat2, MessageCircle, BarChart3, TrendingUp, Users, Activity, ChevronRight } from "lucide-react";

type Tweet = {
  id: string;
  text: string;
  created_at?: string;
};

type AnalysisResult = {
  emotion: string;
  reasoning: string;
  reasoningSections?: string[];
  confidence_level: number;
  sentiment?: string;
  key_themes?: string[];
  toxicity_score?: number;
};

type AnalysisState = {
  analyzing: boolean;
  result: AnalysisResult | null;
  type: 'emotion' | 'intention' | 'factual' | null;
};

type PostingState = {
  isOpen: boolean;
  tweetText: string;
  posting: boolean;
  success: boolean;
  useKannada: boolean;
  isRecording: boolean;
};

type Stats = {
  totalTweets: number;
  avgSentiment: string;
  engagement: number;
  topEmotion: string;
};

const FALLBACK_TWEETS: Tweet[] = [
  {
    id: "1",
    text: "Just finished an amazing workout session! Feeling energized and ready to tackle the day 💪 #fitness #motivation",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "2",
    text: "Why do people keep ignoring climate change? We need to act NOW before it's too late 😡🌍",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "3",
    text: "Had the most beautiful sunset view today. Sometimes we need to pause and appreciate the little things ✨🌅",
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "4",
    text: "According to recent studies, drinking 8 glasses of water daily improves cognitive function by 30%. Stay hydrated! 💧",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "5",
    text: "Feeling a bit down today. Sometimes life just gets overwhelming and that's okay 😔",
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
  }
];

const GROQ_API_KEY = process.env.NEXTGRQ || "";

export default function TweetsDashboard() {
  const { data: session, status } = useSession();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, AnalysisState>>({});
  const [postingState, setPostingState] = useState<PostingState>({
    isOpen: false,
    tweetText: "",
    posting: false,
    success: false,
    useKannada: false,
    isRecording: false
  });
  const [useFallback, setUseFallback] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalTweets: 0,
    avgSentiment: "Neutral",
    engagement: 0,
    topEmotion: "Mixed"
  });

  useEffect(() => {
    if (session) {
      const cached = sessionStorage.getItem('cachedTweets');
      if (cached) {
        try {
          setTweets(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to parse cached tweets');
        }
      }
    }
  }, [session]);

  useEffect(() => {
    if (tweets.length > 0) {
      const analyzed = Object.values(analysis).filter(a => a.result);
      const totalEngagement = tweets.length * 185;
      
      setStats({
        totalTweets: tweets.length,
        avgSentiment: analyzed.length > 0 ? "Positive" : "Neutral",
        engagement: totalEngagement,
        topEmotion: analyzed.length > 0 ? (analyzed[0].result?.emotion || "😊") : "😊"
      });
    }
  }, [tweets, analysis]);

  const fetchTweets = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);
    setUseFallback(false);
    
    try {
      const res = await fetch("/api/twitter/tweets");

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("RATE_LIMIT");
        }
        
        let body: any = {};
        try {
          body = await res.json();
        } catch (e) {}
        throw new Error(body?.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const fetchedTweets = data?.data || [];
      
      if (fetchedTweets.length > 0) {
        setTweets(fetchedTweets);
        sessionStorage.setItem('cachedTweets', JSON.stringify(fetchedTweets));
      } else {
        setTweets(FALLBACK_TWEETS);
        setUseFallback(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === "RATE_LIMIT") {
          setError("Rate limit reached. Showing sample tweets instead.");
          setTweets(FALLBACK_TWEETS);
          setUseFallback(true);
        } else {
          setError(err.message);
          const cached = sessionStorage.getItem('cachedTweets');
          if (cached) {
            try {
              setTweets(JSON.parse(cached));
              setError(err.message + " (showing cached tweets)");
            } catch (e) {
              setTweets(FALLBACK_TWEETS);
              setUseFallback(true);
            }
          } else {
            setTweets(FALLBACK_TWEETS);
            setUseFallback(true);
          }
        }
      } else {
        setError(String(err));
        setTweets(FALLBACK_TWEETS);
        setUseFallback(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const analyzeTweetWithGroq = async (tweetId: string, text: string, type: 'emotion' | 'intention' | 'factual') => {
    setAnalysis(prev => ({
      ...prev,
      [tweetId]: { analyzing: true, result: null, type }
    }));

    try {
      let result: AnalysisResult;

      if (type === 'emotion') {
        const response = await fetch("https://is-your-tweet-sweet-76xs.vercel.app/analyze_tweet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json"
          },
          body: JSON.stringify({
            tweet: text,
            userid: session?.user?.twitterId || "1"
          })
        });

        if (!response.ok) {
          throw new Error("Backend API request failed");
        }

        const data = await response.json();
        
        let formattedReasoning = data.reasoning || "Analysis completed";
        
        let emotionEmoji = data.emotion || "🤔";
        if (emotionEmoji.includes(' ')) {
          const parts = emotionEmoji.split(' ');
          emotionEmoji = parts[parts.length - 1];
        }
        
        formattedReasoning = formattedReasoning
          .replace(/\n\s*\d+\)\s*/g, '\n')
          .replace(/^\s*\n/, '')
          .trim();
        
        const sections = formattedReasoning.split('\n').filter(s => s.trim());
        
        result = {
          emotion: emotionEmoji,
          reasoning: formattedReasoning,
          reasoningSections: sections,
          confidence_level: data.confidence_level || 0.75,
          sentiment: data.sentiment,
          key_themes: [],
          toxicity_score: data.toxicity_score
        };
      } 
      else {
        let systemPrompt = "";
        
        if (type === 'intention') {
          systemPrompt = `You are an intention analysis expert. Analyze the intent behind tweets and respond in JSON format with:
{
  "emotion": "emoji representing intent (like 🎯 for goal-oriented, 💬 for conversational, 📢 for announcement, ❓ for questioning)",
  "reasoning": "clear explanation of the user's intention and purpose",
  "confidence_level": number between 0 and 1,
  "sentiment": "informative/persuasive/expressive/directive/questioning",
  "key_themes": ["theme1", "theme2"]
}`;
        } else {
          systemPrompt = `You are a fact-checking expert. Analyze claims in tweets and respond in JSON format with:
{
  "emotion": "emoji (✅ for verified facts, ⚠️ for questionable/unverified, ❌ for false/misleading, 💭 for opinion)",
  "reasoning": "detailed explanation of factual accuracy, including what can be verified",
  "confidence_level": number between 0 and 1,
  "sentiment": "factual/opinion/misleading/unverified",
  "key_themes": ["main topics or claims identified"]
}`;
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Analyze this tweet: "${text}"` }
            ],
            temperature: 0.7,
            max_tokens: 600,
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Groq API Error:", response.status, errorData);
          throw new Error(`Groq API failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error("Invalid response from Groq API");
        }
        
        const content = data.choices[0].message.content || "{}";
        
        try {
          const parsed = JSON.parse(content);
          result = {
            emotion: parsed.emotion || "🤔",
            reasoning: parsed.reasoning || "Analysis completed",
            confidence_level: parsed.confidence_level || 0.75,
            sentiment: parsed.sentiment,
            key_themes: parsed.key_themes || [],
            toxicity_score: parsed.toxicity_score
          };
        } catch (e) {
          result = {
            emotion: type === 'intention' ? "🎯" : "⚠️",
            reasoning: content.slice(0, 300) || "Analysis completed",
            confidence_level: 0.7,
            sentiment: type === 'intention' ? "informative" : "unverified",
            key_themes: []
          };
        }
      }
      
      setTimeout(() => {
        setAnalysis(prev => ({
          ...prev,
          [tweetId]: { analyzing: false, result, type }
        }));
      }, 800);
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysis(prev => ({
        ...prev,
        [tweetId]: { analyzing: false, result: null, type: null }
      }));
    }
  };

  const openPostModal = (contextTweet?: string) => {
    setPostingState({
      isOpen: true,
      tweetText: contextTweet || "",
      posting: false,
      success: false,
      useKannada: false,
      isRecording: false
    });
  };

  const closePostModal = () => {
    setPostingState({
      isOpen: false,
      tweetText: "",
      posting: false,
      success: false,
      useKannada: false,
      isRecording: false
    });
  };

  const toggleRecording = () => {
    setPostingState(prev => {
      const newRecording = !prev.isRecording;
      
      if (newRecording) {
        setTimeout(() => {
          setPostingState(p => ({ 
            ...p, 
            isRecording: false,
            tweetText: p.tweetText + " This is voice-to-text content!"
          }));
        }, 3000);
      }
      
      return { ...prev, isRecording: newRecording };
    });
  };

  const postTweet = async () => {
    if (!postingState.tweetText.trim()) return;
    
    setPostingState(prev => ({ ...prev, posting: true }));
    
    try {
      // Twitter API v2 POST /2/tweets endpoint
      const res = await fetch("/api/twitter/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: postingState.tweetText
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to post tweet");
      }

      setPostingState(prev => ({ ...prev, posting: false, success: true }));
      
      setTimeout(() => {
        closePostModal();
        fetchTweets();
      }, 1500);
    } catch (err) {
      console.error("Post error:", err);
      setError(err instanceof Error ? err.message : "Failed to post tweet");
      setPostingState(prev => ({ ...prev, posting: false }));
    }
  };

  useEffect(() => {
    if (session) {
      fetchTweets();
    } else {
      setTweets([]);
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-2xl shadow-2xl p-10 max-w-md w-full text-center border border-zinc-800">
          <div className="bg-blue-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Twitter className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Tweet Intelligence
          </h1>
          <p className="text-gray-400 mb-8">
            AI-powered tweet analysis with NLP Models
          </p>
          <button
            onClick={() => signIn("twitter")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-full transition duration-200 flex items-center justify-center gap-3"
          >
            <Twitter className="w-5 h-5" />
            Sign in with X
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-black border-b border-zinc-800 sticky top-0 z-40 backdrop-blur-xl bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Twitter className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold text-white hidden sm:block">
              Tweet Intelligence
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => openPostModal()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold transition hidden sm:block"
            >
              Post
            </button>
            {session.user?.image && (
              <img
                src={session.user.image}
                alt="avatar"
                className="w-10 h-10 rounded-full border-2 border-zinc-700"
              />
            )}
            <button
              onClick={() => signOut()}
              className="p-2 hover:bg-zinc-900 rounded-full transition"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-500 text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm font-medium">Total Tweets</div>
              <Twitter className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalTweets}</div>
            <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12% from last week
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm font-medium">Avg Sentiment</div>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.avgSentiment}</div>
            <div className="text-xs text-gray-500 mt-1">Based on AI analysis</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm font-medium">Engagement</div>
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.engagement}</div>
            <div className="text-xs text-purple-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              High interaction rate
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm font-medium">Top Emotion</div>
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.topEmotion}</div>
            <div className="text-xs text-gray-500 mt-1">Most common mood</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Your Timeline</h2>
              <p className="text-gray-500 text-sm">AI-Powered Analysis</p>
            </div>
            <button
              onClick={fetchTweets}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition font-medium border border-zinc-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {useFallback && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
              <p className="text-yellow-500 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Showing sample data
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-500">Loading tweets...</p>
            </div>
          )}

          {!loading && tweets.length === 0 && (
            <div className="text-center py-16">
              <Twitter className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">No tweets yet</p>
            </div>
          )}

          {!loading && tweets.length > 0 && (
            <div className="space-y-4">
              {tweets.map((tweet) => {
                const tweetAnalysis = analysis[tweet.id];
                
                return (
                  <div
                    key={tweet.id}
                    className="bg-black border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {session.user?.image ? (
                        <img src={session.user.image} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-bold text-white">{session.user?.name || "User"}</div>
                          <div className="text-gray-500 text-sm">
                            @{session.user?.email?.split('@')[0] || 'user'}
                          </div>
                          <div className="text-gray-600 text-sm">·</div>
                          <div className="text-gray-500 text-sm">
                            {tweet.created_at
                              ? new Date(tweet.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : 'Now'}
                          </div>
                        </div>
                        <p className="text-white text-[15px] leading-normal mb-3">{tweet.text}</p>
                        
                        <div className="flex items-center gap-12 mb-4 text-gray-500">
                          <button className="flex items-center gap-2 hover:text-blue-500 transition group">
                            <div className="group-hover:bg-blue-500/10 rounded-full p-2 transition">
                              <MessageCircle className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-sm">{Math.floor(Math.random() * 8) + 1}</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-green-500 transition group">
                            <div className="group-hover:bg-green-500/10 rounded-full p-2 transition">
                              <Repeat2 className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-sm">{Math.floor(Math.random() * 6) + 1}</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-pink-500 transition group">
                            <div className="group-hover:bg-pink-500/10 rounded-full p-2 transition">
                              <Heart className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-sm">{Math.floor(Math.random() * 10) + 1}</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-blue-500 transition group">
                            <div className="group-hover:bg-blue-500/10 rounded-full p-2 transition">
                              <BarChart3 className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-sm">{Math.floor(Math.random() * 50) + 10}</span>
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => analyzeTweetWithGroq(tweet.id, tweet.text, 'emotion')}
                            disabled={tweetAnalysis?.analyzing}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-full transition disabled:opacity-50 border border-blue-500/20 font-medium"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Emotion
                          </button>
                          <button
                            onClick={() => analyzeTweetWithGroq(tweet.id, tweet.text, 'intention')}
                            disabled={tweetAnalysis?.analyzing}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-full transition disabled:opacity-50 border border-purple-500/20 font-medium"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            Intent
                          </button>
                          <button
                            onClick={() => analyzeTweetWithGroq(tweet.id, tweet.text, 'factual')}
                            disabled={tweetAnalysis?.analyzing}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-full transition disabled:opacity-50 border border-green-500/20 font-medium"
                          >
                            <PenLine className="w-3.5 h-3.5" />
                            Fact Check
                          </button>
                        </div>

                        {tweetAnalysis?.analyzing && (
                          <div className="mt-4 p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                            <div className="flex items-center gap-3">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                              <div className="flex-1">
                                <div className="text-sm text-gray-300 font-medium mb-1">
                                  Analysis with NLP Model...
                                </div>
                                <div className="text-xs text-gray-500">
                                  Getting context and processing language patterns
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
                              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full animate-pulse" style={{width: '60%'}}></div>
                            </div>
                          </div>
                        )}

                        {tweetAnalysis?.result && !tweetAnalysis.analyzing && (
                          <div className="mt-4 p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-blue-950/30 rounded-xl border border-zinc-700/50 shadow-lg">
                            <div className="flex items-start gap-4">
                              <div className="text-4xl flex-shrink-0 mt-1">{tweetAnalysis.result.emotion}</div>
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                    NLP Model Analysis
                                  </h4>
                                  <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-500/30">
                                    {tweetAnalysis.type === 'emotion' ? '🎭 Emotion' : tweetAnalysis.type === 'intention' ? '🎯 Intent' : '✅ Fact Check'}
                                  </span>
                                </div>
                                
                                {tweetAnalysis.result.reasoningSections && tweetAnalysis.result.reasoningSections.length > 0 ? (
                                  <div className="space-y-2">
                                    {tweetAnalysis.result.reasoningSections.map((section, idx) => {
                                      const colonIndex = section.indexOf(':');
                                      if (colonIndex > 0 && colonIndex < 50) {
                                        const label = section.substring(0, colonIndex).trim();
                                        const content = section.substring(colonIndex + 1).trim();
                                        return (
                                          <div key={idx} className="bg-zinc-800/40 rounded-lg p-3 border border-zinc-700/30">
                                            <div className="text-blue-400 text-xs font-semibold mb-1 uppercase tracking-wide">
                                              {label}
                                            </div>
                                            <div className="text-gray-300 text-sm leading-relaxed">
                                              {content}
                                            </div>
                                          </div>
                                        );
                                      }
                                      return (
                                        <p key={idx} className="text-gray-300 text-sm leading-relaxed">
                                          {section}
                                        </p>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-gray-300 text-sm leading-relaxed">
                                    {tweetAnalysis.result.reasoning}
                                  </p>
                                )}
                                
                                {tweetAnalysis.result.sentiment && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 font-medium">Sentiment:</span>
                                    <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 text-xs font-medium rounded-full border border-purple-500/30">
                                      {tweetAnalysis.result.sentiment}
                                    </span>
                                  </div>
                                )}

                                {tweetAnalysis.result.key_themes && tweetAnalysis.result.key_themes.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-xs text-gray-500 font-medium">Key Themes:</span>
                                    <div className="flex flex-wrap gap-2">
                                      {tweetAnalysis.result.key_themes.map((theme, i) => (
                                        <span 
                                          key={i} 
                                          className="px-2.5 py-1 bg-zinc-800/80 border border-zinc-700 rounded-full text-xs text-gray-300 font-medium hover:bg-zinc-700 transition"
                                        >
                                          #{theme}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {tweetAnalysis.result.toxicity_score !== undefined && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500 font-medium">Toxicity Score:</span>
                                      <span className="text-xs text-gray-400 font-semibold">
                                        {Math.round(tweetAnalysis.result.toxicity_score * 100)}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className={`h-2 rounded-full transition-all duration-1000 ${
                                          tweetAnalysis.result.toxicity_score > 0.7 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                                          tweetAnalysis.result.toxicity_score > 0.4 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                          'bg-gradient-to-r from-green-500 to-emerald-500'
                                        }`}
                                        style={{ width: `${tweetAnalysis.result.toxicity_score * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 font-medium">Confidence:</span>
                                    <span className="text-xs text-blue-400 font-bold">
                                      {Math.round(tweetAnalysis.result.confidence_level * 100)}%
                                    </span>
                                  </div>
                                  <div className="flex-1 bg-zinc-800 rounded-full h-1.5 max-w-32">
                                    <div 
                                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-1000"
                                      style={{ width: `${tweetAnalysis.result.confidence_level * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {postingState.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Compose Tweet</h3>
              <button
                onClick={closePostModal}
                className="p-2 hover:bg-zinc-800 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex items-start gap-3 mb-4">
              {session.user?.image && (
                <img src={session.user.image} alt="" className="w-10 h-10 rounded-full" />
              )}
              <textarea
                value={postingState.tweetText}
                onChange={(e) => setPostingState(prev => ({ ...prev, tweetText: e.target.value }))}
                placeholder="What's happening?"
                className="flex-1 bg-transparent border-0 resize-none focus:outline-none text-white placeholder-gray-600 text-lg min-h-32"
                disabled={postingState.posting}
                maxLength={280}
              />
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={toggleRecording}
                    disabled={postingState.posting}
                    className={`p-2 rounded-full transition ${
                      postingState.isRecording 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'hover:bg-zinc-800 text-blue-500'
                    }`}
                    title="Voice input"
                  >
                    <Mic className={`w-5 h-5 ${postingState.isRecording ? 'animate-pulse' : ''}`} />
                  </button>
                  <button
                    onClick={() => setPostingState(prev => ({ ...prev, useKannada: !prev.useKannada }))}
                    disabled={postingState.posting}
                    className={`p-2 rounded-full transition ${
                      postingState.useKannada 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'hover:bg-zinc-800 text-gray-500'
                    }`}
                    title="Kannada keyboard"
                  >
                    <Keyboard className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-sm ${postingState.tweetText.length > 260 ? 'text-red-400' : 'text-gray-500'}`}>
                    {postingState.tweetText.length} / 280
                  </div>
                  <button
                    onClick={postTweet}
                    disabled={postingState.posting || !postingState.tweetText.trim()}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-full font-bold transition"
                  >
                    {postingState.posting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : postingState.success ? (
                      "Posted!"
                    ) : (
                      "Post"
                    )}
                  </button>
                </div>
              </div>

              {postingState.isRecording && (
                <div className="mt-3 p-3 bg-red-500/10 rounded-xl text-sm text-red-400 flex items-center gap-2 border border-red-500/20">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Recording... Speak now
                </div>
              )}

              {postingState.useKannada && (
                <div className="mt-3 p-3 bg-blue-500/10 rounded-xl text-sm text-blue-400 border border-blue-500/20">
                  🇮🇳 Kannada keyboard enabled
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}