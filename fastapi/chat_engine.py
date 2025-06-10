import asyncio
import logging
from typing import AsyncIterable, TypedDict

from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import Tool
from langchain.schema import HumanMessage, SystemMessage

# Create a logger for this module
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class AgentState(TypedDict):
    """
    Typed dictionary to hold the state for the agent.
    """
    input: str
    output: str

def _build_agent(cb: AsyncIteratorCallbackHandler) -> AgentExecutor:
    """
    Build an AgentExecutor with streaming capabilities and a sample tool.
    """
    # Create a streaming LLM from OpenAI
    llm = ChatOpenAI(streaming=True, callbacks=[cb], temperature=0)

    # Define a simple tool
    tools = [
        Tool(
            name="example_tool",
            func=lambda x: f"Processed: {x}",
            description="An example tool that processes input.",
        )
    ]

    # Define the prompt template
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are a helpful assistant."),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad"),
        ]
    )

    # Create and return the agent
    agent_executor = create_openai_functions_agent(llm=llm, tools=tools, prompt=prompt)
    return agent_executor

def _build_graph(agent_exec: AgentExecutor):
    """
    Build and compile a StateGraph that invokes the agent.
    """
    from langgraph.graph import StateGraph
    graph = StateGraph(AgentState)

    # Define the node that executes the agent
    async def agent_node(state: AgentState) -> AgentState:
        """
        Node that calls the agent's async invoke and updates the state with the output.
        """
        try:
            res = await agent_exec.ainvoke({"input": state["input"], "intermediate_steps": []})
            if isinstance(res, str):
                state["output"] = res
            elif hasattr(res, "return_values"):
                state["output"] = res.return_values.get("output", "")
            elif isinstance(res, dict):
                state["output"] = res.get("output", "")
            else:
                state["output"] = str(res)
        except Exception as e:
            # Log any errors that occur during agent execution
            logger.error(f"Error executing agent node: {e}")
            state["output"] = "An error occurred while processing your request."
        return state

    # Add the node to the graph and set as entry point
    graph.add_node("agent", agent_node)
    graph.set_entry_point("agent")
    return graph.compile()

async def stream_response(content: str) -> AsyncIterable[str]:
    """
    Stream tokens from the agent in response to the given content.
    """
    cb = AsyncIteratorCallbackHandler()
    agent_exec = _build_agent(cb)
    compiled_graph = _build_graph(agent_exec)

    # Invoke the graph asynchronously
    task = asyncio.create_task(compiled_graph.ainvoke({"input": content}))
    try:
        async for token in cb.aiter():
            yield token
    finally:
        # Signal completion to the callback and wait for the task
        cb.done.set()
        await task

async def stream_summary(content: str, percent: int, bullets: bool, temperature: float) -> AsyncIterable[str]:
    """
    Stream a summarized version of the content using an LLM, respecting the percent, bullets, and temperature parameters.
    """
    # Validate percent and temperature
    percent = max(1, min(percent, 100))
    temperature = max(0.0, min(temperature, 1.0))

    cb = AsyncIteratorCallbackHandler()
    llm = ChatOpenAI(streaming=True, callbacks=[cb], temperature=temperature)

    # Decide the style of the summary
    style = "Return the summary as a bulleted list where each bullet is a short sentence." if bullets else "Return the summary as one concise paragraph."
    prompt = (
        f"""You are an expert text-summarizer.
Summarize the following text to ≈{percent}% of its original length. {style}

Text:
{content}"""
    )

    # Start streaming from the LLM
    task = asyncio.create_task(
        llm.ainvoke([
            SystemMessage(content="You are a helpful assistant that summarizes text."),
            HumanMessage(content=prompt),
        ])
    )
    try:
        async for token in cb.aiter():
            yield token
    finally:
        # Signal completion to the callback and wait for the task
        cb.done.set()
        await task
