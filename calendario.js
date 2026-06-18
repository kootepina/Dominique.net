let currentDate = new Date()
currentDate.setDate(1)

function obtenerPruebas() {
  return JSON.parse(localStorage.getItem("pruebas") || "[]")
}

function guardarPruebas(pruebas) {
  localStorage.setItem("pruebas", JSON.stringify(pruebas))
}

function agregarPrueba() {
  let ramo = document.getElementById("ramo").value
  let tipo = document.getElementById("tipo").value
  let fecha = document.getElementById("fecha").value

  if (!ramo || !fecha) {
    alert("Completa el ramo y la fecha")
    return
  }

  let pruebas = obtenerPruebas()
  pruebas.push({ ramo, tipo, fecha, nota: null })
  guardarPruebas(pruebas)

  document.getElementById("ramo").value = ""
  document.getElementById("fecha").value = ""

  mostrarPruebas()
  generarCalendario()
}

function diasQueFaltan(fecha) {
  let hoy = new Date()
  let fechaPrueba = new Date(fecha + "T00:00:00")
  let diferencia = fechaPrueba - hoy
  let dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24))
  return dias
}

// Rellenar datalist de ramos desde MisRamos (localStorage 'ramos')
function cargarRamosDatalist() {
  let dl = document.getElementById('ramosList')
  if (!dl) return
  let ramos = JSON.parse(localStorage.getItem('ramos') || '[]')
  dl.innerHTML = ''
  ramos.forEach(r => {
    let opt = document.createElement('option')
    opt.value = r.name
    dl.appendChild(opt)
  })
}

// Autocomplete personalizado (más fiable que datalist en algunos entornos file://)
function setupRamoAutocomplete() {
  const input = document.getElementById('ramo')
  if (!input) return
  // wrapper for suggestions
  let wrapper = input.parentElement.querySelector('.autocomplete-list')
  if (!wrapper) {
    wrapper = document.createElement('div')
    wrapper.className = 'autocomplete-list'
    input.parentElement.insertBefore(wrapper, input.nextSibling)
  }
  let box = wrapper.querySelector('.autocomplete-items')
  if (!box) {
    box = document.createElement('div')
    box.className = 'autocomplete-items'
    wrapper.appendChild(box)
  }

  function showSuggestions(value) {
    const ramos = JSON.parse(localStorage.getItem('ramos') || '[]')
    box.innerHTML = ''
    if (!value) return
    const q = value.trim().toLowerCase()
    const matches = ramos.filter(r => r.name && r.name.toLowerCase().includes(q))
    matches.slice(0, 30).forEach(m => {
      const div = document.createElement('div')
      div.className = 'autocomplete-item'
      div.textContent = m.name
      div.addEventListener('mousedown', (e) => {
        e.preventDefault()
        input.value = m.name
        box.innerHTML = ''
      })
      box.appendChild(div)
    })
  }

  input.addEventListener('input', (e) => {
    showSuggestions(e.target.value)
  })
  input.addEventListener('focus', (e) => showSuggestions(e.target.value))
  input.addEventListener('blur', () => setTimeout(() => box.innerHTML = '', 150))
}

function mostrarPruebas() {
  let pruebas = obtenerPruebas()
  let lista = document.getElementById("lista")

  if (pruebas.length === 0) {
    lista.innerHTML = "<p style='color:#000'>No hay pruebas registradas aún.</p>"
    return
  }

  pruebas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  let html = ""
  pruebas.forEach((prueba, index) => {
    let dias = diasQueFaltan(prueba.fecha)
    let diasTexto = dias > 0 ? `Faltan ${dias} días` : dias === 0 ? "¡Es hoy!" : "Ya pasó"
    let color = dias > 7 ? "green" : dias > 0 ? "orange" : "#888"

    html += `
      <div class="prueba-card">
        <div class="prueba-card-header">
          <strong>${escapeHtml(prueba.ramo)}</strong> — ${escapeHtml(prueba.tipo)}
        </div>
        <div class="prueba-card-body">
          <span>📅 ${prueba.fecha}</span>
          <span style="color:${color}">⏳ ${diasTexto}</span>
        </div>
        <div class="prueba-card-actions">
          <button onclick="abrirPlan(${index})" class="boton-plan">Planificar estudio</button>
          <button onclick="eliminar(${index})" class="boton-eliminar">Eliminar</button>
        </div>
      </div>
    `
  })

  lista.innerHTML = html
}

