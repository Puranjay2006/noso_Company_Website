import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Service } from '../types';
import { cartApi } from '../api/cart';
import { useAuthStore } from './useAuthStore';

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    addItem: (service: Service, quantity?: number) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    fetchCart: () => Promise<void>;
    toggleCart: () => void;

    // Getters
    totalItems: () => number;
    subtotal: () => number;
    isInCart: (serviceId: string) => boolean;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            isLoading: false,
            error: null,

            addItem: async (service: Service, quantity = 1) => {
                const { isAuthenticated, token } = useAuthStore.getState();
                let currentItems = get().items;

                // Get the correct service ID (handle both id and _id)
                const serviceId = service.id?.toString() || service._id?.toString();

                if (!serviceId) {
                    console.error("Service has no valid ID", service);
                    return;
                }

                // Only sync with backend if authenticated AND have a valid token
                const shouldSyncWithBackend = isAuthenticated && !!token;

                // If authenticated and have token, fetch fresh cart to ensure we have latest state
                if (shouldSyncWithBackend) {
                    try {
                        await get().fetchCart();
                        currentItems = get().items;
                    } catch (err) {
                        console.error("Failed to fetch cart before adding, using local state", err);
                        // Continue with local state, don't break the flow
                    }
                }

                // Check if item exists in current state
                const existingItemIndex = currentItems.findIndex(item =>
                    item.service_id?.toString() === serviceId
                );

                if (existingItemIndex > -1) {
                    // Item already exists, increment quantity
                    const updatedItems = [...currentItems];
                    updatedItems[existingItemIndex].quantity += quantity;
                    set({ items: updatedItems });

                    if (shouldSyncWithBackend) {
                        try {
                            // Update on backend
                            const existingItem = updatedItems[existingItemIndex];
                            await cartApi.update(existingItem.id, existingItem.quantity);
                        } catch (err) {
                            console.error("Failed to sync cart item update", err);
                        }
                    }
                } else {
                    // New item, add to cart
                    const newItem: CartItem = {
                        id: `temp-${Date.now()}-${Math.random()}`, // Unique temporary ID
                        user_id: 'guest',
                        service_id: serviceId,
                        service_title: service.title,
                        service_price: service.price,
                        service_image: service.image,
                        quantity,
                        created_at: new Date().toISOString()
                    };
                    set({ items: [...currentItems, newItem] });

                    if (shouldSyncWithBackend) {
                        try {
                            const savedItem = await cartApi.add(serviceId, quantity);
                            // Replace temp item with real one
                            const items = get().items.map(i =>
                                i.id === newItem.id ? { ...savedItem } : i
                            );
                            set({ items });
                        } catch (err) {
                            console.error("Failed to sync new cart item", err);
                            // Keep the temp item for local cart, don't remove on API error
                        }
                    }
                }
            },

            updateQuantity: async (itemId: string, quantity: number) => {
                const { isAuthenticated, token } = useAuthStore.getState();
                const shouldSyncWithBackend = isAuthenticated && !!token;
                const currentItems = get().items;
                const updatedItems = currentItems.map(item =>
                    item.id === itemId ? { ...item, quantity } : item
                );

                set({ items: updatedItems });

                if (shouldSyncWithBackend && !itemId.startsWith('temp-')) {
                    try {
                        await cartApi.update(itemId, quantity);
                    } catch (err) {
                        console.error("Failed to update cart quantity", err);
                    }
                }
            },

            removeItem: async (itemId: string) => {
                const { isAuthenticated, token } = useAuthStore.getState();
                const shouldSyncWithBackend = isAuthenticated && !!token;
                const currentItems = get().items;

                // Filter out the item
                const updatedItems = currentItems.filter(item => item.id !== itemId);
                set({ items: updatedItems });

                if (shouldSyncWithBackend && !itemId.startsWith('temp-')) {
                    try {
                        await cartApi.remove(itemId);
                        // After successful backend removal, fetch fresh cart to ensure sync
                        await get().fetchCart();
                    } catch (err) {
                        console.error("Failed to remove cart item", err);
                        // Don't revert - keep local state consistent
                    }
                }
            },

            clearCart: async () => {
                const { isAuthenticated, token } = useAuthStore.getState();
                const shouldSyncWithBackend = isAuthenticated && !!token;
                set({ items: [] });

                if (shouldSyncWithBackend) {
                    try {
                        await cartApi.clear();
                    } catch (err) {
                        console.error("Failed to clear cart", err);
                    }
                }
            },

            fetchCart: async () => {
                const { isAuthenticated } = useAuthStore.getState();
                if (!isAuthenticated) return;

                set({ isLoading: true });
                try {
                    const cartSummary = await cartApi.get();
                    set({ items: cartSummary.items, error: null });
                } catch (err) {
                    console.error("Failed to fetch cart", err);
                    set({ error: "Failed to load cart" });
                } finally {
                    set({ isLoading: false });
                }
            },

            toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

            totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: () => get().items.reduce((sum, item) => sum + (item.service_price || 0) * item.quantity, 0),
            isInCart: (serviceId: string) => {
                return get().items.some(item => item.service_id?.toString() === serviceId?.toString());
            },
        }),
        {
            name: 'cart-storage',
            partialize: (state) => ({ items: state.items }), // Only persist items
        }
    )
);
