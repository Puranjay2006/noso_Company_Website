"""
MongoDB Database Management
Handles MongoDB connection, indexes, and document schemas
"""

from pymongo import MongoClient
from pymongo.database import Database
from typing import TypedDict, Optional, List
from datetime import datetime
from config import settings


# ============================================================================
# DATABASE CONNECTION
# ============================================================================

# Global MongoDB client
mongo_client: MongoClient = None
db: Database = None


def connect_to_mongo():
    """Initialize MongoDB connection"""
    global mongo_client, db
    mongo_client = MongoClient(settings.MONGO_URI)
    db = mongo_client[settings.DB_NAME]
    print(f"✅ Connected to MongoDB database: {settings.DB_NAME}")


def close_mongo_connection():
    """Close MongoDB connection"""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("✅ Closed MongoDB connection")


def get_database() -> Database:
    """Get database instance"""
    return db


# ============================================================================
# DATABASE INDEXES
# ============================================================================

def create_indexes():
    """Create all MongoDB indexes"""
    db = get_database()

    print("📝 Creating database indexes...")

    try:
        # Users collection indexes
        db.users.create_index("email", unique=True, name="email_unique")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating users.email index: {e}")

    try:
        db.users.create_index([("location", "2dsphere")], name="location_2dsphere")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating users.location index: {e}")

    try:
        db.users.create_index([
            ("role", 1),
            ("status", 1),
            ("availability", 1)
        ], name="role_status_availability")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating users compound index: {e}")

    # Bookings collection indexes
    try:
        db.bookings.create_index([("service_location", "2dsphere")], name="service_location_2dsphere")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating bookings.service_location index: {e}")

    try:
        db.bookings.create_index([("customer_location", "2dsphere")], name="customer_location_2dsphere")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating bookings.customer_location index: {e}")

    try:
        db.bookings.create_index([
            ("status", 1),
            ("customer_id", 1)
        ], name="status_customer_id")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating bookings status/customer index: {e}")

    try:
        db.bookings.create_index([
            ("partner_id", 1),
            ("status", 1)
        ], name="partner_id_status")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating bookings partner/status index: {e}")

    # Transactions collection indexes
    try:
        db.transactions.create_index("stripe_payment_intent_id", unique=True, sparse=True)
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating transactions.stripe_payment_intent_id index: {e}")

    try:
        db.transactions.create_index("stripe_checkout_session_id", unique=True, sparse=True)
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating transactions.stripe_checkout_session_id index: {e}")

    try:
        db.transactions.create_index([
            ("customer_id", 1),
            ("status", 1)
        ], name="customer_id_status")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating transactions customer/status index: {e}")

    # Categories collection indexes
    try:
        db.categories.create_index("name", unique=True, name="category_name_unique")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating categories.name index: {e}")

    try:
        db.categories.create_index("is_active", name="category_is_active")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating categories.is_active index: {e}")

    # Services collection indexes
    try:
        db.services.create_index("category_id", name="service_category_id")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating services.category_id index: {e}")

    try:
        db.services.create_index("is_active", name="service_is_active")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating services.is_active index: {e}")

    try:
        db.services.create_index([
            ("title", "text"),
            ("description", "text"),
            ("tags", "text")
        ], name="service_text_search")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating services text search index: {e}")

    # Cart items collection indexes
    try:
        db.cart_items.create_index([
            ("user_id", 1),
            ("service_id", 1)
        ], unique=True, name="user_service_unique")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating cart_items compound index: {e}")

    try:
        db.cart_items.create_index("user_id", name="cart_user_id")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating cart_items.user_id index: {e}")

    # Notifications collection indexes
    try:
        db.notifications.create_index([
            ("user_id", 1),
            ("is_read", 1),
            ("created_at", -1)
        ], name="user_read_created")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating notifications compound index: {e}")

    try:
        db.notifications.create_index("user_id", name="notification_user_id")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating notifications.user_id index: {e}")

    try:
        db.notifications.create_index([
            ("type", 1),
            ("created_at", -1)
        ], name="type_created")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"⚠️  Error creating notifications type/created index: {e}")

    print("✅ Database indexes created successfully")


