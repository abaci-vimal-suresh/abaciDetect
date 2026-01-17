import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardFooter } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Spinner from '../../../../components/bootstrap/Spinner';
import Alert from '../../../../components/bootstrap/Alert';
import Icon from '../../../../components/icon/Icon';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import { useThresholds, useUpdateThresholds } from '../../../../api/device.setting.api';

interface SafetySecuritySectionProps {
    deviceId: string;
}

const SafetySecuritySection: React.FC<SafetySecuritySectionProps> = ({ deviceId }) => {
    const { data: thresholds, isLoading } = useThresholds(deviceId);
    const updateMutation = useUpdateThresholds();

    const [gunshotSensitivity, setGunshotSensitivity] = useState(70);
    const [aggressionSensitivity, setAggressionSensitivity] = useState(70);
    const [audioAnalysisEnabled, setAudioAnalysisEnabled] = useState(true);
    const [privacyMode, setPrivacyMode] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (thresholds) {
            setAggressionSensitivity(thresholds.aggression_sensitivity || 70);
        }
    }, [thresholds]);

    const handleSave = () => {
        updateMutation.mutate(
            {
                device_id: parseInt(deviceId),
                aggression_sensitivity: aggressionSensitivity,
            },
            {
                onSuccess: () => {
                    setSuccessMessage('Safety & security settings updated');
                    setTimeout(() => setSuccessMessage(''), 3000);
                },
            }
        );
    };

    if (isLoading) {
        return (
            <Card>
                <CardBody className='text-center py-5'>
                    <Spinner color='primary' />
                </CardBody>
            </Card>
        );
    }

    return (
        <div className='row g-4'>
            {/* Gunshot Detection */}
            <div className='col-12'>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Icon icon='ReportProblem' className='me-2 text-danger' />
                            Gunshot Detection
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        {successMessage && (
                            <Alert color='success' icon='CheckCircle' className='mb-4'>
                                {successMessage}
                            </Alert>
                        )}

                        <Alert color='warning' icon='Warning' className='mb-3'>
                            Gunshot detection uses audio analysis. Ensure this complies with local privacy laws.
                        </Alert>

                        <FormGroup label={`Detection Sensitivity: ${gunshotSensitivity}%`}>
                            <input
                                type='range'
                                className='form-range'
                                min='0'
                                max='100'
                                value={gunshotSensitivity}
                                onChange={(e) => setGunshotSensitivity(parseInt(e.target.value))}
                            />
                            <small className='text-muted'>
                                Lower = fewer false positives, Higher = more sensitive
                            </small>
                        </FormGroup>

                        <div className='mt-3'>
                            <Button color='info' isLight icon='Science'>
                                Test Detection
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Aggression Detection */}
            <div className='col-12'>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Icon icon='RecordVoiceOver' className='me-2 text-warning' />
                            Aggression Detection
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        <Alert color='info' icon='Info' className='mb-3'>
                            Monitors audio for aggressive speech patterns and raised voices.
                        </Alert>

                        <FormGroup label={`Detection Sensitivity: ${aggressionSensitivity}%`}>
                            <input
                                type='range'
                                className='form-range'
                                min='0'
                                max='100'
                                value={aggressionSensitivity}
                                onChange={(e) => setAggressionSensitivity(parseInt(e.target.value))}
                            />
                            <small className='text-muted'>
                                Adjust based on typical environment noise levels
                            </small>
                        </FormGroup>
                    </CardBody>
                </Card>
            </div>

            {/* Privacy Settings */}
            <div className='col-12'>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Icon icon='PrivacyTip' className='me-2 text-primary' />
                            Privacy Settings
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        <div className='row g-3'>
                            <div className='col-12'>
                                <Card className='shadow-sm'>
                                    <CardBody>
                                        <div className='d-flex justify-content-between align-items-center'>
                                            <div>
                                                <h6 className='mb-1'>Audio Analysis</h6>
                                                <small className='text-muted'>
                                                    Enable audio-based detection features
                                                </small>
                                            </div>
                                            <div className='form-check form-switch'>
                                                <input
                                                    className='form-check-input'
                                                    type='checkbox'
                                                    checked={audioAnalysisEnabled}
                                                    onChange={(e) => setAudioAnalysisEnabled(e.target.checked)}
                                                    style={{ width: '3rem', height: '1.5rem' }}
                                                />
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            <div className='col-12'>
                                <Card className='shadow-sm'>
                                    <CardBody>
                                        <div className='d-flex justify-content-between align-items-center'>
                                            <div>
                                                <h6 className='mb-1'>Privacy Mode</h6>
                                                <small className='text-muted'>
                                                    Disable all audio recording and analysis
                                                </small>
                                            </div>
                                            <div className='form-check form-switch'>
                                                <input
                                                    className='form-check-input'
                                                    type='checkbox'
                                                    checked={privacyMode}
                                                    onChange={(e) => setPrivacyMode(e.target.checked)}
                                                    style={{ width: '3rem', height: '1.5rem' }}
                                                />
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>

                        {privacyMode && (
                            <Alert color='warning' icon='Warning' className='mt-3 mb-0'>
                                Privacy mode disables: Gunshot detection, Aggression detection, and Noise monitoring.
                            </Alert>
                        )}
                    </CardBody>
                    <CardFooter>
                        <Button
                            color='primary'
                            onClick={handleSave}
                            isDisable={updateMutation.isPending}
                        >
                            {updateMutation.isPending && <Spinner isSmall inButton />}
                            Save Settings
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Access Control */}
            <div className='col-12'>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Icon icon='SupervisedUserCircle' className='me-2' />
                            Access Control
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        <Alert color='info' icon='Info' className='mb-3'>
                            Manage who can view and edit this device's data and settings.
                        </Alert>

                        <div className='table-responsive'>
                            <table className='table'>
                                <thead>
                                    <tr>
                                        <th>User / Role</th>
                                        <th>View Data</th>
                                        <th>Edit Settings</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Admin</td>
                                        <td>✅</td>
                                        <td>✅</td>
                                        <td>
                                            <span className='badge bg-primary'>Owner</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Security Team</td>
                                        <td>✅</td>
                                        <td>❌</td>
                                        <td>
                                            <Button color='danger' size='sm' isLight>
                                                Remove
                                            </Button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <Button color='primary' icon='Add' isLight>
                            Add User
                        </Button>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default SafetySecuritySection;