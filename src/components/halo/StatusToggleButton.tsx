import React from 'react';
import Checks from '../bootstrap/forms/Checks';
import classNames from 'classnames';

interface StatusToggleButtonProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    className?: string;
}

const StatusToggleButton: React.FC<StatusToggleButtonProps> = ({ id, checked, onChange, label, className }) => {
    return (
        <Checks
            type='switch'
            id={id}
            label={label}
            checked={checked}
            onChange={(e: any) => onChange(e.target.checked)}
            className={classNames('status-toggle-button', className)}
        />
    );
};

export default StatusToggleButton;
