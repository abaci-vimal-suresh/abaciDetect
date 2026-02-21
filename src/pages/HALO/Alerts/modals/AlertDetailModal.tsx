import React from 'react';
import { format } from 'date-fns';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Badge from '../../../../components/bootstrap/Badge';
import Icon from '../../../../components/icon/Icon';
import Label from '../../../../components/bootstrap/forms/Label';
import { AlertAction, AlertStatus } from '../../../../types/sensor';

interface AlertRecord {
    id: string;
    originalId: number;
    timestamp: string;
    sensor_name: string;
    area_name: string;
    alert_type: string;
    severity: 'critical' | 'warning' | 'info';
    value: string | number;
    status: AlertStatus | 'Resolved';
    remarks?: string | null;
    resolved_at?: string;
    value_reset_time?: string;
    source: string;
    alert_actions: AlertAction[];
    recheck_next_trigger?: boolean;
}

interface AlertDetailModalProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    alert: AlertRecord | null;
}

const AlertDetailModal: React.FC<AlertDetailModalProps> = ({ isOpen, setIsOpen, alert }) => {
    if (!alert) return null;

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg' isCentered>
            <ModalHeader setIsOpen={setIsOpen}>
                Alert Details: {alert.id}
            </ModalHeader>
            <ModalBody>
                <div className='row g-3'>
                    <div className='col-12 text-center mb-4'>
                        <div
                            className='mx-auto mb-3'
                            style={{
                                width: '80px', height: '80px',
                                background: '#e0e5ec', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
                            }}
                        >
                            <Icon
                                icon={alert.severity === 'critical' ? 'ReportProblem' : alert.severity === 'warning' ? 'Warning' : 'Info'}
                                size='3x'
                                className={`text-${alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'primary'}`}
                            />
                        </div>
                        <div className='h4 fw-bold mb-1'>{alert.alert_type}</div>
                        <div className='text-muted small'>
                            ID: {alert.id} • {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </div>
                    </div>

                    <div className='col-12'>
                        <div className='border-top pt-3 mb-3'>
                            <div className='row g-3'>
                                <div className='col-md-6'>
                                    <Label className='fw-bold text-secondary small text-uppercase mb-1'>Sensor Source</Label>
                                    <div className='d-flex align-items-center p-3 rounded'>
                                        <Icon icon='Sensors' className='me-2 text-primary' />
                                        <span className='fw-bold'>{alert.sensor_name}</span>
                                    </div>
                                </div>
                                <div className='col-md-6'>
                                    <Label className='fw-bold text-secondary small text-uppercase mb-1'>Location Area</Label>
                                    <div className='d-flex align-items-center p-3 rounded'>
                                        <Icon icon='Place' className='me-2 text-info' />
                                        <span className='fw-bold'>{alert.area_name}</span>
                                    </div>
                                </div>
                                <div className='col-md-6'>
                                    <Label className='fw-bold text-secondary small text-uppercase mb-1'>Alert Origin</Label>
                                    <div className='d-flex align-items-center p-3 rounded'>
                                        <Icon icon='Hub' className='me-2 text-warning' />
                                        <Badge color={alert.source === 'External' ? 'info' : 'secondary'} isLight>
                                            {alert.source.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='border-top pt-3 mb-3'>
                            <Label className='fw-bold text-secondary small text-uppercase mb-1'>Value / Description</Label>
                            <div className='p-3 rounded font-monospace'>{alert.value}</div>
                        </div>

                        {alert.alert_actions?.length > 0 && (
                            <div className='border-top pt-3 mb-3'>
                                <Label className='fw-bold text-secondary small text-uppercase mb-1'>Notification Actions</Label>
                                <div className='mt-2'>
                                    {alert.alert_actions.map((action, i) => (
                                        <div
                                            key={i}
                                            className='d-flex align-items-center justify-content-between p-2 mb-2 rounded border-start border-4'
                                            style={{
                                                background: 'rgba(0,0,0,0.02)',
                                                borderLeftColor: action.status === 'success' ? '#198754' : action.status === 'failed' ? '#dc3545' : '#ffc107',
                                            }}
                                        >
                                            <div className='d-flex align-items-center'>
                                                <Icon
                                                    icon={action.action_name.toLowerCase().includes('email') ? 'Email' : 'Notifications'}
                                                    className='me-2 text-muted'
                                                />
                                                <div>
                                                    <div className='fw-bold small'>{action.action_name}</div>
                                                    <div className='text-muted' style={{ fontSize: '0.7rem' }}>
                                                        {format(new Date(action.executed_at), 'HH:mm:ss')}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge color={action.status === 'success' ? 'success' : action.status === 'failed' ? 'danger' : 'warning'} isLight>
                                                {action.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='border-top pt-3 mb-3'>
                            <Label className='fw-bold text-secondary small text-uppercase mb-1'>Remarks / Notes</Label>
                            <div className='p-3 rounded'>
                                {alert.remarks ?? <span className='text-muted fst-italic'>No remarks available</span>}
                            </div>
                        </div>

                        {(alert.resolved_at || alert.value_reset_time) && (
                            <div className='border-top pt-3'>
                                <div className='row g-3'>
                                    {alert.resolved_at && (
                                        <div className='col-md-6'>
                                            <Label className='fw-bold text-secondary small text-uppercase mb-1'>Resolved At</Label>
                                            <div className='text-success fw-bold p-2'>
                                                <Icon icon='CheckCircle' className='me-1' />
                                                {format(new Date(alert.resolved_at), 'MMM dd, HH:mm')}
                                            </div>
                                        </div>
                                    )}
                                    {alert.value_reset_time && (
                                        <div className='col-md-6'>
                                            <Label className='fw-bold text-secondary small text-uppercase mb-1'>Condition Cleared</Label>
                                            <div className='text-success fw-bold p-2'>
                                                <Icon icon='AutoMode' className='me-1' />
                                                {format(new Date(alert.value_reset_time), 'MMM dd, HH:mm')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </ModalBody>
            <ModalFooter className='justify-content-center border-0 pb-4'>
                <Button className='btn-neumorphic px-5 py-2' onClick={() => setIsOpen(false)}>
                    Close Details
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default AlertDetailModal;