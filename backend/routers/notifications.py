"""
Notifications API Router
Endpoints for managing user notifications
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from bson import ObjectId
from database.mongodb import get_database
from utils.schemas import NotificationResponse, NotificationUpdate
from utils.dependencies import get_current_user
from utils.serializers import serialize_doc
from utils.notifications import mark_notification_read, mark_all_read, get_unread_count, delete_notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False)
):
    """Get user's notifications"""
    db = get_database()
    user_id = str(current_user["_id"])

    # Build query
    query = {"user_id": user_id}
    if unread_only:
        query["is_read"] = False

    # Fetch notifications sorted by created_at descending
    notifications = list(
        db.notifications
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return [serialize_doc(notif) for notif in notifications]


@router.get("/unread-count")
async def get_unread_notifications_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    user_id = str(current_user["_id"])
    count = get_unread_count(user_id)
    return {"unread_count": count}


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a specific notification as read"""
    db = get_database()
    user_id = str(current_user["_id"])

    # Verify notification belongs to user
    notification = db.notifications.find_one({
        "_id": ObjectId(notification_id),
        "user_id": user_id
    })

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # Mark as read
    success = mark_notification_read(notification_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read"
        )

    # Fetch updated notification
    updated_notification = db.notifications.find_one({"_id": ObjectId(notification_id)})
    return serialize_doc(updated_notification)


@router.put("/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read for current user"""
    user_id = str(current_user["_id"])
    count = mark_all_read(user_id)

    return {
        "message": f"Marked {count} notifications as read",
        "count": count
    }


@router.delete("/{notification_id}")
async def delete_user_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    db = get_database()
    user_id = str(current_user["_id"])

    # Verify notification belongs to user
    notification = db.notifications.find_one({
        "_id": ObjectId(notification_id),
        "user_id": user_id
    })

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # Delete notification
    success = delete_notification(notification_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete notification"
        )

    return {"message": "Notification deleted successfully"}


@router.delete("/")
async def delete_all_notifications(current_user: dict = Depends(get_current_user)):
    """Delete all notifications for current user"""
    db = get_database()
    user_id = str(current_user["_id"])

    result = db.notifications.delete_many({"user_id": user_id})

    return {
        "message": f"Deleted {result.deleted_count} notifications",
        "count": result.deleted_count
    }
