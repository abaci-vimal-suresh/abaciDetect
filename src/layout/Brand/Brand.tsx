import React, { FC } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '../../components/icon/Icon';
import Button from '../../components/bootstrap/Button';

import Tooltips from '../../components/bootstrap/Tooltips';

interface IBrandProps {
	asideStatus: boolean;
	isDark: boolean;
	setAsideStatus(...args: unknown[]): unknown;
}
const Brand: FC<IBrandProps> = ({ asideStatus, setAsideStatus, isDark }) => {
	return (
		<div className='brand d-flex align-items-center justify-content-between w-100'>
			<div className='brand-logo'>
				<Link to='/' className='d-flex align-items-center text-decoration-none ' aria-label='Abaci Detect'>
					<Icon icon='Sensors' color='primary' className='brand-icon me-2' />
					{asideStatus && (
						<div className='brand-text d-flex flex-column align-items-start'>
							<div className='fw-bold text-primary brand-title-main' style={{ fontSize: '1.4rem' }}>Abaci</div>
							<div className='fw-bold opacity-50 brand-title-sub' style={{ fontSize: '0.65rem', letterSpacing: '2px' }}>DETECT</div>
						</div>
					)}
				</Link>
			</div>

			<Tooltips title={asideStatus ? 'Collapse Sidebar' : 'Expand Sidebar'} flip={['right']}>
				<Button
					type='button'
					className='brand-aside-toggle border-0 p-1 bg-transparent'
					aria-label='Toggle Aside'
					onClick={() => setAsideStatus(!asideStatus)}>
					<Icon icon={asideStatus ? 'MenuOpen' : 'Menu'} size='lg' className='text-secondary opacity-75' />
				</Button>
			</Tooltips>
		</div >
	);
};
Brand.propTypes = {
	asideStatus: PropTypes.bool.isRequired,
	setAsideStatus: PropTypes.func.isRequired,
};

export default Brand;
