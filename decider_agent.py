from pydantic import BaseModel, Field
from typing import List, Optional
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from dotenv import load_dotenv
load_dotenv()


class DeciderInput(BaseModel):
    tweet: str = Field(..., description="The tweet text that needs to be analyzed.")
    user_context: Optional[str] = Field(None, description="External context about the user if available.")

class DeciderOutput(BaseModel):
    needsExternalContext: bool = Field(..., description="True if factual verification or external context is required.")
    topics: List[str] = Field(default_factory=list, description="List of topics or keywords to search if external context is needed.")


llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.3)

output_parser = PydanticOutputParser(pydantic_object=DeciderOutput)

prompt = ChatPromptTemplate.from_template(
    """
    You are a fact-verification decision agent.
    Your goal is to determine if a given tweet needs external factual context.

    Rules:
    - If the tweet is an opinion, emotion, or meme → needsExternalContext = false
    - If the tweet contains a factual claim, news, or statistics → needsExternalContext = true
    - When true, list 2–4 concise topics suitable for searching online via Tavily.

    Tweet: "{tweet}"
    User Context: "{user_context}"

    {format_instructions}
    """
)




def decide_external_context(input_data: DeciderInput) -> DeciderOutput:
    """
    Determines if a tweet needs external factual context using Groq.
    Returns structured Pydantic output.
    """
    formatted_prompt = prompt.format_prompt(
        tweet=input_data.tweet,
        user_context=input_data.user_context or "",
        format_instructions=output_parser.get_format_instructions()
    )

    response = llm(formatted_prompt.to_messages())
    parsed_output = output_parser.parse(response.content)

    return parsed_output


