function obtenerRamos(){
  return JSON.parse(localStorage.getItem('ramos')||'[]')
}
function guardarRamos(ramos){
  localStorage.setItem('ramos', JSON.stringify(ramos))
}

let currentRamoIndex = -1

function renderRamos(){
  const cont = document.getElementById('globos')
  const lista = document.getElementById('ramosLista')
  const ramos = obtenerRamos()
  cont.innerHTML = ''
  lista.innerHTML = ''
  ramos.forEach((ramo, idx)=>{
    // balloon
    const b = document.createElement('div')
    b.className = 'globo'
    b.textContent = ramo.name
    b.onclick = ()=> abrirNotepad(idx)
    cont.appendChild(b)

    // list entry
    const item = document.createElement('div')
    item.className = 'prueba-card'
    item.innerHTML = `<div class="prueba-card-header">${ramo.name}</div>
      <div class="prueba-card-body"> <span>${ramo.carrera||''}</span></div>
      <div class="prueba-card-actions">
        <button class="boton-plan" onclick="abrirNotepad(${idx})">Notas</button>
        <button class="boton-plan" onclick="abrirEnCalendario('${encodeURIComponent(ramo.name)}')">Abrir en calendario</button>
      </div>`
    lista.appendChild(item)
  })
}

function agregarRamo(){
  const input = document.getElementById('nuevoRamo')
  const nombre = input.value.trim()
  if(!nombre) return alert('Ingresa nombre del ramo')
  const ramos = obtenerRamos()
  ramos.push({name:nombre, notes:'', style:{color:'#000000'}})
  guardarRamos(ramos)
  input.value=''
  renderRamos()
}

function abrirNotepad(index){
  currentRamoIndex = index
  const ramos = obtenerRamos()
  const ramo = ramos[index]
  if(!ramo) return
  document.getElementById('notepadTitulo').textContent = `Notas: ${ramo.name}`
  document.getElementById('notepadArea').value = ramo.notes || ''
  document.getElementById('colorInput').value = ramo.style?.color || '#000000'
  document.getElementById('guardarNotepad').dataset.index = index
  document.getElementById('abrirCalendarioDesdeRamo').dataset.ramo = ramo.name
  document.getElementById('agregarEval').dataset.index = index
  document.getElementById('porcentajeEval').value = ''
  const overlay = document.getElementById('notepadOverlay')
  document.getElementById('notepadOverlay').classList.remove('hidden')

  // Aplicar estilo guardado al textarea (solo color)
  const area = document.getElementById('notepadArea')
  area.style.color = (ramo.style && ramo.style.color) || '#000000'

  // Cargar y mostrar evaluaciones
  renderEvaluaciones(ramo)

  // Cargar y mostrar temario
  renderTemario(ramo)

  // actualizar promedio
  renderPromedio(ramo)

  // Mostrar tiempo estudiado
  const tiempoSeg = ramo.tiempoEstudiado || 0
  const tiempoMin = Math.floor(tiempoSeg / 60)
  const tiempoHoras = Math.floor(tiempoMin / 60)
  const tiempoRestanteMins = tiempoMin % 60
  let tiempoTexto = 'Tiempo estudiado: —'
  if(tiempoSeg > 0){
    if(tiempoHoras > 0){
      tiempoTexto = `Tiempo estudiado: ${tiempoHoras}h ${tiempoRestanteMins}m`
    } else {
      tiempoTexto = `Tiempo estudiado: ${tiempoMin}m`
    }
  }
  const tiempoDisplay = document.getElementById('tiempoEstudiadoDisplay')
  if(tiempoDisplay) tiempoDisplay.textContent = tiempoTexto

  // Mostrar próximas fechas relacionadas a este ramo (desde pruebas)
  const pruebas = JSON.parse(localStorage.getItem('pruebas') || '[]')
  const hoy = new Date().toISOString().slice(0,10)
  const relacionadas = pruebas
    .filter(p => p.ramo && p.ramo.toLowerCase().trim() === ramo.name.toLowerCase().trim())
    .filter(p => p.fecha >= hoy)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  const proximasDiv = document.getElementById('proximasFechas')
  if(proximasDiv){
    proximasDiv.innerHTML = ''
    if(relacionadas.length === 0) {
      proximasDiv.innerHTML = '<small style="color:#999">No hay pruebas próximas</small>'
    } else {
      relacionadas.slice(0,5).forEach(prueba => {
        const btn = document.createElement('button')
        btn.className = 'boton-secundario'
        btn.style.padding = '6px 8px'
        btn.style.fontSize = '12px'
        const fechaFormato = new Date(prueba.fecha + 'T00:00:00').toLocaleDateString('es-CL')
        const tipoFormato = prueba.tipo ? ` (${prueba.tipo})` : ''
        btn.textContent = fechaFormato + tipoFormato
        btn.addEventListener('click', ()=>{
          // abrir calendario y seleccionar este ramo + fecha
          localStorage.setItem('selectedRamoForPlan', ramo.name)
          localStorage.setItem('selectedDateForPlan', prueba.fecha)
          window.location.href = 'calendario.html'
        })
        proximasDiv.appendChild(btn)
      })
    }
  }
}

