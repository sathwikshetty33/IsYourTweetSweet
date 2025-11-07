from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from dotenv import load_dotenv
import sqlite3
import json
from fastapi import HTTPException

from decider_agent import decide_external_context, DeciderInput
from tavily import verify_topic_relevance
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow all origins (use specific domains in production)
    allow_credentials=True,
    allow_methods=["*"],          # Allow all HTTP methods
    allow_headers=["*"],          # Allow all headers
)

DB_PATH = "users.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            summary TEXT DEFAULT ''
        )
    """)
    conn.commit()
    conn.close()

def get_user_summary(username: str) -> str:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT summary FROM users WHERE username = ?", (username,))
    row = c.fetchone()
    if row:
        summary = row[0]
    else:
        c.execute("INSERT INTO users (username, summary) VALUES (?, ?)", (username, ""))
        conn.commit()
        summary = ""
    conn.close()
    return summary

def update_user_summary(username: str, new_summary: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE users SET summary = ? WHERE username = ?", (new_summary, username))
    conn.commit()
    conn.close()

# Initialize DB
init_db()


# ---------------- MODELS ----------------
class TweetInput(BaseModel):
    tweet: str
    userid: str

class EmotionOutput(BaseModel):
    emotion: str
    reasoning: str
    confidence_level: float

class EmotionAnalysis(BaseModel):
    emotion: str = Field(..., description="Emotion name with emoji")
    reasoning: str = Field(..., description="Detailed reasoning")
    confidence_level: float = Field(..., ge=0.0, le=1.0)

class IntentInput(BaseModel):
    tweet: str
    intent: str
    userid: str

class FactCheckInput(BaseModel):
    tweet: str

class FactCheckOutput(BaseModel):
    facts: list[str]


# ---------------- LLM SETUP ----------------
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)
output_parser = PydanticOutputParser(pydantic_object=EmotionAnalysis)
format_instructions = output_parser.get_format_instructions()


# ---------------- PROMPTS ----------------
sentiment_prompt = ChatPromptTemplate.from_template(
    """
    You are an objective sentiment analysis assistant.
    Analyze the given tweet and optional external context and return structured JSON as per schema.

    Tweet: "{tweet}"
    External Context: "{external_context}"
    {format_instructions}
    """
)

summary_update_prompt = ChatPromptTemplate.from_template(
    """
    You are a user memory update assistant.
    Update this behavioral summary based on the latest tweet.

    Existing Summary:
    {old_summary}

    New Tweet: {tweet}
    Emotion: {emotion}
    Reasoning: {reasoning}

    Return a short, cumulative summary (2–3 sentences).
    """
)

intent_prompt = ChatPromptTemplate.from_template(
    """
    You are a linguistic rewriting assistant.
    Modify the given tweet to match the user's intent while preserving its meaning.

    - Be concise and natural.
    - Keep the tweet length close to original.
    - Reflect user's personal tone using context.

    User Intent: {intent}
    User Summary: {summary}
    Original Tweet: "{tweet}"

    Return ONLY the rewritten tweet text.
    """
)

fact_check_prompt = ChatPromptTemplate.from_template(
    """
    You are a fact-checking assistant.
    Your task is to search for factual information relevant to the tweet and summarize it clearly.

    Tweet: "{tweet}"

    Provide 5 summarized factual points.
    """
)


# ---------------- MAIN ENDPOINT ----------------
@app.post("/analyze_tweet", response_model=EmotionOutput)
async def analyze_tweet(tweet_data: TweetInput):
    user_summary = get_user_summary(tweet_data.userid)

    decider_input = DeciderInput(tweet=tweet_data.tweet, user_context=user_summary)
    decider_output = decide_external_context(decider_input)

    external_context_summary = ""
    if decider_output.needsExternalContext and decider_output.topics:
        summaries = [verify_topic_relevance(t)["summarized_articles"] for t in decider_output.topics]
        external_context_summary = "\n\n".join(summaries)
    else:
        external_context_summary = "None"

    formatted_prompt = sentiment_prompt.format_prompt(
        tweet=tweet_data.tweet,
        external_context=external_context_summary,
        format_instructions=format_instructions
    )

    response = llm(formatted_prompt.to_messages())

    try:
        parsed_output: EmotionAnalysis = output_parser.parse(response.content)
    except Exception:
        parsed_output = EmotionAnalysis(
            emotion="neutral 😐",
            reasoning="Model failed to parse structured response.",
            confidence_level=0.65
        )

    update_prompt = summary_update_prompt.format_prompt(
        old_summary=user_summary,
        tweet=tweet_data.tweet,
        emotion=parsed_output.emotion,
        reasoning=parsed_output.reasoning
    )
    update_response = llm(update_prompt.to_messages())
    new_summary = update_response.content.strip()
    update_user_summary(tweet_data.userid, new_summary)

    return EmotionOutput(
        emotion=parsed_output.emotion,
        reasoning=parsed_output.reasoning,
        confidence_level=parsed_output.confidence_level
    )


# ---------------- NEW ENDPOINT 1: INTENT ----------------
@app.post("/intent")
async def modify_tweet(intent_data: IntentInput):
    user_summary = get_user_summary(intent_data.userid)
    prompt = intent_prompt.format_prompt(
        intent=intent_data.intent,
        summary=user_summary,
        tweet=intent_data.tweet
    )
    response = llm(prompt.to_messages())
    modified_tweet = response.content.strip()
    return {"modified_tweet": modified_tweet}


# ---------------- NEW ENDPOINT 2: FACT CHECK ----------------
@app.post("/fact-check", response_model=FactCheckOutput)
async def fact_check(data: FactCheckInput):
    print("[INFO] Fetching factual context for:", data.tweet)
    results = verify_topic_relevance(data.tweet)
    summarized_articles = results.get("summarized_articles", [])
    if isinstance(summarized_articles, str):
        summarized_articles = summarized_articles.split("\n")[:5]
    return FactCheckOutput(facts=summarized_articles)
class ChatInput(BaseModel):
    tweet: str
    query: str
    userid: str


class ChatResponse(BaseModel):
    answer: str


@app.post("/chat", response_model=ChatResponse)
async def chat_with_context(chat_data: ChatInput):
    """Chat endpoint that fetches user summary and answers query."""

    # --- Step 1: Fetch user summary from database ---
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT summary FROM users WHERE username = ?", (chat_data.userid,))
    row = cursor.fetchone()
    conn.close()
    user_summary = ""
    if row:
        user_summary = row[0] if row[0] else "No prior summary available."
    

    # --- Step 2: Build the prompt ---
    chat_prompt = ChatPromptTemplate.from_template(
        """
You are an intelligent emotional analysis and conversational assistant.
You have access to:
- The user's historical emotional summary
- The latest tweet they posted
- A user query asking about insights or interpretation.

Use all context carefully to provide a short, factual, and empathetic answer.

User Summary:
{user_summary}

Recent Tweet:
{tweet}

User Query:
{query}

Answer clearly and naturally:
"""
    )

    formatted_prompt = chat_prompt.format_prompt(
        user_summary=user_summary,
        tweet=chat_data.tweet,
        query=chat_data.query
    )

    # --- Step 3: Get response from Groq ---
    response = llm(formatted_prompt.to_messages())

    # --- Step 4: Return structured response ---
    return ChatResponse(answer=response.content.strip())