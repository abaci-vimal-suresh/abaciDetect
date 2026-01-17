import React, { FC } from 'react';
import PropTypes from 'prop-types';

const logo = '/logo-light.svg';
interface ILogoProps {
	width?: number;
	height?: number;
	dark?: boolean;
}
const Logo: FC<ILogoProps> = ({ width = 150, height = 89, dark = true }) => {
	return (
		<img
			src={logo}
			alt="Paste your alt text here"
			width={width}
			height={height}
		/>

	);
};
Logo.propTypes = {
	width: PropTypes.number,
	height: PropTypes.number,
};
Logo.defaultProps = {
	width: 2155,
	height: 854,
	dark: true
};

export default Logo;
