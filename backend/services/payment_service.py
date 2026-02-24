import stripe
from datetime import datetime
from bson import ObjectId
from database.mongodb import get_database
from config import settings

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session_for_booking(
    customer_id: str,
    customer_name: str,
    customer_email: str,
    customer_location: dict,
    service_type: str,
    scheduled_date: str,
    service_address: str,
    latitude: float,
    longitude: float,
    notes: str,
    price: float,
    success_url: str,
    cancel_url: str
) -> dict:
    """Create Stripe Checkout session for booking and payment"""
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            customer_email=customer_email,
            line_items=[{
                'price_data': {
                    'currency': settings.CURRENCY,
                    'product_data': {
                        'name': f"{service_type.title()} Bin Cleaning",
                        'description': f"Scheduled for {scheduled_date}",
                    },
                    'unit_amount': int(price * 100),  # Convert to cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'customer_id': customer_id,
                'customer_name': customer_name,
                'service_type': service_type,
                'scheduled_date': scheduled_date,
                'service_address': service_address,
                'service_latitude': str(latitude),
                'service_longitude': str(longitude),
                'notes': notes,
                'price': str(price),
                'customer_location_lat': str(customer_location['coordinates'][1]),
                'customer_location_lng': str(customer_location['coordinates'][0])
            }
        )
        return {'session_id': checkout_session.id, 'url': checkout_session.url}
    except stripe.error.StripeError as e:
        raise Exception(f"Stripe error: {str(e)}")


def create_payment_intent(booking_id: str, customer_id: str) -> dict:
    """Create Stripe Payment Intent for a booking"""
    db = get_database()
    booking = db.bookings.find_one({'_id': ObjectId(booking_id)})

    if not booking:
        raise Exception("Booking not found")

    if booking['customer_id'] != ObjectId(customer_id):
        raise Exception("Unauthorized")

    # Check for existing pending transaction
    existing_transaction = db.transactions.find_one({
        'booking_id': ObjectId(booking_id),
        'status': 'pending'
    })

    if existing_transaction:
        return {
            'client_secret': existing_transaction['stripe_client_secret'],
            'transaction_id': str(existing_transaction['_id'])
        }

    # Create new payment intent
    amount_cents = int(booking['price'] * 100)

    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=settings.CURRENCY,
            metadata={
                'booking_id': booking_id,
                'customer_id': customer_id,
                'service_type': booking['service_type']
            }
        )

        # Create transaction record
        transaction_data = {
            'booking_id': ObjectId(booking_id),
            'customer_id': ObjectId(customer_id),
            'stripe_payment_intent_id': payment_intent.id,
            'stripe_client_secret': payment_intent.client_secret,
            'amount': booking['price'],
            'currency': settings.CURRENCY,
            'status': 'pending',
            'service_type': booking['service_type'],
            'payment_method': 'stripe'
        }

        result = db.transactions.insert_one(transaction_data)

        return {
            'client_secret': payment_intent.client_secret,
            'transaction_id': str(result.inserted_id)
        }
    except stripe.error.StripeError as e:
        raise Exception(f"Stripe error: {str(e)}")


def process_refund(transaction_id: str, reason: str = "requested_by_customer") -> dict:
    """Process a refund for a transaction"""
    db = get_database()
    transaction = db.transactions.find_one({'_id': ObjectId(transaction_id)})

    if not transaction:
        raise Exception("Transaction not found")

    if transaction['status'] != 'completed':
        raise Exception("Can only refund completed transactions")

    try:
        # Create refund in Stripe
        refund = stripe.Refund.create(
            payment_intent=transaction['stripe_payment_intent_id'],
            reason=reason
        )

        # Update transaction status
        db.transactions.update_one(
            {'_id': ObjectId(transaction_id)},
            {
                '$set': {
                    'status': 'refunded',
                    'stripe_refund_id': refund.id,
                    'refund_reason': reason,
                    'refund_amount': refund.amount / 100
                }
            }
        )

        # Update booking status
        db.bookings.update_one(
            {'_id': transaction['booking_id']},
            {
                '$set': {
                    'payment_status': 'refunded',
                    'refunded_at': datetime.utcnow()
                }
            }
        )

        return {'refund_id': refund.id, 'message': 'Refund processed successfully'}
    except stripe.error.StripeError as e:
        raise Exception(f"Stripe error: {str(e)}")
