from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============================================================================
# AUTH SCHEMAS
# ============================================================================

class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data"""
    user_id: str
    email: str
    role: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserRole(str, Enum):
    """User role enum"""
    CUSTOMER = "customer"
    PARTNER = "partner"
    ADMIN = "admin"


class UserStatus(str, Enum):
    """User status enum"""
    ACTIVE = "active"
    PENDING = "pending"
    INACTIVE = "inactive"


class LocationSchema(BaseModel):
    """GeoJSON Point location"""
    type: str = "Point"
    coordinates: List[float] = Field(..., min_length=2, max_length=2)

    class Config:
        json_schema_extra = {
            "example": {
                "type": "Point",
                "coordinates": [-0.1276, 51.5074]  # [longitude, latitude]
            }
        }


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerCreate(UserBase):
    """Customer registration schema"""
    password: str
    role: UserRole = UserRole.CUSTOMER
    coordinates: Optional[List[float]] = None


class PartnerCreate(UserBase):
    """Partner registration schema"""
    password: str
    role: UserRole = UserRole.PARTNER
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    business_type: Optional[str] = None
    experience: Optional[str] = None
    equipment: Optional[List[str]] = None
    service_area: Optional[str] = None
    commission_percentage: float = Field(default=15.0, ge=0, le=100)


class UserCreate(UserBase):
    """General user creation (admin only)"""
    password: str
    role: UserRole
    status: Optional[UserStatus] = UserStatus.ACTIVE
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability: Optional[bool] = None
    business_type: Optional[str] = None
    experience: Optional[str] = None
    equipment: Optional[List[str]] = None
    service_area: Optional[str] = None
    commission_percentage: Optional[float] = Field(default=15.0, ge=0, le=100)


class UserUpdate(BaseModel):
    """User update schema"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[UserStatus] = None
    availability: Optional[bool] = None
    business_type: Optional[str] = None
    commission_percentage: Optional[float] = Field(None, ge=0, le=100)


class PartnerUpdate(BaseModel):
    """Partner profile update schema"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability: Optional[bool] = None
    commission_percentage: Optional[float] = Field(None, ge=0, le=100)


class UserResponse(BaseModel):
    """User response schema"""
    id: str = Field(alias="_id")
    email: EmailStr
    name: str
    role: UserRole
    status: UserStatus
    phone: Optional[str] = None
    address: Optional[str] = None
    location: Optional[LocationSchema] = None
    created_at: datetime
    availability: Optional[bool] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class PartnerResponse(UserResponse):
    """Partner response schema with additional fields"""
    business_type: Optional[str] = None
    experience: Optional[str] = None
    equipment: Optional[List[str]] = None
    service_area: Optional[str] = None
    commission_percentage: Optional[float] = None


# ============================================================================
# CATEGORY SCHEMAS
# ============================================================================

class CategoryCreate(BaseModel):
    """Schema for creating a new category"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: bool = True


class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryResponse(BaseModel):
    """Schema for category response"""
    id: str = Field(..., alias="_id")
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


# ============================================================================
# SERVICE SCHEMAS
# ============================================================================

class ServiceCreate(BaseModel):
    """Schema for creating a new service"""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    price: float = Field(..., gt=0)
    category_id: str
    tags: List[str] = []
    image: Optional[str] = None
    is_active: bool = True


class ServiceUpdate(BaseModel):
    """Schema for updating a service"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    category_id: Optional[str] = None
    tags: Optional[List[str]] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None


class ServiceResponse(BaseModel):
    """Schema for service response"""
    id: str = Field(..., alias="_id")
    title: str
    description: str
    price: float
    category_id: str
    category_name: Optional[str] = None
    tags: List[str]
    image: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


# ============================================================================
# CART SCHEMAS
# ============================================================================

class CartItemCreate(BaseModel):
    """Schema for adding item to cart"""
    service_id: str
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    """Schema for updating cart item quantity"""
    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    """Schema for cart item response"""
    id: str
    user_id: str
    service_id: str
    service_title: Optional[str] = None
    service_price: Optional[float] = None
    service_image: Optional[str] = None
    quantity: int
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


class CartSummary(BaseModel):
    """Schema for cart summary"""
    items: list[CartItemResponse]
    total_items: int
    subtotal: float
    total: float


# ============================================================================
# BOOKING SCHEMAS
# ============================================================================

class BookingStatus(str, Enum):
    """Booking status enum"""
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    UNASSIGNED = "unassigned"


class PaymentStatus(str, Enum):
    """Payment status enum"""
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"


class BookingServiceItem(BaseModel):
    """Service item in a booking"""
    service_id: str
    service_title: str
    service_price: float
    service_image: Optional[str] = None
    quantity: int = Field(default=1, ge=1)


class BookingCreate(BaseModel):
    """Booking creation schema (admin only)"""
    customer_id: str
    services: List[BookingServiceItem]
    scheduled_date: datetime
    service_address: str
    service_latitude: Optional[float] = None
    service_longitude: Optional[float] = None
    notes: Optional[str] = ""
    total_price: float
    payment_status: Optional[PaymentStatus] = PaymentStatus.PENDING
    status: Optional[BookingStatus] = BookingStatus.PENDING


class BookAndPayRequest(BaseModel):
    """Book and pay request schema (customer - can create account during checkout)"""
    # User info (for new users or guest checkout)
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None

    # Booking details
    scheduled_date: str
    service_address: str
    latitude: float
    longitude: float
    notes: Optional[str] = ""

    # Cart usage
    use_cart: bool = True
    service_type: str = "custom"


class BookingUpdate(BaseModel):
    """Booking update schema"""
    scheduled_date: Optional[datetime] = None
    service_address: Optional[str] = None
    service_latitude: Optional[float] = None
    service_longitude: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[BookingStatus] = None
    payment_status: Optional[PaymentStatus] = None
    total_price: Optional[float] = None
    partner_id: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    """Booking status update"""
    status: BookingStatus


class RatingCreate(BaseModel):
    """Rating schema for both customer and partner ratings"""
    rating: float = Field(..., ge=0, le=5)
    review_title: Optional[str] = Field(None, max_length=100)
    comment: Optional[str] = ""
    image: Optional[str] = None


class CustomerRating(BaseModel):
    """Customer's rating of partner (embedded in booking)"""
    rating: float
    review_title: Optional[str] = None
    comment: Optional[str] = None
    image: Optional[str] = None
    rated_at: datetime


