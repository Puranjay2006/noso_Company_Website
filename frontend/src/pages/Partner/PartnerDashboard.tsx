import React, { useEffect, useState } from 'react';
import MainLayout from '../../layout/MainLayout';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../api/client';
import { config } from '../../config';
import {
    Briefcase,
    Calendar,
    DollarSign,
    MapPin,
    Clock,
    Users,
    Upload,
    CheckCircle,
    XCircle,
    Loader2,
    Phone,
    AlertCircle,
    Camera,
    Bell,
    LogOut,
    User as UserIcon
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
    customer_id: string;
    customer?: {
        name: string;
        phone: string;
    };
    service_type: string;
    services?: BookingService[];
    scheduled_date: string;
    status: string;
    price?: number;
    total_price?: number;
    service_address: string;
    created_at?: string;
    before_cleaning_image?: string;
    after_cleaning_image?: string;
    work_started_at?: string;
    work_completed_at?: string;
}

interface Stats {
    total_jobs: number;
    pending_jobs: number;
    completed_jobs: number;
    total_earnings: number;
}

const PartnerDashboard: React.FC = () => {
    const { user, logout, setAuth } = useAuthStore();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [imageType, setImageType] = useState<'before' | 'after'>('before');
    const [uploading, setUploading] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats>({
        total_jobs: 0,
        pending_jobs: 0,
        completed_jobs: 0,
        total_earnings: 0
    });
    const [activeView, setActiveView] = useState<'jobs' | 'profile' | 'notifications'>('jobs');
    const [jobsTab, setJobsTab] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
        business_type: user?.business_type || ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    useEffect(() => {
        fetchBookings();
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

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/bookings');
            const fetchedBookings = response.data;
            setBookings(fetchedBookings);

            // Calculate stats
            const total = fetchedBookings.length;
            const pending = fetchedBookings.filter((b: Booking) => b.status === 'pending' || b.status === 'assigned').length;
            const completed = fetchedBookings.filter((b: Booking) => b.status === 'completed').length;
            const earnings = fetchedBookings
                .filter((b: Booking) => b.status === 'completed')
                .reduce((sum: number, b: Booking) => sum + (b.price || b.total_price || 0), 0);

            setStats({
                total_jobs: total,
                pending_jobs: pending,
                completed_jobs: completed,
                total_earnings: earnings
            });
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!selectedBooking) return;

        // Validation: Check if before image is uploaded when starting work
        if (newStatus === 'in_progress' && !selectedBooking.before_cleaning_image) {
            setAlertModal({
                isOpen: true,
                title: 'Before Picture Required',
                message: 'Please upload a "Before" picture before starting the work.',
                type: 'warning'
            });
            return;
        }

        // Validation: Check if after image is uploaded when completing work
        if (newStatus === 'completed' && !selectedBooking.after_cleaning_image) {
            setAlertModal({
                isOpen: true,
                title: 'After Picture Required',
                message: 'Please upload an "After" picture before completing the job.',
                type: 'warning'
            });
            return;
        }

        setUpdatingStatus(true);
        try {
            await apiClient.put(`/bookings/${selectedBooking._id}/status`, {
                status: newStatus
            });

            // Update local state
            setBookings(bookings.map(b =>
                b._id === selectedBooking._id ? { ...b, status: newStatus } : b
            ));

            setIsStatusModalOpen(false);
            setSelectedBooking(null);

            // Show success message
            setAlertModal({
                isOpen: true,
                title: 'Status Updated',
                message: 'Job status has been updated successfully.',
                type: 'success'
            });

            await fetchBookings(); // Refresh to get updated stats
        } catch (error) {
            console.error('Failed to update status:', error);
            setAlertModal({
                isOpen: true,
                title: 'Update Failed',
                message: 'Failed to update status. Please try again.',
                type: 'error'
            });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleImageUpload = async () => {
        if (!selectedBooking || !selectedFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', selectedFile);

            const endpoint = imageType === 'before'
                ? `/bookings/${selectedBooking._id}/before-image`
                : `/bookings/${selectedBooking._id}/after-image`;

            await apiClient.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Refresh bookings
            await fetchBookings();

            // Close modal and reset
            setIsImageModalOpen(false);
            setSelectedFile(null);
            setPreviewUrl(null);
            setSelectedBooking(null);

            // Show success message
            setAlertModal({
                isOpen: true,
                title: 'Image Uploaded',
                message: `${imageType === 'before' ? 'Before' : 'After'} cleaning image uploaded successfully.`,
                type: 'success'
            });
        } catch (error) {
            console.error('Failed to upload image:', error);
            setAlertModal({
                isOpen: true,
                title: 'Upload Failed',
                message: 'Failed to upload image. Please try again.',
                type: 'error'
            });
        } finally {
            setUploading(false);
        }
    };

    const openImageModal = (booking: Booking, type: 'before' | 'after') => {
        setSelectedBooking(booking);
        setImageType(type);
        setIsImageModalOpen(true);
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleOpenEditModal = () => {
        setEditFormData({
            name: user?.name || '',
            phone: user?.phone || '',
            address: user?.address || '',
            business_type: user?.business_type || ''
        });
        setIsEditModalOpen(true);
        setError(null);
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        setSaving(true);
        setError(null);

        try {
            await apiClient.put('/partners/me', {
                name: editFormData.name,
                phone: editFormData.phone,
                address: editFormData.address,
                business_type: editFormData.business_type
            });

            // Update the auth store with new user data
            const updatedUser = { ...user, ...editFormData };
            setAuth(updatedUser, useAuthStore.getState().token || '');

            setIsEditModalOpen(false);
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getImageUrl = (imagePath?: string) => {
        if (!imagePath) return '/service-placeholder.png';
        if (imagePath.startsWith('http')) return imagePath;

        // Ensure path starts with a slash
        let path = imagePath;
        if (!path.startsWith('/')) {
            if (!path.startsWith('uploads/')) {
                path = `/uploads/${path}`;
            } else {
                path = `/${path}`;
            }
        }

        const baseUrl = config.apiUrl.replace('/api', '');
        return `${baseUrl}${path}`;
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'text-green-700 bg-green-50 border-green-200';
            case 'in_progress': return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'assigned': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'pending': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    const filteredBookings = bookings.filter(booking => {
        if (jobsTab === 'all') return true;
        if (jobsTab === 'pending') return booking.status === 'pending' || booking.status === 'assigned';
        if (jobsTab === 'in_progress') return booking.status === 'in_progress';
        if (jobsTab === 'completed') return booking.status === 'completed';
        return true;
    });

    if (!user || user.role !== 'partner') {
        return (
            <MainLayout>
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
                        <p className="text-slate-500 mb-6">This dashboard is only for service partners.</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900">Loading Dashboard...</h2>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-white py-12 animate-fade-in">
                {/* Background Pattern */}
                <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="fixed top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Header */}
                    <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
                                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">{user.name?.split(' ')[0]}</span>
                            </h1>
                            <p className="text-slate-500">Manage your assigned jobs and track your earnings.</p>
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
                                        onClick={() => setActiveView('jobs')}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'jobs'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <Briefcase className="w-5 h-5 mr-3" />
                                        My Jobs
                                    </button>
                                    <button
                                        onClick={() => setActiveView('notifications')}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'notifications'
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
                                        onClick={() => setActiveView('profile')}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'profile'
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
                            {activeView === 'notifications' ? (
                                <NotificationPanel
                                    isOpen={true}
                                    onClose={() => setActiveView('jobs')}
                                />
                            ) : activeView === 'jobs' ? (
                                <div className="space-y-6">
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Total Jobs', value: stats.total_jobs, icon: Briefcase, gradient: 'from-blue-500 to-blue-700' },
                                            { label: 'Pending', value: stats.pending_jobs, icon: Clock, gradient: 'from-amber-500 to-orange-600' },
                                            { label: 'Completed', value: stats.completed_jobs, icon: CheckCircle, gradient: 'from-blue-500 to-cyan-600' },
                                            { label: 'In Progress', value: bookings.filter(b => b.status === 'in_progress').length, icon: DollarSign, gradient: 'from-purple-500 to-pink-600' },
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

                                    <div className="flex items-start justify-between mb-4">
                                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                            <Calendar className="w-6 h-6 text-blue-600" />
                                            Job History
                                        </h2>
                                    </div>

                                    {/* Workflow Guide */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h3 className="text-sm font-bold text-blue-700 mb-2">Job Workflow</h3>
                                                <ol className="text-xs text-slate-700 space-y-1">
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px]">1</span>
                                                        Upload <strong>Before</strong> picture
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px]">2</span>
                                                        Start work (Change status to <strong>In Progress</strong>)
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px]">3</span>
                                                        Upload <strong>After</strong> picture
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px]">4</span>
                                                        Complete job (Change status to <strong>Completed</strong>)
                                                    </li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex space-x-2 overflow-x-auto no-scrollbar bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
                                        {[
                                            { key: 'all', label: 'All Jobs', count: bookings.length },
                                            { key: 'pending', label: 'Pending', count: stats.pending_jobs },
                                            { key: 'in_progress', label: 'In Progress', count: bookings.filter(b => b.status === 'in_progress').length },
                                            { key: 'completed', label: 'Completed', count: stats.completed_jobs }
                                        ].map((tab) => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setJobsTab(tab.key as typeof jobsTab)}
                                                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${jobsTab === tab.key
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {tab.label}
                                                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600 border border-slate-200">
                                                    {tab.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Bookings List */}
                                    <div className="grid gap-4">
                                        {filteredBookings.length > 0 ? (
                                            filteredBookings.map((booking) => (
                                                <div key={booking._id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-all shadow-sm">
                                                    <div className="flex flex-col lg:flex-row gap-6">
                                                        {/* Service Image */}
                                                        <div className="flex-shrink-0">
                                                            <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden relative">
                                                                <img
                                                                    src={getImageUrl(booking.services?.[0]?.service_image)}
                                                                    alt={booking.services?.[0]?.service_title || booking.service_type}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { e.currentTarget.src = '/service-placeholder.png'; }}
                                                                />
                                                                {booking.services && booking.services.length > 1 && (
                                                                    <div className="absolute bottom-1 right-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                                        +{booking.services.length - 1}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Left: Booking Info */}
                                                        <div className="flex-grow space-y-4">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getStatusColor(booking.status)}`}>
                                                                            {booking.status.replace('_', ' ')}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                                                                            #{booking._id.slice(-6)}
                                                                        </span>
                                                                    </div>
                                                                    <h3 className="text-lg font-bold text-slate-900">
                                                                        {booking.services && booking.services.length > 0
                                                                            ? booking.services.map(s => s.service_title).join(', ')
                                                                            : booking.service_type}
                                                                    </h3>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-500">
                                                                <div className="flex items-center">
                                                                    <Users className="w-4 h-4 mr-2 text-slate-400" />
                                                                    {booking.customer?.name || 'Customer'}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                                                                    {booking.customer?.phone || 'N/A'}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                                                    {formatDate(booking.scheduled_date)}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                                                    <span className="truncate">{booking.service_address}</span>
                                                                </div>
                                                            </div>

                                                            {/* Image Upload Status */}
                                                            <div className="flex items-center gap-4 pt-2">
                                                                <div className={`flex items-center gap-2 text-xs ${booking.before_cleaning_image ? 'text-blue-600' : 'text-slate-500'}`}>
                                                                    <Camera className="w-4 h-4" />
                                                                    Before: {booking.before_cleaning_image ? 'Uploaded' : 'Not uploaded'}
                                                                </div>
                                                                <div className={`flex items-center gap-2 text-xs ${booking.after_cleaning_image ? 'text-blue-600' : 'text-slate-500'}`}>
                                                                    <Camera className="w-4 h-4" />
                                                                    After: {booking.after_cleaning_image ? 'Uploaded' : 'Not uploaded'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right: Actions */}
                                                        <div className="flex lg:flex-col items-stretch gap-2 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6 min-w-[200px]">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedBooking(booking);
                                                                    setIsStatusModalOpen(true);
                                                                }}
                                                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                <CheckCircle className="w-4 h-4" /> Update Status
                                                            </button>

                                                            <button
                                                                onClick={() => openImageModal(booking, 'before')}
                                                                disabled={!!booking.before_cleaning_image}
                                                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Upload className="w-4 h-4" /> {booking.before_cleaning_image ? 'Before ✓' : 'Before'}
                                                            </button>

                                                            <button
                                                                onClick={() => openImageModal(booking, 'after')}
                                                                disabled={!!booking.after_cleaning_image}
                                                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Upload className="w-4 h-4" /> {booking.after_cleaning_image ? 'After ✓' : 'After'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl border-dashed">
                                                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-bold text-slate-900 mb-1">No jobs found</h3>
                                                <p className="text-slate-500">No jobs assigned yet in this category.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : activeView === 'profile' ? (
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
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Business Type</label>
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium">
                                                {user.business_type || 'Not provided'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Availability</label>
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium flex items-center gap-2">
                                                {user.availability ? (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 text-blue-600" />
                                                        <span className="text-blue-600">Available</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4 text-red-500" />
                                                        <span className="text-red-500">Unavailable</span>
                                                    </>
                                                )}
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
                </div>

                {/* Status Update Modal */}
                {isStatusModalOpen && selectedBooking && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Update Job Status</h2>
                            <p className="text-sm text-slate-500 mb-6">
                                Booking #{selectedBooking._id.slice(-6)} • {selectedBooking.service_type}
                            </p>

                            <div className="space-y-3 mb-6">
                                {[
                                    { value: 'assigned', label: 'Assigned', desc: 'Job assigned to you', requiresBefore: false, requiresAfter: false },
                                    { value: 'in_progress', label: 'In Progress', desc: 'Currently working on it', requiresBefore: true, requiresAfter: false },
                                    { value: 'completed', label: 'Completed', desc: 'Job finished successfully', requiresBefore: true, requiresAfter: true },
                                    { value: 'cancelled', label: 'Cancelled', desc: 'Job cancelled', requiresBefore: false, requiresAfter: false }
                                ].map((status) => {
                                    const canUpdate = (!status.requiresBefore || selectedBooking.before_cleaning_image) &&
                                        (!status.requiresAfter || selectedBooking.after_cleaning_image);
                                    const isDisabled = updatingStatus || !canUpdate;

                                    return (
                                        <button
                                            key={status.value}
                                            onClick={() => handleStatusUpdate(status.value)}
                                            disabled={isDisabled}
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedBooking.status === status.value
                                                ? 'border-blue-500 bg-green-50'
                                                : isDisabled
                                                    ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-900">{status.label}</p>
                                                    <p className="text-xs text-slate-500">{status.desc}</p>
                                                    {!canUpdate && (
                                                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {!selectedBooking.before_cleaning_image && status.requiresBefore && 'Before picture required'}
                                                            {!selectedBooking.after_cleaning_image && status.requiresAfter && 'After picture required'}
                                                        </p>
                                                    )}
                                                </div>
                                                {selectedBooking.status === status.value && (
                                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => {
                                    setIsStatusModalOpen(false);
                                    setSelectedBooking(null);
                                }}
                                disabled={updatingStatus}
                                className="w-full px-6 py-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                                {updatingStatus ? 'Updating...' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Image Upload Modal */}
                {isImageModalOpen && selectedBooking && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">
                                Upload {imageType === 'before' ? 'Before' : 'After'} Cleaning Image
                            </h2>
                            <p className="text-sm text-slate-500 mb-6">
                                Booking #{selectedBooking._id.slice(-6)}
                            </p>

                            <div className="mb-6">
                                <label className="block w-full">
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition-all cursor-pointer bg-slate-50">
                                        {previewUrl ? (
                                            <div className="space-y-4">
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="max-h-64 mx-auto rounded-lg"
                                                />
                                                <p className="text-sm text-blue-600 font-medium">Image selected</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                                <p className="text-slate-900 font-bold mb-2">Click to upload image</p>
                                                <p className="text-xs text-slate-500">PNG, JPG, JPEG, or GIF (max. 10MB)</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/gif"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsImageModalOpen(false);
                                        setSelectedFile(null);
                                        setPreviewUrl(null);
                                        setSelectedBooking(null);
                                    }}
                                    disabled={uploading}
                                    className="flex-1 px-6 py-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImageUpload}
                                    disabled={!selectedFile || uploading}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            Upload Image
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

                                <div>
                                    <label htmlFor="edit-business-type" className="block text-sm font-bold text-blue-600 mb-2">
                                        Business Type
                                    </label>
                                    <input
                                        id="edit-business-type"
                                        type="text"
                                        value={editFormData.business_type}
                                        onChange={(e) => setEditFormData({ ...editFormData, business_type: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                        placeholder="e.g., Cleaning Service, Plumbing, etc."
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

                {/* Alert Modal */}
                {alertModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 max-w-md w-full text-center animate-in fade-in zoom-in duration-300 shadow-2xl">
                            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${alertModal.type === 'success' ? 'bg-green-50' :
                                alertModal.type === 'error' ? 'bg-red-50' :
                                    alertModal.type === 'warning' ? 'bg-amber-50' :
                                        'bg-blue-50'
                                }`}>
                                {alertModal.type === 'success' && <CheckCircle className="w-10 h-10 text-blue-600" />}
                                {alertModal.type === 'error' && <XCircle className="w-10 h-10 text-red-600" />}
                                {alertModal.type === 'warning' && <AlertCircle className="w-10 h-10 text-amber-600" />}
                                {alertModal.type === 'info' && <AlertCircle className="w-10 h-10 text-blue-600" />}
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900">{alertModal.title}</h2>
                            <p className="text-slate-500 mb-8">
                                {alertModal.message}
                            </p>
                            <button
                                onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                                className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default PartnerDashboard;
