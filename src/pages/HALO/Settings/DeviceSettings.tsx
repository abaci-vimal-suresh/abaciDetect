import React, { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Breadcrumb, { BreadcrumbItem } from '../../../components/bootstrap/Breadcrumb';
import Card, { CardBody, CardHeader, CardTitle } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Spinner from '../../../components/bootstrap/Spinner';
import classNames from 'classnames';
import { useSensor } from '../../../api/sensors.api';
import ThemeContext from '../../../contexts/themeContext';
import DeviceConfigSection from './sections/DeviceConfig/DeviceConfigSection';
import ThresholdManagement from './sections/Threshold/ThresholdManagement';


interface SettingsSection {
    id: string;
    label: string;
    icon: string;
    component: React.ComponentType<{ deviceId: string }>;
}

const settingsSections: SettingsSection[] = [
    {
        id: 'device',
        label: 'Device Configuration',
        icon: 'Settings',
        component: DeviceConfigSection,
    },
    {
        id: 'thresholds',
        label: 'Thresholds & Configuration',
        icon: 'Speed',
        component: ThresholdManagement
    }
];

const DeviceSettings = () => {
    const { deviceId } = useParams<{ deviceId: string }>();

    const { data: sensor, isLoading } = useSensor(deviceId || '');

    const [activeSection, setActiveSection] = useState<string>('device');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const ActiveComponent = settingsSections.find((s) => s.id === activeSection)?.component;


    if (isLoading) {
        return (
            <PageWrapper title='Device Settings'>
                <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '400px' }}>
                    <Spinner color='primary' size='3rem' />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title={`Settings - ${sensor?.name || 'Device'}`}>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb>
                        <BreadcrumbItem to='/halo/sensors/list'>Sensors</BreadcrumbItem>
                        <BreadcrumbItem to={`/halo/sensors/detail/${deviceId}`}>
                            {sensor?.name || 'Device'}
                        </BreadcrumbItem>
                        <BreadcrumbItem to="#" isActive>Settings</BreadcrumbItem>
                    </Breadcrumb>
                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button
                        // color='light'
                        icon='ChevronLeft'
                        tag='a'
                        to={`/halo/sensors/detail/${deviceId}`}
                    >
                        Back to Device
                    </Button>
                </SubHeaderRight>
            </SubHeader>

            <Page container='fluid'>
                <div className='row g-4 align-items-stretch'>
                    {/* Sidebar Navigation */}
                    <div className={classNames('col-lg-3', { 'd-none d-lg-block': !isSidebarCollapsed })}>
                        <Card stretch className='h-100' style={{ zIndex: 0 }}>
                            <CardHeader>
                                <CardTitle>
                                    <div className='d-flex align-items-center justify-content-between'>
                                        <span>Settings</span>
                                        <Button
                                            color='link'
                                            size='sm'
                                            icon={isSidebarCollapsed ? 'MenuOpen' : 'Menu'}
                                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                            className='d-lg-none'
                                        />
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardBody className='p-0'>
                                <div className='list-group list-group-flush'>
                                    {settingsSections.map((section) => (
                                        <button
                                            key={section.id}
                                            type='button'
                                            className={classNames(
                                                'list-group-item list-group-item-action d-flex align-items-center',
                                                {
                                                    active: activeSection === section.id,
                                                }
                                            )}
                                            onClick={() => setActiveSection(section.id)}
                                        >
                                            <Icon icon={section.icon} className='me-2' />
                                            <span>{section.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className='col-lg-9 d-flex flex-column'>
                        {/* Mobile Section Selector */}
                        <div className='d-lg-none mb-3'>
                            <Card className='settings-card'>
                                <CardBody>
                                    <select
                                        className='form-select'
                                        value={activeSection}
                                        onChange={(e) => setActiveSection(e.target.value)}
                                    >
                                        {settingsSections.map((section) => (
                                            <option key={section.id} value={section.id}>
                                                {section.label}
                                            </option>
                                        ))}
                                    </select>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Active Section Content */}
                        {ActiveComponent && <ActiveComponent deviceId={deviceId || ''} />}
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default DeviceSettings;