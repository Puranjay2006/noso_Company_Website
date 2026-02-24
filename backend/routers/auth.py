from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from database.mongodb import get_database
from utils.schemas import LoginRequest, Token, RefreshTokenRequest, CustomerCreate, PartnerCreate, UserResponse
from utils.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from utils.dependencies import get_current_user
from utils.serializers import serialize_doc
from utils.notifications import notify_account_created, notify_login, notify_partner_registration

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_customer(user_data: CustomerCreate):
    """Register a new customer"""
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
        'role': 'customer',
        'name': user_data.name,
        'phone': user_data.phone,
        'address': user_data.address,
        'location': {
            'type': 'Point',
            'coordinates': user_data.coordinates if user_data.coordinates else [0, 0]
        },
        'created_at': datetime.now(timezone.utc),
        'status': 'active'
    }

    result = db.users.insert_one(user_doc)
    user_doc['_id'] = result.inserted_id

    # Send welcome notification
    try:
        notify_account_created(str(result.inserted_id), user_data.name, 'customer')
    except Exception as e:
        print(f"Failed to create notification: {e}")

    return serialize_doc(user_doc)


@router.post("/register/partner", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_partner(user_data: PartnerCreate):
    """Register a new partner"""
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
        'role': 'partner',
        'name': user_data.name,
        'phone': user_data.phone,
        'address': user_data.address,
        'location': {
            'type': 'Point',
            'coordinates': [user_data.longitude or 0, user_data.latitude or 0]
        },
        'created_at': datetime.now(timezone.utc),
        'status': 'pending',  # Partners need approval
        'availability': True,
        'business_type': user_data.business_type,
        'experience': user_data.experience,
        'equipment': user_data.equipment or [],
        'service_area': user_data.service_area,
        'commission_percentage': user_data.commission_percentage  # Default 15% or custom
    }

    result = db.users.insert_one(user_doc)
    user_doc['_id'] = result.inserted_id

    # Send partner registration notification
    try:
        notify_partner_registration(str(result.inserted_id), user_data.name)
    except Exception as e:
        print(f"Failed to create notification: {e}")

    return serialize_doc(user_doc)


@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest):
    """Login and receive JWT tokens"""
    db = get_database()

    # Find user by email
    user = db.users.find_one({'email': credentials.email})

    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Check if account is pending approval
    if user.get('status') == 'pending':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval"
        )

    # Create tokens
    token_data = {
        "sub": str(user['_id']),
        "email": user['email'],
        "role": user['role']
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Send login notification
    try:
        notify_login(str(user['_id']), user['name'])
    except Exception as e:
        print(f"Failed to create login notification: {e}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    token_data = decode_token(request.refresh_token)

    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Verify user still exists and is active
    db = get_database()
    user = db.users.find_one({'_id': ObjectId(token_data.user_id)})

    if not user or user.get('status') != 'active':
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Create new tokens
    new_token_data = {
        "sub": str(user['_id']),
        "email": user['email'],
        "role": user['role']
    }

    access_token = create_access_token(new_token_data)
    new_refresh_token = create_refresh_token(new_token_data)

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user information"""
    return serialize_doc(current_user)
