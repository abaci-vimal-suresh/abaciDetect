import Swal from 'sweetalert2';
import { buttonColor } from './constants';

const showConfirmationDialog = (showText) => {
	return Swal.fire({
		title: 'Are you sure?',
		icon: 'info',
		text: showText,
		showCancelButton: true,
		iconColor: 'info',
		confirmButtonColor: buttonColor[1],
		cancelButtonColor: buttonColor[0],
		confirmButtonText: 'Ok',
	}).then((result) => {
		return result.isConfirmed; // Return true if confirmed, false otherwise
	});
};
export default showConfirmationDialog;
