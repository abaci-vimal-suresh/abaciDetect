import { TColor } from '../../type/color-type';

export interface IColors {
	[key: string]: {
		name: TColor;
		code: string;
	};
}
const COLORS: IColors = {
	PRIMARY: {
		name: 'primary',
		code: import.meta.env.VITE_PRIMARY_COLOR || '#7a3a6f',
	},
	SECONDARY: {
		name: 'secondary',
		code: import.meta.env.VITE_SECONDARY_COLOR || '#a87ca1',
	},
	SUCCESS: {
		name: 'success',
		code: import.meta.env.VITE_SUCCESS_COLOR || '#46bcaa',
	},
	INFO: {
		name: 'info',
		code: import.meta.env.VITE_INFO_COLOR || '#4d69fa',
	},
	WARNING: {
		name: 'warning',
		code: import.meta.env.VITE_WARNING_COLOR || '#ffcf52',
	},
	DANGER: {
		name: 'danger',
		code: import.meta.env.VITE_DANGER_COLOR || '#f35421',
	},
	DARK: {
		name: 'dark',
		code: import.meta.env.VITE_DARK_COLOR || '#1f2128',
	},
	LIGHT: {
		name: 'light',
		code: import.meta.env.VITE_LIGHT_COLOR || '#fff',
	},
};

export function getColorNameWithIndex(index: number) {
	/*
	 * The size has been reduced by one so that the LIGHT color does not come out.
	 */
	// @ts-ignore
	return COLORS[Object.keys(COLORS)[index % (Object.keys(COLORS).length - 1)]].name;
}

export default COLORS;
