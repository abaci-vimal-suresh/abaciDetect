import React, { useState, useEffect } from 'react';
import Button from '../../../../../../components/bootstrap/Button';
import Icon from '../../../../../../components/icon/Icon';
import Badge from '../../../../../../components/bootstrap/Badge';
import Spinner from '../../../../../../components/bootstrap/Spinner';
import { SensorConfig } from '../../../../../../types/sensor';
import styles from '../../../../../../styles/pages/HALO/Settings/ThresholdManagement.module.scss';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../../../../hooks/useTablestyles';

interface ThresholdTableProps {
    configs: SensorConfig[];
    isLoading: boolean;
    apiSensorName?: string;
    deviceId: string;
    displaySensorName: (name: string) => string;
    getSoundLabel: (fileName: string) => string;
    onEdit: (configId: number) => void;
    onDelete: (configId: number) => void;
    onToggleEnabled: (rowData: SensorConfig) => void;
    onTestSensor: (eventId?: string) => void;
    onSync: () => void;
    onCreateNew: () => void;
    isSyncPending: boolean;
    isTriggerPending: boolean;
    hasIpAddress: boolean;
}

const ThresholdTable: React.FC<ThresholdTableProps> = ({
    configs,
    isLoading,
    apiSensorName,
    deviceId,
    displaySensorName,
    getSoundLabel,
    onEdit,
    onDelete,
    onToggleEnabled,
    onTestSensor,
    onSync,
    onCreateNew,
    isSyncPending,
    isTriggerPending,
    hasIpAddress,
}) => {
    const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle();

    // Track which specific row is being pulse-tested
    const [pendingEventId, setPendingEventId] = useState<string | null>(null);

    // Clear the pending row once the mutation completes
    useEffect(() => {
        if (!isTriggerPending) {
            setPendingEventId(null);
        }
    }, [isTriggerPending]);

    const tableColumns = [
        {
            title: 'Sensor Name',
            field: 'event_id',
            headerStyle: { textAlign: 'left' as any, paddingLeft: '2.5rem' },
            cellStyle: { textAlign: 'left' as any, paddingLeft: '2.5rem' },
            render: (rowData: any) => (
                <div className='fw-bold' style={{ fontSize: '0.95rem' }}>
                    {displaySensorName(rowData.event_id || rowData.sensor_name)}
                </div>
            ),
        },
        {
            title: 'Source',
            field: 'source',
            headerStyle: { textAlign: 'center' as any },
            cellStyle: { textAlign: 'center' as any },
            render: (rowData: any) => (
                <div className='text-muted small'>{rowData.source || '-'}</div>
            ),
        },
        {
            title: 'Status',
            field: 'enabled',
            sorting: false,
            headerStyle: { textAlign: 'center' as any },
            cellStyle: { textAlign: 'center' as any },
            render: (rowData: any) => (
                <div className='d-flex justify-content-center'>
                    <div
                        onClick={() => onToggleEnabled(rowData)}
                        style={{ cursor: 'pointer' }}
                        title={rowData.enabled ? 'Enabled' : 'Disabled'}
                    >
                        <Icon
                            icon={rowData.enabled ? 'ToggleOn' : 'ToggleOff'}
                            size='2x'
                            color={rowData.enabled ? 'success' : 'secondary'}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: 'Threshold',
            field: 'threshold',
            headerStyle: { textAlign: 'center' as any },
            cellStyle: { textAlign: 'center' as any },
            render: (rowData: any) => (
                <div className='d-flex justify-content-center'>
                    <Badge
                        color='info'
                        isLight
                        className='px-3 py-1'
                        style={{ borderRadius: '50px', minWidth: '45px', textAlign: 'center' as any, fontWeight: 600 }}
                    >
                        {rowData.threshold}
                    </Badge>
                </div>
            ),
        },
        {
            title: 'Range',
            field: 'min_value',
            headerStyle: { textAlign: 'center' as any },
            cellStyle: { textAlign: 'center' as any },
            render: (rowData: any) => (
                <div className='d-flex justify-content-center'>
                    <span className='text-muted fw-500' style={{ fontSize: '0.9rem' }}>
                        {rowData.min_value} - {rowData.max_value}
                    </span>
                </div>
            ),
        },
        {
            title: 'Actions (LED/Sound)',
            headerStyle: { textAlign: 'center' as any },
            cellStyle: { textAlign: 'center' as any },
            render: (rowData: any) => {
                const hexColor = rowData.led_color
                    ? `#${rowData.led_color.toString(16).padStart(6, '0')}`
                    : '#CCCCCC';
                return (
                    <div className='d-flex justify-content-center align-items-center gap-2'>
                        <div
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: hexColor,
                                border: '1px solid rgba(0,0,0,0.1)',
                                boxShadow: `0 0 5px ${hexColor}`,
                            }}
                            title={`LED Color: ${hexColor}`}
                        />
                        {rowData.sound && (
                            <Icon
                                icon='VolumeUp'
                                size='sm'
                                className='text-primary'
                                title={getSoundLabel(rowData.sound)}
                            />
                        )}
                        {rowData.relay1 > 0 && (
                            <Badge color='secondary' isLight size='sm' title={`Relay: ${rowData.relay1}s`}>
                                {rowData.relay1}s
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Manage',
            field: 'actions',
            sorting: false,
            filtering: false,
            headerStyle: { textAlign: 'right' as any, paddingRight: '2.5rem' },
            cellStyle: { textAlign: 'right' as any, paddingRight: '2.5rem' },
            render: (rowData: any) => (
                <div className='d-flex gap-2 justify-content-end align-items-center'>
                    <Button
                        color='warning'
                        isLight
                        size='sm'
                        icon={pendingEventId === (rowData.event_id || rowData.sensor_name) ? undefined : 'FlashOn'}
                        className='px-3'
                        onClick={() => {
                            const evtId = rowData.event_id || rowData.sensor_name;
                            setPendingEventId(evtId);
                            onTestSensor(evtId);
                        }}
                        isDisable={isTriggerPending || !hasIpAddress}
                        title={!hasIpAddress ? 'IP address required' : 'Pulse Test Sensor'}
                    >
                        {pendingEventId === (rowData.event_id || rowData.sensor_name)
                            ? <Spinner isSmall inButton />
                            : 'Pulse'}
                    </Button>
                    <Button
                        color='primary'
                        isLight
                        size='sm'
                        icon='Tune'
                        className='px-3'
                        onClick={() => onEdit(rowData.id!)}
                    >
                        Edit
                    </Button>
                    <Button
                        color='danger'
                        isLight
                        size='sm'
                        icon='Delete'
                        onClick={() => onDelete(rowData.id!)}
                    />
                </div>
            ),
        },
    ];

    return (
        <>
            <div className={styles.detailHeader}>
                <div className={styles.headerTop}>
                    <div className={styles.titleSection}>
                        <Icon icon='NotificationsActive' size='2x' className={styles.headerIcon} />
                        <div className={styles.titleContent}>
                            <h5 className='text-light'>Manage All Thresholds</h5>
                            <span className={styles.subtitle}>
                                Current configurations for {apiSensorName || deviceId}
                            </span>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <Button
                            color='info'
                            size='sm'
                            icon='Sync'
                            onClick={onSync}
                            isLight
                            isDisable={isSyncPending}
                            className='me-2'
                        >
                            {isSyncPending ? <Spinner isSmall inButton /> : 'Sync'}
                        </Button>
                        <Button color='primary' size='sm' icon='Add' onClick={onCreateNew} isLight>
                            New
                        </Button>
                    </div>
                </div>
            </div>

            <div className={styles.listView}>
                <div className={styles.tableCard}>
                    <ThemeProvider theme={theme}>
                        <MaterialTable
                            title=''
                            columns={tableColumns}
                            data={configs || []}
                            isLoading={isLoading}
                            options={{
                                headerStyle: {
                                    ...headerStyles(),
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.1em',
                                },
                                rowStyle: {
                                    ...rowStyles(),
                                    cursor: 'default',
                                },
                                actionsColumnIndex: -1,
                                search: true,
                                pageSize: 10,
                                searchFieldStyle: searchFieldStyle(),
                                columnsButton: false,
                                showTitle: false,
                                padding: 'default',
                                toolbar: true,
                            }}
                            localization={{
                                pagination: { labelRowsPerPage: '' },
                                toolbar: { searchPlaceholder: 'Search Thresholds...' },
                            }}
                        />
                    </ThemeProvider>
                </div>
            </div>
        </>
    );
};

export default ThresholdTable;
