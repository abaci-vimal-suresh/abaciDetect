import React from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import { Link } from 'react-router-dom';
import Button from '../../components/bootstrap/Button';

const ErrorPage = () => {
    return (
        <PageWrapper title='404 - Page Not Found'>
            <Page>
                <div className='row h-100 align-items-center justify-content-center'>
                    <div className='col-12 text-center'>
                        <h1 className='display-1 fw-bold'>404</h1>
                        <h2 className='mb-4'>Oops! Page Not Found</h2>
                        <p className='text-muted mb-5'>The page you are looking for might have been removed or is temporarily unavailable.</p>
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

export default ErrorPage;
