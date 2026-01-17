import { Suspense } from 'react';

import AbaciLoader from '../../components/AbaciLoader/AbaciLoader';
import ContentRoutes from './ContentRoutes';


const Content = () => {
	return (
		<main className='content'>
			<Suspense fallback={<AbaciLoader />}>
				<ContentRoutes />
			</Suspense>
		</main>
	);
};

export default Content;
