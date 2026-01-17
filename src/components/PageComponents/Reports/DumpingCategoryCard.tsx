import React from 'react';
import classNames from 'classnames';
import Card, { CardBody } from '../../bootstrap/Card';
import useDarkMode from '../../../hooks/shared/useDarkMode';
import Icon from '../../icon/Icon';
import Badge from '../../bootstrap/Badge';

const DumpingCategoryCard = ({ category_data }) => {
	const { darkModeStatus } = useDarkMode();

	// Generate a color based on category name for consistent styling
	const getCategoryColor = (categoryName) => {
		const colors = ['primary', 'success', 'warning', 'danger', 'info', 'secondary', 'dark'];
		const index = categoryName.length % colors.length;
		return colors[index];
	};

	const categoryColor = getCategoryColor(category_data?.entity__category__main_category);

	return (
		<div className='col d-flex justify-content-center'>
			<Card borderSize={1} style={{ width: 250 }}>
				<CardBody>
					<div className='d-flex flex-column align-items-center position-relative'>
						{/* Icon */}
						<div className='ratio ratio-1x1 mb-3' style={{ width: 80 }}>
							<div
								className={classNames(
									'rounded-2',
									'd-flex align-items-center justify-content-center',
									`bg-${categoryColor}-subtle`,
								)}>
								<Icon 
									icon='Recycling' 
									size='lg' 
									className={`text-${categoryColor}`}
								/>
							</div>
						</div>

						{/* Category Name */}
						<div className='fw-bold fs-6 text-center mb-2'>
							{category_data?.entity__category__main_category}
						</div>

						{/* Total Gallons */}
						<Badge 
							isLight 
                            // color=''
							// color={categoryColor} 
							className='px-3 py-2 mt-2 mb-2'
						>
							<Icon icon='WaterDrop' size='lg' className='me-1' />
							{category_data?.total_gallon_collected?.toLocaleString()} gallons
						</Badge>

						{/* Additional info */}
						<small className='text-muted text-center'>
							Total collected
						</small>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default DumpingCategoryCard; 
