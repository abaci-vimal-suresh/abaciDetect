import React from 'react'
import { TColor } from '../../../../type/color-type'
import classNames from 'classnames'
import useDarkMode from '../../../../hooks/useDarkMode'
import Icon from '../../../../components/icon/Icon'
import { Tooltip } from '@mui/material'
import { useForm } from 'react-hook-form'

const EditButton = ({ data, bg_color, icon, display_name, value, onChange, editModalToggle }: any) => {
    const { darkModeStatus } = useDarkMode();
    const { register, handleSubmit } = useForm({
        defaultValues: {
            value: value
        }
    });
    return (
        <div
            className={classNames(
                'd-flex align-items-center rounded-2 p-3 w-100 h-100',
                {
                    [`bg-l10-${bg_color}`]: !darkModeStatus,
                    [`bg-lo25-${bg_color}`]: darkModeStatus,
                },
            )}>
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
            <div className='flex-grow-1 ms-3 d-flex flex-column'>
                <div className='text-muted small mb-2 fw-semibold  letter-spacing-1 truncate-line-1 '>
                    {display_name || ''}
                </div>
                <div className='d-flex gap-1 flex-grow-1 align-items-center'>
                    <div className='fw-bold fs-4 mb-0'>
                        {value || ''}
                    </div>
                </div>

            </div>
            <Tooltip title={`Edit ${display_name || ''}`} arrow>
                <Icon icon='Edit' size='2x' color={bg_color as TColor} style={{ cursor: 'pointer' }}
                    onClick={() => editModalToggle(display_name, data)}
                />
            </Tooltip>
        </div>
    )

}

export default EditButton