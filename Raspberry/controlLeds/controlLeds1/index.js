// LIBRERIAS | LIBRERIES
const express = require('express')
const bodyParser = require('body-parser')
const Gpio = require('onoff').Gpio

// SERVER
const app = express()
app.use(bodyParser.json())
app.use(express.static(__dirname))

const server = app.listen(3000, '192.168.1.55', () => {
  let infoServe = server.address()
  console.log(`Server: http://${infoServe.address}:${infoServe.port}`)
})

// CONTROL LEDS
const LEDLIST = {
  green: new Gpio(17, 'out'),
  blue: new Gpio(27, 'out')
}

const changeCurrentState = gpio => gpio.writeSync(gpio.readSync() ^ 1)

app.post('/controled', (req, res) => {
  changeCurrentState(LEDLIST[req.body.led])
  res.send({ state: 'ok' })
})
