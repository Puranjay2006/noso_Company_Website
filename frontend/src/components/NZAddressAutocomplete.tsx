import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

interface AddressSuggestion {
    full_address: string;
    address_number?: string;
    street_name?: string;
    suburb?: string;
    city?: string;
    postcode?: string;
    region?: string;
    lat?: number;
    lon?: number;
}

interface NZAddressAutocompleteProps {
    value: string;
    onChange: (address: string, details?: AddressSuggestion) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    required?: boolean;
    disabled?: boolean;
    name?: string;
    id?: string;
}

// NZ Address API using OpenStreetMap Nominatim (free, no API key required)
// For production, consider using NZ Post Address Finder or Google Places
const NZAddressAutocomplete: React.FC<NZAddressAutocompleteProps> = ({
    value,
    onChange,
    placeholder = "Start typing your address...",
    className = "",
    inputClassName = "",
    required = false,
    disabled = false,
    name = "address",
    id = "address"
}) => {
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Update input value when external value changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchAddresses = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Use Nominatim for NZ addresses (free, rate-limited)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` + 
                `format=json&` +
                `q=${encodeURIComponent(query)}&` +
                `countrycodes=nz&` +
                `addressdetails=1&` +
                `limit=8`,
                {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'NosoCompanyWebsite/1.0'
                    }
                }
            );
            
            const data = await response.json();
            
            const formattedSuggestions: AddressSuggestion[] = data.map((item: any) => ({
                full_address: item.display_name,
                address_number: item.address?.house_number || '',
                street_name: item.address?.road || '',
                suburb: item.address?.suburb || item.address?.neighbourhood || '',
                city: item.address?.city || item.address?.town || item.address?.village || '',
                postcode: item.address?.postcode || '',
                region: item.address?.state || item.address?.county || '',
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon)
            }));

            setSuggestions(formattedSuggestions);
            setIsOpen(formattedSuggestions.length > 0);
        } catch (error) {
            console.error('Address search error:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);

        // Debounce the search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            searchAddresses(newValue);
        }, 300);
    };

    const handleSelectAddress = (suggestion: AddressSuggestion) => {
        // Format a cleaner NZ address
        const parts = [];
        if (suggestion.address_number && suggestion.street_name) {
            parts.push(`${suggestion.address_number} ${suggestion.street_name}`);
        } else if (suggestion.street_name) {
            parts.push(suggestion.street_name);
        }
        if (suggestion.suburb) parts.push(suggestion.suburb);
        if (suggestion.city) parts.push(suggestion.city);
        if (suggestion.postcode) parts.push(suggestion.postcode);
        
        const cleanAddress = parts.length > 0 ? parts.join(', ') : suggestion.full_address;
        
        setInputValue(cleanAddress);
        onChange(cleanAddress, suggestion);
        setIsOpen(false);
        setSuggestions([]);
    };

    const clearInput = () => {
        setInputValue('');
        onChange('');
        setSuggestions([]);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    id={id}
                    name={name}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    autoComplete="off"
                    className={`w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                        transition-all disabled:opacity-50 disabled:cursor-not-allowed ${inputClassName}`}
                />
                {isLoading ? (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
                ) : inputValue && (
                    <button
                        type="button"
                        onClick={clearInput}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelectAddress(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-start gap-3 border-b border-slate-100 last:border-b-0"
                        >
                            <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="font-medium text-slate-900 truncate">
                                    {suggestion.address_number && suggestion.street_name 
                                        ? `${suggestion.address_number} ${suggestion.street_name}`
                                        : suggestion.street_name || suggestion.suburb || suggestion.city
                                    }
                                </p>
                                <p className="text-sm text-slate-500 truncate">
                                    {[suggestion.suburb, suggestion.city, suggestion.region]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results message */}
            {isOpen && suggestions.length === 0 && inputValue.length >= 3 && !isLoading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4 text-center">
                    <p className="text-slate-500 text-sm">No addresses found. Try a different search.</p>
                </div>
            )}
        </div>
    );
};

export default NZAddressAutocomplete;
