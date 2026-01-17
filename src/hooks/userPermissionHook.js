import { useContext } from "react";
import AuthContext from "../contexts/authContext";

const permissionObject = {
	reader_add: ['Superuser'],
	is_super_user: ['Superuser'],
	trip_schedule_management: ['Admin', 'Superuser'],
	trip_details_management: ['Admin', 'Superuser'],
	route_management: ['Admin', 'Superuser'],
	bus_management: ['Admin', 'Superuser'],
	employee_delete: ['Admin', 'Superuser'],
	driver_management: ['Admin', 'Superuser'],
	inspector_management: ['Admin', 'Superuser'],
	user_management: ['Admin', 'Superuser'],
	reader_management: ['Admin', 'Superuser'],
	showKioskNotifications: ['Admin', 'Superuser'],
};

const usePermissionHook = (page) => {
	const { userData } = useContext(AuthContext)
	if (!permissionObject[page]) {
		console.warn(`Permission key "${page}" not found in permissionObject`);
		return false;
	}
	// Use role as per project standard, fallback to user_type if present
	const currentRole = userData?.role || userData?.user_type;
	return permissionObject[page].includes(currentRole);
};

export default usePermissionHook;
