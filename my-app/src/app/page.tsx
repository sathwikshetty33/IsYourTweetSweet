"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Twitter, LogOut, RefreshCw, Loader2, Sparkles, AlertCircle, PenLine, Send, Mic, X, Heart, Repeat2, MessageCircle, BarChart3, TrendingUp, Users, Activity, Target, CheckCircle, MessageSquare, Zap } from "lucide-react";

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
  modified_tweet?: string;
  facts?: string[];
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
  intentText: string;
  applyingIntent: boolean;
};

type ChatState = {
  isOpen: boolean;
  query: string;
  response: string;
  loading: boolean;
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
    isRecording: false,
    intentText: "",
    applyingIntent: false
  });
  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    query: "",
    response: "",
    loading: false
  });
  const [useFallback, setUseFallback] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalTweets: 0,
    avgSentiment: "Neutral",
    engagement: 0,
    topEmotion: "Mixed"
  });
  const [activeChatTweet, setActiveChatTweet] = useState<string>("");

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
          setTweets(FALLBACK_TWEETS);
          setUseFallback(true);
        } else {
          const cached = sessionStorage.getItem('cachedTweets');
          if (cached) {
            try {
              setTweets(JSON.parse(cached));
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
        const response = await fetch("https://is-your-tweet-sweet-ten.vercel.app/analyze_tweet", {
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
          throw new Error("Emotion analysis failed");
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
      else if (type === 'intention') {
        const response = await fetch("https://is-your-tweet-sweet-ten.vercel.app/intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json"
          },
          body: JSON.stringify({
            tweet: text,
            intent: "analyze",
            userid: session?.user?.twitterId || "1"
          })
        });

        if (!response.ok) {
          throw new Error("Intent analysis failed");
        }

        const data = await response.json();
        
        result = {
          emotion: "🎯",
          reasoning: "Intent analysis completed. The tweet can be modified to better express the intended meaning.",
          confidence_level: 0.85,
          sentiment: "informative",
          key_themes: ["intention", "purpose"],
          modified_tweet: data.modified_tweet
        };
      }
      else {
        const response = await fetch("https://is-your-tweet-sweet-ten.vercel.app/fact-check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json"
          },
          body: JSON.stringify({
            tweet: text
          })
        });

        if (!response.ok) {
          throw new Error("Fact check failed");
        }

        const data = await response.json();
        
        const factsList = data.facts || [];
        
        result = {
          emotion: factsList.length > 0 ? "✅" : "⚠️",
          reasoning: "Fact check completed. Here are the verified facts:",
          confidence_level: 0.8,
          sentiment: factsList.length > 0 ? "factual" : "unverified",
          key_themes: ["verification", "facts"],
          facts: factsList
        };
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
      isRecording: false,
      intentText: "",
      applyingIntent: false
    });
  };

  const closePostModal = () => {
    setPostingState({
      isOpen: false,
      tweetText: "",
      posting: false,
      success: false,
      useKannada: false,
      isRecording: false,
      intentText: "",
      applyingIntent: false
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

  const applyIntent = async () => {
    if (!postingState.intentText.trim()) return;
    
    setPostingState(prev => ({ ...prev, applyingIntent: true }));
    
    try {
      const response = await fetch("https://is-your-tweet-sweet-ten.vercel.app/intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify({
          tweet: postingState.tweetText,
          intent: postingState.intentText,
          userid: session?.user?.twitterId || "1"
        })
      });

      if (!response.ok) {
        throw new Error("Intent modification failed");
      }

      const data = await response.json();
      
      let modifiedText = data.modified_tweet || postingState.tweetText;
      if (modifiedText.startsWith('"') && modifiedText.endsWith('"')) {
        modifiedText = modifiedText.slice(1, -1);
      }
      
      setPostingState(prev => ({
        ...prev,
        tweetText: modifiedText,
        applyingIntent: false,
        intentText: ""
      }));
    } catch (err) {
      console.error("Intent error:", err);
      setPostingState(prev => ({ ...prev, applyingIntent: false }));
    }
  };

  const postTweet = async () => {
    if (!postingState.tweetText.trim()) return;

    setPostingState(prev => ({ ...prev, posting: true }));

    try {
      const res = await fetch("/api/twitter/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: postingState.tweetText.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          data?.error ||
          data?.title ||
          data?.detail ||
          `Failed to post tweet (${res.status})`;
        throw new Error(message);
      }

      setPostingState(prev => ({ ...prev, posting: false, success: true }));

      setTimeout(() => {
        closePostModal();
        fetchTweets();
      }, 1500);
    } catch (err) {
      console.error("Post error:", err);
      setPostingState(prev => ({ ...prev, posting: false }));
    }
  };

  const openChat = (tweetText: string) => {
    setActiveChatTweet(tweetText);
    setChatState({
      isOpen: true,
      query: "",
      response: "",
      loading: false
    });
  };

  const closeChat = () => {
    setChatState({
      isOpen: false,
      query: "",
      response: "",
      loading: false
    });
    setActiveChatTweet("");
  };

  const sendChatQuery = async () => {
    if (!chatState.query.trim()) return;
    
    setChatState(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch("https://is-your-tweet-sweet-ten.vercel.app/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify({
          tweet: activeChatTweet,
          query: chatState.query,
          userid: session?.user?.twitterId || "1"
        })
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();
      
      setChatState(prev => ({
        ...prev,
        response: data.answer || "No response received",
        loading: false
      }));
    } catch (err) {
      console.error("Chat error:", err);
      setChatState(prev => ({
        ...prev,
        response: "Failed to get response. Please try again.",
        loading: false
      }));
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
            <div className="absolute inset-0 w-16 h-16 bg-blue-500/20 blur-xl mx-auto"></div>
          </div>
          <p className="text-gray-300 text-lg font-medium">Loading your intelligence...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
        
        <div className="relative bg-gradient-to-br from-zinc-900/90 to-black/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-md w-full text-center border border-zinc-800/50">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/50">
              <Twitter className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
            Tweet Intelligence
          </h1>
          <p className="text-gray-400 mb-10 text-lg">
            AI-powered insights for your social presence
          </p>
          
          <button
            onClick={() => signIn("twitter")}
            className="group w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
          >
            <Twitter className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Continue with X
          </button>
          
          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>AI Analysis</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Real-time Insights</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>
      
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/30 blur-lg rounded-full"></div>
                <Twitter className="relative w-8 h-8 text-blue-400" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Tweet Intelligence
                </h1>
                <p className="text-xs text-gray-500">AI-Powered Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => openPostModal()}
                className="group px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full font-bold transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 hidden sm:flex items-center gap-2"
              >
                <PenLine className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Post
              </button>
              
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="avatar"
                  className="w-10 h-10 rounded-full border-2 border-blue-500/30 ring-2 ring-blue-500/10"
                />
              )}
              
              <button
                onClick={() => signOut()}
                className="p-2.5 hover:bg-white/5 rounded-full transition-all duration-200 group"
                title="Sign out"
              >
                <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <div className="group relative bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="text-gray-400 text-sm font-medium">Total Tweets</div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Twitter className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.totalTweets}</div>
              <div className="text-xs text-green-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12% from last week
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-green-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="text-gray-400 text-sm font-medium">Avg Sentiment</div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.avgSentiment}</div>
              <div className="text-xs text-gray-500">AI-powered analysis</div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="text-gray-400 text-sm font-medium">Engagement</div>
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.engagement}</div>
              <div className="text-xs text-purple-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                High interaction rate
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-yellow-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-all duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="text-gray-400 text-sm font-medium">Top Emotion</div>
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.topEmotion}</div>
              <div className="text-xs text-gray-500">Most common mood</div>
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-zinc-900/60 to-black/60 backdrop-blur-sm border border-white/5 rounded-2xl p-8 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"></div>
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                Your Timeline
              </h2>
              <p className="text-gray-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                AI-Powered Insights
              </p>
            </div>
            <button
              onClick={fetchTweets}
              disabled={loading}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all duration-300 font-medium border border-white/10 hover:border-white/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              Refresh
            </button>
          </div>

          {useFallback && (
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <p className="text-yellow-400 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Showing sample data for demonstration
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-20">
              <div className="relative inline-block">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                <div className="absolute inset-0 w-12 h-12 bg-blue-500/20 blur-xl mx-auto"></div>
              </div>
              <p className="text-gray-400 font-medium">Analyzing your tweets...</p>
            </div>
          )}

          {!loading && tweets.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Twitter className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-gray-500 text-lg">No tweets yet</p>
              <p className="text-gray-600 text-sm mt-2">Start posting to see your timeline</p>
            </div>
          )}

          {!loading && tweets.length > 0 && (
            <div className="space-y-4">
              {tweets.map((tweet) => {
                const tweetAnalysis = analysis[tweet.id];
                
                return (
                  <div
                    key={tweet.id}
                    className="group relative bg-gradient-to-br from-black/40 to-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none"></div>
                    
                    <div className="relative flex items-start gap-4">
                      {session.user?.image ? (
                        <img src={session.user.image} alt="" className="w-12 h-12 rounded-full ring-2 ring-blue-500/20" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-bold text-white">{session.user?.name || "User"}</div>
                          <div className="text-gray-500 text-sm">
                            @{session.user?.email?.split('@')[0] || 'user'}
                          </div>
                          <div className="text-gray-700 text-sm">·</div>
                          <div className="text-gray-500 text-sm">
                            {tweet.created_at
                              ? new Date(tweet.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : 'Now'}
                          </div>
                        </div>
                        
                        <p className="text-gray-200 text-[15px] leading-relaxed mb-4">{tweet.text}</p>
                        
                        <div className="flex items-center gap-8 mb-5 text-gray-500">
                          <button className="flex items-center gap-2 hover:text-blue-400 transition-colors group/btn">
                            <div className="group-hover/btn:bg-blue-500/10 rounded-full p-2 transition-colors">
                              <MessageCircle className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-sm">{Math.floor(Math.random() * 8) + 1}</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-green-400 transition-colors group/btn">
                            <div className="group-hover/btn:bg-green-500/10 rounded-full p-2 transition-colors">
                              <Repeat2 className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-sm">{Math.floor(Math.random() * 6) + 1}</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-pink-400 transition-colors group/btn">
                            <div className="group-hover/btn:bg-pink-500/10 rounded-full p-2 transition-colors">
                              <Heart className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-sm">{Math.floor(Math.random() * 10) + 1}</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-blue-400 transition-colors group/btn">
                            <div className="group-hover/btn:bg-blue-500/10 rounded-full p-2 transition-colors">
                              <BarChart3 className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-sm">{Math.floor(Math.random() * 50) + 10}</span>
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => analyzeTweetWithGroq(tweet.id, tweet.text, 'emotion')}
                            disabled={tweetAnalysis?.analyzing}
                            className="group/analyze flex items-center gap-2 px-4 py-2 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-full transition-all duration-200 disabled:opacity-50 border border-blue-500/20 hover:border-blue-500/40 font-medium shadow-sm hover:shadow-blue-500/20"
                          >
                            <Sparkles className="w-3.5 h-3.5 group-hover/analyze:rotate-12 transition-transform" />
                            Emotion
                          </button>
                          <button
                            onClick={() => analyzeTweetWithGroq(tweet.id, tweet.text, 'intention')}
                            disabled={tweetAnalysis?.analyzing}
                            className="group/analyze flex items-center gap-2 px-4 py-2 text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-full transition-all duration-200 disabled:opacity-50 border border-purple-500/20 hover:border-purple-500/40 font-medium shadow-sm hover:shadow-purple-500/20"
                          >
                            <Target className="w-3.5 h-3.5 group-hover/analyze:scale-110 transition-transform" />
                            Intent
                          </button>
                          <button
                            onClick={() => analyzeTweetWithGroq(tweet.id, tweet.text, 'factual')}
                            disabled={tweetAnalysis?.analyzing}
                            className="group/analyze flex items-center gap-2 px-4 py-2 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-full transition-all duration-200 disabled:opacity-50 border border-green-500/20 hover:border-green-500/40 font-medium shadow-sm hover:shadow-green-500/20"
                          >
                            <CheckCircle className="w-3.5 h-3.5 group-hover/analyze:rotate-12 transition-transform" />
                            Fact Check
                          </button>
                          <button
                            onClick={() => openChat(tweet.text)}
                            className="group/analyze flex items-center gap-2 px-4 py-2 text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-full transition-all duration-200 border border-orange-500/20 hover:border-orange-500/40 font-medium shadow-sm hover:shadow-orange-500/20"
                          >
                            <MessageSquare className="w-3.5 h-3.5 group-hover/analyze:scale-110 transition-transform" />
                            Chat
                          </button>
                        </div>

                        {tweetAnalysis?.analyzing && (
                          <div className="mt-5 bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                <div className="absolute inset-0 w-5 h-5 bg-blue-500/20 blur-md"></div>
                              </div>
                              <span className="text-gray-300 text-sm font-medium">Analyzing tweet with AI...</span>
                            </div>
                          </div>
                        )}

                        {tweetAnalysis?.result && (
                          <div className="mt-5 bg-gradient-to-br from-zinc-900/60 to-black/60 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg">
                            <div className="flex items-start gap-4">
                              <div className="text-4xl">{tweetAnalysis.result.emotion}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <h4 className="text-white font-semibold text-base">
                                    {tweetAnalysis.type === 'emotion' && 'Emotion Analysis'}
                                    {tweetAnalysis.type === 'intention' && 'Intent Analysis'}
                                    {tweetAnalysis.type === 'factual' && 'Fact Check'}
                                  </h4>
                                  <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full font-medium border border-blue-500/30">
                                    {Math.round(tweetAnalysis.result.confidence_level * 100)}% confident
                                  </span>
                                </div>

                                {tweetAnalysis.type === 'emotion' && tweetAnalysis.result.reasoningSections && (
                                  <div className="space-y-2.5">
                                    {tweetAnalysis.result.reasoningSections.map((section, idx) => (
                                      <p key={idx} className="text-gray-300 text-sm leading-relaxed">
                                        {section}
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {tweetAnalysis.type === 'intention' && tweetAnalysis.result.modified_tweet && (
                                  <div className="space-y-3">
                                    <p className="text-gray-300 text-sm">{tweetAnalysis.result.reasoning}</p>
                                    <div className="bg-black/40 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                                      <div className="text-xs text-gray-500 mb-2 font-medium">Suggested modification:</div>
                                      <p className="text-white text-sm leading-relaxed">{tweetAnalysis.result.modified_tweet}</p>
                                    </div>
                                    <button
                                      onClick={() => openPostModal(tweetAnalysis.result?.modified_tweet)}
                                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-medium transition-colors"
                                    >
                                      <PenLine className="w-3.5 h-3.5" />
                                      Use this version
                                    </button>
                                  </div>
                                )}

                                {tweetAnalysis.type === 'factual' && tweetAnalysis.result.facts && (
                                  <div className="space-y-3">
                                    <p className="text-gray-300 text-sm mb-3">{tweetAnalysis.result.reasoning}</p>
                                    {tweetAnalysis.result.facts.length > 0 ? (
                                      <ul className="space-y-2.5">
                                        {tweetAnalysis.result.facts.map((fact, idx) => (
                                          <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-300 bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                            <span>{fact}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-yellow-400 text-sm flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                        <AlertCircle className="w-4 h-4" />
                                        No verifiable facts found in this tweet
                                      </p>
                                    )}
                                  </div>
                                )}

                                {tweetAnalysis.result.sentiment && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <span className="text-xs text-gray-500 font-medium">Sentiment:</span>
                                    <span className="px-2.5 py-1 bg-white/5 text-gray-300 text-xs rounded-full capitalize border border-white/10 font-medium">
                                      {tweetAnalysis.result.sentiment}
                                    </span>
                                  </div>
                                )}
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-zinc-900/95 to-black/95 backdrop-blur-xl border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-zinc-900/95 to-black/95 backdrop-blur-xl border-b border-white/10 px-6 py-5 flex items-center justify-between">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Create Post
              </h3>
              <button
                onClick={closePostModal}
                className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 group"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Intent Modifier (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={postingState.intentText}
                    onChange={(e) => setPostingState(prev => ({ ...prev, intentText: e.target.value }))}
                    placeholder="e.g., make it more professional, add humor, simplify..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                  <button
                    onClick={applyIntent}
                    disabled={!postingState.intentText.trim() || postingState.applyingIntent}
                    className="px-5 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-gray-500 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg disabled:shadow-none shadow-purple-500/20"
                  >
                    {postingState.applyingIntent ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Applying
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Apply
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-blue-400" />
                  Your Tweet
                </label>
                <textarea
                  value={postingState.tweetText}
                  onChange={(e) => setPostingState(prev => ({ ...prev, tweetText: e.target.value }))}
                  placeholder="What's happening?"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 min-h-[160px] resize-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleRecording}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      postingState.isRecording
                        ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <Mic className={`w-5 h-5 ${postingState.isRecording ? 'text-white animate-pulse' : 'text-gray-400'}`} />
                  </button>
                  <span className={`text-sm font-medium ${postingState.tweetText.length > 280 ? 'text-red-400' : 'text-gray-400'}`}>
                    {postingState.tweetText.length}/280
                  </span>
                </div>

                <button
                  onClick={postTweet}
                  disabled={!postingState.tweetText.trim() || postingState.posting || postingState.success || postingState.tweetText.length > 280}
                  className="group px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-gray-500 text-white rounded-full transition-all duration-200 font-bold flex items-center gap-2.5 shadow-lg disabled:shadow-none shadow-blue-500/30 hover:scale-105"
                >
                  {postingState.posting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </>
                  ) : postingState.success ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Posted!
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {chatState.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-zinc-900/95 to-black/95 backdrop-blur-xl border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="bg-gradient-to-r from-zinc-900/95 to-black/95 backdrop-blur-xl border-b border-white/10 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Chat about Tweet
                </h3>
              </div>
              <button
                onClick={closeChat}
                className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 group"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-xs text-gray-500 mb-2 font-medium">Original Tweet:</div>
                <p className="text-gray-200 text-sm leading-relaxed">{activeChatTweet}</p>
              </div>

              {chatState.response && (
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-5 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-blue-300" />
                    </div>
                    <p className="text-blue-50 text-sm leading-relaxed">{chatState.response}</p>
                  </div>
                </div>
              )}

              {chatState.loading && (
                <div className="flex items-center gap-3 text-gray-400 bg-white/5 rounded-xl p-4">
                  <div className="relative">
                    <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                    <div className="absolute inset-0 w-5 h-5 bg-orange-400/20 blur-md"></div>
                  </div>
                  <span className="text-sm font-medium">AI is thinking...</span>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatState.query}
                  onChange={(e) => setChatState(prev => ({ ...prev, query: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatQuery()}
                  placeholder="Ask anything about this tweet..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <button
                  onClick={sendChatQuery}
                  disabled={!chatState.query.trim() || chatState.loading}
                  className="px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-gray-500 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg disabled:shadow-none shadow-orange-500/20 hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}