import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardBody, CardHeader, CardTitle } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import Modal, {
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle
} from '../../../components/bootstrap/Modal';
import Spinner from '../../../components/bootstrap/Spinner';
import { useUser, useUserActivity, useAreas, useDeleteUser } from '../../../api/sensors.api';
import { Area, UserActivity } from '../../../types/sensor';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import useDarkMode from '../../../hooks/useDarkMode';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useUserActions } from './hooks/useUserActions';

dayjs.extend(relativeTime);

const UserDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const actions = useUserActions();

    const { data: user, isLoading: isUserLoading } = useUser(id || '');
    const { data: activities, isLoading: isActivityLoading } = useUserActivity(id || '');
    const { data: areas } = useAreas();

    const assignedAreas = useMemo(() => {
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
        return findAssigned(areas);
    }, [user, areas]);

    const handleDelete = () => {
        if (!user || !id) return;
        actions.handleDeleteUser(Number(id), user.username, () => {
            navigate('/users');
        });
    };

    if (isUserLoading) return <div className="p-5 text-center">Loading user details...</div>;
    if (!user) return <div className="p-5 text-center text-danger">User not found</div>;

    return (
        <PageWrapper title={`User Details: ${user.username}`}>
            <Page>
                <div className="row justify-content-center h-100">
                    <div className="col-lg-10">
                        <div className="d-flex justify-content-between align-items-center mb-4 text-dark">
                            <div className="d-flex align-items-center">
                                <Button
                                    color="light"
                                    isLight
                                    icon="ArrowBack"
                                    onClick={() => navigate('/users')}
                                    className="me-3 shadow-sm"
                                >
                                    Back
                                </Button>
                                <div>
                                    <h1 className="display-6 fw-bold mb-0">{user.first_name} {user.last_name}</h1>
                                    <p className="text-muted mb-0">Member since {dayjs(user.created_at).format('MMMM D, YYYY')}</p>
                                </div>
                            </div>
                            <div className="d-flex gap-2">
                                <Button
                                    color="primary"
                                    icon="Edit"
                                    onClick={() => navigate(`/users/${id}/edit`)}
                                >
                                    Edit Profile
                                </Button>
                            </div>
                        </div>

                        <div className="row g-4 mb-5">
                            <div className="col-md-4">
                                <Card className="shadow-3d border-0 h-100" style={{ background: actions.darkModeStatus ? '#1E293B' : '#FFFFFF' }}>
                                    <CardBody className="p-4 text-center">
                                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-4 mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                                            <span className="display-4 fw-bold">{user.username.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <h3 className="fw-bold mb-1">@{user.username}</h3>
                                        <Badge color={user.role === 'admin' ? 'secondary' : 'info'} isLight className="px-3 py-2 rounded-pill mb-4 uppercase small">
                                            {user.role} Role
                                        </Badge>

                                        <div className="text-start mt-4 border-top border-light pt-4">
                                            <div className="mb-3">
                                                <label className="text-muted small uppercase fw-bold mb-1 d-block">Email Address</label>
                                                <div className="fw-bold d-flex align-items-center">
                                                    <Icon icon="Email" size="sm" className="me-2 text-primary" />
                                                    {user.email}
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="text-muted small uppercase fw-bold mb-1 d-block">Status</label>
                                                <div className={`fw-bold d-flex align-items-center ${user.is_active ? 'text-success' : 'text-danger'}`}>
                                                    <div className={`rounded-circle me-2 ${user.is_active ? 'bg-success' : 'bg-danger'}`} style={{ width: '8px', height: '8px' }}></div>
                                                    {user.is_active ? 'Active Account' : 'Deactivated'}
                                                </div>
                                            </div>
                                            <div className="mb-0">
                                                <label className="text-muted small uppercase fw-bold mb-1 d-block">Last Login</label>
                                                <div className="text-muted">
                                                    <Icon icon="Login" size="sm" className="me-2" />
                                                    {user.last_login ? dayjs(user.last_login).fromNow() : 'Never logged in'}
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            <div className="col-md-8">
                                <Card className="shadow-3d border-0 mb-4" style={{ background: actions.darkModeStatus ? '#1E293B' : '#FFFFFF' }}>
                                    <CardHeader className="bg-transparent border-bottom border-light py-3">
                                        <CardTitle className="mb-0 d-flex align-items-center justify-content-between w-100">
                                            <div className="d-flex align-items-center">
                                                <Icon icon="Business" className="me-2 text-warning" />
                                                Assigned Areas
                                            </div>
                                            <Badge color="warning" isLight className="rounded-pill px-3">{assignedAreas.length}</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardBody className="p-4">
                                        {assignedAreas.length > 0 ? (
                                            <div className="row g-3">
                                                {assignedAreas.map(area => (
                                                    <div key={area.id} className="col-md-6">
                                                        <div className="p-3 border border-light rounded bg-light bg-opacity-10">
                                                            <div className="d-flex align-items-center mb-2">
                                                                <Icon icon="MeetingRoom" className="text-primary me-2" />
                                                                <span className="fw-bold">{area.name}</span>
                                                            </div>
                                                            <div className="small text-muted d-flex align-items-center gap-3">
                                                                <span><Icon icon="Sensors" size="sm" className="me-1" /> {area.sensor_count} Sensors</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-muted bg-light bg-opacity-10 rounded">
                                                No areas assigned to this user yet.
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>

                                <Card className="shadow-3d border-0 mb-4" style={{ background: actions.darkModeStatus ? '#1E293B' : '#FFFFFF' }}>
                                    <CardHeader className="bg-transparent border-bottom border-light py-3">
                                        <CardTitle className="mb-0 d-flex align-items-center">
                                            <Icon icon="History" className="me-2 text-info" />
                                            Recent Activity
                                        </CardTitle>
                                    </CardHeader>
                                    <CardBody className="p-0">
                                        <div className="p-4 border-bottom border-light">
                                            {isActivityLoading ? (
                                                <div className="text-center py-3">Loading activities...</div>
                                            ) : (activities && activities.length > 0) ? (
                                                <div className="d-flex flex-column gap-4">
                                                    {activities.map((activity: UserActivity) => (
                                                        <div key={activity.id} className="d-flex align-items-start gap-3">
                                                            <div className="bg-light bg-opacity-10 p-2 rounded">
                                                                <Icon icon="Bolt" className="text-info" />
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <span className="fw-bold">{activity.action}</span>
                                                                    <span className="small text-muted">{dayjs(activity.timestamp).fromNow()}</span>
                                                                </div>
                                                                <p className="text-muted small mb-0">{activity.details}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-3 text-muted">No recent activity found.</div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card className="shadow-3d border-danger border-opacity-25 border-1 bg-danger bg-opacity-10" style={{ background: actions.darkModeStatus ? 'rgba(239, 68, 68, 0.05)' : '' }}>
                                    <CardBody className="p-4 text-center">
                                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 text-start">
                                            <div>
                                                <h5 className="fw-bold mb-1 text-danger">Danger Zone</h5>
                                                <p className="text-muted small mb-0">Permanently delete this user account. This action cannot be undone.</p>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <Button color="light" isLight className="text-dark">Deactivate</Button>
                                                <Button
                                                    color="danger"
                                                    onClick={handleDelete}
                                                    isDisable={actions.deleteUserMutation.isPending}
                                                >
                                                    Delete User
                                                </Button>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </Page>
        </PageWrapper >
    );
};

export default UserDetailPage;
