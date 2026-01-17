import React, { useContext } from 'react';
import Brand from '../Brand/Brand';
import Navigation, { NavigationLine } from '../Navigation/Navigation';
import User from '../User/User';
import ThemeContext from '../../contexts/themeContext';
import Aside, { AsideBody, AsideFoot, AsideHead } from './Aside';
import AuthContext from '../../contexts/authContext';
import { AdminRoutes, UserRoutes } from '../../routes/RoutesMenu';


const userTypeMenuObjects: any = {
	'Organization': AdminRoutes,
	'GTCC': AdminRoutes,
	'Admin': AdminRoutes,
	'User': UserRoutes,
	'Assistant User': AdminRoutes,
	'Establishment': AdminRoutes,
	'Region': AdminRoutes,
}

const MainSidebar = () => {
	const { userData } = useContext(AuthContext)
	const { asideStatus, setAsideStatus, darkModeStatus } = useContext(ThemeContext);
	return (
		<Aside >
			<AsideHead>
				<Brand asideStatus={asideStatus} setAsideStatus={setAsideStatus} isDark={darkModeStatus} />
			</AsideHead>
			<AsideBody>
				<Navigation menu={userTypeMenuObjects[userData?.role] || AdminRoutes} id='aside-dashboard' className='user-select-none' />
				<NavigationLine />
			</AsideBody>
			<AsideFoot>
				<User />
			</AsideFoot>
		</Aside>
	);
};

export default MainSidebar;
