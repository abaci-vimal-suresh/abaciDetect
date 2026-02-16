import React, { useState } from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import SubHeader, { SubHeaderLeft } from '../../layout/SubHeader/SubHeader';
import Breadcrumb from '../../components/bootstrap/Breadcrumb';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';
import Spinner from '../../components/bootstrap/Spinner';
import { useSoundFiles, useAddSoundFile, useDeleteSoundFile } from '../../api/sensors.api';
import { SoundFile } from '../../types/sensor';

const HaloSettings = () => {
    const { data: soundFiles, isLoading } = useSoundFiles();
    const addSoundMutation = useAddSoundFile();
    const deleteSoundMutation = useDeleteSoundFile();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSounds = soundFiles?.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this sound file?')) {
            deleteSoundMutation.mutate(id);
        }
    };

    return (
        <PageWrapper title='HALO System Settings'>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb
                        list={[
                            { title: 'HALO', to: '/halo' },
                            { title: 'System Settings', to: '/halo/system-settings' },
                        ]}
                    />
                </SubHeaderLeft>
            </SubHeader>
            <Page container='fluid'>
                <div className='row'>
                    <div className='col-12'>
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

                                <div className='table-responsive'>
                                    <table className='table table-modern table-hover mb-0'>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Size</th>
                                                <th>Uploaded Date</th>
                                                <th className='text-end'>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={5} className='text-center py-4'>
                                                        <Spinner color='primary' />
                                                    </td>
                                                </tr>
                                            ) : filteredSounds && filteredSounds.length > 0 ? (
                                                filteredSounds.map((sound: SoundFile) => (
                                                    <tr key={sound.id}>
                                                        <td className='fw-bold'>{sound.name}</td>
                                                        <td>{sound.file_size !== null ? `${(sound.file_size / 1024).toFixed(2)} KB` : 'N/A'}</td>
                                                        <td>{new Date(sound.uploaded_at).toLocaleDateString()}</td>
                                                        <td className='text-end'>
                                                            {sound.file_size !== null && (
                                                                <Button
                                                                    color='danger'
                                                                    isLight
                                                                    size='sm'
                                                                    icon='Delete'
                                                                    isDisable={deleteSoundMutation.isPending}
                                                                    onClick={() => handleDelete(sound.id)}
                                                                />
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className='text-center py-4 text-muted'>
                                                        No sound files found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default HaloSettings;
