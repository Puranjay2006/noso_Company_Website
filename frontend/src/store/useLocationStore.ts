import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
    selectedLocation: string;
    setSelectedLocation: (locationId: string) => void;
    clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set) => ({
            selectedLocation: '',
            setSelectedLocation: (locationId: string) => set({ selectedLocation: locationId }),
            clearLocation: () => set({ selectedLocation: '' }),
        }),
        {
            name: 'location-storage', // Key in localStorage
        }
    )
);
