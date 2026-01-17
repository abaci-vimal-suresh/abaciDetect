import axios from "axios"
import fileDownload from "js-file-download"
import { authAxios } from "../axiosInstance"
import { csvLimit, pdfLimit } from "./constants"
import pdfGenerator from "./PDFReportGenerator"
import { buildExportUrl } from "./functions"
// import useToasterNotification from "../hooks/shared/useToasterNotification"


export const exportData = (downloadType,download_url,totalCount,file_name,hiddenColumnsKey,columns) => {
  if(!columns) {
    alert('Columns are not defined')
    return;
  }

  // columns
  // console.log(columns)
    // const {showErrorNotification} = useToasterNotification()
    // let url =  buildExportUrl(download_url, downloadType)
    let url = `${download_url}&export=${downloadType}`
    if(hiddenColumnsKey?.length > 0){
      // console.log(excluded_columns)
      columns.forEach(data => {
        if(!data.hidden){
        url+=`&field=${data.field}`
        }
      })
    }
    else{
      columns.forEach(data => {
        // if(data.hidden){
        url+=`&field=${data.field}`
        // }
      })
    }
    // setDownloadIndicator(true)
    if (downloadType === "pdf") {
      if (totalCount >= (file_name === 'Expected Vs Recieved Waste' ? 2500 : pdfLimit)) {
        // ErrorAlert(`The maximum records to export as PDF is ${file_name === 'Expected Vs Recieved Waste' ? '2500' : pdfLimit}. Please apply filter to reduce the number of records`)
        // setDownloadIndicator(false)
        return
      }
      authAxios({
        url: url,
        method: 'GET',
        // responseType: 'blob', // Important
      }).then((response) => {
        // console.log(response.data?.body)
        const headRowData = [response.data?.header]
        const bodyRowData = response.data?.body
        const reportName = file_name
        var doc = pdfGenerator(headRowData, bodyRowData, reportName)
        doc.save(`${file_name}.pdf`);
        // setDownloadIndicator(false)
        // tableRef.onQueryChange();
      }).catch(error => {
        // Toastr("error", "Error downloading the file !")
        // showErrorNotification("Error downloading the file !")
        // setDownloadIndicator(false)
      });
    }
    else {
      if (totalCount >= (file_name === 'Expected Vs Recieved Waste' ? 2500 :csvLimit)) {
        // showErrorNotification(`The maximum records to export as CSV is ${file_name === 'Expected Vs Recieved Waste' ? '2500' : csvLimit}. Please apply filter to reduce the number of records`)
        // setDownloadIndicator(false)
        return
      }
      axios({
        url: url,
        method: 'GET',
        responseType: 'blob', // Important
      }).then((response) => {
        let fileName = `${file_name}.csv`
        fileDownload(response.data, fileName);
        // setDownloadIndicator(false)
        // tableRef.current.onQueryChange();
      }).catch(error => {
        // Toastr("error", "Error downloading the file !")
        // setDownloadIndicator(false)
      });
    }
  }

