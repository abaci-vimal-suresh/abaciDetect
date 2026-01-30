// LIBRERIAS | LIBRERIES
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const Gpio = require('onoff').Gpio

// SERVIDOR | SERVER
const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(express.static(__dirname))

const server = app.listen(3000, '192.168.1.55', () => {
  let infoServe = server.address()
  console.log(`Server: http://${infoServe.address}:${infoServe.port}`)
})

// CONTROL LEDS

// Funciones | Functions

const checkIncludeConditions = conditions => word => conditions.some(value => value.includes(word))

const setActionToGpio = gpio => state => gpio.writeSync(state)

const turnOffLed = led => led.gpioAction(0)

const turnOnLed = led => led.gpioAction(1)

const actionOnLeds = ledList => action => ledList.map(action)

const selectedLed = led => ledBase =>
  ledBase.name === led ? turnOnLed(ledBase) : turnOffLed(ledBase)

// lista de leds | List of leds
const ledList = [
  { name: 'green', gpioAction: setActionToGpio(new Gpio(17, 'out')) },
  { name: 'blue', gpioAction: setActionToGpio(new Gpio(27, 'out')) }
]

// Acciones | Actions
const changeStateTo = actionOnLeds(ledList)

const checkAction = checkIncludeConditions(['off', 'together'])

const actionsListOnLeds = {
  off: () => changeStateTo(turnOffLed),
  together: () => changeStateTo(turnOnLed),
  selected: led => changeStateTo(selectedLed(led))
}

// Rutas | Routes
app.post('/controled', (req, res) => {
  const type = req.body.type
  console.log(type)
  checkAction(type)
    ? actionsListOnLeds[type]()
    : actionsListOnLeds['selected'](type)
  res.send({ state: 'ok' })
})
