import React, { useState } from 'react';
import MainLayout from '../../layout/MainLayout';
import {
    Briefcase,
    DollarSign,
    Calendar,
    TrendingUp,
    CheckCircle,
    Shield,
    Users,
    Loader2,
    AlertCircle
} from 'lucide-react';
import apiClient from '../../api/client';
import { useNavigate } from 'react-router-dom';
import NZAddressAutocomplete from '../../components/NZAddressAutocomplete';
import { PhoneInput } from '../../components/PhoneInput';

const PartnerRegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        business_type: '',
        experience_years: '',
        description: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await apiClient.post('/auth/register/partner', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                address: formData.address,
                business_type: formData.business_type,
                experience: formData.experience_years,
                service_area: formData.description || formData.address,
                role: 'partner'
            });
            setSuccess(true);
        } catch (err: any) {
            console.error('Partner registration error:', err);
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <MainLayout>
                <div className="min-h-[80vh] flex items-center justify-center bg-white px-4">
                    <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                            Registration Submitted!
                        </h1>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Thank you for your interest in becoming a partner with noso company.
                            Your application has been received and is pending admin approval.
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-left">
                                    <h3 className="font-bold text-amber-900 mb-1">What's Next?</h3>
                                    <p className="text-sm text-amber-700">
                                        Our admin team will review your application within 24-48 hours.
                                        You'll receive an email notification once your account has been approved.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/')}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/25"
                            >
                                Back to Home
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-8 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                            >
                                Go to Login
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
                {/* Hero Section - Dark Theme */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
                    <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
                        <div className="text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-green-400 font-semibold text-sm mb-6">
                                <Briefcase className="w-4 h-4 mr-2" />
                                Partner Program
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
                                Grow Your Business <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                                    With noso company
                                </span>
                            </h1>
                            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
                                Join our network of trusted service partners and unlock new opportunities.
                                Get access to customers, flexible scheduling, and reliable income.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="py-16 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                                Why Partner With Us?
                            </h2>
                            <p className="text-lg text-slate-600">
                                Discover the benefits of joining our growing partner network
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    icon: DollarSign,
                                    title: "Competitive Earnings",
                                    desc: "Earn top-tier rates for your services with transparent pricing"
                                },
                                {
                                    icon: Calendar,
                                    title: "Flexible Schedule",
                                    desc: "Choose jobs that fit your availability and location"
                                },
                                {
                                    icon: Users,
                                    title: "Steady Customers",
                                    desc: "Access to our large customer base seeking quality services"
                                },
                                {
                                    icon: TrendingUp,
                                    title: "Grow Your Business",
                                    desc: "Build your reputation and expand your service offerings"
                                }
                            ].map((benefit, idx) => (
                                <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all hover:-translate-y-1">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                                        <benefit.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        {benefit.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Registration Form Section */}
                <div className="py-20 bg-white">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                                Ready to Get Started?
                            </h2>
                            <p className="text-lg text-slate-600">
                                Fill out the form below to apply as a service partner
                            </p>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-12">
                            {error && (
                                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-900 mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-900 mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-900 mb-2">
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            minLength={6}
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>

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

                                    <div>
                                        <label className="block text-sm font-bold text-slate-900 mb-2">
                                            Business Type *
                                        </label>
                                        <select
                                            name="business_type"
                                            required
                                            value={formData.business_type}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        >
                                            <option value="">Select Business Type</option>
                                            <option value="cleaning">Cleaning Services</option>
                                            <option value="plumbing">Plumbing</option>
                                            <option value="electrical">Electrical</option>
                                            <option value="carpentry">Carpentry</option>
                                            <option value="painting">Painting</option>
                                            <option value="landscaping">Landscaping</option>
                                            <option value="general_maintenance">General Maintenance</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-900 mb-2">
                                            Years of Experience *
                                        </label>
                                        <input
                                            type="number"
                                            name="experience_years"
                                            required
                                            min="0"
                                            value={formData.experience_years}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="5"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-2">
                                        Service Address *
                                    </label>
                                    <NZAddressAutocomplete
                                        value={formData.address}
                                        onChange={(address) => setFormData(prev => ({ ...prev, address }))}
                                        placeholder="Start typing your New Zealand address..."
                                        required
                                        inputClassName="bg-slate-50 rounded-xl py-3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-2">
                                        Tell Us About Your Services
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        placeholder="Describe your services, specialties, and what makes you stand out..."
                                    />
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-green-900 mb-1">
                                                Application Review Process
                                            </h4>
                                            <p className="text-xs text-green-700">
                                                Your application will be reviewed by our admin team within 24-48 hours.
                                                We verify all partners to ensure quality and safety for our customers.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl hover:from-green-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Submitting Application...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Submit Partner Application
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-center text-slate-500">
                                    By submitting this application, you agree to our Terms of Service and Privacy Policy
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default PartnerRegistrationPage;
