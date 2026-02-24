import React, { useState, useEffect } from 'react';
import MainLayout from '../../layout/MainLayout';
import { ArrowRight, Shield, Zap, CheckCircle, Users, Sparkles, Home, Droplets, Trash2, ChefHat, Trees, CalendarCheck, MapPin, ClipboardCheck, Calculator, Search, Filter, ShoppingCart, Check, Loader2, ChevronRight, Info, ChevronDown, Lock, Briefcase, X, LayoutGrid, Layers, Car, Heart, Wrench, Monitor, HardHat, Building, PartyPopper, GraduationCap, Truck, Sparkle, Sofa, Bug, Wind, Flame, PaintBucket, Hammer, Plug, Drill, Scissors, Bath, Key, Wifi, Camera, Phone, Laptop, Package, Coffee, Pizza, Wine, Stethoscope, Activity, Brain, Dumbbell, FileText, Coins, Handshake, Megaphone, Palette, Music, Mic, Video, BookOpen, Languages, Baby, Dog, Flower2, Recycle, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { servicesApi } from '../../api/services';
import { categoriesApi } from '../../api/categories';
import type { Category } from '../../api/categories';
import type { Service } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { useLocationStore } from '../../store/useLocationStore';
import { config } from '../../config';

// Category Icons and Colors mapping
const CATEGORY_STYLES: Record<string, { icon: React.ComponentType<any>; bgColor: string; iconColor: string; gradient: string }> = {
    'Cleaning': { icon: Sparkle, bgColor: 'bg-emerald-500', iconColor: 'text-white', gradient: 'from-emerald-400 to-emerald-600' },
    'Lawn & Garden': { icon: Trees, bgColor: 'bg-green-500', iconColor: 'text-white', gradient: 'from-green-400 to-green-600' },
    'Home Maintenance': { icon: Wrench, bgColor: 'bg-amber-500', iconColor: 'text-white', gradient: 'from-amber-400 to-amber-600' },
    'Pest Control': { icon: Bug, bgColor: 'bg-red-500', iconColor: 'text-white', gradient: 'from-red-400 to-red-600' },
    'Automotive & Transport': { icon: Car, bgColor: 'bg-red-500', iconColor: 'text-white', gradient: 'from-red-400 to-red-600' },
    'Food & Hospitality': { icon: ChefHat, bgColor: 'bg-orange-500', iconColor: 'text-white', gradient: 'from-orange-400 to-orange-600' },
    'Healthcare & Wellness': { icon: Heart, bgColor: 'bg-pink-500', iconColor: 'text-white', gradient: 'from-pink-400 to-pink-600' },
    'Home & Property Services': { icon: Home, bgColor: 'bg-sky-500', iconColor: 'text-white', gradient: 'from-sky-400 to-sky-600' },
    'Professional Services': { icon: Briefcase, bgColor: 'bg-blue-500', iconColor: 'text-white', gradient: 'from-blue-400 to-blue-600' },
    'Technology & Digital': { icon: Monitor, bgColor: 'bg-purple-500', iconColor: 'text-white', gradient: 'from-purple-400 to-purple-600' },
    'Construction & Trade': { icon: HardHat, bgColor: 'bg-slate-600', iconColor: 'text-white', gradient: 'from-slate-500 to-slate-700' },
    'Real Estate & Property': { icon: Building, bgColor: 'bg-amber-600', iconColor: 'text-white', gradient: 'from-amber-500 to-amber-700' },
    'Events & Entertainment': { icon: PartyPopper, bgColor: 'bg-fuchsia-500', iconColor: 'text-white', gradient: 'from-fuchsia-400 to-fuchsia-600' },
    'Education & Training': { icon: GraduationCap, bgColor: 'bg-indigo-500', iconColor: 'text-white', gradient: 'from-indigo-400 to-indigo-600' },
    'Logistics & Delivery': { icon: Truck, bgColor: 'bg-teal-500', iconColor: 'text-white', gradient: 'from-teal-400 to-teal-600' },
    'Environment & Recycling': { icon: Recycle, bgColor: 'bg-green-600', iconColor: 'text-white', gradient: 'from-green-500 to-green-700' },
};

// Service-specific icons based on keywords in title/description
const getServiceIcon = (serviceName: string, categoryName: string) => {
    const name = serviceName.toLowerCase();
    
    // Cleaning services
    if (name.includes('bathroom') || name.includes('toilet')) return Bath;
    if (name.includes('kitchen')) return ChefHat;
    if (name.includes('carpet') || name.includes('rug')) return Sofa;
    if (name.includes('window')) return Wind;
    if (name.includes('oven')) return Flame;
    if (name.includes('pressure') || name.includes('wash')) return Waves;
    if (name.includes('bin') || name.includes('rubbish') || name.includes('trash')) return Trash2;
    if (name.includes('deep clean') || name.includes('spring')) return Sparkle;
    if (name.includes('move') || name.includes('moving')) return Package;
    
    // Garden services
    if (name.includes('lawn') || name.includes('mow')) return Scissors;
    if (name.includes('hedge') || name.includes('trim')) return Scissors;
    if (name.includes('plant') || name.includes('garden')) return Flower2;
    if (name.includes('tree')) return Trees;
    
    // Home maintenance
    if (name.includes('plumb')) return Droplets;
    if (name.includes('electric')) return Plug;
    if (name.includes('paint')) return PaintBucket;
    if (name.includes('roof')) return Home;
    if (name.includes('handyman') || name.includes('repair')) return Hammer;
    if (name.includes('lock') || name.includes('key')) return Key;
    if (name.includes('drill') || name.includes('install')) return Drill;
    
    // Pest control
    if (name.includes('pest') || name.includes('bug') || name.includes('insect')) return Bug;
    if (name.includes('rodent') || name.includes('rat') || name.includes('mouse')) return Shield;
    
    // Automotive
    if (name.includes('car') || name.includes('vehicle') || name.includes('auto')) return Car;
    
    // Food & hospitality
    if (name.includes('catering') || name.includes('chef')) return ChefHat;
    if (name.includes('coffee') || name.includes('cafe')) return Coffee;
    if (name.includes('pizza')) return Pizza;
    if (name.includes('wine') || name.includes('bar')) return Wine;
    
    // Healthcare
    if (name.includes('massage') || name.includes('physio')) return Activity;
    if (name.includes('nurse') || name.includes('medical')) return Stethoscope;
    if (name.includes('fitness') || name.includes('gym') || name.includes('personal train')) return Dumbbell;
    if (name.includes('mental') || name.includes('counsel') || name.includes('therapy')) return Brain;
    
    // Technology
    if (name.includes('computer') || name.includes('laptop') || name.includes('pc')) return Laptop;
    if (name.includes('phone') || name.includes('mobile')) return Phone;
    if (name.includes('wifi') || name.includes('network') || name.includes('internet')) return Wifi;
    if (name.includes('security') || name.includes('cctv') || name.includes('camera')) return Camera;
    if (name.includes('software') || name.includes('website') || name.includes('app')) return Monitor;
    
    // Professional services
    if (name.includes('account') || name.includes('tax') || name.includes('finance')) return Coins;
    if (name.includes('legal') || name.includes('lawyer') || name.includes('contract')) return FileText;
    if (name.includes('consult')) return Handshake;
    if (name.includes('market') || name.includes('advertis')) return Megaphone;
    if (name.includes('design') || name.includes('graphic')) return Palette;
    
    // Events
    if (name.includes('photo')) return Camera;
    if (name.includes('video') || name.includes('film')) return Video;
    if (name.includes('music') || name.includes('dj')) return Music;
    if (name.includes('mc') || name.includes('host')) return Mic;
    
    // Education
    if (name.includes('tutor') || name.includes('teach') || name.includes('lesson')) return BookOpen;
    if (name.includes('language') || name.includes('english')) return Languages;
    
    // Childcare & Pets
    if (name.includes('child') || name.includes('baby') || name.includes('nanny')) return Baby;
    if (name.includes('pet') || name.includes('dog') || name.includes('cat')) return Dog;
    
    // Fallback to category icon
    return CATEGORY_STYLES[categoryName]?.icon || Briefcase;
};

// New Zealand Locations Data - Comprehensive Auckland Coverage
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
    { id: 'freemans-bay', name: 'Freemans Bay', region: 'Auckland Central', island: 'North', active: true },
    { id: 'grafton', name: 'Grafton', region: 'Auckland Central', island: 'North', active: true },
    { id: 'mt-albert', name: 'Mt Albert', region: 'Auckland Central', island: 'North', active: true },
    { id: 'sandringham', name: 'Sandringham', region: 'Auckland Central', island: 'North', active: true },
    { id: 'kingsland', name: 'Kingsland', region: 'Auckland Central', island: 'North', active: true },
    { id: 'morningside', name: 'Morningside', region: 'Auckland Central', island: 'North', active: true },
    
    // North Shore
    { id: 'takapuna', name: 'Takapuna', region: 'North Shore', island: 'North', active: true },
    { id: 'devonport', name: 'Devonport', region: 'North Shore', island: 'North', active: true },
    { id: 'milford', name: 'Milford', region: 'North Shore', island: 'North', active: true },
    { id: 'browns-bay', name: 'Browns Bay', region: 'North Shore', island: 'North', active: true },
    { id: 'albany', name: 'Albany', region: 'North Shore', island: 'North', active: true },
    { id: 'glenfield', name: 'Glenfield', region: 'North Shore', island: 'North', active: true },
    { id: 'birkenhead', name: 'Birkenhead', region: 'North Shore', island: 'North', active: true },
    { id: 'northcote', name: 'Northcote', region: 'North Shore', island: 'North', active: true },
    { id: 'beach-haven', name: 'Beach Haven', region: 'North Shore', island: 'North', active: true },
    { id: 'mairangi-bay', name: 'Mairangi Bay', region: 'North Shore', island: 'North', active: true },
    { id: 'murrays-bay', name: 'Murrays Bay', region: 'North Shore', island: 'North', active: true },
    { id: 'torbay', name: 'Torbay', region: 'North Shore', island: 'North', active: true },
    { id: 'long-bay', name: 'Long Bay', region: 'North Shore', island: 'North', active: true },
    { id: 'orewa', name: 'Orewa', region: 'North Shore', island: 'North', active: true },
    { id: 'whangaparaoa', name: 'Whangaparaoa', region: 'North Shore', island: 'North', active: true },
    
    // West Auckland
    { id: 'henderson', name: 'Henderson', region: 'West Auckland', island: 'North', active: true },
    { id: 'new-lynn', name: 'New Lynn', region: 'West Auckland', island: 'North', active: true },
    { id: 'glen-eden', name: 'Glen Eden', region: 'West Auckland', island: 'North', active: true },
    { id: 'titirangi', name: 'Titirangi', region: 'West Auckland', island: 'North', active: true },
    { id: 'te-atatu', name: 'Te Atatu', region: 'West Auckland', island: 'North', active: true },
    { id: 'westgate', name: 'Westgate', region: 'West Auckland', island: 'North', active: true },
    { id: 'massey', name: 'Massey', region: 'West Auckland', island: 'North', active: true },
    { id: 'ranui', name: 'Ranui', region: 'West Auckland', island: 'North', active: true },
    { id: 'swanson', name: 'Swanson', region: 'West Auckland', island: 'North', active: true },
    { id: 'kumeu', name: 'Kumeu', region: 'West Auckland', island: 'North', active: true },
    { id: 'huapai', name: 'Huapai', region: 'West Auckland', island: 'North', active: true },
    { id: 'avondale', name: 'Avondale', region: 'West Auckland', island: 'North', active: true },
    { id: 'blockhouse-bay', name: 'Blockhouse Bay', region: 'West Auckland', island: 'North', active: true },
    
    // South Auckland
    { id: 'manukau', name: 'Manukau', region: 'South Auckland', island: 'North', active: true },
    { id: 'manurewa', name: 'Manurewa', region: 'South Auckland', island: 'North', active: true },
    { id: 'papakura', name: 'Papakura', region: 'South Auckland', island: 'North', active: true },
    { id: 'takanini', name: 'Takanini', region: 'South Auckland', island: 'North', active: true },
    { id: 'drury', name: 'Drury', region: 'South Auckland', island: 'North', active: true },
    { id: 'papatoetoe', name: 'Papatoetoe', region: 'South Auckland', island: 'North', active: true },
    { id: 'otahuhu', name: 'Otahuhu', region: 'South Auckland', island: 'North', active: true },
    { id: 'mangere', name: 'Mangere', region: 'South Auckland', island: 'North', active: true },
    { id: 'otara', name: 'Otara', region: 'South Auckland', island: 'North', active: true },
    { id: 'flat-bush', name: 'Flat Bush', region: 'South Auckland', island: 'North', active: true },
    { id: 'clendon-park', name: 'Clendon Park', region: 'South Auckland', island: 'North', active: true },
    { id: 'wiri', name: 'Wiri', region: 'South Auckland', island: 'North', active: true },
    { id: 'pukekohe', name: 'Pukekohe', region: 'South Auckland', island: 'North', active: true },
    
    // East Auckland
    { id: 'howick', name: 'Howick', region: 'East Auckland', island: 'North', active: true },
    { id: 'pakuranga', name: 'Pakuranga', region: 'East Auckland', island: 'North', active: true },
    { id: 'botany', name: 'Botany', region: 'East Auckland', island: 'North', active: true },
    { id: 'half-moon-bay', name: 'Half Moon Bay', region: 'East Auckland', island: 'North', active: true },
    { id: 'bucklands-beach', name: 'Bucklands Beach', region: 'East Auckland', island: 'North', active: true },
    { id: 'eastern-beach', name: 'Eastern Beach', region: 'East Auckland', island: 'North', active: true },
    { id: 'cockle-bay', name: 'Cockle Bay', region: 'East Auckland', island: 'North', active: true },
    { id: 'mellons-bay', name: 'Mellons Bay', region: 'East Auckland', island: 'North', active: true },
    { id: 'dannemora', name: 'Dannemora', region: 'East Auckland', island: 'North', active: true },
    { id: 'highland-park', name: 'Highland Park', region: 'East Auckland', island: 'North', active: true },
    { id: 'beachlands', name: 'Beachlands', region: 'East Auckland', island: 'North', active: true },
    { id: 'maraetai', name: 'Maraetai', region: 'East Auckland', island: 'North', active: true },
    
    // Other North Island - Active
    { id: 'hamilton', name: 'Hamilton', region: 'Waikato', island: 'North', active: true },
    { id: 'tauranga', name: 'Tauranga', region: 'Bay of Plenty', island: 'North', active: true },
    
    // North Island - Coming Soon
    { id: 'wellington', name: 'Wellington', region: 'Wellington', island: 'North', active: false },
    { id: 'napier', name: 'Napier', region: 'Hawke\'s Bay', island: 'North', active: false },
    { id: 'palmerston-north', name: 'Palmerston North', region: 'Manawatū', island: 'North', active: false },
    { id: 'rotorua', name: 'Rotorua', region: 'Bay of Plenty', island: 'North', active: false },
    { id: 'new-plymouth', name: 'New Plymouth', region: 'Taranaki', island: 'North', active: false },
    
    // South Island - Coming Soon
    { id: 'christchurch', name: 'Christchurch', region: 'Canterbury', island: 'South', active: false },
    { id: 'dunedin', name: 'Dunedin', region: 'Otago', island: 'South', active: false },
    { id: 'queenstown', name: 'Queenstown', region: 'Otago', island: 'South', active: false },
    { id: 'nelson', name: 'Nelson', region: 'Nelson', island: 'South', active: false },
    { id: 'invercargill', name: 'Invercargill', region: 'Southland', island: 'South', active: false },
];

