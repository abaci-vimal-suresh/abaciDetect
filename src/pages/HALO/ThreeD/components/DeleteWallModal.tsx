/**
 * Delete Wall Confirmation Modal
 * 
 * Purpose: Fixes Issue #10 (no delete confirmation)
 * 
 * Problem:
 * - Clicking trash icon immediately deletes wall
 * - Easy to misclick, especially on mobile
 * - No way to undo accidental deletion
 * 
 * Solution:
 * - Show confirmation modal before deleting
 * - Display wall information
 * - Cancel/Confirm buttons
 */

import React from 'react';
import Modal, {
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import { Wall } from '../../../../types/sensor';

// ============================================
// COMPONENT PROPS
// ============================================

interface DeleteWallModalProps {
    /**
     * Whether modal is open
     */
    isOpen: boolean;

    /**
     * Wall to be deleted
     */
    wall: Wall | null;

    /**
     * Wall segment number for display (e.g., "Segment 3")
     */
    segmentNumber?: number;

    /**
     * Callback when user confirms deletion
     */
    onConfirm: () => void;

    /**
     * Callback when user cancels
     */
    onCancel: () => void;

    /**
     * Optional: Show detailed wall info
     */
    showDetails?: boolean;

    /**
     * Optional: Custom warning message
     */
    warningMessage?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Confirmation modal for wall deletion
 * 
 * Usage:
 * ```tsx
 * <DeleteWallModal
 *     isOpen={deleteModalOpen}
 *     wall={wallToDelete}
 *     segmentNumber={3}
 *     onConfirm={() => handleDelete(wallToDelete.id)}
 *     onCancel={() => setDeleteModalOpen(false)}
 * />
 * ```
 */
export const DeleteWallModal: React.FC<DeleteWallModalProps> = ({
    isOpen,
    wall,
    segmentNumber,
    onConfirm,
    onCancel,
    showDetails = false,
    warningMessage
}) => {
    if (!wall) return null;

    // Determine if this is a new (unsaved) wall
    const isNewWall = String(wall.id).startsWith('new-');

    // Format wall length for display
    const wallLength = calculateWallLength(wall);

    return (
        <Modal
            isOpen={isOpen}
            setIsOpen={onCancel}
            size='sm'
            titleId='delete-wall-modal'
        >
            <ModalHeader setIsOpen={onCancel}>
                <ModalTitle id='delete-wall-modal' className='d-flex align-items-center'>
                    <Icon icon='Warning' className='me-2 text-warning' size='2x' />
                    {isNewWall ? 'Remove Wall?' : 'Delete Wall?'}
                </ModalTitle>
            </ModalHeader>

            <ModalBody>
                {/* Main message */}
                <div className='mb-3'>
                    {isNewWall ? (
                        <p className='mb-2'>
                            Are you sure you want to remove{' '}
                            {segmentNumber ? (
                                <strong>Wall Segment {segmentNumber}</strong>
                            ) : (
                                <strong>this wall</strong>
                            )}?
                        </p>
                    ) : (
                        <p className='mb-2'>
                            Are you sure you want to delete{' '}
                            {segmentNumber ? (
                                <strong>Wall Segment {segmentNumber}</strong>
                            ) : (
                                <strong>this wall</strong>
                            )}?
                        </p>
                    )}

                    {isNewWall ? (
                        <p className='text-muted small mb-0'>
                            This wall hasn't been saved yet. You can recreate it by drawing again.
                        </p>
                    ) : (
                        <p className='text-danger small mb-0'>
                            <Icon icon='Info' className='me-1' />
                            {warningMessage || 'This action cannot be undone. The wall will be permanently deleted.'}
                        </p>
                    )}
                </div>

                {/* Wall details (optional) */}
                {showDetails && (
                    <div className='border rounded p-3 bg-light'>
                        <div className='d-flex justify-content-between align-items-center mb-2'>
                            <h6 className='mb-0'>Wall Details</h6>
                            <Badge color={isNewWall ? 'success' : 'info'} isLight>
                                {isNewWall ? 'New' : `ID: ${wall.id}`}
                            </Badge>
                        </div>

                        <div className='row g-2 small'>
                            <div className='col-6'>
                                <div className='text-muted'>Length:</div>
                                <div className='fw-bold'>{wallLength}</div>
                            </div>
                            <div className='col-6'>
                                <div className='text-muted'>Height:</div>
                                <div className='fw-bold'>{wall.r_height?.toFixed(2) || '2.40'}m</div>
                            </div>
                            <div className='col-6'>
                                <div className='text-muted'>Color:</div>
                                <div className='d-flex align-items-center'>
                                    <span
                                        className='d-inline-block me-2'
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            backgroundColor: wall.color || '#ffffff',
                                            border: '1px solid #ccc',
                                            borderRadius: '2px'
                                        }}
                                    />
                                    <span className='font-monospace'>{wall.color || '#ffffff'}</span>
                                </div>
                            </div>
                            <div className='col-6'>
                                <div className='text-muted'>Opacity:</div>
                                <div className='fw-bold'>{((wall.opacity ?? 0.7) * 100).toFixed(0)}%</div>
                            </div>
                        </div>

                        {wall.area_ids && wall.area_ids.length > 0 && (
                            <div className='mt-2 pt-2 border-top'>
                                <div className='text-muted small'>Linked to {wall.area_ids.length} area(s)</div>
                            </div>
                        )}
                    </div>
                )}
            </ModalBody>

            <ModalFooter>
                <Button
                    color='light'
                    onClick={onCancel}
                    icon='Close'
                >
                    Cancel
                </Button>
                <Button
                    color='danger'
                    onClick={() => {
                        onConfirm();
                        onCancel(); // Close modal after confirm
                    }}
                    icon='Delete'
                >
                    {isNewWall ? 'Remove' : 'Delete'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate wall length from normalized coordinates
 * 
 * @param wall - Wall object
 * @returns Formatted length string
 */
function calculateWallLength(wall: Wall): string {
    const dx = wall.r_x2 - wall.r_x1;
    const dy = wall.r_y2 - wall.r_y1;
    const normalizedLength = Math.sqrt(dx * dx + dy * dy);

    // Assuming typical building is ~30m x 30m
    // This is an approximation for display purposes
    const estimatedLength = normalizedLength * 30;

    if (estimatedLength < 1) {
        return `${(estimatedLength * 100).toFixed(0)}cm`;
    } else {
        return `${estimatedLength.toFixed(2)}m`;
    }
}

/**
 * Format wall coordinates for display
 * 
 * @param wall - Wall object
 * @returns Formatted coordinate string
 */
export function formatWallCoordinates(wall: Wall): string {
    return `(${wall.r_x1.toFixed(2)}, ${wall.r_y1.toFixed(2)}) → (${wall.r_x2.toFixed(2)}, ${wall.r_y2.toFixed(2)})`;
}

/**
 * Get wall display name
 * 
 * @param wall - Wall object
 * @param segmentNumber - Optional segment number
 * @returns Display name
 */
export function getWallDisplayName(wall: Wall, segmentNumber?: number): string {
    if (segmentNumber) {
        return `Wall Segment ${segmentNumber}`;
    }

    if (String(wall.id).startsWith('new-')) {
        return 'New Wall';
    }

    return `Wall ${wall.id}`;
}

// ============================================
// EXPORT
// ============================================

export default DeleteWallModal;