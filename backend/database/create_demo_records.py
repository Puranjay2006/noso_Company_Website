"""
MongoDB Demo Data Creation Script
Creates demo users, categories, and services for testing

Demo Users Created:
1. Admin User
   - Email: admin@noso.com
   - Password: admin123

2. Partner User
   - Email: partner@noso.com
   - Password: partner123

3. Customer User
   - Email: customer@noso.com
   - Password: customer123
"""

import sys
import os
from datetime import datetime, timezone
from pymongo import MongoClient
from bson import ObjectId

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings
from utils.security import get_password_hash


def create_demo_data():
    """Create demo data in MongoDB"""
    
    # Connect to MongoDB
    print("🔌 Connecting to MongoDB...")
    client = MongoClient(settings.MONGO_URI)
    db = client[settings.DB_NAME]
    print(f"✅ Connected to database: {settings.DB_NAME}")
    
    # Clear existing demo data (optional - comment out if you want to keep existing data)
    print("\n🧹 Clearing existing demo data...")
    db.users.delete_many({"email": {"$in": ["admin@noso.com", "partner@noso.com", "customer@noso.com"]}})
    db.categories.delete_many({"name": "Cleaning Services"})
    db.services.delete_many({"title": {"$in": ["Bathroom Cleaning", "Bins Cleaning"]}})
    print("✅ Cleared existing demo data")
    
    # ============================================================================
    # CREATE DEMO USERS
    # ============================================================================
    
    print("\n👥 Creating demo users...")
    
    # 1. ADMIN USER
    # Email: admin@noso.com
    # Password: admin123
    admin_user = {
        "_id": ObjectId(),
        "email": "admin@noso.com",
        "password": get_password_hash("admin123"),
        "role": "admin",
        "name": "Admin User",
        "phone": "+64 21 123 4567",
        "address": "123 Admin Street, Auckland, New Zealand",
        "location": {
            "type": "Point",
            "coordinates": [174.7633, -36.8485]  # Auckland coordinates
        },
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    db.users.insert_one(admin_user)
    print(f"✅ Created Admin User - Email: admin@noso.com | Password: admin123")
    
    # 2. PARTNER USER
    # Email: partner@noso.com
    # Password: partner123
    partner_user = {
        "_id": ObjectId(),
        "email": "partner@noso.com",
        "password": get_password_hash("partner123"),
        "role": "partner",
        "name": "John's Cleaning Services",
        "phone": "+64 21 234 5678",
        "address": "456 Partner Avenue, Wellington, New Zealand",
        "location": {
            "type": "Point",
            "coordinates": [174.7762, -41.2865]  # Wellington coordinates
        },
        "status": "active",
        "availability": True,
        "business_type": "Independent Contractor",
        "experience": "5+ years of professional cleaning experience",
        "equipment": [
            "Pressure Washer",
            "Industrial Vacuum",
            "Cleaning Chemicals",
            "Safety Equipment"
        ],
        "service_area": "Wellington Region",
        "commission_percentage": 20.0,
        "created_at": datetime.now(timezone.utc)
    }
    db.users.insert_one(partner_user)
    print(f"✅ Created Partner User - Email: partner@noso.com | Password: partner123")
    
    # 3. CUSTOMER USER
    # Email: customer@noso.com
    # Password: customer123
    customer_user = {
        "_id": ObjectId(),
        "email": "customer@noso.com",
        "password": get_password_hash("customer123"),
        "role": "customer",
        "name": "Sarah Johnson",
        "phone": "+64 21 345 6789",
        "address": "789 Customer Road, Christchurch, New Zealand",
        "location": {
            "type": "Point",
            "coordinates": [172.6362, -43.5321]  # Christchurch coordinates
        },
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    db.users.insert_one(customer_user)
    print(f"✅ Created Customer User - Email: customer@noso.com | Password: customer123")
    
    # ============================================================================
    # CREATE CATEGORY
    # ============================================================================
    
    print("\n📁 Creating service categories...")
    
    # Clear existing categories and services
    db.categories.delete_many({})
    db.services.delete_many({})
    
    # 1. CLEANING SERVICES CATEGORY
    cleaning_category = {
        "_id": ObjectId(),
        "name": "Cleaning Services",
        "description": "Professional cleaning services for homes and businesses",
        "image": None,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    cleaning_result = db.categories.insert_one(cleaning_category)
    cleaning_category_id = str(cleaning_result.inserted_id)
    print(f"✅ Created Category: Cleaning Services (ID: {cleaning_category_id})")
    
    # 2. LAWN & GARDEN CATEGORY
    lawn_category = {
        "_id": ObjectId(),
        "name": "Lawn & Garden",
        "description": "Professional lawn care and garden maintenance services",
        "image": None,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    lawn_result = db.categories.insert_one(lawn_category)
    lawn_category_id = str(lawn_result.inserted_id)
    print(f"✅ Created Category: Lawn & Garden (ID: {lawn_category_id})")
    
    # 3. HOME MAINTENANCE CATEGORY
    maintenance_category = {
        "_id": ObjectId(),
        "name": "Home Maintenance",
        "description": "General home maintenance and repair services",
        "image": None,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    maintenance_result = db.categories.insert_one(maintenance_category)
    maintenance_category_id = str(maintenance_result.inserted_id)
    print(f"✅ Created Category: Home Maintenance (ID: {maintenance_category_id})")
    
    # 4. PEST CONTROL CATEGORY
    pest_category = {
        "_id": ObjectId(),
        "name": "Pest Control",
        "description": "Professional pest control and prevention services",
        "image": None,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    pest_result = db.categories.insert_one(pest_category)
    pest_category_id = str(pest_result.inserted_id)
    print(f"✅ Created Category: Pest Control (ID: {pest_category_id})")
    
    # ============================================================================
    # CREATE SERVICES
    # ============================================================================
    
    print("\n🛠️  Creating demo services...")
    
    services_to_create = [
        # ============================================================================
        # CLEANING SERVICES
        # ============================================================================
        {
            "title": "House Cleaning",
            "description": "Complete house cleaning service for all rooms. Our trained professionals dust, vacuum, mop, and sanitize your living spaces, bedrooms, and common areas. Includes surface wiping, trash removal, and general tidying.",
            "price": 0.00,
            "category_id": cleaning_category_id,
            "category_name": "Cleaning Services",
            "tags": ["house", "cleaning", "residential", "regular", "weekly"],
            "image": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
            "is_active": True,
        },
        {
            "title": "Deep Cleaning",
            "description": "Intensive top-to-bottom cleaning for your entire home. Reaches hidden corners, behind appliances, inside cabinets, and tackles built-up grime. Ideal for spring cleaning or move-in preparation.",
            "price": 0.00,
            "category_id": cleaning_category_id,
            "category_name": "Cleaning Services",
            "tags": ["deep clean", "intensive", "thorough", "spring cleaning"],
            "image": "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800",
            "is_active": True,
        },
        {
            "title": "Kitchen Cleaning",
            "description": "Professional kitchen deep clean including stovetop, oven, counters, cabinets, and appliances. We degrease surfaces, sanitize prep areas, and leave your kitchen spotless and hygienic.",
            "price": 0.00,
            "category_id": cleaning_category_id,
            "category_name": "Cleaning Services",
            "tags": ["kitchen", "cleaning", "grease", "appliances", "sanitization"],
            "image": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
            "is_active": True,
        },
        {
            "title": "Bathroom Cleaning",
            "description": "Complete bathroom sanitization including toilets, showers, bathtubs, sinks, mirrors, and floors. We remove soap scum, limescale, and mold using eco-friendly disinfectants.",
            "price": 0.00,
            "category_id": cleaning_category_id,
            "category_name": "Cleaning Services",
            "tags": ["bathroom", "cleaning", "sanitization", "disinfection"],
            "image": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800",
            "is_active": True,
        },
        {
            "title": "Window Cleaning",
            "description": "Crystal clear windows inside and out. We clean glass, frames, tracks, and screens. Professional streak-free finish using specialized equipment for hard-to-reach areas.",
            "price": 0.00,
            "category_id": cleaning_category_id,
            "category_name": "Cleaning Services",
            "tags": ["window", "glass", "cleaning", "exterior", "interior"],
            "image": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800",
            "is_active": True,
        },
        {
            "title": "Carpet Cleaning",
            "description": "Professional carpet steam cleaning to remove deep stains, allergens, and odors. Hot water extraction method kills bacteria and dust mites, extending carpet life and improving air quality.",
            "price": 0.00,
            "category_id": cleaning_category_id,
            "category_name": "Cleaning Services",
            "tags": ["carpet", "steam", "cleaning", "stain removal", "allergens"],
            "image": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800",
            "is_active": True,
        },
        {
            "title": "End of Tenancy Cleaning",
            "description": "Comprehensive move-out/bond cleaning to ensure full deposit return. Covers all rooms, appliances, carpets, and fixtures. Meet real estate inspection standards with our thorough service.",
            "price": 0.00,
            "category_id": cleaning_category_id,
            "category_name": "Cleaning Services",
            "tags": ["bond", "tenancy", "move-out", "rental", "inspection"],
            "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
            "is_active": True,
        },
        {
            "title": "Office Cleaning",
            "description": "Professional commercial cleaning for offices and workspaces. Includes desk sanitization, floor care, kitchen areas, restrooms, and common spaces. Flexible scheduling to minimize business disruption.",
            "price": 0.00,
            "category_id": cleaning_category_id,
            "category_name": "Cleaning Services",
            "tags": ["office", "commercial", "business", "workspace", "corporate"],
            "image": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
            "is_active": True,
        },
        {
            "title": "Oven Cleaning",
            "description": "Deep oven and stovetop cleaning to remove baked-on grease and carbon deposits. We clean racks, trays, door glass, and hood filters. Safe, non-toxic products that leave no chemical residue.",
            "price": 0.00,
            "category_id": cleaning_category_id,
            "category_name": "Cleaning Services",
            "tags": ["oven", "stove", "grease", "kitchen", "appliance"],
            "image": "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800",
            "is_active": True,
        },
        {
            "title": "Upholstery Cleaning",
            "description": "Professional cleaning for sofas, chairs, and fabric furniture. Steam cleaning removes stains, odors, and allergens from upholstery. Safe for most fabrics with quick drying time.",
            "price": 0.00,
            "category_id": cleaning_category_id,
            "category_name": "Cleaning Services",
            "tags": ["upholstery", "sofa", "furniture", "fabric", "steam"],
            "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
            "is_active": True,
        },
        
        # ============================================================================
        # LAWN & GARDEN SERVICES
        # ============================================================================
        {
            "title": "Lawn Mowing",
            "description": "Regular lawn maintenance with precision mowing, edge trimming, and clippings removal. We maintain optimal grass height for a healthy, lush lawn all year round.",
            "price": 0.00,
            "category_id": lawn_category_id,
            "category_name": "Lawn & Garden",
            "tags": ["lawn", "mowing", "grass", "trimming", "regular"],
            "image": "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800",
            "is_active": True,
        },
        {
            "title": "Garden Maintenance",
            "description": "Complete garden care including weeding, pruning, mulching, and plant care. We maintain flower beds, remove dead plants, and keep your garden looking beautiful throughout the seasons.",
            "price": 0.00,
            "category_id": lawn_category_id,
            "category_name": "Lawn & Garden",
            "tags": ["garden", "weeding", "pruning", "plants", "maintenance"],
            "image": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800",
            "is_active": True,
        },
        {
            "title": "Hedge Trimming",
            "description": "Professional hedge and shrub shaping to maintain neat boundaries. We trim, shape, and remove cuttings. Regular maintenance keeps hedges dense, healthy, and looking their best.",
            "price": 0.00,
            "category_id": lawn_category_id,
            "category_name": "Lawn & Garden",
            "tags": ["hedge", "trimming", "shrubs", "shaping", "boundaries"],
            "image": "https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800",
            "is_active": True,
        },
        {
            "title": "Tree Pruning",
            "description": "Safe tree trimming and branch removal by trained professionals. We prune for health, shape, and safety. Includes cleanup and disposal of all cuttings and debris.",
            "price": 0.00,
            "category_id": lawn_category_id,
            "category_name": "Lawn & Garden",
            "tags": ["tree", "pruning", "trimming", "branches", "safety"],
            "image": "https://images.unsplash.com/photo-1598902468171-2a85fd30f2b0?w=800",
            "is_active": True,
        },
        {
            "title": "Landscaping",
            "description": "Garden design and landscaping services to transform your outdoor space. From planting to hardscaping, we create beautiful, functional gardens tailored to your vision and lifestyle.",
            "price": 0.00,
            "category_id": lawn_category_id,
            "category_name": "Lawn & Garden",
            "tags": ["landscaping", "design", "garden", "outdoor", "planting"],
            "image": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800",
            "is_active": True,
        },
        {
            "title": "Leaf Removal",
            "description": "Seasonal leaf cleanup and removal service. We clear fallen leaves from lawns, gardens, driveways, and gutters. Proper disposal included to keep your property tidy and prevent lawn damage.",
            "price": 0.00,
            "category_id": lawn_category_id,
            "category_name": "Lawn & Garden",
            "tags": ["leaf", "removal", "autumn", "cleanup", "seasonal"],
            "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
            "is_active": True,
        },
        
        # ============================================================================
        # HOME MAINTENANCE SERVICES
        # ============================================================================
        {
            "title": "Handyman Services",
            "description": "General repairs and fixes around your home. From minor repairs to installations, our skilled handymen handle shelving, door repairs, furniture assembly, and more.",
            "price": 0.00,
            "category_id": maintenance_category_id,
            "category_name": "Home Maintenance",
            "tags": ["handyman", "repairs", "fixes", "installations", "general"],
            "image": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
            "is_active": True,
        },
        {
            "title": "Gutter Cleaning",
            "description": "Clear blocked gutters and downpipes to prevent water damage. We remove leaves, debris, and buildup, then flush the system to ensure proper drainage and protect your property.",
            "price": 0.00,
            "category_id": maintenance_category_id,
            "category_name": "Home Maintenance",
            "tags": ["gutter", "cleaning", "drainage", "maintenance", "exterior"],
            "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
            "is_active": True,
        },
        {
            "title": "Pressure Washing",
            "description": "High-pressure cleaning for driveways, decks, patios, and exterior surfaces. Removes dirt, moss, algae, and stains to restore surfaces to like-new condition.",
            "price": 0.00,
            "category_id": maintenance_category_id,
            "category_name": "Home Maintenance",
            "tags": ["pressure", "washing", "driveway", "deck", "exterior"],
            "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
            "is_active": True,
        },
        {
            "title": "Painting",
            "description": "Interior and exterior painting services for homes and businesses. Professional preparation, quality paints, and clean finishes. Transform any room or refresh your home's exterior.",
            "price": 0.00,
            "category_id": maintenance_category_id,
            "category_name": "Home Maintenance",
            "tags": ["painting", "interior", "exterior", "walls", "refresh"],
            "image": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800",
            "is_active": True,
        },
        {
            "title": "Furniture Assembly",
            "description": "Expert assembly of flat-pack furniture from IKEA, Bunnings, and more. We bring tools and expertise to assemble beds, wardrobes, desks, and shelving units quickly and correctly.",
            "price": 0.00,
            "category_id": maintenance_category_id,
            "category_name": "Home Maintenance",
            "tags": ["furniture", "assembly", "ikea", "flat-pack", "installation"],
            "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
            "is_active": True,
        },
        
        # ============================================================================
        # PEST CONTROL SERVICES
        # ============================================================================
        {
            "title": "General Pest Control",
            "description": "Treatment for common household pests including ants, spiders, cockroaches, and silverfish. Safe, effective solutions for your home with lasting protection.",
            "price": 0.00,
            "category_id": pest_category_id,
            "category_name": "Pest Control",
            "tags": ["pest", "ants", "spiders", "cockroaches", "treatment"],
            "image": "https://images.unsplash.com/photo-1586486942498-4aa5a8c4f7f1?w=800",
            "is_active": True,
        },
        {
            "title": "Rodent Control",
            "description": "Professional mice and rat removal and prevention. We identify entry points, set traps, and seal gaps to eliminate infestations and prevent future problems.",
            "price": 0.00,
            "category_id": pest_category_id,
            "category_name": "Pest Control",
            "tags": ["rodent", "mice", "rats", "removal", "prevention"],
            "image": "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800",
            "is_active": True,
        },
        {
            "title": "Termite Inspection",
            "description": "Comprehensive termite detection and treatment. Our experts inspect your property, identify infestations, and provide effective treatment plans to protect your home's structure.",
            "price": 0.00,
            "category_id": pest_category_id,
            "category_name": "Pest Control",
            "tags": ["termite", "inspection", "treatment", "wood", "protection"],
            "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
            "is_active": True,
        },
        {
            "title": "Flea Treatment",
            "description": "Home flea treatment to eliminate infestations from carpets, furniture, and pet areas. Safe for families and pets with thorough coverage for complete eradication.",
            "price": 0.00,
            "category_id": pest_category_id,
            "category_name": "Pest Control",
            "tags": ["flea", "treatment", "pets", "carpet", "home"],
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
            "is_active": True,
        },
    ]
    
    for service_data in services_to_create:
        service = {
            "_id": ObjectId(),
            "title": service_data["title"],
            "description": service_data["description"],
            "price": service_data["price"],
            "category_id": service_data["category_id"],
            "category_name": service_data["category_name"],
            "tags": service_data["tags"],
            "image": service_data["image"],
            "is_active": service_data["is_active"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        result = db.services.insert_one(service)
        print(f"✅ Created Service: {service_data['title']} - ${service_data['price']:.2f}")
    
    # ============================================================================
    # SUMMARY
    # ============================================================================
    
    print("\n" + "="*70)
    print("🎉 DEMO DATA CREATION COMPLETE!")
    print("="*70)
    
    print("\n📝 LOGIN CREDENTIALS:\n")
    
    print("🔑 ADMIN USER:")
    print("   Email:    admin@noso.com")
    print("   Password: admin123")
    print("   Role:     Administrator\n")
    
    print("🔑 PARTNER USER:")
    print("   Email:    partner@noso.com")
    print("   Password: partner123")
    print("   Role:     Service Partner\n")
    
    print("🔑 CUSTOMER USER:")
    print("   Email:    customer@noso.com")
    print("   Password: customer123")
    print("   Role:     Customer\n")
    
    print("📦 SERVICES CREATED:")
    print(f"   • {len(services_to_create)} services across 4 categories\n")
    
    print("🏷️  CATEGORIES CREATED:")
    print("   • Cleaning Services (10 services)")
    print("   • Lawn & Garden (6 services)")
    print("   • Home Maintenance (5 services)")
    print("   • Pest Control (4 services)\n")
    
    print("="*70)
    print("✅ You can now login with any of the demo accounts to test the application!")
    print("="*70)
    
    # Close connection
    client.close()
    print("\n✅ Database connection closed")


if __name__ == "__main__":
    try:
        create_demo_data()
    except Exception as e:
        print(f"\n❌ Error creating demo data: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
