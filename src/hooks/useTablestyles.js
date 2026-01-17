import { createTheme } from '@mui/material/styles';
import useDarkMode from './useDarkMode';
import { tableStyleOverrideConstant } from '../helpers/constants';

const useTablestyle = (containerRef = null) => {
	const { themeStatus } = useDarkMode();

	const theme = createTheme({
		palette: {
			mode: themeStatus,
			primary: {
				main: '#808080',
			},
		},
		// @ts-ignore
		overrides: tableStyleOverrideConstant,
		components: {
			MuiPaper: {
				styleOverrides: {
					root: {
						backgroundColor: 'transparent',
						fontFamily: 'inherit',
						boxShadow: 'none',
						backgroundImage: 'none',
					},
				},
			},
			MuiPopover: {
				defaultProps: {
					// Fix for fullscreen dropdown visibility
					container: containerRef?.current || undefined,
				},
				styleOverrides: {
					paper: {
						borderRadius: '10px',
					},
				},
			},
			MuiMenu: {
				defaultProps: {
					// Fix for fullscreen dropdown visibility
					container: containerRef?.current || undefined,
				},
			},
			MuiInputBase: {
				styleOverrides: {
					root: {
						backgroundColor: 'transparent',
						fontFamily: 'inherit',
						padding: '0 8px',
						borderRadius: '10px',
						border: '1px solid rgba(0,0,0,0.1)',
						'&:hover': {
							borderColor: 'rgba(0,0,0,0.2) !important',
						},
						'&.Mui-focused': {
							borderColor: 'rgba(0,0,0,0.3) !important',
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
					},
				},
			},
			MuiToolbar: {
				styleOverrides: {
					root: {
						backgroundColor: 'transparent !important',
						paddingLeft: '1.25rem !important',
						paddingRight: '1.25rem !important',
					}
				}
			},
			MuiTable: {
				styleOverrides: {
					root: {
						backgroundColor: 'transparent',
					}
				}
			}
		},
	});

	// tableStyles.js
	const headerStyles = () => ({
		backgroundColor: 'transparent',
		fontWeight: 700,
		fontSize: '0.99rem',
		fontFamily: 'inherit',
		padding: '20px',
		whiteSpace: 'nowrap'
	});

	const headerStylesForSelection = () => ({
		backgroundColor: 'transparent',
		fontWeight: 700,
		fontSize: '0.99rem',
		fontFamily: 'inherit',
		padding: '15px 15px 15px 0',
		whiteSpace: 'nowrap',


	});

	const rowStyles = () => (rowData, index) => {
		if (index % 2 !== 0) {
			return {
				backgroundColor: 'rgba(0,0,0,0.02)',
				borderRadius: '10px',
			};
		}
		return {};
	};

	const searchFieldStyle = () => ({
		borderRadius: '10px',
		backgroundColor: 'transparent',
		padding: ' 4px 10px',
		fontFamily: 'inherit',
		fontSize: '0.95rem',
		border: '2px solid #C4C4C4',
		width: '220px',
		transition: 'border-color 0.3s ease',
	})

	return { theme, headerStyles, rowStyles, searchFieldStyle, headerStylesForSelection };
};

export default useTablestyle;