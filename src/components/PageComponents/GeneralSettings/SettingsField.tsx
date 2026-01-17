import React from 'react'
import InputArea from './Components/InputArea'
import EditButton from './Components/EditButton'
import ChangeValueWithToggleButton from './Components/ChangeValueWithToggleButton'

const SettingsField = ({ data, bg_color, editModalToggle, handleSave }: any) => {
    const generateData = (data) => {
        if (data?.key === 'enable_establishment_self_registration') {
            return { 'display_name': 'Self Registration for Establishment', 'value': data?.value, 'type': 'checkbox',icon: 'Person' };
        }
        if (data?.key === 'timezone') {
            return { 'display_name': 'Time Zone', 'value': data?.value, 'type': 'select',icon: 'Language' };
        }
        if (data?.key === 'refresh_interval') {
            return { 'display_name': 'Refresh Interval', 'value': data?.value, 'type': 'range',icon: 'Timer' };
        }
        if (data?.key === 'trap_due_additional_days') {
            return { 'display_name': 'Number of additional days to add before marking a trap as “Due”.', 'value': data?.value, 'type': 'number',icon: 'CalendarToday' };
        }
        if (data?.key === 'discharge_rate_per_gallon') {
            return { 'display_name': 'Fee charged per gallon of collected waste.', 'value': data?.value, 'type': 'number',icon: 'Money' };
        }
        if (data?.key === 'vat_percentage') {
            return { 'display_name': 'VAT percentage to apply when VAT is applicable (e.g., 5%).', 'value': data?.value, 'type': 'number',icon: 'Money' };
        }
        if (data?.key === 'vat_applicable_for_discharge') {
            return { 'display_name': 'Whether VAT should be applied to the discharge fee calculation (true/false).', 'value': data?.value, 'type': 'checkbox',icon: 'Money' };
        }
    }


   
 
    const BodyContent = (data) => {
        switch (generateData(data)?.type) {
            case 'checkbox':
                return <ChangeValueWithToggleButton data={data} bg_color={bg_color} icon={generateData(data)?.icon} display_name={generateData(data)?.display_name} value={generateData(data)?.value} onChange={(value: any) => handleSave(value, data)} editModalToggle={editModalToggle} />
            case 'range':
                    return <EditButton data={data} bg_color={bg_color} icon={generateData(data)?.icon} display_name={generateData(data)?.display_name} value={generateData(data)?.value} onChange={(value: any) => handleSave(value, data)} editModalToggle={editModalToggle} />
            case 'select':
                return <EditButton data={data} bg_color={bg_color} icon={generateData(data)?.icon} display_name={generateData(data)?.display_name} value={generateData(data)?.value} editModalToggle={editModalToggle} />
            case 'number':
                return <InputArea data={data} bg_color={bg_color} icon={generateData(data)?.icon} display_name={generateData(data)?.display_name} value={generateData(data)?.value} onChange={(value: any) => handleSave(value, data)} />
            default:
                return <EditButton data={data} bg_color={bg_color} icon={generateData(data)?.icon} display_name={generateData(data)?.display_name} value={generateData(data)?.value} editModalToggle={editModalToggle} />
    }
}
    return (
        <div className='col-12 col-md-6 d-flex' key={data.id}>
           {BodyContent(data)}
        </div>
    )
}

export default SettingsField
