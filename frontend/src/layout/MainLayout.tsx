import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, Menu, X, ShoppingCart, ChevronRight, Heart, Linkedin, Twitter, Mail, Briefcase, Handshake, Sparkles, MessageSquare, MapPin } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { Logo } from '../components/Logo';
import ScrollToTopButton from '../components/ScrollToTopButton';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, logout, user } = useAuthStore();
    const { totalItems } = useCartStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMenuOpen(false);
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-blue-500/20">
            {/* Header */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md ${scrolled
                    ? 'shadow-sm py-2'
                    : 'py-3'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        {/* Logo */}
                        <Link to="/" className="flex-shrink-0" onClick={() => setIsMenuOpen(false)}>
                            <Logo size="lg" />
                        </Link>

                        {/* Desktop Navigation & Actions */}
                        <div className="hidden md:flex items-center gap-1">
                            {/* Nav Links */}
                            <Link
                                to="/"
                                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${isActive('/')
                                    ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                            >
                                Home
                            </Link>
                            <button
                                onClick={() => {
                                    if (location.pathname !== '/') {
                                        navigate('/');
                                        setTimeout(() => {
                                            const servicesSection = document.getElementById('services-section');
                                            servicesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }, 100);
                                    } else {
                                        const servicesSection = document.getElementById('services-section');
                                        servicesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }}
                                className="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5"
                            >
                                <Sparkles className="w-4 h-4" />
                                Services
                            </button>
                            <Link
                                to="/contact"
                                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${isActive('/contact')
                                    ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Contact Us
                            </Link>

                            {/* Divider */}
                            <div className="w-px h-5 bg-slate-200 mx-3" />

                            {/* Cart */}
                            <Link to="/cart" className={`relative p-2 rounded-full transition-colors ${isActive('/cart') ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                                <ShoppingCart className="w-5 h-5" />
                                {totalItems() > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white">
                                        {totalItems()}
                                    </span>
                                )}
                            </Link>

                            <ThemeToggle />

                            {/* Divider */}
                            <div className="w-px h-5 bg-slate-200 mx-3" />

                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/professional-registration"
                                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-full transition-all ${isActive('/professional-registration') ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'}`}
                                    >
                                        <Briefcase className="w-4 h-4 mr-1.5 opacity-70" />
                                        <span className="hidden lg:inline">Register as Freelancer Pro</span>
                                        <span className="lg:hidden">Freelancer Pro</span>
                                    </Link>
                                    <Link
                                        to={user?.role === 'admin' ? '/admin' : user?.role === 'partner' ? '/partner' : '/dashboard'}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-slate-100 transition-all duration-200"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white shadow-sm">
                                            {user?.name?.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 max-w-[80px] truncate pr-1">{user?.name}</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                                        title="Sign out"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="hidden lg:inline">Logout</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/professional-registration"
                                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-full transition-all ${isActive('/professional-registration') ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'}`}
                                    >
                                        <Briefcase className="w-4 h-4 mr-1.5 opacity-70" />
                                        <span className="hidden lg:inline">Register as Freelancer Pro</span>
                                        <span className="lg:hidden">Freelancer Pro</span>
                                    </Link>
                                    <Link
                                        to="/partner-registration"
                                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-full transition-all ${isActive('/partner-registration') ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'}`}
                                    >
                                        <Handshake className="w-4 h-4 mr-1.5 opacity-70" />
                                        <span className="hidden lg:inline">Become a Partner</span>
                                        <span className="lg:hidden">Partner</span>
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-sm hover:shadow-md ml-2"
                                    >
                                        Login / Sign up
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-2">
                            <Link to="/cart" className="relative p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors">
                                <ShoppingCart className="w-5 h-5" />
                                {totalItems() > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                        {totalItems()}
                                    </span>
                                )}
                            </Link>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-lg md:hidden z-50">
                        <div className="px-4 py-5 space-y-1">
                            <Link onClick={() => setIsMenuOpen(false)} to="/" className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-all ${location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'}`}>
                                Home
                            </Link>
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    if (location.pathname !== '/') {
                                        navigate('/');
                                        setTimeout(() => {
                                            const servicesSection = document.getElementById('services-section');
                                            servicesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }, 100);
                                    } else {
                                        const servicesSection = document.getElementById('services-section');
                                        servicesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-base font-medium transition-all text-slate-700 hover:bg-slate-50"
                            >
                                <Sparkles className="w-5 h-5 text-slate-400" />
                                Services
                            </button>
                            <Link
                                onClick={() => setIsMenuOpen(false)}
                                to="/contact"
                                className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-base font-medium transition-all ${isActive('/contact') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                <MessageSquare className="w-5 h-5 text-slate-400" />
                                Contact Us
                            </Link>

                            <div className="h-px bg-slate-100 my-3" />

                            <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-sm text-slate-500">Appearance</span>
                                <ThemeToggle />
                            </div>

                            <div className="h-px bg-slate-100 my-3" />

                            {isAuthenticated ? (
                                <div className="space-y-1">
                                    <Link
                                        onClick={() => setIsMenuOpen(false)}
                                        to="/professional-registration"
                                        className={`flex items-center w-full px-3 py-2.5 rounded-lg transition-all ${isActive('/professional-registration') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        <Briefcase className="w-5 h-5 mr-2 text-slate-400" />
                                        Register as Freelancer Pro
                                    </Link>
                                    <Link onClick={() => setIsMenuOpen(false)} to="/dashboard" className={`flex items-center justify-between w-full px-3 py-2.5 text-base font-medium rounded-lg transition-all ${isActive('/dashboard') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        Dashboard <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </Link>
                                    <button onClick={handleLogout} className="flex items-center text-red-600 font-medium px-3 py-2.5 w-full text-left hover:bg-red-50 rounded-lg transition-all">
                                        <LogOut className="w-5 h-5 mr-2" /> Sign out
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2 pt-2">
                                    <Link
                                        onClick={() => setIsMenuOpen(false)}
                                        to="/professional-registration"
                                        className={`flex items-center w-full px-3 py-2.5 rounded-lg transition-all ${isActive('/professional-registration') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        <Briefcase className="w-5 h-5 mr-2 text-slate-400" />
                                        Register as Freelancer Pro
                                    </Link>
                                    <Link
                                        onClick={() => setIsMenuOpen(false)}
                                        to="/partner-registration"
                                        className={`flex items-center w-full px-3 py-2.5 rounded-lg transition-all ${isActive('/partner-registration') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        <Handshake className="w-5 h-5 mr-2 text-slate-400" />
                                        Become a Partner
                                    </Link>
                                    <div className="pt-2">
                                        <Link onClick={() => setIsMenuOpen(false)} to="/login" className="flex items-center justify-center w-full px-4 py-2.5 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all">
                                            Login / Sign up
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Referral Banner - Only on Homepage */}
            {location.pathname === '/' && (
                <div className={`fixed left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'top-[66px]' : 'top-[80px]'}`}>
                    <div className="bg-gradient-to-r from-blue-700/90 via-teal-600/90 to-emerald-600/90 overflow-hidden">
                        <div className={`w-full px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-center transition-all duration-300 ${scrolled ? 'h-[44px] sm:h-[54px]' : 'h-[40px] sm:h-[48px]'}`}>
                            {/* Desktop text */}
                            <p className="hidden sm:flex text-white/95 font-medium text-sm md:text-base text-center items-center justify-center flex-wrap gap-x-1">
                                <span>Refer friends & family to</span>
                                <Link 
                                    to="/professional-registration" 
                                    className="relative inline-flex items-center text-white font-semibold hover:text-cyan-200 transition-colors duration-200 group"
                                >
                                    register as freelancer professionals
                                    <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-cyan-200 transition-all duration-300 ease-out group-hover:w-full"></span>
                                </Link>
                                <span>— help them get jobs and start earning!</span>
                            </p>
                            {/* Mobile text - shorter version */}
                            <Link 
                                to="/professional-registration" 
                                className="sm:hidden text-white/95 font-medium text-[11px] text-center flex items-center justify-center gap-1 hover:text-cyan-200 transition-colors px-1"
                            >
                                <span>👋</span>
                                <span className="truncate">Become a <span className="font-bold underline underline-offset-2">Freelancer Pro</span> — Earn today!</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className={`flex-grow ${location.pathname === '/' ? (scrolled ? 'pt-[110px] sm:pt-[120px]' : 'pt-[120px] sm:pt-[128px]') : (scrolled ? 'pt-[66px]' : 'pt-[80px]')} transition-all duration-300 animate-page-enter`}>
                {children}
            </main>

            {/* Redesigned Footer */}
            <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="inline-block px-4 py-3 bg-white rounded-2xl mb-6">
                                <Logo size="xl" />
                            </div>
                            <p className="text-gray-300 leading-relaxed max-w-sm">
                                Empowering businesses and homeowners with seamless, high-quality service solutions.
                                We're dedicated to excellence in every interaction.
                            </p>
                            
                            {/* Contact Info */}
                            <div className="mt-6 space-y-3">
                                <a 
                                    href="mailto:naveen@nosocompany.com" 
                                    className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors"
                                >
                                    <Mail className="w-5 h-5" />
                                    <span>naveen@nosocompany.com</span>
                                </a>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <MapPin className="w-5 h-5" />
                                    <span>Auckland, New Zealand</span>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 mt-6">
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 text-gray-300 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 text-gray-300 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                                    <Twitter className="w-5 h-5" />
                                </a>
                                <a href="mailto:naveen@nosocompany.com" className="w-10 h-10 rounded-full bg-slate-800 text-gray-300 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                                    <Mail className="w-5 h-5" />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Company</h4>
                            <ul className="space-y-4">
                                <li><Link to="/partner-registration" className="text-gray-300 hover:text-blue-400 transition-colors font-semibold">Become a Partner</Link></li>
                                <li><Link to="/professional-registration" className="text-gray-300 hover:text-blue-400 transition-colors">Freelancer Pro</Link></li>
                                <li><Link to="/contact" className="text-gray-300 hover:text-blue-400 transition-colors">Contact</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Legal</h4>
                            <ul className="space-y-4">
                                <li><Link to="/privacy" className="text-gray-300 hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="text-gray-300 hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-300">
                        <p>&copy; {new Date().getFullYear()} noso company. All rights reserved.</p>
                        <div className="flex gap-8">
                            <span className="flex items-center gap-1.5">
                                Made with <Heart className="w-4 h-4 text-blue-500 fill-blue-500" /> for quality service
                            </span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Scroll to Top Button */}
            <ScrollToTopButton />
        </div>
    );
};

export default MainLayout;
