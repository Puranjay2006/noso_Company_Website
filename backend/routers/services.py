from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import os
import shutil
from pathlib import Path

from database.mongodb import get_database
from utils.schemas import ServiceCreate, ServiceUpdate, ServiceResponse, UserResponse
from utils.dependencies import get_current_user
from config import settings

router = APIRouter(prefix="/services", tags=["Services"])


@router.get("/", response_model=List[ServiceResponse])
async def list_services(
    category_id: Optional[str] = None,
    is_active: bool = None,
    search: Optional[str] = None,
    db=Depends(get_database)
):
    """
    List all services (public endpoint)
    Optional filters: category_id, is_active, search (by title or tags)
    """
    query = {}

    if category_id:
        if not ObjectId.is_valid(category_id):
            raise HTTPException(status_code=400, detail="Invalid category ID")
        query["category_id"] = category_id

    if is_active is not None:
        query["is_active"] = is_active

    if search:
        # Search in title, description, and tags
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]

    services = list(db.services.find(query).sort("title", 1))

    # Populate category names
    for service in services:
        service["_id"] = str(service["_id"])

        # Get category name
        if service.get("category_id"):
            category = db.categories.find_one({"_id": ObjectId(service["category_id"])})
            service["category_name"] = category["name"] if category else None

    return services


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: str,
    db=Depends(get_database)
):
    """Get a specific service by ID"""
    if not ObjectId.is_valid(service_id):
        raise HTTPException(status_code=400, detail="Invalid service ID")

    service = db.services.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    service["_id"] = str(service["_id"])

    # Get category name
    if service.get("category_id"):
        category = db.categories.find_one({"_id": ObjectId(service["category_id"])})
        service["category_name"] = category["name"] if category else None

    return service


@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_data: ServiceCreate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Create a new service (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create services")

    # Validate category exists
    if not ObjectId.is_valid(service_data.category_id):
        raise HTTPException(status_code=400, detail="Invalid category ID")

    category = db.categories.find_one({"_id": ObjectId(service_data.category_id)})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    service_dict = service_data.model_dump()
    service_dict["created_at"] = datetime.utcnow()
    service_dict["updated_at"] = None

    result = db.services.insert_one(service_dict)

    created_service = db.services.find_one({"_id": result.inserted_id})
    created_service["_id"] = str(created_service["_id"])
    created_service["category_name"] = category["name"]

    return created_service


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: str,
    service_data: ServiceUpdate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update a service (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update services")

    if not ObjectId.is_valid(service_id):
        raise HTTPException(status_code=400, detail="Invalid service ID")

    # Check if service exists
    service = db.services.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Update only provided fields
    update_data = {k: v for k, v in service_data.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Validate category if being updated
    if "category_id" in update_data:
        if not ObjectId.is_valid(update_data["category_id"]):
            raise HTTPException(status_code=400, detail="Invalid category ID")

        category = db.categories.find_one({"_id": ObjectId(update_data["category_id"])})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    update_data["updated_at"] = datetime.utcnow()

    db.services.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": update_data}
    )

    updated_service = db.services.find_one({"_id": ObjectId(service_id)})
    updated_service["_id"] = str(updated_service["_id"])

    # Get category name
    category = db.categories.find_one({"_id": ObjectId(updated_service["category_id"])})
    updated_service["category_name"] = category["name"] if category else None

    return updated_service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Delete a service (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete services")

    if not ObjectId.is_valid(service_id):
        raise HTTPException(status_code=400, detail="Invalid service ID")

    # Check if service exists
    service = db.services.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Optional: Check if any bookings are using this service
    # bookings_count = db.bookings.count_documents({"services.service_id": service_id})
    # if bookings_count > 0:
    #     raise HTTPException(
    #         status_code=400,
    #         detail=f"Cannot delete service. {bookings_count} bookings are using this service"
    #     )

    db.services.delete_one({"_id": ObjectId(service_id)})

    return None


@router.post("/{service_id}/upload-image")
async def upload_service_image(
    service_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Upload image for a service (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can upload service images")

    if not ObjectId.is_valid(service_id):
        raise HTTPException(status_code=400, detail="Invalid service ID")

    # Check if service exists
    service = db.services.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Validate file type
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
        )

    # Create upload directory if it doesn't exist
    # settings.UPLOAD_FOLDER is typically 'uploads/images/bookings', so we want 'uploads/services'
    # We'll explicitly set it to 'uploads/services' to match the URL generation
    upload_dir = Path("uploads/services")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"service_{service_id}_{timestamp}{file_ext}"
    file_path = upload_dir / filename

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update service with image path
    image_url = f"/uploads/services/{filename}"
    db.services.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": {"image": image_url, "updated_at": datetime.utcnow()}}
    )

    return {"image_url": image_url}