function cerrarNotepad(){
  document.getElementById('notepadOverlay').classList.add('hidden')
}

function renderEvaluaciones(ramo){
  const lista = document.getElementById('listaEval')
  lista.innerHTML = ''
  const evals = ramo.evaluaciones || []
  if(evals.length === 0){
    lista.innerHTML = '<small style="color:#999">Sin registros aún</small>'
    renderPromedio(ramo)
    return
  }
  evals.forEach((ev, idx) => {
    const div = document.createElement('div')
    div.className = 'eval-item'
    div.innerHTML = `
      <div class="eval-info">
        <strong>${ev.tipo}</strong> - ${ev.porcentaje}% - Nota: ${ev.nota}
      </div>
      <button class="boton-eval-eliminar" onclick="eliminarEvaluacion(${idx})">✕</button>
    `
    lista.appendChild(div)
  })
  renderPromedio(ramo)
}

function renderPromedio(ramo){
  const promedioDiv = document.getElementById('promedioEval')
  const evals = ramo.evaluaciones || []
  if(evals.length === 0){
    promedioDiv.textContent = 'Promedio actual: —'
    return
  }
  let totalPeso = 0
  let scoreSum = 0
  evals.forEach(ev => {
    const peso = Number(ev.porcentaje) || 0
    scoreSum += (Number(ev.nota) || 0) * peso
    totalPeso += peso
  })
  if(totalPeso <= 0){
    promedioDiv.textContent = 'Promedio actual: —'
    return
  }
  const promedioNota = scoreSum / totalPeso
  const promedioPorc = (promedioNota / 7 * 100)
  promedioDiv.textContent = `Promedio actual: ${promedioNota.toFixed(2)} / 7 (${promedioPorc.toFixed(1)}%)`
}

function agregarEvaluacion(){
  if(currentRamoIndex < 0) return
  const tipo = document.getElementById('tipoEval').value.trim()
  const porcentaje = Number(document.getElementById('porcentajeEval').value)
  const nota = Number(document.getElementById('notaEval').value)
  
  if(!tipo || porcentaje <= 0 || porcentaje > 100 || nota < 0) {
    alert('Completa todos los campos correctamente')
    return
  }
  
  const ramos = obtenerRamos()
  if(!ramos[currentRamoIndex]) return
  if(!ramos[currentRamoIndex].evaluaciones) ramos[currentRamoIndex].evaluaciones = []
  
  ramos[currentRamoIndex].evaluaciones.push({ tipo, porcentaje, nota })
  guardarRamos(ramos)
  
  document.getElementById('tipoEval').value = ''
  document.getElementById('porcentajeEval').value = ''
  document.getElementById('notaEval').value = ''
  
  renderEvaluaciones(ramos[currentRamoIndex])
}

function eliminarEvaluacion(evalIdx){
  if(currentRamoIndex < 0) return
  const ramos = obtenerRamos()
  if(!ramos[currentRamoIndex] || !ramos[currentRamoIndex].evaluaciones) return
  ramos[currentRamoIndex].evaluaciones.splice(evalIdx, 1)
  guardarRamos(ramos)
  renderEvaluaciones(ramos[currentRamoIndex])
}


