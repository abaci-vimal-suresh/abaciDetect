import React, { FC, ReactNode } from 'react';
import { useSystemConfig } from '../api/system.api';
import AbaciLoader from './AbaciLoader/AbaciLoader';
import ActivationPage from '../pages/Auth/ActivationPage';
import SuperAdminPage from '../pages/Auth/SuperAdminPage';

interface ProductValidationProps {
    children: ReactNode;
}

const ProductValidation: FC<ProductValidationProps> = ({ children }) => {
    const { data: config, isLoading, isError } = useSystemConfig();

    if (isLoading) {
        return <AbaciLoader />;
    }

    if (isError || !config) {
        return <div>Error loading system configuration. Please contact support.</div>;
    }

    // 1. Activation Check
    if (!config.is_activated) {
        return <ActivationPage />;
    }

    // 2. Superuser Existence Check
    // if (!config.is_firstuser_created) {
    //     return <SuperAdminPage />;
    // }

    // All checks passed
    return <>{children}</>;
};

export default ProductValidation;
