from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import List
from datetime import datetime
from bson import ObjectId
import stripe
from database.mongodb import get_database
from utils.schemas import (
    BookAndPayRequest, TransactionResponse, RefundRequest,
    CheckoutSessionResponse, PaymentStatusResponse, PaymentIntentResponse
)
from utils.dependencies import get_current_user, require_role
from utils.serializers import serialize_list
from services.payment_service import create_checkout_session_for_booking, create_payment_intent, process_refund
from services.booking_service import assign_booking_to_partner
from config import settings
from utils.notifications import notify_booking_created, notify_payment_received

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/book-and-pay", response_model=CheckoutSessionResponse)
async def book_and_pay(
    booking_data: BookAndPayRequest,
    request: Request,
    current_user: dict = Depends(require_role("customer"))
):
    """Create a Stripe Checkout session for booking and payment"""
    db = get_database()

    try:
        # Calculate price from cart items
        user_id = str(current_user['_id'])
        cart_items = list(db.cart_items.find({"user_id": user_id}))
        
        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty"
            )
        
        # Calculate total price from cart
        total_price = 0.0
        for item in cart_items:
            service = db.services.find_one({"_id": ObjectId(item["service_id"])})
            if service:
                total_price += service["price"] * item["quantity"]
        
        if total_price <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid cart total"
            )

        success_url = f"{settings.FRONTEND_URL}/checkout?success=true"
        cancel_url = f"{settings.FRONTEND_URL}/checkout?canceled=true"

        result = create_checkout_session_for_booking(
            customer_id=user_id,
            customer_name=current_user['name'],
            customer_email=current_user['email'],
            customer_location=current_user.get('location', {'type': 'Point', 'coordinates': [0, 0]}),
            service_type=booking_data.service_type,
            scheduled_date=booking_data.scheduled_date,
            service_address=booking_data.service_address,
            latitude=booking_data.latitude,
            longitude=booking_data.longitude,
            notes=booking_data.notes,
            price=total_price,
            success_url=success_url,
            cancel_url=cancel_url
        )

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/status/{session_id}", response_model=PaymentStatusResponse)
async def check_payment_status(
    session_id: str,
    current_user: dict = Depends(require_role("customer"))
):
    """Check if a Stripe Checkout session has been completed and create booking if needed"""
    db = get_database()

    try:
        # Retrieve the checkout session from Stripe
        checkout_session = stripe.checkout.Session.retrieve(session_id)

        if checkout_session.payment_status == 'paid':
            metadata = checkout_session.metadata

            # Check if booking already exists for this session
            existing_booking = db.bookings.find_one({
                'stripe_checkout_session_id': session_id
            })

            if existing_booking:
                return {
                    'status': 'completed',
                    'booking_id': str(existing_booking['_id']),
                    'message': 'Booking already exists'
                }

            # Create booking if payment is successful and booking doesn't exist
            if 'customer_id' in metadata and 'service_type' in metadata:
                # Parse service location coordinates
                service_coordinates = [0, 0]
                if metadata.get('service_longitude') and metadata.get('service_latitude'):
                    try:
                        service_coordinates = [
                            float(metadata['service_longitude']),
                            float(metadata['service_latitude'])
                        ]
                    except (ValueError, TypeError):
                        pass

                # Fetch cart items to include as services in the booking
                customer_id = metadata['customer_id']
                cart_items = list(db.cart_items.find({"user_id": customer_id}))
                
                services = []
                service_names = []
                for item in cart_items:
                    service = db.services.find_one({"_id": ObjectId(item["service_id"])})
                    if service:
                        services.append({
                            'service_id': str(service['_id']),
                            'service_title': service['title'],
                            'service_price': service['price'],
                            'service_image': service.get('image', ''),
                            'quantity': item['quantity']
                        })
                        service_names.append(service['title'])
                
                # Generate service_type from cart items or use metadata
                if services:
                    if len(services) == 1:
                        service_type = services[0]['service_title']
                    else:
                        service_type = f"{len(services)} Services"
                else:
                    service_type = metadata['service_type']

                booking_data = {
                    'customer_id': ObjectId(metadata['customer_id']),
                    'customer_name': metadata['customer_name'],
                    'customer_location': {
                        'type': 'Point',
                        'coordinates': [
                            float(metadata['customer_location_lng']),
                            float(metadata['customer_location_lat'])
                        ]
                    },
                    'service_address': metadata.get('service_address', ''),
                    'service_location': {
                        'type': 'Point',
                        'coordinates': service_coordinates
                    },
                    'service_type': service_type,
                    'services': services,  # Include individual services
                    'scheduled_date': datetime.fromisoformat(metadata['scheduled_date']),
                    'notes': metadata.get('notes', ''),
                    'status': 'pending',
                    'created_at': datetime.utcnow(),
                    'price': float(metadata.get('price', 0)),
                    'payment_status': 'paid',
                    'paid_at': datetime.utcnow(),
                    'stripe_checkout_session_id': session_id,
                    'stripe_payment_intent_id': checkout_session.payment_intent
                }

                result = db.bookings.insert_one(booking_data)
                booking_id = str(result.inserted_id)

                # Send notifications
                try:
                    # Notify customer about booking creation
                    notify_booking_created(metadata['customer_id'], booking_id, metadata['customer_name'])

                    # Notify customer about payment received
                    notify_payment_received(
                        metadata['customer_id'],
                        booking_id,
                        float(metadata.get('price', 0))
                    )
                except Exception as e:
                    print(f"Failed to send booking/payment notifications: {e}")

                assign_booking_to_partner(booking_id)

                # Clear the customer's cart after successful booking
                db.cart_items.delete_many({"user_id": customer_id})

                # Create transaction record
                transaction_data = {
                    'booking_id': ObjectId(booking_id),
                    'customer_id': ObjectId(metadata['customer_id']),
                    'stripe_checkout_session_id': session_id,
                    'stripe_payment_intent_id': checkout_session.payment_intent,
                    'amount': float(metadata.get('price', 0)),
                    'currency': settings.CURRENCY,
                    'status': 'completed',
                    'service_type': metadata['service_type'],
                    'payment_method': 'stripe_checkout',
                    'completed_at': datetime.utcnow()
                }

                db.transactions.insert_one(transaction_data)

                return {
                    'status': 'completed',
                    'booking_id': booking_id,
                    'message': 'Booking created successfully'
                }

        return {
            'status': checkout_session.payment_status,
            'message': f'Payment status: {checkout_session.payment_status}'
        }

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Stripe error: {str(e)}'
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Status check failed: {str(e)}'
        )


