from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from dotenv import load_dotenv
import json
from fastapi.middleware.cors import CORSMiddleware

# Import external modules with error handling
try:
    from decider_agent import decide_external_context, DeciderInput
    from tavily import verify_topic_relevance
    HAS_EXTERNAL_TOOLS = True
except ImportError as e:
    print(f"[WARNING] External tools not available: {e}")
    HAS_EXTERNAL_TOOLS = False

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- IN-MEMORY STORAGE ----------------
# Note: This will reset on each serverless function cold start
# For production, use Redis, PostgreSQL, or Vercel KV
user_summaries = {}

def get_user_summary(username: str) -> str:
    """Retrieve user summary from in-memory storage."""
    return user_summaries.get(username, "")

def update_user_summary(username: str, new_summary: str):
    """Update user summary in in-memory storage."""
    user_summaries[username] = new_summary


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

class ChatInput(BaseModel):
    tweet: str
    query: str
    userid: str

class ChatResponse(BaseModel):
    answer: str


# ---------------- LLM SETUP ----------------
try:
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)
    output_parser = PydanticOutputParser(pydantic_object=EmotionAnalysis)
    format_instructions = output_parser.get_format_instructions()
except Exception as e:
    print(f"[ERROR] Failed to initialize LLM: {e}")
    raise


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
    try:
        user_summary = get_user_summary(tweet_data.userid)

        # Handle external context if tools are available
        external_context_summary = "None"
        if HAS_EXTERNAL_TOOLS:
            try:
                decider_input = DeciderInput(tweet=tweet_data.tweet, user_context=user_summary)
                decider_output = decide_external_context(decider_input)

                if decider_output.needsExternalContext and decider_output.topics:
                    summaries = [verify_topic_relevance(t)["summarized_articles"] for t in decider_output.topics]
                    external_context_summary = "\n\n".join(summaries)
            except Exception as e:
                print(f"[WARNING] External context fetch failed: {e}")

        formatted_prompt = sentiment_prompt.format_prompt(
            tweet=tweet_data.tweet,
            external_context=external_context_summary,
            format_instructions=format_instructions
        )

        response = llm.invoke(formatted_prompt.to_messages())

        try:
            parsed_output: EmotionAnalysis = output_parser.parse(response.content)
        except Exception as e:
            print(f"[WARNING] Parse error: {e}")
            parsed_output = EmotionAnalysis(
                emotion="neutral 😐",
                reasoning="Model failed to parse structured response.",
                confidence_level=0.65
            )

        # Update user summary
        update_prompt = summary_update_prompt.format_prompt(
            old_summary=user_summary,
            tweet=tweet_data.tweet,
            emotion=parsed_output.emotion,
            reasoning=parsed_output.reasoning
        )
        update_response = llm.invoke(update_prompt.to_messages())
        new_summary = update_response.content.strip()
        update_user_summary(tweet_data.userid, new_summary)

        return EmotionOutput(
            emotion=parsed_output.emotion,
            reasoning=parsed_output.reasoning,
            confidence_level=parsed_output.confidence_level
        )
    
    except Exception as e:
        print(f"[ERROR] analyze_tweet failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- INTENT ENDPOINT ----------------
@app.post("/intent")
async def modify_tweet(intent_data: IntentInput):
    try:
        user_summary = get_user_summary(intent_data.userid)
        prompt = intent_prompt.format_prompt(
            intent=intent_data.intent,
            summary=user_summary,
            tweet=intent_data.tweet
        )
        response = llm.invoke(prompt.to_messages())
        modified_tweet = response.content.strip()
        return {"modified_tweet": modified_tweet}
    
    except Exception as e:
        print(f"[ERROR] intent endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- FACT CHECK ENDPOINT ----------------
@app.post("/fact-check", response_model=FactCheckOutput)
async def fact_check(data: FactCheckInput):
    try:
        if not HAS_EXTERNAL_TOOLS:
            raise HTTPException(status_code=503, detail="Fact-check tools not available")
        
        print("[INFO] Fetching factual context for:", data.tweet)
        results = verify_topic_relevance(data.tweet)
        summarized_articles = results.get("summarized_articles", [])
        
        if isinstance(summarized_articles, str):
            summarized_articles = summarized_articles.split("\n")[:5]
        
        return FactCheckOutput(facts=summarized_articles)
    
    except Exception as e:
        print(f"[ERROR] fact_check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- CHAT ENDPOINT ----------------
@app.post("/chat", response_model=ChatResponse)
async def chat_with_context(chat_data: ChatInput):
    """Chat endpoint that uses user summary and answers query."""
    try:
        user_summary = get_user_summary(chat_data.userid)
        if not user_summary:
            user_summary = "No prior summary available."

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

        response = llm.invoke(formatted_prompt.to_messages())
        return ChatResponse(answer=response.content.strip())
    
    except Exception as e:
        print(f"[ERROR] chat endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- HEALTH CHECK ----------------
@app.get("/")
async def health_check():
    return {
        "status": "ok",
        "external_tools": HAS_EXTERNAL_TOOLS,
        "storage": "in-memory"
    }