import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../icon/Icon';
import Badge from '../bootstrap/Badge';
import styles from './TreeCard.module.scss';

interface TreeNode {
    id: number;
    name: string;
    type: 'area' | 'sensor';
    subareas?: TreeNode[];
    sensors?: TreeNode[];
    sensor_count?: number;
    is_active?: boolean;
    sensor_type?: string;
    mac_address?: string;
    parent_id?: number | null;
    person_in_charge_ids?: number[];
}

interface TreeCardProps {
    data: any[];
    sensors?: any[];
    users?: any[];
    onNodeClick?: (node: TreeNode) => void;
}

interface NodePosition {
    x: number;
    y: number;
}

const TreeCard: React.FC<TreeCardProps> = ({ data, sensors = [], users = [], onNodeClick }) => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
    const [nodePositions, setNodePositions] = useState<Map<number, NodePosition>>(new Map());

    const minZoom = 0.5;
    const maxZoom = 2;
    const nodeWidth = 280;
    const nodeHeight = 120;
    const horizontalSpacing = 100;
    const verticalSpacing = 150;

    // Build tree structure from flat data
    const buildTree = useCallback((): TreeNode[] => {
        const mainAreas = data.filter(area => !area.parent_id || area.parent_id === null);

        const buildNode = (area: any): TreeNode => {
            const areaSensors = sensors.filter(s => s.area?.id === area.id || s.area_name === area.name);

            return {
                id: area.id,
                name: area.name,
                type: 'area',
                subareas: area.subareas?.map(buildNode) || [],
                sensors: areaSensors.map(s => ({
                    id: s.id,
                    name: s.name,
                    type: 'sensor' as const,
                    is_active: s.is_active,
                    sensor_type: s.sensor_type,
                    mac_address: s.mac_address
                })),
                sensor_count: area.sensor_count || 0,
                parent_id: area.parent_id,
                person_in_charge_ids: area.person_in_charge_ids || []
            };
        };

        return mainAreas.map(buildNode);
    }, [data, sensors]);

    const treeData = buildTree();

    // Calculate node positions using a tree layout algorithm
    const calculatePositions = useCallback((nodes: TreeNode[], startX: number = 0, startY: number = 0, level: number = 0): number => {
        let currentX = startX;
        const positions = new Map<number, NodePosition>();

        nodes.forEach((node, index) => {
            const nodeId = node.id;
            const y = startY + level * verticalSpacing;

            // Calculate width needed for this subtree
            let subtreeWidth = nodeWidth;
            const isExpanded = expandedNodes.has(nodeId);

            if (isExpanded) {
                const children = [...(node.subareas || []), ...(node.sensors || [])];
                if (children.length > 0) {
                    const childrenWidth = calculatePositions(children, currentX, startY, level + 1);
                    subtreeWidth = Math.max(subtreeWidth, childrenWidth);
                }
            }

            // Center this node over its subtree
            const x = currentX + subtreeWidth / 2 - nodeWidth / 2;
            positions.set(nodeId, { x, y });

            currentX += subtreeWidth + horizontalSpacing;
        });

        setNodePositions(prev => new Map([...Array.from(prev.entries()), ...Array.from(positions.entries())]));
        return currentX - startX - horizontalSpacing;
    }, [expandedNodes, nodeWidth, verticalSpacing, horizontalSpacing]);

    // Recalculate positions when tree structure or expanded nodes change
    useEffect(() => {
        setNodePositions(new Map());
        calculatePositions(treeData, 0, 0, 0);
    }, [treeData, expandedNodes, calculatePositions]);

    // Zoom handlers
    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.1, maxZoom));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.1, minZoom));
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        setZoom(prev => Math.max(minZoom, Math.min(maxZoom, prev + delta)));
    };

    // Pan handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest(`.${styles.treeCanvas}`)) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Toggle node expansion
    const toggleNode = (nodeId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    };

    // Handle node click - expand for areas, navigate for sensors
    const handleNodeClick = (node: TreeNode, e: React.MouseEvent) => {
        // Don't trigger if clicking the expand button
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }

        if (node.type === 'area') {
            // For areas, toggle expansion to show sub-areas and sensors
            const hasChildren = (node.subareas && node.subareas.length > 0) || (node.sensors && node.sensors.length > 0);
            if (hasChildren) {
                toggleNode(node.id, e);
            }
        } else if (node.type === 'sensor') {
            // For sensors, navigate to detail page
            navigate(`/halo/sensors/detail/${node.id}`);
        }
        onNodeClick?.(node);
    };

    // Handle double-click for navigation to area detail
    const handleNodeDoubleClick = (node: TreeNode) => {
        if (node.type === 'area') {
            navigate(`/halo/sensors/areas/${node.id}/subzones`);
        }
    };

    // Render a single node
    const renderNode = (node: TreeNode) => {
        const position = nodePositions.get(node.id);
        if (!position) return null;

        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = (node.subareas && node.subareas.length > 0) || (node.sensors && node.sensors.length > 0);

        return (
            <div
                key={node.id}
                className={styles.treeNode}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    zIndex: 1
                }}
            >
                <div
                    className={`${styles.nodeCard} ${hasChildren ? styles.hasChildren : ''} ${node.type === 'sensor' ? styles.sensor : ''}`}
                    onClick={(e) => handleNodeClick(node, e)}
                    onDoubleClick={() => handleNodeDoubleClick(node)}
                >
                    <div className={styles.nodeHeader}>
                        <h6 className={styles.nodeName}>{node.name}</h6>
                        <div className={styles.nodeActions}>
                            {node.type === 'area' && (
                                <Badge color="primary" isLight>
                                    <Icon icon="LocationCity" size="sm" />
                                </Badge>
                            )}
                            {node.type === 'sensor' && (
                                <Badge color={node.is_active ? 'success' : 'danger'} isLight>
                                    <Icon icon="Sensors" size="sm" />
                                </Badge>
                            )}
                            {hasChildren && (
                                <button
                                    className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}
                                    onClick={(e) => toggleNode(node.id, e)}
                                    title={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                    <Icon icon={isExpanded ? 'ExpandLess' : 'ExpandMore'} size="sm" />
                                </button>
                            )}
                        </div>
                    </div>

                    {node.type === 'area' && (
                        <div className={styles.nodeStats}>
                            {node.subareas && node.subareas.length > 0 && (
                                <div className={styles.nodeStat}>
                                    <span className={styles.label}>Sub Areas</span>
                                    <span className={styles.value}>{node.subareas.length}</span>
                                </div>
                            )}
                            <div className={styles.nodeStat}>
                                <span className={styles.label}>Sensors</span>
                                <span className={styles.value}>{node.sensor_count || 0}</span>
                            </div>
                        </div>
                    )}

                    {node.type === 'area' && node.person_in_charge_ids && node.person_in_charge_ids.length > 0 && (
                        <div className='mt-2 pt-2 border-top border-light border-opacity-10'>
                            <div className='text-muted small mb-1' style={{ fontSize: '0.7rem' }}>Managers</div>
                            <div className='d-flex flex-wrap gap-1'>
                                {node.person_in_charge_ids.map(userId => {
                                    const user = users?.find(u => u.id === userId);
                                    return user ? (
                                        <Badge key={userId} color='primary' isLight className='rounded-pill' style={{ fontSize: '0.65rem' }}>
                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                        </Badge>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}

                    {node.type === 'sensor' && (
                        <div className={styles.sensorInfo}>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Type</span>
                                <span className={styles.infoValue}>{node.sensor_type || 'N/A'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>MAC</span>
                                <span className={styles.infoValue}>{node.mac_address || 'N/A'}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render connections between nodes
    const renderConnections = () => {
        const lines: JSX.Element[] = [];

        const drawConnections = (nodes: TreeNode[], parentPos?: NodePosition) => {
            nodes.forEach(node => {
                const nodePos = nodePositions.get(node.id);
                if (!nodePos) return;

                if (parentPos) {
                    const startX = parentPos.x + nodeWidth / 2;
                    const startY = parentPos.y + nodeHeight;
                    const endX = nodePos.x + nodeWidth / 2;
                    const endY = nodePos.y;

                    const midY = (startY + endY) / 2;

                    lines.push(
                        <path
                            key={`${parentPos.x}-${parentPos.y}-${nodePos.x}-${nodePos.y}`}
                            className={styles.connectionLine}
                            d={`M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`}
                        />
                    );
                }

                if (expandedNodes.has(node.id)) {
                    const children = [...(node.subareas || []), ...(node.sensors || [])];
                    drawConnections(children, nodePos);
                }
            });
        };

        drawConnections(treeData);

        return (
            <svg className={styles.connections} style={{ width: '100%', height: '100%', position: 'absolute' }}>
                {lines}
            </svg>
        );
    };

    // Render all nodes recursively
    const renderTree = (nodes: TreeNode[]): JSX.Element[] => {
        const elements: JSX.Element[] = [];

        nodes.forEach(node => {
            elements.push(renderNode(node));

            if (expandedNodes.has(node.id)) {
                const children = [...(node.subareas || []), ...(node.sensors || [])];
                elements.push(...renderTree(children));
            }
        });

        return elements;
    };

    if (!treeData || treeData.length === 0) {
        return (
            <div className={styles.treeContainer}>
                <div className={styles.emptyState}>
                    <Icon icon="AccountTree" />
                    <h4>No Areas Found</h4>
                    <p>Create areas to visualize the hierarchy</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.treeContainer} ref={containerRef}>
            {/* Zoom Controls */}
            <div className={styles.zoomControls}>
                <button
                    className={styles.zoomButton}
                    onClick={handleZoomIn}
                    disabled={zoom >= maxZoom}
                    title="Zoom In"
                >
                    <Icon icon="Add" />
                </button>
                <div className={styles.zoomLevel}>
                    {Math.round(zoom * 100)}%
                </div>
                <button
                    className={styles.zoomButton}
                    onClick={handleZoomOut}
                    disabled={zoom <= minZoom}
                    title="Zoom Out"
                >
                    <Icon icon="Remove" />
                </button>
                <button
                    className={styles.zoomButton}
                    onClick={() => {
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                    }}
                    title="Reset View"
                >
                    <Icon icon="CenterFocusWeak" />
                </button>
            </div>

            {/* Tree Canvas */}
            <div
                className={styles.treeCanvas}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                <div
                    className={styles.treeContent}
                    ref={contentRef}
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    }}
                >
                    {renderConnections()}
                    {renderTree(treeData)}
                </div>
            </div>
        </div>
    );
};

export default TreeCard;
