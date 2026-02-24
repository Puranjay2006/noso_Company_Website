import React, { useState, useRef, useEffect } from 'react';
import { Phone, ChevronDown, Search } from 'lucide-react';

// Common country codes with ISO codes for display
const COUNTRY_CODES = [
    { code: '+64', country: 'New Zealand', iso: 'NZ' },
    { code: '+61', country: 'Australia', iso: 'AU' },
    { code: '+1', country: 'United States', iso: 'US' },
    { code: '+44', country: 'United Kingdom', iso: 'GB' },
    { code: '+91', country: 'India', iso: 'IN' },
    { code: '+86', country: 'China', iso: 'CN' },
    { code: '+81', country: 'Japan', iso: 'JP' },
    { code: '+82', country: 'South Korea', iso: 'KR' },
    { code: '+65', country: 'Singapore', iso: 'SG' },
    { code: '+60', country: 'Malaysia', iso: 'MY' },
    { code: '+63', country: 'Philippines', iso: 'PH' },
    { code: '+66', country: 'Thailand', iso: 'TH' },
    { code: '+62', country: 'Indonesia', iso: 'ID' },
    { code: '+84', country: 'Vietnam', iso: 'VN' },
    { code: '+852', country: 'Hong Kong', iso: 'HK' },
    { code: '+886', country: 'Taiwan', iso: 'TW' },
    { code: '+49', country: 'Germany', iso: 'DE' },
    { code: '+33', country: 'France', iso: 'FR' },
    { code: '+39', country: 'Italy', iso: 'IT' },
    { code: '+34', country: 'Spain', iso: 'ES' },
    { code: '+31', country: 'Netherlands', iso: 'NL' },
    { code: '+41', country: 'Switzerland', iso: 'CH' },
    { code: '+46', country: 'Sweden', iso: 'SE' },
    { code: '+47', country: 'Norway', iso: 'NO' },
    { code: '+45', country: 'Denmark', iso: 'DK' },
    { code: '+358', country: 'Finland', iso: 'FI' },
    { code: '+353', country: 'Ireland', iso: 'IE' },
    { code: '+43', country: 'Austria', iso: 'AT' },
    { code: '+32', country: 'Belgium', iso: 'BE' },
    { code: '+48', country: 'Poland', iso: 'PL' },
    { code: '+7', country: 'Russia', iso: 'RU' },
    { code: '+55', country: 'Brazil', iso: 'BR' },
    { code: '+52', country: 'Mexico', iso: 'MX' },
    { code: '+54', country: 'Argentina', iso: 'AR' },
    { code: '+56', country: 'Chile', iso: 'CL' },
    { code: '+57', country: 'Colombia', iso: 'CO' },
    { code: '+27', country: 'South Africa', iso: 'ZA' },
    { code: '+234', country: 'Nigeria', iso: 'NG' },
    { code: '+20', country: 'Egypt', iso: 'EG' },
    { code: '+971', country: 'UAE', iso: 'AE' },
    { code: '+966', country: 'Saudi Arabia', iso: 'SA' },
    { code: '+972', country: 'Israel', iso: 'IL' },
    { code: '+90', country: 'Turkey', iso: 'TR' },
    { code: '+92', country: 'Pakistan', iso: 'PK' },
    { code: '+880', country: 'Bangladesh', iso: 'BD' },
    { code: '+94', country: 'Sri Lanka', iso: 'LK' },
    { code: '+977', country: 'Nepal', iso: 'NP' },
    { code: '+679', country: 'Fiji', iso: 'FJ' },
    { code: '+675', country: 'Papua New Guinea', iso: 'PG' },
    { code: '+685', country: 'Samoa', iso: 'WS' },
    { code: '+676', country: 'Tonga', iso: 'TO' },
];

