from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime, timezone
from bson import ObjectId
from database.mongodb import get_database
from utils.schemas import UserCreate, UserResponse, UserUpdate, BookingCreate, BookingUpdate, BookingResponse, AssignBookingRequest
from utils.security import get_password_hash
from utils.dependencies import require_role
from utils.serializers import serialize_list, serialize_doc
from services.booking_service import assign_booking_to_partner
from utils.notifications import (
    notify_partner_approved,
    notify_partner_rejected,
    notify_booking_created,
    notify_booking_assigned,
    notify_partner_new_booking
)

router = APIRouter(prefix="/admin", tags=["Admin"])


# User Management
@router.get("/users", response_model=List[UserResponse])
async def get_all_users(current_user: dict = Depends(require_role("admin"))):
    """Get all users"""
    db = get_database()
    users = list(db.users.find({}))

    # Remove password field for security
    for user in users:
        if 'password' in user:
            del user['password']

    return serialize_list(users)


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, current_user: dict = Depends(require_role("admin"))):
    """Create a new user (admin only)"""
    db = get_database()

    # Check if email already exists
    if db.users.find_one({'email': user_data.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    # Prepare user document
    user_doc = {
        'email': user_data.email,
        'password': get_password_hash(user_data.password),
        'role': user_data.role.value,
        'name': user_data.name,
        'phone': user_data.phone,
        'address': user_data.address,
        'created_at': datetime.now(timezone.utc),
        'status': user_data.status.value if user_data.status else 'active'
    }

    # Add location coordinates
    if user_data.latitude is not None and user_data.longitude is not None:
        user_doc['location'] = {
            'type': 'Point',
            'coordinates': [user_data.longitude, user_data.latitude]
        }

    # Add role-specific fields
    if user_data.role.value == 'partner':
        user_doc.update({
            'availability': user_data.availability if user_data.availability is not None else True,
            'business_type': user_data.business_type,
            'experience': user_data.experience,
            'equipment': user_data.equipment or [],
            'service_area': user_data.service_area
        })

    result = db.users.insert_one(user_doc)
    user_doc['_id'] = result.inserted_id

    # Remove password from response
    del user_doc['password']

    return serialize_doc(user_doc)


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    update_data: UserUpdate,
    current_user: dict = Depends(require_role("admin"))
):
    """Update a user (admin only)"""
    db = get_database()

    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    update_fields = {}

    if update_data.email and update_data.email != user.get('email'):
        if db.users.find_one({'email': update_data.email}):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        update_fields['email'] = update_data.email

    if update_data.name:
        update_fields['name'] = update_data.name
    if update_data.phone:
        update_fields['phone'] = update_data.phone
    if update_data.address:
        update_fields['address'] = update_data.address

    # Track status changes for notifications
    status_changed = False
    old_status = user.get('status')
    new_status = None

    if update_data.status:
        new_status = update_data.status.value
        update_fields['status'] = new_status
        status_changed = (old_status != new_status)

    # Handle location coordinates
    if update_data.latitude is not None and update_data.longitude is not None:
        update_fields['location'] = {
            'type': 'Point',
            'coordinates': [update_data.longitude, update_data.latitude]
        }

    # Partner specific fields
    if user['role'] == 'partner':
        if update_data.availability is not None:
            update_fields['availability'] = update_data.availability
        if update_data.business_type is not None:
            update_fields['business_type'] = update_data.business_type

    if update_fields:
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_fields}
        )
        if result.modified_count == 0:
            return {"message": "No changes made or failed to update user"}

        # Send notifications for partner status changes
        if status_changed and user['role'] == 'partner':
            try:
                if new_status == 'active' and old_status == 'pending':
                    # Partner approved
                    notify_partner_approved(user_id, user['name'])
                elif new_status == 'rejected':
                    # Partner rejected
                    notify_partner_rejected(user_id, user['name'])
            except Exception as e:
                print(f"Failed to send partner status notification: {e}")

    return {"message": "User updated successfully"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_role("admin"))):
    """Delete a user (admin only)"""
    db = get_database()

    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    result = db.users.delete_one({'_id': ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )

    return {"message": "User deleted successfully"}


# Booking Management
@router.get("/bookings", response_model=List[BookingResponse])
async def get_all_bookings(current_user: dict = Depends(require_role("admin"))):
    """Get all bookings (admin only)"""
    db = get_database()
    bookings = list(db.bookings.find({}).sort('created_at', -1))
    print(f"[API] get_all_bookings: Found {len(bookings)} bookings.")
    if bookings:
        print(f"[API] get_all_bookings: Latest booking _id: {bookings[0]['_id']}")
    return serialize_list(bookings)


@router.post("/bookings", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    current_user: dict = Depends(require_role("admin"))
):
    """Create a new booking (admin only)"""
    db = get_database()

    # Verify customer exists
    customer = db.users.find_one({'_id': ObjectId(booking_data.customer_id), 'role': 'customer'})
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    # Prepare booking document
    booking_doc = {
        'customer_id': ObjectId(booking_data.customer_id),
        'customer_name': customer['name'],
        'customer_location': customer.get('location', {'type': 'Point', 'coordinates': [0, 0]}),
        'service_address': booking_data.service_address,
        'service_location': {
            'type': 'Point',
            'coordinates': [
                booking_data.service_longitude or 0,
                booking_data.service_latitude or 0
            ]
        },
        'service_type': booking_data.service_type.value,
        'scheduled_date': booking_data.scheduled_date,
        'notes': booking_data.notes,
        'status': booking_data.status.value if booking_data.status else 'pending',
        'created_at': datetime.utcnow(),
        'price': booking_data.price,
        'payment_status': booking_data.payment_status.value if booking_data.payment_status else 'pending'
    }

    result = db.bookings.insert_one(booking_doc)
    booking_id = str(result.inserted_id)

    # Send booking created notification to customer
    try:
        notify_booking_created(booking_data.customer_id, booking_id, customer['name'])
    except Exception as e:
        print(f"Failed to send booking created notification: {e}")

    # Attempt auto-assignment if status is pending/unassigned
    if booking_doc['status'] in ['pending', 'unassigned']:
        assign_booking_to_partner(booking_id)

    return {"message": "Booking created successfully", "booking_id": booking_id}


@router.put("/bookings/{booking_id}")
async def update_booking(
    booking_id: str,
    update_data: BookingUpdate,
    current_user: dict = Depends(require_role("admin"))
):
    """Update a booking (admin only)"""
    db = get_database()

    booking = db.bookings.find_one({'_id': ObjectId(booking_id)})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    update_fields = {}

    if update_data.service_type:
        update_fields['service_type'] = update_data.service_type.value
    if update_data.scheduled_date:
        update_fields['scheduled_date'] = update_data.scheduled_date
    if update_data.price is not None:
        update_fields['price'] = update_data.price
    if update_data.notes is not None:
        update_fields['notes'] = update_data.notes
    if update_data.status:
        update_fields['status'] = update_data.status.value
    if update_data.payment_status:
        update_fields['payment_status'] = update_data.payment_status.value
    if update_data.service_address:
        update_fields['service_address'] = update_data.service_address

    # Handle rating
    if update_data.rating is not None:
        update_fields['rating'] = update_data.rating
        update_fields['rated_at'] = datetime.utcnow()

    # Handle service location coordinates
    if update_data.service_latitude is not None and update_data.service_longitude is not None:
        update_fields['service_location'] = {
            'type': 'Point',
            'coordinates': [update_data.service_longitude, update_data.service_latitude]
        }

    # Handle partner assignment
    if update_data.partner_id is not None:
        if update_data.partner_id:
            partner = db.users.find_one({'_id': ObjectId(update_data.partner_id), 'role': 'partner'})
            if not partner:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Partner not found"
                )
            update_fields['partner_id'] = ObjectId(update_data.partner_id)
            update_fields['partner_name'] = partner['name']
            if booking['status'] in ['pending', 'unassigned']:
                update_fields['status'] = 'assigned'
                update_fields['partner_assigned_at'] = datetime.utcnow()
        else:
            # Unassign partner
            update_fields['partner_id'] = None
            update_fields['partner_name'] = None
            if booking['status'] == 'assigned':
                update_fields['status'] = 'unassigned'

    if update_fields:
        result = db.bookings.update_one(
            {'_id': ObjectId(booking_id)},
            {'$set': update_fields}
        )
        if result.modified_count == 0:
            return {"message": "No changes made or failed to update booking"}

    return {"message": "Booking updated successfully"}


