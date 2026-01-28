import React from 'react';
import styles from './StatusToggleButton.module.scss';

interface StatusToggleButtonProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
}

const StatusToggleButton: React.FC<StatusToggleButtonProps> = ({ id, checked, onChange, label = 'Status' }) => {
    return (
        <div className={styles.toggleWrapper}>
            <input
                id={id}
                type="checkbox"
                className={styles.checkbox}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <label className={styles.switch} htmlFor={id}>
                {/* Check icon for enabled state */}
                <svg viewBox="0 0 24 24" className={`${styles.svg} ${styles.enableIcon}`}>
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                {/* X icon for disabled state */}
                <svg viewBox="0 0 24 24" className={`${styles.svg} ${styles.disableIcon}`}>
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
            </label>
        </div>
    );
};

export default StatusToggleButton;