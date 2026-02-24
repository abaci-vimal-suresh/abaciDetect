import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Badge from '../../../components/bootstrap/Badge';
import Spinner from '../../../components/bootstrap/Spinner';
import Modal, { ModalHeader, ModalBody, ModalTitle } from '../../../components/bootstrap/Modal';

import useTablestyle from '../../../hooks/useTablestyles';
import useColumnHiding from '../../../hooks/useColumnHiding';
import { updateHiddenColumnsInLocalStorage } from '../../../helpers/functions';
import ThemeContext from '../../../contexts/themeContext';
import { useSensors } from '../../../api/sensors.api';
import { getSensorStatusTheme, getSensorStatusLabel, getSensorOnlineLabel } from '../utils/sensorStatus.utils';
import { formatLastHeartbeat } from '../utils/format.utils';
import DeviceRegistration from './components/DeviceRegistration';
import { useSensorActions } from './hooks/useSensorActions';
import Icon from '../../../components/icon/Icon';

const SensorList = () => {
    const { fullScreenStatus, darkModeStatus } = useContext(ThemeContext);
    const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle();

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sensorTypeFilter, setSensorTypeFilter] = useState<string>('');
    const [onlineFilter, setOnlineFilter] = useState<boolean | undefined>(undefined);
    const [showFilters, setShowFilters] = useState(false);

    // Use server-side filtering
    const { data: sensors, isLoading, refetch } = useSensors({
        search: debouncedSearch || undefined,
        sensor_type: sensorTypeFilter || undefined,
        is_online: onlineFilter
    });

    // Sensor Actions Hook
    const {
        isRegistrationModalOpen,
        setIsRegistrationModalOpen,
        handleDeleteSensor,
        triggeringId,
        handleTriggerSensor,
    } = useSensorActions(refetch);

    // Clear all filters
    const handleClearFilters = useCallback(() => {
        setSearchTerm('');
        setSensorTypeFilter('');
        setOnlineFilter(undefined);
    }, []);

    // Check if any filters are active
    const hasActiveFilters = searchTerm || sensorTypeFilter || onlineFilter !== undefined;

    const staticColumns = [
        {
            title: 'Name',
            field: 'name',
            render: (rowData: any) => (
                <div>
                    <div className='fw-bold'>{rowData.name}</div>
                    {/* <div className='small text-muted'>{rowData.sensor_type}</div>    */}
                </div>
            )
        },
        {
            title: 'MAC Address',
            field: 'mac_address',
            render: (rowData: any) => (
                <div>
                    <div className='fw-bold'>{rowData.mac_address}</div>
                    {/* <div className='small text-muted'>ID: {rowData.id}</div> */}
                </div>
            )
        },
        {
            title: 'IP Address',
            field: 'ip_address',
        },
        {
            title: 'Location',
            field: 'location',
            render: (rowData: any) => (
                <div>
                    <div className='fw-bold'>{rowData?.area_name}</div>
                </div>
            )
        },
        {
            title: 'Status',
            field: 'is_active',
            render: (rowData: any) => {
                const activeTheme = getSensorStatusTheme('active', rowData.is_active, darkModeStatus);
                const onlineTheme = getSensorStatusTheme('online', rowData.is_online, darkModeStatus);

                return (
                    <div className='d-flex align-items-center gap-2'>
                        {/* Active/Inactive Status */}
                        <div
                            className='d-flex align-items-center gap-2 px-2 py-1'
                            style={{
                                background: activeTheme.bg,
                                borderRadius: '6px',
                                border: activeTheme.border,
                                minWidth: '75px',
                                justifyContent: 'center'
                            }}
                        >
                            <div
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: activeTheme.dot,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: activeTheme.color
                                }}
                            >
                                {getSensorStatusLabel(rowData.is_active)}
                            </span>
                        </div>

                        {/* Online/Offline Status */}
                        <div
                            className='d-flex align-items-center gap-2 px-2 py-1'
                            style={{
                                background: onlineTheme.bg,
                                borderRadius: '6px',
                                border: onlineTheme.border,
                                minWidth: '75px',
                                justifyContent: 'center'
                            }}
                        >
                            <div
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: onlineTheme.dot,
                                    animation: rowData.is_online ? 'pulse 2s ease-in-out infinite' : 'none'
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: onlineTheme.color
                                }}
                            >
                                {getSensorOnlineLabel(rowData.is_online)}
                            </span>
                        </div>

                        {/* Last Heartbeat */}
                        {rowData.last_heartbeat && (
                            <div
                                className='d-flex align-items-center gap-1'
                                style={{
                                    fontSize: '0.7rem',
                                    color: darkModeStatus ? '#868e96' : '#495057',
                                    fontWeight: 400,
                                    opacity: 0.8
                                }}
                            >
                                <Icon icon='Schedule' size='sm' />
                                {formatLastHeartbeat(rowData.last_heartbeat)}
                            </div>
                        )}
                    </div>
                );
            }
        },
    ];

    const actionButtons = [
        {
            title: 'Actions',
            field: 'actions',
            sorting: false,
            filtering: false,
            render: (rowData: any) => {

                const isInactive = !rowData.is_active;
                const deleteButton = (
                    <Button
                        color='danger'
                        isLight
                        icon='Delete'
                        onClick={(e: any) => handleDeleteSensor(rowData, e)}
                        title='Delete Sensor'
                    />
                );

                if (isInactive) {
                    return (
                        <div className='d-flex gap-2 align-items-center'>
                            <Button
                                color='primary'
                                isLight
                                icon='PowerSettingsNew'
                                tag='a'
                                to={`/halo/sensors/settings/${rowData.id}`}
                                title='Go to Device Settings to activate this sensor'
                            >
                                Activate
                            </Button>

                            {deleteButton}
                        </div>
                    );
                }
                return (
                    <div className='d-flex gap-2 justify-content-start align-items-center'>
                        {/* Trigger */}
                        <Button
                            color='secondary'
                            isLight
                            icon={triggeringId === rowData.id ? undefined : 'Bolt'}
                            onClick={() => handleTriggerSensor(rowData)}
                            isDisable={!rowData.ip_address || triggeringId === rowData.id}
                            title='Trigger Sensor'
                        >
                            {triggeringId === rowData.id && <Spinner isSmall inButton />}
                        </Button>

                        {/* Settings */}
                        <Button
                            color='info'
                            isLight
                            icon='Settings'
                            tag='a'
                            to={`/halo/sensors/settings/${rowData.id}`}
                            title='Settings'
                        />

                        {/* Details */}
                        <Button
                            color='primary'
                            isLight
                            icon='Analytics'
                            tag='a'
                            to={`/halo/sensors/detail/${rowData.id}`}
                            title='Details'
                        />

                        {deleteButton}
                    </div>
                );
            }
        }
    ];

    const columns = useColumnHiding({
        oldValue: staticColumns,
        hiddenColumnArray: JSON.parse(localStorage.getItem('sensorListColumns')) || [],
        buttonArray: actionButtons
    });

    return (
        <PageWrapper title='HALO Sensors'>
            <style>
                {`
                    @keyframes pulse {
                        0%, 100% {
                            opacity: 1;
                            transform: scale(1);
                        }
                        50% {
                            opacity: 0.6;
                            transform: scale(1.1);
                        }
                    }
                `}
            </style>
            <SubHeader>
                <SubHeaderLeft>
                    <Icon icon='Sensors' className='me-2 fs-4' />
                    <span className='h4 mb-0 fw-bold'>Sensor Inventory</span>
                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button
                        color='primary'
                        icon='Add'
                        onClick={() => setIsRegistrationModalOpen(true)}
                        data-tour='register-device-btn'
                    >
                        Register New Device
                    </Button>
                </SubHeaderRight>
            </SubHeader>
            <Page container='fluid'>
                {/* Filter Controls */}
                <Card className='mb-4'>
                    <CardBody>
                        <div className='d-flex justify-content-between align-items-center mb-3'>
                            <h6 className='mb-0 fw-bold'>
                                <Icon icon='FilterList' className='me-2' />
                                Filters
                            </h6>
                            <div className='d-flex gap-2'>
                                {hasActiveFilters && (
                                    <Badge color='info' isLight>
                                        {[searchTerm, sensorTypeFilter, onlineFilter !== undefined].filter(Boolean).length} active
                                    </Badge>
                                )}
                                <Button
                                    color='link'
                                    size='sm'
                                    icon={showFilters ? 'ExpandLess' : 'ExpandMore'}
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    {showFilters ? 'Hide' : 'Show'} Filters
                                </Button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className='row g-3'>
                                {/* Search Input */}
                                <div className='col-md-4'>
                                    <label className='form-label small text-muted'>Search</label>
                                    <div className='input-group'>
                                        <span className='input-group-text'>
                                            <Icon icon='Search' />
                                        </span>
                                        <input
                                            type='text'
                                            className='form-control'
                                            placeholder='Search by name, location, MAC...'
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <button
                                                className='btn btn-outline-secondary'
                                                type='button'
                                                onClick={() => setSearchTerm('')}
                                            >
                                                <Icon icon='Close' />
                                            </button>
                                        )}
                                    </div>
                                    {searchTerm && debouncedSearch !== searchTerm && (
                                        <small className='text-muted'>Searching...</small>
                                    )}
                                </div>

                                {/* Sensor Type Filter */}
                                <div className='col-md-3'>
                                    <label className='form-label small text-muted'>Sensor Type</label>
                                    <select
                                        className='form-select'
                                        value={sensorTypeFilter}
                                        onChange={(e) => setSensorTypeFilter(e.target.value)}
                                    >
                                        <option value=''>All Types</option>
                                        <option value='HALO_3C'>HALO 3C</option>
                                        <option value='HALO_IOT'>HALO IOT</option>
                                        <option value='HALO_SMART'>HALO Smart</option>
                                        <option value='HALO_CUSTOM'>HALO Custom</option>
                                    </select>
                                </div>

                                {/* Online Status Filter */}
                                <div className='col-md-3'>
                                    <label className='form-label small text-muted'>Online Status</label>
                                    <select
                                        className='form-select'
                                        value={onlineFilter === undefined ? '' : onlineFilter.toString()}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setOnlineFilter(value === '' ? undefined : value === 'true');
                                        }}
                                    >
                                        <option value=''>All Sensors</option>
                                        <option value='true'>Online Only</option>
                                        <option value='false'>Offline Only</option>
                                    </select>
                                </div>

                                {/* Clear Filters Button */}
                                <div className='col-md-2 d-flex align-items-end'>
                                    <Button
                                        color='light'
                                        className='w-100'
                                        icon='FilterAltOff'
                                        onClick={handleClearFilters}
                                        isDisable={!hasActiveFilters}
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Results Summary */}
                        {!isLoading && (
                            <div className='mt-3 pt-3 border-top'>
                                <small className='text-muted'>
                                    <Icon icon='Sensors' size='sm' className='me-1' />
                                    Showing <strong>{sensors?.length || 0}</strong> sensor{sensors?.length !== 1 ? 's' : ''}
                                    {hasActiveFilters && ' (filtered)'}
                                </small>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Sensor Table */}
                <Card stretch className='border-0'>
                    <CardBody className='table-responsive p-0'>
                        <div
                            className='material-table-wrapper'
                            style={{
                                // overflow: 'auto',
                                position: fullScreenStatus ? 'relative' : 'static',
                            }}
                        >
                            <ThemeProvider theme={theme}>
                                <MaterialTable
                                    title=' '
                                    columns={columns}
                                    data={sensors || []}
                                    isLoading={isLoading}
                                    onChangeColumnHidden={(column, hidden) =>
                                        updateHiddenColumnsInLocalStorage(
                                            column,
                                            hidden,
                                            'sensorListColumns',
                                        )
                                    }
                                    options={{
                                        headerStyle: headerStyles(),
                                        rowStyle: rowStyles(),
                                        actionsColumnIndex: -1,
                                        search: true,
                                        pageSize: 10,
                                        searchFieldStyle: searchFieldStyle(),
                                        columnsButton: true,
                                    }}
                                    localization={{
                                        pagination: {
                                            labelRowsPerPage: '',
                                        }
                                    }}
                                />
                            </ThemeProvider>
                        </div>
                    </CardBody>
                </Card>
            </Page>

            {/* Device Registration Modal */}
            <Modal
                isOpen={isRegistrationModalOpen}
                setIsOpen={setIsRegistrationModalOpen}
                size='lg'
                isCentered
                titleId='deviceRegistrationModal'
            >
                <ModalHeader setIsOpen={setIsRegistrationModalOpen}>
                    <ModalTitle id='deviceRegistrationModal'>
                        Register New Device
                    </ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <DeviceRegistration
                        onSuccess={() => {
                            setIsRegistrationModalOpen(false);
                            refetch();
                        }}
                        onCancel={() => setIsRegistrationModalOpen(false)}
                    />
                </ModalBody>
            </Modal>
        </PageWrapper>
    );
};

export default SensorList;