@router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, current_user: dict = Depends(require_role("admin"))):
    """Delete a booking (admin only)"""
    db = get_database()

    booking = db.bookings.find_one({'_id': ObjectId(booking_id)})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    result = db.bookings.delete_one({'_id': ObjectId(booking_id)})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete booking"
        )

    return {"message": "Booking deleted successfully"}


@router.put("/bookings/{booking_id}/assign")
async def assign_booking(
    booking_id: str,
    assignment_data: AssignBookingRequest,
    current_user: dict = Depends(require_role("admin"))
):
    """Manually assign a booking to a partner (admin only)"""
    db = get_database()

    # Verify booking exists
    booking = db.bookings.find_one({'_id': ObjectId(booking_id)})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    # Verify partner exists and is available
    partner = db.users.find_one({
        '_id': ObjectId(assignment_data.partner_id),
        'role': 'partner',
        'status': 'active'
    })
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner not found or not active"
        )

    # Update booking with partner assignment
    result = db.bookings.update_one(
        {'_id': ObjectId(booking_id)},
        {
            '$set': {
                'partner_id': ObjectId(assignment_data.partner_id),
                'partner_name': partner['name'],
                'status': 'assigned',
                'partner_assigned_at': datetime.utcnow()
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign booking"
        )

    # Send notifications
    try:
        # Notify customer that partner was assigned
        notify_booking_assigned(str(booking['customer_id']), booking_id, partner['name'])

        # Notify partner of new booking
        notify_partner_new_booking(assignment_data.partner_id, booking_id, booking['customer_name'])
    except Exception as e:
        print(f"Failed to send booking assignment notifications: {e}")

    return {"message": "Booking assigned successfully"}


@router.post("/bookings/assign-pending")
async def assign_pending_bookings(current_user: dict = Depends(require_role("admin"))):
    """Auto-assign all pending bookings (admin only)"""
    db = get_database()

    pending_bookings = list(db.bookings.find({'status': 'pending'}))
    assigned_count = 0

    for booking in pending_bookings:
        assign_booking_to_partner(str(booking['_id']))
        assigned_count += 1

    return {
        "message": f"Attempted to assign {assigned_count} pending bookings",
        "assigned_count": assigned_count
    }


# Statistics
@router.get("/stats")
async def get_stats(current_user: dict = Depends(require_role("admin"))):
    """Get system statistics (admin only)"""
    db = get_database()

    stats = {
        'total_users': db.users.count_documents({}),
        'total_customers': db.users.count_documents({'role': 'customer'}),
        'total_partners': db.users.count_documents({'role': 'partner'}),
        'total_bookings': db.bookings.count_documents({}),
        'pending_bookings': db.bookings.count_documents({'status': 'pending'}),
        'completed_bookings': db.bookings.count_documents({'status': 'completed'}),
    }

    return stats
