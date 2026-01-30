// Funciones | Functions : base
const elementById = id => document.getElementById(id)

const requestToRaspi = async type => {
  await fetch('http://192.168.1.55:3000/controled',
    {
      method: 'POST',
      body: JSON.stringify({type}),
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// Inicializar | Initialize
let model
let raspiStream
const classifier = window.knnClassifier.create()

const initialize = async () => {
  raspiStream = elementById('raspiStreaming')
  console.log('modelo | model: 🕑')
  model = await mobilenet.load()
  console.log('modelo | model: ✔')
  setInterval(predict, 2000);
}

// Conteo | Count
const incrementCountInSpan = id => {
  const span = elementById(`${id}Count`)
  span.textContent = Number(span.textContent) + 1
}

// Modelo | Model
const addSampleToModel = async classId => {
  const activation = model.infer(raspiStream, 'conv_preds')
  classifier.addExample(activation, classId)
}

const predict = async () => {
  if (classifier.getNumClasses() > 0) {
    const activation = model.infer(raspiStream, 'conv_preds')
    const result = await classifier.predictClass(activation)
    requestToRaspi(result.label)
  }
}

const newPicture = id => {
  addSampleToModel(id)
  incrementCountInSpan(id)
}