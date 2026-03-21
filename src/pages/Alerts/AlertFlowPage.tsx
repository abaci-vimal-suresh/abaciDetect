import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    ReactFlowProvider,
    Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSearchParams } from 'react-router-dom';

import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../layout/SubHeader/SubHeader';
import Breadcrumb from '../../components/bootstrap/Breadcrumb';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

import TriggerNode from './components/flow/TriggerNode';
import FilterNode from './components/flow/FilterNode';
import ConditionNode from './components/flow/ConditionNode';
import TimeGateNode from './components/flow/TimeGateNode';
import ActionNode from './components/flow/ActionNode';
import FlowSidePanel from './components/flow/FlowSidePanel';

import AlertFlowFilterForm from './components/AlertFlowFilterForm';
import AlertFlowGroupForm from './components/AlertFlowGroupForm';
import FilterGroupNode from './components/flow/FilterGroupNode';
import PipelineView from './components/pipeline/PipelineView';

import {
    useAlertFilters,
    useActions,
    useUpdateAlertFilter,
    useUpdateAction,
    useCreateAlertFilter,
    useCreateAction,
    useDeleteAlertFilter,
    useDeleteAction,
    useAlertFilterGroups,
    useCreateAlertFilterGroup,
    useUpdateAlertFilterGroup,
    useDeleteAlertFilterGroup,
    useAddFilterToGroup,
    useRemoveFilterFromGroup
} from '../../api/sensors.api';
import { ALERT_TYPE_CHOICES } from '../../types/sensor';
import './AlertFlow.css';

const nodeTypes = {
    trigger: TriggerNode,
    filter: FilterNode,
    condition: ConditionNode,
    timeGate: TimeGateNode,
    action: ActionNode,
    filterGroup: FilterGroupNode,
};

const DEFAULT_NODE_DATA: any = {
    trigger: { source: 'Internal', status: 'idle' },
    filter: {
        name: 'New Filter',
        description: '',
        area_ids: [],
        sensor_group_ids: [],
        alert_types: [],
        source_types: [],
        conditions: [],
        status: 'idle'
    },
    condition: { label: 'New Condition', status: 'idle' },
    timeGate: { duration: '10m', status: 'idle' },
    action: { name: 'New Action', status: 'idle' },
    filterGroup: { name: 'New Group', description: '', alert_filter_ids: [], status: 'idle' },
};


