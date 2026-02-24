import React, { useState, useEffect } from 'react';
import MainLayout from '../../layout/MainLayout';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Calendar, ArrowRight, User as UserIcon, CreditCard, ChevronLeft, ChevronRight, Loader2, CheckCircle, XCircle, Clock, Home, X } from 'lucide-react';
import apiClient from '../../api/client';
import { authApi } from '../../api/auth';
import { cartApi } from '../../api/cart';
import { config } from '../../config';
import NZAddressAutocomplete from '../../components/NZAddressAutocomplete';
import { PhoneInput } from '../../components/PhoneInput';

const TIME_SLOTS = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM"
];

const CheckoutPage: React.FC = () => {
    const { items, subtotal, clearCart } = useCartStore();
    const { isAuthenticated, user, setAuth } = useAuthStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Initialize payment status synchronously from URL params
    const getInitialPaymentStatus = (): 'success' | 'canceled' | null => {
        if (searchParams.get('success') === 'true') return 'success';
        if (searchParams.get('canceled') === 'true') return 'canceled';
        return null;
    };

    const initialPaymentStatus = getInitialPaymentStatus();

    // Start at step 3 if coming back from canceled payment
    const [step, setStep] = useState(initialPaymentStatus === 'canceled' ? 3 : 1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'canceled' | null>(initialPaymentStatus);
    const [verifyingPayment, setVerifyingPayment] = useState(false);
    const [showComingSoonModal, setShowComingSoonModal] = useState(false);

    // Verify payment and create booking after successful Stripe redirect
    useEffect(() => {
        const verifyPaymentAndCreateBooking = async () => {
            if (initialPaymentStatus === 'success') {
                const sessionId = localStorage.getItem('stripe_session_id');

                if (sessionId) {
                    setVerifyingPayment(true);
                    try {
                        // Call the status endpoint to verify payment and create booking
                        const response = await apiClient.get(`/payments/status/${sessionId}`);
                        console.log('Payment verified:', response.data);

                        // Clear the stored session ID
                        localStorage.removeItem('stripe_session_id');

                        // Clear cart after successful booking creation
                        clearCart();

                        setPaymentStatus('success');
                    } catch (err) {
                        console.error('Payment verification failed:', err);
                        // Still show success since Stripe payment was successful
                        // The booking might already exist or will be created via webhook
                        localStorage.removeItem('stripe_session_id');
                        clearCart();
                    } finally {
                        setVerifyingPayment(false);
                    }
                } else {
                    // No session ID stored, just clear cart
                    clearCart();
                }
            }
        };

        verifyPaymentAndCreateBooking();
    }, [initialPaymentStatus, clearCart]);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        address: '',
        date: '',
        time: '',
        notes: '',
        lat: 0,
        lon: 0
    });

    // Pre-fill address if user is logged in
    React.useEffect(() => {
        if (isAuthenticated && user?.address && !formData.address) {
            setFormData(prev => ({
                ...prev,
                address: user.address || ''
            }));
        }
    }, [isAuthenticated, user?.address]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const getImageUrl = (imagePath?: string) => {
        if (!imagePath) return '/service-placeholder.png';
        if (imagePath.startsWith('http')) return imagePath;
        return `${config.apiUrl.replace('/api', '')}${imagePath}`;
    };

    const handleNext = () => {
        if (step === 1) {
            if (!isAuthenticated && (!formData.name || !formData.email || !formData.password)) {
                setError('Please fill in all details to create an account.');
                return;
            }
            setStep(2);
            setError(null);
        } else if (step === 2) {
            if (!formData.address || !formData.date || !formData.time) {
                setError('Please fill in all booking details.');
                return;
            }
            setStep(3);
            setError(null);
        }
    };

    // Helper function to convert 12-hour AM/PM time to 24-hour format
    const convertTo24Hour = (time12h: string): string => {
        const [time, period] = time12h.split(' ');
        let [hours, minutes] = time.split(':');

        if (period === 'PM' && hours !== '12') {
            hours = String(parseInt(hours) + 12);
        } else if (period === 'AM' && hours === '12') {
            hours = '00';
        }

        return `${hours.padStart(2, '0')}:${minutes}:00`;
    };

    const handlePayment = async () => {
        setLoading(true);
        setError(null);
        try {
            let authToken = useAuthStore.getState().token;

            // 1. Authenticate if needed
            if (!isAuthenticated) {
                try {
                    await authApi.register({
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        password: formData.password
                    });

                    const loginRes = await authApi.login({
                        email: formData.email,
                        password: formData.password
                    });

                    // Set auth header IMMEDIATELY after login, before any other API calls
                    authToken = loginRes.access_token;
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

                    const me = await authApi.getMe();
                    setAuth(me, loginRes.access_token);

                    // Sync cart items for new users
                    if (items.length > 0) {
                        await Promise.all(items.map(item => cartApi.add(item.service_id, item.quantity)));
                    }
                } catch (err: any) {
                    throw new Error(err.response?.data?.detail || 'Registration failed');
                }
            } else {
                // Already authenticated, ensure header is set
                if (authToken) {
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
                }
            }

            // 3. Create Booking / Checkout Session
            // Convert time from "09:00 AM" format to 24-hour format "09:00:00"
            const timeIn24Hour = convertTo24Hour(formData.time);
            const scheduled_date = new Date(`${formData.date}T${timeIn24Hour}`).toISOString();

            const payload = {
                name: formData.name || user?.name,
                email: formData.email || user?.email,
                scheduled_date,
                service_address: formData.address,
                latitude: formData.lat || 0,
                longitude: formData.lon || 0,
                notes: formData.notes,
                use_cart: true,
                service_type: "Multiple Services",
                price: subtotal()
            };

            const response = await apiClient.post('/payments/book-and-pay', payload);

            // 4. Store session_id and redirect to Stripe
            if (response.data.session_id) {
                // Store session_id for verification after return
                localStorage.setItem('stripe_session_id', response.data.session_id);

                if (response.data.url) {
                    window.location.href = response.data.url;
                }
            } else if (response.data.url) {
                window.location.href = response.data.url;
            } else {
                console.log("Session created", response.data);
            }

        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || 'Payment initiation failed';
            setError(errorMessage);
            console.error('Payment error:', err);
            console.error('Error response:', err.response);
        } finally {
            setLoading(false);
        }
    };

    // Custom Date Picker Component
    const CustomDatePicker = ({ currentDate, onChange }: { currentDate: string, onChange: (d: string) => void }) => {
        const [viewDate, setViewDate] = useState(new Date());

        const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
        const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSelected = currentDate === dateStr;
            const isPast = new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));

            days.push(
                <button
                    key={d}
                    onClick={() => !isPast && onChange(dateStr)}
                    disabled={isPast}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center
                        ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' : 'text-gray-700 hover:bg-gray-100'}
                        ${isPast ? 'opacity-20 cursor-not-allowed' : ''}
                    `}
                >
                    {d}
                </button>
            );
        }

        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 w-full shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setViewDate(new Date(year, month - 1))} className="text-gray-400 hover:text-gray-700"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-gray-900 font-bold text-sm">{monthNames[month]} {year}</span>
                    <button onClick={() => setViewDate(new Date(year, month + 1))} className="text-gray-400 hover:text-gray-700"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <span key={i} className="text-[10px] text-gray-400 uppercase font-bold">{day}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 place-items-center">
                    {days}
                </div>
            </div>
        );
    }

    // Payment Success/Canceled UI
    if (paymentStatus === 'success' || (initialPaymentStatus === 'success' && verifyingPayment)) {
        return (
            <MainLayout>
                <div className="max-w-2xl mx-auto px-4 py-32 text-center bg-white min-h-screen">
                    <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm">
                        {verifyingPayment ? (
                            <>
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 rounded-full mb-8">
                                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                                </div>
                                <h1 className="text-4xl font-black mb-4 text-slate-900">Processing Your Booking...</h1>
                                <p className="text-slate-600 text-lg mb-8">
                                    Please wait while we confirm your payment and create your booking.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-50 rounded-full mb-8">
                                    <CheckCircle className="w-12 h-12 text-emerald-600" />
                                </div>
                                <h1 className="text-4xl font-black mb-4 text-slate-900">Payment Successful!</h1>
                                <p className="text-slate-600 text-lg mb-8">
                                    Your booking has been confirmed. We've sent a confirmation email with all the details.
                                </p>
                            </>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                            >
                                View My Bookings
                            </button>
                            <button
                                onClick={() => navigate('/services')}
                                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all border border-gray-200"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // Canceled Modal Component
    const CanceledModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-200 max-w-md w-full text-center animate-in fade-in zoom-in duration-300 shadow-2xl">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                    <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">Payment Canceled</h2>
                <p className="text-gray-600 mb-8">
                    Your payment was canceled. Don't worry, your cart items are still saved.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/checkout')}
                        className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => navigate('/services')}
                        className="w-full px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all border border-gray-200"
                    >
                        Browse Services
                    </button>
                </div>
            </div>
        </div>
    );

    if (items.length === 0) {
        return (
            <MainLayout>
                <div className="max-w-7xl mx-auto px-4 py-32 text-center bg-gray-50 min-h-screen">
                    <div className="inline-flex content-center justify-center p-6 bg-gray-100 rounded-full mb-6 relative">
                        <Loader2 className="w-12 h-12 text-gray-400 relative z-10 animate-spin" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4 text-gray-900">Your cart is empty</h1>
                    <button onClick={() => navigate('/services')} className="text-blue-600 font-bold hover:underline">Browse Services</button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Canceled Payment Modal */}
            {paymentStatus === 'canceled' && <CanceledModal />}
            <div className="relative py-16 overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 animate-fade-in">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl opacity-50" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
                        Secure <span className="text-blue-200">Checkout</span>
                    </h1>

                    {/* Steps Indicator */}
                    <div className="flex items-center justify-center space-x-4 mt-8">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all border-2 ${step >= 1 ? 'bg-white border-white text-blue-600 shadow-lg' : 'bg-white/20 border-white/40 text-white/60'}`}>1</div>
                        <div className={`h-1 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-white shadow-lg' : 'bg-white/30'}`}></div>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all border-2 ${step >= 2 ? 'bg-white border-white text-blue-600 shadow-lg' : 'bg-white/20 border-white/40 text-white/60'}`}>2</div>
                        <div className={`h-1 w-16 rounded-full transition-colors ${step >= 3 ? 'bg-white shadow-lg' : 'bg-white/30'}`}></div>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all border-2 ${step >= 3 ? 'bg-white border-white text-blue-600 shadow-lg' : 'bg-white/20 border-white/40 text-white/60'}`}>3</div>
                    </div>
                    <div className="flex justify-center space-x-12 mt-2 text-xs font-bold uppercase tracking-widest text-white/70 ml-1">
                        <span className={`${step >= 1 ? 'text-white' : ''}`}>Details</span>
                        <span className={`${step >= 2 ? 'text-white' : ''} ml-5`}>Schedule</span>
                        <span className={`${step >= 3 ? 'text-white' : ''} ml-3`}>Payment</span>
                    </div>
                </div>
            </div>

            <div className="min-h-screen bg-gray-50 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left Side: Form */}
                        <div>
                            {step === 1 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
                                        <UserIcon className="w-6 h-6 mr-2 text-blue-600" />
                                        Contact Information
                                    </h2>
                                    {isAuthenticated ? (
                                        <div className="bg-green-50 p-6 rounded-2xl border border-green-200 mb-6">
                                            <div className="flex items-center mb-2">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                                    <Check className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-green-700">Logged in as {user?.name}</p>
                                                    <p className="text-gray-600 text-sm">{user?.email}</p>
                                                </div>
                                            </div>
                                            <button onClick={handleNext} className="mt-6 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">Continue as {user?.name?.split(' ')[0]}</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                                                <PhoneInput
                                                    value={formData.phone}
                                                    onChange={(phone) => setFormData({ ...formData, phone })}
                                                    placeholder="Enter phone number"
                                                    defaultCountryCode="+64"
                                                />
                                            </div>
                                            <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                                            <input name="password" type="password" placeholder="Create Password" value={formData.password} onChange={handleInputChange} className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                                            <p className="text-sm text-gray-500 pl-1">We'll create a secure account for you to manage your booking.</p>
                                            <button onClick={handleNext} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold mt-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">Next: Service Details</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
                                        <Calendar className="w-6 h-6 mr-2 text-blue-600" />
                                        Schedule & Location
                                    </h2>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Service Address</label>
                                            <NZAddressAutocomplete
                                                value={formData.address}
                                                onChange={(address, details) => {
                                                    setFormData({
                                                        ...formData,
                                                        address,
                                                        lat: details?.lat || 0,
                                                        lon: details?.lon || 0
                                                    });
                                                }}
                                                placeholder="Start typing your address in New Zealand..."
                                                required
                                                inputClassName="py-4 rounded-xl"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Select Date</label>
                                                <CustomDatePicker
                                                    currentDate={formData.date}
                                                    onChange={(d) => setFormData({ ...formData, date: d })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Select Time</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {TIME_SLOTS.map(time => {
                                                        const isSelected = formData.time === time;
                                                        return (
                                                            <button
                                                                key={time}
                                                                onClick={() => setFormData({ ...formData, time })}
                                                                className={`py-3 px-2 rounded-lg text-xs font-bold transition-all border ${isSelected
                                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
                                                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                                                                    }`}
                                                            >
                                                                {time}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Special Notes (Optional)</label>
                                            <textarea name="notes" rows={3} value={formData.notes} onChange={handleInputChange} className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="Gate codes, parking instructions, etc..." />
                                        </div>

                                        <div className="pt-4">
                                            <button onClick={() => setShowComingSoonModal(true)} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 mb-3">Review & Pay</button>
                                            <button onClick={() => setStep(1)} className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium">Back to Contact Info</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                    <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
                                        <CreditCard className="w-6 h-6 mr-2 text-blue-600" />
                                        Payment
                                    </h2>

                                    <div className="bg-white p-8 rounded-3xl border border-gray-200 mb-8 shadow-sm">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-500">Items</span>
                                            <span className="font-bold text-3xl text-gray-900">{items.length}</span>
                                        </div>
                                        <p className="text-sm text-gray-400">Secure encrypted transaction via Stripe</p>
                                    </div>

                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 flex items-start">
                                            <div className="mr-3 mt-0.5">⚠️</div>
                                            <div>{error}</div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handlePayment}
                                        disabled={loading}
                                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-500 transition-all flex items-center justify-center shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                                            </>
                                        ) : (
                                            <>
                                                Pay Securely <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                    <button onClick={() => setStep(2)} className="w-full mt-4 py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium">Back to Details</button>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Order Summary */}
                        <div className="h-fit sticky top-24">
                            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg">
                                <h3 className="font-bold text-gray-900 mb-6 text-xl">Order Summary</h3>
                                <div className="space-y-6 mb-8 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                    {items.map(item => (
                                        <div key={item.id} className="flex gap-4 items-start">
                                            <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                                                <img
                                                    src={getImageUrl(item.service_image)}
                                                    alt={item.service_title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.currentTarget.src = '/service-placeholder.png'; }}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 line-clamp-1 text-lg">{item.service_title}</p>
                                                <p className="text-sm text-gray-500 mb-1">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200 pt-6">
                                    <div className="flex justify-between font-bold text-xl text-gray-900">
                                        <span>Total Items</span>
                                        <span>{items.length}</span>
                                    </div>
                                    <p className="text-right text-xs text-gray-400 mt-2">Price will be confirmed</p>
                                </div>
                            </div>

                            {/* Security Badge */}
                            <div className="mt-6 flex justify-center items-center text-gray-400 text-xs gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <span>SSL Encrypted Checkout</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coming Soon Modal */}
            {showComingSoonModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={() => setShowComingSoonModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center">
                                <Clock className="w-10 h-10 text-blue-600" />
                            </div>
                            
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Coming Soon!</h3>
                            
                            <p className="text-slate-600 mb-8 leading-relaxed">
                                We are currently adding prices for the services listed on our website. Online payment and service booking will be available soon.
                            </p>
                            
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                <Home className="w-5 h-5" />
                                Back to Homepage
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default CheckoutPage;
