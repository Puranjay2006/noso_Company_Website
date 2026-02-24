import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Shield, Star, Users, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../api/auth';
import apiClient from '../../api/client';
import { cartApi } from '../../api/cart';
import { useCartStore } from '../../store/useCartStore';
import { Logo } from '../../components/Logo';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { setAuth } = useAuthStore();
    const { items: cartItems } = useCartStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const loginRes = await authApi.login({
                email,
                password
            });

            apiClient.defaults.headers.common['Authorization'] = `Bearer ${loginRes.access_token}`;

            const user = await authApi.getMe();
            setAuth(user, loginRes.access_token);

            // Navigate immediately, sync cart in background (non-blocking)
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'partner') navigate('/partner');
            else navigate('/dashboard');

            // Sync cart items in background after navigation
            if (cartItems.length > 0) {
                Promise.all(cartItems.map(item => cartApi.add(item.service_id, item.quantity).catch(e => console.error("Sync error", e))));
            }

        } catch (err: any) {
            console.error("Login failed", err);
            setError(err.response?.data?.detail || "Invalid email or password");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex relative animate-fade-in">
            {/* Back Button - Top Left of Page - Desktop (on dark panel) */}
            <div className="hidden lg:block absolute top-6 left-6 z-50">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
            </div>
            
            {/* Back Button - Mobile/Tablet (on white background) */}
            <div className="lg:hidden absolute top-4 left-4 z-50">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full transition-all shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Home
                </Link>
            </div>

            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-[#1E3A5F] to-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-20 left-20 w-80 h-80 bg-teal-500/15 rounded-full blur-[100px]" />
                
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
                    <Link to="/" className="mb-12 inline-block w-fit px-4 py-3 bg-white rounded-2xl shadow-lg">
                        <Logo size="xl" />
                    </Link>
                    
                    <h1 className="text-4xl xl:text-5xl font-black text-white mb-6 leading-tight">
                        Welcome back to
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                            noso company
                        </span>
                    </h1>
                    <p className="text-lg text-slate-300 mb-12 max-w-md">
                        Access your dashboard, manage bookings, and enjoy premium home services.
                    </p>
                    
                    {/* Trust Indicators */}
                    <div className="space-y-4">
                        {[
                            { icon: Shield, text: 'Secure & encrypted login' },
                            { icon: Users, text: 'Growing community of users' },
                            { icon: Star, text: 'Quality service promise' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-slate-300">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <item.icon className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-12 xl:px-20 bg-white relative">
                <div className="lg:hidden text-center mb-8">
                    <Link to="/" className="inline-block mb-4">
                        <Logo size="xl" />
                    </Link>
                </div>

                <div className="max-w-md w-full mx-auto">
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sign In</h2>
                        <p className="mt-2 text-slate-600">
                            Enter your credentials to access your account
                        </p>
                    </div>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full pl-12 pr-12 py-4 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/25 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                                Create one free
                            </Link>
                        </p>
                    </div>

                    {/* Social Proof */}
                    <div className="mt-10 pt-8 border-t border-slate-200">
                        <p className="text-xs text-slate-500 text-center mb-4">Your trusted home services platform</p>
                        <div className="flex justify-center items-center gap-6">
                            <div className="flex items-center gap-1 text-slate-400">
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-medium">Secure</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-medium">Fast</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-medium">Reliable</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
