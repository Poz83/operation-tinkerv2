import React from 'react';
import logoImage from '../assets/myjoe_logo.png';

interface BrandLogoProps {
    className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className }) => {
    return (
        <img
            src={logoImage}
            alt="myjoe"
            className={`${className} object-contain`}
        />
    );
};
