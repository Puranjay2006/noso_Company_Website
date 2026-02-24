from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from bson import ObjectId

from database.mongodb import get_database
from utils.schemas import CartItemCreate, CartItemUpdate, CartItemResponse, CartSummary
from utils.dependencies import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("/", response_model=CartSummary)
async def get_cart(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get current user's cart with items and total"""
    user_id = str(current_user["_id"])
    cart_items = list(db.cart_items.find({"user_id": user_id}))

    items_response = []
    subtotal = 0.0

    for item in cart_items:
        # Convert _id to id for frontend compatibility
        item["id"] = str(item["_id"])
        del item["_id"]

        # Get service details
        service = db.services.find_one({"_id": ObjectId(item["service_id"])})
        if service:
            item["service_title"] = service.get("title")
            item["service_price"] = service.get("price")
            item["service_image"] = service.get("image")

            # Calculate item total
            item_total = service.get("price", 0) * item.get("quantity", 1)
            subtotal += item_total

        items_response.append(item)

    return CartSummary(
        items=items_response,
        total_items=len(items_response),
        subtotal=subtotal,
        total=subtotal  # Can add tax, fees, etc. here later
    )


@router.post("/", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    cart_item: CartItemCreate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Add a service to cart or update quantity if already exists"""
    user_id = str(current_user["_id"])

    # Validate service exists and is active
    if not ObjectId.is_valid(cart_item.service_id):
        raise HTTPException(status_code=400, detail="Invalid service ID")

    service = db.services.find_one({"_id": ObjectId(cart_item.service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    if not service.get("is_active", False):
        raise HTTPException(status_code=400, detail="Service is not available")

    # Check if item already in cart
    existing_item = db.cart_items.find_one({
        "user_id": user_id,
        "service_id": cart_item.service_id
    })

    if existing_item:
        # Update quantity
        new_quantity = existing_item["quantity"] + cart_item.quantity
        db.cart_items.update_one(
            {"_id": existing_item["_id"]},
            {"$set": {"quantity": new_quantity}}
        )
        item = db.cart_items.find_one({"_id": existing_item["_id"]})
    else:
        # Add new item
        item_dict = {
            "user_id": user_id,
            "service_id": cart_item.service_id,
            "quantity": cart_item.quantity,
            "created_at": datetime.utcnow()
        }
        result = db.cart_items.insert_one(item_dict)
        item = db.cart_items.find_one({"_id": result.inserted_id})

    # Convert _id to id for frontend compatibility
    item["id"] = str(item["_id"])
    del item["_id"]
    item["service_title"] = service.get("title")
    item["service_price"] = service.get("price")
    item["service_image"] = service.get("image")

    return item


@router.put("/{item_id}", response_model=CartItemResponse)
async def update_cart_item(
    item_id: str,
    update_data: CartItemUpdate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update cart item quantity"""
    user_id = str(current_user["_id"])

    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid cart item ID")

    # Check if item exists and belongs to current user
    item = db.cart_items.find_one({
        "_id": ObjectId(item_id),
        "user_id": user_id
    })

    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    # Update quantity
    db.cart_items.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": {"quantity": update_data.quantity}}
    )

    updated_item = db.cart_items.find_one({"_id": ObjectId(item_id)})
    # Convert _id to id for frontend compatibility
    updated_item["id"] = str(updated_item["_id"])
    del updated_item["_id"]

    # Get service details
    service = db.services.find_one({"_id": ObjectId(updated_item["service_id"])})
    if service:
        updated_item["service_title"] = service.get("title")
        updated_item["service_price"] = service.get("price")
        updated_item["service_image"] = service.get("image")

    return updated_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_cart(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Remove item from cart"""
    user_id = str(current_user["_id"])

    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid cart item ID")

    # Check if item exists and belongs to current user
    item = db.cart_items.find_one({
        "_id": ObjectId(item_id),
        "user_id": user_id
    })

    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.cart_items.delete_one({"_id": ObjectId(item_id)})

    return None


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Clear all items from cart"""
    user_id = str(current_user["_id"])
    db.cart_items.delete_many({"user_id": user_id})

    return None
