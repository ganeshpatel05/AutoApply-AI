import asyncio
from fastapi import APIRouter, HTTPException
from api.schemas.models import CoverLetterGenerateRequest, CoverLetterUpdateRequest
from database.db_manager import DatabaseManager
from agents.cover_letter_agent import CoverLetterAgent

router = APIRouter(prefix="/api/cover-letters", tags=["cover-letters"])
db = DatabaseManager()
cl_agent = CoverLetterAgent(db)

@router.post("/generate")
async def generate_cover_letter(req: CoverLetterGenerateRequest):
    try:
        resume = db.get_active_resume()
        if not resume:
            raise HTTPException(status_code=404, detail="No active resume found")
        
        job = None
        if req.job_id:
            job = db.get_job_by_id(req.job_id)
        
        if not job and req.custom_jd:
            job = {
                "id": req.job_id,
                "title": req.job_title or "Software Developer",
                "company": req.company_name or "Target Company",
                "description": req.custom_jd,
                "matched_keywords": []
            }
        
        if not job:
            raise HTTPException(status_code=400, detail="Must provide either a valid job_id or custom_jd")

        tone = req.tone or "Professional"
        length = req.length or "Standard"
        
        # Offload LLM generation (10-60s blocking) to thread pool
        result = await asyncio.to_thread(
            cl_agent.generate_cover_letter,
            resume_data=resume,
            job=job,
            tone=tone,
            length=length
        )
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}")
def get_cover_letter(job_id: int):
    try:
        cl = db.get_cover_letter(job_id)
        if not cl:
            raise HTTPException(status_code=404, detail="Cover letter not found")
        return {"success": True, "cover_letter": cl}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{job_id}")
def update_cover_letter(job_id: int, req: CoverLetterUpdateRequest):
    try:
        db.save_cover_letter(job_id=job_id, content=req.content)
        return {"success": True, "message": "Cover letter updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
