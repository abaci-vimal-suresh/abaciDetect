import { createTheme } from '@mui/material/styles';
import { useContext } from 'react';
import useDarkMode from './useDarkMode';
import { tableStyleOverrideConstant } from '../helpers/constants';
import ThemeContext from '../contexts/themeContext';

const useTablestyle = (containerRef: any = null) => {
	const { themeStatus } = useDarkMode();
	const { fullScreenStatus } = useContext(ThemeContext);

	const theme = createTheme({
		palette: {
			mode: themeStatus,
			primary: {
				main: '#7a3a6f',
			},
			secondary: {
				main: '#a87ca1',
			},
			background: {
				default: themeStatus === 'dark' ? '#1f2128' : '#EEF2F5',
				paper: themeStatus === 'dark' ? '#1f2128' : '#EEF2F5',
			},
		},
		typography: {
			fontFamily: 'Poppins, sans-serif',
		},
		// @ts-ignore
		overrides: tableStyleOverrideConstant,
		components: {
			MuiPaper: {
				styleOverrides: {
					root: {
						backgroundColor: themeStatus === 'dark' ? '#1f2128' : '#EEF2F5', // Neumorphic background
						fontFamily: 'inherit',
						boxShadow: themeStatus === 'dark'
							? '0 2px 4px rgba(0, 0, 0, 0.2), 8px 8px 16px rgba(0, 0, 0, 0.35)'
							: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff',
						backgroundImage: 'none',
						borderRadius: '6px 6px 0 0',
						border: 'none !important',
						overflow: 'hidden',
					},
				},
			},
			MuiPopover: {
				defaultProps: {
					container: fullScreenStatus ? (document.fullscreenElement || containerRef?.current) : (containerRef?.current || undefined),
				},
				styleOverrides: {
					paper: {
						borderRadius: '8px',
						backgroundColor: themeStatus === 'dark' ? '#252730' : '#EEF2F5',
						border: themeStatus === 'dark'
							? '1px solid rgba(168, 124, 161, 0.25)'
							: 'none',
						boxShadow: themeStatus === 'dark'
							? '0 4px 12px rgba(0, 0, 0, 0.4)'
							: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff',
					},
				},
			},
			MuiMenu: {
				defaultProps: {
					container: fullScreenStatus ? (document.fullscreenElement || containerRef?.current) : (containerRef?.current || undefined),
				},
			},
			MuiInputBase: {
				styleOverrides: {
					root: {
						backgroundColor: themeStatus === 'dark' ? '#252730' : '#ffffff',
						fontFamily: 'inherit',
						padding: '0 14px',
						borderRadius: '8px',
						border: themeStatus === 'dark'
							? '1.5px solid rgba(168, 124, 161, 0.3)'
							: '1.5px solid rgba(122, 58, 111, 0.2)',
						transition: 'all 0.2s ease',
						'&:hover': {
							borderColor: themeStatus === 'dark'
								? 'rgba(168, 124, 161, 0.5) !important'
								: 'rgba(122, 58, 111, 0.35) !important',
							backgroundColor: themeStatus === 'dark'
								? '#2a2d38'
								: '#fafafa',
						},
						'&.Mui-focused': {
							borderColor: themeStatus === 'dark'
								? '#a87ca1 !important'
								: '#7a3a6f !important',
							backgroundColor: themeStatus === 'dark'
								? '#2a2d38'
								: '#ffffff',
							boxShadow: themeStatus === 'dark'
								? '0 0 0 3px rgba(168, 124, 161, 0.15)'
								: '0 0 0 3px rgba(122, 58, 111, 0.08)',
						},
						'&::before': {
							border: '0 !important',
						},
						'&::after': {
							border: '0 !important',
						},
					},
				},
			},
			MuiMenuItem: {
				styleOverrides: {
					root: {
						fontFamily: 'inherit',
						borderRadius: '6px',
						margin: '3px 8px',
						padding: '10px 12px',
						transition: 'all 0.2s ease',
						color: themeStatus === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#323232',
						'&:hover': {
							backgroundColor: themeStatus === 'dark'
								? 'rgba(168, 124, 161, 0.2)'
								: 'rgba(122, 58, 111, 0.08)',
						},
						'&.Mui-selected': {
							backgroundColor: themeStatus === 'dark'
								? 'rgba(168, 124, 161, 0.25)'
								: 'rgba(122, 58, 111, 0.12)',
							fontWeight: 600,
							'&:hover': {
								backgroundColor: themeStatus === 'dark'
									? 'rgba(168, 124, 161, 0.35)'
									: 'rgba(122, 58, 111, 0.18)',
							},
						},
					},
				},
			},
			MuiToolbar: {
				styleOverrides: {
					root: {
						backgroundColor: 'transparent !important',
						paddingLeft: '1.5rem !important',
						paddingRight: '1.5rem !important',
						minHeight: '72px !important',
						borderBottom: 'none !important',
					}
				}
			},
			MuiTable: {
				styleOverrides: {
					root: {
						backgroundColor: 'transparent',
						borderRadius: '0',
						overflow: 'hidden',
					}
				}
			},
			MuiTableHead: {
				styleOverrides: {
					root: {
						backgroundColor: themeStatus === 'dark'
							? 'rgba(168, 124, 161, 0.08)'
							: 'rgba(122, 58, 111, 0.05)',
						'& .MuiTableCell-head': {
							borderBottom: 'none !important',
							fontWeight: 700,
							fontSize: '0.875rem',
							textTransform: 'uppercase',
							letterSpacing: '1px',
							color: themeStatus === 'dark'
								? '#b89aaf'
								: '#7a3a6f',
							padding: '20px 20px',
						},
					},
				},
			},
			MuiTableBody: {
				styleOverrides: {
					root: {
						'& .MuiTableRow-root': {
							transition: 'all 0.15s ease',
						},
					},
				},
			},
			MuiTableRow: {
				styleOverrides: {
					root: {
						'&:hover': {
							backgroundColor: themeStatus === 'dark'
								? 'rgba(168, 124, 161, 0.12) !important'
								: 'rgba(122, 58, 111, 0.04) !important',
						},
						'&:nth-of-type(even)': {
							backgroundColor: themeStatus === 'dark'
								? 'rgba(255, 255, 255, 0.015)'
								: 'rgba(0, 0, 0, 0.015)',
						},
					}
				}
			},
			MuiTableCell: {
				styleOverrides: {
					root: {
						fontFamily: 'inherit',
						borderBottom: themeStatus === 'dark'
							? '1px solid rgba(255, 255, 255, 0.04)'
							: '1px solid rgba(0, 0, 0, 0.04)',
						padding: '18px 20px',
						color: themeStatus === 'dark'
							? 'rgba(255, 255, 255, 0.9)'
							: '#323232',
						fontSize: '0.9rem',
					},
					head: {
						fontWeight: 700,
						fontSize: '0.875rem',
						textTransform: 'uppercase',
						letterSpacing: '1px',
						color: themeStatus === 'dark'
							? '#b89aaf !important'
							: '#7a3a6f !important',
					},
				},
			},
			MuiTablePagination: {
				styleOverrides: {
					root: {
						borderTop: themeStatus === 'dark'
							? '1px solid rgba(255, 255, 255, 0.15)'
							: '1px solid rgba(122, 58, 111, 0.08)',
						backgroundColor: 'transparent !important',
						color: themeStatus === 'dark'
							? 'rgba(255, 255, 255, 0.9)'
							: '#323232',
						padding: '12px 20px',
					},
					toolbar: {
						minHeight: '56px !important',
						padding: '0 !important',
					},
					selectLabel: {
						margin: 0,
						fontSize: '0.875rem',
						color: themeStatus === 'dark'
							? 'rgba(255, 255, 255, 0.7)'
							: '#6c757d',
					},
					displayedRows: {
						margin: 0,
						fontSize: '0.875rem',
						color: themeStatus === 'dark'
							? 'rgba(255, 255, 255, 0.7)'
							: '#6c757d',
					},
					select: {
						borderRadius: 'px',
						border: themeStatus === 'dark'
							? '0px solid rgba(255, 255, 255, 0.2)'
							: '0px solid rgba(122, 58, 111, 0.15)',
						padding: '6px 32px 6px 10px',
						backgroundColor: themeStatus === 'dark'
							? '#252730'
							: '#ffffff',
						fontSize: '0.875rem',
						marginRight: '8px',
						marginLeft: '8px',
					},
					selectIcon: {
						color: themeStatus === 'dark' ? '#b89aaf' : '#7a3a6f',
						right: '4px',
					},
					actions: {
						marginLeft: '16px',
						'& .MuiIconButton-root': {
							padding: '8px',
							borderRadius: '6px',
							'&:hover': {
								backgroundColor: themeStatus === 'dark'
									? 'rgba(168, 124, 161, 0.15)'
									: 'rgba(122, 58, 111, 0.08)',
							},
						}
					},
				},
			},
			MuiIconButton: {
				styleOverrides: {
					root: {
						color: themeStatus === 'dark' ? '#b89aaf' : '#7a3a6f',
						transition: 'all 0.2s ease',
						borderRadius: '1px',
						'&:hover': {
							backgroundColor: 'transparent',
							transform: 'scale(0.95)',
						},

						'&.Mui-disabled': {
							color: themeStatus === 'dark'
								? 'rgba(255, 255, 255, 0.3)'
								: 'rgba(0, 0, 0, 0.3)',
						}
					},
				},
			},
			MuiCheckbox: {
				styleOverrides: {
					root: {
						color: themeStatus === 'dark'
							? 'rgba(168, 124, 161, 0.6)'
							: 'rgba(122, 58, 111, 0.6)',
						borderRadius: '4px',
						'&.Mui-checked': {
							color: themeStatus === 'dark' ? '#b89aaf' : '#7a3a6f',
						},
						'&:hover': {
							backgroundColor: themeStatus === 'dark'
								? 'rgba(168, 124, 161, 0.1)'
								: 'rgba(122, 58, 111, 0.05)',
						}
					},
				},
			},
			MuiSvgIcon: {
				styleOverrides: {
					root: {
						color: themeStatus === 'dark'
							? 'rgba(255, 255, 255, 0.85)'
							: '#495057',
					},
				},
			},
		},
	});

	// Enhanced table styles with better visibility
	const headerStyles = () => ({
		backgroundColor: themeStatus === 'dark'
			? 'rgba(168, 124, 161, 0.08)'
			: 'rgba(122, 58, 111, 0.05)',
		fontWeight: 700,
		fontSize: '0.875rem',
		fontFamily: 'inherit',
		padding: '20px',
		color: themeStatus === 'dark' ? '#b89aaf' : '#7a3a6f',
		textTransform: 'uppercase' as const,
		letterSpacing: '1px',
	});

	const headerStylesForSelection = () => ({
		backgroundColor: themeStatus === 'dark'
			? 'rgba(168, 124, 161, 0.08)'
			: 'rgba(122, 58, 111, 0.05)',
		fontWeight: 700,
		fontSize: '0.875rem',
		fontFamily: 'inherit',
		padding: '20px 20px 20px 0',
		color: themeStatus === 'dark' ? '#b89aaf' : '#7a3a6f',
	});

	const rowStyles = () => (rowData, index) => {
		if (index % 2 !== 0) {
			return {
				backgroundColor: themeStatus === 'dark'
					? 'rgba(255, 255, 255, 0.015)'
					: 'rgba(0, 0, 0, 0.015)',
			};
		}
		return {};
	};

	const searchFieldStyle = () => ({
		borderRadius: '8px',
		backgroundColor: themeStatus === 'dark' ? '#252730' : '#ffffff',
		padding: '10px 16px',
		fontFamily: 'inherit',
		fontSize: '0.9rem',
		border: themeStatus === 'dark'
			? '1.5px solid rgba(168, 124, 161, 0.3)'
			: '1.5px solid rgba(122, 58, 111, 0.2)',
		width: '260px',
		transition: 'all 0.2s ease',
		color: themeStatus === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#323232',
		'&:hover': {
			borderColor: themeStatus === 'dark'
				? 'rgba(168, 124, 161, 0.5)'
				: 'rgba(122, 58, 111, 0.35)',
			backgroundColor: themeStatus === 'dark'
				? '#2a2d38'
				: '#fafafa',
		},
		'&:focus': {
			outline: 'none',
			borderColor: themeStatus === 'dark'
				? '#a87ca1'
				: '#7a3a6f',
			backgroundColor: themeStatus === 'dark'
				? '#2a2d38'
				: '#ffffff',
			boxShadow: themeStatus === 'dark'
				? '0 0 0 3px rgba(168, 124, 161, 0.15)'
				: '0 0 0 3px rgba(122, 58, 111, 0.08)',
		},
	});

	return {
		theme,
		headerStyle: headerStyles,
		headerStyles: headerStyles,
		rowStyle: rowStyles,
		rowStyles: rowStyles,
		searchFieldStyle: searchFieldStyle,
		headerStylesForSelection: headerStylesForSelection
	};
};

export default useTablestyle;