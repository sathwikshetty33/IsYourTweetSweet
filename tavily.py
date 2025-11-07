from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import os
from dotenv import load_dotenv
load_dotenv()


tavily = TavilySearchResults(k=5)

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.3)

summary_prompt = PromptTemplate(
    input_variables=["topic", "articles"],
    template=(
        "You are a fact-verification assistant. Given the topic: '{topic}', "
        "summarize the following web search results into 5 concise, verifiable factual points. "
        "Avoid speculation or opinions. Use objective language.\n\n"
        "Search Results:\n{articles}\n\n"
        "Return your output as bullet points summarizing verified information."
    )
)
summarize_chain = LLMChain(llm=llm, prompt=summary_prompt)

def verify_topic_relevance(topic: str) -> dict:
    """
    Fetches top 5 real-time web results for a given topic using Tavily and
    summarizes them factually using Groq.
    """
    print(f"\n[INFO] Fetching real-time data for topic: {topic}\n")
    search_results = tavily.run(topic)
    summary = summarize_chain.run(topic=topic, articles=search_results)
    return {
        "topic": topic,
        "summarized_articles": summary,
        "raw_results": search_results
    }

