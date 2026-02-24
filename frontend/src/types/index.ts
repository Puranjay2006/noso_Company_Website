export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'partner' | 'customer';
    phone?: string;
    address?: string;
    is_active: boolean;
    business_type?: string; // For partners
    availability?: boolean; // For partners
}

export interface Service {
    id: string;
    _id?: string; // MongoDB ObjectId (backend sometimes sends this)
    title: string;
    description: string;
    price: number;
    category_id: string;
    category_name?: string;
    tags: string[];
    image?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface Booking {
    id: string;
    service_id: string;
    customer_id: string;
    booking_date: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    total_price: number;
}

export interface CartItem {
    id: string;
    user_id: string;
    service_id: string;
    service_title?: string;
    service_price?: number;
    service_image?: string;
    quantity: number;
    created_at: string;
}

export interface CartSummary {
    items: CartItem[];
    total_items: number;
    subtotal: number;
    total: number;
}
