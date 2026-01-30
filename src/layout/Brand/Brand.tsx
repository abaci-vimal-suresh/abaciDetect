import React, { FC } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '../../components/icon/Icon';
import Button from '../../components/bootstrap/Button';

interface IBrandProps {
	asideStatus: boolean;
	isDark: boolean;
	setAsideStatus(...args: unknown[]): unknown;
}
const Brand: FC<IBrandProps> = ({ asideStatus, setAsideStatus, isDark }) => {
	return (
		<div className='brand'>
			<div className='brand-logo'>
				<Link to='/' className='d-flex flex-column align-items-center text-decoration-none' aria-label='Abaci Detect'>
					<Icon icon='Sensors' color='primary' className='brand-icon' />
					<div className='brand-text mt-2 text-center'>
						<div className='fw-bold text-primary brand-title-main'>ABACI</div>
						<div className='fw-light opacity-75 brand-title-sub'>DETECT</div>
					</div>
				</Link>
			</div>
			<Button
				type='button'
				className='brand-aside-toggle'
				aria-label='Toggle Aside'
				isNeumorphic
				onClick={() => setAsideStatus(!asideStatus)}>
				<Icon icon='FirstPage' className='brand-aside-toggle-close' />
				<Icon icon='LastPage' className='brand-aside-toggle-open' />
			</Button>
		</div >
	);
};
Brand.propTypes = {
	asideStatus: PropTypes.bool.isRequired,
	setAsideStatus: PropTypes.func.isRequired,
};

export default Brand;
