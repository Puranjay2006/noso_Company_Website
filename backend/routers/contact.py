"""
Contact form submissions API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from database.mongodb import db
from utils.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/contact", tags=["Contact"])


class ContactFormSubmission(BaseModel):
    name: str
    email: EmailStr
    message: str
    phone: Optional[str] = None


class ContactSubmissionResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    message: str
    status: str
    created_at: str
    responded_at: Optional[str] = None
    admin_notes: Optional[str] = None


@router.post("/submit")
async def submit_contact_form(submission: ContactFormSubmission):
    """Submit a contact form (public endpoint)"""
    try:
        contact_data = {
            "_id": ObjectId(),
            "name": submission.name,
            "email": submission.email,
            "phone": submission.phone,
            "message": submission.message,
            "status": "new",  # new, read, responded, archived
            "created_at": datetime.now(timezone.utc),
            "responded_at": None,
            "admin_notes": None
        }
        
        result = db.contact_submissions.insert_one(contact_data)
        
        return {
            "success": True,
            "message": "Thank you for your message! We'll get back to you soon.",
            "submission_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit contact form: {str(e)}")


@router.get("/submissions")
async def get_contact_submissions(
    status: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(require_admin)
):
    """Get all contact form submissions (admin only)"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        submissions = list(
            db.contact_submissions.find(query)
            .sort("created_at", -1)
            .limit(limit)
        )
        
        return [{
            "id": str(sub["_id"]),
            "name": sub["name"],
            "email": sub["email"],
            "phone": sub.get("phone"),
            "message": sub["message"],
            "status": sub["status"],
            "created_at": sub["created_at"].isoformat() if sub.get("created_at") else None,
            "responded_at": sub["responded_at"].isoformat() if sub.get("responded_at") else None,
            "admin_notes": sub.get("admin_notes")
        } for sub in submissions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch submissions: {str(e)}")


@router.get("/submissions/count")
async def get_new_submissions_count(current_user: dict = Depends(require_admin)):
    """Get count of new/unread contact submissions (admin only)"""
    try:
        count = db.contact_submissions.count_documents({"status": "new"})
        return {"new_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/submissions/{submission_id}/status")
async def update_submission_status(
    submission_id: str,
    status: str,
    admin_notes: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    """Update contact submission status (admin only)"""
    try:
        if status not in ["new", "read", "responded", "archived"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        update_data = {
            "status": status,
            "updated_at": datetime.now(timezone.utc)
        }
        
        if status == "responded":
            update_data["responded_at"] = datetime.now(timezone.utc)
        
        if admin_notes:
            update_data["admin_notes"] = admin_notes
        
        result = db.contact_submissions.update_one(
            {"_id": ObjectId(submission_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        return {"success": True, "message": "Submission updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/submissions/{submission_id}")
async def delete_submission(
    submission_id: str,
    current_user: dict = Depends(require_admin)
):
    """Delete a contact submission (admin only)"""
    try:
        result = db.contact_submissions.delete_one({"_id": ObjectId(submission_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        return {"success": True, "message": "Submission deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
