from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import List
from datetime import datetime
from bson import ObjectId
import os
from werkzeug.utils import secure_filename
from database.mongodb import get_database
from utils.schemas import BookingResponse, BookingStatusUpdate, BookingRating
from utils.dependencies import get_current_user, require_role
from utils.serializers import serialize_list, serialize_doc
from config import settings
from utils.notifications import notify_booking_status_change

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@router.get("", response_model=List[BookingResponse])
async def list_bookings(current_user: dict = Depends(get_current_user)):
    """List bookings based on user role"""
    db = get_database()
    role = current_user.get('role')
    user_id = current_user.get('_id')

    if role == 'customer':
        bookings = list(db.bookings.find({'customer_id': user_id}))
        # Add partner details to bookings
        for booking in bookings:
            if booking.get('partner_id'):
                partner = db.users.find_one(
                    {'_id': booking['partner_id'], 'role': 'partner'},
                    {'name': 1, 'phone': 1}
                )
                if partner:
                    booking['partner_details'] = {
                        'name': partner.get('name'),
                        'phone': partner.get('phone')
                    }
    elif role == 'partner':
        bookings = list(db.bookings.find({'partner_id': user_id}))
        # Add customer details to bookings
        for booking in bookings:
            if booking.get('customer_id'):
                customer = db.users.find_one(
                    {'_id': booking['customer_id'], 'role': 'customer'},
                    {'name': 1, 'phone': 1}
                )
                if customer:
                    booking['customer'] = {
                        'name': customer.get('name'),
                        'phone': customer.get('phone')
                    }
    elif role == 'admin':
        bookings = list(db.bookings.find({}))
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )
    for booking in bookings:
        if 'rating' in booking and not booking.get('customer_rating'):
            booking['customer_rating'] = {
                'rating': booking.get('rating'),
                'comment': booking.get('comment'),
                'rated_at': booking.get('rated_at')
            }
        
        # Also handle partner_rating if it exists at top level (unlikely but good for consistency)
        if 'partner_rating_val' in booking and not booking.get('partner_rating'):
            booking['partner_rating'] = {
                'rating': booking.get('partner_rating_val'),
                'comment': booking.get('partner_comment'),
                'rated_at': booking.get('partner_rated_at')
            }

    return serialize_list(bookings)


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Get booking details"""
    db = get_database()
    booking = db.bookings.find_one({'_id': ObjectId(booking_id)})

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    # Check authorization
    role = current_user.get('role')
    user_id = current_user.get('_id')

    if role == 'customer' and booking.get('customer_id') != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    elif role == 'partner' and booking.get('partner_id') != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    # Handle legacy rating fields
    if 'rating' in booking and not booking.get('customer_rating'):
        booking['customer_rating'] = {
            'rating': booking.get('rating'),
            'comment': booking.get('comment'),
            'rated_at': booking.get('rated_at')
        }

    return serialize_doc(booking)


@router.put("/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status_update: BookingStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update booking status"""
    db = get_database()
    booking = db.bookings.find_one({'_id': ObjectId(booking_id)})

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    # Check authorization
    role = current_user.get('role')
    user_id = current_user.get('_id')

    if role == 'partner' and booking.get('partner_id') != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    result = db.bookings.update_one(
        {'_id': ObjectId(booking_id)},
        {'$set': {'status': status_update.status.value}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update booking status"
        )

    # Send status update notification to customer
    try:
        notify_booking_status_change(
            str(booking['customer_id']),
            booking_id,
            status_update.status.value
        )
    except Exception as e:
        print(f"Failed to send booking status notification: {e}")

    return {"message": "Status updated successfully"}


@router.put("/{booking_id}/work-started")
async def mark_work_started(
    booking_id: str,
    current_user: dict = Depends(require_role("partner"))
):
    """Mark work as started (partner only)"""
    db = get_database()
    booking = db.bookings.find_one({'_id': ObjectId(booking_id)})

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    if booking.get('partner_id') != current_user.get('_id'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    result = db.bookings.update_one(
        {'_id': ObjectId(booking_id)},
        {'$set': {'work_started_at': datetime.utcnow()}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update work started timestamp"
        )

    return {"message": "Work started timestamp updated successfully"}


@router.put("/{booking_id}/work-completed")
async def mark_work_completed(
    booking_id: str,
    current_user: dict = Depends(require_role("partner"))
):
    """Mark work as completed (partner only)"""
    db = get_database()
    booking = db.bookings.find_one({'_id': ObjectId(booking_id)})

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    if booking.get('partner_id') != current_user.get('_id'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    result = db.bookings.update_one(
        {'_id': ObjectId(booking_id)},
        {'$set': {'work_completed_at': datetime.utcnow()}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update work completed timestamp"
        )

    return {"message": "Work completed timestamp updated successfully"}


@router.put("/{booking_id}/rate")
async def rate_booking(
    booking_id: str,
    rating_data: BookingRating,
    current_user: dict = Depends(require_role("customer"))
):
    """Rate a booking (customer only)"""
    db = get_database()
    booking = db.bookings.find_one({'_id': ObjectId(booking_id)})

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    if booking.get('customer_id') != current_user.get('_id'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to rate this booking"
        )

    if booking.get('status') != 'completed':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking must be completed to be rated"
        )

    update_fields = {
        'customer_rating': {
            'rating': rating_data.rating,
            'comment': rating_data.comment,
            'rated_at': datetime.utcnow()
        }
    }

    result = db.bookings.update_one(
        {'_id': ObjectId(booking_id)},
        {'$set': update_fields}
    )

    if result.modified_count == 0:
        return {"message": "No changes made or failed to update rating"}

    return {"message": "Booking rated successfully", "rating": rating_data.rating}


@router.post("/{booking_id}/before-image")
async def upload_before_cleaning_image(
    booking_id: str,
    image: UploadFile = File(...),
    current_user: dict = Depends(require_role("partner"))
):
    """Upload before cleaning image (partner only)"""
    db = get_database()
    booking = db.bookings.find_one({'_id': ObjectId(booking_id)})

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    if booking.get('partner_id') != current_user.get('_id'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    if not allowed_file(image.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PNG, JPG, JPEG, and GIF files are allowed."
        )

    # Create booking directory
    booking_dir = os.path.join(settings.UPLOAD_FOLDER, booking_id)
    os.makedirs(booking_dir, exist_ok=True)

    # Save file
    filename = f"before_cleaning_{secure_filename(image.filename)}"
    filepath = os.path.join(booking_dir, filename)

    with open(filepath, "wb") as buffer:
        content = await image.read()
        buffer.write(content)

    # Store relative path in database
    image_path = f"/uploads/images/bookings/{booking_id}/{filename}"

    result = db.bookings.update_one(
        {'_id': ObjectId(booking_id)},
        {'$set': {'before_cleaning_image': image_path}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update booking with image path"
        )

    return {
        "message": "Before cleaning image uploaded successfully",
        "image_path": image_path
    }


@router.post("/{booking_id}/after-image")
async def upload_after_cleaning_image(
    booking_id: str,
    image: UploadFile = File(...),
    current_user: dict = Depends(require_role("partner"))
):
    """Upload after cleaning image (partner only)"""
    db = get_database()
    booking = db.bookings.find_one({'_id': ObjectId(booking_id)})

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    if booking.get('partner_id') != current_user.get('_id'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    if not allowed_file(image.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PNG, JPG, JPEG, and GIF files are allowed."
        )

    # Create booking directory
    booking_dir = os.path.join(settings.UPLOAD_FOLDER, booking_id)
    os.makedirs(booking_dir, exist_ok=True)

    # Save file
    filename = f"after_cleaning_{secure_filename(image.filename)}"
    filepath = os.path.join(booking_dir, filename)

    with open(filepath, "wb") as buffer:
        content = await image.read()
        buffer.write(content)

    # Store relative path in database
    image_path = f"/uploads/images/bookings/{booking_id}/{filename}"

    result = db.bookings.update_one(
        {'_id': ObjectId(booking_id)},
        {'$set': {'after_cleaning_image': image_path}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update booking with image path"
        )

    return {
        "message": "After cleaning image uploaded successfully",
        "image_path": image_path
    }
