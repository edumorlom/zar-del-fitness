"""Functions the assistant can call during a phone call."""

import functools
import json
import logging

from openai import AsyncOpenAI

import config

log = logging.getLogger("assistant")

SEARCH_KNOWLEDGE_BASE = {
    "type": "function",
    "name": "search_knowledge_base",
    "description": (
        "Search the gym's documents: opening hours, prices, memberships, classes, "
        "trainers, location, policies, promotions and FAQs. Use it for any factual "
        "question about the gym."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Short search query describing what the caller wants to know.",
            }
        },
        "required": ["query"],
    },
}

TRANSFER_TO_RONALD = {
    "type": "function",
    "name": "transfer_to_ronald",
    "description": (
        "Transfer the call to Ronald Medina, the founder and head trainer. Use it when the caller asks to "
        "talk to Ronald. Tell the caller you're transferring them before calling it."
    ),
    "parameters": {"type": "object", "properties": {}},
}

SCHEDULE_VISIT = {
    "type": "function",
    "name": "schedule_visit",
    "description": (
        "Book a first visit or an appointment at the gym. Before calling it, ask for the caller's name "
        "and availability, and agree on a day and time with them."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "The caller's name."},
            "date": {"type": "string", "description": "Day of the visit, e.g. 'martes 13 de octubre'."},
            "time": {"type": "string", "description": "Time of the visit, e.g. '18:30'."},
            "reason": {"type": "string", "description": "What the visit is for, e.g. 'first visit' or 'evaluation'."},
        },
        "required": ["name", "date", "time"],
    },
}

# Tools offered to the model. The knowledge base is only available once it has been uploaded.
TOOLS = ([SEARCH_KNOWLEDGE_BASE] if config.VECTOR_STORE_ID else []) + [TRANSFER_TO_RONALD, SCHEDULE_VISIT]


async def run_tool(name: str, arguments: str) -> str:
    args = json.loads(arguments or "{}")
    if name == "search_knowledge_base":
        return await search_knowledge_base(args.get("query", ""))
    if name == "transfer_to_ronald":
        log.info("Caller asked for Ronald. Transfers aren't set up yet, so the call will end.")
        return "Transferring the call to Ronald now."
    if name == "schedule_visit":
        # Not connected to a calendar yet: any time is accepted and the booking is only logged.
        log.info("Visit booked (not saved anywhere yet): %s", args)
        return f"Booked: {args.get('name')}, {args.get('date')} at {args.get('time')}."
    return f"Unknown tool: {name}"


@functools.cache
def openai_client() -> AsyncOpenAI:
    return AsyncOpenAI()


async def search_knowledge_base(query: str) -> str:
    log.info("Searching knowledge base: %s", query)
    try:
        results = await openai_client().vector_stores.search(
            vector_store_id=config.VECTOR_STORE_ID,
            query=query,
            max_num_results=5,
            timeout=8,
        )
    except Exception:
        log.exception("Knowledge base search failed")
        return "The search failed. Tell the caller you can't check that right now."

    chunks = ["\n".join(part.text for part in result.content) for result in results.data]
    if not chunks:
        return "No matching information found in the knowledge base."
    return "\n\n---\n\n".join(chunks)
