import React, { useState, useRef } from 'react';
import Button from '../../components/bootstrap/Button';
import Input from '../../components/bootstrap/forms/Input';
import Spinner from '../../components/bootstrap/Spinner';
import Card, { CardBody, CardHeader } from '../bootstrap/Card';
import { useRoleData } from '../../api/roles.api';

const RoleManagementExample = () => {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(['Active', 'Inactive']);

  // Ref for scroll container - required for infinite scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use the hook
  const {
    data,
    isLoading,
    isFetchingNextPage,
    updateStatusMutation,
    deleteMutation,
  } = useRoleData({
    searchTerm,
    selectedStatuses,
    limit: 10, // Optional: items per page (default: 10)
    scrollContainerRef, // Required for infinite scroll
  });

  // Handler for search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handler for status filter checkboxes
  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // Handler for updating role status
  const handleUpdateStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  // Handler for deleting role
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <Card>
      <CardHeader>
        <h4>Role Management</h4>
      </CardHeader>
      <CardBody>
        {/* Filters Section */}
        <div className='mb-4'>
          <div className='row g-3'>
            {/* Search Input */}
            <div className='col-md-6'>
              <Input
                type='text'
                placeholder='Search roles...'
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            {/* Status Filters */}
            <div className='col-md-6'>
              <div className='d-flex gap-3 align-items-center'>
                <label>Status:</label>
                <div className='form-check'>
                  <input
                    className='form-check-input'
                    type='checkbox'
                    id='activeStatus'
                    checked={selectedStatuses.includes('Active')}
                    onChange={() => handleStatusToggle('Active')}
                  />
                  <label className='form-check-label' htmlFor='activeStatus'>
                    Active
                  </label>
                </div>
                <div className='form-check'>
                  <input
                    className='form-check-input'
                    type='checkbox'
                    id='inactiveStatus'
                    checked={selectedStatuses.includes('Inactive')}
                    onChange={() => handleStatusToggle('Inactive')}
                  />
                  <label className='form-check-label' htmlFor='inactiveStatus'>
                    Inactive
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Container for Infinite Scroll */}
        <div
          ref={scrollContainerRef}
          style={{
            maxHeight: '600px',
            overflowY: 'auto',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            padding: '1rem',
          }}
        >
          {/* Loading State */}
          {isLoading && (
            <div className='text-center py-5'>
              <Spinner color='primary' size='3rem' />
              <p className='mt-3'>Loading roles...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && data.length === 0 && (
            <div className='text-center py-5 text-muted'>
              <p>No roles found</p>
            </div>
          )}

          {/* Data List */}
          {!isLoading && data.length > 0 && (
            <div className='list-group'>
              {data.map((role: any) => (
                <div
                  key={role.id}
                  className='list-group-item d-flex justify-content-between align-items-center'
                >
                  <div>
                    <h6 className='mb-1'>{role.name}</h6>
                    <small className='text-muted'>{role.description}</small>
                    <div className='mt-1'>
                      <span
                        className={`badge bg-${role.status === 'Active' ? 'success' : 'secondary'
                          }`}
                      >
                        {role.status}
                      </span>
                    </div>
                  </div>

                  <div className='d-flex gap-2'>
                    {/* Toggle Status Button */}
                    <Button
                      color={role.status === 'Active' ? 'warning' : 'success'}
                      size='sm'
                      onClick={() => handleUpdateStatus(role.id, role.status)}
                      isDisable={updateStatusMutation.isPending}
                    >
                      {role.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </Button>

                    {/* Delete Button */}
                    <Button
                      color='danger'
                      size='sm'
                      onClick={() => handleDelete(role.id)}
                      isDisable={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading More Indicator */}
          {isFetchingNextPage && (
            <div className='text-center py-3'>
              <Spinner color='primary' size='2rem' />
              <p className='mt-2 text-muted'>Loading more...</p>
            </div>
          )}
        </div>

        {/* Info Text */}
        <div className='mt-3 text-muted small'>
          <p>
            Showing {data.length} role(s). Scroll down to load more automatically.
          </p>
        </div>
      </CardBody>
    </Card>
  );
};

export default RoleManagementExample;