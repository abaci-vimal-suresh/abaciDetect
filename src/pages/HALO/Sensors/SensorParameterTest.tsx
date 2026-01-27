import React from 'react';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import Icon from '../../../components/icon/Icon';
import SensorParameterCard from './components/SensorParameterCard';

const SensorParameterTest = () => {
    return (
        <PageWrapper title='Sensor Card Gallery'>
            <SubHeader>
                <SubHeaderLeft>
                    <Icon icon='Dashboard' className='me-2 fs-4' />
                    <span className='h4 mb-0 fw-bold'>Sensor Parameter Card Gallery</span>
                </SubHeaderLeft>
            </SubHeader>

            <Page container='fluid'>
                <div className='row g-4'>
                    <div className='col-auto'>
                        <SensorParameterCard
                            label="Temperature"
                            value={24.5}
                            unit="°C"
                            min={18}
                            max={30}
                            threshold={26}
                            status="safe"
                            icon="DeviceThermostat"
                        />
                    </div>

                    <div className='col-auto'>
                        <SensorParameterCard
                            label="Humidity"
                            value={65.2}
                            unit="%"
                            min={30}
                            max={80}
                            threshold={60}
                            status="warning"
                            icon="WaterDrop"
                        />
                    </div>

                    <div className='col-auto'>
                        <SensorParameterCard
                            label="CO2 Level"
                            value={1250}
                            unit="ppm"
                            min={400}
                            max={2000}
                            threshold={1000}
                            status="critical"
                            icon="Co2"
                        />
                    </div>

                    <div className='col-auto'>
                        <SensorParameterCard
                            label="Air Quality"
                            value={45}
                            unit="AQI"
                            min={0}
                            max={300}
                            threshold={100}
                            status="safe"
                            icon="Air"
                        />
                    </div>

                    <div className='col-auto'>
                        <SensorParameterCard
                            label="Noise Level"
                            value={78.5}
                            unit="dB"
                            min={30}
                            max={120}
                            threshold={70}
                            status="warning"
                            icon="VolumeUp"
                        />
                    </div>
                </div>

                <div className='mt-5 p-4 bg-dark bg-opacity-10 rounded-4 border border-info border-opacity-25'>
                    <h5 className='text-info mb-3'>
                        <Icon icon="TipsAndUpdates" className="me-2" />
                        Card Interaction Guide
                    </h5>
                    <ul className='mb-0'>
                        <li><strong>Standard View:</strong> Displays the current value, parameter name, and a status badge with a rotating status-colored light.</li>
                        <li><strong>Threshold Indicator:</strong> The status dot in the badge pulses/glows if the threshold is reached.</li>
                        <li><strong>Hover Reveal (Flip):</strong> Hover over any card to reveal detailed range information, min/max values, and a gradient progress bar.</li>
                    </ul>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default SensorParameterTest;
