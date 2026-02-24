"""Test login functionality"""
from database.mongodb import get_database, connect_to_mongo
from utils.security import verify_password, get_password_hash

# Connect to MongoDB
connect_to_mongo()
db = get_database()

# Find admin user
user = db.users.find_one({'email': 'admin@noso.com'})

if user:
    print(f"✅ Found user: {user['email']}")
    print(f"   Role: {user['role']}")
    print(f"   Status: {user.get('status')}")
    print(f"   Stored hash: {user['password'][:50]}...")
    
    # Test password verification
    test_password = "admin123"
    is_valid = verify_password(test_password, user['password'])
    print(f"\n🔐 Password verification for '{test_password}': {is_valid}")
    
    # Test with fresh hash
    fresh_hash = get_password_hash(test_password)
    print(f"\n📝 Fresh hash for 'admin123': {fresh_hash[:50]}...")
    is_fresh_valid = verify_password(test_password, fresh_hash)
    print(f"   Fresh hash verification: {is_fresh_valid}")
else:
    print("❌ Admin user not found!")
    print("\nAll users in database:")
    for u in db.users.find():
        print(f"  - {u.get('email')} ({u.get('role')})")
