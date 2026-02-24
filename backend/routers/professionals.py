from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from database.mongodb import get_database
from bson import ObjectId

router = APIRouter(prefix="/professionals", tags=["professionals"])


class AddressInfo(BaseModel):
    street: str
    suburb: str
    city: str


class ProfessionalRegistrationRequest(BaseModel):
    fullName: str
    email: EmailStr
    phone: str
    nationality: str
    hasNZLicense: bool
    address: Optional[AddressInfo] = None
    yearsExperience: Optional[str] = ""
    specializations: List[str] = []
    availability: Optional[str] = ""
    preferredStartDate: Optional[str] = None
    aboutYourself: Optional[str] = None
    agreedToTerms: Optional[bool] = True
    location: str
    locationName: str


class ProfessionalRegistrationResponse(BaseModel):
    success: bool
    message: str
    registration_id: str


class StatusUpdateRequest(BaseModel):
    status: str
    review_notes: Optional[str] = None
    reviewed_by: Optional[str] = None


def log_new_registration(registration_data: dict):
    """Log new professional registration details to console"""
    
    address_info = registration_data.get('address', {})
    address_str = f"{address_info.get('street', 'N/A')}, {address_info.get('suburb', '')}, {address_info.get('city', '')}" if address_info else "Not provided"
    
    print("\n" + "="*60)
    print("🆕 NEW PROFESSIONAL REGISTRATION RECEIVED")
    print("="*60)
    print(f"👤 Name: {registration_data.get('fullName', 'N/A')}")
    print(f"📧 Email: {registration_data.get('email', 'N/A')}")
    print(f"📱 Phone: {registration_data.get('phone', 'N/A')}")
    print(f"🌍 Nationality: {registration_data.get('nationality', 'N/A')}")
    print(f"🏠 Address: {address_str}")
    print(f"📍 Service Area: {registration_data.get('locationName', 'N/A')}")
    print(f"🚗 NZ License: {'Yes' if registration_data.get('hasNZLicense') else 'No'}")
    print(f"⏰ Experience: {registration_data.get('yearsExperience', 'N/A')} years")
    print(f"📅 Availability: {registration_data.get('availability', 'N/A')}")
    print(f"🔧 Specializations: {', '.join(registration_data.get('specializations', [])) or 'None'}")
    print(f"🆔 Registration ID: {registration_data.get('_id', 'N/A')}")
    print("="*60)
    print("💡 View all registrations at: /api/professionals/registrations")
    print("="*60 + "\n")


@router.post("/register", response_model=ProfessionalRegistrationResponse)
async def register_professional(
    registration: ProfessionalRegistrationRequest,
    background_tasks: BackgroundTasks
):
    """
    Register a new professional service provider.
    Stores data in database and sends email notification.
    """
    db = get_database()
    
    # Check if email already exists
    existing = db.professional_registrations.find_one({"email": registration.email})
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A registration with this email already exists. Please use a different email or contact support."
        )
    
    # Prepare registration data
    registration_data = {
        **registration.model_dump(),
        "status": "pending",  # pending, approved, rejected
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "reviewed_by": None,
        "reviewed_at": None,
        "review_notes": None
    }
    
    # Insert into database
    result = db.professional_registrations.insert_one(registration_data)
    registration_id = str(result.inserted_id)
    
    # Add registration ID to data for logging
    registration_data["_id"] = registration_id
    
    # Log registration details to console
    log_new_registration(registration_data)
    
    return ProfessionalRegistrationResponse(
        success=True,
        message="Registration submitted successfully",
        registration_id=registration_id
    )


@router.get("/registrations")
async def list_registrations(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """
    List all professional registrations (admin only).
    Can filter by status: pending, approved, rejected
    """
    db = get_database()
    query = {}
    if status:
        query["status"] = status
    
    registrations = list(
        db.professional_registrations
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    
    # Convert ObjectId to string
    for reg in registrations:
        reg["_id"] = str(reg["_id"])
    
    total = db.professional_registrations.count_documents(query)
    
    return {
        "registrations": registrations,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/registrations/{registration_id}")
async def get_registration(registration_id: str):
    """Get a specific professional registration by ID"""
    db = get_database()
    
    try:
        registration = db.professional_registrations.find_one(
            {"_id": ObjectId(registration_id)}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid registration ID format")
    
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    registration["_id"] = str(registration["_id"])
    return registration


@router.patch("/registrations/{registration_id}/status")
async def update_registration_status(
    registration_id: str,
    request: StatusUpdateRequest
):
    """
    Update the status of a professional registration (admin only).
    Status can be: pending, approved, rejected
    """
    db = get_database()
    
    if request.status not in ["pending", "approved", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Must be: pending, approved, or rejected"
        )
    
    try:
        result = db.professional_registrations.update_one(
            {"_id": ObjectId(registration_id)},
            {
                "$set": {
                    "status": request.status,
                    "updated_at": datetime.utcnow().isoformat(),
                    "reviewed_by": request.reviewed_by,
                    "reviewed_at": datetime.utcnow().isoformat(),
                    "review_notes": request.review_notes
                }
            }
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid registration ID format")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    return {"success": True, "message": f"Registration status updated to {request.status}"}


@router.delete("/registrations/{registration_id}")
async def delete_registration(registration_id: str):
    """
    Delete a professional registration (admin only).
    """
    db = get_database()
    
    try:
        result = db.professional_registrations.delete_one(
            {"_id": ObjectId(registration_id)}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid registration ID format")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    return {"success": True, "message": "Registration deleted successfully"}


@router.get("/stats")
async def get_registration_stats():
    """Get statistics about professional registrations"""
    db = get_database()
    
    pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }
        }
    ]
    
    stats = list(db.professional_registrations.aggregate(pipeline))
    
    result = {
        "total": 0,
        "pending": 0,
        "approved": 0,
        "rejected": 0
    }
    
    for stat in stats:
        result[stat["_id"]] = stat["count"]
        result["total"] += stat["count"]
    
    return result
