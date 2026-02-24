import React, { useState, useEffect } from 'react';
import MainLayout from '../../layout/MainLayout';
import { servicesApi } from '../../api/services';
import { categoriesApi } from '../../api/categories';
import type { Category } from '../../api/categories';
import type { Service } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { Search, Filter, ShoppingCart, Check, Loader2, ChevronRight, Info, CalendarCheck, MapPin, ClipboardCheck, Calculator } from 'lucide-react';
import { config } from '../../config';

const ServicesPage: React.FC = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Custom Dropdown State
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    // Modal State
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Cart store
    const { addItem, isInCart } = useCartStore();
    const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchServices();
        }, 500);
        return () => clearTimeout(timer);
    }, [selectedCategory, searchQuery]);

    const fetchData = async () => {
        try {
            const [cats] = await Promise.all([
                categoriesApi.list(),
                fetchServices()
            ]);
            setCategories(cats);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchServices = async () => {
        setLoading(true);
        try {
            const params: any = { is_active: true };
            if (selectedCategory) params.category_id = selectedCategory;
            if (searchQuery) params.search = searchQuery;

            const data = await servicesApi.list(params);
            setServices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getServiceId = (service: Service): string => {
        return service.id?.toString() || service._id?.toString() || '';
    };

    const handleAddToCart = async (service: Service) => {
        const serviceId = getServiceId(service);
        await addItem(service);
        setAddedItems(prev => ({ ...prev, [serviceId]: true }));
        setTimeout(() => {
            setAddedItems(prev => ({ ...prev, [serviceId]: false }));
        }, 2000);
    };

    const getImageUrl = (imagePath?: string) => {
        if (!imagePath) return '/service-placeholder.png'; // Use local placeholder
        if (imagePath.startsWith('http')) return imagePath;
        return `${config.apiUrl.replace('/api', '')}${imagePath}`;
    };

    const openServiceModal = (service: Service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const closeServiceModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedService(null), 300); // Delay to allow animation
    };

    return (
        <MainLayout>
            {/* Header Section - Dark Theme */}
            <div className="relative py-20 overflow-hidden bg-gradient-to-br from-slate-900 via-[#1E3A5F] to-slate-900">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-semibold text-sm mb-6">
                        <Filter className="w-4 h-4 mr-2" />
                        {services.length} Services Available
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white">
                        Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Services</span>
                    </h1>
                    <p className="text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">
                        Choose from our wide range of premium home services.
                        Book instantly with verified professionals.
                    </p>
                </div>
            </div>

            <div className="min-h-screen bg-white py-12 animate-fade-in">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* How We Work Section */}
                    <div className="mb-16 bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200 p-8 md:p-12 shadow-lg overflow-hidden relative">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
                        
                        <div className="text-center max-w-2xl mx-auto mb-12 relative z-10">
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-4">
                                <ClipboardCheck className="w-4 h-4 mr-2" />
                                How We Work
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-3">
                                Simple & Transparent Process
                            </h2>
                            <p className="text-slate-600">
                                We believe in honest, upfront service. Here's how we make it easy for you.
                            </p>
                        </div>

                        {/* Connecting Line - Desktop */}
                        <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-0.5 mt-4">
                            <div className="w-full h-full bg-gradient-to-r from-blue-200 via-teal-200 to-cyan-200 rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                            {[
                                { 
                                    step: '01', 
                                    icon: CalendarCheck,
                                    title: 'Book Appointment', 
                                    desc: 'Customer books an appointment through our easy online platform.',
                                    color: 'from-blue-500 to-blue-600',
                                    shadowColor: 'shadow-blue-500/25',
                                    borderColor: 'hover:border-blue-300'
                                },
                                { 
                                    step: '02', 
                                    icon: MapPin,
                                    title: 'Professional Visits', 
                                    desc: 'A verified professional visits your location at the scheduled time.',
                                    color: 'from-blue-600 to-teal-500',
                                    shadowColor: 'shadow-blue-500/25',
                                    borderColor: 'hover:border-sky-300'
                                },
                                { 
                                    step: '03', 
                                    icon: ClipboardCheck,
                                    title: 'Work Assessment', 
                                    desc: 'The professional assesses the work required on-site.',
                                    color: 'from-teal-500 to-cyan-500',
                                    shadowColor: 'shadow-teal-500/25',
                                    borderColor: 'hover:border-teal-300'
                                },
                                { 
                                    step: '04', 
                                    icon: Calculator,
                                    title: 'Cost Estimation', 
                                    desc: 'Cost estimation is provided on-site based on the scope of work.',
                                    color: 'from-cyan-500 to-blue-500',
                                    shadowColor: 'shadow-cyan-500/25',
                                    borderColor: 'hover:border-cyan-300'
                                },
                            ].map((item, idx) => (
                                <div key={idx} className={`bg-white rounded-2xl p-6 border border-slate-100 ${item.borderColor} hover:shadow-xl ${item.shadowColor} transition-all duration-300 hover:-translate-y-1 group relative`}>
                                    {/* Step badge */}
                                    <div className={`absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-lg ${item.shadowColor} rotate-12 group-hover:rotate-0 transition-transform duration-300`}>
                                        <span className="text-white text-xs font-black">{item.step}</span>
                                    </div>
                                    
                                    <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-lg ${item.shadowColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <item.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-col md:flex-row gap-5 mb-12 bg-white p-4 rounded-3xl border border-gray-200 shadow-lg">
                        <div className="relative flex-grow group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors w-5 h-5" />
                            <input
                                type="text"
                                placeholder="What service do you need?"
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex-shrink-0 min-w-[240px] relative">
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
                    </div>

                    {/* Services Grid */}
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
                            <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services.map((service) => {
                                const serviceId = getServiceId(service);
                                return (
                                <div key={serviceId} className="group flex flex-col bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
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
                                            <div className="absolute inset-0 z-30 bg-blue-500/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                                                <div className="text-white text-center">
                                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                        <Check className="w-8 h-8 text-blue-600" strokeWidth={3} />
                                                    </div>
                                                    <span className="font-bold text-lg">Added to Cart!</span>
                                                </div>
                                            </div>
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
                                            className="text-blue-600 hover:text-blue-500 text-sm font-medium mb-3 flex items-center gap-1 w-fit"
                                        >
                                            <Info className="w-4 h-4" />
                                            View Details
                                        </button>

                                        <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2 flex-grow">
                                            {service.description}
                                        </p>

                                        <div className="flex items-center justify-end mt-auto pt-6 border-t border-gray-100">
                                            {isInCart(serviceId) && !addedItems[serviceId] ? (
                                                <button
                                                    disabled
                                                    className="px-6 py-3 rounded-xl font-bold flex items-center justify-center transition-all bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600"
                                                >
                                                    <Check className="w-5 h-5 mr-2" />
                                                    In Cart
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddToCart(service)}
                                                    disabled={addedItems[serviceId]}
                                                    className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center transition-all ${addedItems[serviceId]
                                                        ? 'bg-blue-600 text-white cursor-default'
                                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 group-hover:shadow-blue-500/30'
                                                        }`}
                                                >
                                                    {addedItems[serviceId] ? (
                                                        <>
                                                            <Check className="w-5 h-5 mr-2" />
                                                            Added
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShoppingCart className="w-5 h-5 mr-2" />
                                                            Add to Cart
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Service Detail Modal */}
            {isModalOpen && selectedService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-gray-200 shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Service Image */}
                        <div className="relative h-80 overflow-hidden bg-gray-100">
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
                            <img
                                src={getImageUrl(selectedService.image)}
                                alt={selectedService.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.src = '/service-placeholder.png'; }}
                            />
                            {selectedService.category_name && (
                                <span className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold text-gray-700 border border-gray-200 uppercase tracking-wider shadow-sm">
                                    {selectedService.category_name}
                                </span>
                            )}
                            {isInCart(getServiceId(selectedService)) && (
                                <span className="absolute top-4 right-4 z-20 bg-blue-600 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold text-white border border-blue-400/30 uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/50">
                                    <Check className="w-4 h-4" /> In Cart
                                </span>
                            )}
                        </div>

                        {/* Service Details */}
                        <div className="p-8">
                            <div className="mb-6">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                                    {selectedService.title}
                                </h2>
                                <div className="flex items-center gap-4">
                                    {selectedService.is_active ? (
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-full border border-blue-200">
                                            Available
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full border border-red-200">
                                            Unavailable
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-blue-600" />
                                    Description
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    {selectedService.description || 'Professional service with attention to detail and quality guaranteed.'}
                                </p>
                            </div>

                            {/* Features/Benefits */}
                            <div className="mb-8 bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">What's Included</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-gray-600">
                                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <span>Professional and experienced service providers</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-gray-600">
                                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <span>All necessary equipment and supplies included</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-gray-600">
                                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <span>Satisfaction guaranteed or your money back</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-gray-600">
                                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <span>Flexible scheduling to fit your needs</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {isInCart(getServiceId(selectedService)) && !addedItems[getServiceId(selectedService)] ? (
                                    <button
                                        disabled
                                        className="flex-1 px-8 py-4 rounded-xl font-bold flex items-center justify-center transition-all bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                    >
                                        <Check className="w-5 h-5 mr-2" />
                                        Already in Cart
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            handleAddToCart(selectedService);
                                            setTimeout(() => closeServiceModal(), 1500);
                                        }}
                                        disabled={addedItems[getServiceId(selectedService)] || !selectedService.is_active}
                                        className={`flex-1 px-8 py-4 rounded-xl font-bold flex items-center justify-center transition-all ${
                                            addedItems[getServiceId(selectedService)]
                                                ? 'bg-blue-600 text-white'
                                                : selectedService.is_active
                                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {addedItems[getServiceId(selectedService)] ? (
                                            <>
                                                <Check className="w-5 h-5 mr-2" />
                                                Added to Cart!
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-5 h-5 mr-2" />
                                                Add to Cart
                                            </>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={closeServiceModal}
                                    className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all border border-gray-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default ServicesPage;