function generarCalendario() {
  let pruebas = obtenerPruebas()
  let calendario = document.getElementById("calendario")
  let mesAno = document.getElementById("mesAno")

  let year = currentDate.getFullYear()
  let month = currentDate.getMonth()
  let nombreMes = currentDate.toLocaleString("es-CL", { month: "long" })
  mesAno.textContent = `${nombreMes} ${year}`

  let pruebasPorFecha = {}
  pruebas.forEach(prueba => {
    if (!prueba.fecha) return
    if (!pruebasPorFecha[prueba.fecha]) pruebasPorFecha[prueba.fecha] = []
    pruebasPorFecha[prueba.fecha].push(prueba)
  })

  let html = ""
  let primerDia = new Date(year, month, 1)
  let primerDiaSemana = (primerDia.getDay() + 6) % 7
  let totalDias = new Date(year, month + 1, 0).getDate()

  for (let i = 0; i < primerDiaSemana; i++) {
    html += '<div class="dia dia-vacio"></div>'
  }

  let hoy = new Date()
  let hoyIso = hoy.toISOString().slice(0, 10)

  for (let dia = 1; dia <= totalDias; dia++) {
    let fecha = new Date(year, month, dia)
    let isoFecha = fecha.toISOString().slice(0, 10)
    let pruebasDia = pruebasPorFecha[isoFecha] || []
    let esHoy = isoFecha === hoyIso
    let mensajeHoy = esHoy ? '<div class="hoy-text">¡Estás aquí! 🦋</div>' : ''

    if (pruebasDia.length > 0) {
      let primeraPrueba = pruebasDia[0]
      let adicional = pruebasDia.length > 1 ? ` +${pruebasDia.length - 1}` : ""
      html += `
        <div class="dia prueba${esHoy ? ' hoy' : ''}">
          <div class="numero-dia">${dia}<span class="estrella">★</span></div>
          <div class="info">${escapeHtml(primeraPrueba.ramo)}${adicional}</div>
          ${mensajeHoy}
        </div>
      `
    } else {
      html += `
        <div class="dia${esHoy ? ' hoy' : ''}">
          <div class="numero-dia">${dia}</div>
          ${mensajeHoy}
        </div>
      `
    }
  }

  calendario.innerHTML = html
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function eliminar(index) {
  let pruebas = obtenerPruebas()
  pruebas.splice(index, 1)
  guardarPruebas(pruebas)
  mostrarPruebas()
  generarCalendario()
}

function abrirPlan(index) {
  let pruebas = obtenerPruebas()
  let prueba = pruebas[index]
  if (!prueba) return

  if (!prueba.plan) prueba.plan = {}
  let overlay = document.getElementById("overlay")
  let overlayTitulo = document.getElementById("overlayTitulo")
  let overlayInfo = document.getElementById("overlayInfo")
  let overlayDias = document.getElementById("overlayDias")

  overlayTitulo.textContent = `Plan de estudio: ${escapeHtml(prueba.ramo)}`
  overlayInfo.innerHTML = `
    <p><strong>Prueba:</strong> ${escapeHtml(prueba.tipo)}</p>
    <p><strong>Fecha de examen:</strong> ${prueba.fecha}</p>
  `

  let hoy = new Date()
  let fechaFin = new Date(prueba.fecha + "T00:00:00")
  overlayDias.innerHTML = ""

  for (let dia = new Date(hoy); dia <= fechaFin; dia.setDate(dia.getDate() + 1)) {
    let iso = dia.toISOString().slice(0, 10)
    let label = dia.toLocaleDateString("es-CL", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit"
    })
    let nota = prueba.plan[iso] || ""
    overlayDias.innerHTML += `
      <div class="plan-dia">
        <div class="plan-dia-fecha">${label}</div>
        <textarea class="plan-textarea" data-prueba-index="${index}" data-fecha="${iso}" oninput="guardarNota(event)">${escapeHtml(nota)}</textarea>
      </div>
    `
  }

  overlay.classList.remove("hidden")
}

function cerrarOverlay() {
  document.getElementById("overlay").classList.add("hidden")
}

function guardarNota(event) {
  let textarea = event.target
  let index = Number(textarea.dataset.pruebaIndex)
  let fecha = textarea.dataset.fecha
  let notas = textarea.value
  let pruebas = obtenerPruebas()
  let prueba = pruebas[index]
  if (!prueba) return
  if (!prueba.plan) prueba.plan = {}
  prueba.plan[fecha] = notas
  guardarPruebas(pruebas)
}

document.getElementById("prevMes").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1)
  generarCalendario()
})

document.getElementById("nextMes").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1)
  generarCalendario()
})

document.getElementById("cerrarOverlay").addEventListener("click", cerrarOverlay)
document.getElementById("overlay").addEventListener("click", event => {
  if (event.target.id === "overlay") cerrarOverlay()
})

// Inicialización: cargar ramos y configurar autocompletado
cargarRamosDatalist()
setupRamoAutocomplete()
// Actualizar datalist si otros tabs cambian ramos
window.addEventListener('storage', (e) => {
  if (e.key === 'ramos') {
    cargarRamosDatalist()
  }
})

mostrarPruebas()
mostrarPruebas()
generarCalendario()
// Si se abrió desde MisRamos, abrir el plan de la primera prueba de ese ramo
let selectedRamo = localStorage.getItem('selectedRamoForPlan')
let selectedDate = localStorage.getItem('selectedDateForPlan')
if (selectedRamo) {
  const pruebas = obtenerPruebas()
  const selectedNormalized = selectedRamo.toLowerCase().trim()
  let idx = -1
  if (selectedDate) {
    idx = pruebas.findIndex(p => p.ramo && p.ramo.toLowerCase().trim() === selectedNormalized && p.fecha === selectedDate)
  }
  if (idx === -1) {
    idx = pruebas.findIndex(p => p.ramo && p.ramo.toLowerCase().trim() === selectedNormalized)
  }
  if (idx !== -1) abrirPlan(idx)
  localStorage.removeItem('selectedRamoForPlan')
  localStorage.removeItem('selectedDateForPlan')
}