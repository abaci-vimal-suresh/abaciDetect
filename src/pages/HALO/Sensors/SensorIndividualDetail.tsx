import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Breadcrumb, { BreadcrumbItem } from '../../../components/bootstrap/Breadcrumb';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import Spinner from '../../../components/bootstrap/Spinner';
import Modal, { ModalHeader, ModalTitle, ModalBody } from '../../../components/bootstrap/Modal';
import ThemeContext from '../../../contexts/themeContext';

import {
    useSensor,
    useSensorConfigurations,
    useLatestSensorLog,
    useUpdateSensor,
} from '../../../api/sensors.api';
import { isSensorOnline } from '../utils/sensorStatus.utils';

// Views
import SensorCardView from './components/SensorCardView';
import SensorDashboardView from './components/SensorDashboardView';
import SentinelDashboardView from './components/SentinelDashboardView';
import PersonnelModal from '../../../components/PersonnelModal';
import { useSensorActions } from './hooks/useSensorActions';

const SensorIndividualDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { data: sensor, isLoading, refetch } = useSensor(id || '');
    const { data: latestLog } = useLatestSensorLog(id || '', { refetchInterval: 15000 });
    const { data: configurations } = useSensorConfigurations(id || '');
    const { darkModeStatus } = useContext(ThemeContext);

    // Sensor Actions Hook
    const {
        isPersonnelModalOpen,
        setIsPersonnelModalOpen,
        isSavingPersonnel,
        handleSavePersonnel,
        isDeviceInfoModalOpen: isDeviceModalOpen,
        setIsDeviceInfoModalOpen: setIsDeviceModalOpen,
    } = useSensorActions(refetch);

    // View toggle
    const [currentView, setCurrentView] = useState<'cards' | 'dashboard' | 'sentinel'>('cards');



    if (isLoading) {
        return (
            <PageWrapper title='Sensor Details'>
                <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '400px' }}>
                    <Spinner color='primary' size='3rem' />
                </div>
            </PageWrapper>
        );
    }

    if (!sensor) {
        return (
            <PageWrapper title='Sensor Details'>
                <Page container='fluid'>
                    <div className='text-center py-5'>
                        <Icon icon='Error' className='display-1 text-danger mb-3' />
                        <h4>Sensor not found</h4>
                        <p className='text-muted'>The sensor you're looking for doesn't exist.</p>
                        <Button color='primary' tag='a' to='/halo/sensors/list'>
                            Back to Sensors
                        </Button>
                    </div>
                </Page>
            </PageWrapper>
        );
    }

    // Online status
    const sensorOnline = isSensorOnline(sensor.timestamp);
    const activeEvents =
        sensor.sensor_data?.active_events_list || (sensor as any).active_events_list || [];



    return (
        <PageWrapper title='Sensor Details'>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb>
                        <BreadcrumbItem to='/halo/sensors/list'>All Sensors</BreadcrumbItem>
                        <BreadcrumbItem to='#' isActive>{sensor.name}</BreadcrumbItem>
                    </Breadcrumb>
                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button
                        color={currentView === 'sentinel' ? 'primary' : 'secondary'}
                        isLight={currentView !== 'sentinel'}
                        icon={currentView === 'sentinel' ? 'Insights' : 'MonitorHeart'}
                        className='me-2'
                        onClick={() =>
                            setCurrentView(currentView === 'sentinel' ? 'cards' : 'sentinel')
                        }
                    >
                        {currentView === 'sentinel' ? 'Sentinel' : 'Standard'}
                    </Button>

                    <Badge color={sensorOnline ? 'success' : 'danger'} isLight className='me-2'>
                        <Icon icon='Circle' size='sm' className='me-1' />
                        {sensorOnline ? 'Online' : 'Offline'}
                    </Badge>

                    <Button
                        color='info'
                        isLight
                        icon='Info'
                        className='me-2'
                        onClick={() => setIsDeviceModalOpen(true)}
                    />

                    <Button
                        color='primary'
                        isLight
                        icon='Settings'
                        tag='a'
                        to={`/halo/sensors/settings/${id}`}
                    />
                </SubHeaderRight>
            </SubHeader>

            <Page container='fluid'>
                {currentView === 'sentinel' && (
                    <SentinelDashboardView
                        sensor={sensor}
                        latestLog={latestLog}
                        darkModeStatus={darkModeStatus}
                        configurations={configurations || []}
                    />
                )}
                {currentView === 'cards' && (
                    <SensorCardView
                        sensor={sensor}
                        latestLog={latestLog}
                        darkModeStatus={darkModeStatus}
                        configurations={configurations || []}
                    />
                )}

                {currentView === 'dashboard' && (
                    <SensorDashboardView
                        sensor={sensor}
                        latestLog={latestLog}
                        darkModeStatus={darkModeStatus}
                        configurations={configurations || []}
                    />
                )}

                <PersonnelModal
                    isOpen={isPersonnelModalOpen}
                    setIsOpen={setIsPersonnelModalOpen}
                    sensor={sensor}
                    onSave={(data) => handleSavePersonnel(sensor.id, data)}
                    isSaving={isSavingPersonnel}
                />

                <Modal
                    isOpen={isDeviceModalOpen}
                    setIsOpen={setIsDeviceModalOpen}
                    isCentered
                >
                    <ModalHeader setIsOpen={setIsDeviceModalOpen}>
                        <ModalTitle id='device-info-modal-title'>Device Information</ModalTitle>
                    </ModalHeader>
                    <ModalBody>
                        <div className='mb-2 d-flex justify-content-between'>
                            <span>Device Name</span>
                            <strong>{sensor.device_name || sensor.name}</strong>
                        </div>
                        <div className='mb-2 d-flex justify-content-between'>
                            <span>MAC Address</span>
                            <strong>{sensor.mac_address || 'N/A'}</strong>
                        </div>
                        <div className='mb-2 d-flex justify-content-between'>
                            <span>Firmware</span>
                            <strong>{sensor.firmware_version || 'N/A'}</strong>
                        </div>
                    </ModalBody>
                </Modal>
            </Page>
        </PageWrapper>
    );
};

export default SensorIndividualDetail;
