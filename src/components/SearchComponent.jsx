import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'reactstrap';
import Icon from './icon/Icon';

const SearchComponent = ({ handleChange }) => {
	return (
		<div className='d-flex me-4' data-tour='search'>
			{/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
			<label className='border-0 bg-transparent cursor-pointer mt-2'>
				<Icon icon='Search' size='2x' color='secondary' />
			</label>
			<Input
				id='searchInput'
				type='search'
				className='border-0 shadow-none bg-transparent'
				placeholder='Search...'
				onChange={(e) => handleChange(e.target.value)}
				// value={formik.values.searchInput}
				autoComplete='off'
			/>
		</div>
	);
};
/* eslint-disable react/forbid-prop-types */
SearchComponent.propTypes = {
	handleChange: PropTypes.func.isRequired,
};
/* eslint-enable react/forbid-prop-types */
export default SearchComponent;
