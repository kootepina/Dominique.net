// Horario semanal de StudyQuest
// Guarda bloques en localStorage bajo 'horario'.
// La grilla va de las 8:00 a las 22:00 en filas de 30 min.

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const HORA_INICIO_GRILLA = 8   // 08:00
const HORA_FIN_GRILLA = 22     // 22:00
const MINUTOS_POR_FILA = 30

function obtenerBloques() {
  return JSON.parse(localStorage.getItem('horario') || '[]')
}

function guardarBloques(bloques) {
  localStorage.setItem('horario', JSON.stringify(bloques))
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Convierte "HH:MM" a minutos desde medianoche
function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

function agregarBloque() {
  const ramo = document.getElementById('ramoHorario').value.trim()
  const dia = Number(document.getElementById('diaHorario').value)
  const inicio = document.getElementById('horaInicio').value
  const fin = document.getElementById('horaFin').value
  const color = document.getElementById('colorBloque').value

  if (!ramo || !inicio || !fin) {
    alert('Completa el ramo y las horas')
    return
  }
  if (horaAMinutos(fin) <= horaAMinutos(inicio)) {
    alert('La hora de término debe ser posterior a la de inicio')
    return
  }

  const bloques = obtenerBloques()
  bloques.push({ ramo, dia, inicio, fin, color })
  guardarBloques(bloques)

  document.getElementById('ramoHorario').value = ''
  renderHorario()
}

function eliminarBloque(index) {
  const bloques = obtenerBloques()
  bloques.splice(index, 1)
  guardarBloques(bloques)
  renderHorario()
}

function renderHorario() {
  const grilla = document.getElementById('grillaHorario')
  const bloques = obtenerBloques()

  const totalFilas = (HORA_FIN_GRILLA - HORA_INICIO_GRILLA) * (60 / MINUTOS_POR_FILA)

  // Cabecera: esquina vacía + nombres de días
  let html = '<div class="hh-celda hh-esquina"></div>'
  DIAS.forEach(d => {
    html += `<div class="hh-celda hh-dia-header">${d}</div>`
  })

  // Filas de horas
  for (let fila = 0; fila < totalFilas; fila++) {
    const minutos = HORA_INICIO_GRILLA * 60 + fila * MINUTOS_POR_FILA
    const h = Math.floor(minutos / 60)
    const m = minutos % 60
    const etiqueta = m === 0 ? `${String(h).padStart(2, '0')}:00` : ''
    html += `<div class="hh-celda hh-hora">${etiqueta}</div>`
    for (let dia = 0; dia < DIAS.length; dia++) {
      html += `<div class="hh-celda hh-slot" data-dia="${dia}" data-fila="${fila}"></div>`
    }
  }

  grilla.innerHTML = html

  // Colocar los bloques encima de los slots correspondientes
  bloques.forEach((bloque, index) => {
    const inicioMin = horaAMinutos(bloque.inicio)
    const finMin = horaAMinutos(bloque.fin)
    const filaInicio = Math.round((inicioMin - HORA_INICIO_GRILLA * 60) / MINUTOS_POR_FILA)
    const duracionFilas = Math.round((finMin - inicioMin) / MINUTOS_POR_FILA)

    if (filaInicio < 0 || filaInicio >= totalFilas) return

    // +2 porque la grilla CSS empieza en fila 1 (cabecera) y las filas de horas comienzan en la 2
    const gridRowStart = filaInicio + 2
    const gridColumn = bloque.dia + 2 // +2: col 1 es la de horas

    const div = document.createElement('div')
    div.className = 'hh-bloque'
    div.style.gridRow = `${gridRowStart} / span ${duracionFilas}`
    div.style.gridColumn = gridColumn
    div.style.background = bloque.color
    div.innerHTML = `
      <div class="hh-bloque-ramo">${escapeHtml(bloque.ramo)}</div>
      <div class="hh-bloque-hora">${bloque.inicio}–${bloque.fin}</div>
      <button class="hh-bloque-x" onclick="eliminarBloque(${index})" title="Eliminar">✕</button>
    `
    grilla.appendChild(div)
  })
}

// Autocompletado de ramos (mismo patrón que el calendario)
function setupRamoAutocomplete() {
  const input = document.getElementById('ramoHorario')
  if (!input) return

  let box = input.parentElement.querySelector('.autocomplete-items')
  if (!box) {
    const wrapper = document.createElement('div')
    wrapper.className = 'autocomplete-list'
    box = document.createElement('div')
    box.className = 'autocomplete-items'
    wrapper.appendChild(box)
    input.parentElement.insertBefore(wrapper, input.nextSibling)
  }

  function showSuggestions(value) {
    const ramos = JSON.parse(localStorage.getItem('ramos') || '[]')
    box.innerHTML = ''
    if (!value) return
    const q = value.trim().toLowerCase()
    ramos
      .filter(r => r.name && r.name.toLowerCase().includes(q))
      .slice(0, 30)
      .forEach(m => {
        const div = document.createElement('div')
        div.className = 'autocomplete-item'
        div.textContent = m.name
        div.addEventListener('mousedown', e => {
          e.preventDefault()
          input.value = m.name
          box.innerHTML = ''
        })
        box.appendChild(div)
      })
  }

  input.addEventListener('input', e => showSuggestions(e.target.value))
  input.addEventListener('focus', e => showSuggestions(e.target.value))
  input.addEventListener('blur', () => setTimeout(() => (box.innerHTML = ''), 150))
}

// Init
setupRamoAutocomplete()
renderHorario()
