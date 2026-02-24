from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId
from database.mongodb import get_database
from utils.schemas import UserResponse, UserUpdate
from utils.dependencies import get_current_user, require_role
from utils.serializers import serialize_list, serialize_doc

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=List[UserResponse])
async def list_customers(current_user: dict = Depends(require_role("admin"))):
    """List all customers (admin only)"""
    db = get_database()
    customers = list(db.users.find({'role': 'customer'}))

    # Remove password field for security
    for customer in customers:
        if 'password' in customer:
            del customer['password']

    return serialize_list(customers)


@router.get("/me", response_model=UserResponse)
async def get_customer_profile(current_user: dict = Depends(require_role("customer"))):
    """Get current customer's profile"""
    # Remove password field
    if 'password' in current_user:
        del current_user['password']

    return serialize_doc(current_user)


@router.put("/me")
async def update_customer_profile(
    update_data: UserUpdate,
    current_user: dict = Depends(require_role("customer"))
):
    """Update current customer's profile"""
    db = get_database()

    # Check if email is being changed and if it already exists
    if update_data.email:
        existing_user = db.users.find_one({'email': update_data.email})
        if existing_user and existing_user['_id'] != current_user['_id']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )

    update_fields = {}
    if update_data.name:
        update_fields['name'] = update_data.name
    if update_data.email:
        update_fields['email'] = update_data.email
    if update_data.phone:
        update_fields['phone'] = update_data.phone
    if update_data.address:
        update_fields['address'] = update_data.address

    # Handle coordinates for location update
    if update_data.latitude is not None and update_data.longitude is not None:
        update_fields['location'] = {
            'type': 'Point',
            'coordinates': [update_data.longitude, update_data.latitude]
        }

    if update_fields:
        db.users.update_one(
            {'_id': current_user['_id']},
            {'$set': update_fields}
        )

    return {"message": "Profile updated successfully"}


@router.get("/{customer_id}", response_model=UserResponse)
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    """Get customer details"""
    db = get_database()
    role = current_user.get('role')
    user_id = current_user.get('_id')

    # Admin can access any customer
    if role == 'admin':
        customer = db.users.find_one({'_id': ObjectId(customer_id), 'role': 'customer'})
    elif role == 'partner':
        # Partner can only access customer info for their assigned jobs
        booking = db.bookings.find_one({
            'customer_id': ObjectId(customer_id),
            'partner_id': user_id
        })
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied - customer not associated with your jobs"
            )

        customer = db.users.find_one({'_id': ObjectId(customer_id), 'role': 'customer'})
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    # Remove password field
    if 'password' in customer:
        del customer['password']

    return serialize_doc(customer)


@router.put("/{customer_id}")
async def update_customer(
    customer_id: str,
    update_data: UserUpdate,
    current_user: dict = Depends(require_role("admin"))
):
    """Update customer (admin only)"""
    db = get_database()

    # Check if email is being changed and if it already exists
    if update_data.email:
        existing_user = db.users.find_one({'email': update_data.email})
        if existing_user and str(existing_user['_id']) != customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )

    update_fields = {}
    if update_data.name:
        update_fields['name'] = update_data.name
    if update_data.email:
        update_fields['email'] = update_data.email
    if update_data.phone:
        update_fields['phone'] = update_data.phone
    if update_data.address:
        update_fields['address'] = update_data.address
    if update_data.status:
        update_fields['status'] = update_data.status.value

    if update_fields:
        result = db.users.update_one(
            {'_id': ObjectId(customer_id)},
            {'$set': update_fields}
        )
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update customer"
            )

    return {"message": "Customer updated successfully"}
