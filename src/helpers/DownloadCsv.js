import fileDownload from 'js-file-download';
import { authAxios } from '../axiosInstance';
// import showNotification from '../components/extras/showNotification';

const downloadHandler = (url, name, setLoading, showNotification) => {
	setLoading(true)
	authAxios({
		url,
		method: 'GET',
		responseType: 'blob',
	})
		.then((response) => {
			fileDownload(response.data, name);
			setLoading(false)
		})
		.catch(() => {
			setLoading(false);
			if (showNotification) {
				showNotification('Error', 'Error downloading the file !', 'danger');
			}
		});
};
export default downloadHandler;
