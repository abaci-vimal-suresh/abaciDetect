import React, { useState, useRef } from 'react';
import { useRoleData } from '../../api/roles.api';

/**
 * MINIMAL EXAMPLE - Basic usage of useRoleData hook
 */
const MinimalRoleExample = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(['Active']);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use the hook - that's it!
  const { data, isLoading } = useRoleData({
    searchTerm,
    selectedStatuses,
    scrollContainerRef,
  });

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />

      <div ref={scrollContainerRef} style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          data.map((role: any) => (
            <div key={role.id}>{role.name}</div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * ADVANCED EXAMPLE - With all features
 */
const AdvancedRoleExample = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(['Active', 'Inactive']);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    data,                    // Array of all loaded roles
    isLoading,              // Initial loading state
    isFetchingNextPage,     // Loading more data state
    updateStatusMutation,   // Mutation for updating status
    deleteMutation,         // Mutation for deleting role
  } = useRoleData({
    searchTerm,
    selectedStatuses,
    limit: 20,              // Optional: items per API call (default: 10)
    scrollContainerRef,     // Required for infinite scroll
  });

  return (
    <div>
      {/* Search */}
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Status Filters */}
      <label>
        <input
          type="checkbox"
          checked={selectedStatuses.includes('Active')}
          onChange={(e) => setSelectedStatuses(prev =>
            e.target.checked ? [...prev, 'Active'] : prev.filter(s => s !== 'Active')
          )}
        />
        Active
      </label>

      {/* Scrollable List - Infinite Scroll Container */}
      <div ref={scrollContainerRef} style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {isLoading && <p>Loading...</p>}

        {data.map((role: any) => (
          <div key={role.id}>
            <h4>{role.name}</h4>
            <span>{role.status}</span>

            {/* Update Status */}
            <button
              onClick={() => updateStatusMutation.mutate({
                id: role.id,
                status: role.status === 'Active' ? 'Inactive' : 'Active'
              })}
            >
              Toggle Status
            </button>

            {/* Delete */}
            <button
              onClick={() => deleteMutation.mutate({ id: role.id })}
            >
              Delete
            </button>
          </div>
        ))}

        {/* Loading more indicator */}
        {isFetchingNextPage && <p>Loading more...</p>}
      </div>
    </div>
  );
};

/**
 * KEY CONCEPTS:
 * 
 * 1. REQUIRED PARAMS:
 *    - searchTerm: string for searching
 *    - selectedStatuses: array of status filters
 *    - scrollContainerRef: ref to scrollable container
 * 
 * 2. AUTOMATIC INFINITE SCROLL:
 *    - Hook automatically fetches more data when user scrolls near bottom
 *    - Or when content doesn't fill the viewport
 * 
 * 3. MUTATIONS (INSTANT UI UPDATES):
 *    - updateStatusMutation.mutate({ id, status }) - Updates role status
 *    - deleteMutation.mutate({ id }) - Deletes role
 *    - Both update the UI instantly without refetching all data
 * 
 * 4. RETURNED VALUES:
 *    - data: Array of all roles from all loaded pages
 *    - isLoading: true during initial load
 *    - isFetchingNextPage: true when loading more data
 *    - updateStatusMutation: Mutation object for status updates
 *    - deleteMutation: Mutation object for deletions
 * 
 * 5. PERFORMANCE:
 *    - Uses TanStack Query for caching
 *    - Throttled scroll handling
 *    - Prevents duplicate API calls
 *    - Direct cache updates for mutations (no refetch)
 */

export { MinimalRoleExample, AdvancedRoleExample };