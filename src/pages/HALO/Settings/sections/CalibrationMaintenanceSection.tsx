import React, { useState } from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardFooter, CardActions } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Spinner from '../../../../components/bootstrap/Spinner';
import Alert from '../../../../components/bootstrap/Alert';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../../components/bootstrap/Modal';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import {
    useCalibrationRecords,
    useCreateCalibrationRecord,
    useTriggerCalibration,
    useMaintenanceSchedules,
    useRestartDevice,
    useFactoryReset,
    useUpdateFirmware,
} from '../../../../api/device.setting.api';

interface CalibrationMaintenanceSectionProps {
    deviceId: string;
}

const CalibrationMaintenanceSection: React.FC<CalibrationMaintenanceSectionProps> = ({ deviceId }) => {
    const { data: calibrations, isLoading: calibrationsLoading } = useCalibrationRecords(deviceId);
    const { data: schedules, isLoading: schedulesLoading } = useMaintenanceSchedules(deviceId);
    const createCalibration = useCreateCalibrationRecord();
    const triggerCalibration = useTriggerCalibration();
    const restartDevice = useRestartDevice();
    const factoryReset = useFactoryReset();
    const updateFirmware = useUpdateFirmware();

    const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
    const [selectedSensor, setSelectedSensor] = useState('');

    const sensorTypes = [
        'Temperature', 'Humidity', 'AQI', 'PM1', 'PM2.5', 'PM10',
        'CO2', 'CO', 'NO2', 'TVOC', 'Motion', 'Noise', 'Light'
    ];

    const handleTriggerCalibration = () => {
        if (!selectedSensor) return;
        triggerCalibration.mutate(
            { deviceId, sensorType: selectedSensor },
            {
                onSuccess: () => {
                    setIsCalibrationModalOpen(false);
                    setSelectedSensor('');
                },
            }
        );
    };

    const handleRestartDevice = () => {
        if (confirm('Are you sure you want to restart this device? It will be offline briefly.')) {
            restartDevice.mutate(deviceId);
        }
    };

    const handleFactoryReset = () => {
        const confirmation1 = confirm('WARNING: Factory reset will erase ALL settings and data. Continue?');
        if (!confirmation1) return;

        const confirmation2 = confirm('Are you ABSOLUTELY sure? This action CANNOT be undone!');
        if (confirmation2) {
            factoryReset.mutate(deviceId);
        }
    };

    const handleUpdateFirmware = () => {
        if (confirm('Check for firmware updates? Device may restart during update.')) {
            updateFirmware.mutate(deviceId);
        }
    };

    if (calibrationsLoading || schedulesLoading) {
        return (
            <Card>
                <CardBody className='text-center py-5'>
                    <Spinner color='primary' />
                </CardBody>
            </Card>
        );
    }

    return (
        <>
            <div className='row g-4'>
                {/* Calibration Records */}
                <div className='col-12'>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                <Icon icon='TuneRounded' className='me-2' />
                                Calibration History
                            </CardTitle>
                            <CardActions>
                                <Button
                                    color='primary'
                                    icon='Add'
                                    onClick={() => setIsCalibrationModalOpen(true)}
                                >
                                    Calibrate Sensor
                                </Button>
                            </CardActions>
                        </CardHeader>
                        <CardBody>
                            {calibrations && calibrations.length > 0 ? (
                                <div className='table-responsive'>
                                    <table className='table table-hover'>
                                        <thead>
                                            <tr>
                                                <th>Sensor Type</th>
                                                <th>Calibration Date</th>
                                                <th>Performed By</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {calibrations.map((cal) => (
                                                <tr key={cal.id}>
                                                    <td>
                                                        <Badge color='info'>{cal.sensor_type}</Badge>
                                                    </td>
                                                    <td>{new Date(cal.calibration_date).toLocaleString()}</td>
                                                    <td>{cal.calibrated_by || 'System'}</td>
                                                    <td>{cal.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <Alert color='info' icon='Info'>
                                    No calibration records found. Sensors should be calibrated regularly for accuracy.
                                </Alert>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Maintenance Schedules */}
                <div className='col-12'>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                <Icon icon='Schedule' className='me-2' />
                                Maintenance Schedules
                            </CardTitle>
                        </CardHeader>
                        <CardBody>
                            {schedules && schedules.length > 0 ? (
                                <div className='row g-3'>
                                    {schedules.map((schedule) => (
                                        <div key={schedule.id} className='col-md-6'>
                                            <Card className='shadow-sm'>
                                                <CardBody>
                                                    <div className='d-flex justify-content-between align-items-start mb-2'>
                                                        <div>
                                                            <h6 className='mb-1'>{schedule.maintenance_type}</h6>
                                                            <small className='text-muted'>
                                                                Every {schedule.frequency_days} days
                                                            </small>
                                                        </div>
                                                        <Badge color={schedule.reminder_enabled ? 'success' : 'secondary'}>
                                                            {schedule.reminder_enabled ? 'Reminder On' : 'Reminder Off'}
                                                        </Badge>
                                                    </div>
                                                    <div className='small'>
                                                        <div className='mb-1'>
                                                            <strong>Last:</strong>{' '}
                                                            {schedule.last_maintenance
                                                                ? new Date(schedule.last_maintenance).toLocaleDateString()
                                                                : 'Never'}
                                                        </div>
                                                        <div>
                                                            <strong>Next:</strong>{' '}
                                                            {new Date(schedule.next_maintenance).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Alert color='info' icon='Info'>
                                    No maintenance schedules configured. Set up schedules to stay on top of device maintenance.
                                </Alert>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Device Actions */}
                <div className='col-12'>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                <Icon icon='Settings' className='me-2' />
                                Device Actions
                            </CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Alert color='warning' icon='Warning' className='mb-4'>
                                <strong>Caution:</strong> These actions will affect device operation. Use carefully.
                            </Alert>

                            <div className='row g-3'>
                                <div className='col-md-4'>
                                    <Card className='h-100 border-info'>
                                        <CardBody className='text-center'>
                                            <Icon icon='Refresh' className='text-info mb-3' size='3x' />
                                            <h6>Restart Device</h6>
                                            <p className='small text-muted'>
                                                Soft reboot. Device will be offline for ~2 minutes.
                                            </p>
                                            <Button
                                                color='info'
                                                isLight
                                                onClick={handleRestartDevice}
                                                isDisable={restartDevice.isPending}
                                            >
                                                {restartDevice.isPending && <Spinner isSmall inButton />}
                                                Restart Now
                                            </Button>
                                        </CardBody>
                                    </Card>
                                </div>

                                <div className='col-md-4'>
                                    <Card className='h-100 border-warning'>
                                        <CardBody className='text-center'>
                                            <Icon icon='SystemUpdate' className='text-warning mb-3' size='3x' />
                                            <h6>Update Firmware</h6>
                                            <p className='small text-muted'>
                                                Check for and install firmware updates.
                                            </p>
                                            <Button
                                                color='warning'
                                                isLight
                                                onClick={handleUpdateFirmware}
                                                isDisable={updateFirmware.isPending}
                                            >
                                                {updateFirmware.isPending && <Spinner isSmall inButton />}
                                                Check Updates
                                            </Button>
                                        </CardBody>
                                    </Card>
                                </div>

                                <div className='col-md-4'>
                                    <Card className='h-100 border-danger'>
                                        <CardBody className='text-center'>
                                            <Icon icon='SettingsBackupRestore' className='text-danger mb-3' size='3x' />
                                            <h6>Factory Reset</h6>
                                            <p className='small text-muted'>
                                                Erase all settings. Cannot be undone!
                                            </p>
                                            <Button
                                                color='danger'
                                                isLight
                                                onClick={handleFactoryReset}
                                                isDisable={factoryReset.isPending}
                                            >
                                                {factoryReset.isPending && <Spinner isSmall inButton />}
                                                Factory Reset
                                            </Button>
                                        </CardBody>
                                    </Card>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Calibration Modal */}
            <Modal isOpen={isCalibrationModalOpen} setIsOpen={setIsCalibrationModalOpen} isCentered>
                <ModalHeader setIsOpen={setIsCalibrationModalOpen}>
                    <ModalTitle id='calibrationModalTitle'>Calibrate Sensor</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <Alert color='info' icon='Info' className='mb-3'>
                        Calibration improves sensor accuracy. The device will perform automatic calibration routines.
                    </Alert>
                    <FormGroup label='Select Sensor Type'>
                        <select
                            className='form-select'
                            value={selectedSensor}
                            onChange={(e) => setSelectedSensor(e.target.value)}
                        >
                            <option value=''>Choose a sensor...</option>
                            {sensorTypes.map((sensor) => (
                                <option key={sensor} value={sensor}>
                                    {sensor}
                                </option>
                            ))}
                        </select>
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => setIsCalibrationModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color='primary'
                        onClick={handleTriggerCalibration}
                        isDisable={!selectedSensor || triggerCalibration.isPending}
                    >
                        {triggerCalibration.isPending && <Spinner isSmall inButton />}
                        Start Calibration
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default CalibrationMaintenanceSection;