@router.post("/create-intent", response_model=PaymentIntentResponse)
async def create_intent(
    booking_id: str,
    current_user: dict = Depends(require_role("customer"))
):
    """Create a Stripe Payment Intent for a booking"""
    try:
        result = create_payment_intent(booking_id, str(current_user['_id']))
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/confirm")
async def confirm_payment(
    payment_intent_id: str,
    current_user: dict = Depends(require_role("customer"))
):
    """Confirm payment completion and update booking status"""
    db = get_database()

    try:
        # Retrieve payment intent from Stripe
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)

        # Get transaction from database
        transaction = db.transactions.find_one({'stripe_payment_intent_id': payment_intent_id})
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )

        # Verify transaction belongs to current user
        if transaction['customer_id'] != current_user['_id']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized"
            )

        if payment_intent.status == 'succeeded':
            # Update transaction status
            db.transactions.update_one(
                {'_id': transaction['_id']},
                {
                    '$set': {
                        'status': 'completed',
                        'stripe_charge_id': payment_intent.latest_charge,
                        'paid_at': datetime.utcnow()
                    }
                }
            )

            # Update booking payment status
            db.bookings.update_one(
                {'_id': transaction['booking_id']},
                {'$set': {'payment_status': 'paid', 'paid_at': datetime.utcnow()}}
            )

            return {
                'message': 'Payment confirmed successfully',
                'transaction_id': str(transaction['_id'])
            }
        else:
            # Payment failed
            failure_reason = payment_intent.last_payment_error.message if payment_intent.last_payment_error else 'Unknown error'
            db.transactions.update_one(
                {'_id': transaction['_id']},
                {'$set': {'status': 'failed', 'failure_reason': failure_reason}}
            )

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment failed"
            )

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Stripe error: {str(e)}'
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Payment confirmation failed: {str(e)}'
        )


@router.post("/refund")
async def refund_payment(
    refund_data: RefundRequest,
    current_user: dict = Depends(require_role("admin"))
):
    """Refund a payment (admin only)"""
    try:
        result = process_refund(refund_data.transaction_id, refund_data.reason)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(current_user: dict = Depends(get_current_user)):
    """Get transactions for current user or all transactions for admin"""
    db = get_database()
    role = current_user.get('role')
    user_id = current_user.get('_id')

    if role == 'admin':
        transactions = list(db.transactions.find({}))
    elif role == 'customer':
        transactions = list(db.transactions.find({'customer_id': user_id}))
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role for transaction access"
        )

    return serialize_list(transactions)


