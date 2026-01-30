// FUNCIONES | FUNCTIONS
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x)

const getcoordinates = list => {
  return list.reduce((coordinate, value, index) => {
    return (index + 1) % 2
      ? coordinate
      : `${coordinate} ${list[index - 1]},${value},0`
  }, '')
}

const removeLastEmptyString = string =>
  string.slice(-1) === ' ' ? string.slice(0, -1) : string

const splitCodeByCurveto = path => path.split('C ')

const removeMoveto = array => array.slice(1)

const removeAllLastEmptyString = array =>
  array.map(removeLastEmptyString)

const separateEachCoordinate = array =>
  array.map(string => string.split(' '))

const insertEndpoint = array =>
  array.reduce((total, value, index, array) => {
    const initTwoNextValues =
      (array[index + 1] || array[index]).slice(0, 2)
    return [...total, [...value, ...initTwoNextValues]]
  }, [])

const drawPath = array => array.map(valueSvg =>
  window.Acad.Editor
    .executeCommand(`SPL M CV ${getcoordinates(valueSvg)} `)
)

export const getSvgPathCode = renderRef => {
  // Separar por path | Split by path
  const t = renderRef.current.children[0].getElementsByTagName('path')
  return [...t].map(x => x.getAttribute("d"))
}

export const rotateDrawingAutocad = code => {
  // Rotar dibujo | Draw rotate
const baseRef = code[0].split(" ").slice(1, 3)
const basePointForRotation = [
  `${baseRef[0]},${baseRef[1]}`,
  `${baseRef[0] + 1},${baseRef[1]}`
].join(' ')
window.Acad.Editor.executeCommand(`SELECT ALL `)
window.Acad.Editor.executeCommand(`MIRROR ${basePointForRotation} Y `, '')
}

// ENCADENAMIENTO PRINCIPAL | PRINCIPAL PIPELINE
export const drawSetOfPath = pipe(
  splitCodeByCurveto,
  removeMoveto,
  removeAllLastEmptyString,
  separateEachCoordinate,
  insertEndpoint,
  drawPath
)