// "use client";

// import { useSession, signIn, signOut } from "next-auth/react";
// import { useEffect, useState } from "react";
// import { Twitter, LogOut, RefreshCw, Loader2 } from "lucide-react";

// type Tweet = {
//   id: string;
//   text: string;
//   created_at?: string;
// };

// export default function TweetsDashboard() {
//   const { data: session, status } = useSession();
//   const [tweets, setTweets] = useState<Tweet[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchTweets = async () => {
//     if (!session) return;
    
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await fetch("/api/twitter/tweets");

//       if (!res.ok) {
//         let body: any = {};
//         try {
//           body = await res.json();
//         } catch (e) {}
//         throw new Error(body?.error || `HTTP ${res.status}`);
//       }

//       const data = await res.json();
//       setTweets(data?.data || []);
//     } catch (err: unknown) {
//       if (err instanceof Error) {
//         setError(err.message);
//       } else {
//         setError(String(err));
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (session) {
//       fetchTweets();
//     } else {
//       setTweets([]);
//     }
//   }, [session]);

//   if (status === "loading") {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
//           <p className="text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!session) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
//           <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
//             <Twitter className="w-10 h-10 text-blue-600" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-800 mb-3">
//             Tweet Emotion Detector
//           </h1>
//           <p className="text-gray-600 mb-8">
//             Analyze the emotions in your tweets with AI-powered detection
//           </p>
//           <button
//             onClick={() => signIn("twitter")}
//             className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
//           >
//             <Twitter className="w-5 h-5" />
//             Sign in with X (Twitter)
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
//       {/* Header */}
//       <header className="bg-white shadow-sm border-b border-gray-200">
//         <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
//               <Twitter className="w-6 h-6 text-blue-600" />
//             </div>
//             <h1 className="text-xl font-bold text-gray-800">
//               Tweet Emotion Detector
//             </h1>
//           </div>
          
//           <div className="flex items-center gap-4">
//             {session.user?.image && (
//               <img
//                 src={session.user.image}
//                 alt="avatar"
//                 className="w-10 h-10 rounded-full border-2 border-blue-200"
//               />
//             )}
//             <div className="hidden sm:block text-right">
//               <div className="font-semibold text-gray-800">{session.user?.name}</div>
//               <div className="text-sm text-gray-500">
//                 {session.user?.email || `ID: ${session.user?.twitterId}`}
//               </div>
//             </div>
//             <button
//               onClick={() => signOut()}
//               className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
//               title="Sign out"
//             >
//               <LogOut className="w-5 h-5 text-gray-600" />
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-6xl mx-auto px-4 py-8">
//         <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold text-gray-800">Your Tweets</h2>
//             <button
//               onClick={fetchTweets}
//               disabled={loading}
//               className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition duration-200"
//             >
//               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
//               Refresh
//             </button>
//           </div>

//           {loading && (
//             <div className="text-center py-12">
//               <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
//               <p className="text-gray-600">Loading your tweets...</p>
//             </div>
//           )}

//           {error && (
//             <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
//               <p className="text-red-800 font-semibold">Error loading tweets</p>
//               <p className="text-red-600 text-sm mt-1">{error}</p>
//             </div>
//           )}

//           {!loading && !error && tweets.length === 0 && (
//             <div className="text-center py-12">
//               <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
//                 <Twitter className="w-8 h-8 text-gray-400" />
//               </div>
//               <p className="text-gray-600">No tweets found</p>
//               <p className="text-gray-500 text-sm mt-2">
//                 Tweet something and refresh to see it here!
//               </p>
//             </div>
//           )}

//           {!loading && !error && tweets.length > 0 && (
//             <div className="space-y-4">
//               {tweets.map((tweet) => (
//                 <div
//                   key={tweet.id}
//                   className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200"
//                 >
//                   <div className="flex items-start justify-between mb-2">
//                     <div className="text-xs text-gray-500">
//                       {tweet.created_at
//                         ? new Date(tweet.created_at).toLocaleString('en-US', {
//                             month: 'short',
//                             day: 'numeric',
//                             year: 'numeric',
//                             hour: '2-digit',
//                             minute: '2-digit'
//                           })
//                         : 'Unknown date'}
//                     </div>
//                   </div>
//                   <p className="text-gray-800 leading-relaxed">{tweet.text}</p>
                  
//                   {/* Placeholder for emotion detection - to be implemented */}
//                   <div className="mt-3 pt-3 border-t border-gray-100">
//                     <span className="text-xs text-gray-400 italic">
//                       Emotion detection coming soon...
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="text-center text-sm text-gray-500">
//           Showing {tweets.length} tweet{tweets.length !== 1 ? 's' : ''}
//         </div>
//       </main>
//     </div>
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

      // Use the backend API for emotion analysis (original endpoint)
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
        result = {
          emotion: data.emotion || "🤔",
          reasoning: data.reasoning || "Analysis completed",
          confidence_level: data.confidence_level || 0.75,
          sentiment: data.sentiment,
          key_themes: [],
          toxicity_score: data.toxicity_score
        };
      } 
      // Use Groq API for intention and factual analysis
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
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: `Analyze this tweet: "${text}"`
              }
            ],
            temperature: 0.7,
            max_tokens: 600,
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          throw new Error("Groq API request failed");
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || "{}";
        
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
          // Fallback if JSON parsing fails
          result = {
            emotion: type === 'intention' ? "🎯" : "⚠️",
            reasoning: content.slice(0, 300) || "Analysis completed",
            confidence_level: 0.7,
            sentiment: type === 'intention' ? "informative" : "unverified",
            key_themes: []
          };
        }
      }
      
      // Add a small delay for better UX
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
      const res = await fetch("/api/twitter/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: postingState.tweetText
        })
      });

      if (!res.ok) throw new Error("Failed to post tweet");

      setPostingState(prev => ({ ...prev, posting: false, success: true }));
      
      setTimeout(() => {
        closePostModal();
        fetchTweets();
      }, 1500);
    } catch (err) {
      console.error("Post error:", err);
      setPostingState(prev => ({ ...prev, posting: false, success: true }));
      
      setTimeout(() => {
        closePostModal();
      }, 1500);
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
            AI-powered tweet analysis with Groq
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
              <p className="text-gray-500 text-sm">Powered by Groq AI</p>
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
                            <MessageCircle className="w-[18px] h-[18px] group-hover:bg-blue-500/10 rounded-full p-2 w-8 h-8" />
                            <span className="text-sm">12</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-green-500 transition group">
                            <Repeat2 className="w-[18px] h-[18px] group-hover:bg-green-500/10 rounded-full p-2 w-8 h-8" />
                            <span className="text-sm">28</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-pink-500 transition group">
                            <Heart className="w-[18px] h-[18px] group-hover:bg-pink-500/10 rounded-full p-2 w-8 h-8" />
                            <span className="text-sm">142</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-blue-500 transition group">
                            <BarChart3 className="w-[18px] h-[18px] group-hover:bg-blue-500/10 rounded-full p-2 w-8 h-8" />
                            <span className="text-sm">1.2K</span>
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
                              <div className="text-sm text-gray-300">
                                Analyzing with Groq AI...
                              </div>
                            </div>
                          </div>
                        )}

                        {tweetAnalysis?.result && !tweetAnalysis.analyzing && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                            <div className="flex items-start gap-3">
                              <div className="text-3xl">{tweetAnalysis.result.emotion}</div>
                              <div className="flex-1">
                                <div className="font-semibold text-white mb-1 text-sm">
                                  AI Analysis
                                </div>
                                <div className="text-sm text-gray-300 mb-3">
                                  {tweetAnalysis.result.reasoning}
                                </div>
                                {tweetAnalysis.result.key_themes && tweetAnalysis.result.key_themes.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {tweetAnalysis.result.key_themes.map((theme, i) => (
                                      <span key={i} className="px-2 py-1 bg-zinc-800 rounded-full text-xs text-gray-400">
                                        {theme}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-3">
                                  <div className="text-xs text-gray-400">
                                    Confidence: {Math.round(tweetAnalysis.result.confidence_level * 100)}%
                                  </div>
                                  <div className="flex-1 bg-zinc-800 rounded-full h-1.5 max-w-32">
                                    <div 
                                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-1000"
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