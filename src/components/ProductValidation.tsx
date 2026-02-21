import React, { FC, ReactNode } from 'react';
import { useSystemConfig } from '../api/system.api';
import AbaciLoader from './AbaciLoader/AbaciLoader';
import ActivationPage from '../pages/Auth/ActivationPage';
import SuperAdminPage from '../pages/Auth/SuperAdminPage';
import ConfigErrorPage from '../pages/Auth/ConfigErrorPage';

interface ProductValidationProps {
    children: ReactNode;
}

const ProductValidation: FC<ProductValidationProps> = ({ children }) => {
    const { data: config, isLoading, isError } = useSystemConfig();

    if (isLoading) {
        return <AbaciLoader />;
    }

    if (isError || !config) {
        return <ConfigErrorPage />;
    }

    if (!config.is_activated) {
        return <ActivationPage />;
    }

    if (!config.is_firstuser_created) {
        return <SuperAdminPage />;
    }

    return <>{children}</>;
};

export default ProductValidation;
