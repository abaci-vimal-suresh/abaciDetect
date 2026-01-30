import React from 'react';
import { Sensor } from '../../../../types/sensor';
import Icon from '../../../../components/icon/Icon';
import styles from './SensorPalette.module.scss';
// Note: Card/Badge imports removed for aesthetic slim design

interface SensorPaletteProps {
    sensors: Sensor[];
    currentAreaId?: number;
    onDragStart: (e: React.DragEvent, sensor: Sensor) => void;
}

const SensorPalette: React.FC<SensorPaletteProps> = ({ sensors, currentAreaId, onDragStart }) => {
    const localSensors = sensors.filter(s => {
        const sAreaId = typeof s.area === 'object' && s.area !== null ? s.area.id : (s.area || s.area_id);
        return Number(sAreaId) === Number(currentAreaId);
    });

    const globalSensors = sensors.filter(s => {
        const sAreaId = typeof s.area === 'object' && s.area !== null ? s.area.id : (s.area || s.area_id);
        return Number(sAreaId) !== Number(currentAreaId);
    });

    const renderSensorList = (list: Sensor[]) => (
        <div className={styles.sensorList}>
            {list.map((sensor) => {
                const isActive = sensor.is_active;
                const statusClass = isActive ? 'active' : 'inactive';

                return (
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
                            <div className={styles.name} title={sensor.name}>
                                {sensor.name.substring(0, 4)}..
                            </div>
                            <div className={styles.type}>{sensor.sensor_type}</div>
                        </div>
                        <div className={`${styles.statusIndicator} ${styles[statusClass]}`} title={isActive ? 'Active' : 'Inactive'} />
                    </div>
                )
            })}
        </div>
    );

    return (
        <div className={styles.paletteContainer}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <Icon icon="Sensors" className="me-2" size="sm" />
                    Palette
                </div>
                <div className={styles.countBadge}>
                    {sensors.length}
                </div>
            </div>

            {sensors.length === 0 ? (
                <div className="text-center text-muted py-4 d-flex flex-column align-items-center opacity-50">
                    <Icon icon="CheckCircle" className="fs-4 mb-2" />
                    <p className="mb-0 small" style={{ fontSize: '0.7rem' }}>All Placed</p>
                </div>
            ) : (
                <>
                    {localSensors.length > 0 && (
                        <div className="mb-3">
                            <div className={styles.sectionTitle}>
                                <Icon icon="Room" size="sm" className="me-1" style={{ opacity: 0.7 }} />
                                Area Sensors
                            </div>
                            {renderSensorList(localSensors)}
                        </div>
                    )}

                    {globalSensors.length > 0 && (
                        <div>
                            <div className={styles.sectionTitle}>
                                <Icon icon="Language" size="sm" className="me-1" style={{ opacity: 0.7 }} />
                                Global Pool
                            </div>
                            {renderSensorList(globalSensors)}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SensorPalette;
