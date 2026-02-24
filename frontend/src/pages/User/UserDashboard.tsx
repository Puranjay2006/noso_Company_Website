import React, { useEffect, useState } from 'react';
import MainLayout from '../../layout/MainLayout';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../api/client';
import { config } from '../../config';
import {
    ShoppingBag,
    User as UserIcon,
    Bell,
    LogOut,
    Calendar,
    MapPin,
    Clock,
    ChevronRight,
    Loader2,
    Star,
    Camera,
    CheckCircle,
    DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationPanel from '../../components/NotificationPanel';
import { PhoneInput } from '../../components/PhoneInput';

interface BookingService {
    service_id: string;
    service_title: string;
    service_price: number;
    service_image?: string;
    quantity: number;
}

interface Booking {
    _id: string;
    service_title?: string;
    service_type: string;
    services?: BookingService[];
    scheduled_date: string;
    status: string;
    price?: number;
    total_price?: number;
    service_address: string;
    created_at?: string;
    partner_details?: {
        name: string;
    };
    before_cleaning_image?: string;
    after_cleaning_image?: string;
    customer_rating?: {
        rating: number;
        comment?: string;
        rated_at: string;
    };
    partner_rating?: {
        rating: number;
        comment?: string;
        rated_at: string;
    };
    // Keep these for backward compatibility if needed, but we'll try to use customer_rating
    rating?: number;
    comment?: string;
    rated_at?: string;
}

interface Stats {
    total_bookings: number;
    pending_bookings: number;
    completed_bookings: number;
    cancelled_bookings?: number;
    total_spent: number;
}

const UserDashboard: React.FC = () => {
    const { user, logout, setAuth } = useAuthStore();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('bookings');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [ratingFormData, setRatingFormData] = useState({
        rating: 0,
        comment: ''
    });
    const [submittingRating, setSubmittingRating] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [stats, setStats] = useState<Stats>({
        total_bookings: 0,
        pending_bookings: 0,
        completed_bookings: 0,
        total_spent: 0
    });
    const [bookingsTab, setBookingsTab] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/bookings');
                const fetchedBookings = response.data;
                setBookings(fetchedBookings);

                // Calculate stats
                const total = fetchedBookings.length;
                const pending = fetchedBookings.filter((b: Booking) => b.status === 'pending').length;
                const completed = fetchedBookings.filter((b: Booking) => b.status === 'completed').length;
                const spent = fetchedBookings
                    .filter((b: Booking) => b.status === 'completed')
                    .reduce((sum: number, b: Booking) => sum + (b.price ?? b.total_price ?? 0), 0);

                setStats({
                    total_bookings: total,
                    pending_bookings: pending,
                    completed_bookings: completed,
                    total_spent: spent
                });
            } catch (error) {
                console.error("Failed to fetch bookings:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchBookings();
        }
    }, [user]);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await apiClient.get('/notifications/unread-count');
                setUnreadNotifications(response.data.unread_count);
            } catch (error) {
                console.error("Failed to fetch unread notifications:", error);
            }
        };

        if (user) {
            fetchUnreadCount();
            // Refresh count every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    const handleOpenEditModal = () => {
        setEditFormData({
            name: user?.name || '',
            phone: user?.phone || '',
            address: user?.address || ''
        });
        setIsEditModalOpen(true);
        setError(null);
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        setSaving(true);
        setError(null);

        try {
            // Call API to update user profile
            const response = await apiClient.put(`/users/${user.id}`, {
                name: editFormData.name,
                phone: editFormData.phone,
                address: editFormData.address
            });

            // Update the auth store with new user data
            const updatedUser = { ...user, ...response.data };
            setAuth(updatedUser, useAuthStore.getState().token || '');

            setIsEditModalOpen(false);
        } catch (err: any) {
            console.error("Failed to update profile:", err);
            setError(err.response?.data?.detail || "Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleOpenRatingModal = (booking: Booking) => {
        setSelectedBooking(booking);
        const rating = booking.customer_rating?.rating || booking.rating || 0;
        const comment = booking.customer_rating?.comment || booking.comment || '';

        setRatingFormData({
            rating: rating,
            comment: comment
        });
        setIsRatingModalOpen(true);
    };

    const handleSubmitRating = async () => {
        if (!selectedBooking || ratingFormData.rating === 0) return;

        setSubmittingRating(true);
        try {
            await apiClient.put(`/bookings/${selectedBooking._id}/rate`, {
                rating: ratingFormData.rating,
                comment: ratingFormData.comment
            });

            // Refresh bookings to show updated rating
            const response = await apiClient.get('/bookings');
            setBookings(response.data);

            setIsRatingModalOpen(false);
            setSelectedBooking(null);
            setRatingFormData({ rating: 0, comment: '' });
        } catch (err: any) {
            console.error("Failed to submit rating:", err);
            setError(err.response?.data?.detail || "Failed to submit rating. Please try again.");
        } finally {
            setSubmittingRating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'text-green-700 bg-green-50 border-green-200';
            case 'confirmed': return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'pending': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    const filteredBookings = bookings.filter(booking => {
        if (bookingsTab === 'all') return true;
        if (bookingsTab === 'pending') return booking.status === 'pending';
        if (bookingsTab === 'confirmed') return booking.status === 'confirmed';
        if (bookingsTab === 'completed') return booking.status === 'completed';
        return true;
    });

    const getImageUrl = (imagePath?: string) => {
        if (!imagePath) return '/service-placeholder.png';
        if (imagePath.startsWith('http')) return imagePath;

        // Ensure path starts with a slash
        let path = imagePath;
        if (!path.startsWith('/')) {
            // If it doesn't start with /uploads, prepend it (handles "images/bookings/...")
            if (!path.startsWith('uploads/')) {
                path = `/uploads/${path}`;
            } else {
                path = `/${path}`;
            }
        }

        // Ensure no double slashes when joining with base URL
        const baseUrl = config.apiUrl.replace('/api', '');
        return `${baseUrl}${path}`;
    };

    if (!user) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Please log in to view your dashboard</h2>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-white py-12 animate-fade-in">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
                                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">{user.name?.split(' ')[0]}</span>
                            </h1>
                            <p className="text-slate-500">Manage your bookings and account settings.</p>
                        </div>

                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-6 shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
                                        {user.name?.charAt(0)}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-slate-900 truncate">{user.name}</h3>
                                        <p className="text-slate-500 text-xs truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setActiveTab('bookings')}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'bookings'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <ShoppingBag className="w-5 h-5 mr-3" />
                                        My Bookings
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('notifications')}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'notifications'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <div className="relative mr-3">
                                            <Bell className="w-5 h-5" />
                                            {unreadNotifications > 0 && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                            )}
                                        </div>
                                        Notifications
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <UserIcon className="w-5 h-5 mr-3" />
                                        Profile Settings
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-3">
                            {activeTab === 'notifications' ? (
                                <NotificationPanel
                                    isOpen={true}
                                    onClose={() => setActiveTab('bookings')}
                                />
                            ) : activeTab === 'bookings' ? (
                                <div className="space-y-6">
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Total Bookings', value: stats.total_bookings, icon: ShoppingBag, gradient: 'from-blue-500 to-blue-700' },
                                            { label: 'Pending', value: stats.pending_bookings, icon: Clock, gradient: 'from-amber-500 to-orange-600' },
                                            { label: 'Completed', value: stats.completed_bookings, icon: CheckCircle, gradient: 'from-blue-500 to-cyan-600' },
                                            { label: 'Cancelled', value: stats.cancelled_bookings || 0, icon: DollarSign, gradient: 'from-purple-500 to-pink-600' },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-all shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                                        <stat.icon className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                                                        <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                            <Calendar className="w-6 h-6 text-blue-600" />
                                            Booking History
                                        </h2>

                                        {/* Booking Tabs */}
                                        <div className="flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
                                            {[
                                                { id: 'all', label: 'All' },
                                                { id: 'pending', label: 'Pending' },
                                                { id: 'confirmed', label: 'Confirmed' },
                                                { id: 'completed', label: 'Completed' }
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setBookingsTab(tab.id as any)}
                                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${bookingsTab === tab.id
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                        }`}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="py-20 text-center">
                                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                                            <p className="text-slate-500">Loading your bookings...</p>
                                        </div>
                                    ) : filteredBookings.length === 0 ? (
                                        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Calendar className="w-10 h-10 text-slate-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">No bookings found</h3>
                                            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                                {bookingsTab === 'all'
                                                    ? "You haven't made any bookings yet. Browse our services to get started."
                                                    : `You don't have any ${bookingsTab} bookings at the moment.`
                                                }
                                            </p>
                                            {bookingsTab === 'all' && (
                                                <button
                                                    onClick={() => navigate('/services')}
                                                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                                                >
                                                    Browse Services
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {filteredBookings.map((booking) => (
                                                <div key={booking._id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-all group shadow-sm">
                                                    <div className="flex flex-col md:flex-row gap-6">
                                                        {/* Service Image */}
                                                        <div className="flex-shrink-0">
                                                            <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-100 rounded-xl overflow-hidden relative">
                                                                <img
                                                                    src={getImageUrl(booking.services?.[0]?.service_image)}
                                                                    alt={booking.services?.[0]?.service_title || booking.service_type}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { e.currentTarget.src = '/service-placeholder.png'; }}
                                                                />
                                                                {booking.services && booking.services.length > 1 && (
                                                                    <div className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                                        +{booking.services.length - 1}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex-grow">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(booking.status)}`}>
                                                                    {booking.status}
                                                                </span>
                                                                <span className="text-slate-500 text-xs flex items-center">
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    Booked on {booking.created_at ? formatDate(booking.created_at) : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                                                {booking.services && booking.services.length > 0
                                                                    ? booking.services.map(s => s.service_title).join(', ')
                                                                    : booking.service_type || 'Custom Service'}
                                                            </h3>

                                                            <div className="space-y-2 text-sm text-slate-500">
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-blue-600" />
                                                                    {formatDate(booking.scheduled_date)}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="w-4 h-4 text-blue-600" />
                                                                    {booking.service_address}
                                                                </div>
                                                            </div>

                                                            {/* Status Indicators for Completed Bookings */}
                                                            {booking.status === 'completed' && (
                                                                <div className="flex items-center gap-3 mt-3">
                                                                    {(booking.before_cleaning_image || booking.after_cleaning_image) && (
                                                                        <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                                                                            <Camera className="w-3 h-3" />
                                                                            Photos Available
                                                                        </div>
                                                                    )}
                                                                    {(booking.customer_rating?.rating || booking.rating) ? (
                                                                        <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                                                                            <Star className="w-3 h-3 fill-amber-500" />
                                                                            Rated {(booking.customer_rating?.rating || booking.rating || 0).toFixed(1)}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
                                                                            <Star className="w-3 h-3" />
                                                                            Not rated
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col justify-between items-end min-w-[140px]">
                                                            <div className="mt-4 flex flex-col gap-2 w-full md:w-auto">
                                                                <button
                                                                    onClick={() => setSelectedBooking(booking)}
                                                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-2 justify-center"
                                                                >
                                                                    View Details <ChevronRight className="w-4 h-4" />
                                                                </button>
                                                                {booking.status === 'completed' && !(booking.customer_rating?.rating || booking.rating) && (
                                                                    <button
                                                                        onClick={() => handleOpenRatingModal(booking)}
                                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors flex items-center gap-2 justify-center shadow-lg shadow-blue-500/20"
                                                                    >
                                                                        <Star className="w-4 h-4" />
                                                                        Rate Now
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : activeTab === 'profile' ? (
                                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                        <UserIcon className="w-6 h-6 text-blue-600" />
                                        Profile Information
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Full Name</label>
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium">
                                                {user.name}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Email Address</label>
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium">
                                                {user.email}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Phone Number</label>
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium">
                                                {user.phone || 'Not provided'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Role</label>
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium capitalize">
                                                {user.role}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Address</label>
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium truncate">
                                                {user.address || 'Not provided'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-slate-200 flex gap-4">
                                        <button
                                            onClick={handleOpenEditModal}
                                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                                        >
                                            Edit Profile
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="flex-1 px-6 py-3 bg-white border border-slate-200 rounded-xl text-red-500 font-bold hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center"
                                        >
                                            <LogOut className="w-5 h-5 mr-2" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Edit Profile Modal */}
                    {isEditModalOpen && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Edit Profile</h2>

                                {error && (
                                    <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center">
                                        <span className="mr-2">⚠️</span> {error}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="edit-name" className="block text-sm font-bold text-blue-600 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            id="edit-name"
                                            type="text"
                                            value={editFormData.name}
                                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="edit-phone" className="block text-sm font-bold text-blue-600 mb-2">
                                            Phone Number
                                        </label>
                                        <PhoneInput
                                            value={editFormData.phone}
                                            onChange={(phone) => setEditFormData({ ...editFormData, phone })}
                                            placeholder="Enter your phone number"
                                            defaultCountryCode="+64"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="edit-address" className="block text-sm font-bold text-blue-600 mb-2">
                                            Address
                                        </label>
                                        <input
                                            id="edit-address"
                                            type="text"
                                            value={editFormData.address}
                                            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            placeholder="Enter your address"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        disabled={saving}
                                        className="flex-1 px-6 py-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={saving || !editFormData.name}
                                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Booking Details Modal */}
                    {selectedBooking && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900">Booking Details</h2>
                                    <button
                                        onClick={() => setSelectedBooking(null)}
                                        className="text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Status */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Status</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(selectedBooking.status)}`}>
                                            {selectedBooking.status}
                                        </span>
                                    </div>

                                    {/* Services */}
                                    <div>
                                        <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                            {selectedBooking.services && selectedBooking.services.length > 0 ? 'Services' : 'Service'}
                                        </label>
                                        {selectedBooking.services && selectedBooking.services.length > 0 ? (
                                            <div className="space-y-3">
                                                {selectedBooking.services.map((service, index) => (
                                                    <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                                                        <div className="w-14 h-14 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                                                            <img
                                                                src={getImageUrl(service.service_image)}
                                                                alt={service.service_title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.currentTarget.src = '/service-placeholder.png'; }}
                                                            />
                                                        </div>
                                                        <div className="flex-grow">
                                                            <p className="text-slate-900 font-medium">{service.service_title}</p>
                                                            <p className="text-slate-500 text-sm">Qty: {service.quantity}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-slate-900 font-medium">{selectedBooking.service_type || 'Custom Service'}</p>
                                        )}
                                    </div>

                                    {/* Scheduled Date */}
                                    <div>
                                        <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Scheduled Date</label>
                                        <div className="flex items-center text-slate-900">
                                            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                                            {formatDate(selectedBooking.scheduled_date)}
                                        </div>
                                    </div>

                                    {/* Service Address */}
                                    <div>
                                        <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Service Address</label>
                                        <div className="flex items-start text-slate-900">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-600 mt-1 flex-shrink-0" />
                                            <span>{selectedBooking.service_address}</span>
                                        </div>
                                    </div>

                                    {/* Partner Details */}
                                    {selectedBooking.partner_details && (
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Assigned Partner</label>
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                                    {selectedBooking.partner_details.name.charAt(0)}
                                                </div>
                                                <span className="text-slate-900 font-medium">{selectedBooking.partner_details.name}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Before & After Images */}
                                    {selectedBooking.status === 'completed' && (selectedBooking.before_cleaning_image || selectedBooking.after_cleaning_image) && (
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Before & After</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {selectedBooking.before_cleaning_image && (
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                                            <Camera className="w-3 h-3" />
                                                            Before Cleaning
                                                        </p>
                                                        <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden">
                                                            <img
                                                                src={getImageUrl(selectedBooking.before_cleaning_image)}
                                                                alt="Before cleaning"
                                                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                                onClick={() => window.open(getImageUrl(selectedBooking.before_cleaning_image), '_blank')}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedBooking.after_cleaning_image && (
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                                            <Camera className="w-3 h-3" />
                                                            After Cleaning
                                                        </p>
                                                        <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden">
                                                            <img
                                                                src={getImageUrl(selectedBooking.after_cleaning_image)}
                                                                alt="After cleaning"
                                                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                                onClick={() => window.open(getImageUrl(selectedBooking.after_cleaning_image), '_blank')}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Rating Display */}
                                    {(selectedBooking.customer_rating?.rating || selectedBooking.rating) && (
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Your Rating</label>
                                            <div className="bg-slate-50 p-4 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-5 h-5 ${star <= (selectedBooking.customer_rating?.rating || selectedBooking.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                                                        />
                                                    ))}
                                                    <span className="text-slate-900 font-bold ml-2">{(selectedBooking.customer_rating?.rating || selectedBooking.rating || 0).toFixed(1)}</span>
                                                </div>
                                                {(selectedBooking.customer_rating?.comment || selectedBooking.comment) && (
                                                    <p className="text-slate-600 text-sm italic">"{selectedBooking.customer_rating?.comment || selectedBooking.comment}"</p>
                                                )}
                                                {(selectedBooking.customer_rating?.rated_at || selectedBooking.rated_at) && (
                                                    <p className="text-xs text-slate-500 mt-2">Rated on {formatDate(selectedBooking.customer_rating?.rated_at || selectedBooking.rated_at || '')}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Booking Date */}
                                    {selectedBooking.created_at && (
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Booked On</label>
                                            <div className="flex items-center text-slate-900">
                                                <Clock className="w-4 h-4 mr-2 text-blue-600" />
                                                {formatDate(selectedBooking.created_at)}
                                            </div>
                                        </div>
                                    )}

                                </div>

                                <div className="mt-8 flex gap-3">
                                    {selectedBooking.status === 'completed' && !(selectedBooking.customer_rating?.rating || selectedBooking.rating) && (
                                        <button
                                            onClick={() => {
                                                setIsRatingModalOpen(true);
                                            }}
                                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                        >
                                            <Star className="w-5 h-5" />
                                            Rate Service
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedBooking(null)}
                                        className={`px-6 py-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors ${selectedBooking.status === 'completed' && !(selectedBooking.customer_rating?.rating || selectedBooking.rating) ? '' : 'w-full'}`}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rating Modal */}
                    {isRatingModalOpen && selectedBooking && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">Rate Your Service</h2>
                                <p className="text-sm text-slate-500 mb-6">
                                    How was your experience with this service?
                                </p>

                                {error && (
                                    <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center">
                                        <span className="mr-2">⚠️</span> {error}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {/* Star Rating */}
                                    <div>
                                        <label className="block text-sm font-bold text-blue-600 mb-3">
                                            Your Rating
                                        </label>
                                        <div className="flex items-center gap-2 justify-center py-4">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRatingFormData({ ...ratingFormData, rating: star })}
                                                    onMouseEnter={() => setHoveredStar(star)}
                                                    onMouseLeave={() => setHoveredStar(0)}
                                                    className="transition-transform hover:scale-110 focus:outline-none"
                                                >
                                                    <Star
                                                        className={`w-10 h-10 transition-colors ${star <= (hoveredStar || ratingFormData.rating)
                                                            ? 'text-amber-400 fill-amber-400'
                                                            : 'text-slate-300'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        {ratingFormData.rating > 0 && (
                                            <p className="text-center text-slate-900 font-bold mt-2">
                                                {ratingFormData.rating === 1 && 'Poor'}
                                                {ratingFormData.rating === 2 && 'Fair'}
                                                {ratingFormData.rating === 3 && 'Good'}
                                                {ratingFormData.rating === 4 && 'Very Good'}
                                                {ratingFormData.rating === 5 && 'Excellent'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <label htmlFor="rating-comment" className="block text-sm font-bold text-blue-600 mb-2">
                                            Comment (Optional)
                                        </label>
                                        <textarea
                                            id="rating-comment"
                                            value={ratingFormData.comment}
                                            onChange={(e) => setRatingFormData({ ...ratingFormData, comment: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                                            placeholder="Tell us about your experience..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button
                                        onClick={() => {
                                            setIsRatingModalOpen(false);
                                            setRatingFormData({ rating: 0, comment: '' });
                                            setError(null);
                                        }}
                                        disabled={submittingRating}
                                        className="flex-1 px-6 py-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitRating}
                                        disabled={submittingRating || ratingFormData.rating === 0}
                                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submittingRating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Submit Rating
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default UserDashboard;
