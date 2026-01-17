import React from 'react';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardTitle } from '../../../components/bootstrap/Card';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import Label from '../../../components/bootstrap/forms/Label';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';

const HaloSettings = () => {
    return (
        <PageWrapper title='System Settings'>
            <SubHeader>
                <SubHeaderLeft>
                    <Icon icon='Settings' className='me-2 fs-4' />
                    <span className='h4 mb-0 fw-bold'>HALO System Configuration</span>
                </SubHeaderLeft>
            </SubHeader>
            <Page container='fluid'>
                <div className='row g-4'>
                    <div className='col-lg-6'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Data Retention Policy</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <FormGroup className='mb-3'>
                                    <Label htmlFor='alertRetention'>Alert History Retention (Days)</Label>
                                    <Input type='number' id='alertRetention' defaultValue='90' />
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <Label htmlFor='sensorDataRetention'>Sensor Data Retention (Days)</Label>
                                    <Input type='number' id='sensorDataRetention' defaultValue='30' />
                                </FormGroup>
                                <div className='form-check form-switch'>
                                    <input className='form-check-input' type='checkbox' id='autoArchive' defaultChecked />
                                    <label className='form-check-label' htmlFor='autoArchive'>Auto-archive old records to cold storage</label>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <div className='col-lg-6'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Integration API</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <FormGroup className='mb-3'>
                                    <Label>API Endpoint</Label>
                                    <Input value='https://api.halo-iot.cloud/v1/webhook' readOnly />
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <Label>API Key</Label>
                                    <div className='input-group'>
                                        <Input value='sk_live_51M...xYz' readOnly type='password' />
                                        <Button color='light' icon='ContentCopy'>Copy</Button>
                                    </div>
                                </FormGroup>
                                <Button color='info' isLight icon='Refresh'>Regenerate Keys</Button>
                            </CardBody>
                        </Card>
                    </div>

                    <div className='col-12'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Backup & Restore</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <p className='text-muted'>Last backup created: <strong>Today at 02:00 AM</strong> (Size: 45MB)</p>
                                <div className='d-flex gap-2'>
                                    <Button color='primary' icon='CloudDownload'>Download Backup</Button>
                                    <Button color='warning' icon='CloudUpload' isLight>Restore from File</Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default HaloSettings;
