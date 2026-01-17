import React, { useState } from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Spinner from '../../../../components/bootstrap/Spinner';
import Alert from '../../../../components/bootstrap/Alert';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../../components/bootstrap/Modal';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import {
    useScheduledThresholds,
    useDeviceProfiles,
    useAPIKeys,
    useGenerateAPIKey,
    useAutomationRules,
} from '../../../../api/device.setting.api';
import Input from '../../../../components/bootstrap/forms/Input';

interface AdvancedFeaturesSectionProps {
    deviceId: string;
}

const AdvancedFeaturesSection: React.FC<AdvancedFeaturesSectionProps> = ({ deviceId }) => {
    const { data: schedules, isLoading: schedulesLoading } = useScheduledThresholds(deviceId);
    const { data: profiles, isLoading: profilesLoading } = useDeviceProfiles(deviceId);
    const { data: apiKeys, isLoading: keysLoading } = useAPIKeys(deviceId);
    const { data: rules, isLoading: rulesLoading } = useAutomationRules(deviceId);
    const generateKey = useGenerateAPIKey();

    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [keyName, setKeyName] = useState('');
    const [keyPermissions, setKeyPermissions] = useState<string[]>([]);
    const [generatedKey, setGeneratedKey] = useState('');

    const handleGenerateKey = () => {
        generateKey.mutate(
            {
                device_id: parseInt(deviceId),
                key_name: keyName,
                permissions: keyPermissions,
            },
            {
                onSuccess: (data) => {
                    setGeneratedKey(data.api_key || '');
                    setKeyName('');
                    setKeyPermissions([]);
                },
            }
        );
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('API Key copied to clipboard!');
    };

    if (schedulesLoading || profilesLoading || keysLoading || rulesLoading) {
        return (
            <Card>
                <CardBody className='text-center py-5'>
                    <Spinner color='primary' />
                </CardBody>
            </Card>
        );
    }

    return (
        <>
            <div className='row g-4'>
                {/* Scheduled Thresholds */}
                <div className='col-12'>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                <Icon icon='Schedule' className='me-2' />
                                Scheduled Threshold Profiles
                            </CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Alert color='info' icon='Info' className='mb-3'>
                                Set different thresholds for different times (e.g., higher noise limits during business hours).
                            </Alert>
                            {schedules && schedules.length > 0 ? (
                                <div className='row g-3'>
                                    {schedules.map((schedule) => (
                                        <div key={schedule.id} className='col-md-6'>
                                            <Card className='shadow-sm'>
                                                <CardBody>
                                                    <div className='d-flex justify-content-between mb-2'>
                                                        <h6>{schedule.profile_name}</h6>
                                                        <Badge color={schedule.enabled ? 'success' : 'secondary'}>
                                                            {schedule.enabled ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </div>
                                                    <div className='small text-muted'>
                                                        <div>⏰ {schedule.start_time} - {schedule.end_time}</div>
                                                        <div>📅 Days: {schedule.days_of_week.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}</div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Alert color='secondary'>No scheduled threshold profiles configured.</Alert>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Device Profiles */}
                <div className='col-12'>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                <Icon icon='Layers' className='me-2' />
                                Device Profiles
                            </CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Alert color='info' icon='Info' className='mb-3'>
                                Save complete device configurations as profiles for quick switching.
                            </Alert>
                            {profiles && profiles.length > 0 ? (
                                <div className='row g-3'>
                                    {profiles.map((profile) => (
                                        <div key={profile.id} className='col-md-4'>
                                            <Card className={`shadow-sm ${profile.is_active ? 'border-success' : ''}`}>
                                                <CardBody>
                                                    <div className='d-flex justify-content-between mb-2'>
                                                        <h6>{profile.profile_name}</h6>
                                                        {profile.is_active && (
                                                            <Badge color='success'>Active</Badge>
                                                        )}
                                                    </div>
                                                    <p className='small text-muted'>{profile.description}</p>
                                                    {!profile.is_active && (
                                                        <Button color='primary' size='sm' isLight className='w-100'>
                                                            Activate Profile
                                                        </Button>
                                                    )}
                                                </CardBody>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Alert color='secondary'>No profiles saved yet.</Alert>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* API Keys */}
                <div className='col-12'>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                <Icon icon='VpnKey' className='me-2' />
                                API Access Keys
                            </CardTitle>
                            <CardActions>
                                <Button
                                    color='primary'
                                    icon='Add'
                                    onClick={() => setIsKeyModalOpen(true)}
                                >
                                    Generate Key
                                </Button>
                            </CardActions>
                        </CardHeader>
                        <CardBody>
                            {apiKeys && apiKeys.length > 0 ? (
                                <div className='table-responsive'>
                                    <table className='table table-hover'>
                                        <thead>
                                            <tr>
                                                <th>Key Name</th>
                                                <th>Permissions</th>
                                                <th>Created</th>
                                                <th>Last Used</th>
                                                <th>Expires</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {apiKeys.map((key) => (
                                                <tr key={key.id}>
                                                    <td>{key.key_name}</td>
                                                    <td>
                                                        {key.permissions.map((p) => (
                                                            <Badge key={p} color='info' className='me-1'>
                                                                {p}
                                                            </Badge>
                                                        ))}
                                                    </td>
                                                    <td>{key.created_at ? new Date(key.created_at).toLocaleDateString() : '-'}</td>
                                                    <td>{key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}</td>
                                                    <td>{key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}</td>
                                                    <td>
                                                        <Button color='danger' size='sm' isLight icon='Delete'>
                                                            Revoke
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <Alert color='info' icon='Info'>
                                    No API keys generated. Create a key to access device data programmatically.
                                </Alert>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Automation Rules */}
                <div className='col-12'>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                <Icon icon='AutoAwesome' className='me-2' />
                                Automation Rules (IFTTT)
                            </CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Alert color='info' icon='Info' className='mb-3'>
                                Create "If This Then That" automation rules to trigger actions based on sensor events.
                            </Alert>
                            {rules && rules.length > 0 ? (
                                <div className='row g-3'>
                                    {rules.map((rule) => (
                                        <div key={rule.id} className='col-12'>
                                            <Card className='shadow-sm'>
                                                <CardBody>
                                                    <div className='d-flex justify-content-between mb-2'>
                                                        <h6>🤖 {rule.rule_name}</h6>
                                                        <Badge color={rule.enabled ? 'success' : 'secondary'}>
                                                            {rule.enabled ? 'Enabled' : 'Disabled'}
                                                        </Badge>
                                                    </div>
                                                    <div className='small'>
                                                        <strong>Trigger:</strong> {rule.trigger_event}
                                                    </div>
                                                    <div className='small text-muted mt-1'>
                                                        {rule.actions.length} action(s) configured
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Alert color='secondary'>No automation rules configured.</Alert>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Generate API Key Modal */}
            <Modal isOpen={isKeyModalOpen} setIsOpen={setIsKeyModalOpen} isCentered>
                <ModalHeader setIsOpen={setIsKeyModalOpen}>
                    <ModalTitle id='modal-title'>Generate API Key</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    {generatedKey ? (
                        <>
                            <Alert color='success' icon='CheckCircle' className='mb-3'>
                                API Key generated successfully! Copy it now - you won't see it again.
                            </Alert>
                            <FormGroup label='Your API Key'>
                                <div className='input-group'>
                                    <Input
                                        type='text'
                                        value={generatedKey}
                                        readOnly
                                        className='font-monospace'
                                    />
                                    <Button color='primary' onClick={() => copyToClipboard(generatedKey)}>
                                        Copy
                                    </Button>
                                </div>
                            </FormGroup>
                        </>
                    ) : (
                        <>
                            <FormGroup label='Key Name'>
                                <Input
                                    type='text'
                                    value={keyName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyName(e.target.value)}
                                    placeholder='e.g., Mobile App Key'
                                />
                            </FormGroup>
                            <FormGroup label='Permissions'>
                                <div className='form-check'>
                                    <input
                                        className='form-check-input'
                                        type='checkbox'
                                        id='perm-read'
                                        checked={keyPermissions.includes('read')}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setKeyPermissions([...keyPermissions, 'read']);
                                            } else {
                                                setKeyPermissions(keyPermissions.filter(p => p !== 'read'));
                                            }
                                        }}
                                    />
                                    <label className='form-check-label' htmlFor='perm-read'>
                                        Read Data
                                    </label>
                                </div>
                                <div className='form-check'>
                                    <input
                                        className='form-check-input'
                                        type='checkbox'
                                        id='perm-write'
                                        checked={keyPermissions.includes('write')}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setKeyPermissions([...keyPermissions, 'write']);
                                            } else {
                                                setKeyPermissions(keyPermissions.filter(p => p !== 'write'));
                                            }
                                        }}
                                    />
                                    <label className='form-check-label' htmlFor='perm-write'>
                                        Write Settings
                                    </label>
                                </div>
                            </FormGroup>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    {generatedKey ? (
                        <Button color='primary' onClick={() => {
                            setIsKeyModalOpen(false);
                            setGeneratedKey('');
                        }}>
                            Close
                        </Button>
                    ) : (
                        <>
                            <Button color='light' onClick={() => setIsKeyModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                color='primary'
                                onClick={handleGenerateKey}
                                isDisable={!keyName || keyPermissions.length === 0 || generateKey.isPending}
                            >
                                {generateKey.isPending && <Spinner isSmall inButton />}
                                Generate Key
                            </Button>
                        </>
                    )}
                </ModalFooter>
            </Modal>
        </>
    );
};

export default AdvancedFeaturesSection;