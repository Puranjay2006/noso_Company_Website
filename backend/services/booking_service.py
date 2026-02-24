from datetime import datetime, timedelta
from bson import ObjectId
from database.mongodb import get_database
from utils.notifications import notify_booking_assigned, notify_partner_new_booking


def assign_booking_to_partner(booking_id: str):
    """
    Auto-assign a booking to the nearest available partner
    Uses geospatial queries and time conflict checking
    """
    db = get_database()
    booking = db.bookings.find_one({'_id': ObjectId(booking_id)})

    if not booking:
        print(f"[ASSIGNMENT] Booking {booking_id} not found.")
        return

    service_location = booking.get('service_location')
    scheduled_date = booking.get('scheduled_date')

    if not service_location or not scheduled_date:
        print(f"[ASSIGNMENT] Booking {booking_id} missing service_location or scheduled_date. Cannot assign.")
        return

    print(f"[ASSIGNMENT] Attempting to assign booking {booking_id} (Service Type: {booking.get('service_type')}, Scheduled: {scheduled_date.isoformat()})")
    print(f"[ASSIGNMENT] Service Location: {service_location.get('coordinates')}")

    # Define search parameters
    max_distance_meters = 50000  # 50 km
    job_duration_hours = 1  # Assume a job takes 1 hour for conflict checking

    # Calculate the time window for the new booking
    new_booking_start = scheduled_date
    new_booking_end = scheduled_date + timedelta(hours=job_duration_hours)
    print(f"[ASSIGNMENT] New booking time window: {new_booking_start.isoformat()} to {new_booking_end.isoformat()}")

    # Find active and available partners, sorted by proximity to service_location
    # and filter out those with time conflicts
    pipeline = [
        {
            '$geoNear': {
                'near': service_location,
                'distanceField': 'distance',
                'maxDistance': max_distance_meters,
                'spherical': True,
                'query': {'role': 'partner', 'status': 'active', 'availability': True}
            }
        },
        {
            '$lookup': {
                'from': 'bookings',
                'localField': '_id',
                'foreignField': 'partner_id',
                'as': 'partner_bookings'
            }
        },
        {
            '$addFields': {
                'has_conflict': {
                    '$anyElementTrue': {
                        '$map': {
                            'input': '$partner_bookings',
                            'as': 'pb',
                            'in': {
                                '$and': [
                                    {'$in': ['$$pb.status', ['assigned', 'in_progress']]},
                                    {'$lt': ['$$pb.scheduled_date', new_booking_end]},
                                    {'$gt': ['$$pb.scheduled_date', {'$subtract': [new_booking_start, job_duration_hours * 60 * 60 * 1000]}]}
                                ]
                            }
                        }
                    }
                }
            }
        },
        {
            '$match': {
                'has_conflict': False
            }
        },
        {'$sort': {'distance': 1}}  # Sort by closest first
    ]

    # Execute the pipeline and get initial candidates
    initial_candidates = list(db.users.aggregate([
        {
            '$geoNear': {
                'near': service_location,
                'distanceField': 'distance',
                'maxDistance': max_distance_meters,
                'spherical': True,
                'query': {'role': 'partner', 'status': 'active', 'availability': True}
            }
        }
    ]))
    print(f"[ASSIGNMENT] Found {len(initial_candidates)} active and available partners within {max_distance_meters / 1000} km.")
    if initial_candidates:
        for p in initial_candidates:
            print(f"  - Partner: {p.get('name')} (ID: {p.get('_id')}), Distance: {p.get('distance'):.2f}m")

    nearby_partners = list(db.users.aggregate(pipeline))
    print(f"[ASSIGNMENT] After checking for time conflicts, {len(nearby_partners)} partners are suitable.")
    if nearby_partners:
        for p in nearby_partners:
            print(f"  - Suitable Partner: {p.get('name')} (ID: {p.get('_id')}), Distance: {p.get('distance'):.2f}m")

    assigned = False
    if nearby_partners:
        partner = nearby_partners[0]  # Get the closest non-conflicting partner
        partner_id = partner['_id']
        partner_name = partner['name']

        result = db.bookings.update_one(
            {'_id': ObjectId(booking_id)},
            {
                '$set': {
                    'partner_id': partner_id,
                    'partner_name': partner_name,
                    'status': 'assigned',
                    'partner_assigned_at': datetime.utcnow()
                }
            }
        )
        if result.modified_count > 0:
            print(f"[ASSIGNMENT] Successfully assigned booking {booking_id} to partner {partner_name} (ID: {partner_id}).")
            assigned = True

            # Send notifications
            try:
                # Notify customer that partner was assigned
                notify_booking_assigned(
                    str(booking['customer_id']),
                    booking_id,
                    partner_name
                )

                # Notify partner of new booking
                notify_partner_new_booking(
                    str(partner_id),
                    booking_id,
                    booking.get('customer_name', 'Customer')
                )
            except Exception as e:
                print(f"[ASSIGNMENT] Failed to send assignment notifications: {e}")
        else:
            print(f"[ASSIGNMENT] Failed to update booking {booking_id} with partner {partner_name} (ID: {partner_id}).")

    if not assigned:
        print(f"[ASSIGNMENT] No suitable partner found for booking {booking_id} based on criteria (distance <= {max_distance_meters / 1000}km, active, available, no time conflicts).")
        # Update booking status to 'unassigned'
        db.bookings.update_one(
            {'_id': ObjectId(booking_id)},
            {'$set': {'status': 'unassigned'}}
        )
        print(f"[ASSIGNMENT] Booking {booking_id} status set to 'unassigned'.")
