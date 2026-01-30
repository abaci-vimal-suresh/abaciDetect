// *** 1. AJUSTE DE CURVA - FITTING CURVE ***
async function ajuste() {
  // 1.1 Datos originales - original data
  const [dOriginales, coeforiginal] = await datosOriginales();
  // 1.2 Datos iniciales - initial data
  const coefEntreno = await datosIniciales(dOriginales);
  // 1.3 Datos predichos - predict data
  const coefAjustados = await datosPredichos(dOriginales, coefEntreno);
  // 1.4 Resumen de resultados - summary of result 
  resumenResultados(coeforiginal, coefAjustados);
}
// 1.1 Datos originales - original data
async function datosOriginales() {
  // Paremetros de configuracion -- settings
  let coeforiginal = { 'a': -0.8, 'b': -0.2, 'c': 0.9, 'd': 0.5 }; // original coefficients
  let desviacionEstandar = 0.04; // sigma
  let datosEntreno = generador(100, coeforiginal, desviacionEstandar); // train data
  // Grafica
  let datos = await ordengraf(datosEntreno.xo, datosEntreno.yo);
  graficar(datos, ['x: original', 'y: original'], 'grafOriginal', 'Datos originales - original data', ['x', 'yo'])
  return [datosEntreno, coeforiginal]
}
// 1.2 Datos iniciales - initial data
async function datosIniciales(dOriginales) {
  // Valores semilla aleatorios - seed values random
  let coefEntreno = {
    'a': tf.variable(tf.scalar(Math.random())),
    'b': tf.variable(tf.scalar(Math.random())),
    'c': tf.variable(tf.scalar(Math.random())),
    'd': tf.variable(tf.scalar(Math.random()))
  };
  const datosIniciales = predictor(dOriginales.xo, coefEntreno);
  // Grafica
  let datos = await ordengraf(dOriginales.xo, dOriginales.yo, datosIniciales);
  graficar(datos, ['x: original', 'y: original', 'y: inicial'],
    'grafInicial', 'Datos inicales, semilla - inicial data, seed ', ['x', 'yo - yi'])
  return coefEntreno
}
// 1.3 Datos predichos - predict data
async function datosPredichos(dOriginales, coefEntreno) {
  // Entreno
  await entrenar(dOriginales, coefEntreno);
  // Grafica
  const datosFinales = predictor(dOriginales.xo, coefEntreno)
  datos = await ordengraf(dOriginales.xo, dOriginales.yo, datosFinales);
  graficar(datos, ['x: original', 'y: original', 'y: prediccion'],
    'grafFinal', 'Datos predichos - predict data', ['x', 'yo - yp']);
  // Coeficientes ajustados
  return coefEntreno
}
// 1.4 Resumen de resultados - summary of result
async function resumenResultados(coeforiginal, coefAjustados) {
  // resultados  
  const coefPredichos = await Promise.all([
    coefAjustados.a.data(), 
    coefAjustados.b.data(), 
    coefAjustados.c.data(), 
    coefAjustados.d.data()]);
  // coeficientes originales
  co = Object.keys(coeforiginal).map(x=>coeforiginal[x])
  // coeficientes predichos
  cp = coefPredichos.map(x => Number(x[0].toFixed(2)));
  // error entre coeficientes
  ce = co.map((x,i) => (Math.abs((x - cp[i])/x)*100).toFixed(2))
  const resultados = [ ['Originales', ...co], ['Predichos', ...cp], ['% error', ...ce]];
  // insercion
  const tabla = document.getElementById('tabla').tBodies[0];
  resultados.map(x => {
    let fila = tabla.insertRow(tabla.rows.length);
    x.map((y, i) => {
      fila.insertCell(i).innerHTML = y;
    })
  });  
}

// *** 2. PROCESOS - PROCESS ***
// 2.1 Generador de datos // data generator
function generador(np, coef, dv) {
  return tf.tidy(() => {
    // coeficientes
    const [a, b, c, d] = [
      tf.scalar(coef.a), tf.scalar(coef.b), tf.scalar(coef.c), tf.scalar(coef.d)
    ];
    // datos x originales
    const xo = tf.randomUniform([np], -1, 1);
    // datos y originales
    const yo = a.mul(xo.pow(tf.scalar(3, 'int32')))
      .add(b.mul(xo.square()))
      .add(c.mul(xo))
      .add(d)
      // adicion de ruido a datos originales
      .add(tf.randomNormal([np], 0, dv));
    // Normalizacion de datos y
    const ymin = yo.min();
    const ymax = yo.max();
    const yrange = ymax.sub(ymin);
    const ysNormalized = yo.sub(ymin).div(yrange);
    return {
      xo,
      yo: ysNormalized
    };
  })
}
// 2.2 Predictor - dado coeficientes evalua y = ax^3 + bx^2 + cx + d
function predictor(x, coef) {
  return tf.tidy(() => {
    return coef.a.mul(x.pow(tf.scalar(3, 'int32')))
      .add(coef.b.mul(x.square()))
      .add(coef.c.mul(x))
      .add(coef.d);
  })
}
// 2.3 Perdida - evalua el error // loss
function perdida(prediccion, etiquetas) {
  const error = prediccion.sub(etiquetas).square().mean();
  return error;
}
// 2.4 Entrenamiento // train
async function entrenar(dOriginales, coefEntreno) {
  xs = dOriginales.xo;
  ys = dOriginales.yo;
  // Paremetros de configuracion -- settings
  let tasaAprendizaje = 0.5; // learning rate
  let numIter = 200; // epochs
  const optimizador = tf.train.sgd(tasaAprendizaje); // optimizer
  // Entreno // train
  for (let iter = 0; iter < numIter; iter++) {
    /* Realiza la optimizacion de los parametros con base
       en los resultados de la funcion perdida */
    optimizador.minimize(() => {
      const prediccion = predictor(xs, coefEntreno);
      return perdida(prediccion, ys);
    });
    // Se usa tf.nextFrame para no bloquear el navegador!.
    await tf.nextFrame();
  }
}
// 2.5 Funcion ordenar datos (para graficar) // order data
async function ordengraf(...valores) {
  let proceso
  valores.length === 2 ? proceso = 1 : proceso = 0;
  if (proceso) { // 1 serie
    // obtengo datos
    const xval = await valores[0].data();
    const yval = await valores[1].data();
    // organizo datos
    return Array.from(yval).map((y, i) => {
      return [xval[i], yval[i]];
    });
  } else { // 2 series
    // obtengo datos
    const xval = await valores[0].data();
    const yval = await valores[1].data();
    const yval2 = await valores[2].data();
    // organizo datos
    return Array.from(yval).map((y, i) => {
      return [xval[i], yval[i], yval2[i]];
    });
  }
}

// *** 3. GRAFICAS - CHARTS ***
const graficar = (datos, cabezera, contenedor, titulo, eje) => {
  // Se carga api y se llama a la funcion
  google.charts.load('current', {'packages': ['corechart']});
  google.charts.setOnLoadCallback(_graf);

  function _graf() {
    datos.splice(0, 0, cabezera);
    var data = google.visualization.arrayToDataTable(datos);
    var options = {
      title: titulo,
      hAxis: {
        title: eje[0],
        minValue: 0,
        maxValue: 1
      },
      vAxis: {
        title: eje[1],
        minValue: 0,
        maxValue: 1
      },
      legend: 'right'
    };
    var chart = new google.visualization.ScatterChart(document.getElementById(contenedor));
    chart.draw(data, options);
  }
}

ajuste()
