import React from 'react';
import { useNavigate } from 'react-router-dom';
import Page from '../../layout/Page/Page';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Card, { CardBody } from '../bootstrap/Card';
import Icon from '../icon/Icon';
import Button from '../bootstrap/Button';

interface UnderConstructionPageProps {
    title: string;
    description?: string;
    icon?: string;
}

const UnderConstructionPage: React.FC<UnderConstructionPageProps> = ({
    title,
    description = "We are currently working hard to bring this feature to life. Please check back soon for updates.",
    icon = 'Construction'
}) => {
    const navigate = useNavigate();

    return (
        <PageWrapper title={title}>
            <Page container='fluid'>
                <div className='row d-flex align-items-center justify-content-center' style={{ minHeight: '70vh' }}>
                    <div className='col-md-8 col-lg-6 text-center'>
                        <Card className='shadow-lg border-0'>
                            <CardBody className='p-5'>
                                <div className='mb-4 text-primary display-1'>
                                    <Icon icon={icon} size='5x' />
                                </div>
                                <h2 className='fw-bold mb-3'>{title}</h2>
                                <h4 className='text-muted mb-4'>Feature Under Development</h4>
                                <p className='lead text-muted mb-4'>
                                    {description}
                                </p>
                                <div className='d-flex justify-content-center'>
                                    <Button color='primary' icon='Dashboard' onClick={() => navigate('/halo/dashboard')}>
                                        Return to Dashboard
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default UnderConstructionPage;
