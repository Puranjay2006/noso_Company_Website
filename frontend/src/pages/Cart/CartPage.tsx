import React, { useState } from 'react';
import MainLayout from '../../layout/MainLayout';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Trash2, ShoppingBag, ArrowRight, Plus, Minus, Shield, Clock, CheckCircle2, ArrowLeft, Package, X, UserPlus, LogIn, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { config } from '../../config';

const CartPage: React.FC = () => {
    const { items, removeItem, updateQuantity, clearCart } = useCartStore();
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const handleQuantityChange = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        await updateQuantity(itemId, newQuantity);
    };

    const getImageUrl = (imagePath?: string) => {
        if (!imagePath) return '/service-placeholder.png';
        if (imagePath.startsWith('http')) return imagePath;
        return `${config.apiUrl.replace('/api', '')}${imagePath}`;
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }
        navigate('/checkout');
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white animate-fade-in">
                {/* Simplified Header */}
                <div className="bg-white border-b border-slate-200 shadow-sm">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <Link to="/services" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 mb-3 transition-colors">
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Continue Shopping
                                </Link>
                                <h1 className="text-3xl font-black text-slate-900">Shopping Cart</h1>
                            </div>
                            <div className="flex items-center gap-4">
                                {items.length > 0 && (
                                    <button
                                        onClick={() => clearCart()}
                                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Clear All
                                    </button>
                                )}
                                <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl">
                                    <ShoppingBag className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {items.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto">
                            <div className="bg-slate-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Package className="w-10 h-10 text-slate-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
                            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Looks like you haven't added any services yet. Browse our catalog to get started.</p>
                            <Link
                                to="/services"
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all inline-flex items-center gap-2"
                            >
                                Browse Services <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                    {items.map((item, index) => (
                                        <div key={`${item.id}-${item.service_id}-${index}`} className={`p-5 flex items-start gap-4 ${index !== items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                            <div className="flex-shrink-0">
                                                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden">
                                                    <img
                                                        src={getImageUrl(item.service_image)}
                                                        alt={item.service_title}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.currentTarget.src = '/service-placeholder.png'; }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <h3 className="font-bold text-slate-900">{item.service_title}</h3>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="flex items-center bg-slate-100 rounded-lg">
                                                        <button
                                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                            className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="px-3 py-1 text-slate-900 font-semibold min-w-[2.5rem] text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                            className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-24">
                                    <h2 className="text-lg font-bold text-slate-900 mb-5">Order Summary</h2>

                                    {/* Price Note */}
                                    <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                                        <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
                                            <Info className="w-4 h-4 flex-shrink-0" />
                                            Prices will be available soon
                                        </p>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between text-slate-600">
                                            <span>Items in cart</span>
                                            <span className="font-semibold text-slate-900">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Service Fee</span>
                                            <span className="font-medium text-slate-500 italic text-xs">Pricing coming soon</span>
                                        </div>
                                    </div>
                                    
                                    <div className="h-px bg-slate-200 my-5" />

                                    <button
                                        onClick={handleCheckout}
                                        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        Proceed to Checkout <ArrowRight className="w-4 h-4" />
                                    </button>

                                    {/* Trust Badges */}
                                    <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
                                        {[
                                            { icon: Shield, text: 'Secure Payment' },
                                            { icon: Clock, text: 'Instant Confirmation' },
                                            { icon: CheckCircle2, text: 'Satisfaction Guaranteed' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-500">
                                                <item.icon className="w-4 h-4 text-blue-600" />
                                                <span>{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Login Prompt Modal */}
            {showLoginPrompt && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200 relative">
                        <button
                            onClick={() => setShowLoginPrompt(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShoppingBag className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in to Continue</h2>
                            <p className="text-slate-500">Please log in or create an account to proceed with your checkout.</p>
                        </div>

                        <div className="space-y-3">
                            <Link
                                to="/login"
                                state={{ from: '/cart', returnToCheckout: true }}
                                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                            >
                                <LogIn className="w-5 h-5" />
                                Log in to Your Account
                            </Link>
                            
                            <Link
                                to="/register"
                                state={{ from: '/cart', returnToCheckout: true }}
                                className="w-full py-3.5 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 border border-slate-200"
                            >
                                <UserPlus className="w-5 h-5" />
                                Create New Account
                            </Link>
                        </div>

                        <p className="text-center text-xs text-slate-400 mt-6">
                            Your cart items will be saved while you sign in
                        </p>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default CartPage;