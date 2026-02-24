import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../../layout/MainLayout';
import {
    MapPin, User, Mail, Globe, Car, Briefcase, Clock, Calendar,
    CheckCircle, ArrowRight, ArrowLeft, Sparkles, Users, TrendingUp,
    DollarSign, Headphones, ChevronDown, Loader2, Home, Search
} from 'lucide-react';
import apiClient from '../../api/client';
import NZAddressAutocomplete from '../../components/NZAddressAutocomplete';
import { PhoneInput } from '../../components/PhoneInput';

// New Zealand Locations Data - Comprehensive Auckland Coverage (matches homepage)
const NZ_LOCATIONS = [
    // Auckland Central
    { id: 'auckland-cbd', name: 'Auckland CBD', region: 'Auckland Central', island: 'North', active: true },
    { id: 'ponsonby', name: 'Ponsonby', region: 'Auckland Central', island: 'North', active: true },
    { id: 'parnell', name: 'Parnell', region: 'Auckland Central', island: 'North', active: true },
    { id: 'newmarket', name: 'Newmarket', region: 'Auckland Central', island: 'North', active: true },
    { id: 'mt-eden', name: 'Mt Eden', region: 'Auckland Central', island: 'North', active: true },
    { id: 'epsom', name: 'Epsom', region: 'Auckland Central', island: 'North', active: true },
    { id: 'remuera', name: 'Remuera', region: 'Auckland Central', island: 'North', active: true },
    { id: 'grey-lynn', name: 'Grey Lynn', region: 'Auckland Central', island: 'North', active: true },
    // North Shore
    { id: 'takapuna', name: 'Takapuna', region: 'North Shore', island: 'North', active: true },
    { id: 'devonport', name: 'Devonport', region: 'North Shore', island: 'North', active: true },
    { id: 'milford', name: 'Milford', region: 'North Shore', island: 'North', active: true },
    { id: 'browns-bay', name: 'Browns Bay', region: 'North Shore', island: 'North', active: true },
    { id: 'albany', name: 'Albany', region: 'North Shore', island: 'North', active: true },
    { id: 'glenfield', name: 'Glenfield', region: 'North Shore', island: 'North', active: true },
    // West Auckland
    { id: 'henderson', name: 'Henderson', region: 'West Auckland', island: 'North', active: true },
    { id: 'new-lynn', name: 'New Lynn', region: 'West Auckland', island: 'North', active: true },
    { id: 'glen-eden', name: 'Glen Eden', region: 'West Auckland', island: 'North', active: true },
    { id: 'titirangi', name: 'Titirangi', region: 'West Auckland', island: 'North', active: true },
    { id: 'te-atatu', name: 'Te Atatu', region: 'West Auckland', island: 'North', active: true },
    // South Auckland
    { id: 'manukau', name: 'Manukau', region: 'South Auckland', island: 'North', active: true },
    { id: 'manurewa', name: 'Manurewa', region: 'South Auckland', island: 'North', active: true },
    { id: 'papakura', name: 'Papakura', region: 'South Auckland', island: 'North', active: true },
    { id: 'papatoetoe', name: 'Papatoetoe', region: 'South Auckland', island: 'North', active: true },
    { id: 'otahuhu', name: 'Otahuhu', region: 'South Auckland', island: 'North', active: true },
    // East Auckland
    { id: 'howick', name: 'Howick', region: 'East Auckland', island: 'North', active: true },
    { id: 'pakuranga', name: 'Pakuranga', region: 'East Auckland', island: 'North', active: true },
    { id: 'botany', name: 'Botany', region: 'East Auckland', island: 'North', active: true },
    { id: 'half-moon-bay', name: 'Half Moon Bay', region: 'East Auckland', island: 'North', active: true },
    // Other North Island - Active
    { id: 'hamilton', name: 'Hamilton', region: 'Waikato', island: 'North', active: true },
    { id: 'tauranga', name: 'Tauranga', region: 'Bay of Plenty', island: 'North', active: true },
    // North Island - Coming Soon
    { id: 'wellington', name: 'Wellington', region: 'Wellington', island: 'North', active: false },
    { id: 'napier', name: 'Napier', region: 'Hawke\'s Bay', island: 'North', active: false },
    { id: 'palmerston-north', name: 'Palmerston North', region: 'Manawatū', island: 'North', active: false },
    { id: 'rotorua', name: 'Rotorua', region: 'Bay of Plenty', island: 'North', active: false },
    // South Island - Coming Soon
    { id: 'christchurch', name: 'Christchurch', region: 'Canterbury', island: 'South', active: false },
    { id: 'dunedin', name: 'Dunedin', region: 'Otago', island: 'South', active: false },
    { id: 'queenstown', name: 'Queenstown', region: 'Otago', island: 'South', active: false },
];

