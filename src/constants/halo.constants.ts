/**
 * LED Color Options for HALO devices
 * Values are in RGB decimal format
 */
export const LED_COLOR_OPTIONS = [
    { value: 255, label: 'Blue' },
    { value: 16776960, label: 'Yellow' },
    { value: 16711935, label: 'Violet' },
    { value: 65535, label: 'Cyan' },
    { value: 16711680, label: 'Red' },
    { value: 65280, label: 'Green' },
    { value: 16777215, label: 'White' },
];

/**
 * LED Pattern Options for HALO devices
 */
export const LED_PATTERN_OPTIONS = [
    { value: 200004, label: 'Steady' },
    { value: 1, label: 'One Second Blink' },
    { value: 2, label: 'Two Second Blink' },
    { value: 5, label: 'Five Second Blink' },
    { value: 100001, label: 'Half Second Once' },
    { value: 100002, label: 'One Second Once' },
    { value: 100004, label: 'Two Seconds Once' },
    { value: 100010, label: 'Five Seconds Once' },
    { value: 100120, label: 'One Minute Once' },
    { value: 200001, label: 'Chase Right' },
    { value: 200002, label: 'Chase Left' },
    { value: 200003, label: 'Breathe' },
    { value: 200004, label: 'Strobe' },
];

/**
 * LED Priority Options (1 = Highest, 9 = Lowest)
 */
export const LED_PRIORITY_OPTIONS = [
    { value: 1, label: '1 (Highest)' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
    { value: 6, label: '6' },
    { value: 7, label: '7' },
    { value: 8, label: '8' },
    { value: 9, label: '9 (Lowest)' },
];

/**
 * Relay Duration Options for HALO devices
 */
export const RELAY_DURATION_OPTIONS = [
    { value: 0, label: 'On' },
    { value: 5, label: '5 sec' },
    { value: 10, label: '10 sec' },
    { value: 20, label: '20 sec' },
    { value: 60, label: '1 min' },
];