function guardarNotepad(){
  const index = Number(document.getElementById('guardarNotepad').dataset.index)
  const ramos = obtenerRamos()
  if(!ramos[index]) return
  ramos[index].notes = document.getElementById('notepadArea').value
  ramos[index].style = {
    color: document.getElementById('colorInput').value
  }
  // preservar evaluaciones y temario
  if(!ramos[index].evaluaciones) ramos[index].evaluaciones = []
  if(!ramos[index].temario) ramos[index].temario = []
  guardarRamos(ramos)
  cerrarNotepad()
  renderRamos()
}

function abrirEnCalendario(ramoName){
  localStorage.setItem('selectedRamoForPlan', decodeURIComponent(ramoName))
  window.location.href = 'calendario.html'
}

function abrirPomodoro(){
  const ramo = document.getElementById('notepadTitulo').textContent.replace('Notas: ', '')
  localStorage.setItem('selectedRamoForPom', ramo)
  window.location.href = 'pomodoro.html'
}

// ===== TEMARIO =====
let nivelActual = 1 // 1: Tema, 2: Subtema, 3: Subsubtema
let temarioRamoActual = null

function renderTemario(ramo){
  if(!ramo.temario) ramo.temario = []
  temarioRamoActual = ramo
  const lista = document.getElementById('listaTemas')
  lista.innerHTML = ''
  const temas = ramo.temario
  
  if(temas.length === 0){
    lista.innerHTML = '<small style="color:#999; padding:20px; text-align:center;">Sin temas aún. ¡Comienza a agregar!</small>'
    return
  }
  
  temas.forEach((tema, idx) => {
    renderTemaItem(tema, idx, lista, 1)
  })
}

function renderTemaItem(tema, idx, contenedor, nivel, padres = []){
  const div = document.createElement('div')
  div.className = `tema-item tema-nivel-${nivel}`
  
  const rowDiv = document.createElement('div')
  rowDiv.className = `tema-row tema-nivel-${nivel} ${tema.completado ? 'completado' : ''}`
  
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.className = 'tema-checkbox'
  checkbox.checked = tema.completado || false
  checkbox.addEventListener('change', () => {
    tema.completado = checkbox.checked
    // Registrar en historial solo cuando se marca como completado (no al desmarcar)
    if (checkbox.checked) {
      registrarHistorialTema()
    }
    guardarTemario()
    renderTemario(temarioRamoActual)
  })
  
  const texto = document.createElement('span')
  texto.className = 'tema-texto'
  texto.textContent = tema.texto
  
  const acciones = document.createElement('div')
  acciones.className = 'tema-acciones'
  
  if(nivel < 3){
    const btnAgregar = document.createElement('button')
    btnAgregar.className = 'boton-tema'
    btnAgregar.textContent = '+'
    btnAgregar.title = nivel === 1 ? 'Agregar subtema' : 'Agregar subsubtema'
    btnAgregar.onclick = () => abrirFormularioSubtema(idx, nivel, [...padres, idx])
    acciones.appendChild(btnAgregar)
  }
  
  const btnEliminar = document.createElement('button')
  btnEliminar.className = 'boton-tema'
  btnEliminar.textContent = '✕'
  btnEliminar.title = 'Eliminar'
  btnEliminar.onclick = () => eliminarTema(idx, nivel, [...padres, idx])
  acciones.appendChild(btnEliminar)
  
  rowDiv.appendChild(checkbox)
  rowDiv.appendChild(texto)
  rowDiv.appendChild(acciones)
  
  div.appendChild(rowDiv)
  contenedor.appendChild(div)
  
  // Renderizar subtemas
  if(tema.subtemas && tema.subtemas.length > 0){
    const subDiv = document.createElement('div')
    subDiv.className = 'tema-subtemas'
    tema.subtemas.forEach((subtema, subIdx) => {
      renderTemaItem(subtema, subIdx, subDiv, nivel + 1, [...padres, idx])
    })
    div.appendChild(subDiv)
  }
}

