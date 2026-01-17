import React from 'react';
import Page from '../../layout/Page/Page';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';

interface IUnderConstructionPageProps {
    title?: string;
    icon?: string;
    description?: string;
}

const UnderConstructionPage: React.FC<IUnderConstructionPageProps> = ({ title, icon, description }) => {
    return (
        <PageWrapper>
            <Page>
                <div className='display-1 d-flex flex-column justify-content-center align-items-center text-center' style={{ height: '70vh' }}>
                    {icon && <div className='mb-4'><i className={`icon-${icon}`} style={{ fontSize: '4rem' }}></i></div>}
                    <div>{title || 'Under Construction'}</div>
                    {description && <div className='h4 text-muted mt-3'>{description}</div>}
                </div>
            </Page>
        </PageWrapper>
    );
};

export default UnderConstructionPage;
