"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Twitter, LogOut, RefreshCw, Loader2 } from "lucide-react";

type Tweet = {
  id: string;
  text: string;
  created_at?: string;
};

export default function TweetsDashboard() {
  const { data: session, status } = useSession();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Your Tweets</h2>
            <button
              onClick={fetchTweets}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
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
              {tweets.map((tweet) => (
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
                  <p className="text-gray-800 leading-relaxed">{tweet.text}</p>
                  
                  {/* Placeholder for emotion detection - to be implemented */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400 italic">
                      Emotion detection coming soon...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          Showing {tweets.length} tweet{tweets.length !== 1 ? 's' : ''}
        </div>
      </main>
    </div>
  );
}