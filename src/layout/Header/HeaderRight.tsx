import React, { FC, ReactNode, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUnreadCount } from '../../store/sensorEventsSlice';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useTour } from '@reactour/tour';
import Button, { IButtonProps } from '../../components/bootstrap/Button';
import { HeaderRight } from './Header';
import Icon from '../../components/icon/Icon';
import ThemeContext from '../../contexts/themeContext';
import useDarkMode from '../../hooks/useDarkMode';
import Popovers from '../../components/bootstrap/Popovers';

import Notifications from './Notification';

interface IMainHeaderRightProps {
	beforeChildren?: ReactNode;
	afterChildren?: ReactNode;
}
const MainHeaderRight: FC<IMainHeaderRightProps> = ({ beforeChildren, afterChildren }) => {
	// Use new selector for unread count
	const unreadCount = useSelector(selectUnreadCount);
	const { darkModeStatus, setDarkModeStatus } = useDarkMode();
	const { fullScreenStatus, setFullScreenStatus, privacyShield, setPrivacyShield } = useContext(ThemeContext);

	const styledBtn: IButtonProps = {
		color: darkModeStatus ? 'dark' : 'light',
		hoverShadow: 'default',
		isLight: !darkModeStatus,
		size: 'lg',
	};

	const [offcanvasStatus, setOffcanvasStatus] = useState(false);
	const { i18n } = useTranslation();
	/**
	 * Language attribute
	 */
	useLayoutEffect(() => {
		document.documentElement.setAttribute('lang', i18n.language.substring(0, 2));
	});

	const { setIsOpen } = useTour();

	return (
		<>
			<HeaderRight>

				<div className='row g-3'>
					{beforeChildren}

					{/* Privacy Shield Toggle */}
					<div className='col-auto'>
						<Popovers trigger='hover' desc={privacyShield ? 'Disable Privacy Shield' : 'Enable Privacy Shield'}>
							<Button
								// eslint-disable-next-line react/jsx-props-no-spreading
								{...styledBtn}
								isNeumorphic
								color={privacyShield ? 'success' : 'light'}
								isLight={!privacyShield}
								icon={privacyShield ? 'Security' : 'GppBad'}
								onClick={() => setPrivacyShield(!privacyShield)}
								className={privacyShield ? 'text-white' : ''}
								aria-label='Toggle Privacy Shield'>
								{/* {privacyShield && <span className='ms-2 d-none d-md-inline'>Protected</span>} */}
							</Button>
						</Popovers>
					</div>

					{/* Dark Mode */}
					<div className='col-auto'>
						<Popovers trigger='hover' desc='Dark / Light mode'>
							<Button
								// eslint-disable-next-line react/jsx-props-no-spreading
								{...styledBtn}
								isNeumorphic
								onClick={() => setDarkModeStatus(!darkModeStatus)}
								className='btn-only-icon'
								data-tour='dark-mode'
								aria-label='Toggle dark mode'>
								<Icon
									icon={darkModeStatus ? 'DarkMode' : 'LightMode'}
									color={darkModeStatus ? 'info' : 'warning'}
									className='btn-icon'
								/>
							</Button>
						</Popovers>
					</div>

					{/*	Full Screen */}
					<div className='col-auto'>
						<Popovers trigger='hover' desc='Fullscreen'>
							<Button
								// eslint-disable-next-line react/jsx-props-no-spreading
								{...styledBtn}
								isNeumorphic
								icon={fullScreenStatus ? 'FullscreenExit' : 'Fullscreen'}
								onClick={() => setFullScreenStatus(!fullScreenStatus)}
								aria-label='Toggle fullscreen'
							/>
						</Popovers>
					</div>

					{/*	Notifications */}
					<div className='col-auto'>
						<div className='col-auto position-relative'>
							{unreadCount > 0 && (
								<div className='position-absolute start-85 mt-2 top-0 translate-middle badge rounded-pill bg-danger notification_icon_styles'>
									{unreadCount > 99 ? '99+' : unreadCount}
								</div>
							)}
							<Button
								{...styledBtn}
								isNeumorphic
								icon='Notifications'
								onClick={() => setOffcanvasStatus(true)}
								aria-label='Notifications'
							/>
						</div>
					</div>
					{afterChildren}
				</div>
				{/* {offcanvasStatus&&
		   <Notifications 
		   setIsOpen={setOffcanvasStatus} 
			isOpen={offcanvasStatus}/>
		   } */}

			</HeaderRight>
			{offcanvasStatus &&
				<Notifications
					setIsOpen={setOffcanvasStatus}
					isOpen={offcanvasStatus} />
			}
		</>
	);
};
MainHeaderRight.propTypes = {
	// @ts-ignore
	beforeChildren: PropTypes.node,
	// @ts-ignore
	afterChildren: PropTypes.node,
};
MainHeaderRight.defaultProps = {
	beforeChildren: null,
	afterChildren: null,
};

export default MainHeaderRight;
