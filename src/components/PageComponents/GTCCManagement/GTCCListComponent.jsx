import React, { useEffect, useRef, useState } from 'react';
import MaterialTable from '@material-table/core';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../hooks/useTablestyles';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { authAxios } from '../../../axiosInstance';
import CustomBadgeWithIcon from '../../CustomComponent/BadgeWithIcon';
import { formatFiltersWithOptions, updateHiddenColumnsInLocalStorage } from '../../../helpers/functions';
import useColumnHiding from '../../../hooks/useColumnHiding';
import Avatar from '../../Avatar';
import ProfilePic from '../../../assets/img/Noimages.png';
import Moments from '../../../helpers/Moment';
import { debounceIntervalForTable, NoData, pageSizeOptions } from '../../../helpers/constants';
import EditButton from '../../CustomComponent/Buttons/EditButton';
import DeleteButton from '../../CustomComponent/Buttons/DeleteButton';
import StatusButton from '../../CustomComponent/Buttons/StatusButton';
import { exportData } from '../../../helpers/exportData';


const GTCCListComponent = (props) => {

    const canManageGTCC = true
    const { tableRef, date, activeTab, selectedItem, urlBackup, handleEdit, selectedStatuses } = props;
    const navigate = useNavigate();
    const [pageSize, setPageSize] = useState(5);
    const { showErrorNotification } = useToasterNotification();
    const { theme, rowStyles, headerStyles , searchFieldStyle } = useTablestyle();
    const [filterEnabled, setFilterEnabled] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const totalRecordsCount = useRef(0);


    const staticColumns = [
        { title: "Image", field: ""
            , render: (rowData) => <Avatar src={ProfilePic} size={50} srcSet={ProfilePic}/>
        },
        {
            title: "GTCC No",
            field: "gtcc_no",
            removable:false,
            render: (rowData) => (
              <>
                {rowData.gtcc_no !== "" || rowData.gtcc_no !== null
                  ? rowData.gtcc_no
                  : NoData}
              </>
            ),
          },
          {
            title: "GTCC Name",
            field: "name",
            render: (rowData) => (
              <>{rowData.name ? rowData.name : NoData}</>
            ),
          },
          {
            title: "TL No",
            field: "trade_license_no",
            render: (rowData) => (
              <>{rowData.trade_license_no ? rowData.trade_license_no : NoData}</>
            ),
          },
          {
            title: "TL Name",
            field: "trade_license_name",
            render: (rowData) => (
              <>{rowData.trade_license_name ? rowData.trade_license_name : NoData}</>
            ),
          },
          {
            title: "TRN",
            field: "tax_registration_no",
            render: (rowData) => (
              <>{rowData.tax_registration_no ? rowData.tax_registration_no : NoData}</>
            ),
          },
          {
            title: "Address",
            field: "address",
            render: (rowData) => (
              <>{rowData.address ? rowData.address : NoData}</>
            ),
          },
          {
            title: "Office Email",
            field: "office_email",
            render: (rowData) => (
              <>{rowData.office_email ? rowData.office_email : NoData}</>
            ),
          },
          {
            title: "Location",
            field: "location",
            render: (rowData) => (
              <>{rowData.location ? rowData.location : NoData}</>
            ),
          },
          {
            title: "PO Box",
            field: "po_box",
            render: (rowData) => (
              <>{rowData.po_box ? rowData.po_box : NoData}</>
            ),
          },
          {
            title: "Company Contact No",
            field: "company_contact_no",
            render: (rowData) => (
              <>{rowData.company_contact_no ? rowData.company_contact_no : NoData}</>
            ),
          },
          {
            title: "Credit Available",
            field: 'credit_available',
            render: (rowData) => (
              <>{rowData.credit_available || NoData}</>
            ),
          },
          {
            title: "Total Violations",
            field: 'total_violations',
            render: (rowData) => (
              <>{rowData.total_violations ? rowData.total_violations : NoData}</>
            ),
          },
          {  
            title: "Created By",
            field: 'created_by__full_name',
            render: (rowData) => (
              <>{rowData?.created_by?.full_name || NoData}</>
            ),
          },
          {
            title: "Created Date",
            field: 'created_at',
            render: (rowData) => (
              <>{rowData.updated_at ? Moments(rowData.updated_at) : NoData}</>
            ),
            filtering:false,
            sorting:false,
          },
          {
            title: "Last Modified By",
            field: 'updated_by__full_name',
            render: (rowData) => (
                <>{rowData?.updated_by?.full_name || NoData}</>
            ),
          },
          {
            title: "Last Modified Date",
            field: 'updated_at',
            render: (rowData) => (
              <>{rowData.updated_at ? Moments(rowData.updated_at) : NoData}</>
            ),
            filtering:false,
            // sorting:false,
          },
        { title: "Status", field: "status",
            render: rowData =>
    <CustomBadgeWithIcon>{rowData.status}</CustomBadgeWithIcon>
            
         },
    ];


    const actionButtons = canManageGTCC ? [
        {
            title: 'Actions',
            align: 'right',
            removable: false,
            sorting: false,
            grouping: false,
            filtering: false,
            render: (rowData) => (
                <div className='d-flex gap-2 justify-content-end'>
                  <EditButton
                    modalShow={handleEdit}
                    id={rowData.id}
                  />
                    <StatusButton
                      status={rowData.status}
                      fieldKey="status"
                      tableRef={tableRef}
                      api={`/region/gtccs/${rowData.id}/update-active-status/`}  
                      // method='post'
                    />
                  <DeleteButton
                    tableRef={tableRef}
                    apiEndpoint={`/region/gtccs/${rowData.id}/`}
                    text={`Are you sure you want to delete this GTCC?`}
                  />
                  
                    {/* {(rowData.status!=="Cancelled"&&rowData.status!=="Completed")&&	
                        <CancelButton
                            tableRef={tableRef}
                            apiEndpoint={`api/trip_management/trip_schedule/${rowData.id}`}
                        />				
                    } */}


                </div>
            ),
        },
    ] : [];


    const columns = useColumnHiding({
        oldValue: staticColumns,
        hiddenColumnArray: JSON.parse(localStorage.getItem('GTTCList')) || [],
        buttonArray: actionButtons,
    });


    useEffect(() => {
      if (initialLoading) {
        setInitialLoading(false);
        return;
      }
        tableRef.current.onQueryChange();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    return (
        <div
            style={{
                overflowY: 'auto',
            }}>
            <ThemeProvider theme={theme}>
                <MaterialTable
                    title=' '
                    columns={columns}
                    tableRef={tableRef}
                    
                    //@ts-ignore
                    onChangeRowsPerPage={(page) => setPageSize(page)}
                    // onRowClick={(event, rowData) => {
                    //   window.open(`/gtcc_management/gtcc/${rowData.id}`, '_blank')
                
                    // }}
                    onRowClick={(_,rowData)=>{
                      navigate(`/gtcc_management/gtcc/${rowData.id}`)
                    }}

                  localization={{
                    pagination: {
                      labelRowsPerPage: '',
                    }
                  }}

                    onChangeColumnHidden={(column, hidden) =>
                        updateHiddenColumnsInLocalStorage(column, hidden, 'gtccManagementList')
                    }
                    data={(query) => {
                        return new Promise((resolve, reject) => {

                          // console.log('QUERY',query);
                          // return resolve({
                          //   data:dummyGTCCData,
                          //   page: query.page,
                          //   totalCount:dummyGTCCData.length,
                          // })
                            // let statusTypes = '&status__in=Active,Disabled,Completed,Yet to start';
                            // if (activeTab !== "All") {
                            //     statusTypes = `&status__in=${activeTab}`
                            // }

                            let orderBy = '';
                            const otherFilters = formatFiltersWithOptions(query.filters);
                            if (query.orderBy) {
                                orderBy =
                                    query.orderDirection === 'asc'
                                        ? `&ordering=-${String(query.orderBy?.field)}`
                                        : `&ordering=${String(query.orderBy?.field)}`;
                            }

                            let url = `/region/gtccs?limit=${query.pageSize}&offset=${query.pageSize * query.page}&is_deleted=false&search=${query.search}${orderBy}&${otherFilters}`;
                            // console.log('selectedItem',selectedItem);
                            // Check if date range and selected item are defined
                            if (date && date?.selection?.startDateFilter && date?.selection?.endDateFilter && selectedItem) {
                              // if (selectedItem.value === "created_at") {
                                url += `&${selectedItem.startDateKey}=${date.selection.startDateFilter}&${selectedItem.endDateKey}=${date.selection.endDateFilter}`;
                              // }
                            }
                            if (selectedStatuses.length > 0) {
                                selectedStatuses.forEach(status => {
                                    url += `&status=${status}`;
                                });
                            }
                            urlBackup.current = url;
                            authAxios
                                .get(url)
                                .then((response) => {
                                    totalRecordsCount.current = response.data?.count;
                                    resolve({
                                        data: response.data?.results,
                                        page: query.page,
                                        totalCount: response.data?.count,
                                    });
                                })
                                .catch((error) => {
                                    showErrorNotification(error);
                                    // eslint-disable-next-line prefer-promise-reject-errors
                                    resolve({
                                        data: [],
                                        page: query.page,
                                        totalCount: 0,
                                    });
                                });
                        });
                    }}

                    actions={[
                        {
                            icon: FilterListIcon,
                            tooltip: filterEnabled ? 'Disable Filter' : 'Enable Filter',
                            isFreeAction: true,
                            onClick: () => {
                                setFilterEnabled((state) => !state);
                            },
                        },
                    ]}
                    options={{
                        headerStyle: headerStyles(),
                        rowStyle: rowStyles(),
                        searchFieldStyle: searchFieldStyle(),
                        actionsColumnIndex: -1,
                        debounceInterval: debounceIntervalForTable,
                        filtering: filterEnabled,
                        pageSizeOptions: pageSizeOptions,
                        search: true,
                        pageSize,
                        columnsButton: true,
                        exportMenu:[{
                          label: 'Export as CSV',
                          exportFunc: () => exportData("csv",urlBackup.current,totalRecordsCount.current,'GTCC List',JSON.parse(localStorage.getItem('gtccManagementList')) || [],columns)
                        },
                    ]}}
                />
            </ThemeProvider>
        </div>
    );
};
/* eslint-disable react/forbid-prop-types */
GTCCListComponent.propTypes = {
    tableRef: PropTypes.object.isRequired,
    date: PropTypes.any,
    activeTab: PropTypes.string.isRequired,
    selectedItem: PropTypes.object.isRequired,
    urlBackup: PropTypes.any.isRequired,
    handleEdit: PropTypes.func.isRequired,
    selectedStatuses: PropTypes.array.isRequired,

  };
/* eslint-enable react/forbid-prop-types */

GTCCListComponent.defaultProps = {
    date: null, // Default value
};
export default GTCCListComponent;
