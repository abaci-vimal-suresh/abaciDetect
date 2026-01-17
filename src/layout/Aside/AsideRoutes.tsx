import React from 'react';
import { Route, Routes } from 'react-router-dom';
import asideRoutes from '../../routes/asideRoutes';

const AsideRoutes = () => {
	return (
		<Routes>
			{asideRoutes.map((page) => (
				// eslint-disable-next-line react/jsx-props-no-spreading
				<Route key={page.path} {...page} />
			))}
		</Routes>
	);
};

export default AsideRoutes;
