import React, { useState } from 'react';
import { X, MapPin, ChevronDown, Lock, User, Mail, Globe, Car, Clock, Briefcase, Calendar, CheckCircle, ArrowRight, Home, Sparkles, Users, DollarSign, HeadphonesIcon, ChevronLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { config } from '../config';
import { PhoneInput } from './PhoneInput';

// New Zealand Locations Data - Comprehensive Auckland Coverage
const NZ_LOCATIONS = [
    // Auckland Central
    { id: 'auckland-cbd', name: 'Auckland CBD', region: 'Auckland Central', island: 'North', active: true },
    { id: 'ponsonby', name: 'Ponsonby', region: 'Auckland Central', island: 'North', active: true },
    { id: 'parnell', name: 'Parnell', region: 'Auckland Central', island: 'North', active: true },
    { id: 'newmarket', name: 'Newmarket', region: 'Auckland Central', island: 'North', active: true },
    { id: 'mt-eden', name: 'Mt Eden', region: 'Auckland Central', island: 'North', active: true },
    // North Shore
    { id: 'takapuna', name: 'Takapuna', region: 'North Shore', island: 'North', active: true },
    { id: 'devonport', name: 'Devonport', region: 'North Shore', island: 'North', active: true },
    { id: 'albany', name: 'Albany', region: 'North Shore', island: 'North', active: true },
    // West Auckland
    { id: 'henderson', name: 'Henderson', region: 'West Auckland', island: 'North', active: true },
    { id: 'new-lynn', name: 'New Lynn', region: 'West Auckland', island: 'North', active: true },
    // South Auckland
    { id: 'manukau', name: 'Manukau', region: 'South Auckland', island: 'North', active: true },
    { id: 'papakura', name: 'Papakura', region: 'South Auckland', island: 'North', active: true },
    // East Auckland
    { id: 'howick', name: 'Howick', region: 'East Auckland', island: 'North', active: true },
    { id: 'botany', name: 'Botany', region: 'East Auckland', island: 'North', active: true },
    // Other Active
    { id: 'hamilton', name: 'Hamilton', region: 'Waikato', island: 'North', active: true },
    { id: 'tauranga', name: 'Tauranga', region: 'Bay of Plenty', island: 'North', active: true },
    // Coming Soon
    { id: 'wellington', name: 'Wellington', region: 'Wellington', island: 'North', active: false },
    { id: 'christchurch', name: 'Christchurch', region: 'Canterbury', island: 'South', active: false },
];

// Specializations matching homepage services
const SPECIALIZATIONS = [
    'House Cleaning',
    'Deep Cleaning',
    'Kitchen Cleaning',
    'Bathroom Cleaning',
    'Window Cleaning',
    'Carpet Cleaning',
    'End of Tenancy Cleaning',
    'Office Cleaning',
    'Oven Cleaning',
    'Upholstery Cleaning',
    'Lawn Mowing',
    'Garden Maintenance',
    'Hedge Trimming',
    'Tree Pruning',
    'Landscaping',
    'Handyman Services',
    'Gutter Cleaning',
    'Pressure Washing',
    'Painting',
    'General Pest Control'
];

const NATIONALITIES = [
    'New Zealand Citizen',
    'New Zealand Permanent Resident',
    'Australian Citizen',
    'Work Visa Holder',
    'Student Visa Holder',
    'Other'
];

interface ProfessionalRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'location' | 'form' | 'success';

interface FormData {
    fullName: string;
    email: string;
    phone: string;
    nationality: string;
    hasNZLicense: string;
    yearsExperience: string;
    specializations: string[];
    availability: string;
    preferredStartDate: string;
    aboutYourself: string;
    agreedToTerms: boolean;
}

const ProfessionalRegistrationModal: React.FC<ProfessionalRegistrationModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<Step>('location');
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string>('');
    
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        phone: '',
        nationality: '',
        hasNZLicense: '',
        yearsExperience: '',
        specializations: [],
        availability: '',
        preferredStartDate: '',
        aboutYourself: '',
        agreedToTerms: false
    });

    // Group locations by island
    const groupedLocations = NZ_LOCATIONS.reduce((acc, loc) => {
        const key = loc.island;
        if (!acc[key]) acc[key] = [];
        acc[key].push(loc);
        return acc;
    }, {} as Record<string, typeof NZ_LOCATIONS>);

    const getSelectedLocationName = () => {
        const location = NZ_LOCATIONS.find(loc => loc.id === selectedLocation);
        return location ? `${location.name}, ${location.region}` : '';
    };

    const handleLocationSelect = (locationId: string) => {
        const location = NZ_LOCATIONS.find(loc => loc.id === locationId);
        if (location?.active) {
            setSelectedLocation(locationId);
            setIsLocationDropdownOpen(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSpecializationToggle = (spec: string) => {
        setFormData(prev => ({
            ...prev,
            specializations: prev.specializations.includes(spec)
                ? prev.specializations.filter(s => s !== spec)
                : [...prev.specializations, spec]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError('');

        try {
            const response = await fetch(`${config.apiUrl}/professionals/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    location: selectedLocation,
                    locationName: getSelectedLocationName()
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to submit registration');
            }

            setStep('success');
        } catch (error) {
            console.error('Registration error:', error);
            setSubmitError(error instanceof Error ? error.message : 'An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetModal = () => {
        setStep('location');
        setSelectedLocation('');
        setFormData({
            fullName: '',
            email: '',
            phone: '',
            nationality: '',
            hasNZLicense: '',
            yearsExperience: '',
            specializations: [],
            availability: '',
            preferredStartDate: '',
            aboutYourself: '',
            agreedToTerms: false
        });
        setSubmitError('');
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={handleClose}>
            <div 
                className={`bg-white rounded-3xl w-full shadow-2xl my-8 ${step === 'form' ? 'max-w-4xl' : 'max-w-xl'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-[#1E3A5F] to-blue-700 rounded-t-3xl p-6 text-white">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Register as a Freelancer Professional</h2>
                            <p className="text-blue-200 text-sm">Join our network of trusted service providers</p>
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2 mt-6">
                        <div className={`flex-1 h-1.5 rounded-full ${step === 'location' || step === 'form' || step === 'success' ? 'bg-white' : 'bg-white/30'}`} />
                        <div className={`flex-1 h-1.5 rounded-full ${step === 'form' || step === 'success' ? 'bg-white' : 'bg-white/30'}`} />
                        <div className={`flex-1 h-1.5 rounded-full ${step === 'success' ? 'bg-white' : 'bg-white/30'}`} />
                    </div>
                    <div className="flex justify-between text-xs mt-2 text-blue-200">
                        <span>Location</span>
                        <span>Details</span>
                        <span>Complete</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {/* Step 1: Location Selection */}
                    {step === 'location' && (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Select Your Service Area</h3>
                                <p className="text-slate-600">Choose the area where you'll be providing services</p>
                            </div>

                            {/* Location Dropdown */}
                            <div className="relative">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <MapPin className="w-4 h-4 inline mr-2" />
                                    Your Location
                                </label>
                                <button
                                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-left flex items-center justify-between hover:border-blue-300 transition-colors"
                                >
                                    <span className={`flex items-center gap-2 ${selectedLocation ? 'text-slate-900' : 'text-slate-400'}`}>
                                        <MapPin className="w-5 h-5" />
                                        {selectedLocation ? getSelectedLocationName() : 'Select your area...'}
                                    </span>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isLocationDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-64 overflow-y-auto">
                                        {/* North Island */}
                                        <div className="p-3 bg-slate-100 border-b border-slate-200 sticky top-0">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">North Island</span>
                                        </div>
                                        {groupedLocations['North']?.map((loc) => (
                                            <button
                                                key={loc.id}
                                                onClick={() => handleLocationSelect(loc.id)}
                                                disabled={!loc.active}
                                                className={`w-full text-left px-5 py-3 flex items-center justify-between transition-colors ${
                                                    loc.active 
                                                        ? 'hover:bg-blue-50 text-slate-700 cursor-pointer' 
                                                        : 'text-slate-400 cursor-not-allowed bg-slate-50'
                                                } ${selectedLocation === loc.id ? 'bg-blue-100 text-blue-700' : ''}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="font-medium">{loc.name}</span>
                                                    <span className="text-sm text-slate-400">({loc.region})</span>
                                                </span>
                                                {!loc.active && (
                                                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                                        <Lock className="w-3 h-3" />
                                                        Coming Soon
                                                    </span>
                                                )}
                                            </button>
                                        ))}

                                        {/* South Island */}
                                        <div className="p-3 bg-slate-100 border-b border-t border-slate-200 sticky top-0">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">South Island</span>
                                        </div>
                                        {groupedLocations['South']?.map((loc) => (
                                            <button
                                                key={loc.id}
                                                onClick={() => handleLocationSelect(loc.id)}
                                                disabled={!loc.active}
                                                className={`w-full text-left px-5 py-3 flex items-center justify-between transition-colors ${
                                                    loc.active 
                                                        ? 'hover:bg-blue-50 text-slate-700 cursor-pointer' 
                                                        : 'text-slate-400 cursor-not-allowed bg-slate-50'
                                                } ${selectedLocation === loc.id ? 'bg-blue-100 text-blue-700' : ''}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="font-medium">{loc.name}</span>
                                                    <span className="text-sm text-slate-400">({loc.region})</span>
                                                </span>
                                                {!loc.active && (
                                                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                                        <Lock className="w-3 h-3" />
                                                        Coming Soon
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Why Register Section */}
                            <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border border-blue-100">
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-blue-600" />
                                    Why Register with noso company?
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { icon: Users, title: 'Access New Customers', desc: 'Connect with customers in your area looking for services' },
                                        { icon: Calendar, title: 'Easy Scheduling', desc: 'Manage your bookings with our simple scheduling system' },
                                        { icon: DollarSign, title: 'Secure Payments', desc: 'Receive payments safely and on time' },
                                        { icon: HeadphonesIcon, title: 'Professional Support', desc: 'Get guidance and support from our dedicated team' },
                                    ].map((benefit, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <benefit.icon className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{benefit.title}</p>
                                                <p className="text-xs text-slate-600">{benefit.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Continue Button */}
                            <button
                                onClick={() => selectedLocation && setStep('form')}
                                disabled={!selectedLocation}
                                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                                    selectedLocation
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/30'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                Continue to Registration
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Registration Form */}
                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={() => setStep('location')}
                                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors mb-4"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back to Location
                            </button>

                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Profile</h3>
                                <p className="text-slate-600">Service Area: <span className="font-semibold text-blue-600">{getSelectedLocationName()}</span></p>
                            </div>

                            {submitError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                    {submitError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Personal Information */}
                                <div className="space-y-4 md:col-span-2">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <User className="w-5 h-5 text-blue-600" />
                                        Personal Information
                                    </h4>
                                </div>

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
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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
                                            placeholder="your@email.com"
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Nationality/Visa Status <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <select
                                            name="nationality"
                                            value={formData.nationality}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                                        >
                                            <option value="">Select your status</option>
                                            {NATIONALITIES.map(nat => (
                                                <option key={nat} value={nat}>{nat}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Professional Details */}
                                <div className="space-y-4 md:col-span-2 mt-4">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                        Professional Details
                                    </h4>
                                </div>

                                {/* NZ License */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Current Full NZ Driving License <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <select
                                            name="hasNZLicense"
                                            value={formData.hasNZLicense}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                                        >
                                            <option value="">Select an option</option>
                                            <option value="yes">Yes, I have a full NZ license</option>
                                            <option value="restricted">I have a restricted license</option>
                                            <option value="learner">I have a learner license</option>
                                            <option value="no">No, I don't have a NZ license</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Years of Experience */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Years of Experience <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <select
                                            name="yearsExperience"
                                            value={formData.yearsExperience}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                                        >
                                            <option value="">Select experience</option>
                                            <option value="0-1">Less than 1 year</option>
                                            <option value="1-2">1-2 years</option>
                                            <option value="2-5">2-5 years</option>
                                            <option value="5-10">5-10 years</option>
                                            <option value="10+">10+ years</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Availability */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Availability <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <select
                                            name="availability"
                                            value={formData.availability}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                                        >
                                            <option value="">Select availability</option>
                                            <option value="full-time">Full-time (40+ hours/week)</option>
                                            <option value="part-time">Part-time (20-40 hours/week)</option>
                                            <option value="casual">Casual (Less than 20 hours/week)</option>
                                            <option value="weekends">Weekends only</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Preferred Start Date */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Available to Start From
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="date"
                                            name="preferredStartDate"
                                            value={formData.preferredStartDate}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Specializations */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        Specializations <span className="text-red-500">*</span>
                                        <span className="font-normal text-slate-500 ml-2">(Select all that apply)</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {SPECIALIZATIONS.map(spec => (
                                            <button
                                                key={spec}
                                                type="button"
                                                onClick={() => handleSpecializationToggle(spec)}
                                                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                                    formData.specializations.includes(spec)
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                            >
                                                {spec}
                                            </button>
                                        ))}
                                    </div>
                                    {formData.specializations.length === 0 && (
                                        <p className="text-sm text-amber-600 mt-2">Please select at least one specialization</p>
                                    )}
                                </div>

                                {/* About Yourself */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Tell Us About Yourself
                                    </label>
                                    <textarea
                                        name="aboutYourself"
                                        value={formData.aboutYourself}
                                        onChange={handleInputChange}
                                        rows={4}
                                        placeholder="Share your experience, skills, and why you want to join our team..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Terms Agreement */}
                                <div className="md:col-span-2">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="agreedToTerms"
                                            checked={formData.agreedToTerms}
                                            onChange={handleInputChange}
                                            required
                                            className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-600">
                                            I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>. I confirm that all information provided is accurate and I am authorized to work in New Zealand. <span className="text-red-500">*</span>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || formData.specializations.length === 0 || !formData.agreedToTerms}
                                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                                    isSubmitting || formData.specializations.length === 0 || !formData.agreedToTerms
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/30'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Registration
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Step 3: Success */}
                    {step === 'success' && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Registration Successful!</h3>
                            <p className="text-slate-600 mb-8 max-w-md mx-auto">
                                Thank you for registering as a professional with <span className="font-semibold text-blue-600">noso company</span>. 
                                Your details have been submitted successfully. We will review your application and respond via email shortly.
                            </p>

                            <div className="p-4 bg-blue-50 rounded-xl mb-8">
                                <p className="text-sm text-blue-700">
                                    <strong>What's Next?</strong><br />
                                    Our team will review your application within 2-3 business days. You'll receive an email at <span className="font-semibold">{formData.email}</span> with further instructions.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/"
                                    onClick={handleClose}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                                >
                                    <Home className="w-5 h-5" />
                                    Go to Homepage
                                </Link>
                                <button
                                    onClick={() => {
                                        handleClose();
                                        // Scroll to services section
                                        const servicesSection = document.querySelector('[data-section="services"]');
                                        if (servicesSection) {
                                            servicesSection.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Browse Our Services
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfessionalRegistrationModal;
