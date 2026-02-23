import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import MaterialTable from '@material-table/core';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Spinner from '../../../../components/bootstrap/Spinner';
import { useSoundFiles } from '../../../../api/sensors.api';
import { SoundFile } from '../../../../types/sensor';
import useTablestyle from '../../../../hooks/useTablestyles';
import { debounceIntervalForTable, pageSizeOptions } from '../../../../helpers/constants';
import { useAudioActions } from './hooks/useAudioActions';

const AudioManagementSection = () => {
    const { data: soundFiles, isLoading } = useSoundFiles();
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(5);
    const { theme, headerStyles, rowStyles } = useTablestyle();

    const { addSoundMutation, deleteSoundMutation, handleUpload, handleDeleteSound } =
        useAudioActions();

    const filteredSounds = soundFiles?.filter((s) => {
        const name = (s.name || '').toLowerCase();
        const fileName = (s.file_name || '').toLowerCase();
        const term = searchTerm.toLowerCase();
        return name.includes(term) || fileName.includes(term);
    });

    return (
        <Card stretch>
            <CardHeader>
                <CardTitle>
                    <Icon icon='VolumeUp' className='me-2' />
                    Audio Management
                </CardTitle>
            </CardHeader>
            <CardBody>
                <div className='row mb-4 g-3'>
                    <div className='col-md-8'>
                        <FormGroup label='Upload New Sound (.wav)'>
                            <div className='d-flex gap-2 align-items-center'>
                                <input
                                    type='file'
                                    className='form-control'
                                    accept='.wav,audio/wav'
                                    disabled={addSoundMutation.isPending}
                                    onChange={(e) => handleUpload(e)}
                                />
                                {addSoundMutation.isPending && <Spinner isSmall color='primary' />}
                            </div>
                            <small className='text-muted mt-1 d-block'>
                                Upload custom wave files to be used across the HALO system.
                            </small>
                        </FormGroup>
                    </div>
                    <div className='col-md-4'>
                        <FormGroup label='Search Sounds'>
                            <div className='input-group'>
                                <span className='input-group-text'>
                                    <Icon icon='Search' />
                                </span>
                                <input
                                    type='text'
                                    className='form-control'
                                    placeholder='Search by name...'
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </FormGroup>
                    </div>
                </div>

                <div style={{ overflowY: 'auto' }}>
                    <ThemeProvider theme={theme}>
                        <MaterialTable
                            title=''
                            columns={[
                                {
                                    title: 'Name',
                                    field: 'name',
                                    width: '35%',
                                    render: (rowData: SoundFile) => rowData.name,
                                },
                                {
                                    title: 'Size',
                                    field: 'file_size',
                                    width: '20%',
                                    render: (rowData: SoundFile) =>
                                        rowData.file_size !== null
                                            ? `${(rowData.file_size / 1024).toFixed(2)} KB`
                                            : 'N/A',
                                },
                                {
                                    title: 'Uploaded Date',
                                    field: 'uploaded_at',
                                    width: '30%',
                                    render: (rowData: SoundFile) =>
                                        new Date(rowData.uploaded_at).toLocaleDateString(),
                                },
                                {
                                    title: 'Actions',
                                    field: 'actions',
                                    sorting: false,
                                    filtering: false,
                                    width: '2%',
                                    cellStyle: { textAlign: 'right', paddingRight: '16px' },
                                    headerStyle: { textAlign: 'right', paddingRight: '16px' },
                                    render: (rowData: SoundFile) =>
                                        rowData.file_size !== null ? (
                                            <Button
                                                color='danger'
                                                isLight
                                                size='sm'
                                                icon='Delete'
                                                isDisable={deleteSoundMutation.isPending}
                                                onClick={() => handleDeleteSound(rowData)}
                                            />
                                        ) : null,
                                },
                            ]}
                            data={filteredSounds || []}
                            isLoading={isLoading}
                            localization={{
                                pagination: {
                                    labelRowsPerPage: '',
                                },
                            }}
                            onRowsPerPageChange={(page) => setPageSize(page)}
                            options={{
                                actionsColumnIndex: -1,
                                filtering: false,
                                pageSizeOptions: pageSizeOptions,
                                pageSize: pageSize,
                                columnsButton: false,
                                headerStyle: headerStyles(),
                                rowStyle: rowStyles(),
                                search: false,
                                debounceInterval: debounceIntervalForTable,
                            }}
                        />
                    </ThemeProvider>
                </div>
            </CardBody>
        </Card>
    );
};

export default AudioManagementSection;