const LandingPage: React.FC = () => {
    // Location State - persisted via store
    const { selectedLocation, setSelectedLocation } = useLocationStore();
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    
    // Toast notification state
    const [showLocationToast, setShowLocationToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Services State
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    // View Mode State: 'cards' or 'list'
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Cart store
    const { addItem, removeItem, isInCart, items: cartItems, clearCart } = useCartStore();
    const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

    // Helper to get cart item by service ID
    const getCartItemByServiceId = (serviceId: string) => {
        return cartItems.find(item => item.service_id?.toString() === serviceId?.toString());
    };

    // Handle remove from cart
    const handleRemoveFromCart = async (serviceId: string) => {
        const cartItem = getCartItemByServiceId(serviceId);
        if (cartItem) {
            await removeItem(cartItem.id);
        }
    };

    // Service Modal State
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch categories on mount, auto-select default location, and handle hash navigation
    useEffect(() => {
        fetchCategories();
        
        // Auto-select Auckland CBD as default location if none selected
        if (!selectedLocation) {
            setSelectedLocation('auckland-cbd');
        }
        
        // Handle hash-based navigation to services section
        if (window.location.hash === '#services-section') {
            setTimeout(() => {
                const servicesSection = document.getElementById('services-section');
                servicesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, []);

    // Fetch services when location is selected
    useEffect(() => {
        if (selectedLocation) {
            fetchServices();
        }
    }, [selectedLocation, selectedCategory]);

    const fetchCategories = async () => {
        try {
            const cats = await categoriesApi.list();
            setCategories(cats);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const fetchServices = async () => {
        setLoading(true);
        try {
            const params: any = { is_active: true };
            if (selectedCategory) params.category_id = selectedCategory;
            const data = await servicesApi.list(params);
            setServices(data);
        } catch (err) {
            console.error('Error fetching services:', err);
        } finally {
            setLoading(false);
        }
    };

    const getServiceId = (service: Service): string => {
        return service.id?.toString() || service._id?.toString() || '';
    };

    const handleAddToCart = async (service: Service) => {
        const serviceId = getServiceId(service);
        // Set "Added!" state FIRST to prevent flash of other buttons
        setAddedItems(prev => ({ ...prev, [serviceId]: true }));
        // Then add to cart
        await addItem(service);
        // After 2 seconds, clear the "Added!" state
        setTimeout(() => {
            setAddedItems(prev => ({ ...prev, [serviceId]: false }));
        }, 2000);
    };

    const getImageUrl = (imagePath?: string) => {
        if (!imagePath) return '/service-placeholder.png';
        if (imagePath.startsWith('http')) return imagePath;
        return `${config.apiUrl.replace('/api', '')}${imagePath}`;
    };

    const openServiceModal = (service: Service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const closeServiceModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedService(null), 300);
    };

    const handleLocationSelect = (locationId: string) => {
        const location = NZ_LOCATIONS.find(loc => loc.id === locationId);
        if (location?.active) {
            setSelectedLocation(locationId);
            setIsLocationDropdownOpen(false);
            // Show toast notification when location is changed
            setToastMessage(`Location set to ${location.name}. You can change this anytime.`);
            setShowLocationToast(true);
            setTimeout(() => setShowLocationToast(false), 4000);
            
            // Scroll to services section after location selection
            setTimeout(() => {
                const servicesSection = document.getElementById('services-section');
                servicesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    };

    // Browse Services - always scroll to services section (no blocking prompt)
    const handleBrowseServicesClick = () => {
        // Auto-select Auckland CBD if no location selected
        if (!selectedLocation) {
            setSelectedLocation('auckland-cbd');
            setToastMessage(`Location set to Auckland CBD. You can change this anytime using the dropdown.`);
            setShowLocationToast(true);
            setTimeout(() => setShowLocationToast(false), 4000);
        }
        // Always scroll to services section
        setTimeout(() => {
            const servicesSection = document.getElementById('services-section');
            servicesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const getSelectedLocationName = () => {
        const location = NZ_LOCATIONS.find(loc => loc.id === selectedLocation);
        return location ? `${location.name}, ${location.region}` : '';
    };

    // Group locations by region for better organization
    const groupedByRegion = NZ_LOCATIONS.reduce((acc, loc) => {
        const key = loc.region;
        if (!acc[key]) acc[key] = [];
        acc[key].push(loc);
        return acc;
    }, {} as Record<string, typeof NZ_LOCATIONS>);
    
    // Define region display order
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

    // Group services by category for list view
    const servicesByCategory = services.reduce((acc, service) => {
        const categoryName = service.category_name || 'Other';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(service);
        return acc;
    }, {} as Record<string, Service[]>);

    // Get category icon and color
    const getCategoryStyle = (categoryName: string) => {
        return CATEGORY_STYLES[categoryName] || { icon: Briefcase, bgColor: 'bg-slate-500', iconColor: 'text-white', gradient: 'from-slate-400 to-slate-600' };
    };

    return (
        <MainLayout>
            {/* Hero Section - Premium Design */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0f2744] to-slate-900 min-h-[80vh] flex items-center animate-fade-in">
                {/* Refined Background Elements */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px]" />
                <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-blue-600/15 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-teal-500/10 rounded-full blur-[130px]" />
                <div className="absolute top-1/3 left-1/3 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />

                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-20 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                        {/* Left Content */}
                        <div className="text-left">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white mb-4 sm:mb-5 leading-[1.1]">
                                Number 8 Wire
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-cyan-300 mt-1 sm:mt-2">
                                    on Demand
                                </span>
                            </h1>
                            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-400 mb-6 sm:mb-10 max-w-xl leading-[1.6] sm:leading-[1.7]">
                                Experience the future of home services. Vetted professionals, 
                                instant booking, and <span className="text-cyan-300 font-medium">100% satisfaction guaranteed</span>.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <button
                                    onClick={handleBrowseServicesClick}
                                    className="group inline-flex items-center justify-center px-5 sm:px-7 py-3 sm:py-4 text-sm sm:text-base font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-xl hover:from-cyan-300 hover:to-teal-300 transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] whitespace-nowrap"
                                >
                                    <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-2.5 group-hover:scale-110 transition-transform" />
                                    Browse Services
                                </button>
                                <Link
                                    to="/professional-registration"
                                    className="group inline-flex items-center justify-center px-5 sm:px-7 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white bg-transparent border-2 border-white/30 rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 whitespace-nowrap"
                                >
                                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-2.5 group-hover:scale-110 transition-transform" />
                                    Become a Freelancer Pro
                                </Link>
                            </div>
                        </div>

                        {/* Right Content - Location Selector */}
                        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-black/20">
                            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                                    <MapPin className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-xl font-bold text-white">Select Your Location</h3>
                                    <p className="text-slate-400 text-xs sm:text-sm">Where do you need the service?</p>
                                </div>
                            </div>

                            {/* Location Dropdown */}
                            <div className="relative mb-4 sm:mb-6">
                                <button
                                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                                    className="w-full px-3 sm:px-5 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-left flex items-center justify-between hover:bg-white/15 transition-colors"
                                >
                                    <span className={`flex items-center gap-2 text-sm sm:text-base truncate ${selectedLocation ? 'text-white' : 'text-slate-400'}`}>
                                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                        <span className="truncate">{selectedLocation ? getSelectedLocationName() : 'Choose your area...'}</span>
                                    </span>
                                    <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform flex-shrink-0 ml-2 ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isLocationDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden z-50 max-h-60 sm:max-h-96 overflow-y-auto">
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
                                                            onClick={() => handleLocationSelect(loc.id)}
                                                            disabled={!loc.active}
                                                            className={`w-full text-left px-5 py-2.5 flex items-center justify-between transition-colors ${
                                                                loc.active 
                                                                    ? 'hover:bg-blue-50 text-slate-700 cursor-pointer' 
                                                                    : 'text-slate-400 cursor-not-allowed bg-slate-50'
                                                            } ${selectedLocation === loc.id ? 'bg-blue-100 text-blue-700' : ''}`}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <MapPin className="w-4 h-4" />
                                                                <span className="font-medium">{loc.name}</span>
                                                            </span>
                                                            {!loc.active && (
                                                                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                                    <Lock className="w-3 h-3" />
                                                                    Soon
                                                                </span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Service Areas Info */}
                            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                                        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-blue-200 font-medium mb-0.5 sm:mb-1">Currently Serving Auckland & North Island</p>
                                        <p className="text-[10px] sm:text-xs text-blue-300/80">We're expanding! South Island locations coming soon.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Wave */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" className="w-full h-auto fill-white" style={{ display: 'block' }}>
                        <path d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z" />
                    </svg>
                </div>
            </div>

            {/* Features Grid - Premium Design */}
            <div className="relative py-24 md:py-32 overflow-hidden bg-white -mt-px">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:24px_24px]" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-6">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Why Choose Us
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">
                            The{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500">noso company</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">Difference</span>
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            We've reimagined home services from the ground up. Here's what sets us apart.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {[
                            {
                                icon: Shield,
                                title: "Quality First",
                                desc: "We carefully vet every professional on our platform. Your safety and satisfaction are our top priorities.",
                                gradient: "from-blue-600 to-blue-700",
                                bgGradient: "from-blue-50 to-sky-50"
                            },
                            {
                                icon: Zap,
                                title: "Easy Booking",
                                desc: "Browse services, select what you need, and book at your convenience. Simple, fast, and hassle-free.",
                                gradient: "from-teal-500 to-cyan-500",
                                bgGradient: "from-teal-50 to-cyan-50"
                            },
                            {
                                icon: Users,
                                title: "Local Professionals",
                                desc: "Connect with skilled service providers right here in New Zealand. Supporting local businesses and communities.",
                                gradient: "from-indigo-500 to-purple-500",
                                bgGradient: "from-indigo-50 to-purple-50"
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="group relative bg-white rounded-3xl p-8 border border-slate-200 hover:border-transparent hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                                {/* Hover Background */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                <div className="relative z-10">
                                    {/* Icon */}
                                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                                        <feature.icon className="w-7 h-7 text-white" />
                                    </div>

                                    {/* Number Badge */}
                                    <div className="absolute top-8 right-8 w-8 h-8 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center text-sm font-bold text-slate-400 transition-colors">
                                        0{idx + 1}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                                        {feature.title}
                                    </h3>

                                    <p className="text-slate-600 leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Section Divider */}
            <div className="max-w-5xl mx-auto px-4">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            {/* How We Work Section */}
            <div className="py-24 md:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-6">
                            <ClipboardCheck className="w-4 h-4 mr-2" />
                            How We Work
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">
                            Simple & Transparent
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">Process</span>
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            We believe in honest, upfront service. Here's how we make it easy for you.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line - Desktop */}
                        <div className="hidden lg:block absolute top-20 left-[15%] right-[15%] h-0.5">
                            <div className="w-full h-full bg-gradient-to-r from-blue-300 via-teal-300 to-cyan-300 rounded-full"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-teal-400 to-cyan-400 rounded-full blur-sm opacity-50"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                            {[
                                { 
                                    step: '01', 
                                    icon: CalendarCheck,
                                    title: 'Book Appointment', 
                                    desc: 'Customer books an appointment through our easy online platform.',
                                    color: 'from-blue-500 to-blue-600',
                                    shadowColor: 'shadow-blue-500/30',
                                    bgColor: 'bg-blue-50',
                                    borderColor: 'border-blue-200',
                                    textColor: 'text-blue-600'
                                },
                                { 
                                    step: '02', 
                                    icon: MapPin,
                                    title: 'Professional Visits', 
                                    desc: 'A verified professional visits your location at the scheduled time.',
                                    color: 'from-blue-600 to-teal-500',
                                    shadowColor: 'shadow-blue-500/30',
                                    bgColor: 'bg-sky-50',
                                    borderColor: 'border-sky-200',
                                    textColor: 'text-sky-600'
                                },
                                { 
                                    step: '03', 
                                    icon: ClipboardCheck,
                                    title: 'Work Assessment', 
                                    desc: 'The professional assesses the work required on-site.',
                                    color: 'from-teal-500 to-cyan-500',
                                    shadowColor: 'shadow-teal-500/30',
                                    bgColor: 'bg-teal-50',
                                    borderColor: 'border-teal-200',
                                    textColor: 'text-teal-600'
                                },
                                { 
                                    step: '04', 
                                    icon: Calculator,
                                    title: 'Cost Estimation', 
                                    desc: 'Cost estimation is provided on-site based on the scope of work.',
                                    color: 'from-cyan-500 to-blue-500',
                                    shadowColor: 'shadow-cyan-500/30',
                                    bgColor: 'bg-cyan-50',
                                    borderColor: 'border-cyan-200',
                                    textColor: 'text-cyan-600'
                                },
                            ].map((item, idx) => (
                                <div key={idx} className="relative group">
                                    {/* Card */}
                                    <div className={`bg-white rounded-3xl p-8 border ${item.borderColor} hover:border-transparent hover:shadow-2xl ${item.shadowColor} transition-all duration-500 hover:-translate-y-2 relative overflow-hidden`}>
                                        {/* Background Glow */}
                                        <div className={`absolute inset-0 ${item.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                                        
                                        {/* Step Number Badge */}
                                        <div className={`absolute -top-0 -right-0 w-16 h-16 bg-gradient-to-br ${item.color} rounded-bl-3xl flex items-end justify-start p-2`}>
                                            <span className="text-white text-xs font-black">{item.step}</span>
                                        </div>

                                        <div className="relative z-10">
                                            {/* Icon */}
                                            <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-xl ${item.shadowColor} mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                                <item.icon className="w-8 h-8 text-white" />
                                            </div>

                                            {/* Content */}
                                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-slate-800">{item.title}</h3>
                                            <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
                                        </div>
                                    </div>

                                    {/* Arrow connector for desktop - between cards */}
                                    {idx < 3 && (
                                        <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                                                <ArrowRight className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Divider */}
            <div className="max-w-5xl mx-auto px-4">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            {/* Browse Available Services Section - Shows after location selection */}
            <div id="services-section" data-section="services" className="py-24 md:py-32 bg-white scroll-mt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-6">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Browse Services
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">
                            Available Services
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
                                {selectedLocation ? `in ${getSelectedLocationName()}` : 'In Your Area'}
                            </span>
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {selectedLocation 
                                ? 'Browse and book from our selection of professional home services.'
                                : 'Select your location above to see available services in your area.'}
                        </p>
                        {selectedLocation && (
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                <span>Currently showing services in <strong className="text-slate-800">{getSelectedLocationName()}</strong></span>
                                <span className="text-slate-400">•</span>
                                <button 
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                >
                                    Change location
                                </button>
                            </div>
                        )}
                    </div>

                    {!selectedLocation ? (
                        /* Prompt to select location */
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-3xl mb-6">
                                <MapPin className="w-12 h-12 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Select Your Location First</h3>
                            <p className="text-slate-600 max-w-md mx-auto mb-8">
                                Please choose your area from the location selector above to view available services.
                            </p>
                            <button 
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                            >
                                <ArrowRight className="w-5 h-5 mr-2 rotate-[-90deg]" />
                                Go to Location Selector
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Category Filter */}
                            <div className="flex flex-col md:flex-row gap-5 mb-12 bg-white p-4 rounded-3xl border border-gray-200 shadow-lg">
                                {/* Location Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                                        className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200 hover:border-blue-300 hover:bg-blue-100 transition-all min-w-[280px]"
                                    >
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium text-blue-700 flex-grow text-left">{getSelectedLocationName()}</span>
                                        <ChevronDown className={`w-4 h-4 text-blue-500 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isLocationDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto min-w-[320px]">
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
                                                                onClick={() => handleLocationSelect(loc.id)}
                                                                disabled={!loc.active}
                                                                className={`w-full text-left px-5 py-2.5 flex items-center justify-between transition-colors ${
                                                                    loc.active 
                                                                        ? 'hover:bg-blue-50 text-slate-700 cursor-pointer' 
                                                                        : 'text-slate-400 cursor-not-allowed bg-slate-50'
                                                                } ${selectedLocation === loc.id ? 'bg-blue-100 text-blue-700' : ''}`}
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    <MapPin className="w-4 h-4" />
                                                                    <span className="font-medium">{loc.name}</span>
                                                                </span>
                                                                {!loc.active && (
                                                                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                                        <Lock className="w-3 h-3" />
                                                                        Soon
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Clear Cart Button */}
                                {cartItems.length > 0 && (
                                    <button
                                        onClick={() => clearCart()}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Clear Cart ({cartItems.length})
                                    </button>
                                )}
                                
                                <div className="flex-grow relative">
                                    <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 w-5 h-5 pointer-events-none" />

                                    <button
                                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                        onBlur={() => setTimeout(() => setIsCategoryDropdownOpen(false), 200)}
                                        className="w-full pl-12 pr-10 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 text-left focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all flex items-center justify-between"
                                    >
                                        <span className="truncate">
                                            {categories.find(c => c._id === selectedCategory)?.name || "All Categories"}
                                        </span>
                                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCategoryDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isCategoryDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="max-h-60 overflow-y-auto py-2 custom-scrollbar">
                                                <button
                                                    onClick={() => { setSelectedCategory(''); setIsCategoryDropdownOpen(false); }}
                                                    className={`w-full text-left px-5 py-3 text-sm transition-colors hover:bg-gray-50 ${selectedCategory === '' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-700'}`}
                                                >
                                                    All Categories
                                                </button>
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat._id}
                                                        onClick={() => { setSelectedCategory(cat._id); setIsCategoryDropdownOpen(false); }}
                                                        className={`w-full text-left px-5 py-3 text-sm transition-colors hover:bg-gray-50 ${selectedCategory === cat._id ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-700'}`}
                                                    >
                                                        {cat.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* View Mode Toggle */}
                                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                            viewMode === 'list'
                                                ? 'bg-white text-blue-600 shadow-md'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                        }`}
                                        title="View services as a categorized list"
                                    >
                                        <Layers className="w-4 h-4" />
                                        <span className="hidden sm:inline">Categories</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('cards')}
                                        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                            viewMode === 'cards'
                                                ? 'bg-white text-blue-600 shadow-md'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                        }`}
                                        title="View services as cards"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                        <span className="hidden sm:inline">All Services</span>
                                    </button>
                                </div>
                            </div>

                            {/* Services Display */}
                            {loading ? (
                                <div className="flex justify-center py-32">
                                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                                </div>
                            ) : services.length === 0 ? (
                                <div className="text-center py-32">
                                    <div className="inline-flex content-center justify-center p-6 bg-gray-100 rounded-full mb-6 relative">
                                        <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
                                        <Search className="w-12 h-12 text-gray-400 relative z-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No services found</h3>
                                    <p className="text-gray-500">Try adjusting your category filter or check back later.</p>
                                </div>
                            ) : viewMode === 'list' ? (
                                /* LIST VIEW - Category Cards with Animations */
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.entries(servicesByCategory).map(([categoryName, categoryServices], categoryIndex) => {
                                        const style = getCategoryStyle(categoryName);
                                        const IconComponent = style.icon;
                                        const isExpanded = expandedCategory === categoryName;

                                        return (
                                            <div 
                                                key={categoryName}
                                                className={`category-card bg-white border-2 rounded-2xl overflow-hidden animate-fade-in ${
                                                    isExpanded 
                                                        ? 'expanded border-blue-500 shadow-2xl shadow-blue-500/20 md:col-span-2 lg:col-span-3 ring-4 ring-blue-500/10' 
                                                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xl'
                                                }`}
                                                style={{ animationDelay: `${categoryIndex * 0.1}s` }}
                                            >
                                                {/* Category Header - Always visible */}
                                                <button
                                                    onClick={() => setExpandedCategory(isExpanded ? null : categoryName)}
                                                    className="w-full p-6 flex items-center justify-between group relative overflow-hidden"
                                                >
                                                    {/* Background gradient on hover */}
                                                    <div className={`absolute inset-0 bg-gradient-to-r ${style.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                                                    
                                                    <div className="flex items-center gap-4 relative z-10">
                                                        <div className={`category-icon icon-shimmer w-16 h-16 bg-gradient-to-br ${style.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
                                                            <IconComponent className="w-8 h-8 text-white" />
                                                        </div>
                                                        <div className="text-left">
                                                            <h3 className="font-bold text-slate-900 text-xl group-hover:text-slate-700 transition-colors">{categoryName}</h3>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-sm text-slate-500 flex items-center gap-1.5">
                                                                    <Layers className="w-4 h-4" />
                                                                    {categoryServices.length} {categoryServices.length === 1 ? 'Service' : 'Services'}
                                                                </span>
                                                                {isExpanded && (
                                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full animate-fade-in">
                                                                        Viewing
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`category-chevron w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                                        isExpanded 
                                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 rotated' 
                                                            : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                                                    }`}>
                                                        <ChevronDown className="w-6 h-6" />
                                                    </div>
                                                </button>

                                                {/* Expanded Services List with Animation */}
                                                {isExpanded && (
                                                    <div className="category-expand-content border-t-2 border-slate-100 bg-gradient-to-b from-slate-50 to-white">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                                            {categoryServices.map((service, serviceIndex) => {
                                                                const serviceId = getServiceId(service);
                                                                const inCart = isInCart(serviceId);
                                                                const ServiceIcon = getServiceIcon(service.title, categoryName);
                                                                
                                                                return (
                                                                    <div 
                                                                        key={serviceId}
                                                                        className="service-item bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-300 cursor-pointer group/item"
                                                                        onClick={() => openServiceModal(service)}
                                                                        style={{ animationDelay: `${serviceIndex * 0.05}s` }}
                                                                    >
                                                                        <div className="flex items-start gap-3">
                                                                            <div className={`w-12 h-12 bg-gradient-to-br ${style.gradient} bg-opacity-15 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform duration-300`}>
                                                                                <ServiceIcon className="w-6 h-6 text-white" />
                                                                            </div>
                                                                            <div className="flex-grow min-w-0">
                                                                                <h4 className="font-bold text-slate-900 text-sm group-hover/item:text-blue-600 transition-colors line-clamp-1">
                                                                                    {service.title}
                                                                                </h4>
                                                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                                                    {service.description}
                                                                                </p>
                                                                                <div className="flex items-center justify-between mt-3">
                                                                                    <span className="text-sm font-bold text-blue-600">
                                                                                        ${service.price?.toFixed(2) || '0.00'}
                                                                                    </span>
                                                                                    {inCart ? (
                                                                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1 animate-fade-in">
                                                                                            <Check className="w-3.5 h-3.5" />
                                                                                            Added
                                                                                        </span>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleAddToCart(service);
                                                                                            }}
                                                                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95"
                                                                                        >
                                                                                            <ShoppingCart className="w-3.5 h-3.5" />
                                                                                            Add
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover/item:text-blue-500 group-hover/item:translate-x-1 transition-all flex-shrink-0" />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* CARD VIEW - Grid with Icons and Animations */
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {services.map((service, index) => {
                                        const serviceId = getServiceId(service);
                                        const categoryStyle = getCategoryStyle(service.category_name || '');
                                        const ServiceIcon = getServiceIcon(service.title, service.category_name || '');
                                        return (
                                        <div 
                                            key={serviceId} 
                                            className="group flex flex-col bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-2 animate-fade-in"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <div
                                                className="aspect-[4/3] relative overflow-hidden bg-gray-100 cursor-pointer"
                                                onClick={() => openServiceModal(service)}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent z-10 opacity-60" />
                                                <img
                                                    src={getImageUrl(service.image)}
                                                    alt={service.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    onError={(e) => { e.currentTarget.src = '/service-placeholder.png'; }}
                                                />
                                                {/* Service Icon Badge */}
                                                <div className={`absolute bottom-4 left-4 z-20 w-12 h-12 bg-gradient-to-br ${categoryStyle.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                    <ServiceIcon className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
                                                    {service.category_name && (
                                                        <span className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/10 uppercase tracking-wider">
                                                            {service.category_name}
                                                        </span>
                                                    )}
                                                    {isInCart(serviceId) && (
                                                        <span className="bg-blue-600 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white border border-blue-400/30 uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-blue-500/50">
                                                            <Check className="w-3 h-3" /> In Cart
                                                        </span>
                                                    )}
                                                </div>
                                                {addedItems[serviceId] && (
                                                    <Link 
                                                        to="/cart"
                                                        className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-emerald-500/95 to-teal-500/95 cursor-pointer"
                                                    >
                                                        <div className="text-center">
                                                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg animate-[scaleIn_0.2s_ease-out]">
                                                                <Check className="w-7 h-7 text-emerald-500" strokeWidth={3} />
                                                            </div>
                                                            <p className="text-white font-semibold">Added!</p>
                                                            <p className="text-white/80 text-xs mt-0.5">Tap to view cart</p>
                                                        </div>
                                                    </Link>
                                                )}
                                            </div>

                                            <div className="p-6 flex-grow flex flex-col relative">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                        {service.title}
                                                    </h3>
                                                </div>

                                                <button
                                                    onClick={() => openServiceModal(service)}
                                                    className="text-blue-600 hover:text-blue-500 text-sm font-medium mb-3 flex items-center gap-1 w-fit group/link"
                                                >
                                                    <Info className="w-4 h-4" />
                                                    <span className="group-hover/link:underline">View Details</span>
                                                    <ChevronRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                                                </button>

                                                <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2 flex-grow">
                                                    {service.description}
                                                </p>

                                                {/* Price Note */}
                                                <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                                                        <Info className="w-3.5 h-3.5" />
                                                        Prices will be available soon
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-end mt-auto pt-5 border-t border-gray-100">
                                                    {(() => {
                                                        const inCart = isInCart(serviceId);
                                                        const justAdded = addedItems[serviceId];
                                                        
                                                        // State 1: Just added - show "Added!" button
                                                        if (justAdded) {
                                                            return (
                                                                <button
                                                                    disabled
                                                                    className="px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 cursor-default"
                                                                >
                                                                    <span className="flex items-center justify-center w-5 h-5 bg-white/20 rounded-full animate-[scaleIn_0.2s_ease-out]">
                                                                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                                                    </span>
                                                                    <span>Added!</span>
                                                                </button>
                                                            );
                                                        }
                                                        
                                                        // State 2: In cart - show Remove & View Cart
                                                        if (inCart) {
                                                            return (
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleRemoveFromCart(serviceId)}
                                                                        className="group/remove px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-1.5 transition-all duration-200 bg-white text-red-500 border-2 border-red-100 hover:border-red-400 hover:bg-red-50 active:scale-95"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover/remove:rotate-[-8deg]" />
                                                                        <span>Remove</span>
                                                                    </button>
                                                                    <Link
                                                                        to="/cart"
                                                                        className="group/cart px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-1.5 transition-all duration-200 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-400 active:scale-95"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                        <span>View Cart</span>
                                                                        <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/cart:translate-x-0.5" />
                                                                    </Link>
                                                                </div>
                                                            );
                                                        }
                                                        
                                                        // State 3: Not in cart - show Add to Cart
                                                        return (
                                                            <button
                                                                onClick={() => handleAddToCart(service)}
                                                                className="group/add relative px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200 overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:from-blue-500 hover:to-blue-600 active:scale-95"
                                                            >
                                                                <span className="absolute inset-0 -translate-x-full group-hover/add:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12" />
                                                                <ShoppingCart className="w-4 h-4 relative transition-transform duration-200 group-hover/add:scale-110" />
                                                                <span className="relative">Add to Cart</span>
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Service Detail Modal */}
            {isModalOpen && selectedService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeServiceModal}>
                    <div 
                        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative">
                            <img
                                src={getImageUrl(selectedService.image)}
                                alt={selectedService.title}
                                className="w-full h-64 object-cover"
                                onError={(e) => { e.currentTarget.src = '/service-placeholder.png'; }}
                            />
                            <button
                                onClick={closeServiceModal}
                                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
                            >
                                ×
                            </button>
                            {selectedService.category_name && (
                                <span className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold text-white">
                                    {selectedService.category_name}
                                </span>
                            )}
                        </div>
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedService.title}</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">{selectedService.description}</p>
                            
                            {/* Price Note */}
                            <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Prices will be available soon
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                                <button
                                    onClick={closeServiceModal}
                                    className="px-5 py-2.5 text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                                >
                                    Close
                                </button>
                                {!isInCart(getServiceId(selectedService)) ? (
                                    <button
                                        onClick={() => {
                                            handleAddToCart(selectedService);
                                            closeServiceModal();
                                        }}
                                        className="group/btn relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:from-blue-500 hover:to-blue-600 active:scale-95 overflow-hidden"
                                    >
                                        <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                        <ShoppingCart className="w-4 h-4 relative transition-transform duration-300 group-hover/btn:scale-110" />
                                        <span className="relative">Add to Cart</span>
                                    </button>
                                ) : (
                                    <Link
                                        to="/cart"
                                        className="group/btn px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium flex items-center gap-2 transition-all duration-300 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-400 active:scale-95"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>View Cart</span>
                                        <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Section Divider */}
            <div className="max-w-5xl mx-auto px-4">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            {/* CTA Section - Premium Design */}
            <div className="py-24 md:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative bg-gradient-to-br from-[#1E3A5F] via-slate-800 to-slate-900 rounded-[2.5rem] p-8 md:p-16 lg:p-20 overflow-hidden">
                        {/* Background Elements */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/15 rounded-full blur-[80px]" />

                        <div className="relative z-10 max-w-3xl mx-auto text-center">
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-semibold text-sm mb-8">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Start Today
                            </div>
                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                                Ready to Transform Your
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                                    Home Experience?
                                </span>
                            </h2>
                            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                                Experience quality home services with verified professionals. Book your first service today and see the noso difference.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button 
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold hover:from-blue-500 hover:to-blue-600 transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:-translate-y-1"
                                >
                                    Book Your First Service
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <Link 
                                    to="/register" 
                                    className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl font-bold hover:bg-white/20 transition-all"
                                >
                                    Create Free Account
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location Toast Notification */}
            {showLocationToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">{toastMessage}</p>
                        </div>
                        <button
                            onClick={() => setShowLocationToast(false)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default LandingPage;
