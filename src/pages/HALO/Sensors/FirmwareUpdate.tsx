import React from 'react';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardTitle } from '../../../components/bootstrap/Card';
import Badge from '../../../components/bootstrap/Badge';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';

const FirmwareUpdate = () => {
    return (
        <PageWrapper title='Firmware Management'>
            <SubHeader>
                <SubHeaderLeft>
                    <Icon icon='SystemUpdate' className='me-2 fs-4' />
                    <span className='h4 mb-0 fw-bold'>Firmware Updates</span>
                </SubHeaderLeft>
            </SubHeader>
            <Page container='fluid'>
                <div className='row g-4'>
                    <div className='col-12'>
                        <div className='alert alert-primary d-flex align-items-center'>
                            <Icon icon='NewReleases' size='2x' className='me-3' />
                            <div>
                                <h5 className='alert-heading'>New Firmware Available: v2.4.5</h5>
                                <p className='mb-0'>Critical security patches and enhanced vape detection algorithms. Released: Today.</p>
                            </div>
                            <Button color='light' className='ms-auto text-nowrap'>View Release Notes</Button>
                        </div>
                    </div>

                    <div className='col-12'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Device Status</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <div className='table-responsive'>
                                    <table className='table table-hover'>
                                        <thead>
                                            <tr>
                                                <th>Device Name</th>
                                                <th>Current Version</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>HALO-1001 (West Wing)</td>
                                                <td>v2.4.4</td>
                                                <td><Badge color='warning'>Outdated</Badge></td>
                                                <td><Button size='sm' color='primary'>Update Now</Button></td>
                                            </tr>
                                            <tr>
                                                <td>HALO-1002 (East Wing)</td>
                                                <td>v2.4.4</td>
                                                <td><Badge color='warning'>Outdated</Badge></td>
                                                <td><Button size='sm' color='primary'>Update Now</Button></td>
                                            </tr>
                                            <tr>
                                                <td>HALO-1003 (Cafeteria)</td>
                                                <td>v2.4.5</td>
                                                <td><Badge color='success'>Up to Date</Badge></td>
                                                <td><Button size='sm' color='light' isDisable>Re-install</Button></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default FirmwareUpdate;
