import React from 'react'
import { useSvgDrawing } from 'react-hooks-svgdrawing'
import { getSvgPathCode, drawSetOfPath, rotateDrawingAutocad  } from './utils'

function App() {
  const [renderRef, action] = useSvgDrawing()

  const drawInAutocad = () => {
    // Obtener código svg | Get svg code
    const code = getSvgPathCode(renderRef)
    // Dibujar código | Draw code
    code.map(path => drawSetOfPath(path))
    // Rotar dibujo
    rotateDrawingAutocad(code)
  }

  const clearDraw = () => {
    // Clear div
    action.clear()
    // Clear Autocad
    window.Acad.Editor.executeCommand(`SELECT ALL `)
    window.Acad.Editor.executeCommand(`ERASE `, '')
  }

  return (
    <>
      <div ref={renderRef} style={{ borderStyle: 'dotted' }} />
      <div style={{ marginTop: '10px' }}>
        <button onClick={drawInAutocad}>Dibujar|Draw</button>
        <button onClick={clearDraw}>Limpiar|Clear</button>
      </div>
    </>
  )
}

export default App;
