from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import logging

from chat_engine import stream_response, stream_summary

# Load environment variables
load_dotenv()

# Create a logger for this module
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    """
    Pydantic model for chat messages.
    """
    content: str

class SummarizeRequest(BaseModel):
    """
    Pydantic model for summarize request parameters.
    """
    content: str
    percent: int = Field(30, ge=1, le=100)
    bullets: bool = False
    temperature: float = Field(0.3, ge=0, le=1)

@app.get("/health")
def health_check():
    """
    A simple health check endpoint.
    """
    return {"status": "ok"}

@app.post("/stream_summary/")
async def stream_summary_endpoint(req: SummarizeRequest):
    """
    Endpoint to stream summarized text from the LLM.
    """
    try:
        return StreamingResponse(stream_summary(req.content, req.percent, req.bullets, req.temperature), media_type="text/event-stream")
    except Exception as e:
        logger.error(f"Error in /stream_summary/: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while streaming summary response.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6677)
