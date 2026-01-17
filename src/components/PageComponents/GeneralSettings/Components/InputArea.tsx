import React, { useState } from 'react'
import { TColor } from '../../../../type/color-type'
import classNames from 'classnames'
import useDarkMode from '../../../../hooks/useDarkMode'
import Icon from '../../../../components/icon/Icon'
import { Tooltip } from '@mui/material'
import { useForm } from 'react-hook-form'
import { Spinner } from 'reactstrap'

const InputArea = ({ data, bg_color, icon, display_name, value, onChange }: any) => {
    const { darkModeStatus } = useDarkMode();
    const [isEditing, setIsEditing] = useState(false);
    const [waitingForAxios, setWaitingForAxios] = useState(false);
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            value: value
        }
    });

    const handleEdit = () => {
        setIsEditing(true);
        reset({ value: value });
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
        reset({ value: value });
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
                {!isEditing ? (
                    <div className='d-flex align-items-center justify-content-between gap-1'>
                        <div
                            className='fw-bold'
                            style={{
                                fontSize: '1.75rem',
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
                ) : (
                    <div className='d-flex align-items-center justify-content-between gap-2'>
                        <input
                            type='number'
                            {...register('value')}
                            className={classNames(
                                'form-control form-control-lg border-0 shadow-none',
                                {
                                    'bg-transparent': true,
                                    'text-dark': !darkModeStatus,
                                    'text-light': darkModeStatus,
                                }
                            )}
                            style={{
                                fontSize: '1.75rem',
                                fontWeight: '600',
                                padding: '0.5rem 0.75rem',
                                maxWidth: '200px',
                                border: `2px solid ${darkModeStatus ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                                borderRadius: '8px',
                                transition: 'all 0.3s ease',
                            }}

                            autoFocus
                        />
                        <div className='d-flex align-items-center gap-2'>
                            <Tooltip title='Save' arrow>
                                <div
                                    className={classNames(
                                        'rounded-2 p-2  d-flex align-items-center justify-content-center',
                                        {
                                            [`bg-success`]: true,
                                        }
                                    )}
                                    style={{
                                        cursor: 'pointer',
                                        boxShadow: 'none'
                                    }}

                                    onClick={handleSubmit(handleSave)}
                                >
                                    {waitingForAxios ? <Spinner size='sm' color='light' /> : <Icon icon='Done' size='lg' color='light' />}
                                </div>
                            </Tooltip>
                            <Tooltip title='Cancel' arrow>
                                <div
                                    className={classNames(
                                        'rounded-2 p-2  d-flex align-items-center justify-content-center',  
                                        {
                                            'bg-secondary': true,
                                        }
                                    )}
                                    style={{
                                        cursor: 'pointer',
                                    }}

                                    onClick={handleCancel}
                                >
                                    <Icon icon='Close' size='lg' color='light' />
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

}

export default InputArea