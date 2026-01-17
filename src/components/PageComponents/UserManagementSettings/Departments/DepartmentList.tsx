import React, { useState } from 'react'
import { debounceIntervalForTable } from '../../../../helpers/constants';
import useTablestyle from '../../../../hooks/shared/useTablestyles';
import { pageSizeOptions } from '../../../../helpers/constants';
import { ThemeProvider } from '@mui/material';
import MaterialTable from '@material-table/core';

function DepartmentList({tableRef}:{tableRef:React.RefObject<HTMLDivElement>}) {
    const {theme,headerStyles,rowStyles,searchFieldStyle} = useTablestyle()
    const [pageSize,setPageSize] = useState(5)

    const columns = [
        {
            title: 'Department',
            field: 'department',
        },
        // {
        //     title: 'Department',
        //     field: 'department',
        // },
        // {
        //     title: 'Party Type',
        //     field: 'party_type',
        // },
    ]
  return (
    <div style={{overflowY: 'auto'}}>
                      <ThemeProvider theme={theme}>
                          <MaterialTable
                            title=""
                            columns={columns}
                            tableRef={tableRef}
                            localization={{
                              pagination: {
                                labelRowsPerPage: '',
                              }
                            }}
                                                         // @ts-ignore
                             onChangeRowsPerPage={setPageSize}
                             data={[]}
                                
                                
                                // (query) => {
                                // return (new Promise((resolve, reject) => {
                                //   const queryParams = generateQueryParams(query)
                            
                                //   let url = `/entity_api/manage_entity_grease_trap?limit=${query.pageSize}&offset=${query.pageSize * query.page}&search=${query.search}${queryParams}`
                            
                                //   // const queryParams = generateQueryParams(query)
                            
                                //   // let url = `/entity_api/manage_entity_grease_trap?limit=${query.pageSize}&offset=${query.pageSize * query.page}&search=${query.search}${queryParams}`
                                  
                                //   if (date) {
                                //     const selectedDate = date.selection
                                //     const filterKey = selectedFilterKey?.key; 
                                //     if (filterKey) {
                                //         url += `&${filterKey}=${selectedDate.startDateFilter},${selectedDate.endDateFilter}`;
                                //         // url += `&${filterKey}=${date.start_date},${date.end_date}`;
                                //     }
                                //   }

                                //   selectedStatuses.forEach(status => {
                                //     url += `&status_filter=${status}`;
                                //   })
                            
                                // //   for (let key in filterStatuses) {
                                // //     if (filterStatuses[key]) {
                                // //       url += `&status_filter=${key}`;
                                // //     }
                                // //   }
                            
                                //   urlBackup.current=url
                                //   axios.get(url)
                                //     .then((response) => {
                            
                                //       totalRecordsCount.current=response.data?.count
                                //       tableRef.current.dataManager.changePageSize(query.pageSize)
                                //       const greaseTraps = response.data?.results
                            
                                //       const TempData = []
                                      
                                //       greaseTraps.forEach((data) => {
                                //       if(data !== null){
                                //         TempData.push({...data,
                                //         foodwatch_grease_trap_id:data?.foodwatch_grease_trap_id !== null ? data.foodwatch_grease_trap_id : 'No Data',
                                //         entity__establishment_name : data?.entity?.establishment_name ? data.entity.establishment_name : 'No Data',
                                //         entity__active_gtcc_detail__gtcc__establishment_name : data?.entity?.active_gtcc_detail?.gtcc?.establishment_name ? data.entity.active_gtcc_detail.gtcc.establishment_name : 'No Data',
                                //         entity__active_gtcc_detail__id : data?.entity?.active_gtcc_detail?.gtcc?.id ? data.entity.active_gtcc_detail.gtcc.id : 'No Data',
                                //         entity__zone__zone_name: data?.entity?.subarea?.area?.zone?.zone_name ? data.entity.subarea.area.zone.zone_name : 'No Data',
                                //         entity__area__area: data?.entity?.subarea?.area?.area ? data.entity.subarea.area.area : "No Data",
                                //         entity__subarea__sub_area: data?.entity?.subarea?.sub_area ? data.entity.subarea.sub_area : "No Data",
                                //         entity__category__main_category: data?.entity?.sub_category?.main_category?.main_category ? data.entity.sub_category.main_category.main_category : "No Data",
                                //         grease_trap__description : data?.grease_trap?.description ? data.grease_trap.description : 'No Data', 
                                //         entity__sub_category__sub_category: data?.entity?.sub_category?.sub_category ? data.entity.sub_category.sub_category : 'No Data',
                                //       })}});
                            
                                //       resolve({
                                //         data: TempData,
                                //         page: query.page,
                                //         totalCount: response.data?.count,
                                //       })
                                //     })
                                //     .catch(() => {
                                //       resolve({
                                //         data: dummyManageGreaseTrapsData,
                                //         page: query.page,
                                //         totalCount: dummyManageGreaseTrapsData.length
                                //       })
                                //     })
                                // }))
                            //   }}
                            //   isLoading={loader}
                            // onChangeColumnHidden={(column, hidden) =>
                            //   updateHiddenColumnsInLocalStorage(column, hidden , 'manageGreaseTraps')
                            // }

                            // actions={[
                            //     {
                            //       icon: FilterListIcon,
                            //       tooltip: filterEnabled
                            //         ? "Disable Filter"
                            //         : "Enable Filter",
                            //       isFreeAction: true,
                            //       onClick: (event) => {
                            //         setFilterEnabled((state) => !state);
                            //       },
                            //     },
                            //     // rowData => ({
                            //     //     icon: () => <InfoIcon 
                            //     //     // color={rowData.cleaning_status === 'Overdue' ? "error" : rowData.cleaning_status === 'Due' ? 'warning' :rowData.cleaning_status === 'Cleaned' ? 'success' : "default"} 
                            //     //     />,
                            //     //     tooltip: `${rowData.cleaning_status}`,
                            //     //       onClick: (event, rowData) => { 
                            //     //         greaseInfoToggle();
                            //     //           if(rowData?.grease_trap?.image){
                            //     //           let imageUrl=rowData?.grease_trap?.image.split('/media')
                            //     //           setInfoData({...rowData,grease_trap:{...rowData.grease_trap,image:`/media${imageUrl[1]}`},isAll:true}) 
                            //     //           }
                            //     //           else{setInfoData({...rowData,isAll:true}) 
                            //     //           }
                            //     //       },
                            //     //     }),
                            //         rowData => ({
                            //           icon: UndoIcon,
                            //           tooltip: 'Recover Data', 
                            //           onClick: (event, rowData) => {
                            //                 greaseTrapUpdateHandler(rowData.id,'Recover')
                            //           },
                            //           hidden:userData.user_type === 'User' || rowData.status !== 'Deleted' || ['Deleted','Disabled'].includes(rowData.entity.status)
                            //         }),
                                   
                            //         rowData => ({
                            //           icon: LockOpenIcon,
                            //           tooltip: 'Enable Grease Trap',
                            //           onClick: (event, rowData) => {
                            //                 greaseTrapUpdateHandler(rowData.id,'Active')
                            //           },
                            //           hidden : ["Active","Deleted"].includes(rowData.status) || userData.user_type === 'User'
                            //         }),
                            //         rowData => ({
                            //           icon: LockIcon,
                            //           tooltip: 'Disable Grease Trap',
                            //           onClick: (event, rowData) => {
                            //                 greaseTrapUpdateHandler(rowData.id,'Disabled')
        
                            //           },
                            //           hidden: ["Disabled", "Deleted"].includes(rowData.status) || userData.user_type === 'User'
                            //         }),
                            //         rowData => ({
                            //           icon: DeleteOutline,
                            //           tooltip: 'Delete Grease Trap',
                            //           onClick: (event, rowData) => {
                            //                 greaseTrapUpdateHandler(rowData.id,'Deleted') 
                            //           },
                            //           hidden:userData.user_type === 'User' || rowData.status === 'Deleted'
                            //         }),
                            // ]}

                           
                            options={{
                            //   exportFileName:'Violations List',
                            //   exportAllData: true,
                              actionsColumnIndex: -1,
                            //   exportButton: true,
                              filtering: false,
                              pageSizeOptions:pageSizeOptions,
                              pageSize: pageSize,
                              columnsButton:true,
                              headerStyle:headerStyles(),
                              rowStyle:rowStyles(),
                              searchFieldStyle:searchFieldStyle(),
                              debounceInterval:debounceIntervalForTable,
                            }}
                            // icons={tableIcons}
                          />
                      </ThemeProvider>
                    </div>
  )
}

export default DepartmentList