# ============================================================================
# DOCUMENT SCHEMAS (TypedDict for reference)
# MongoDB is schemaless, but this provides reference for expected structure
# ============================================================================

class LocationSchema(TypedDict):
    """GeoJSON Point location"""
    type: str  # "Point"
    coordinates: List[float]  # [longitude, latitude]


class UserDocument(TypedDict, total=False):
    """User document structure"""
    _id: str
    email: str
    password: str  # Hashed
    role: str  # "customer", "partner", "admin"
    name: str
    phone: Optional[str]
    address: Optional[str]
    location: LocationSchema
    status: str  # "active", "pending", "inactive"
    created_at: datetime

    # Partner-specific fields
    availability: Optional[bool]
    business_type: Optional[str]
    experience: Optional[str]
    equipment: Optional[List[str]]
    service_area: Optional[str]
    commission_percentage: Optional[float]


class BookingDocument(TypedDict, total=False):
    """Booking document structure"""
    _id: str
    customer_id: str  # ObjectId as string
    customer_name: str
    customer_location: LocationSchema
    partner_id: Optional[str]  # ObjectId as string
    partner_name: Optional[str]
    service_address: str
    service_location: LocationSchema
    services: List[dict]  # List of BookingServiceItem
    scheduled_date: datetime
    notes: str
    status: str  # "pending", "assigned", "in_progress", "completed", "cancelled", "unassigned"
    created_at: datetime
    partner_assigned_at: Optional[datetime]
    work_started_at: Optional[datetime]
    work_completed_at: Optional[datetime]

    # Pricing and commission
    total_price: float
    commission_percentage: Optional[float]
    commission_amount: Optional[float]
    partner_earnings: Optional[float]

    # Payment
    payment_status: str  # "pending", "paid", "refunded"
    paid_at: Optional[datetime]
    refunded_at: Optional[datetime]
    stripe_checkout_session_id: Optional[str]
    stripe_payment_intent_id: Optional[str]

    # Mutual ratings
    customer_rating: Optional[dict]  # CustomerRating
    partner_rating: Optional[dict]  # PartnerRating

    # Work images
    before_cleaning_image: Optional[str]
    after_cleaning_image: Optional[str]


class TransactionDocument(TypedDict, total=False):
    """Transaction document structure"""
    _id: str
    booking_id: str  # ObjectId as string
    customer_id: str  # ObjectId as string
    stripe_checkout_session_id: Optional[str]
    stripe_payment_intent_id: Optional[str]
    stripe_client_secret: Optional[str]
    stripe_charge_id: Optional[str]
    stripe_refund_id: Optional[str]
    amount: float
    currency: str
    status: str  # "pending", "completed", "failed", "refunded"
    service_type: str
    payment_method: str  # "stripe", "stripe_checkout"
    failure_reason: Optional[str]
    refund_reason: Optional[str]
    refund_amount: Optional[float]
    completed_at: Optional[datetime]
    webhook_received_at: Optional[datetime]


class CategoryDocument(TypedDict, total=False):
    """Category document structure"""
    _id: str
    name: str
    description: Optional[str]
    image: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]


class ServiceDocument(TypedDict, total=False):
    """Service document structure"""
    _id: str
    title: str
    description: str
    price: float
    category_id: str
    tags: List[str]
    image: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]


class CartItemDocument(TypedDict, total=False):
    """Cart item document structure"""
    _id: str
    user_id: str
    service_id: str
    quantity: int
    created_at: datetime


class NotificationDocument(TypedDict, total=False):
    """Notification document structure"""
    _id: str
    user_id: str  # Recipient of the notification
    title: str
    description: str
    type: str  # "account", "booking", "payment", "system", "partner"
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]
    related_id: Optional[str]  # e.g., booking_id, user_id
    metadata: Optional[dict]  # Additional data