interface PhoneInputProps {
    value: string;
    onChange: (fullPhone: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    defaultCountryCode?: string;
    label?: string;
    error?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChange,
    placeholder = 'Enter phone number',
    required = false,
    disabled = false,
    className = '',
    defaultCountryCode = '+64', // Default to New Zealand
    label,
    error,
}) => {
    // Parse initial value to extract country code and number
    const parsePhoneValue = (phone: string) => {
        if (!phone) return { countryCode: defaultCountryCode, number: '' };
        
        // Try to match known country codes
        for (const country of COUNTRY_CODES) {
            if (phone.startsWith(country.code)) {
                return {
                    countryCode: country.code,
                    number: phone.slice(country.code.length).trim()
                };
            }
        }
        
        // If starts with +, try to extract code
        if (phone.startsWith('+')) {
            const match = phone.match(/^(\+\d{1,4})\s*(.*)$/);
            if (match) {
                return { countryCode: match[1], number: match[2] };
            }
        }
        
        return { countryCode: defaultCountryCode, number: phone.replace(/^\+/, '') };
    };

    const parsed = parsePhoneValue(value);
    const [selectedCountry, setSelectedCountry] = useState(
        COUNTRY_CODES.find(c => c.code === parsed.countryCode) || COUNTRY_CODES[0]
    );
    const [phoneNumber, setPhoneNumber] = useState(parsed.number);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isInternalChange = useRef(false);

    // Filter countries based on search
    const filteredCountries = COUNTRY_CODES.filter(country =>
        country.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.includes(searchQuery) ||
        country.iso.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isDropdownOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isDropdownOpen]);

    // Notify parent of changes (only when user makes changes)
    const notifyChange = (country: typeof COUNTRY_CODES[0], number: string) => {
        isInternalChange.current = true;
        const fullPhone = number ? `${country.code}${number.replace(/^0+/, '')}` : '';
        onChange(fullPhone);
        // Reset flag after a brief delay
        setTimeout(() => {
            isInternalChange.current = false;
        }, 100);
    };

    const handleCountrySelect = (country: typeof COUNTRY_CODES[0]) => {
        setSelectedCountry(country);
        setIsDropdownOpen(false);
        setSearchQuery('');
        notifyChange(country, phoneNumber);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only digits, spaces, and dashes
        const cleaned = e.target.value.replace(/[^\d\s-]/g, '');
        setPhoneNumber(cleaned);
        notifyChange(selectedCountry, cleaned);
    };

    const formatPhoneDisplay = (number: string) => {
        // Basic formatting for display (could be enhanced per country)
        const digits = number.replace(/\D/g, '');
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            
            <div className={`
                flex items-center border rounded-xl overflow-hidden transition-all
                ${error 
                    ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-500/50 focus-within:border-red-500' 
                    : 'border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500'
                }
                ${disabled ? 'bg-slate-50 opacity-75' : 'bg-white'}
            `}>
                {/* Country Code Selector */}
                <button
                    type="button"
                    onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
                    disabled={disabled}
                    className={`
                        flex items-center gap-2 px-3 py-4 bg-slate-50 border-r border-slate-200 
                        hover:bg-slate-100 transition-colors min-w-[90px]
                        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{selectedCountry.iso}</span>
                    <span className="text-sm font-medium text-slate-700">{selectedCountry.code}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Phone Number Input */}
                <div className="flex-1 flex items-center">
                    <Phone className="h-5 w-5 text-slate-400 ml-3" />
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled}
                        className="
                            flex-1 px-3 py-4 bg-transparent text-slate-900 placeholder-slate-400
                            focus:outline-none
                        "
                    />
                </div>
            </div>

            {/* Country Dropdown */}
            {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search country..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>

                    {/* Country List */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                                <button
                                    key={country.iso}
                                    type="button"
                                    onClick={() => handleCountrySelect(country)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left
                                        ${selectedCountry.iso === country.iso ? 'bg-blue-50' : ''}
                                    `}
                                >
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded min-w-[28px] text-center">{country.iso}</span>
                                    <span className="flex-1 text-sm text-slate-700">{country.country}</span>
                                    <span className="text-sm font-medium text-slate-500">{country.code}</span>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-slate-500 text-sm">
                                No countries found
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}

            {/* Helper Text */}
            <p className="mt-1.5 text-xs text-slate-500">
                Full number: {selectedCountry.code} {formatPhoneDisplay(phoneNumber) || '...'}
            </p>
        </div>
    );
};

export default PhoneInput;
