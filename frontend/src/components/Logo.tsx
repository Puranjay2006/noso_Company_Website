import React from 'react';
import logoImage from '../assets/logo.png';

interface LogoProps {
    className?: string;
    showText?: boolean;
    animated?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'white';
}

export const Logo: React.FC<LogoProps> = ({ className = "", animated = true, size = 'md' }) => {
    // Size configurations for the full logo image
    const sizeConfig = {
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-12',
        xl: 'h-14',
    };

    const height = sizeConfig[size];

    return (
        <div className={`flex items-center group cursor-pointer select-none ${className}`}>
            <div className={`relative flex items-center justify-center ${animated ? 'transition-all duration-300 group-hover:scale-105' : ''}`}>
                <img 
                    src={logoImage} 
                    alt="noso company" 
                    className={`${height} w-auto object-contain`}
                />
            </div>
        </div>
    );
};

export default Logo;
