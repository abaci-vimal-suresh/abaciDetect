// LIBRERIAS | LIBRERIES
const Gpio = require('onoff').Gpio

// FUNCIONES | FUNCTIONS
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x)

const handleLed = gpio => state => gpio.writeSync(state)

const createLedList = ledlist => ledlist.map(led => handleLed(led))

const addBlink = ledListWithState =>
  ledListWithState.map(ledState => blinkWithDelay(ledState))

const blinkWithDelay = ledState => delay => {
  ledState(1) // On
  setTimeout(() => ledState(0), delay - 200) // off
}

const createIntervals = listWithOnOffProcess => {
  let intervals = new Array()
  listWithOnOffProcess.map((onOffLed, index, list) =>
    setTimeout(() =>
      intervals[index] = setInterval(() =>
        onOffLed(delay), (delay * list.length)), (index * delay)
    )
  )
  return intervals
}

const startTestBlinkLeds = pipe(
  createLedList,
  addBlink,
  createIntervals
)

// PRUEBA | TEST
// Configuración | Setup  
const ledAllowed = { green: new Gpio(17, 'out'), blue: new Gpio(27, 'out') }
const usedLeds = ['green', 'blue']
const ledList = usedLeds.map(name => ledAllowed[name])
const delay = 2000
// Iniciar | Start
const intervals = startTestBlinkLeds(ledList)
// Finalizar | Finish
setTimeout(() => intervals.map(interval => clearInterval(interval)), 12000)