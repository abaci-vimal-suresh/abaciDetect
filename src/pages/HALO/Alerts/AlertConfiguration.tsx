import React, { useState } from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import Breadcrumb from '../../../components/bootstrap/Breadcrumb';
import Card, { CardBody, CardHeader, CardTitle } from '../../../components/bootstrap/Card';
import { useSensors, useSensorConfigurations, useUpdateSensorConfiguration } from '../../../api/sensors.api';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../hooks/useTablestyles';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import Button from '../../../components/bootstrap/Button';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../../../components/bootstrap/Modal';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import { SENSOR_CONFIG_CHOICES } from '../../../types/sensor';

const AlertConfiguration = () => {
    const { theme, headerStyle, rowStyle } = useTablestyle();
    const { data: sensors, isLoading: isSensorsLoading } = useSensors();
    const [selectedSensor, setSelectedSensor] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: configs, isLoading: isConfigsLoading } = useSensorConfigurations(selectedSensor?.id);
    const updateConfig = useUpdateSensorConfiguration();

    const [editConfig, setEditConfig] = useState<any>(null);

    const handleEdit = (sensor: any, config?: any) => {
        setSelectedSensor(sensor);
        setEditConfig(config || {
            sensor_name: 'temp_c',
            enabled: true,
            threshold: 0,
            min_value: 0,
            max_value: 100
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (selectedSensor && editConfig) {
            await updateConfig.mutateAsync({
                sensorId: selectedSensor.id,
                configId: editConfig.id,
                config: editConfig
            });
            setIsModalOpen(false);
        }
    };

    const columns = [
        { title: 'Sensor Name', field: 'name' },
        { title: 'Location', field: 'location' },
        {
            title: 'Type',
            field: 'sensor_type',
            render: (rowData: any) => <Badge color="info" isLight>{rowData.sensor_type}</Badge>
        },
        {
            title: 'Status',
            field: 'status',
            render: (rowData: any) => (
                <Badge color={rowData.is_online ? 'success' : 'danger'}>
                    {rowData.is_online ? 'Online' : 'Offline'}
                </Badge>
            )
        },
        {
            title: 'Actions',
            render: (rowData: any) => (
                <Button color="primary" isLight icon="Tune" onClick={() => handleEdit(rowData)}>
                    Configure
                </Button>
            )
        }
    ];

    return (
        <PageWrapper title="Alert Configuration">
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb
                        list={[
                            { title: 'HALO', to: '/halo' },
                            { title: 'Alerts', to: '/halo/alerts' },
                            { title: 'Configuration', to: '/halo/alerts/config' },
                        ]}
                    />
                </SubHeaderLeft>
            </SubHeader>
            <Page container='fluid'>
                <div className="row">
                    <div className="col-12">
                        <Card stretch shadow="sm">
                            <CardHeader borderSize={1}>
                                <CardTitle>Device Alert Rules</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <ThemeProvider theme={theme}>
                                    <MaterialTable
                                        title="Sensors"
                                        columns={columns}
                                        data={sensors || []}
                                        isLoading={isSensorsLoading}
                                        options={{
                                            headerStyle: headerStyle(),
                                            rowStyle: rowStyle(),
                                            pageSize: 10,
                                        }}
                                    />
                                </ThemeProvider>
                            </CardBody>
                        </Card>
                    </div>
                </div>

                <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} size="lg">
                    <ModalHeader setIsOpen={setIsModalOpen}>
                        Configure Alert Rules: {selectedSensor?.name}
                    </ModalHeader>
                    <ModalBody>
                        {isConfigsLoading ? (
                            <div className="text-center py-5">
                                <Icon icon="Autorenew" size="3x" />
                                <div className="mt-2 text-muted">Loading configurations...</div>
                            </div>
                        ) : (
                            <div className="row">
                                <div className="col-12 mb-4">
                                    <div className="alert alert-info border-0 shadow-sm d-flex align-items-center">
                                        <Icon icon="Info" className="me-2" />
                                        Set thresholds for parameters. Alerts will be triggered when values exceed these limits.
                                    </div>
                                </div>

                                {configs?.length === 0 ? (
                                    <div className="col-12 text-center py-4 text-muted">
                                        No rules configured for this sensor.
                                    </div>
                                ) : (
                                    configs?.map((config: any) => (
                                        <div key={config.id} className="col-md-6 mb-3">
                                            <Card stretch className="border shadow-none h-100">
                                                <CardBody>
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <h6 className="mb-0 fw-bold">
                                                            {SENSOR_CONFIG_CHOICES.find(c => c.value === config.sensor_name)?.label || config.sensor_name}
                                                        </h6>
                                                        <Icon
                                                            icon={config.enabled ? "NotificationsActive" : "NotificationsOff"}
                                                            className={config.enabled ? "text-success" : "text-muted"}
                                                        />
                                                    </div>
                                                    <div className="row g-2">
                                                        <div className="col-4">
                                                            <small className="text-muted d-block mb-1">Min</small>
                                                            <Input
                                                                type="number"
                                                                size="sm"
                                                                value={config.min_value}
                                                                onChange={(e: any) => {/* update logic */ }}
                                                            />
                                                        </div>
                                                        <div className="col-4">
                                                            <small className="text-muted d-block mb-1">Max</small>
                                                            <Input
                                                                type="number"
                                                                size="sm"
                                                                value={config.max_value}
                                                                onChange={(e: any) => {/* update logic */ }}
                                                            />
                                                        </div>
                                                        <div className="col-4">
                                                            <small className="text-muted d-block mb-1">Threshold</small>
                                                            <Input
                                                                type="number"
                                                                size="sm"
                                                                value={config.threshold}
                                                                onChange={(e: any) => {/* update logic */ }}
                                                            />
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" isLight onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" icon="Save" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </ModalFooter>
                </Modal>
            </Page>
        </PageWrapper>
    );
};

export default AlertConfiguration;
