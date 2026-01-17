import React from 'react';
import { Sensor } from '../../../../types/sensor';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import Badge from '../../../../components/bootstrap/Badge';
import Icon from '../../../../components/icon/Icon';
import styles from './SensorPalette.module.scss';

interface SensorPaletteProps {
    sensors: Sensor[];
    currentAreaId?: number;
    onDragStart: (e: React.DragEvent, sensor: Sensor) => void;
}

const SensorPalette: React.FC<SensorPaletteProps> = ({ sensors, currentAreaId, onDragStart }) => {
    const localSensors = sensors.filter(s => s.area?.id === currentAreaId);
    const globalSensors = sensors.filter(s => s.area?.id !== currentAreaId);

    const renderSensorList = (list: Sensor[]) => (
        <div className={styles.sensorList}>
            {list.map((sensor) => (
                <div
                    key={sensor.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, sensor)}
                    className={styles.draggableSensor}
                >
                    <div className={styles.dragHandle}>
                        <Icon icon="DragIndicator" />
                    </div>
                    <div className={styles.sensorInfo}>
                        <div className="fw-bold text-truncate" title={sensor.name}>
                            {sensor.name}
                        </div>
                        <div className="small text-muted">{sensor.sensor_type}</div>
                    </div>
                    <Badge
                        color={sensor.status === 'Critical' ? 'danger' : 'success'}
                        isLight
                        className="ms-auto"
                    >
                        {sensor.status || 'Active'}
                    </Badge>
                </div>
            ))}
        </div>
    );

    return (
        <Card className={styles.paletteCard}>
            <CardHeader>
                <CardTitle>
                    <Icon icon="Sensors" className="me-2" />
                    Sensor Palette
                </CardTitle>
                <Badge color="info" isLight>
                    {sensors.length}
                </Badge>
            </CardHeader>
            <CardBody className={styles.paletteBody}>
                {sensors.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        <Icon icon="CheckCircle" className="fs-3 mb-2" />
                        <p className="mb-0">All sensors placed</p>
                    </div>
                ) : (
                    <>
                        {localSensors.length > 0 && (
                            <div className="mb-4">
                                <h6 className={styles.sectionTitle}>
                                    <Icon icon="Room" size="sm" className="me-1" />
                                    Assigned to this Area
                                </h6>
                                {renderSensorList(localSensors)}
                            </div>
                        )}

                        {globalSensors.length > 0 && (
                            <div>
                                <h6 className={styles.sectionTitle}>
                                    <Icon icon="Language" size="sm" className="me-1" />
                                    Global Sensor Pool
                                </h6>
                                {renderSensorList(globalSensors)}
                            </div>
                        )}
                    </>
                )}
            </CardBody>
        </Card>
    );
};

export default SensorPalette;
