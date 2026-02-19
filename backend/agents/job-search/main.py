from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from groq import Groq
from firecrawl import FirecrawlApp
from dotenv import load_dotenv

# Load env variables
load_dotenv()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Job Search Agent", description="Intelligent Job Search & Matching")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Clients
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY) if FIRECRAWL_API_KEY else None

class JobSearchRequest(BaseModel):
    query: str
    resume_text: Optional[str] = None
    limit: int = 5

class JobMatch(BaseModel):
    title: str
    company: str
    url: str
    match_score: int
    reasoning: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "job-search"}

@app.post("/search-and-match")
async def search_and_match(request: JobSearchRequest):
    if not firecrawl:
        raise HTTPException(status_code=500, detail="Firecrawl API Key not configured")
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API Key not configured")

    print(f"🔍 Searching for: {request.query}")
    
    try:
        # 1. Search Web for Jobs (Firecrawl SDK v1+)
        search_results = firecrawl.search(
            query=request.query,
            limit=request.limit
        )
        
        # Normalize: SDK v1 returns a list directly or dict with 'data'
        if isinstance(search_results, list):
            raw_jobs = search_results
        elif isinstance(search_results, dict) and 'data' in search_results:
            raw_jobs = search_results['data']
        else:
            raw_jobs = []
        
        if not raw_jobs:
            return {"matches": []}

        raw_jobs = raw_jobs[:request.limit]
        print(f"✅ Found {len(raw_jobs)} raw results")

        # Helper: extract fields from either dict or object
        def get_field(item, key, default=""):
            if isinstance(item, dict):
                return item.get(key, default)
            return getattr(item, key, default)

        # 2. Match against Resume (RAG-lite)
        if not request.resume_text:
            return {
                "matches": [
                    {
                        "title": get_field(job, 'title', None) or get_field(job, 'metadata', {}).get('title', 'Unknown Role') if isinstance(get_field(job, 'metadata', None), dict) else get_field(job, 'title', 'Unknown Role'),
                        "company": "Unknown",
                        "url": get_field(job, 'url', '#'),
                        "match_score": 0,
                        "reasoning": "No resume provided for matching."
                    } for job in raw_jobs
                ]
            }

        # AI Matching Logic
        matches = []
        for job in raw_jobs:
            job_title = get_field(job, 'title', 'Unknown Role')
            job_desc = get_field(job, 'description', '') or get_field(job, 'markdown', '') or get_field(job, 'content', '')
            job_url = get_field(job, 'url', '#')
            job_summary = f"{job_title} - {str(job_desc)[:300]}"
            
            # Simple LLM scoring
            prompt = f"""
            Compare this Job to the Candidate Resume.
            
            Job: {job_summary}
            Resume Summary: {request.resume_text[:1000]}... (truncated)

            Rate match 0-100 and give 1 sentence reasoning.
            Format: JSON {{ "score": int, "reason": str, "company": str_inferred }}
            """
            
            try:
                completion = groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a recruiter AI. responding in JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    model="llama-3.3-70b-versatile",
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )
                
                analysis = json.loads(completion.choices[0].message.content)
                
                matches.append({
                    "title": job_title,
                    "company": analysis.get('company', 'Unknown'),
                    "url": job_url,
                    "match_score": analysis.get('score', 0),
                    "reasoning": analysis.get('reason', 'Analyzed by AI')
                })
            except Exception as e:
                print(f"Error matching job {job_url}: {e}")
                continue

        # Sort by score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return {"matches": matches}

    except Exception as e:
        print(f"Job Search Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
