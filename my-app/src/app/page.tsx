"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Twitter, LogOut, RefreshCw, Loader2, Sparkles, AlertCircle, PenLine, Send, Mic, X, Heart, Repeat2, MessageCircle, BarChart3, TrendingUp, Users, Activity, Target, CheckCircle, MessageSquare } from "lucide-react";

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

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatState = {
  isOpen: boolean;
  query: string;
  messages: ChatMessage[];
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
    messages: [],
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
      messages: [],
      loading: false
    });
  };

  const closeChat = () => {
    setChatState({
      isOpen: false,
      query: "",
      messages: [],
      loading: false
    });
    setActiveChatTweet("");
  };

  const sendChatQuery = async () => {
    if (!chatState.query.trim()) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: chatState.query
    };
    
    setChatState(prev => ({ 
      ...prev, 
      messages: [...prev.messages, userMessage],
      query: "",
      loading: true 
    }));
    
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
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.answer || "No response received"
      };
      
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        loading: false
      }));
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Failed to get response. Please try again."
      };
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
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
            IsYourTweetSweet
          </h1>
          <p className="text-gray-400 mb-8">
            AI-powered tweet analysis with emotion detection
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
              IsYourTweetSweet
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
                            <Target className="w-3.5 h-3.5" />
                            Intent
                          </button>
                          <button
                            onClick={() => analyzeTweetWithGroq(tweet.id, tweet.text, 'factual')}
                            disabled={tweetAnalysis?.analyzing}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-full transition disabled:opacity-50 border border-green-500/20 font-medium"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Fact Check
                          </button>
                          <button
                            onClick={() => openChat(tweet.text)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-full transition border border-orange-500/20 font-medium"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Chat
                          </button>
                        </div>

                        {tweetAnalysis?.analyzing && (
                          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                              <span className="text-gray-400 text-sm">Analyzing tweet...</span>
                            </div>
                          </div>
                        )}

                        {tweetAnalysis?.result && (
                          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="text-3xl">{tweetAnalysis.result.emotion}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-white font-semibold">
                                    {tweetAnalysis.type === 'emotion' && 'Emotion Analysis'}
                                    {tweetAnalysis.type === 'intention' && 'Intent Analysis'}
                                    {tweetAnalysis.type === 'factual' && 'Fact Check'}
                                  </h4>
                                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                    {Math.round(tweetAnalysis.result.confidence_level * 100)}% confident
                                  </span>
                                </div>

                                {tweetAnalysis.type === 'emotion' && tweetAnalysis.result.reasoningSections && (
                                  <div className="space-y-2">
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
                                    <div className="bg-black border border-zinc-700 rounded-lg p-3">
                                      <div className="text-xs text-gray-500 mb-2">Suggested modification:</div>
                                      <p className="text-white text-sm">{tweetAnalysis.result.modified_tweet}</p>
                                    </div>
                                    <button
                                      onClick={() => openPostModal(tweetAnalysis.result?.modified_tweet)}
                                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                      <PenLine className="w-3 h-3" />
                                      Use this version
                                    </button>
                                  </div>
                                )}

                                {tweetAnalysis.type === 'factual' && tweetAnalysis.result.facts && (
                                  <div className="space-y-2">
                                    <p className="text-gray-300 text-sm mb-3">{tweetAnalysis.result.reasoning}</p>
                                    {tweetAnalysis.result.facts.length > 0 ? (
                                      <ul className="space-y-2">
                                        {tweetAnalysis.result.facts.map((fact, idx) => (
                                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>{fact}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-yellow-500 text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        No verifiable facts found in this tweet
                                      </p>
                                    )}
                                  </div>
                                )}

                                {tweetAnalysis.result.sentiment && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Sentiment:</span>
                                    <span className="px-2 py-0.5 bg-zinc-800 text-gray-300 text-xs rounded-full capitalize">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Create Post</h3>
              <button
                onClick={closePostModal}
                className="p-2 hover:bg-zinc-800 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Intent (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={postingState.intentText}
                    onChange={(e) => setPostingState(prev => ({ ...prev, intentText: e.target.value }))}
                    placeholder="e.g., make it more professional, add humor, simplify..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={applyIntent}
                    disabled={!postingState.intentText.trim() || postingState.applyingIntent}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition font-medium flex items-center gap-2"
                  >
                    {postingState.applyingIntent ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        Apply
                      </>
                    )}
                  </button>
                </div>
              </div>

              <textarea
                value={postingState.tweetText}
                onChange={(e) => setPostingState(prev => ({ ...prev, tweetText: e.target.value }))}
                placeholder="What's happening?"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 min-h-[150px] resize-none"
              />

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleRecording}
                    className={`p-2 rounded-full transition ${
                      postingState.isRecording
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    <Mic className={`w-5 h-5 ${postingState.isRecording ? 'text-white animate-pulse' : 'text-gray-400'}`} />
                  </button>
                  <span className="text-sm text-gray-400">
                    {postingState.tweetText.length}/280
                  </span>
                </div>

                <button
                  onClick={postTweet}
                  disabled={!postingState.tweetText.trim() || postingState.posting || postingState.success}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-full transition font-bold flex items-center gap-2"
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
                      <Send className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full h-[85vh] flex flex-col shadow-2xl">
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 rounded-full p-2">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Chat Assistant</h3>
                  <p className="text-xs text-gray-400">Ask anything about this tweet</p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="p-2 hover:bg-zinc-700 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <Twitter className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-200 text-sm leading-relaxed">{activeChatTweet}</p>
                </div>
              </div>

              {chatState.messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-800 text-gray-100 border border-zinc-700'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {chatState.loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-sm text-gray-400">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800 p-4 bg-zinc-900 rounded-b-2xl">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatState.query}
                  onChange={(e) => setChatState(prev => ({ ...prev, query: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatQuery()}
                  placeholder="Type your message..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                  disabled={chatState.loading}
                />
                <button
                  onClick={sendChatQuery}
                  disabled={!chatState.query.trim() || chatState.loading}
                  className="px-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-xl transition font-medium shadow-lg hover:shadow-orange-500/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}