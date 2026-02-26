import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '../../../../components/bootstrap/Card';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Textarea from '../../../../components/bootstrap/forms/Textarea';
import Button from '../../../../components/bootstrap/Button';
import { AlertFilter, AlertFilterGroup } from '../../../../types/sensor';
import { useAlertFilters, useAlertFilterGroups } from '../../../../api/sensors.api';
import ReactSelect from 'react-select';

interface AlertFlowGroupFormProps {
    group: any;
    onSave: (data: any) => void;
    onCancel: () => void;
}

const AlertFlowGroupForm: React.FC<AlertFlowGroupFormProps> = ({ group, onSave, onCancel }) => {
    const [formData, setFormData] = useState<any>({
        name: '',
        description: '',
        alert_filter_ids: [],
    });

    const { data: availableFilters } = useAlertFilters();
    const { data: allGroups } = useAlertFilterGroups();

    useEffect(() => {
        if (group) {
            setFormData({
                ...group,
                alert_filter_ids: group.alert_filters?.map((f: any) => f.id) || group.alert_filter_ids || [],
            });
        }
    }, [group]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const filterOptions = availableFilters?.map((f: AlertFilter) => ({
        value: f.id,
        label: f.name,
    })) || [];

    const selectedFilters = filterOptions.filter(opt =>
        formData.alert_filter_ids?.includes(opt.value)
    );

    // If it's a new node but we want to pick an existing group
    const handlePickExisting = (selectedGroup: any) => {
        if (selectedGroup) {
            const fullGroup = allGroups?.find(g => g.id === selectedGroup.value);
            if (fullGroup) {
                setFormData({
                    ...fullGroup,
                    alert_filter_ids: fullGroup.alert_filters?.map(f => f.id) || [],
                });
            }
        }
    };

    const groupOptions = allGroups?.map(g => ({
        value: g.id,
        label: g.name
    })) || [];

    return (
        <form onSubmit={handleSubmit}>
            <div className='row g-4'>
                {!group.id && (
                    <div className='col-12'>
                        <FormGroup id='pick-existing' label='Quick Start: Use Existing Group'>
                            <ReactSelect
                                options={groupOptions}
                                onChange={handlePickExisting}
                                placeholder='Select a group to load its rules...'
                                className='react-select-container'
                                classNamePrefix='react-select'
                            />
                        </FormGroup>
                        <hr className='my-2' />
                    </div>
                )}

                <div className='col-12'>
                    <FormGroup id='group-name' label='Group Name'>
                        <Input
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder='e.g., Critical Safety Rules'
                            required
                        />
                    </FormGroup>
                </div>

                <div className='col-12'>
                    <FormGroup id='group-description' label='Description'>
                        <Textarea
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder='Describe the purpose of this group...'
                            rows={3}
                        />
                    </FormGroup>
                </div>

                <div className='col-12'>
                    <FormGroup id='group-filters' label='Select Member Filters'>
                        <ReactSelect
                            isMulti
                            options={filterOptions}
                            value={selectedFilters}
                            onChange={(selected: any) =>
                                setFormData({
                                    ...formData,
                                    alert_filter_ids: selected ? selected.map((s: any) => s.value) : [],
                                })
                            }
                            className='react-select-container'
                            classNamePrefix='react-select'
                            placeholder='Search and select filters...'
                        />
                    </FormGroup>
                </div>
            </div>

            <div className='d-flex justify-content-end gap-2 mt-5 pt-3 border-top'>
                <Button color='light' onClick={onCancel}>
                    Cancel
                </Button>
                <Button color='primary' type='submit'>
                    {group?.id ? 'Update Group' : 'Add Group Node'}
                </Button>
            </div>
        </form>
    );
};

export default AlertFlowGroupForm;
