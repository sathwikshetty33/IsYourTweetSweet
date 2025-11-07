from langchain_tavily import TavilySearch
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

# Initialize Tavily (top 5 results)
tavily = TavilySearch(max_results=5)

# Initialize Groq LLM
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.3)

# Prompt for summarizing factual information
summary_prompt = ChatPromptTemplate.from_template(
    """
You are a **fact-verification assistant**.

Given the topic: "{topic}", summarize the following **web search results**
into **5 concise and verifiable factual points**.
Avoid speculation, opinions, or emotional tone — only objective facts.

Search Results:
{articles}

Return only bullet points with factual summaries.
"""
)

def verify_topic_relevance(topic: str) -> dict:
    """
    Fetch top 5 real-time web results for a given topic using Tavily,
    and summarize them factually using Groq.
    """
    print(f"[INFO] Fetching real-time data for topic: {topic}")

    # Step 1: Run Tavily Search
    search_results = tavily.invoke({"query": topic})

    # Step 2: Summarize using Groq
    messages = summary_prompt.format_messages(topic=topic, articles=search_results)
    response = llm.invoke(messages)

    summary = response.content.strip()

    return {
        "topic": topic,
        "summarized_articles": summary,
        "raw_results": search_results
    }
