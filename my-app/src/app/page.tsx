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
import { Twitter, LogOut, RefreshCw, Loader2, Sparkles, AlertCircle, PenLine, Send, Mic, Keyboard, X } from "lucide-react";

type Tweet = {
  id: string;
  text: string;
  created_at?: string;
};

type AnalysisResult = {
  emotion: string;
  reasoning: string;
  confidence_level: number;
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
};

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
    useKannada: false
  });

  const fetchTweets = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);
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
      setTweets(data?.data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const analyzeTweet = async (tweetId: string, text: string, type: 'emotion' | 'intention' | 'factual') => {
    setAnalysis(prev => ({
      ...prev,
      [tweetId]: { analyzing: true, result: null, type }
    }));

    try {
      const res = await fetch("https://is-your-tweet-sweet-76xs.vercel.app/analyze_tweet", {
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

      if (!res.ok) throw new Error("Analysis failed");

      const result = await res.json();
      
      setTimeout(() => {
        setAnalysis(prev => ({
          ...prev,
          [tweetId]: { analyzing: false, result, type }
        }));
      }, 2000);
    } catch (err) {
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
      useKannada: false
    });
  };

  const closePostModal = () => {
    setPostingState({
      isOpen: false,
      tweetText: "",
      posting: false,
      success: false,
      useKannada: false
    });
  };

  const postTweet = async () => {
    setPostingState(prev => ({ ...prev, posting: true }));
    
    // Simulate posting (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setPostingState(prev => ({ ...prev, posting: false, success: true }));
    
    setTimeout(() => {
      closePostModal();
      fetchTweets();
    }, 1500);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Twitter className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Tweet Emotion Detector
          </h1>
          <p className="text-gray-600 mb-8">
            Analyze the emotions in your tweets with AI-powered detection
          </p>
          <button
            onClick={() => signIn("twitter")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            <Twitter className="w-5 h-5" />
            Sign in with X (Twitter)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
              <Twitter className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">
              Tweet Emotion Detector
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {session.user?.image && (
              <img
                src={session.user.image}
                alt="avatar"
                className="w-10 h-10 rounded-full border-2 border-blue-200"
              />
            )}
            <div className="hidden sm:block text-right">
              <div className="font-semibold text-gray-800">{session.user?.name}</div>
              <div className="text-sm text-gray-500">
                {session.user?.email || `ID: ${session.user?.twitterId}`}
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Your Tweets</h2>
            <div className="flex gap-2">
              <button
                onClick={() => openPostModal()}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200"
              >
                <Send className="w-4 h-4" />
                Post Tweet
              </button>
              <button
                onClick={fetchTweets}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your tweets...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-semibold">Error loading tweets</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && tweets.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Twitter className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No tweets found</p>
              <p className="text-gray-500 text-sm mt-2">
                Tweet something and refresh to see it here!
              </p>
            </div>
          )}

          {!loading && !error && tweets.length > 0 && (
            <div className="space-y-4">
              {tweets.map((tweet) => {
                const tweetAnalysis = analysis[tweet.id];
                
                return (
                  <div
                    key={tweet.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-xs text-gray-500">
                        {tweet.created_at
                          ? new Date(tweet.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Unknown date'}
                      </div>
                    </div>
                    <p className="text-gray-800 leading-relaxed mb-4">{tweet.text}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        onClick={() => analyzeTweet(tweet.id, tweet.text, 'emotion')}
                        disabled={tweetAnalysis?.analyzing}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition duration-200 disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        Analyze Emotion
                      </button>
                      <button
                        onClick={() => analyzeTweet(tweet.id, tweet.text, 'intention')}
                        disabled={tweetAnalysis?.analyzing}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition duration-200 disabled:opacity-50"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Check Intention
                      </button>
                      <button
                        onClick={() => analyzeTweet(tweet.id, tweet.text, 'factual')}
                        disabled={tweetAnalysis?.analyzing}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition duration-200 disabled:opacity-50"
                      >
                        <PenLine className="w-4 h-4" />
                        Fact Check
                      </button>
                      <button
                        onClick={() => openPostModal(tweet.text)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition duration-200"
                      >
                        <Send className="w-4 h-4" />
                        Modify & Post
                      </button>
                    </div>

                    {tweetAnalysis?.analyzing && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 mb-1">
                              {tweetAnalysis.type === 'emotion' && '🎭 Analyzing emotions...'}
                              {tweetAnalysis.type === 'intention' && '🎯 Checking intentions...'}
                              {tweetAnalysis.type === 'factual' && '🔍 Fact-checking...'}
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="flex gap-1 items-center">
                                <span className="animate-pulse">Gathering context</span>
                                <span className="animate-pulse delay-100">.</span>
                                <span className="animate-pulse delay-200">.</span>
                                <span className="animate-pulse delay-300">.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {tweetAnalysis?.result && !tweetAnalysis.analyzing && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 animate-fade-in">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{tweetAnalysis.result.emotion}</div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 mb-2">
                              Analysis Result
                            </div>
                            <div className="text-sm text-gray-700 mb-2">
                              {tweetAnalysis.result.reasoning}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-gray-600">
                                Confidence: {Math.round(tweetAnalysis.result.confidence_level * 100)}%
                              </div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${tweetAnalysis.result.confidence_level * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          Showing {tweets.length} tweet{tweets.length !== 1 ? 's' : ''}
        </div>
      </main>

      {postingState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">Post a Tweet</h3>
              <button
                onClick={closePostModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={postingState.tweetText}
              onChange={(e) => setPostingState(prev => ({ ...prev, tweetText: e.target.value }))}
              placeholder="What's happening?"
              className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              disabled={postingState.posting}
            />

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Voice input"
                >
                  <Mic className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setPostingState(prev => ({ ...prev, useKannada: !prev.useKannada }))}
                  className={`p-2 rounded-lg transition ${postingState.useKannada ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                  title="Kannada keyboard"
                >
                  <Keyboard className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <button
                onClick={postTweet}
                disabled={postingState.posting || !postingState.tweetText.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition duration-200"
              >
                {postingState.posting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Posting...
                  </>
                ) : postingState.success ? (
                  <>
                    <span>✓</span>
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

            {postingState.useKannada && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                Kannada keyboard enabled. You can type in Kannada.
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
}