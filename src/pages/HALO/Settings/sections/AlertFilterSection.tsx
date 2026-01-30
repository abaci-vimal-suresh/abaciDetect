import React, { useState, useContext } from 'react';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import { useAlertFilters, useSensor } from '../../../../api/sensors.api';
import ThemeContext from '../../../../contexts/themeContext';
import styles from '../../../../styles/pages/HALO/Settings/ThresholdManagement.module.scss';
import classNames from 'classnames';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../../hooks/useTablestyles';

interface AlertFilterSectionProps {
    deviceId: string;
}

const AlertFilterSection: React.FC<AlertFilterSectionProps> = ({ deviceId }) => {
    const { darkModeStatus } = useContext(ThemeContext);
    const { theme, headerStyle, rowStyle } = useTablestyle();

    const { data: sensor } = useSensor(deviceId);
    const { data: allFilters, isLoading } = useAlertFilters();

    // Filter to show only filters relevant to this device's area or sensor
    const relevantFilters = allFilters?.filter(filter => {
        const areaMatch = sensor?.area && (typeof sensor.area === 'object' ? filter.area_list.includes(sensor.area.id) : filter.area_list.includes(sensor.area));
        // Simple logic for demo: if area matches or if it's a global filter (empty area list)
        return areaMatch || filter.area_list.length === 0;
    }) || [];

    return (
        <Card stretch className="h-100 shadow-sm border-0">
            <CardHeader className="bg-transparent border-0 pt-4 px-4">
                <CardTitle>
                    <div className="d-flex align-items-center gap-2">
                        <Icon icon="FilterAlt" size="2x" className="text-primary" />
                        <span>Responsive Alert Filters</span>
                    </div>
                </CardTitle>
                <p className="text-muted small mb-0">
                    Manage automations and notifications specifically for this device or its area.
                </p>
            </CardHeader>
            <CardBody className="px-4">
                <div className="alert alert-primary d-flex align-items-center mb-4 border-0" style={{ opacity: 0.8 }}>
                    <Icon icon="Info" className="me-2" />
                    <div className="small">
                        Filters listed here are automatically applied to this device based on its Area ({sensor?.area_name || 'Global'}).
                    </div>
                </div>

                <ThemeProvider theme={theme}>
                    <MaterialTable
                        title="Applicable Filters"
                        columns={[
                            { title: 'Name', field: 'name' },
                            {
                                title: 'Trigger Condition',
                                render: (row: any) => (
                                    <div className="d-flex gap-1">
                                        {row.action_for_threshold && <Badge color="warning" isLight>Threshold</Badge>}
                                        {row.action_for_max && <Badge color="danger" isLight>Max</Badge>}
                                    </div>
                                )
                            },
                            {
                                title: 'Status',
                                render: () => <Badge color="success" isLight>Active</Badge>
                            }
                        ]}
                        data={relevantFilters}
                        options={{
                            headerStyle: headerStyle(),
                            rowStyle: rowStyle(),
                            search: false,
                            paging: false,
                            toolbar: false
                        }}
                    />
                </ThemeProvider>

                <div className="mt-4 d-flex justify-content-end">
                    <Button
                        color="primary"
                        isLight
                        icon="Settings"
                        tag="a"
                        to="/halo/alerts"
                    >
                        Configure Global Filters
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
};

export default AlertFilterSection;
