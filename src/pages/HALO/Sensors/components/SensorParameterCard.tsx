import React from 'react';
import styles from './SensorParameterCard.module.scss';
import Icon from '../../../../components/icon/Icon';

export interface SensorParameterCardProps {
    label: string;
    value: number;
    unit: string;
    min: number;
    max: number;
    threshold: number;
    status: 'safe' | 'warning' | 'critical';
    icon?: string;
    isSelected?: boolean;
    onClick?: () => void;
    criticalLocations?: string[];
    isCompact?: boolean;
}

const SensorParameterCard: React.FC<SensorParameterCardProps> = ({
    label,
    value,
    unit,
    min,
    max,
    threshold,
    status,
    icon = 'Analytics',
    isSelected = true,
    onClick,
    criticalLocations = [],
    isCompact = false
}) => {
    // Determine color based on status
    const getStatusColor = () => {
        switch (status) {
            case 'safe': return '#10B981'; // Green
            case 'warning': return '#F59E0B'; // Orange
            case 'critical': return '#EF4444'; // Red
            default: return '#10B981';
        }
    };

    const statusColor = getStatusColor();
    const isThresholdReached = status === 'critical';

    // Calculate progress percentage
    const range = max - min;
    const progress = Math.min(Math.max(((value - min) / range) * 100, 0), 100);

    // Dynamic Gradient for Progress Bar
    const getProgressGradient = () => {
        if (status === 'critical') return 'linear-gradient(90deg, #10B981, #F59E0B, #EF4444)';
        if (status === 'warning') return 'linear-gradient(90deg, #10B981, #F59E0B)';
        return 'linear-gradient(90deg, #10B981, #10B981)';
    };

    return (
        <div
            className={`${styles.card} ${!isSelected ? styles.deselected : ''}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className={styles.content} style={{ '--status-color': statusColor } as React.CSSProperties}>
                <div className={styles.iconWrapper}>
                    <Icon icon={icon} size="lg" />
                </div>
                <div className={styles.valueDisplay}>
                    <span className={styles.minValue}>MIN-{min}</span>
                    <span className={styles.maxValue}>MAX-{max}</span>
                </div>
                <div className={styles.unit}>{unit}</div>
                <strong className={styles.parameterName}>{label}</strong>

                {status === 'critical' && (
                    <div className={styles.statusIndicator}>
                        <span className={styles.statusDot} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SensorParameterCard;