// Service Categories
const SERVICE_CATEGORIES = [
    { id: 'cleaning', name: 'Cleaning Services', icon: 'Home', description: 'House, office, and commercial cleaning' },
    { id: 'lawn-garden', name: 'Lawn & Garden', icon: 'Trees', description: 'Lawn mowing, gardening, landscaping' },
    { id: 'maintenance', name: 'Home Maintenance', icon: 'Briefcase', description: 'Repairs, handyman services' },
    { id: 'pest-control', name: 'Pest Control', icon: 'Shield', description: 'Pest inspection and treatment' },
    { id: 'moving', name: 'Moving Services', icon: 'Warehouse', description: 'Packing, moving, and relocation' },
    { id: 'cooking', name: 'Cooking & Catering', icon: 'ChefHat', description: 'Personal chef, meal prep, catering' },
];

// Specializations matching homepage services
const SPECIALIZATIONS: Record<string, string[]> = {
    'cleaning': [
        'House Cleaning',
        'Deep Cleaning',
        'Kitchen Cleaning',
        'Bathroom Cleaning',
        'Window Cleaning',
        'Carpet Cleaning',
        'End of Tenancy Cleaning',
        'Office Cleaning',
        'Oven Cleaning',
        'Upholstery Cleaning'
    ],
    'lawn-garden': [
        'Lawn Mowing',
        'Garden Maintenance',
        'Hedge Trimming',
        'Tree Pruning',
        'Landscaping',
        'Leaf Removal'
    ],
    'maintenance': [
        'Handyman Services',
        'Gutter Cleaning',
        'Pressure Washing',
        'Painting',
        'Furniture Assembly'
    ],
    'pest-control': [
        'General Pest Control',
        'Rodent Control',
        'Termite Inspection',
        'Flea Treatment'
    ]
};

// All specializations flat list for display when no category selected
const ALL_SPECIALIZATIONS = Object.values(SPECIALIZATIONS).flat();

const NATIONALITIES = [
    'New Zealand', 'Australia', 'India', 'China', 'Philippines', 'United Kingdom',
    'South Africa', 'Fiji', 'Samoa', 'Tonga', 'United States', 'Other'
];

const ProfessionalRegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    
    // Dropdown states
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const [isNationalityDropdownOpen, setIsNationalityDropdownOpen] = useState(false);
    const [isAvailabilityDropdownOpen, setIsAvailabilityDropdownOpen] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        location: '',
        serviceCategory: '',
        fullName: '',
        email: '',
        phone: '',
        nationality: '',
        hasNZLicense: '',
        streetAddress: '',
        suburb: '',
        city: '',
        yearsExperience: '',
        specializations: [] as string[],
        availability: '',
        preferredStartDate: '',
        aboutYourself: ''
    });

    const selectedService = SERVICE_CATEGORIES.find(svc => svc.id === formData.serviceCategory);

    const selectedLocation = NZ_LOCATIONS.find(loc => loc.id === formData.location);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSpecializationToggle = (spec: string) => {
        setFormData(prev => ({
            ...prev,
            specializations: prev.specializations.includes(spec)
                ? prev.specializations.filter(s => s !== spec)
                : [...prev.specializations, spec]
        }));
    };

    const handleLocationSelect = (locationId: string) => {
        const location = NZ_LOCATIONS.find(loc => loc.id === locationId);
        if (location?.active) {
            setFormData(prev => ({ ...prev, location: locationId }));
            setIsLocationDropdownOpen(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const locationData = NZ_LOCATIONS.find(loc => loc.id === formData.location);
            
            const serviceData = SERVICE_CATEGORIES.find(svc => svc.id === formData.serviceCategory);
            
            await apiClient.post('/professionals/register', {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                nationality: formData.nationality,
                hasNZLicense: formData.hasNZLicense === 'yes',
                address: {
                    street: formData.streetAddress,
                    suburb: formData.suburb,
                    city: formData.city
                },
                yearsExperience: formData.yearsExperience,
                specializations: formData.specializations,
                availability: formData.availability,
                preferredStartDate: formData.preferredStartDate,
                aboutYourself: formData.aboutYourself,
                location: formData.location,
                locationName: locationData ? `${locationData.name}, ${locationData.region}` : '',
                serviceCategory: formData.serviceCategory,
                serviceCategoryName: serviceData ? serviceData.name : ''
            });

            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Group locations by region for better organization (same as homepage)
    const groupedByRegion = NZ_LOCATIONS.reduce((acc, loc) => {
        const key = loc.region;
        if (!acc[key]) acc[key] = [];
        acc[key].push(loc);
        return acc;
    }, {} as Record<string, typeof NZ_LOCATIONS>);
    
    // Define region display order (same as homepage)
    const regionOrder = [
        // Auckland regions first (active)
        'Auckland Central',
        'North Shore', 
        'West Auckland',
        'South Auckland',
        'East Auckland',
        // Other active regions
        'Waikato',
        'Bay of Plenty',
        // Coming soon regions
        'Wellington',
        'Hawke\'s Bay',
        'Manawatū',
        'Taranaki',
        'Canterbury',
        'Otago',
        'Nelson',
        'Southland'
    ];

    // Success Screen
    if (isSubmitted) {
        return (
            <MainLayout>
                <div className="min-h-[80vh] flex items-center justify-center bg-white py-16 px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        {/* Success Animation */}
                        <div className="relative mb-8">
                            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-bounce">
                                <CheckCircle className="w-16 h-16 text-white" />
                            </div>
                            <div className="absolute inset-0 w-32 h-32 mx-auto bg-emerald-500/20 rounded-full animate-ping" />
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
                            Thank You for Registering!
                        </h1>
                        
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 mb-8">
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Your details have been submitted successfully to <span className="font-bold text-slate-900">noso company</span>. 
                                We will review your application and respond to your email shortly.
                            </p>
                            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-sm text-blue-700">
                                    <strong>What's next?</strong> Our team will review your application within 2-3 business days. 
                                    You'll receive an email at <span className="font-semibold">{formData.email}</span> with further instructions.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/"
                                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all"
                            >
                                <Home className="w-5 h-5 mr-2" />
                                Go to Homepage
                            </Link>
                            <button
                                onClick={() => {
                                    navigate('/');
                                    setTimeout(() => {
                                        const servicesSection = document.querySelector('[data-section="services"]');
                                        servicesSection?.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                }}
                                className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:border-blue-300 hover:bg-blue-50 transition-all"
                            >
                                <Search className="w-5 h-5 mr-2" />
                                Browse Services
                            </button>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-white animate-fade-in">
                {/* Hero Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#1E3A5F] to-slate-900 py-20 md:py-28">
                    {/* Background Elements */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:32px_32px]" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[100px]" />

                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white/90 font-semibold text-sm mb-6 backdrop-blur-sm border border-white/20">
                            <Briefcase className="w-4 h-4 mr-2" />
                            Join Our Freelancer Network
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                            Register as a
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400">
                                Freelancer Professional
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            Join noso company's network of verified freelancer professionals. Get access to customers in your area, 
                            flexible scheduling, and reliable payments.
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Main Form Section */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Location Selection Section */}
                                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                            <MapPin className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Service Area</h2>
                                            <p className="text-sm text-slate-500">Where will you be providing services?</p>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-left flex items-center justify-between hover:border-blue-300 hover:bg-blue-50/50 transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        >
                                            <span className={`flex items-center gap-2 ${formData.location ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                                                <MapPin className="w-5 h-5" />
                                                {selectedLocation ? `${selectedLocation.name}, ${selectedLocation.region}` : 'Select your service area...'}
                                            </span>
                                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isLocationDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-80 overflow-y-auto">
                                                {regionOrder.map((regionName) => {
                                                    const locations = groupedByRegion[regionName];
                                                    if (!locations || locations.length === 0) return null;
                                                    
                                                    const isAuckland = regionName.includes('Auckland') || regionName === 'North Shore';
                                                    const allInactive = locations.every(loc => !loc.active);
                                                    
                                                    return (
                                                        <div key={regionName}>
                                                            <div className={`p-3 border-b border-slate-200 sticky top-0 z-10 ${isAuckland ? 'bg-blue-50' : allInactive ? 'bg-amber-50' : 'bg-slate-100'}`}>
                                                                <span className={`text-xs font-bold uppercase tracking-wider ${isAuckland ? 'text-blue-600' : allInactive ? 'text-amber-600' : 'text-slate-500'}`}>
                                                                    {regionName}
                                                                    {allInactive && ' — Coming Soon'}
                                                                </span>
                                                            </div>
                                                            {locations.map((loc) => (
                                                                <button
                                                                    key={loc.id}
                                                                    type="button"
                                                                    onClick={() => handleLocationSelect(loc.id)}
                                                                    disabled={!loc.active}
                                                                    className={`w-full text-left px-5 py-2.5 flex items-center justify-between transition-colors ${
                                                                        loc.active 
                                                                            ? 'hover:bg-blue-50 text-slate-700 cursor-pointer' 
                                                                            : 'text-slate-400 cursor-not-allowed bg-slate-50'
                                                                    } ${formData.location === loc.id ? 'bg-blue-100 text-blue-700' : ''}`}
                                                                >
                                                                    <span className="flex items-center gap-2">
                                                                        <MapPin className="w-4 h-4" />
                                                                        <span className="font-medium">{loc.name}</span>
                                                                    </span>
                                                                    {!loc.active && (
                                                                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                                            Coming Soon
                                                                        </span>
                                                                    )}
                                                                    {formData.location === loc.id && loc.active && (
                                                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Service Category Selection */}
                                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                                            <Briefcase className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Service Category</h2>
                                            <p className="text-sm text-slate-500">What type of services will you provide?</p>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-left flex items-center justify-between hover:border-teal-300 hover:bg-teal-50/50 transition-all focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                        >
                                            <span className={`flex items-center gap-2 ${formData.serviceCategory ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                                                <Briefcase className="w-5 h-5" />
                                                {selectedService ? selectedService.name : 'Select service category...'}
                                            </span>
                                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isServiceDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                                                {SERVICE_CATEGORIES.map((svc) => (
                                                    <button
                                                        key={svc.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, serviceCategory: svc.id }));
                                                            setIsServiceDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-5 py-4 flex items-center justify-between transition-all hover:bg-teal-50 ${
                                                            formData.serviceCategory === svc.id ? 'bg-teal-100 text-teal-700' : 'text-slate-700'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Briefcase className="w-5 h-5" />
                                                            <div>
                                                                <span className="font-medium block">{svc.name}</span>
                                                                <span className="text-sm text-slate-400">{svc.description}</span>
                                                            </div>
                                                        </div>
                                                        {formData.serviceCategory === svc.id && <CheckCircle className="w-5 h-5 text-teal-600" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Personal Information Section */}
                                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
                                            <p className="text-sm text-slate-500">Tell us about yourself</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Full Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="Enter your full name"
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Email Address <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="your.email@example.com"
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <PhoneInput
                                                label="Phone Number"
                                                value={formData.phone}
                                                onChange={(phone) => setFormData({ ...formData, phone })}
                                                placeholder="Enter phone number"
                                                required
                                                defaultCountryCode="+64"
                                            />
                                        </div>

                                        {/* Nationality */}
                                        <div className="relative">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Nationality <span className="text-red-500">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setIsNationalityDropdownOpen(!isNationalityDropdownOpen)}
                                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-left flex items-center justify-between hover:border-blue-300 transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            >
                                                <span className={`flex items-center gap-2 ${formData.nationality ? 'text-slate-900' : 'text-slate-400'}`}>
                                                    <Globe className="w-5 h-5 text-slate-400" />
                                                    {formData.nationality || 'Select nationality'}
                                                </span>
                                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isNationalityDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isNationalityDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-60 overflow-y-auto">
                                                    {NATIONALITIES.map(nat => (
                                                        <button
                                                            key={nat}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, nationality: nat }));
                                                                setIsNationalityDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors ${
                                                                formData.nationality === nat ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-700'
                                                            }`}
                                                        >
                                                            {nat}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* NZ Driver's License */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                                            Do you have a current full New Zealand driver's license? <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, hasNZLicense: 'yes' }))}
                                                className={`flex-1 py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                                                    formData.hasNZLicense === 'yes'
                                                        ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-700'
                                                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                <Car className="w-5 h-5" />
                                                Yes, I have
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, hasNZLicense: 'no' }))}
                                                className={`flex-1 py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                                                    formData.hasNZLicense === 'no'
                                                        ? 'bg-amber-100 border-2 border-amber-500 text-amber-700'
                                                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                No, I don't
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Address Section */}
                                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                            <Home className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Current NZ Address</h2>
                                            <p className="text-sm text-slate-500">Your residential address in New Zealand</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Full Address <span className="text-red-500">*</span>
                                            </label>
                                            <NZAddressAutocomplete
                                                value={formData.streetAddress}
                                                onChange={(address, details) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        streetAddress: address,
                                                        suburb: details?.suburb || prev.suburb,
                                                        city: details?.city || prev.city
                                                    }));
                                                }}
                                                placeholder="Start typing your New Zealand address..."
                                                required
                                                inputClassName="py-4 bg-slate-50 rounded-2xl"
                                            />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Suburb <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="suburb"
                                                    value={formData.suburb}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="e.g., Ponsonby"
                                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    City <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="e.g., Auckland"
                                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional Details Section */}
                                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                            <Briefcase className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Professional Details</h2>
                                            <p className="text-sm text-slate-500">Tell us about your experience (optional)</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Years of Experience */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Years of Experience</label>
                                            <select
                                                name="yearsExperience"
                                                value={formData.yearsExperience}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Select experience level</option>
                                                <option value="0-1">Less than 1 year</option>
                                                <option value="1-2">1-2 years</option>
                                                <option value="2-5">2-5 years</option>
                                                <option value="5-10">5-10 years</option>
                                                <option value="10+">10+ years</option>
                                            </select>
                                        </div>

                                        {/* Specializations - filtered by service category */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                                                Specializations 
                                                {formData.serviceCategory && (
                                                    <span className="text-slate-400 font-normal"> — for {selectedService?.name}</span>
                                                )}
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {(formData.serviceCategory && SPECIALIZATIONS[formData.serviceCategory] 
                                                    ? SPECIALIZATIONS[formData.serviceCategory] 
                                                    : ALL_SPECIALIZATIONS
                                                ).map(spec => (
                                                    <button
                                                        key={spec}
                                                        type="button"
                                                        onClick={() => handleSpecializationToggle(spec)}
                                                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                                            formData.specializations.includes(spec)
                                                                ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                                                                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        {formData.specializations.includes(spec) && (
                                                            <CheckCircle className="w-4 h-4 inline mr-1" />
                                                        )}
                                                        {spec}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Availability */}
                                        <div className="relative">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Availability</label>
                                            <button
                                                type="button"
                                                onClick={() => setIsAvailabilityDropdownOpen(!isAvailabilityDropdownOpen)}
                                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-left flex items-center justify-between hover:border-blue-300 transition-all"
                                            >
                                                <span className={`flex items-center gap-2 ${formData.availability ? 'text-slate-900' : 'text-slate-400'}`}>
                                                    <Clock className="w-5 h-5 text-slate-400" />
                                                    {formData.availability || 'Select availability'}
                                                </span>
                                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isAvailabilityDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isAvailabilityDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                                                    {['Full-time', 'Part-time', 'Weekends Only', 'Evenings Only', 'Flexible'].map(avail => (
                                                        <button
                                                            key={avail}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, availability: avail }));
                                                                setIsAvailabilityDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors ${
                                                                formData.availability === avail ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-700'
                                                            }`}
                                                        >
                                                            {avail}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Preferred Start Date */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred Start Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="date"
                                                    name="preferredStartDate"
                                                    value={formData.preferredStartDate}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* About Yourself */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">About Yourself</label>
                                            <textarea
                                                name="aboutYourself"
                                                value={formData.aboutYourself}
                                                onChange={handleInputChange}
                                                rows={4}
                                                placeholder="Tell us about your background, skills, and what makes you a great professional..."
                                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link
                                        to="/"
                                        className="flex-1 inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:border-slate-300 hover:bg-slate-50 transition-all"
                                    >
                                        <ArrowLeft className="w-5 h-5 mr-2" />
                                        Back to Home
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !formData.location || !formData.fullName || !formData.email || !formData.phone || !formData.nationality || !formData.hasNZLicense || !formData.streetAddress || !formData.suburb || !formData.city}
                                        className="flex-1 inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Submit Application
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Sidebar - Why Register */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-32 space-y-6">
                                {/* Benefits Card */}
                                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">Why Register with NoSo?</h3>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <Users className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Access New Customers</h4>
                                                <p className="text-sm text-slate-500">Connect with customers actively looking for services in your area.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <Calendar className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Easy Scheduling</h4>
                                                <p className="text-sm text-slate-500">Manage your bookings with our intuitive scheduling system.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                <DollarSign className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Reliable Payments</h4>
                                                <p className="text-sm text-slate-500">Get paid on time with our secure payment processing.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                <Headphones className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Professional Support</h4>
                                                <p className="text-sm text-slate-500">24/7 support and guidance from our dedicated team.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                                                <TrendingUp className="w-5 h-5 text-rose-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Grow Your Business</h4>
                                                <p className="text-sm text-slate-500">Build your reputation with reviews and ratings from satisfied customers.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ProfessionalRegistrationPage;
