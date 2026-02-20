import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import MaterialTable from '@material-table/core';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Spinner from '../../../../components/bootstrap/Spinner';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../../components/bootstrap/Modal';
import { useSoundFiles, useAddSoundFile, useDeleteSoundFile } from '../../../../api/sensors.api';
import { SoundFile } from '../../../../types/sensor';
import useTablestyle from '../../../../hooks/useTablestyles';
import { debounceIntervalForTable, pageSizeOptions } from '../../../../helpers/constants';

const AudioManagementSection = () => {
    const { data: soundFiles, isLoading } = useSoundFiles();
    const addSoundMutation = useAddSoundFile();
    const deleteSoundMutation = useDeleteSoundFile();
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(5);
    const { theme, headerStyles, rowStyles } = useTablestyle();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [soundToDelete, setSoundToDelete] = useState<SoundFile | null>(null);

    const filteredSounds = soundFiles?.filter(s => {
        const name = (s.name || '').toLowerCase();
        const fileName = (s.file_name || '').toLowerCase();
        const term = searchTerm.toLowerCase();
        return name.includes(term) || fileName.includes(term);
    });

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.toLowerCase().endsWith('.wav')) {
                alert('Please upload a .wav file only.');
                e.target.value = '';
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name);
            addSoundMutation.mutate(formData, {
                onSuccess: () => {
                    e.target.value = '';
                }
            });
        }
    };

    const handleDelete = (sound: SoundFile) => {
        setSoundToDelete(sound);
        setIsDeleteModalOpen(true);
    };

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
                                    onChange={handleUpload}
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
                                <span className='input-group-text'><Icon icon='Search' /></span>
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
                                                onClick={() => handleDelete(rowData)}
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

                {/* ── Delete Confirmation Modal ── */}
                <Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} size='sm' isCentered>
                    <ModalHeader setIsOpen={setIsDeleteModalOpen} className='border-0 pb-0'>
                        <ModalTitle id='delete-sound-confirm-title' className='text-danger'>
                            Confirm Deletion
                        </ModalTitle>
                    </ModalHeader>
                    <ModalBody className='text-center py-4'>
                        <div
                            className='mx-auto mb-3 d-flex align-items-center justify-content-center'
                            style={{
                                width: '60px',
                                height: '60px',
                                background: 'rgba(239, 79, 79, 0.1)',
                                borderRadius: '50%',
                                color: '#ef4f4f'
                            }}
                        >
                            <Icon icon='DeleteSweep' size='2x' />
                        </div>
                        <div className='fw-bold fs-5 mb-2'>Delete sound file?</div>
                        <div className='text-muted small px-3'>
                            Are you sure you want to delete <span className='fw-bold text-dark'>{soundToDelete?.name}</span>? This action cannot be undone.
                        </div>
                    </ModalBody>
                    <ModalFooter className='justify-content-center border-0 pt-0 pb-4 gap-2'>
                        <Button
                            color='light'
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setSoundToDelete(null);
                            }}
                            className='px-4'
                        >
                            Cancel
                        </Button>
                        <Button
                            color='danger'
                            onClick={() => {
                                if (soundToDelete) {
                                    deleteSoundMutation.mutate(soundToDelete.id, {
                                        onSuccess: () => {
                                            setIsDeleteModalOpen(false);
                                            setSoundToDelete(null);
                                        }
                                    });
                                }
                            }}
                            className='px-4 shadow-sm'
                        >
                            Delete File
                        </Button>
                    </ModalFooter>
                </Modal>
            </CardBody>
        </Card>
    );
};

export default AudioManagementSection;