function agregarTema(){
  if(currentRamoIndex < 0) return
  const input = document.getElementById('nuevoTema')
  const texto = input.value.trim()
  if(!texto) return alert('Ingresa un tema')
  
  const ramos = obtenerRamos()
  if(!ramos[currentRamoIndex].temario) ramos[currentRamoIndex].temario = []
  
  ramos[currentRamoIndex].temario.push({ texto, completado: false, subtemas: [] })
  guardarRamos(ramos)
  input.value = ''
  
  renderTemario(ramos[currentRamoIndex])
}

function eliminarTema(idx, nivel, padres = []){
  const ramos = obtenerRamos()
  let ramo = ramos[currentRamoIndex]
  
  if(nivel === 1){
    ramo.temario.splice(idx, 1)
  } else if(nivel === 2 && padres.length >= 1){
    let tema = ramo.temario[padres[0]]
    if(tema && tema.subtemas) tema.subtemas.splice(idx, 1)
  } else if(nivel === 3 && padres.length >= 2){
    let tema = ramo.temario[padres[0]]
    if(tema && tema.subtemas && tema.subtemas[padres[1]]) {
      tema.subtemas[padres[1]].subtemas.splice(idx, 1)
    }
  }
  
  guardarRamos(ramos)
  renderTemario(ramo)
}

function abrirFormularioSubtema(idx, nivel, padres = []){
  // Mostrar un diálogo para agregar subtema
  const texto = prompt(nivel === 1 ? 'Agregar subtema:' : 'Agregar subsubtema:')
  if(!texto) return
  
  const ramos = obtenerRamos()
  const ramo = ramos[currentRamoIndex]
  
  if(nivel === 1){
    if(!ramo.temario[idx].subtemas) ramo.temario[idx].subtemas = []
    ramo.temario[idx].subtemas.push({ texto, completado: false, subtemas: [] })
  } else if(nivel === 2 && padres.length >= 1){
    let tema = ramo.temario[padres[0]]
    if(tema && tema.subtemas && tema.subtemas[idx]) {
      if(!tema.subtemas[idx].subtemas) tema.subtemas[idx].subtemas = []
      tema.subtemas[idx].subtemas.push({ texto, completado: false, subtemas: [] })
    }
  }
  
  guardarRamos(ramos)
  renderTemario(ramo)
}

function guardarTemario(){
  if (!temarioRamoActual || currentRamoIndex < 0) return
  const ramos = obtenerRamos()
  if (!ramos[currentRamoIndex]) return
  ramos[currentRamoIndex].temario = temarioRamoActual.temario || []
  guardarRamos(ramos)
}

// Registra la fecha (YYYY-MM-DD local) cada vez que se completa un tema, para el dashboard
function registrarHistorialTema(){
  const historial = JSON.parse(localStorage.getItem('historialTemas') || '[]')
  const ahora = new Date()
  const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
  historial.push({ fecha })
  localStorage.setItem('historialTemas', JSON.stringify(historial))
}

// eventos de tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('activo'))
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('activo'))
    
    btn.classList.add('activo')
    const tabName = btn.dataset.tab
    document.getElementById(`tab-${tabName}`).classList.add('activo')
  })
})
document.getElementById('agregarRamoBtn').addEventListener('click', agregarRamo)
document.getElementById('cerrarNotepad').addEventListener('click', cerrarNotepad)
document.getElementById('guardarNotepad').addEventListener('click', guardarNotepad)
document.getElementById('agregarEval').addEventListener('click', agregarEvaluacion)
document.getElementById('abrirCalendarioDesdeRamo').addEventListener('click', function(){
  const ramo = this.dataset.ramo
  if(ramo) abrirEnCalendario(ramo)
})
document.getElementById('agregarTemaBtn').addEventListener('click', agregarTema)
document.getElementById('nuevoTema').addEventListener('keypress', (e) => {
  if(e.key === 'Enter') agregarTema()
})

// actualizar color del textarea en tiempo real cuando el usuario cambia el control
const colorInput = document.getElementById('colorInput')
const notepadArea = document.getElementById('notepadArea')
if(colorInput && notepadArea){
  colorInput.addEventListener('input', ()=> notepadArea.style.color = colorInput.value)
}

// init
renderRamos()
