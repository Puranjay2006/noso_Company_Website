import React, { useState } from 'react';
import MainLayout from '../../layout/MainLayout';
import { 
    Mail, MapPin, Send, CheckCircle, Loader2, 
    MessageSquare, Clock, Shield, ArrowRight, Info
} from 'lucide-react';
import apiClient from '../../api/client';
import { PhoneInput } from '../../components/PhoneInput';

const ContactPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await apiClient.post('/contact/submit', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
                message: formData.message
            });

            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            Message Sent!
                        </h1>
                        
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 mb-8">
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Thank you for reaching out to <span className="font-bold text-slate-900">noso company</span>. 
                                We've received your message and will respond as soon as possible.
                            </p>
                            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-sm text-blue-700">
                                    <strong>What's next?</strong> Our team will review your inquiry and respond to your email 
                                    at <span className="font-semibold">{formData.email}</span> within 24-48 business hours.
                                </p>
                            </div>
                        </div>

                        <a
                            href="/"
                            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all"
                        >
                            Back to Homepage
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </a>
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
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/15 rounded-full blur-[100px]" />

                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white/90 font-semibold text-sm mb-6 backdrop-blur-sm border border-white/20">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Get in Touch
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                            Contact
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-cyan-400">
                                noso company
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            Have questions or need assistance? We're here to help. 
                            Reach out to us and we'll respond as quickly as possible.
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                        <Mail className="w-6 h-6 text-blue-600" />
                                        Send Us a Message
                                    </h2>

                                    <div className="space-y-5">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Your Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="John Doe"
                                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Email Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="your.email@example.com"
                                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>

                                        {/* Phone (Optional) */}
                                        <div>
                                            <PhoneInput
                                                label="Phone Number"
                                                value={formData.phone}
                                                onChange={(phone) => setFormData({ ...formData, phone })}
                                                placeholder="Enter phone number"
                                                defaultCountryCode="+64"
                                            />
                                            <p className="text-xs text-slate-400 mt-1">Optional</p>
                                        </div>

                                        {/* Message */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Your Message <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="message"
                                                value={formData.message}
                                                onChange={handleInputChange}
                                                required
                                                rows={6}
                                                placeholder="How can we help you? Please describe your inquiry..."
                                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="mt-6 w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Contact Info Sidebar */}
                        <div className="space-y-6">
                            {/* Contact Details Card */}
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
                                <h3 className="text-xl font-bold text-slate-900 mb-6">Contact Information</h3>
                                
                                <div className="space-y-5">
                                    {/* Email */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Email</p>
                                            <a 
                                                href="mailto:naveen@nosocompany.com" 
                                                className="text-slate-900 font-medium hover:text-blue-600 transition-colors"
                                            >
                                                naveen@nosocompany.com
                                            </a>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-6 h-6 text-teal-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Location</p>
                                            <p className="text-slate-900 font-medium">Auckland, New Zealand</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Areas Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-3xl p-6 border border-blue-100">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                        <Info className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-2">Service Areas</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            We're currently serving the <strong>North Island of New Zealand</strong>, 
                                            with a focus on Auckland and surrounding areas. 
                                            South Island locations coming soon!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Response Time Card */}
                            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Response Time</h4>
                                        <p className="text-sm text-slate-500">Within 24-48 hours</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600">
                                    We aim to respond to all inquiries within 24-48 business hours. 
                                    For urgent matters, please mention it in your message.
                                </p>
                            </div>

                            {/* Trust Badge */}
                            <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Your Privacy Matters</h4>
                                        <p className="text-sm text-slate-500">100% Secure</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Your information is safe with us. We never share your details with third parties.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ContactPage;
