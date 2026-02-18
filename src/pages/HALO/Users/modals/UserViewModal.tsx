import React from 'react';
import { User, UserActivity, Area } from '../../../../types/sensor';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../../../components/bootstrap/Modal';
import Badge from '../../../../components/bootstrap/Badge';
import Icon from '../../../../components/icon/Icon';
import useDarkMode from '../../../../hooks/useDarkMode';
import Button from '../../../../components/bootstrap/Button';
import Label from '../../../../components/bootstrap/forms/Label';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { useUser, useUserActivity, useAreas } from '../../../../api/sensors.api';

interface UserViewModalProps {
    userId: number | null;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const UserViewModal: React.FC<UserViewModalProps> = ({ userId, isOpen, setIsOpen }) => {
    const { darkModeStatus } = useDarkMode();
    const { data: user, isLoading: isUserLoading } = useUser(userId ? String(userId) : '');
    const { data: activities, isLoading: isActivityLoading } = useUserActivity(userId ? String(userId) : '');
    const { data: areas } = useAreas();

    if (!isOpen) return null;

    // Helper to find assigned areas recursively (from UserDetailPage.tsx)
    const assignedAreas = (() => {
        if (!user || !areas) return [];
        const findAssigned = (areaList: Area[]): Area[] => {
            let found: Area[] = [];
            for (const area of areaList) {
                if (user.assigned_area_ids.includes(area.id)) {
                    found.push(area);
                }
                const subareas = (area as any).subareas;
                if (subareas && subareas.length > 0 && typeof subareas[0] === 'object') {
                    found = [...found, ...findAssigned(subareas)];
                }
            }
            return found;
        };
        return findAssigned(areas.filter(a => !a.parent_id));
    })();

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg" isCentered isScrollable>
            <ModalHeader setIsOpen={setIsOpen} className="border-0 pb-0">
                <span className="ms-3 text-muted small uppercase fw-bold" style={{ letterSpacing: '1px' }}>User Profile</span>
            </ModalHeader>
            <ModalBody className="px-5 pb-5 pt-0">
                {isUserLoading || !user ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className='row g-4'>
                        {/* Centered Profile Header */}
                        <div className='col-12 text-center mb-2'>
                            <div
                                className='mx-auto mb-3 d-flex align-items-center justify-content-center shadow-3d'
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    background: darkModeStatus ? 'rgba(77,105,250,0.15)' : 'rgba(77,105,250,0.1)',
                                    borderRadius: '50%',
                                    fontSize: '2.5rem',
                                    fontWeight: 700,
                                    color: '#4d69fa',
                                    border: `4px solid ${darkModeStatus ? '#2c3035' : '#fff'}`
                                }}
                            >
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <h3 className='fw-bold mb-1'>
                                {user.first_name} {user.last_name}
                            </h3>
                            <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                <span className="text-muted small">@{user.username}</span>
                                <Badge color={user.role === 'admin' ? 'secondary' : 'info'} isLight className="text-uppercase" style={{ fontSize: '0.65rem' }}>
                                    {user.role}
                                </Badge>
                            </div>
                        </div>

                        <div className='col-12'>
                            {/* Status & Account Info */}
                            <div className='border-top pt-4 mb-4' style={{ borderColor: darkModeStatus ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                <div className='row g-3'>
                                    <div className='col-md-6'>
                                        <Label className='fw-bold text-muted small text-uppercase mb-2'>Email Address</Label>
                                        <div className='fw-bold d-flex align-items-center gap-2'>
                                            <Icon icon="Email" size="sm" className="text-primary" />
                                            {user.email}
                                        </div>
                                    </div>
                                    <div className='col-md-6'>
                                        <Label className='fw-bold text-muted small text-uppercase mb-2'>Account Status</Label>
                                        <div>
                                            <Badge color={user.is_active ? 'success' : 'danger'} isLight>
                                                {user.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Areas */}
                            <div className='border-top pt-4 mb-4' style={{ borderColor: darkModeStatus ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                <Label className='fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center'>
                                    <Icon icon="Map" size="sm" className="me-2 text-warning" />
                                    Assigned Areas ({assignedAreas.length})
                                </Label>
                                {assignedAreas.length > 0 ? (
                                    <div className="d-flex flex-wrap gap-2">
                                        {assignedAreas.map(area => (
                                            <div
                                                key={area.id}
                                                className="px-3 py-1 border rounded d-flex align-items-center gap-2 shadow-sm bg-light bg-opacity-10"
                                                style={{ fontSize: '0.85rem' }}
                                            >
                                                <Icon icon="MeetingRoom" size="sm" className="text-primary" />
                                                <span className="fw-semibold">{area.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-muted small italic">No areas assigned to this user.</div>
                                )}
                            </div>

                            {/* Recent Activity */}
                            <div className='border-top pt-4' style={{ borderColor: darkModeStatus ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                <Label className='fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center'>
                                    <Icon icon="Timeline" size="sm" className="me-2 text-info" />
                                    Recent Activity
                                </Label>
                                {activities && activities.length > 0 ? (
                                    <div className="p-3 rounded bg-light bg-opacity-10 shadow-inner" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        <div className="d-flex flex-column gap-3">
                                            {activities.map((activity: UserActivity) => (
                                                <div key={activity.id} className="d-flex align-items-start gap-3 border-bottom border-light border-opacity-10 pb-2 last-child-no-border">
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between">
                                                            <span className="fw-bold small">{activity.action}</span>
                                                            <span className="text-muted" style={{ fontSize: '0.65rem' }}>{dayjs(activity.timestamp).fromNow()}</span>
                                                        </div>
                                                        <div className="text-muted small" style={{ fontSize: '0.7rem' }}>{activity.details}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-muted small italic">No recent activity detected.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter className='justify-content-center border-0 pb-4'>
                <Button
                    className='btn-neumorphic px-5'
                    color="primary"
                    isLight
                    onClick={() => setIsOpen(false)}
                >
                    Close Profile
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default UserViewModal;