const AlertFlowPageContent = ({
    nodes, setNodes, onNodesChange,
    edges, setEdges, onEdgesChange,
    alertFilters, actions, filterGroups,
    updateFilterMutation, updateActionMutation,
    createFilterMutation, createActionMutation,
    deleteFilterMutation, deleteActionMutation,
    createGroupMutation, updateGroupMutation,
    deleteGroupMutation, addFilterToGroupMutation,
    removeFilterFromGroupMutation, onEdgesDelete,
    selectedNode, setSelectedNode,
    isSidePanelOpen, setIsSidePanelOpen,
    handleSaveNodeData,
    focusedGroupName
}: any) => {
    const [searchParams] = useSearchParams();
    const groupIdParam = searchParams.get('groupId');
    const focusedGroupId = groupIdParam ? parseInt(groupIdParam) : null;

    const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());

    const onGroupCollapse = useCallback((groupId: number, collapsed: boolean) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (collapsed) next.add(groupId);
            else next.delete(groupId);
            return next;
        });
    }, []);

    // Reset nodes when focus changes
    useEffect(() => {
        setNodes([]);
        setEdges([]);
    }, [focusedGroupId, setNodes, setEdges]);

    // Initial Layout Generator
    useEffect(() => {
        if (alertFilters && actions && filterGroups && nodes.length === 0) {
            const initialNodes: any[] = [];
            const initialEdges: any[] = [];
            let globalYOffset = 50;
            const ROW_HEIGHT = 120;

            // 1. Create a map of rules to their groups
            const ruleToGroupMap: Record<number, number> = {};
            (filterGroups || []).forEach((g: any) => {
                const memberIds = g.alert_filter_ids || g.alert_filters?.map((f: any) => f.id) || [];
                memberIds.forEach((rid: number) => {
                    ruleToGroupMap[rid] = g.id;
                });
            });

            // 2. Focused View Logic
            if (focusedGroupId) {
                const group = (filterGroups || []).find((g: any) => g.id === focusedGroupId);
                if (group) {
                    const memberFilterIds = group.alert_filter_ids || group.alert_filters?.map((f: any) => f.id) || [];
                    // Only show filters that HAVE actions (or are explicitly being worked on)
                    const memberFilters = alertFilters.filter((f: any) =>
                        memberFilterIds.includes(f.id)
                    );

                    // Track unique actions to prevent stacking
                    const uniqueActionIds = new Set<number>();
                    const finalActions: any[] = [];

                    memberFilters.forEach((filter: any, idx: number) => {
                        const filterNodeId = `filter-${filter.id}`;
                        const filterY = 100 + idx * (ROW_HEIGHT + 80);

                        initialNodes.push({
                            id: filterNodeId,
                            type: 'filter',
                            position: { x: 50, y: filterY },
                            data: { ...filter, status: 'idle' },
                        });

                        // --- Generate Trigger Nodes for each alert type ---
                        const filterAlertTypes = filter.alert_types || [];
                        filterAlertTypes.forEach((typeVal: string, tIdx: number) => {
                            const triggerId = `trigger-${filter.id}-${typeVal}`;
                            const typeInfo = ALERT_TYPE_CHOICES.find(c => c.value === typeVal);

                            initialNodes.push({
                                id: triggerId,
                                type: 'trigger',
                                position: {
                                    x: -220,
                                    y: filterY + (tIdx * 45) - ((filterAlertTypes.length - 1) * 22.5) + 40
                                },
                                data: {
                                    label: typeInfo?.label || typeVal,
                                    icon: 'NotificationsActive' // Could be specific based on type
                                },
                            });

                            initialEdges.push({
                                id: `e-${triggerId}-${filterNodeId}`,
                                source: triggerId,
                                target: filterNodeId,
                                style: { strokeDasharray: '5,5', stroke: '#888' }
                            });
                        });

                        const filterActions = filter.actions || [];
                        filterActions.forEach((action: any) => {
                            if (!uniqueActionIds.has(action.id)) {
                                uniqueActionIds.add(action.id);
                                finalActions.push(action);
                            }
                            initialEdges.push({
                                id: `e-${filterNodeId}-action-${action.id}`,
                                source: filterNodeId,
                                target: `action-${action.id}`
                            });
                        });
                    });

                    // Layout unique actions in their own column
                    finalActions.forEach((action, idx) => {
                        initialNodes.push({
                            id: `action-${action.id}`,
                            type: 'action',
                            position: { x: 750, y: 100 + idx * (ROW_HEIGHT + 40) },
                            data: { ...action, status: 'idle' },
                        });
                    });
                }
            }
            // 3. Global View Logic
            else {
                let currentY = 50;

                // Process Groups
                filterGroups.forEach((group: any) => {
                    const groupNodeId = `group-${group.id}`;
                    const groupMemberIds = group.alert_filter_ids || group.alert_filters?.map((f: any) => f.id) || [];
                    const groupMemberFilters = alertFilters.filter((f: any) => groupMemberIds.includes(f.id));

                    // Add Group Node
                    initialNodes.push({
                        id: groupNodeId,
                        type: 'filterGroup',
                        position: { x: 50, y: currentY + (groupMemberFilters.length > 0 ? (groupMemberFilters.length - 1) * ROW_HEIGHT / 2 : 0) },
                        data: { ...group, status: 'idle', onCollapse: onGroupCollapse },
                    });

                    // Add Member Filters
                    groupMemberFilters.forEach((filter: any, fIdx: number) => {
                        const filterId = `filter-${filter.id}`;
                        initialNodes.push({
                            id: filterId,
                            type: 'filter',
                            position: { x: 450, y: currentY + fIdx * ROW_HEIGHT },
                            data: { ...filter, status: 'idle' },
                        });

                        initialEdges.push({ id: `e-${groupNodeId}-${filterId}`, source: groupNodeId, target: filterId, animated: true });

                        // Actions
                        const filterActions = filter.actions || [];
                        filterActions.forEach((action: any, aIdx: number) => {
                            const actionId = `action-${action.id}`;
                            if (!initialNodes.find(n => n.id === actionId)) {
                                initialNodes.push({
                                    id: actionId,
                                    type: 'action',
                                    position: { x: 850, y: currentY + fIdx * ROW_HEIGHT + aIdx * 80 },
                                    data: { ...action, status: 'idle' },
                                });
                            }
                            initialEdges.push({ id: `e-${filterId}-${actionId}`, source: filterId, target: actionId });
                        });
                    });

                    currentY += Math.max(1, groupMemberFilters.length) * ROW_HEIGHT + 50;
                });

                // Process Orphan Rules (Rules not in any group)
                const orphanFilters = alertFilters.filter((f: any) => !ruleToGroupMap[f.id]);
                orphanFilters.forEach((filter: any, oIdx: number) => {
                    const filterId = `filter-${filter.id}`;
                    initialNodes.push({
                        id: filterId,
                        type: 'filter',
                        position: { x: 50, y: currentY + oIdx * ROW_HEIGHT },
                        data: { ...filter, status: 'idle' },
                    });

                    // Actions
                    const filterActions = filter.actions || [];
                    filterActions.forEach((action: any, aIdx: number) => {
                        const actionId = `action-${action.id}`;
                        if (!initialNodes.find(n => n.id === actionId)) {
                            initialNodes.push({
                                id: actionId,
                                type: 'action',
                                position: { x: 450, y: currentY + oIdx * ROW_HEIGHT + aIdx * 80 },
                                data: { ...action, status: 'idle' },
                            });
                        }
                        initialEdges.push({ id: `e-${filterId}-${actionId}`, source: filterId, target: actionId });
                    });
                });
            }

            setNodes(initialNodes);
            setEdges(initialEdges);
        }
    }, [alertFilters, actions, filterGroups, setNodes, setEdges, nodes.length, focusedGroupId]);

    const onConnect = useCallback(
        async (params: Connection) => {
            setEdges((eds: any) => addEdge(params, eds));

            const { source, target } = params;

            // 1. Linking Filter to Action
            if (source && target && source.startsWith('filter-') && target.startsWith('action-')) {
                const filterIdStr = source.replace('filter-', '');
                const actionIdStr = target.replace('action-', '');
                const filterId = parseInt(filterIdStr);
                const actionId = parseInt(actionIdStr);

                if (!isNaN(filterId) && !isNaN(actionId)) {
                    const filter = alertFilters?.find((f: any) => f.id === filterId);
                    if (filter) {
                        const currentActionIds = filter.action_ids || (filter.actions ? filter.actions.map((a: any) => a.id) : []);
                        if (!currentActionIds.includes(actionId)) {
                            const updatedActionIds = [...currentActionIds, actionId];
                            try {
                                await updateFilterMutation.mutateAsync({
                                    id: filterId,
                                    data: { action_ids: updatedActionIds }
                                });
                            } catch (err) {
                                console.error('Failed to link action to filter:', err);
                            }
                        }
                    }
                }
            }

            // 2. Linking Group to Filter (Visual Grouping)
            if (source && target && source.startsWith('group-') && target.startsWith('filter-')) {
                const groupId = parseInt(source.replace('group-', ''));
                const filterId = parseInt(target.replace('filter-', ''));

                if (!isNaN(groupId) && !isNaN(filterId)) {
                    try {
                        await addFilterToGroupMutation.mutateAsync({ groupId, filterId });
                    } catch (err) {
                        console.error('Failed to link filter to group:', err);
                    }
                }
            }
        },
        [setEdges, alertFilters, filterGroups, updateFilterMutation, addFilterToGroupMutation]
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
        setSelectedNode(node);
        setIsSidePanelOpen(true);
    }, [setSelectedNode, setIsSidePanelOpen]);

    const isRemoveOnly = !!focusedGroupId && (selectedNode?.type === 'filter' || selectedNode?.type === 'action');

    const nodesWithCollapse = useMemo(() => {
        return nodes.map(node => {
            if (node.type === 'filter') {
                const filterId = parseInt(node.id.replace('filter-', ''));
                // Find if this filter belongs to a collapsed group
                const belongsToCollapsedGroup = Array.from(collapsedGroups).some(groupId => {
                    const group = filterGroups?.find((g: any) => g.id === groupId);
                    const memberIds = group?.alert_filter_ids || group?.alert_filters?.map((f: any) => f.id) || [];
                    return memberIds.includes(filterId);
                });
                return {
                    ...node,
                    className: belongsToCollapsedGroup ? 'group-member-collapsed' : 'group-member-visible',
                    style: {
                        ...node.style,
                        opacity: belongsToCollapsedGroup ? 0 : 1,
                        pointerEvents: belongsToCollapsedGroup ? 'none' : 'all',
                        transition: 'opacity 0.3s ease',
                    }
                };
            }
            return node;
        });
    }, [nodes, collapsedGroups, filterGroups]);

    return (
        <>
            <div className='alert-flow-container'>
                <ReactFlow
                    nodes={nodesWithCollapse}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onEdgesDelete={onEdgesDelete}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    {focusedGroupId && focusedGroupName && (
                        <Panel position="top-left" className="m-0">
                            <div className="group-canvas-heading d-flex align-items-center bg-white bg-opacity-75 p-3 rounded-bottom-4 shadow-sm border border-primary border-opacity-10" style={{ backdropFilter: 'blur(8px)', borderTop: 'none' }}>
                                <div className="p-2 bg-primary bg-opacity-10 rounded-circle me-3">
                                    <Icon icon="FolderOpen" className="text-primary" size="lg" />
                                </div>
                                <div>
                                    <div className="text-muted extra-small text-uppercase fw-bold ls-1 mb-0" style={{ fontSize: '0.65rem' }}>Active Group context</div>
                                    <h4 className="mb-0 fw-bold text-dark h5">{focusedGroupName}</h4>
                                </div>
                            </div>
                        </Panel>
                    )}
                    <Background variant={'dots' as any} gap={12} size={1} />
                    <Controls />
                    <MiniMap zoomable pannable />
                </ReactFlow>

            </div>

            <style>{`
				.react-flow__attribution {
					display: none;
				}
			`}</style>
        </>
    );
};

const AlertFlowPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Data Hooks
    const { data: alertFilters } = useAlertFilters();
    const { data: actions } = useActions();
    const { data: filterGroups } = useAlertFilterGroups();

    // Mutation Hooks
    const updateFilterMutation = useUpdateAlertFilter();
    const updateActionMutation = useUpdateAction();
    const createFilterMutation = useCreateAlertFilter();
    const createActionMutation = useCreateAction();
    const deleteFilterMutation = useDeleteAlertFilter();
    const deleteActionMutation = useDeleteAction();
    const createGroupMutation = useCreateAlertFilterGroup();
    const updateGroupMutation = useUpdateAlertFilterGroup();
    const deleteGroupMutation = useDeleteAlertFilterGroup();
    const addFilterToGroupMutation = useAddFilterToGroup();
    const removeFilterFromGroupMutation = useRemoveFilterFromGroup();

    const groupIdParam = searchParams.get('groupId');
    const focusedGroupId = groupIdParam ? parseInt(groupIdParam) : null;
    const focusedGroupName = filterGroups?.find((g: any) => g.id === focusedGroupId)?.name;

    const [activeTray, setActiveTray] = useState<'action' | null>(null);
    const [viewMode, setViewMode] = useState<'pipeline' | 'canvas'>('canvas');
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Contextual view mode management
    useEffect(() => {
        if (!focusedGroupId) {
            setViewMode('pipeline');
        }
        setActiveTray(null);
    }, [focusedGroupId, viewMode]);

    const handleSaveNodeData = async (data: any) => {
        if (!selectedNode) return;

        let updatedNodeData = data;

        if (selectedNode.type === 'filter') {
            if (selectedNode.data.id && typeof selectedNode.data.id === 'number') {
                await updateFilterMutation.mutateAsync({ id: selectedNode.data.id, data });
            } else {
                // Smart Association: If we are in a focused group view, auto-link the new rule
                const payload = focusedGroupId ? { ...data, group_id: focusedGroupId } : data;
                const newNode = await createFilterMutation.mutateAsync(payload);
                updatedNodeData = { ...newNode, status: 'idle' };
            }
        } else if (selectedNode.type === 'action') {
            if (selectedNode.data.id && typeof selectedNode.data.id === 'number') {
                await updateActionMutation.mutateAsync({ id: selectedNode.data.id, data });
            } else {
                const newNode = await createActionMutation.mutateAsync(data);
                updatedNodeData = { ...newNode, status: 'idle' };
            }
        } else if (selectedNode.type === 'filterGroup') {
            if (selectedNode.data.id && typeof selectedNode.data.id === 'number') {
                await updateGroupMutation.mutateAsync({ id: selectedNode.data.id, data });
            } else {
                const newNode = await createGroupMutation.mutateAsync(data);
                updatedNodeData = { ...newNode, status: 'idle' };
            }
        }

        setNodes((nds: any[]) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    return {
                        ...node,
                        id: selectedNode.type === 'filter' ? `filter-${updatedNodeData.id}` :
                            selectedNode.type === 'action' ? `action-${updatedNodeData.id}` :
                                selectedNode.type === 'filterGroup' ? `group-${updatedNodeData.id}` : node.id,
                        data: updatedNodeData,
                    };
                }
                return node;
            })
        );

        setIsSidePanelOpen(false);
        setSelectedNode(null);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft += e.deltaY;
        }
    };

    const onAddExistingNode = useCallback(async (entity: any, type: 'filter' | 'action') => {
        const id = `${type}-${entity.id}`;

        if (nodes.find(n => n.id === id)) {
            Swal.fire({
                title: 'Already Added',
                text: 'This node is already visible on the canvas.',
                icon: 'info',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        const newNode = {
            id,
            type,
            position: { x: type === 'action' ? 850 : 450, y: 300 },
            data: { ...entity, status: 'idle' },
        };
        setNodes((nds) => nds.concat(newNode));

        if (focusedGroupId && type === 'filter') {
            const newEdge = {
                id: `e-add-link-${id}`,
                source: `group-${focusedGroupId}`,
                target: id,
                animated: true,
            };
            setEdges((eds) => eds.concat(newEdge));

            try {
                await addFilterToGroupMutation.mutateAsync({
                    groupId: focusedGroupId,
                    filterId: entity.id
                });
            } catch (err) {
                console.error('Failed to add existing filter to group:', err);
            }
        }
    }, [nodes, setNodes, setEdges, focusedGroupId, addFilterToGroupMutation]);

    const onEdgesDelete = useCallback(
        async (deletedEdges: Edge[]) => {
            for (const edge of deletedEdges) {
                const { source, target } = edge;
                if (source?.startsWith('group-') && target?.startsWith('filter-')) {
                    const groupId = parseInt(source.replace('group-', ''));
                    const filterId = parseInt(target.replace('filter-', ''));
                    if (!isNaN(groupId) && !isNaN(filterId)) {
                        try {
                            await removeFilterFromGroupMutation.mutateAsync({ groupId, filterId });
                        } catch (err) {
                            console.error('Failed to remove filter from group:', err);
                        }
                    }
                }
            }
        },
        [removeFilterFromGroupMutation]
    );

    const onAddNode = useCallback((type: string) => {
        const id = `${type}-${Date.now()}`;
        const newNode = {
            id,
            type,
            position: { x: type === 'action' ? 850 : 450, y: 300 },
            data: { ...DEFAULT_NODE_DATA[type] },
        };
        setNodes((nds) => nds.concat(newNode));

        // If we are in focus mode and adding a filter, visually connect it to the anchor group
        if (focusedGroupId && type === 'filter') {
            const newEdge = {
                id: `e-temp-${id}`,
                source: `group-${focusedGroupId}`,
                target: id,
                animated: true,
            };
            setEdges((eds) => eds.concat(newEdge));
        }
    }, [setNodes, setEdges, focusedGroupId]);

    return (
        <PageWrapper title={focusedGroupName ? `Workflow: ${focusedGroupName}` : 'Alert Flow Visualizer'}>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb
                        list={[
                            { title: 'HALO', to: '/halo' },
                            { title: 'Alerts', to: '/halo/alerts' },
                            ...(focusedGroupId ? [
                                { title: 'Filter Groups', to: '/halo/alerts/groups' },
                                { title: `Group: ${focusedGroupName}`, to: '/halo/alerts/flow' }
                            ] : [
                                { title: 'Flow Visualizer', to: '/halo/alerts/flow' }
                            ])
                        ]}
                    />
                </SubHeaderLeft>
                <SubHeaderRight>
                    {focusedGroupId && (
                        <div className='d-flex align-items-center gap-2 bg-light bg-opacity-10 p-1 rounded-pill border mx-3'>
                            <Button
                                color={viewMode === 'pipeline' ? 'primary' : 'light'}
                                size='sm'
                                rounded='pill'
                                isActive={viewMode === 'pipeline'}
                                onClick={() => setViewMode('pipeline')}
                                icon='LinearScale'
                            >
                                Pipeline
                            </Button>
                            <Button
                                color={viewMode === 'canvas' ? 'primary' : 'light'}
                                size='sm'
                                rounded='pill'
                                isActive={viewMode === 'canvas'}
                                onClick={() => setViewMode('canvas')}
                                icon='AccountTree'
                            >
                                Canvas
                            </Button>
                        </div>
                    )}
                    {/* {searchParams.get('groupId') && (
                        <Button
                            color='secondary'
                            isLight
                            className='me-2'
                            icon='Close'
                            onClick={() => {
                                // Clear params
                                const newParams = new URLSearchParams(searchParams);
                                newParams.delete('groupId');
                                setSearchParams(newParams);

                                // Reset state to force complete re-layout
                                setNodes([]);
                                setEdges([]);
                            }}
                        >
                            Show All
                        </Button>
                    )} */}
                    {viewMode === 'canvas' && (
                        <>
                            <Button
                                className={`btn-neumorphic me-2 ${activeTray === 'action' ? 'active shadow-none border-danger' : ''}`}
                                color='danger'
                                isLight
                                icon='NotificationsActive'
                                onClick={() => setActiveTray(activeTray === 'action' ? null : 'action')}
                            >
                                Existing Actions
                            </Button>
                            <Button
                                className='btn-neumorphic'
                                color='primary'
                                isLight
                                icon='FilterAlt'
                                onClick={() => onAddNode('filter')}
                            >
                                Add Filter
                            </Button>
                        </>
                    )}
                </SubHeaderRight>
            </SubHeader>

            {viewMode === 'canvas' && activeTray === 'action' && (
                <div className='selection-tray-container selection-tray-active'>
                    <div className='p-3 container-fluid'>
                        <div className='d-flex align-items-center justify-content-between mb-3 px-2'>
                            <div className='d-flex align-items-center'>
                                <div className='p-2 rounded-circle me-3 d-flex align-items-center justify-content-center bg-opacity-25 bg-danger'>
                                    <Icon
                                        icon='NotificationsActive'
                                        className='text-danger'
                                        size='lg'
                                    />
                                </div>
                                <div>
                                    <h6 className='tray-header-label mb-0'>
                                        Available Actions
                                    </h6>
                                </div>
                            </div>
                            <Button
                                size='sm'
                                color='light'
                                isLight
                                className='rounded-circle shadow-sm'
                                icon='Close'
                                onClick={() => setActiveTray(null)}
                            />
                        </div>

                        <div
                            ref={scrollRef}
                            className='tray-scroll-container'
                            onWheel={handleWheel}
                        >
                            {(actions || []).filter(a => !nodes.find(n => n.id === `action-${a.id}`)).map(action => (
                                <div
                                    key={action.id}
                                    className='tray-item-card action-card'
                                    onClick={() => onAddExistingNode(action, 'action')}
                                >
                                    <div className='d-flex align-items-center mb-3'>
                                        <div className='card-icon-wrapper bg-light'>
                                            <Icon icon='NotificationsActive' className='text-danger' />
                                        </div>
                                        <div className='flex-grow-1 overflow-hidden'>
                                            <div className='card-title-text text-truncate' title={action.name}>{action.name}</div>
                                            <span className='badge bg-light text-muted extra-small border' style={{ fontSize: '0.55rem' }}>
                                                {action.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {(actions || []).filter((action: any) => !nodes.find(n => n.id === `action-${action.id}`)).length === 0 && (
                                <div className='w-100 p-4 text-center'>
                                    <div className='bg-success bg-opacity-10 p-4 rounded-3 border border-success border-opacity-10 d-inline-block'>
                                        <Icon icon='CheckCircle' size='2x' className='text-success mb-2' />
                                        <div className='text-muted small fw-bold'>Workflow Optimized</div>
                                        <div className='text-muted extra-small'>All available actions are present in your workspace.</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}


            <Page container='fluid'>
                {viewMode === 'pipeline' ? (
                    <PipelineView
                        filterGroups={filterGroups || []}
                        alertFilters={alertFilters || []}
                        actions={actions || []}
                        focusedGroupId={focusedGroupId}
                        onEditFilter={(filter) => {
                            const nodeId = `filter-${filter.id}`;
                            const node = nodes.find(n => n.id === nodeId);
                            if (node) {
                                setSelectedNode(node);
                                setIsSidePanelOpen(true);
                            } else {
                                // If not on canvas yet, we can create a virtual node for editing
                                setSelectedNode({
                                    id: nodeId,
                                    type: 'filter',
                                    data: { ...filter }
                                });
                                setIsSidePanelOpen(true);
                            }
                        }}
                        onEditAction={(action) => {
                            const nodeId = `action-${action.id}`;
                            const node = nodes.find(n => n.id === nodeId);
                            if (node) {
                                setSelectedNode(node);
                                setIsSidePanelOpen(true);
                            } else {
                                setSelectedNode({
                                    id: nodeId,
                                    type: 'action',
                                    data: { ...action }
                                });
                                setIsSidePanelOpen(true);
                            }
                        }}
                    />
                ) : (
                    <ReactFlowProvider>
                        <AlertFlowPageContent
                            nodes={nodes}
                            setNodes={setNodes}
                            onNodesChange={onNodesChange}
                            edges={edges}
                            setEdges={setEdges}
                            onEdgesChange={onEdgesChange}
                            onEdgesDelete={onEdgesDelete}
                            alertFilters={alertFilters}
                            actions={actions}
                            filterGroups={filterGroups || []}
                            updateFilterMutation={updateFilterMutation}
                            updateActionMutation={updateActionMutation}
                            createFilterMutation={createFilterMutation}
                            createActionMutation={createActionMutation}
                            deleteFilterMutation={deleteFilterMutation}
                            deleteActionMutation={deleteActionMutation}
                            createGroupMutation={createGroupMutation}
                            updateGroupMutation={updateGroupMutation}
                            deleteGroupMutation={deleteGroupMutation}
                            addFilterToGroupMutation={addFilterToGroupMutation}
                            removeFilterFromGroupMutation={removeFilterFromGroupMutation}
                            selectedNode={selectedNode}
                            setSelectedNode={setSelectedNode}
                            isSidePanelOpen={isSidePanelOpen}
                            setIsSidePanelOpen={setIsSidePanelOpen}
                            handleSaveNodeData={handleSaveNodeData}
                            focusedGroupName={focusedGroupName}
                        />
                    </ReactFlowProvider>
                )}
            </Page>

            <FlowSidePanel
                isOpen={isSidePanelOpen}
                onClose={() => setIsSidePanelOpen(false)}
                title={`Configure ${selectedNode?.type === 'filter' ? 'Smart Rule' : selectedNode?.type === 'action' ? 'Action' : selectedNode?.type === 'filterGroup' ? 'Filter Group' : 'Node'}`}
                icon={<Icon icon={selectedNode?.type === 'filter' ? 'FilterAlt' : selectedNode?.type === 'action' ? 'NotificationsActive' : selectedNode?.type === 'filterGroup' ? 'FolderCopy' : 'Bolt'} />}
            >
                {selectedNode?.type === 'filter' && (
                    <AlertFlowFilterForm
                        key={`filter-${selectedNode.id}`}
                        filter={selectedNode.data}
                        onSave={handleSaveNodeData}
                        onCancel={() => setIsSidePanelOpen(false)}
                    />
                )}
                {selectedNode?.type === 'action' && (
                    <div className='p-3'>
                        <div className='d-flex align-items-center mb-4 p-3 border rounded bg-light bg-opacity-10'>
                            <Icon icon='NotificationsActive' size='3x' className='text-danger me-3' />
                            <div>
                                <h5 className='mb-1'>{selectedNode.data.name}</h5>
                                <span className='badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 text-uppercase' style={{ fontSize: '0.7rem' }}>
                                    {selectedNode.data.type || 'Action'}
                                </span>
                            </div>
                        </div>

                        <div className='mb-4'>
                            <label className='form-label small fw-bold text-muted text-uppercase mb-2'>Description</label>
                            <p className='text-muted small'>
                                {selectedNode.data.description || 'No description provided for this action.'}
                            </p>
                        </div>

                        <div className='alert alert-info py-2 px-3 small border-info border-opacity-25 bg-info bg-opacity-10 d-flex align-items-start'>
                            <Icon icon='Info' className='me-2 mt-1' />
                            <span>
                                Actions are managed in the <strong>Alert Actions</strong> section. You can remove this action from the current workflow below.
                            </span>
                        </div>
                    </div>
                )}
                {selectedNode?.type === 'filterGroup' && (
                    <AlertFlowGroupForm
                        key={`group-${selectedNode.id}`}
                        group={selectedNode.data}
                        onSave={handleSaveNodeData}
                        onCancel={() => setIsSidePanelOpen(false)}
                    />
                )}
                {selectedNode?.type === 'trigger' && (
                    <div key={`trigger-${selectedNode.id}`} className='p-3 text-center'>
                        <Icon icon='Bolt' size='4x' className='text-warning mb-3' />
                        <h5>System Trigger</h5>
                        <p className='text-muted'>
                            This node represents the event source. You can configure global trigger settings here.
                        </p>
                    </div>
                )}

                {selectedNode?.type !== 'trigger' && (
                    <div className='mt-4 pt-4 border-top'>
                        <Button
                            color='danger'
                            isOutline
                            className='w-100 d-flex align-items-center justify-content-center py-2'
                            onClick={() => {
                                const isSaved = selectedNode.data.id && typeof selectedNode.data.id === 'number';
                                if (!isSaved) {
                                    setNodes((nds: any[]) => nds.filter(n => n.id !== selectedNode.id));
                                    setEdges((eds: any[]) => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                                    setIsSidePanelOpen(false);
                                    setSelectedNode(null);
                                    return;
                                }

                                const isRemoveOnly = !!focusedGroupId && (selectedNode?.type === 'filter' || selectedNode?.type === 'action');

                                Swal.fire({
                                    title: isRemoveOnly ? 'Remove from Group?' : 'Delete Node?',
                                    text: isRemoveOnly
                                        ? `Are you sure you want to remove this rule from the group? The rule will still exist in the system library.`
                                        : `Are you sure you want to delete this ${selectedNode.type}? This will permanently remove it from the system.`,
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: isRemoveOnly ? 'Yes, remove it' : 'Yes, delete it!',
                                    customClass: {
                                        confirmButton: 'btn btn-danger mx-2',
                                        cancelButton: 'btn btn-secondary mx-2',
                                    },
                                    buttonsStyling: false,
                                    background: '#1a1a1a',
                                    color: '#fff',
                                }).then(async (result) => {
                                    if (result.isConfirmed) {
                                        try {
                                            const nodeType = selectedNode.type;
                                            const nodeDataId = selectedNode.data.id;

                                            if (isRemoveOnly && nodeType === 'filter') {
                                                await removeFilterFromGroupMutation.mutateAsync({
                                                    groupId: Number(focusedGroupId),
                                                    filterId: Number(nodeDataId)
                                                });
                                            } else if (isRemoveOnly && nodeType === 'action') {
                                                const connectedEdges = edges.filter(e => String(e.target) === String(selectedNode.id));
                                                const filterIdsToUpdate = connectedEdges
                                                    .map(e => e.source)
                                                    .filter(id => id.startsWith('filter-'))
                                                    .map(id => parseInt(id.replace('filter-', '')));

                                                for (const filterId of filterIdsToUpdate) {
                                                    const filterEntity = alertFilters?.find(f => f.id === filterId);
                                                    if (filterEntity) {
                                                        let currentActionIds = filterEntity.action_ids || [];
                                                        if (currentActionIds.length === 0 && filterEntity.actions) {
                                                            currentActionIds = filterEntity.actions.map((a: any) => a.id);
                                                        }

                                                        const updatedActionIds = currentActionIds.filter((id: any) => String(id) !== String(nodeDataId));

                                                        if (updatedActionIds.length !== currentActionIds.length) {
                                                            await updateFilterMutation.mutateAsync({
                                                                id: filterId,
                                                                data: { action_ids: updatedActionIds }
                                                            });
                                                        }
                                                    }
                                                }
                                            } else {
                                                if (nodeType === 'filter') {
                                                    await deleteFilterMutation.mutateAsync(Number(nodeDataId));
                                                } else if (nodeType === 'action') {
                                                    await deleteActionMutation.mutateAsync(Number(nodeDataId));
                                                } else if (nodeType === 'filterGroup') {
                                                    await deleteGroupMutation.mutateAsync(Number(nodeDataId));
                                                }
                                            }

                                            setNodes((nds: any[]) => nds.filter(n => n.id !== selectedNode.id));
                                            setEdges((eds: any[]) => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                                            setIsSidePanelOpen(false);
                                            setSelectedNode(null);
                                        } catch (err) {
                                            console.error('Failed to process node removal/deletion:', err);
                                        }
                                    }
                                });
                            }}
                        >
                            <Icon icon={!!focusedGroupId && (selectedNode?.type === 'filter' || selectedNode?.type === 'action') ? 'LinkOff' : 'Delete'} className='me-2' />
                            {!!focusedGroupId && (selectedNode?.type === 'filter' || selectedNode?.type === 'action') ? (selectedNode?.type === 'action' ? 'Remove Action' : 'Remove from Group') : 'Delete Node'}
                        </Button>
                    </div>
                )}
            </FlowSidePanel >
        </PageWrapper>
    );
};

export default AlertFlowPage;
