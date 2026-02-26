import React, { memo, useState } from 'react';
import BaseNode from './BaseNode';
import Badge from '../../../../../components/bootstrap/Badge';
import Checks from '../../../../../components/bootstrap/forms/Checks';
import Icon from '../../../../../components/icon/Icon';

const FilterGroupNode = ({ data, selected, id }: any) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const filters = data.alert_filters || [];

    return (
        <BaseNode
            id={id}
            title={data.name || 'Filter Group'}
            icon='FolderCopy'
            color='secondary'
            selected={selected}
            status={data.status}
        >

        </BaseNode>
    );
};

export default memo(FilterGroupNode);
