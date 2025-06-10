import pytest
import asyncio
from chat_engine import stream_response, stream_summary

@pytest.mark.asyncio
async def test_stream_response():
    """
    Test that stream_response can be consumed without error.
    """
    content = "Test"
    responses = []
    async for token in stream_response(content):
        responses.append(token)
    # Should produce some tokens (non-empty response)
    assert len("".join(responses)) > 0

@pytest.mark.asyncio
async def test_stream_summary():
    """
    Test that stream_summary can be consumed without error.
    """
    content = "Test text that needs summarization"
    responses = []
    async for token in stream_summary(content, 30, False, 0.3):
        responses.append(token)
    # Should produce some tokens (non-empty response)
    assert len("".join(responses)) > 0
