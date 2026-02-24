import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import {
    Users,
    Calendar,
    Briefcase,
    DollarSign,
    Search,
    Filter,
    Trash2,
    Edit,
    CheckCircle,
    XCircle,
    Plus,
    MapPin,
    AlertCircle,
    Loader2,
    User as UserIcon,
    Bell,
    LogOut,
    Clock,
    Camera,
    Package,
    ClipboardList,
    Mail,
    Phone,
    Globe,
    Car,
    Eye,
    X,
    Check
} from 'lucide-react';
import apiClient from '../../api/client';
import MainLayout from '../../layout/MainLayout';
import { useNavigate } from 'react-router-dom';
import { config } from '../../config';
import NotificationPanel from '../../components/NotificationPanel';
import { PhoneInput } from '../../components/PhoneInput';

// Interfaces
interface User {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    role: string;
    status: string;
    phone?: string;
    address?: string;
    created_at?: string;
    availability?: boolean; // For partners
    business_type?: string; // For partners
}

// Helper to get user ID (handles both _id and id)
const getUserId = (user: User): string | undefined => user._id || user.id;

interface BookingService {
    service_id: string;
    service_title: string;
    service_price: number;
    service_image?: string;
    quantity: number;
}

interface Booking {
    _id?: string;
    id?: string;
    customer_id: string;
    customer_name: string;
    service_type: string;
    services?: BookingService[];
    scheduled_date: string;
    status: string;
    price?: number;
    total_price?: number;
    service_address: string;
    created_at: string;
    partner_id?: string;
    partner_name?: string;
    notes?: string;
}

interface Service {
    _id?: string;
    id?: string;
    title: string;
    description: string;
    price: number;
    category_id: string;
    category_name?: string;
    image?: string;
    is_active: boolean;
    tags?: string[];
}

interface Category {
    _id: string;
    name: string;
    description?: string;
}

interface ProfessionalRegistration {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    nationality: string;
    hasNZLicense: string;
    yearsExperience: string;
    specializations: string[];
    availability: string;
    preferredStartDate?: string;
    aboutYourself?: string;
    location: string;
    locationName: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    reviewed_by?: string;
    reviewed_at?: string;
    review_notes?: string;
}

