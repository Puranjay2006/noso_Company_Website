from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from bson import ObjectId

from database.mongodb import get_database
from utils.schemas import CategoryCreate, CategoryUpdate, CategoryResponse, UserResponse
from utils.dependencies import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=List[CategoryResponse])
async def list_categories(
    is_active: bool = None,
    db=Depends(get_database)
):
    """
    List all categories (public endpoint)
    Optional filter by is_active status
    """
    query = {}
    if is_active is not None:
        query["is_active"] = is_active

    categories = list(db.categories.find(query).sort("name", 1))

    for category in categories:
        category["_id"] = str(category["_id"])

    return categories


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    db=Depends(get_database)
):
    """Get a specific category by ID"""
    if not ObjectId.is_valid(category_id):
        raise HTTPException(status_code=400, detail="Invalid category ID")

    category = db.categories.find_one({"_id": ObjectId(category_id)})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    category["_id"] = str(category["_id"])
    return category


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Create a new category (Admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create categories")

    # Check if category name already exists
    existing = db.categories.find_one({"name": category_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")

    category_dict = category_data.model_dump()
    category_dict["created_at"] = datetime.utcnow()
    category_dict["updated_at"] = None

    result = db.categories.insert_one(category_dict)

    created_category = db.categories.find_one({"_id": result.inserted_id})
    created_category["_id"] = str(created_category["_id"])

    return created_category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update a category (Admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update categories")

    if not ObjectId.is_valid(category_id):
        raise HTTPException(status_code=400, detail="Invalid category ID")

    # Check if category exists
    category = db.categories.find_one({"_id": ObjectId(category_id)})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Update only provided fields
    update_data = {k: v for k, v in category_data.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Check if name is being changed and if it already exists
    if "name" in update_data:
        existing = db.categories.find_one({
            "name": update_data["name"],
            "_id": {"$ne": ObjectId(category_id)}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Category with this name already exists")

    update_data["updated_at"] = datetime.utcnow()

    db.categories.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": update_data}
    )

    updated_category = db.categories.find_one({"_id": ObjectId(category_id)})
    updated_category["_id"] = str(updated_category["_id"])

    return updated_category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Delete a category (Admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete categories")

    if not ObjectId.is_valid(category_id):
        raise HTTPException(status_code=400, detail="Invalid category ID")

    # Check if category exists
    category = db.categories.find_one({"_id": ObjectId(category_id)})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if any services are using this category
    services_count = db.services.count_documents({"category_id": category_id})
    if services_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category. {services_count} services are using this category"
        )

    db.categories.delete_one({"_id": ObjectId(category_id)})

    return None
