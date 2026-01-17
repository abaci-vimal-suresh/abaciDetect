import { FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardTitle, Badge } from 'reactstrap';
import classNames from 'classnames';
import useTourStep from '../../../hooks/useTourStep';
import useDarkMode from '../../../hooks/shared/useDarkMode';
import TruckImage from '../../../assets/img/truck.jpg'; // Placeholder image
 // or define inline
export interface VehicleCardProps {
	id: string;
	image: string;
	title: string;
	description?: string;
	tags?: { text: string; color: string }[];
	color: string; // for background color like 'primary', 'danger', etc.
	navigateTo?: string; // Optional path segment for routing
	onClick?: () => void; // Optional custom click handler
	tourStep?: number; // Optional for onboarding/tour usage
}

export const VehicleCard: FC<VehicleCardProps> = ({
	id,
	image,
	title,
	description,
	tags,
	color,
	navigateTo,
	onClick,
	tourStep,
}) => {
	if (tourStep) useTourStep(tourStep);
	const { darkModeStatus } = useDarkMode();
	const navigate = useNavigate();

	const handleOnClick = useCallback(() => {
		if (onClick) return onClick();
		if (navigateTo) navigate(`${navigateTo}/${id}`);
	}, [navigate, id, onClick, navigateTo]);

	return (
		<Card
			className='cursor-pointer shadow-3d-primary shadow-3d-hover'
			onClick={handleOnClick}
			data-tour={title}>
			<CardBody>
				<div
					className={classNames(
						'ratio ratio-1x1',
						'rounded-2',
						`bg-l${darkModeStatus ? 'o25' : '10'}-${color}`,
						'mb-3',
					)}>
					<img
						src={TruckImage}
						alt={title}
						width='100%'
						height='auto'
						className='object-fit-contain p-1'
						style={{ borderRadius: '0.5rem' }} // Adjust as needed
					/>
				</div>
				<CardTitle tag='div' className='h5'>
					{title}
				</CardTitle>
				{description && (
					<p className='text-muted truncate-line-2'>{description}</p>
				)}
				{!!tags?.length && (
					<div className='row g-2'>
						{tags.map((tag) => (
							<div key={tag.text} className='col-auto'>
								<Badge isLight color={tag.color} className='px-3 py-2'>
									{tag.text}
								</Badge>
							</div>
						))}
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default VehicleCard;