interface Stats {
    total_users: number;
    total_customers: number;
    total_partners: number;
    total_bookings: number;
    pending_bookings: number;
    completed_bookings: number;
}

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('bookings');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [customers, setCustomers] = useState<User[]>([]);
    const [partners, setPartners] = useState<User[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [professionalRegistrations, setProfessionalRegistrations] = useState<ProfessionalRegistration[]>([]);
    const [selectedRegistration, setSelectedRegistration] = useState<ProfessionalRegistration | null>(null);
    const [updatingRegistrationStatus, setUpdatingRegistrationStatus] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [editItem, setEditItem] = useState<{ type: 'booking' | 'user' | 'partner', data: any } | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [serviceFormData, setServiceFormData] = useState<Partial<Service>>({
        title: '',
        description: '',
        price: 0,
        category_id: '',
        image: '',
        is_active: true,
        tags: []
    });
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
    const [savingService, setSavingService] = useState(false);
    const [serviceImageFile, setServiceImageFile] = useState<File | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [assigningPartner, setAssigningPartner] = useState(false);

    // Profile State
    const [profileFormData, setProfileFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
        show: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Filter & Dropdown States
    const [filterStatus, setFilterStatus] = useState('All Statuses');
    const [filterCategory, setFilterCategory] = useState('All Categories');
    const [sortBy, setSortBy] = useState('Newest First');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setAlertConfig({ show: true, title, message, type });
    };

    // Notification State

    const [unreadNotifications, setUnreadNotifications] = useState(0);

    // Add Pro Application Modal State
    const [isAddProModalOpen, setIsAddProModalOpen] = useState(false);
    const [savingProApplication, setSavingProApplication] = useState(false);
    const [proApplicationForm, setProApplicationForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        nationality: 'New Zealand',
        hasNZLicense: 'Yes',
        yearsExperience: '',
        specializations: [] as string[],
        availability: 'Full-Time',
        preferredStartDate: '',
        aboutYourself: '',
        location: 'auckland',
        locationName: 'Auckland'
    });

    const specializationOptions = [
        // Cleaning Services
        'House Cleaning', 'Deep Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning',
        'Window Cleaning', 'Carpet Cleaning', 'End of Tenancy Cleaning', 'Office Cleaning',
        'Oven Cleaning', 'Upholstery Cleaning',
        // Lawn & Garden
        'Lawn Mowing', 'Garden Maintenance', 'Hedge Trimming', 'Tree Pruning',
        'Landscaping', 'Leaf Removal',
        // Home Maintenance
        'Handyman Services', 'Gutter Cleaning', 'Pressure Washing', 'Painting',
        'Furniture Assembly',
        // Pest Control
        'General Pest Control', 'Rodent Control', 'Termite Inspection', 'Flea Treatment'
    ];

    const handleSpecializationToggle = (spec: string) => {
        setProApplicationForm(prev => ({
            ...prev,
            specializations: prev.specializations.includes(spec)
                ? prev.specializations.filter(s => s !== spec)
                : [...prev.specializations, spec]
        }));
    };

    const handleAddProApplication = async () => {
        if (!proApplicationForm.fullName || !proApplicationForm.email || !proApplicationForm.phone || proApplicationForm.specializations.length === 0) {
            showAlert('Validation Error', 'Please fill in all required fields (Name, Email, Phone, and at least one Specialization).', 'error');
            return;
        }
        
        setSavingProApplication(true);
        try {
            await apiClient.post('/professionals/register', proApplicationForm);
            // Refresh the list
            const response = await apiClient.get('/professionals/registrations');
            setProfessionalRegistrations(response.data.registrations || []);
            setIsAddProModalOpen(false);
            // Reset form
            setProApplicationForm({
                fullName: '',
                email: '',
                phone: '',
                nationality: 'New Zealand',
                hasNZLicense: 'Yes',
                yearsExperience: '',
                specializations: [],
                availability: 'Full-Time',
                preferredStartDate: '',
                aboutYourself: '',
                location: 'auckland',
                locationName: 'Auckland'
            });
            showAlert('Success', 'Professional application created successfully!', 'success');
        } catch (error: any) {
            showAlert('Error', error.response?.data?.detail || 'Failed to create application.', 'error');
        } finally {
            setSavingProApplication(false);
        }
    };

    // Fetch Initial Data
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [statsRes, bookingsRes, customersRes, partnersRes, servicesRes, categoriesRes, proRegistrationsRes] = await Promise.all([
                    apiClient.get('/admin/stats'),
                    apiClient.get('/admin/bookings'),
                    apiClient.get('/customers'),
                    apiClient.get('/partners'),
                    apiClient.get('/services'),
                    apiClient.get('/categories'),
                    apiClient.get('/professionals/registrations')
                ]);

                setStats(statsRes.data);
                setBookings(bookingsRes.data);
                setCustomers(customersRes.data);
                setPartners(partnersRes.data);
                setServices(servicesRes.data);
                setCategories(categoriesRes.data);
                setProfessionalRegistrations(proRegistrationsRes.data.registrations || []);
            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'admin') {
            fetchAllData();
        } else {
            navigate('/dashboard'); // Redirect if not admin
        }
    }, [user, navigate]);

    // Fetch Unread Notifications Count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await apiClient.get('/notifications/unread-count');
                setUnreadNotifications(response.data.unread_count);
            } catch (error) {
                console.error("Failed to fetch unread notifications:", error);
            }
        };

        if (user?.role === 'admin') {
            fetchUnreadCount();
            // Refresh count every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Handlers
    const handleAssignPartner = async (bookingId: string, partnerId: string) => {
        if (!bookingId || !partnerId) {
            showAlert("Missing ID", "Cannot assign: Missing booking or partner ID.", "error");
            return;
        }
        setAssigningPartner(true);
        try {
            await apiClient.put(`/admin/bookings/${bookingId}/assign`, { partner_id: partnerId });

            // Refresh bookings
            const bookingsRes = await apiClient.get('/admin/bookings');
            setBookings(bookingsRes.data);

            // Update stats
            const statsRes = await apiClient.get('/admin/stats');
            setStats(statsRes.data);

            setIsAssignModalOpen(false);
            setSelectedBooking(null);
            showAlert("Assigned", "Partner assigned successfully!", "success");
        } catch (error) {
            console.error("Failed to assign partner:", error);
            showAlert("Error", "Failed to assign partner. Please try again.", "error");
        } finally {
            setAssigningPartner(false);
        }
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editItem) return;

        setLoading(true);
        try {
            const id = editItem.data._id || editItem.data.id;
            if (!id) throw new Error("Missing ID");

            if (editItem.type === 'booking') {
                await apiClient.put(`/admin/bookings/${id}`, {
                    status: editItem.data.status,
                    price: Number(editItem.data.price || editItem.data.total_price),
                    notes: editItem.data.notes
                });
            } else {
                // User or Partner
                await apiClient.put(`/admin/users/${id}`, {
                    name: editItem.data.name,
                    email: editItem.data.email,
                    phone: editItem.data.phone,
                    status: editItem.data.status,
                    ...(editItem.type === 'partner' ? { business_type: editItem.data.business_type } : {})
                });
            }

            // Refresh data
            const [statsRes, bookingsRes, customersRes, partnersRes] = await Promise.all([
                apiClient.get('/admin/stats'),
                apiClient.get('/admin/bookings'),
                apiClient.get('/customers'),
                apiClient.get('/partners')
            ]);

            setStats(statsRes.data);
            setBookings(bookingsRes.data);
            setCustomers(customersRes.data);
            setPartners(partnersRes.data);
            setEditItem(null);
            showAlert("Updated", "Updated successfully!", "success");
        } catch (error) {
            console.error("Update failed:", error);
            showAlert("Update Failed", "Failed to update item.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRegistrationStatus = async (registrationId: string, status: 'approved' | 'rejected', notes?: string) => {
        setUpdatingRegistrationStatus(registrationId);
        try {
            await apiClient.patch(`/professionals/registrations/${registrationId}/status`, {
                status,
                review_notes: notes || ''
            });

            // Refresh registrations
            const response = await apiClient.get('/professionals/registrations');
            setProfessionalRegistrations(response.data.registrations || []);
            setSelectedRegistration(null);
            showAlert(
                status === 'approved' ? "Approved" : "Rejected",
                `Professional registration has been ${status}.`,
                status === 'approved' ? "success" : "error"
            );
        } catch (error) {
            console.error("Failed to update registration status:", error);
            showAlert("Error", "Failed to update registration status.", "error");
        } finally {
            setUpdatingRegistrationStatus(null);
        }
    };

    const handleDeleteRegistration = async (registrationId: string) => {
        if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
            return;
        }
        
        try {
            await apiClient.delete(`/professionals/registrations/${registrationId}`);
            
            // Refresh registrations
            const response = await apiClient.get('/professionals/registrations');
            setProfessionalRegistrations(response.data.registrations || []);
            setSelectedRegistration(null);
            showAlert("Deleted", "Professional application has been deleted.", "success");
        } catch (error) {
            console.error("Failed to delete registration:", error);
            showAlert("Error", "Failed to delete registration.", "error");
        }
    };

    const handleUpdateAdminProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSavingProfile(true);
        try {
            // @ts-ignore - user might have _id from backend
            const userId = user.id || user._id;
            if (!userId) throw new Error("User ID missing");

            const response = await apiClient.put(`/admin/users/${userId}`, {
                name: profileFormData.name,
                email: profileFormData.email,
                phone: profileFormData.phone,
                address: profileFormData.address
            });

            // Update auth store with new data
            const { setAuth, token } = useAuthStore.getState();
            const updatedUser = {
                ...user,
                name: profileFormData.name,
                email: profileFormData.email,
                phone: profileFormData.phone,
                address: profileFormData.address
            };
            setAuth(updatedUser, token || '');

            setIsEditProfileModalOpen(false);
            showAlert("Profile Updated", response.data.message || "Profile updated successfully!", "success");
        } catch (error: any) {
            console.error("Profile update failed:", error);
            showAlert("Error", error.response?.data?.detail || "Failed to update profile.", "error");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleOpenEditProfileModal = () => {
        setProfileFormData({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || ''
        });
        setIsEditProfileModalOpen(true);
    };

    const handleDeleteUser = async (userId: string, type: 'customer' | 'partner') => {
        if (!userId) {
            showAlert("Error", "Cannot delete: User ID is missing.", "error");
            return;
        }
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await apiClient.delete(`/admin/users/${userId}`);
            if (type === 'customer') {
                setCustomers(customers.filter(c => c._id !== userId));
            } else {
                setPartners(partners.filter(p => p._id !== userId));
            }
            showAlert("Deleted", "User deleted successfully!", "success");
        } catch (error) {
            console.error("Failed to delete user:", error);
            showAlert("Error", "Failed to delete user.", "error");
        }
    };

    const handleApprovePartner = async (partnerId: string) => {
        if (!partnerId) {
            showAlert("Error", "Cannot approve: Partner ID is missing.", "error");
            return;
        }

        try {
            await apiClient.put(`/admin/users/${partnerId}`, {
                status: 'active'
            });

            // Refresh partners list
            const partnersRes = await apiClient.get('/partners');
            setPartners(partnersRes.data);

            // Update stats
            const statsRes = await apiClient.get('/admin/stats');
            setStats(statsRes.data);

            showAlert("Approved", "Partner approved successfully!", "success");
        } catch (error) {
            console.error("Failed to approve partner:", error);
            showAlert("Error", "Failed to approve partner.", "error");
        }
    };

    const handleRejectPartner = async (partnerId: string) => {
        if (!partnerId) {
            showAlert("Error", "Cannot reject: Partner ID is missing.", "error");
            return;
        }

        if (!confirm('Are you sure you want to reject this partner application?')) return;

        try {
            await apiClient.put(`/admin/users/${partnerId}`, {
                status: 'rejected'
            });

            // Refresh partners list
            const partnersRes = await apiClient.get('/partners');
            setPartners(partnersRes.data);

            showAlert("Rejected", "Partner application rejected.", "info");
        } catch (error) {
            console.error("Failed to reject partner:", error);
            showAlert("Error", "Failed to reject partner.", "error");
        }
    };

    const handleOpenServiceModal = (service?: Service) => {
        if (service) {
            setServiceFormData({
                title: service.title,
                description: service.description,
                price: service.price,
                category_id: service.category_id,
                image: service.image,
                is_active: service.is_active,
                tags: service.tags || []
            });
            setEditingServiceId(service._id || service.id || null);
        } else {
            setServiceFormData({
                title: '',
                description: '',
                price: 0,
                category_id: categories.length > 0 ? categories[0]._id : '',
                image: '',
                is_active: true,
                tags: []
            });
            setEditingServiceId(null);
        }
        setServiceImageFile(null);
        setIsServiceModalOpen(true);
    };

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingService(true);
        try {
            let serviceId = editingServiceId;
            const payload = {
                ...serviceFormData,
                price: Number(serviceFormData.price)
            };

            if (editingServiceId) {
                await apiClient.put(`/services/${editingServiceId}`, payload);
            } else {
                const res = await apiClient.post('/services', payload);
                serviceId = res.data._id || res.data.id;
            }

            // Handle Image Upload if exists
            if (serviceImageFile && serviceId) {
                const formData = new FormData();
                formData.append('file', serviceImageFile);
                await apiClient.post(`/services/${serviceId}/upload-image`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // Refresh services
            const servicesRes = await apiClient.get('/services');
            setServices(servicesRes.data);
            setIsServiceModalOpen(false);
            showAlert("Service Saved", editingServiceId ? "Service updated successfully!" : "New service created!", "success");
        } catch (error) {
            console.error("Error saving service:", error);
            showAlert("Error", "Failed to save service.", "error");
        } finally {
            setSavingService(false);
        }
    };

    const handleDeleteService = async (serviceId: string) => {
        if (!window.confirm("Are you sure you want to delete this service?")) return;
        try {
            await apiClient.delete(`/services/${serviceId}`);
            setServices(services.filter(s => (s._id || s.id) !== serviceId));
            showAlert("Deleted", "Service deleted successfully!", "success");
        } catch (error) {
            console.error("Error deleting service:", error);
            showAlert("Error", "Failed to delete service.", "error");
        }
    };

    const handleAddNew = () => {
        if (activeTab === 'services') {
            handleOpenServiceModal();
        } else if (activeTab === 'bookings') {
            showAlert("Create Booking", "To create a new booking, please use the main website's booking flow or implement a manual booking creation form here.", "info");
        } else if (activeTab === 'partners' || activeTab === 'users') {
            showAlert("Manual Creation", `Manual creation of ${activeTab} is coming soon. For now, users can register via the registration page.`, "info");
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

        const baseUrl = config.apiUrl.endsWith('/api')
            ? config.apiUrl.replace('/api', '')
            : config.apiUrl;

        let path = imagePath;
        if (!path.startsWith('/')) {
            path = `/uploads/${path}`;
        } else if (!path.startsWith('/uploads/')) {
            path = `/uploads${path}`;
        }

        return `${baseUrl}${path}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'assigned': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'in_progress': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'completed': return 'text-blue-600 bg-green-50 border-green-200';
            case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    // Filtered Content with Status and Sort logic
    const applyFiltersAndSort = (items: any[], type?: string) => {
        let result = [...items];

        // Search Filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(item => {
                if ('customer_name' in item) { // Booking
                    return item.customer_name.toLowerCase().includes(lowerSearch) ||
                        item.service_type.toLowerCase().includes(lowerSearch) ||
                        (item.services && item.services.some((s: any) => s.service_title.toLowerCase().includes(lowerSearch))) ||
                        (item._id || item.id || '').toLowerCase().includes(lowerSearch);
                }
                // User / Partner / Service
                return item.name?.toLowerCase().includes(lowerSearch) ||
                    item.email?.toLowerCase().includes(lowerSearch) ||
                    item.title?.toLowerCase().includes(lowerSearch) ||
                    item.description?.toLowerCase().includes(lowerSearch) ||
                    item.category_name?.toLowerCase().includes(lowerSearch) ||
                    item.tags?.some((tag: string) => tag.toLowerCase().includes(lowerSearch));
            });
        }

        // Category Filter (for services only)
        if (type === 'services' && filterCategory !== 'All Categories') {
            result = result.filter(item => item.category_name === filterCategory);
        }

        // Status Filter
        if (filterStatus !== 'All Statuses') {
            result = result.filter(item => {
                // For services, check is_active
                if ('is_active' in item) {
                    if (filterStatus === 'Active') return item.is_active === true;
                    if (filterStatus === 'Inactive') return item.is_active === false;
                }
                return item.status?.toLowerCase() === filterStatus.toLowerCase();
            });
        }

        // Sorting
        result.sort((a, b) => {
            const dateA = new Date(a.created_at || a.scheduled_date || 0).getTime();
            const dateB = new Date(b.created_at || b.scheduled_date || 0).getTime();

            if (sortBy === 'Newest First') return dateB - dateA;
            if (sortBy === 'Oldest First') return dateA - dateB;
            if (sortBy === 'Price: High to Low') return (b.price || b.total_price || 0) - (a.price || a.total_price || 0);
            if (sortBy === 'Price: Low to High') return (a.price || a.total_price || 0) - (b.price || b.total_price || 0);
            return 0;
        });

        return result;
    };

    const filteredBookings = applyFiltersAndSort(bookings);
    const filteredPartners = applyFiltersAndSort(partners);
    const filteredCustomers = applyFiltersAndSort(customers);
    const filteredServices = applyFiltersAndSort(services, 'services');

    const resetFilters = () => {
        setSearchTerm('');
        setFilterStatus('All Statuses');
        setFilterCategory('All Categories');
        setSortBy('Newest First');
        showAlert("Filters Reset", "All search and filter criteria have been cleared.", 'info');
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900">Loading Admin Dashboard...</h2>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-white py-12 animate-fade-in">
                {/* Background Pattern */}
                <div className="fixed inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="fixed top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
                {/* Header Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
                                Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Dashboard</span>
                            </h1>
                            <p className="text-slate-600">Manage bookings, partners, and users</p>
                        </div>

                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-6 shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
                                        {user?.name?.charAt(0)}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-slate-900 truncate">{user?.name}</h3>
                                        <p className="text-slate-500 text-xs truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setActiveTab('bookings')}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'bookings'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                    >
                                        <Calendar className="w-5 h-5 mr-3" />
                                        Bookings
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('partners')}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'partners'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                    >
                                        <Briefcase className="w-5 h-5 mr-3" />
                                        Partners
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('services')}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'services'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                    >
                                        <Package className="w-5 h-5 mr-3" />
                                        Services
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('users')}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                    >
                                        <Users className="w-5 h-5 mr-3" />
                                        Customers
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('pro-applications')}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'pro-applications'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                    >
                                        <div className="relative mr-3">
                                            <ClipboardList className="w-5 h-5" />
                                            {professionalRegistrations.filter(r => r.status === 'pending').length > 0 && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>
                                            )}
                                        </div>
                                        Pro Applications
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('notifications')}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'notifications'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                    >
                                        <UserIcon className="w-5 h-5 mr-3" />
                                        Admin Settings
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
                            ) : (
                                <>
                                    {/* Stats Cards - Hide on Profile and Pro Applications Tab */}
                                    {activeTab !== 'profile' && activeTab !== 'pro-applications' && stats && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                            {[
                                                { label: 'Total Bookings', value: stats.total_bookings, icon: Calendar, gradient: 'from-blue-500 to-blue-700' },
                                                { label: 'Pending', value: stats.pending_bookings, icon: DollarSign, gradient: 'from-amber-500 to-orange-600' },
                                                { label: 'Partners', value: stats.total_partners, icon: Briefcase, gradient: 'from-blue-500 to-cyan-600' },
                                                { label: 'Customers', value: stats.total_customers, icon: Users, gradient: 'from-purple-500 to-pink-600' },
                                            ].map((stat, i) => (
                                                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-md transition-all shadow-sm">
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
                                    )}

                                    {activeTab !== 'profile' && activeTab !== 'pro-applications' && (
                                        <>
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                                                <div className="relative w-full md:w-96">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                    <input
                                                        type="text"
                                                        placeholder={`Search ${activeTab}...`}
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 text-slate-900 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                                                    />
                                                </div>
                                                <div className="flex gap-3 w-full md:w-auto">
                                                    <button
                                                        onClick={() => setIsFilterVisible(!isFilterVisible)}
                                                        className={`flex items-center justify-center px-4 py-2.5 rounded-xl transition-all ${isFilterVisible
                                                            ? 'bg-green-50 text-blue-600 border border-green-200'
                                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'
                                                            }`}
                                                    >
                                                        <Filter className="w-4 h-4 mr-2" /> Filter
                                                    </button>
                                                    <button
                                                        onClick={handleAddNew}
                                                        className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-semibold shadow-lg shadow-blue-500/20"
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        {activeTab === 'services' ? 'Add Service' : 'Add New'}
                                                    </button>
                                                </div>
                                            </div>

                                            {isFilterVisible && (
                                                <div className="mb-6 p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2 duration-300 relative z-30 shadow-sm">
                                                    <div className="flex flex-col gap-1.5 min-w-[160px] relative">
                                                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-1">Status</label>
                                                        <button
                                                            onClick={() => {
                                                                setIsStatusDropdownOpen(!isStatusDropdownOpen);
                                                                setIsSortDropdownOpen(false);
                                                            }}
                                                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm flex items-center justify-between hover:border-blue-500 transition-colors"
                                                        >
                                                            {filterStatus}
                                                            <Filter className={`w-3 h-3 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {isStatusDropdownOpen && (
                                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-200">
                                                                {(activeTab === 'services' 
                                                                    ? ['All Statuses', 'Active', 'Inactive']
                                                                    : ['All Statuses', 'Pending', 'Active', 'Completed', 'Cancelled']
                                                                ).map((status) => (
                                                                    <button
                                                                        key={status}
                                                                        onClick={() => {
                                                                            setFilterStatus(status);
                                                                            setIsStatusDropdownOpen(false);
                                                                        }}
                                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${filterStatus === status ? 'text-blue-600 bg-green-50' : 'text-slate-600'}`}
                                                                    >
                                                                        {status}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Category Filter - Only for Services */}
                                                    {activeTab === 'services' && (
                                                        <div className="flex flex-col gap-1.5 min-w-[180px] relative">
                                                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-1">Category</label>
                                                            <button
                                                                onClick={() => {
                                                                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                                                                    setIsStatusDropdownOpen(false);
                                                                    setIsSortDropdownOpen(false);
                                                                }}
                                                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm flex items-center justify-between hover:border-blue-500 transition-colors"
                                                            >
                                                                <span className="truncate">{filterCategory}</span>
                                                                <Filter className={`w-3 h-3 flex-shrink-0 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                                            </button>
                                                            {isCategoryDropdownOpen && (
                                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto">
                                                                    <button
                                                                        onClick={() => {
                                                                            setFilterCategory('All Categories');
                                                                            setIsCategoryDropdownOpen(false);
                                                                        }}
                                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${filterCategory === 'All Categories' ? 'text-blue-600 bg-green-50' : 'text-slate-600'}`}
                                                                    >
                                                                        All Categories
                                                                    </button>
                                                                    {categories.map((cat) => (
                                                                        <button
                                                                            key={cat._id}
                                                                            onClick={() => {
                                                                                setFilterCategory(cat.name);
                                                                                setIsCategoryDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${filterCategory === cat.name ? 'text-blue-600 bg-green-50' : 'text-slate-600'}`}
                                                                        >
                                                                            {cat.name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex flex-col gap-1.5 min-w-[180px] relative">
                                                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-1">Sort By</label>
                                                        <button
                                                            onClick={() => {
                                                                setIsSortDropdownOpen(!isSortDropdownOpen);
                                                                setIsStatusDropdownOpen(false);
                                                            }}
                                                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm flex items-center justify-between hover:border-blue-500 transition-colors"
                                                        >
                                                            {sortBy}
                                                            <Package className={`w-3 h-3 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {isSortDropdownOpen && (
                                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-200">
                                                                {['Newest First', 'Oldest First', 'Price: High to Low', 'Price: Low to High'].map((sort) => (
                                                                    <button
                                                                        key={sort}
                                                                        onClick={() => {
                                                                            setSortBy(sort);
                                                                            setIsSortDropdownOpen(false);
                                                                        }}
                                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${sortBy === sort ? 'text-blue-600 bg-green-50' : 'text-slate-600'}`}
                                                                    >
                                                                        {sort}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-end">
                                                        <button
                                                            onClick={resetFilters}
                                                            className="px-4 py-2 text-slate-500 hover:text-slate-900 text-sm font-bold border border-transparent hover:border-slate-200 rounded-xl transition-all"
                                                        >
                                                            Reset Filters
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}


                                    {/* BOOKINGS TAB */}
                                    {activeTab === 'bookings' && (
                                        <div className="grid gap-4">
                                            {filteredBookings.length > 0 ? (
                                                filteredBookings.map((booking) => (
                                                    <div key={booking._id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all">
                                                        <div className="flex flex-col lg:flex-row gap-6">
                                                            {/* Service Image */}
                                                            <div className="flex-shrink-0">
                                                                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden relative">
                                                                    <img
                                                                        src={getImageUrl(booking.services?.[0]?.service_image || (booking.services?.[0] as any)?.image)}
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

                                                            {/* Left: Info */}
                                                            <div className="flex-grow space-y-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getStatusColor(booking.status)}`}>
                                                                                {booking.status}
                                                                            </span>
                                                                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">#{booking._id?.slice(-6) || 'N/A'}</span>
                                                                        </div>
                                                                        <h3 className="text-lg font-bold text-slate-900">
                                                                            {booking.services && booking.services.length > 0
                                                                                ? booking.services.map((s: any) => s.service_title).join(', ')
                                                                                : booking.service_type}
                                                                        </h3>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
                                                                    <div className="flex items-center">
                                                                        <Users className="w-4 h-4 mr-2 text-slate-400" />
                                                                        {booking.customer_name}
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                                                        {formatDate(booking.scheduled_date)}
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                                                        <span className="truncate">{booking.service_address}</span>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        {booking.partner_name ? (
                                                                            <>
                                                                                <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
                                                                                <span className="text-blue-600 font-medium">{booking.partner_name}</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                                                                                <span className="text-slate-400 italic">Unassigned</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    {(booking as any).before_cleaning_image || (booking as any).after_cleaning_image ? (
                                                                        <div className="flex items-center text-blue-600">
                                                                            <Camera className="w-4 h-4 mr-2" />
                                                                            <span>Photos Available</span>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </div>

                                                            {/* Right: Actions */}
                                                            <div className="flex lg:flex-col items-center justify-center gap-2 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
                                                                {(booking.status === 'pending' || booking.status === 'unassigned') && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedBooking(booking);
                                                                            setIsAssignModalOpen(true);
                                                                        }}
                                                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                                                                    >
                                                                        <Briefcase className="w-4 h-4" /> Assign Partner
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => setEditItem({ type: 'booking', data: { ...booking } })}
                                                                    className="w-full px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
                                                                >
                                                                    <Edit className="w-4 h-4" /> Edit Details
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl border-dashed">
                                                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                                    <h3 className="text-lg font-bold text-slate-900 mb-1">No bookings found</h3>
                                                    <p className="text-slate-500">Try adjusting your search filters</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* SERVICES TAB */}
                                    {activeTab === 'services' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredServices.length > 0 ? (
                                                filteredServices.map((service) => (
                                                    <div key={service._id || service.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all group flex flex-col">
                                                        <div className="h-48 overflow-hidden relative">
                                                            <img
                                                                src={getImageUrl(service.image || (service as any).service_image)}
                                                                alt={service.title}
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                                onError={(e) => { e.currentTarget.src = '/service-placeholder.png'; }}
                                                            />
                                                            {service.category_name && (
                                                                <span className="absolute top-4 left-4 z-20 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/10 uppercase tracking-wider">
                                                                    {service.category_name}
                                                                </span>
                                                            )}
                                                            <div className="absolute top-4 right-4 flex gap-2">
                                                                <button
                                                                    onClick={() => handleOpenServiceModal(service)}
                                                                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-slate-700 hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteService(service._id || service.id || '')}
                                                                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-slate-700 hover:bg-red-600 hover:text-white transition-colors shadow-sm"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            {!service.is_active && (
                                                                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                                                                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Inactive</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="p-6 flex-grow flex flex-col">
                                                            <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                                                            <p className="text-slate-600 text-sm mb-4">{service.description}</p>
                                                            <div className="flex flex-wrap gap-2 mt-auto">
                                                                {service.tags?.slice(0, 5).map((tag: string, idx: number) => (
                                                                    <span key={idx} className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-600 font-semibold">#{tag}</span>
                                                                ))}
                                                                {service.tags && service.tags.length > 5 && (
                                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">+{service.tags.length - 5} more</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full text-center py-20 bg-white border border-slate-200 rounded-2xl border-dashed">
                                                    <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                                    <h3 className="text-lg font-bold text-slate-900 mb-1">No services found</h3>
                                                    <p className="text-slate-500">Try adjusting your filters or search terms</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* USERS & PARTNERS TABS */}
                                    {(activeTab === 'users' || activeTab === 'partners') && (
                                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-200">
                                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name / ID</th>
                                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                                            {activeTab === 'partners' && (
                                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Availability</th>
                                                            )}
                                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200">
                                                        {(activeTab === 'users' ? filteredCustomers : filteredPartners).map((item) => (
                                                            <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200">
                                                                            {item.name.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-slate-900">{item.name}</p>
                                                                            <p className="text-xs text-slate-500 font-mono">{(getUserId(item) || 'N/A').slice(-8)}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="space-y-1">
                                                                        <a 
                                                                            href={`mailto:${item.email}`}
                                                                            className="text-sm text-slate-700 hover:text-blue-600 transition-colors"
                                                                            title="Click to send email"
                                                                        >
                                                                            {item.email}
                                                                        </a>
                                                                        {item.phone ? (
                                                                            <a 
                                                                                href={`tel:${item.phone}`}
                                                                                className="block text-xs text-slate-500 hover:text-green-600 transition-colors"
                                                                                title="Click to call"
                                                                            >
                                                                                {item.phone}
                                                                            </a>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-500">N/A</p>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize border ${item.status === 'active'
                                                                        ? 'bg-green-50 text-blue-600 border-green-200'
                                                                        : item.status === 'pending'
                                                                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                                            : item.status === 'rejected'
                                                                                ? 'bg-red-50 text-red-600 border-red-200'
                                                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                                                        }`}>
                                                                        {item.status}
                                                                    </span>
                                                                </td>
                                                                {activeTab === 'partners' && (
                                                                    <td className="p-4">
                                                                        {item.availability ? (
                                                                            <span className="flex items-center text-blue-600 text-xs font-bold">
                                                                                <CheckCircle className="w-3 h-3 mr-1" /> Available
                                                                            </span>
                                                                        ) : (
                                                                            <span className="flex items-center text-slate-500 text-xs font-bold">
                                                                                <XCircle className="w-3 h-3 mr-1" /> Unavailable
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                )}
                                                                <td className="p-4 text-sm text-slate-600">
                                                                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                                                                </td>
                                                                <td className="p-4 text-right">
                                                                    <div className="flex flex-col items-end gap-2">
                                                                        {activeTab === 'partners' && (item.status === 'pending' || item.status === 'inactive') && (
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const uid = getUserId(item);
                                                                                        if (uid) handleApprovePartner(uid);
                                                                                    }}
                                                                                    className="p-2 bg-green-50 text-blue-600 rounded-lg hover:bg-blue-500 hover:text-white transition-colors border border-green-200"
                                                                                    title="Approve Partner"
                                                                                >
                                                                                    <CheckCircle className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const uid = getUserId(item);
                                                                                        if (uid) handleRejectPartner(uid);
                                                                                    }}
                                                                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-200"
                                                                                    title="Reject Partner"
                                                                                >
                                                                                    <XCircle className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => setEditItem({ type: activeTab === 'users' ? 'user' : 'partner', data: { ...item } })}
                                                                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                                                                title="Edit"
                                                                            >
                                                                                <Edit className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    const uid = getUserId(item);
                                                                                    if (uid) handleDeleteUser(uid, activeTab === 'users' ? 'customer' : 'partner');
                                                                                }}
                                                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {(activeTab === 'users' ? filteredCustomers : filteredPartners).length === 0 && (
                                                    <div className="text-center py-12">
                                                        <p className="text-slate-500">No {activeTab} found matching your search.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* PRO APPLICATIONS TAB */}
                                    {activeTab === 'pro-applications' && (
                                        <div className="space-y-6">
                                            {/* Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-900">Professional Applications</h2>
                                                    <p className="text-slate-500 mt-1">Review and manage professional registration requests</p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => setIsAddProModalOpen(true)}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Add Application
                                                    </button>
                                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                                                        {professionalRegistrations.filter(r => r.status === 'pending').length} Pending
                                                    </span>
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                                        {professionalRegistrations.filter(r => r.status === 'approved').length} Approved
                                                    </span>
                                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                                                        {professionalRegistrations.filter(r => r.status === 'rejected').length} Rejected
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Applications Grid */}
                                            {professionalRegistrations.length > 0 ? (
                                                <div className="grid gap-4">
                                                    {professionalRegistrations.map((registration) => (
                                                        <div 
                                                            key={registration._id}
                                                            className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all"
                                                        >
                                                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                                                {/* Left: Basic Info */}
                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                                                            <span className="text-blue-600 font-bold text-lg">
                                                                                {registration.fullName.charAt(0).toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="font-bold text-slate-900 text-lg">{registration.fullName}</h3>
                                                                            <p className="text-slate-500 text-sm">{registration.locationName}</p>
                                                                        </div>
                                                                        {/* Status Badge */}
                                                                        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                                            registration.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                                            registration.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                            'bg-red-100 text-red-700'
                                                                        }`}>
                                                                            {registration.status}
                                                                        </span>
                                                                    </div>

                                                                    {/* Contact Info */}
                                                                    <div className="flex flex-wrap gap-4 text-sm">
                                                                        <a 
                                                                            href={`mailto:${registration.email}`}
                                                                            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
                                                                            title="Click to send email"
                                                                        >
                                                                            <Mail className="w-4 h-4 text-slate-400" />
                                                                            {registration.email}
                                                                        </a>
                                                                        <a 
                                                                            href={`tel:${registration.phone}`}
                                                                            className="flex items-center gap-2 text-slate-600 hover:text-green-600 transition-colors"
                                                                            title="Click to call"
                                                                        >
                                                                            <Phone className="w-4 h-4 text-slate-400" />
                                                                            {registration.phone}
                                                                        </a>
                                                                        <div className="flex items-center gap-2 text-slate-600">
                                                                            <Globe className="w-4 h-4 text-slate-400" />
                                                                            {registration.nationality}
                                                                        </div>
                                                                    </div>

                                                                    {/* Details */}
                                                                    <div className="flex flex-wrap gap-3">
                                                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                                                            registration.hasNZLicense ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                                                        }`}>
                                                                            <Car className="w-3 h-3 inline mr-1" />
                                                                            {registration.hasNZLicense ? 'NZ License' : 'No NZ License'}
                                                                        </span>
                                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                                                                            {registration.yearsExperience} years experience
                                                                        </span>
                                                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                                                                            {registration.availability}
                                                                        </span>
                                                                    </div>

                                                                    {/* Specializations */}
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {registration.specializations.slice(0, 4).map((spec, idx) => (
                                                                            <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">
                                                                                {spec}
                                                                            </span>
                                                                        ))}
                                                                        {registration.specializations.length > 4 && (
                                                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">
                                                                                +{registration.specializations.length - 4} more
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Submitted Date */}
                                                                    <p className="text-xs text-slate-400">
                                                                        Submitted: {new Date(registration.created_at).toLocaleDateString('en-NZ', {
                                                                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                        })}
                                                                    </p>
                                                                </div>

                                                                {/* Right: Actions */}
                                                                <div className="flex lg:flex-col gap-2">
                                                                    <button
                                                                        onClick={() => setSelectedRegistration(registration)}
                                                                        className="flex-1 lg:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                        View Details
                                                                    </button>
                                                                    {registration.status === 'pending' && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleUpdateRegistrationStatus(registration._id, 'approved')}
                                                                                disabled={updatingRegistrationStatus === registration._id}
                                                                                className="flex-1 lg:flex-none px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                                            >
                                                                                <Check className="w-4 h-4" />
                                                                                Approve
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleUpdateRegistrationStatus(registration._id, 'rejected')}
                                                                                disabled={updatingRegistrationStatus === registration._id}
                                                                                className="flex-1 lg:flex-none px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                                Reject
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDeleteRegistration(registration._id)}
                                                                        className="flex-1 lg:flex-none px-4 py-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                                                                        title="Delete this application"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                                                    <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Applications Yet</h3>
                                                    <p className="text-slate-500">Professional registration applications will appear here when submitted.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Professional Registration Detail Modal */}
                                    {selectedRegistration && (
                                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                                    <h3 className="text-xl font-bold text-slate-900">Application Details</h3>
                                                    <button
                                                        onClick={() => setSelectedRegistration(null)}
                                                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                                    >
                                                        <X className="w-5 h-5 text-slate-500" />
                                                    </button>
                                                </div>
                                                <div className="p-6 space-y-6">
                                                    {/* Header */}
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                                                            <span className="text-blue-600 font-bold text-2xl">
                                                                {selectedRegistration.fullName.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xl font-bold text-slate-900">{selectedRegistration.fullName}</h4>
                                                            <p className="text-slate-500">{selectedRegistration.locationName}</p>
                                                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                                selectedRegistration.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                                selectedRegistration.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                                {selectedRegistration.status}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Contact Info */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                                            <a 
                                                                href={`mailto:${selectedRegistration.email}`}
                                                                className="text-slate-900 hover:text-blue-600 transition-colors"
                                                                title="Click to send email"
                                                            >
                                                                {selectedRegistration.email}
                                                            </a>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                                                            <a 
                                                                href={`tel:${selectedRegistration.phone}`}
                                                                className="text-slate-900 hover:text-green-600 transition-colors"
                                                                title="Click to call"
                                                            >
                                                                {selectedRegistration.phone}
                                                            </a>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nationality</label>
                                                            <p className="text-slate-900">{selectedRegistration.nationality}</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NZ Driver's License</label>
                                                            <p className={selectedRegistration.hasNZLicense ? 'text-green-600 font-semibold' : 'text-slate-900'}>
                                                                {selectedRegistration.hasNZLicense ? 'Yes' : 'No'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Experience & Availability */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Experience</label>
                                                            <p className="text-slate-900">{selectedRegistration.yearsExperience} years</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Availability</label>
                                                            <p className="text-slate-900">{selectedRegistration.availability}</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preferred Start Date</label>
                                                            <p className="text-slate-900">{selectedRegistration.preferredStartDate || 'Not specified'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Specializations */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Specializations</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedRegistration.specializations.map((spec, idx) => (
                                                                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                                                                    {spec}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* About */}
                                                    {selectedRegistration.aboutYourself && (
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">About</label>
                                                            <p className="text-slate-700 bg-slate-50 p-4 rounded-xl whitespace-pre-wrap">
                                                                {selectedRegistration.aboutYourself}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Review Notes (if reviewed) */}
                                                    {selectedRegistration.review_notes && (
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Review Notes</label>
                                                            <p className="text-slate-700 bg-amber-50 p-4 rounded-xl">
                                                                {selectedRegistration.review_notes}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Timestamps */}
                                                    <div className="text-xs text-slate-400 pt-4 border-t border-slate-200">
                                                        <p>Submitted: {new Date(selectedRegistration.created_at).toLocaleString('en-NZ')}</p>
                                                        {selectedRegistration.reviewed_at && (
                                                            <p>Reviewed: {new Date(selectedRegistration.reviewed_at).toLocaleString('en-NZ')}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                {selectedRegistration.status === 'pending' && (
                                                    <div className="p-6 border-t border-slate-200 flex gap-3">
                                                        <button
                                                            onClick={() => handleUpdateRegistrationStatus(selectedRegistration._id, 'approved')}
                                                            disabled={updatingRegistrationStatus === selectedRegistration._id}
                                                            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                        >
                                                            <Check className="w-5 h-5" />
                                                            Approve Application
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateRegistrationStatus(selectedRegistration._id, 'rejected')}
                                                            disabled={updatingRegistrationStatus === selectedRegistration._id}
                                                            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                        >
                                                            <X className="w-5 h-5" />
                                                            Reject Application
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Add Pro Application Modal */}
                                    {isAddProModalOpen && (
                                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                                    <h3 className="text-xl font-bold text-slate-900">Add Professional Application</h3>
                                                    <button
                                                        onClick={() => setIsAddProModalOpen(false)}
                                                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                                    >
                                                        <X className="w-5 h-5 text-slate-500" />
                                                    </button>
                                                </div>
                                                <div className="p-6 space-y-6">
                                                    {/* Personal Info */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name *</label>
                                                            <input
                                                                type="text"
                                                                value={proApplicationForm.fullName}
                                                                onChange={(e) => setProApplicationForm(prev => ({ ...prev, fullName: e.target.value }))}
                                                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                                placeholder="Enter full name"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-2">Email *</label>
                                                            <input
                                                                type="email"
                                                                value={proApplicationForm.email}
                                                                onChange={(e) => setProApplicationForm(prev => ({ ...prev, email: e.target.value }))}
                                                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                                placeholder="Enter email address"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-2">Phone *</label>
                                                            <PhoneInput
                                                                value={proApplicationForm.phone}
                                                                onChange={(phone) => setProApplicationForm(prev => ({ ...prev, phone }))}
                                                                placeholder="Enter phone number"
                                                                defaultCountryCode="+64"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-2">Nationality</label>
                                                            <input
                                                                type="text"
                                                                value={proApplicationForm.nationality}
                                                                onChange={(e) => setProApplicationForm(prev => ({ ...prev, nationality: e.target.value }))}
                                                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                                placeholder="Enter nationality"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* License & Experience */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-2">NZ Driver's License</label>
                                                            <select
                                                                value={proApplicationForm.hasNZLicense}
                                                                onChange={(e) => setProApplicationForm(prev => ({ ...prev, hasNZLicense: e.target.value }))}
                                                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                            >
                                                                <option value="Yes">Yes</option>
                                                                <option value="No">No</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-2">Years Experience</label>
                                                            <input
                                                                type="text"
                                                                value={proApplicationForm.yearsExperience}
                                                                onChange={(e) => setProApplicationForm(prev => ({ ...prev, yearsExperience: e.target.value }))}
                                                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                                placeholder="e.g., 5"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-2">Availability</label>
                                                            <select
                                                                value={proApplicationForm.availability}
                                                                onChange={(e) => setProApplicationForm(prev => ({ ...prev, availability: e.target.value }))}
                                                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                            >
                                                                <option value="Full-Time">Full-Time</option>
                                                                <option value="Part-Time">Part-Time</option>
                                                                <option value="Weekends">Weekends</option>
                                                                <option value="Flexible">Flexible</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Location */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                                                            <select
                                                                value={proApplicationForm.location}
                                                                onChange={(e) => {
                                                                    const locationMap: Record<string, string> = {
                                                                        'auckland': 'Auckland',
                                                                        'wellington': 'Wellington',
                                                                        'christchurch': 'Christchurch',
                                                                        'hamilton': 'Hamilton'
                                                                    };
                                                                    setProApplicationForm(prev => ({
                                                                        ...prev,
                                                                        location: e.target.value,
                                                                        locationName: locationMap[e.target.value] || e.target.value
                                                                    }));
                                                                }}
                                                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                            >
                                                                <option value="auckland">Auckland</option>
                                                                <option value="wellington">Wellington</option>
                                                                <option value="christchurch">Christchurch</option>
                                                                <option value="hamilton">Hamilton</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Start Date</label>
                                                            <input
                                                                type="date"
                                                                value={proApplicationForm.preferredStartDate}
                                                                onChange={(e) => setProApplicationForm(prev => ({ ...prev, preferredStartDate: e.target.value }))}
                                                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Specializations */}
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2">Specializations * (select at least one)</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {specializationOptions.map((spec) => (
                                                                <button
                                                                    key={spec}
                                                                    type="button"
                                                                    onClick={() => handleSpecializationToggle(spec)}
                                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                                        proApplicationForm.specializations.includes(spec)
                                                                            ? 'bg-blue-600 text-white'
                                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                                    }`}
                                                                >
                                                                    {spec}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* About */}
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2">About the Professional</label>
                                                        <textarea
                                                            value={proApplicationForm.aboutYourself}
                                                            onChange={(e) => setProApplicationForm(prev => ({ ...prev, aboutYourself: e.target.value }))}
                                                            rows={4}
                                                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                                            placeholder="Brief description about the professional..."
                                                        />
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="p-6 border-t border-slate-200 flex gap-3">
                                                    <button
                                                        onClick={() => setIsAddProModalOpen(false)}
                                                        className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleAddProApplication}
                                                        disabled={savingProApplication}
                                                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                    >
                                                        {savingProApplication ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                                Creating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="w-5 h-5" />
                                                                Create Application
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* PROFILE TAB */}
                                    {activeTab === 'profile' && user && (
                                        <div className="max-w-4xl mx-auto">
                                            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                                    <UserIcon className="w-6 h-6 text-blue-600" />
                                                    Admin Information
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
                                                        <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Office Address</label>
                                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium truncate">
                                                            {user.address || 'Not provided'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-8 pt-8 border-t border-slate-200 flex gap-4">
                                                    <button
                                                        onClick={handleOpenEditProfileModal}
                                                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                                                    >
                                                        Edit Profile
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            logout();
                                                            navigate('/login');
                                                        }}
                                                        className="flex-1 px-6 py-3 bg-white border border-slate-200 rounded-xl text-red-500 font-bold hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center"
                                                    >
                                                        <LogOut className="w-5 h-5 mr-2" />
                                                        Logout
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Additional Settings Hint */}
                                            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                                        <AlertCircle className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-amber-700 mb-1">Security Notice</h4>
                                                        <p className="text-sm text-slate-600">
                                                            As an administrator, your account has elevated permissions.
                                                            Ensure your contact information is up to date and you use a strong, unique password.
                                                            Changing your email requires direct database intervention for security reasons.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ASSIGN PARTNER MODAL */}
                {isAssignModalOpen && selectedBooking && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Assign Partner</h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        For Booking #{selectedBooking._id?.slice(-6) || 'N/A'} • {selectedBooking.service_type}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsAssignModalOpen(false);
                                        setSelectedBooking(null);
                                    }}
                                    className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search partners by name or location..."
                                        className="w-full bg-white border border-slate-200 text-slate-900 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex-grow overflow-y-auto p-4 space-y-3">
                                {partners.filter(p => p.status === 'active' && p.availability).length > 0 ? (
                                    partners
                                        .filter(p => p.status === 'active' && p.availability)
                                        .map(partner => (
                                            <div key={partner._id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl hover:border-slate-300 transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold border border-slate-300">
                                                        {partner.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{partner.name}</h4>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                                            <span className="flex items-center">
                                                                <MapPin className="w-3 h-3 mr-1" /> {partner.address || 'Unknown Location'}
                                                            </span>
                                                            <span className="flex items-center">
                                                                <Briefcase className="w-3 h-3 mr-1" /> {partner.business_type || 'General Partner'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const bookingId = selectedBooking?._id || selectedBooking?.id;
                                                        const partnerId = getUserId(partner);
                                                        if (bookingId && partnerId) {
                                                            handleAssignPartner(bookingId, partnerId);
                                                        } else {
                                                            console.error("Missing IDs:", { bookingId, partnerId });
                                                            showAlert("Error", "Missing booking or partner ID", "error");
                                                        }
                                                    }}
                                                    disabled={assigningPartner}
                                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {assigningPartner ? 'Assigning...' : 'Assign Job'}
                                                </button>
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-slate-500">No active, available partners found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* EDIT MODAL */}
                {editItem && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 capitalize">Edit {editItem.type}</h2>
                            <form onSubmit={handleUpdateItem} className="space-y-4">
                                {editItem.type === 'booking' ? (
                                    <>
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Status</label>
                                            <select
                                                value={editItem.data.status}
                                                onChange={e => setEditItem({ ...editItem, data: { ...editItem.data, status: e.target.value } })}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded-lg"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="assigned">Assigned</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Price ($)</label>
                                            <input
                                                type="number"
                                                value={editItem.data.price || editItem.data.total_price || 0}
                                                onChange={e => setEditItem({ ...editItem, data: { ...editItem.data, price: e.target.value } })}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded-lg"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={editItem.data.name}
                                                onChange={e => setEditItem({ ...editItem, data: { ...editItem.data, name: e.target.value } })}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={editItem.data.email}
                                                onChange={e => setEditItem({ ...editItem, data: { ...editItem.data, email: e.target.value } })}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Phone</label>
                                            <input
                                                type="text"
                                                value={editItem.data.phone || ''}
                                                onChange={e => setEditItem({ ...editItem, data: { ...editItem.data, phone: e.target.value } })}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Status</label>
                                            <select
                                                value={editItem.data.status}
                                                onChange={e => setEditItem({ ...editItem, data: { ...editItem.data, status: e.target.value } })}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded-lg"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="suspended">Suspended</option>
                                            </select>
                                        </div>
                                        {editItem.type === 'partner' && (
                                            <div>
                                                <label className="text-xs text-slate-500 block mb-1">Business Type</label>
                                                <input
                                                    type="text"
                                                    value={editItem.data.business_type || ''}
                                                    onChange={e => setEditItem({ ...editItem, data: { ...editItem.data, business_type: e.target.value } })}
                                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded-lg"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setEditItem(null)}
                                        className="flex-1 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-all"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* EDIT PROFILE MODAL */}
                {isEditProfileModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
                                <button
                                    onClick={() => setIsEditProfileModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateAdminProfile} className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">Full Name</label>
                                    <input
                                        type="text"
                                        value={profileFormData.name}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">Phone Number</label>
                                    <PhoneInput
                                        value={profileFormData.phone}
                                        onChange={(phone) => setProfileFormData({ ...profileFormData, phone })}
                                        placeholder="Enter phone number"
                                        defaultCountryCode="+64"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">Office Address</label>
                                    <input
                                        type="text"
                                        value={profileFormData.address}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                                        placeholder="Enter office address"
                                    />
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditProfileModalOpen(false)}
                                        className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingProfile}
                                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Service Edit/Add Modal */}
                {isServiceModalOpen && (
                    <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/50 backdrop-blur-md z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', margin: 0 }}>
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
                            <button
                                onClick={() => setIsServiceModalOpen(false)}
                                className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-900 transition-colors z-10"
                            >
                                <XCircle className="w-7 h-7 sm:w-8 sm:h-8" />
                            </button>

                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-6 flex-shrink-0 pr-10">
                                {editingServiceId ? 'Edit Service' : 'Add New Service'}
                            </h2>

                            <form onSubmit={handleSaveService} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 overflow-y-auto flex-1 pr-2" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Service Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={serviceFormData.title}
                                        onChange={(e) => setServiceFormData({ ...serviceFormData, title: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-blue-500 transition-colors"
                                        placeholder="e.g. Bathroom Deep Cleaning"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Description</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={serviceFormData.description}
                                        onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-blue-500 transition-colors resize-none"
                                        placeholder="Describe the service details..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Price ($)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={serviceFormData.price}
                                        onChange={(e) => setServiceFormData({ ...serviceFormData, price: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Category</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-left focus:border-blue-500 transition-colors flex items-center justify-between"
                                        >
                                            {categories.find(cat => cat._id === serviceFormData.category_id)?.name || 'Select Category'}
                                            <Package className={`w-4 h-4 text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isCategoryDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
                                                <div className="max-h-60 overflow-y-auto py-2 custom-scrollbar">
                                                    {categories.map(cat => (
                                                        <button
                                                            key={cat._id}
                                                            type="button"
                                                            onClick={() => {
                                                                setServiceFormData({ ...serviceFormData, category_id: cat._id });
                                                                setIsCategoryDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-5 py-3 text-sm transition-colors hover:bg-slate-50 ${serviceFormData.category_id === cat._id ? 'text-blue-600 bg-green-50 font-bold' : 'text-slate-700'}`}
                                                        >
                                                            {cat.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Service Image</label>

                                    {serviceFormData.image && !serviceImageFile && (
                                        <div className="mb-4 relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200 group">
                                            <img
                                                src={getImageUrl(serviceFormData.image)}
                                                alt="Current Service"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-xs text-white font-bold">Current Image</span>
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setServiceImageFile(e.target.files ? e.target.files[0] : null)}
                                        className="w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="service-active"
                                        checked={serviceFormData.is_active}
                                        onChange={(e) => setServiceFormData({ ...serviceFormData, is_active: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500 bg-slate-50"
                                    />
                                    <label htmlFor="service-active" className="text-sm font-bold text-slate-900">Active Service</label>
                                </div>

                                <div className="md:col-span-2 pt-4">
                                    <button
                                        type="submit"
                                        disabled={savingService}
                                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                                    >
                                        {savingService ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                {editingServiceId ? 'Update Service' : 'Create Service'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Alert Modal */}
            {alertConfig.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${alertConfig.type === 'success' ? 'bg-green-50 text-blue-600 border border-green-200' :
                            alertConfig.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' :
                                'bg-blue-50 text-blue-600 border border-blue-200'
                            }`}>
                            {alertConfig.type === 'success' ? <CheckCircle className="w-10 h-10" /> :
                                alertConfig.type === 'error' ? <XCircle className="w-10 h-10" /> :
                                    <AlertCircle className="w-10 h-10" />
                            }
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{alertConfig.title}</h3>
                        <p className="text-slate-600 mb-8 leading-relaxed">{alertConfig.message}</p>
                        <button
                            onClick={() => setAlertConfig({ ...alertConfig, show: false })}
                            className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all border border-slate-200 shadow-xl"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default AdminDashboard;
