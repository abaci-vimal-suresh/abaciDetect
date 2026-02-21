import React, { useState } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Spinner from '../../../../components/bootstrap/Spinner';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import { Area } from '../../../../types/sensor';

interface AddSensorModalProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    // Zone context (used in AreaZoneView)
    zoneName?: string;
    isSubzone?: boolean;
    areaId?: string;
    parentAreaName?: string;
    childSubAreas?: Area[];
    // Available sensors to assign
    availableSensors: any[];
    isPending: boolean;
    onSubmit: (params: {
        sensorId: string;
        targetAreaId: string;
        x: number;
        y: number;
        z: number;
    }) => void;
    // Simple mode (AreaMain): just area + sensor selectors, no coordinates
    simpleMode?: boolean;
    mainAreas?: Area[];
}

const AddSensorModal: React.FC<AddSensorModalProps> = ({
    isOpen,
    setIsOpen,
    zoneName,
    isSubzone,
    areaId,
    parentAreaName,
    childSubAreas,
    availableSensors,
    isPending,
    onSubmit,
    simpleMode = false,
    mainAreas = [],
}) => {
    const [selectedSensorId, setSelectedSensorId] = useState('');
    const [selectedAreaId, setSelectedAreaId] = useState('');
    const [sensorX, setSensorX] = useState(0);
    const [sensorY, setSensorY] = useState(0);
    const [sensorZ, setSensorZ] = useState(0);

    const handleClose = () => {
        setIsOpen(false);
        setSelectedSensorId('');
        setSelectedAreaId('');
        setSensorX(0);
        setSensorY(0);
        setSensorZ(0);
    };

    const handleSubmit = () => {
        if (simpleMode) {
            if (!selectedSensorId || !selectedAreaId) return;
            onSubmit({ sensorId: selectedSensorId, targetAreaId: selectedAreaId, x: 0, y: 0, z: 0 });
        } else {
            const targetId = isSubzone ? (areaId || '') : (selectedAreaId || areaId || '');
            if (!selectedSensorId || !targetId) return;
            onSubmit({ sensorId: selectedSensorId, targetAreaId: targetId, x: sensorX, y: sensorY, z: sensorZ });
        }
    };

    const isDisabled = simpleMode
        ? (!selectedSensorId || !selectedAreaId || isPending)
        : (!selectedSensorId || isPending);

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered>
            <ModalHeader setIsOpen={setIsOpen}>
                <ModalTitle id='add-sensor-title'>
                    {simpleMode ? 'Add Sensor to Area' : `Add Sensor to ${zoneName}`}
                </ModalTitle>
            </ModalHeader>
            <ModalBody>
                {/* Simple mode: area selector (AreaMain) */}
                {simpleMode && (
                    <div className='mb-3'>
                        <label className='form-label'>Select Area</label>
                        <select
                            className='form-select mb-3'
                            value={selectedAreaId}
                            onChange={(e) => setSelectedAreaId(e.target.value)}
                        >
                            <option value=''>Choose an area...</option>
                            {mainAreas.map(area => (
                                <option key={area.id} value={area.id}>
                                    {area.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Zone mode: target sub-area selector (AreaZoneView, non-subzone) */}
                {!simpleMode && !isSubzone && (
                    <div className='mb-3'>
                        <label className='form-label'>Target Area</label>
                        <select
                            className='form-select'
                            value={selectedAreaId || areaId || ''}
                            onChange={(e) => setSelectedAreaId(e.target.value)}
                        >
                            <option value={areaId}>Main Area ({parentAreaName})</option>
                            {childSubAreas?.map(sub => (
                                <option key={sub.id} value={sub.id}>Sub Area: {sub.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Sensor selector — always shown */}
                <div className='mb-3'>
                    <label className='form-label'>Select Available Sensor</label>
                    <select
                        className='form-select'
                        value={selectedSensorId}
                        onChange={(e) => setSelectedSensorId(e.target.value)}
                        disabled={simpleMode ? !selectedAreaId : false}
                    >
                        <option value=''>Choose a sensor...</option>
                        {availableSensors.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} - {s.mac_address} ({s.sensor_type})
                            </option>
                        ))}
                    </select>
                    {availableSensors.length === 0 && (
                        <div className='text-muted small mt-2'>
                            No unassigned sensors available. All sensors are already assigned.
                        </div>
                    )}
                </div>

                {/* Coordinates — only in zone mode */}
                {!simpleMode && (
                    <div className='border-top pt-3 mt-3'>
                        <label className='form-label fw-bold mb-3'>
                            <Icon icon='Place' size='sm' className='me-1' />
                            Placement Coordinates
                        </label>
                        <div className='row g-3'>
                            <div className='col-md-4'>
                                <FormGroup label='X'>
                                    <Input type='number' step={0.1} value={sensorX} onChange={(e: any) => setSensorX(parseFloat(e.target.value) || 0)} />
                                </FormGroup>
                            </div>
                            <div className='col-md-4'>
                                <FormGroup label='Y'>
                                    <Input type='number' step={0.1} value={sensorY} onChange={(e: any) => setSensorY(parseFloat(e.target.value) || 0)} />
                                </FormGroup>
                            </div>
                            <div className='col-md-4'>
                                <FormGroup label='Z'>
                                    <Input type='number' step={0.1} value={sensorZ} onChange={(e: any) => setSensorZ(parseFloat(e.target.value) || 0)} />
                                </FormGroup>
                            </div>
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color='light' onClick={handleClose}>Cancel</Button>
                <Button color='primary' onClick={handleSubmit} isDisable={isDisabled}>
                    {isPending && <Spinner isSmall inButton />}
                    Add Sensor
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default AddSensorModal;