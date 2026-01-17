const companies = [
  'Gulf Waste Management LLC',
  'Emirates Environmental Services',
  'Dubai Clean Services Co.',
  'Abu Dhabi Waste Solutions'
];

const vehicles = ['TRK-A', 'TRK-B', 'TRK-C', 'TRK-D'];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateDumpingInfo = (count) => {
  const data = [];
  
  for (let i = 1; i <= count; i++) {
    const company = companies[getRandomInt(0, companies.length - 1)];
    const vehicle = `${vehicles[getRandomInt(0, vehicles.length - 1)]}-${getRandomInt(1000, 9999)}`;
    const capacity = getRandomInt(8000, 15000); // gallons
    const sensor = capacity - getRandomInt(0, 500); // slightly less than capacity
    const fee = sensor * 0.3; // simple fee calculation
    const entities = getRandomInt(1, 10);
    const gtCapacity = getRandomInt(1, 3);
    const day = getRandomInt(1, 28);
    const month = getRandomInt(1, 12);
    const year = 2024;
    const hour = getRandomInt(0, 23);
    const minute = getRandomInt(0, 59);

    data.push({
      gtcc: company,
      vehicle,
      capacity: `${capacity.toLocaleString()} gal`,
      sensor: `${sensor.toLocaleString()} gal`,
      fee: `AED ${fee.toFixed(2)}`,
      entities,
      gtCapacity,
      date: `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`,
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    });
  }

  return data;
};

// Example usage
export const dumpingInfo = generateDumpingInfo(50000);
