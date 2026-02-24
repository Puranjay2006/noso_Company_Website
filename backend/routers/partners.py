from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId
from database.mongodb import get_database
from utils.schemas import UserResponse, PartnerUpdate
from utils.dependencies import get_current_user, require_role
from utils.serializers import serialize_list, serialize_doc

router = APIRouter(prefix="/partners", tags=["Partners"])


@router.get("", response_model=List[UserResponse])
async def list_partners(current_user: dict = Depends(require_role("admin"))):
    """List all partners (admin only)"""
    db = get_database()
    partners = list(db.users.find({'role': 'partner'}))

    # Remove password field for security
    for partner in partners:
        if 'password' in partner:
            del partner['password']

    return serialize_list(partners)


@router.get("/me", response_model=UserResponse)
async def get_partner_profile(current_user: dict = Depends(require_role("partner"))):
    """Get current partner's profile"""
    # Remove password field
    if 'password' in current_user:
        del current_user['password']

    return serialize_doc(current_user)


@router.put("/me")
async def update_partner_profile(
    update_data: PartnerUpdate,
    current_user: dict = Depends(require_role("partner"))
):
    """Update current partner's profile"""
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
    if update_data.availability is not None:
        update_fields['availability'] = update_data.availability

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


@router.put("/me/availability")
async def update_availability(
    availability: bool,
    current_user: dict = Depends(require_role("partner"))
):
    """Update partner availability"""
    db = get_database()

    db.users.update_one(
        {'_id': current_user['_id']},
        {'$set': {'availability': availability}}
    )

    return {"message": "Availability updated successfully"}


@router.get("/{partner_id}", response_model=UserResponse)
async def get_partner(partner_id: str, current_user: dict = Depends(require_role("admin"))):
    """Get partner details (admin only)"""
    db = get_database()
    partner = db.users.find_one({'_id': ObjectId(partner_id), 'role': 'partner'})

    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner not found"
        )

    # Remove password field
    if 'password' in partner:
        del partner['password']

    return serialize_doc(partner)


@router.put("/{partner_id}/approve")
async def approve_partner(partner_id: str, current_user: dict = Depends(require_role("admin"))):
    """Approve a partner (admin only)"""
    db = get_database()

    result = db.users.update_one(
        {'_id': ObjectId(partner_id)},
        {'$set': {'status': 'active'}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to approve partner"
        )

    return {"message": "Partner approved successfully"}


@router.put("/{partner_id}")
async def update_partner(
    partner_id: str,
    update_data: PartnerUpdate,
    current_user: dict = Depends(require_role("admin"))
):
    """Update partner (admin only)"""
    db = get_database()

    # Check if email is being changed and if it already exists
    if update_data.email:
        existing_user = db.users.find_one({'email': update_data.email})
        if existing_user and str(existing_user['_id']) != partner_id:
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
    if update_data.availability is not None:
        update_fields['availability'] = update_data.availability
    if update_data.commission_percentage is not None:
        update_fields['commission_percentage'] = update_data.commission_percentage

    if update_fields:
        result = db.users.update_one(
            {'_id': ObjectId(partner_id)},
            {'$set': update_fields}
        )
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update partner"
            )

    return {"message": "Partner updated successfully"}
