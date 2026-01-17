import React, { useState, useEffect } from 'react'
import { TColor } from '../../../../type/color-type'
import classNames from 'classnames'
import useDarkMode from '../../../../hooks/useDarkMode'
import Icon from '../../../../components/icon/Icon'
import { FormControlLabel, Switch, Tooltip } from '@mui/material'
import { useForm } from 'react-hook-form'
import { Spinner } from 'reactstrap'

const ChangeValueWithToggleButton = ({ data, bg_color, icon, display_name, value, onChange }: any) => {
    const { darkModeStatus } = useDarkMode();
    const [isEditing, setIsEditing] = useState(false);
    
    // Convert value to boolean: handle strings, numbers, and booleans
    const normalizeToBoolean = (val: any): boolean => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') {
            return val.toLowerCase() === 'true' || val === '1';
        }
        if (typeof val === 'number') {
            return val !== 0;
        }
        return Boolean(val);
    };
    
    const [toggleValue, setToggleValue] = useState(normalizeToBoolean(value));
    const [waitingForAxios, setWaitingForAxios] = useState(false);

    // Update toggleValue when value prop changes
    useEffect(() => {
        setToggleValue(normalizeToBoolean(value));
    }, [value]);

    const handleEdit = () => {
        setIsEditing(true);
        setToggleValue(normalizeToBoolean(value));
    };

 
    const handleSave = (data: any) => {
        setWaitingForAxios(true);
        onChange(data.value, data).then(()=>{
            setWaitingForAxios(false);
            setIsEditing(false);
        }).catch(()=>{
            setWaitingForAxios(false);
        });
    };

    const handleCancel = () => {
        setToggleValue(normalizeToBoolean(value));
        setIsEditing(false);
    };
    return (
        <div
            className={classNames(
                'd-flex align-items-center rounded-3 p-4 shadow-sm w-100 h-100',
                {
                    [`bg-l10-${bg_color}`]: !darkModeStatus,
                    [`bg-lo25-${bg_color}`]: darkModeStatus,
                },
            )}
        >
            <div className='flex-shrink-0'>
                <div
                    className={classNames('rounded-circle p-3', {
                        [`bg-${bg_color}-subtle`]: !darkModeStatus,
                        [`bg-${bg_color}-opacity`]: darkModeStatus,
                    })}

                >
                    <Icon icon={icon} size='2x' color={bg_color as TColor} />
                </div>
            </div>
            <div className='flex-grow-1 ms-4 d-flex flex-column'>
                <div className='text-muted small mb-2 fw-semibold  letter-spacing-1'>
                    {display_name || ''}
                </div>
                {/* {!isEditing ? (
                    <div className='d-flex align-items-center justify-content-between gap-1'>
                        <div
                            className='fw-bold'
                            style={{
                                fontSize: '1.5rem',
                                color: darkModeStatus ? '#fff' : '#212529',
                            }}
                        >
                            {value || '0'}
                        </div>
                        <Tooltip title={`Edit ${display_name || ''}`} arrow>
                            <Icon icon='Edit' size='2x' color={bg_color as TColor} style={{ cursor: 'pointer' }}
                                onClick={handleEdit}
                            />
                        </Tooltip>
                    </div>
                ) : ( */}
                    <div className='d-flex align-items-center justify-content-between gap-2'>
                        <div className='d-flex align-items-center '>
                            <FormControlLabel
                                control={
                                    <Switch
                                        id=''
                                        checked={toggleValue}
                                        onChange={(e:any) => setToggleValue(!toggleValue)}
                                        color='success'
                                        onClick={()=>handleSave({value:!toggleValue})}
                                    />
                                }
                                label=''
                                // label={toggleValue ? 'Enabled' : 'Disabled'}
                            />
                        </div>
                        {/* <div className='d-flex align-items-center gap-2'>
                            <Tooltip title='Save' arrow>
                                <div
                                    className={classNames(
                                        'rounded-circle p-2 d-flex align-items-center justify-content-center',
                                        {
                                            [`bg-${bg_color}`]: true,
                                        }
                                    )}
                                    style={{
                                        cursor: 'pointer',
                                        minWidth: '36px',
                                        minHeight: '36px',
                                    }}

                                    onClick={()=>handleSave({value:toggleValue})}
                                >
                                    {waitingForAxios ? <Spinner size='sm' color='light' /> : <Icon icon='Done' size='sm' color='light' />}
                                </div>
                            </Tooltip>
                            <Tooltip title='Cancel' arrow>
                                <div
                                    className={classNames(
                                        'rounded-circle p-2 d-flex align-items-center justify-content-center',
                                        {
                                            'bg-secondary': true,
                                        }
                                    )}
                                    style={{
                                        cursor: 'pointer',
                                        minWidth: '36px',
                                        minHeight: '36px',
                                    }}

                                    onClick={handleCancel}
                                >
                                    <Icon icon='Close' size='sm' color='light' />
                                </div>
                            </Tooltip>
                        </div> */}
                    </div>
                {/* )} */}
            </div>
        </div>
    )

}

export default ChangeValueWithToggleButton