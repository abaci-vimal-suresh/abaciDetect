import React, { useState } from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import SubHeader, { SubHeaderLeft } from '../../layout/SubHeader/SubHeader';
import Breadcrumb from '../../components/bootstrap/Breadcrumb';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';
import classNames from 'classnames';
import AudioManagementSection from './sections/AudioManagement/AudioManagementSection';
import EmailSection from './sections/Email/EmailSection';

interface SettingsSection {
    id: string;
    label: string;
    icon: string;
    component: React.ComponentType;
}

const settingsSections: SettingsSection[] = [
    {
        id: 'audio',
        label: 'Audio Management',
        icon: 'VolumeUp',
        component: AudioManagementSection,
    },
    {
        id: 'email',
        label: 'Email Settings',
        icon: 'Email',
        component: EmailSection,
    }
];

const HaloSettings = () => {
    const [activeSection, setActiveSection] = useState<string>('audio');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const ActiveComponent = settingsSections.find((s) => s.id === activeSection)?.component;

    return (
        <PageWrapper title='HALO System Settings'>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb
                        list={[
                            { title: 'HALO', to: '/halo' },
                            { title: 'System Settings', to: '/halo/system-settings' },
                        ]}
                    />
                </SubHeaderLeft>
            </SubHeader>
            <Page container='fluid'>
                <div className='row g-4 align-items-stretch'>
                    {/* Sidebar Navigation */}
                    <div className={classNames('col-lg-3', { 'd-none d-lg-block': !isSidebarCollapsed })}>
                        <Card stretch className='h-100' style={{ zIndex: 0 }}>
                            <CardHeader>
                                <CardTitle>
                                    <div className='d-flex align-items-center justify-content-between'>
                                        <span>System Settings</span>
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
                            <Card>
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
                        {ActiveComponent && <ActiveComponent />}
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default HaloSettings;