class PartnerRating(BaseModel):
    """Partner's rating of customer (embedded in booking)"""
    rating: float
    review_title: Optional[str] = None
    comment: Optional[str] = None
    rated_at: datetime


class PartnerDetails(BaseModel):
    """Partner details in booking response"""
    name: str
    phone: Optional[str] = None


class CustomerDetails(BaseModel):
    """Customer details in booking response"""
    name: str
    phone: Optional[str] = None


class BookingResponse(BaseModel):
    """Booking response schema"""
    id: str = Field(alias="_id")
    customer_id: str
    customer_name: str
    customer_location: Optional[LocationSchema] = None
    partner_id: Optional[str] = None
    partner_name: Optional[str] = None
    partner_details: Optional[PartnerDetails] = None
    customer: Optional[CustomerDetails] = None
    service_address: str
    service_location: Optional[LocationSchema] = None
    services: Optional[List[BookingServiceItem]] = None  # Made optional
    service_type: Optional[str] = None  # For simple bookings
    scheduled_date: datetime
    notes: Optional[str] = None
    status: str
    created_at: datetime
    partner_assigned_at: Optional[datetime] = None
    work_started_at: Optional[datetime] = None
    work_completed_at: Optional[datetime] = None

    # Pricing and commission
    total_price: Optional[float] = None  # Made optional
    price: Optional[float] = None  # Alternative field name
    commission_percentage: Optional[float] = None
    commission_amount: Optional[float] = None
    partner_earnings: Optional[float] = None

    # Payment info
    payment_status: str
    paid_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None
    stripe_checkout_session_id: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None

    # Mutual ratings
    customer_rating: Optional[CustomerRating] = None
    partner_rating: Optional[PartnerRating] = None

    # Work images
    before_cleaning_image: Optional[str] = None
    after_cleaning_image: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class AssignBookingRequest(BaseModel):
    """Assign booking to partner request"""
    partner_id: str


class BookingRating(BaseModel):
    """Booking rating schema (legacy - use RatingCreate)"""
    rating: float = Field(..., ge=0, le=5)
    comment: Optional[str] = ""


# ============================================================================
# TRANSACTION SCHEMAS
# ============================================================================

class TransactionStatus(str, Enum):
    """Transaction status enum"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class TransactionResponse(BaseModel):
    """Transaction response schema"""
    _id: str
    booking_id: str
    customer_id: str
    stripe_checkout_session_id: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None
    stripe_refund_id: Optional[str] = None
    amount: float
    currency: str
    status: TransactionStatus
    service_type: str
    payment_method: str
    failure_reason: Optional[str] = None
    refund_reason: Optional[str] = None
    refund_amount: Optional[float] = None
    completed_at: Optional[datetime] = None
    webhook_received_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RefundRequest(BaseModel):
    """Refund request schema"""
    transaction_id: str
    reason: Optional[str] = "requested_by_customer"


class CheckoutSessionResponse(BaseModel):
    """Stripe checkout session response"""
    session_id: str
    url: str


class PaymentStatusResponse(BaseModel):
    """Payment status response"""
    status: str
    booking_id: Optional[str] = None
    message: str


class PaymentIntentResponse(BaseModel):
    """Payment intent response"""
    client_secret: str
    transaction_id: str


# ============================================================================
# NOTIFICATION SCHEMAS
# ============================================================================

class NotificationType(str, Enum):
    """Notification type enum"""
    ACCOUNT = "account"
    BOOKING = "booking"
    PAYMENT = "payment"
    SYSTEM = "system"
    PARTNER = "partner"


class NotificationCreate(BaseModel):
    """Notification creation schema"""
    user_id: str
    title: str
    description: str
    type: NotificationType
    related_id: Optional[str] = None
    metadata: Optional[dict] = None


class NotificationUpdate(BaseModel):
    """Notification update schema"""
    is_read: Optional[bool] = None


class NotificationResponse(BaseModel):
    """Notification response schema"""
    id: str = Field(alias="_id")
    user_id: str
    title: str
    description: str
    type: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    related_id: Optional[str] = None
    metadata: Optional[dict] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
