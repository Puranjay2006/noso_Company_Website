"""
Notification Utility Functions
Helper functions to create and manage notifications
"""

from datetime import datetime, timezone
from database.mongodb import get_database
from typing import Optional, Dict


def create_notification(
    user_id: str,
    title: str,
    description: str,
    notification_type: str,
    related_id: Optional[str] = None,
    metadata: Optional[Dict] = None
) -> str:
    """
    Create a notification for a user

    Args:
        user_id: The user's ID who will receive the notification
        title: Short title for the notification
        description: Detailed description
        notification_type: Type of notification (account, booking, payment, system, partner)
        related_id: Optional related document ID (e.g., booking_id)
        metadata: Optional additional data

    Returns:
        The notification ID
    """
    db = get_database()

    notification_doc = {
        "user_id": user_id,
        "title": title,
        "description": description,
        "type": notification_type,
        "is_read": False,
        "created_at": datetime.now(timezone.utc),
        "read_at": None,
        "related_id": related_id,
        "metadata": metadata or {}
    }

    result = db.notifications.insert_one(notification_doc)
    return str(result.inserted_id)


def notify_account_created(user_id: str, user_name: str, role: str):
    """Notify user when their account is created"""
    title = "Welcome to NoSo Company!"
    description = f"Hello {user_name}! Your {role} account has been successfully created. Start exploring our services today."
    return create_notification(user_id, title, description, "account")


def notify_login(user_id: str, user_name: str):
    """Notify user on login"""
    title = "New Login Detected"
    description = f"Hello {user_name}! You just logged in. If this wasn't you, please secure your account immediately."
    return create_notification(user_id, title, description, "account")


def notify_partner_registration(user_id: str, user_name: str):
    """Notify partner when they register"""
    title = "Partner Application Submitted"
    description = f"Hello {user_name}! Your partner application has been submitted successfully. Our admin team will review it within 24-48 hours."
    return create_notification(user_id, title, description, "partner")


def notify_partner_approved(user_id: str, user_name: str):
    """Notify partner when approved"""
    title = "Partner Application Approved! 🎉"
    description = f"Congratulations {user_name}! Your partner application has been approved. You can now start accepting jobs."
    return create_notification(user_id, title, description, "partner")


def notify_partner_rejected(user_id: str, user_name: str):
    """Notify partner when rejected"""
    title = "Partner Application Update"
    description = f"Hello {user_name}, unfortunately your partner application was not approved at this time. Please contact support for more information."
    return create_notification(user_id, title, description, "partner")


def notify_booking_created(user_id: str, booking_id: str, user_name: str):
    """Notify customer when booking is created"""
    title = "Booking Confirmed!"
    description = f"Hello {user_name}! Your booking has been confirmed. We'll notify you once a partner is assigned."
    return create_notification(user_id, title, description, "booking", related_id=booking_id)


def notify_booking_assigned(user_id: str, booking_id: str, partner_name: str):
    """Notify customer when partner is assigned to booking"""
    title = "Partner Assigned to Your Booking"
    description = f"Great news! {partner_name} has been assigned to your booking. They will contact you soon."
    return create_notification(user_id, title, description, "booking", related_id=booking_id)


def notify_partner_new_booking(partner_id: str, booking_id: str, customer_name: str):
    """Notify partner when assigned a new booking"""
    title = "New Booking Assigned!"
    description = f"You have been assigned a new booking from {customer_name}. Check your dashboard for details."
    return create_notification(partner_id, title, description, "booking", related_id=booking_id)


def notify_booking_status_change(user_id: str, booking_id: str, status: str):
    """Notify user when booking status changes"""
    status_messages = {
        "in_progress": "Your booking is now in progress!",
        "completed": "Your booking has been completed. Please rate your experience.",
        "cancelled": "Your booking has been cancelled."
    }

    title = "Booking Status Updated"
    description = status_messages.get(status, f"Your booking status has been updated to {status}.")
    return create_notification(user_id, title, description, "booking", related_id=booking_id)


def notify_payment_received(user_id: str, booking_id: str, amount: float):
    """Notify user when payment is received"""
    title = "Payment Received"
    description = f"We've received your payment of ${amount:.2f}. Thank you for your business!"
    return create_notification(user_id, title, description, "payment", related_id=booking_id)


def notify_partner_payment(partner_id: str, booking_id: str, earnings: float):
    """Notify partner of their earnings"""
    title = "Payment Processed"
    description = f"You've earned ${earnings:.2f} from your completed booking. Funds will be transferred shortly."
    return create_notification(partner_id, title, description, "payment", related_id=booking_id)


def mark_notification_read(notification_id: str) -> bool:
    """Mark a notification as read"""
    db = get_database()
    from bson import ObjectId

    result = db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {
            "$set": {
                "is_read": True,
                "read_at": datetime.now(timezone.utc)
            }
        }
    )
    return result.modified_count > 0


def mark_all_read(user_id: str) -> int:
    """Mark all notifications as read for a user"""
    db = get_database()

    result = db.notifications.update_many(
        {"user_id": user_id, "is_read": False},
        {
            "$set": {
                "is_read": True,
                "read_at": datetime.now(timezone.utc)
            }
        }
    )
    return result.modified_count


def get_unread_count(user_id: str) -> int:
    """Get count of unread notifications for a user"""
    db = get_database()
    return db.notifications.count_documents({"user_id": user_id, "is_read": False})


def delete_notification(notification_id: str) -> bool:
    """Delete a notification"""
    db = get_database()
    from bson import ObjectId

    result = db.notifications.delete_one({"_id": ObjectId(notification_id)})
    return result.deleted_count > 0
