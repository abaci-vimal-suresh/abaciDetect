import React from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import { Link } from 'react-router-dom';
import Button from '../../components/bootstrap/Button';

const Unauthorized = () => {
    return (
        <PageWrapper title='403 - Unauthorized'>
            <Page>
                <div className='row h-100 align-items-center justify-content-center'>
                    <div className='col-12 text-center'>
                        <h1 className='display-1 fw-bold'>403</h1>
                        <h2 className='mb-4'>Access Denied</h2>
                        <p className='text-muted mb-5'>You do not have permission to access this page.</p>
                        <Link to='/'>
                            <Button color='primary' isLight>
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default Unauthorized;
