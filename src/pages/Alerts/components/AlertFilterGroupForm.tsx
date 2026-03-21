import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import Label from '../../../components/bootstrap/forms/Label';
import Textarea from '../../../components/bootstrap/forms/Textarea';
import Button from '../../../components/bootstrap/Button';
import { AlertFilter, AlertFilterGroup } from '../../../types/sensor';
import { useAlertFilters } from '../../../api/sensors.api';
import ReactSelect from 'react-select';

interface AlertFilterGroupFormProps {
    group: Partial<AlertFilterGroup> | null;
    onSave: (data: Partial<AlertFilterGroup>) => void;
    onCancel: () => void;
}

const AlertFilterGroupForm: React.FC<AlertFilterGroupFormProps> = ({ group, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<AlertFilterGroup>>({
        name: '',
        description: '',
        alert_filter_ids: [],
    });

    const { data: availableFilters } = useAlertFilters();

    useEffect(() => {
        if (group) {
            setFormData({
                ...group,
                alert_filter_ids: group.alert_filters?.map(f => f.id) || group.alert_filter_ids || [],
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

    return (
        <form onSubmit={handleSubmit}>
            <Card stretch shadow='none' className='mb-0'>
                <CardBody>
                    <div className='row g-4'>
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
                                <small className='text-muted mt-1 d-block'>
                                    Choose the rules that belong in this group.
                                </small>
                            </FormGroup>
                        </div>
                    </div>
                </CardBody>
            </Card>

            <div className='d-flex justify-content-end gap-2 mt-4'>
                <Button color='light' onClick={onCancel}>
                    Cancel
                </Button>
                <Button color='primary' type='submit'>
                    {group?.id ? 'Update Group' : 'Create Group'}
                </Button>
            </div>
        </form>
    );
};

export default AlertFilterGroupForm;
