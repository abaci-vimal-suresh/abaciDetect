export const fogWasteTabs = ['Hourly', 'Daily', 'Monthly', 'Yearly'];

export const fogWasteData = {
  Hourly: {
    categories: [
      '01:00', '02:00', '03:00', '04:00', '05:00', '06:00',
      '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
      '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'
    ],
    totalCapacity: [
      8500, 9200, 8800, 9500, 10200, 11000, 12500, 13200,
      14000, 13500, 12800, 11500, 10800, 11200, 12000, 13500,
      14200, 13800, 12500, 11000, 10200, 9500, 9000, 8700
    ],
    totalSensor: [
      8300, 9000, 8600, 9200, 9900, 10700, 12200, 12900,
      13700, 13200, 12500, 11200, 10500, 10900, 11700, 13200,
      13900, 13500, 12200, 10700, 9900, 9200, 8700, 8400
    ],
  },
  Daily: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    totalCapacity: [85000, 92000, 88000, 95000, 102000, 78000, 65000],
    totalSensor: [83000, 90000, 86000, 92500, 99000, 76000, 63500],
  },
  Monthly: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    totalCapacity: [
      2450000, 2380000, 2650000, 2580000, 2720000, 2680000,
      2850000, 2920000, 2780000, 2690000, 2550000, 2480000
    ],
    totalSensor: [
      2398000, 2328000, 2598000, 2528000, 2668000, 2628000,
      2798000, 2868000, 2728000, 2638000, 2498000, 2428000
    ],
  },
  Yearly: {
    categories: ['2019', '2020', '2021', '2022', '2023', '2024'],
    totalCapacity: [28500000, 30200000, 31800000, 32500000, 33200000, 34100000],
    totalSensor: [27930000, 29596000, 31164000, 31850000, 32536000, 33418000],
  },
};

export const dumpingInfo = [
  {
    gtcc: 'Gulf Waste Management LLC',
    vehicle: 'TRK-A-1045',
    capacity: '12,500 gal',
    sensor: '12,350 gal',
    fee: 'AED 3,750.00',
    entities: 8,
    gtCapacity: 2,
    date: '15-12-2024',
    time: '08:45',
  },
  {
    gtcc: 'Emirates Environmental Services',
    vehicle: 'TRK-B-2089',
    capacity: '10,800 gal',
    sensor: '10,750 gal',
    fee: 'AED 3,240.00',
    entities: 6,
    gtCapacity: 2,
    date: '15-12-2024',
    time: '09:20',
  },
  // ...rest of the dumpingInfo
];

export const sensorData = [
  { time: '00:00', value: 350 },
  { time: '05:00', value: 420 },
  { time: '10:00', value: 580 },
  { time: '15:00', value: 720 },
  { time: '20:00', value: 850 },
  { time: '25:00', value: 920 },
  { time: '30:00', value: 1050 },
  { time: '35:00', value: 980 },
  { time: '40:00', value: 850 },
  { time: '45:00', value: 720 },
  { time: '50:00', value: 580 },
  { time: '55:00', value: 450 },
  { time: '60:00', value: 380 },
];

export const tankStatus = {
  percent: 68,
  value: 2348,
  max: 3453,
};
