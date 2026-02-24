import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Loader2, Shield, Zap, Award, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api/auth';
import { Logo } from '../../components/Logo';
import { PhoneInput } from '../../components/PhoneInput';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'customer'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await authApi.register({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });
            navigate('/login');
        } catch (err: any) {
            console.error("Registration failed", err);
            setError(err.response?.data?.detail || "Registration failed. Please try again.");
        } finally {
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
                <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-teal-500/15 rounded-full blur-[100px]" />
                
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
                    <Link to="/" className="mb-12 inline-block w-fit px-4 py-3 bg-white rounded-2xl shadow-lg">
                        <Logo size="xl" />
                    </Link>
                    
                    <h1 className="text-4xl xl:text-5xl font-black text-white mb-6 leading-tight">
                        Join our growing
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                            community
                        </span>
                    </h1>
                    <p className="text-lg text-slate-300 mb-12 max-w-md">
                        Create your free account and start booking quality home services today.
                    </p>
                    
                    {/* Benefits */}
                    <div className="space-y-4">
                        {[
                            { icon: Zap, text: 'Quick and easy booking' },
                            { icon: Shield, text: 'All partners are verified' },
                            { icon: Award, text: 'Quality service guaranteed' },
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
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
                        <p className="mt-2 text-slate-600">
                            Fill in your details to get started
                        </p>
                    </div>
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="appearance-none block w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

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
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="appearance-none block w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <PhoneInput
                                label="Phone Number"
                                value={formData.phone}
                                onChange={(phone) => setFormData({ ...formData, phone })}
                                placeholder="Enter phone number"
                                defaultCountryCode="+64"
                            />
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
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="appearance-none block w-full pl-12 pr-12 py-4 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="Create a strong password"
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
                                    Create Account <UserPlus className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <p className="mt-6 text-center text-xs text-slate-500">
                        By signing up, you agree to our{' '}
                        <a href="#" className="font-medium text-slate-700 hover:text-blue-600 underline">Terms</a> and{' '}
                        <a href="#" className="font-medium text-slate-700 hover:text-blue-600 underline">Privacy Policy</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
