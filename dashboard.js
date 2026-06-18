// Dashboard de estadísticas de StudyQuest
// Lee: 'ramos', 'historialEstudio', 'historialTemas' de localStorage.

// ---------- Helpers de fecha ----------
function fechaLocalISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Devuelve un array con las fechas ISO de los últimos N días (incluido hoy), en orden
function ultimosDias(n) {
  const dias = []
  const hoy = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() - i)
    dias.push(fechaLocalISO(d))
  }
  return dias
}

// Etiqueta corta tipo "lun 16" para una fecha ISO
function etiquetaDia(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit' })
}

function formatearTiempo(segundos) {
  if (!segundos || segundos <= 0) return '0m'
  const totalMin = Math.floor(segundos / 60)
  const horas = Math.floor(totalMin / 60)
  const min = totalMin % 60
  if (horas > 0) return `${horas}h ${min}m`
  return `${min}m`
}

// ---------- Lectura de datos ----------
const ramos = JSON.parse(localStorage.getItem('ramos') || '[]')
const historialEstudio = JSON.parse(localStorage.getItem('historialEstudio') || '[]')
const historialTemas = JSON.parse(localStorage.getItem('historialTemas') || '[]')

// ---------- Promedio general ----------
// Promedio ponderado por evaluaciones de cada ramo, luego promedio simple entre ramos con notas.
function calcularPromedioGeneral() {
  const promediosRamo = []
  ramos.forEach(ramo => {
    const evals = ramo.evaluaciones || []
    let totalPeso = 0
    let suma = 0
    evals.forEach(ev => {
      const peso = Number(ev.porcentaje) || 0
      suma += (Number(ev.nota) || 0) * peso
      totalPeso += peso
    })
    if (totalPeso > 0) {
      promediosRamo.push(suma / totalPeso)
    }
  })
  if (promediosRamo.length === 0) return null
  const prom = promediosRamo.reduce((a, b) => a + b, 0) / promediosRamo.length
  return { promedio: prom, ramosConNota: promediosRamo.length }
}

// ---------- Tiempo de estudio ----------
function tiempoPorDia(dias) {
  const mapa = {}
  dias.forEach(d => (mapa[d] = 0))
  historialEstudio.forEach(e => {
    if (mapa[e.fecha] !== undefined) mapa[e.fecha] += (e.segundos || 0)
  })
  return dias.map(d => mapa[d])
}

function tiempoTotalEnFechas(fechas) {
  const set = new Set(fechas)
  let total = 0
  historialEstudio.forEach(e => {
    if (set.has(e.fecha)) total += (e.segundos || 0)
  })
  return total
}

// ---------- Temas completados ----------
function temasPorDia(dias) {
  const mapa = {}
  dias.forEach(d => (mapa[d] = 0))
  historialTemas.forEach(t => {
    if (mapa[t.fecha] !== undefined) mapa[t.fecha] += 1
  })
  return dias.map(d => mapa[d])
}

function contarTemas() {
  // Cuenta recursiva de temas/subtemas completados y totales en todos los ramos
  let completados = 0
  let total = 0
  function recorrer(lista) {
    lista.forEach(t => {
      total++
      if (t.completado) completados++
      if (t.subtemas && t.subtemas.length) recorrer(t.subtemas)
    })
  }
  ramos.forEach(r => recorrer(r.temario || []))
  return { completados, total }
}

// ---------- Tiempo total por ramo ----------
function tiempoPorRamo() {
  return ramos
    .map(r => ({ nombre: r.name, segundos: r.tiempoEstudiado || 0 }))
    .filter(r => r.segundos > 0)
    .sort((a, b) => b.segundos - a.segundos)
}

// ===================== RENDER =====================
const dias7 = ultimosDias(7)
const hoyISO = fechaLocalISO(new Date())

// --- Tarjetas ---
const prom = calcularPromedioGeneral()
if (prom) {
  document.getElementById('promedioGeneral').textContent = prom.promedio.toFixed(2)
  document.getElementById('promedioDetalle').textContent =
    `sobre 7 · ${prom.ramosConNota} ramo${prom.ramosConNota !== 1 ? 's' : ''} con notas`
} else {
  document.getElementById('promedioGeneral').textContent = '—'
  document.getElementById('promedioDetalle').textContent = 'sin notas registradas'
}

const segHoy = tiempoTotalEnFechas([hoyISO])
document.getElementById('tiempoHoy').textContent = formatearTiempo(segHoy)

const segSemana = tiempoTotalEnFechas(dias7)
document.getElementById('tiempoSemana').textContent = formatearTiempo(segSemana)
const promedioDiario = segSemana / 7
document.getElementById('tiempoSemanaSub').textContent =
  `promedio ${formatearTiempo(promedioDiario)}/día`

const temas = contarTemas()
document.getElementById('temasTotal').textContent =
  `${temas.completados}/${temas.total}`
const temasHoy = temasPorDia([hoyISO])[0]
const temasSemana = temasPorDia(dias7).reduce((a, b) => a + b, 0)
document.getElementById('temasDetalle').textContent =
  `hoy ${temasHoy} · esta semana ${temasSemana}`

// --- Detectar si hay algo que mostrar ---
const hayDatos =
  prom !== null ||
  historialEstudio.length > 0 ||
  historialTemas.length > 0 ||
  tiempoPorRamo().length > 0 ||
  temas.total > 0

if (!hayDatos) {
  document.getElementById('dashVacio').classList.remove('hidden')
}

// --- Estilo común de Chart.js ---
const ROSA = '#ff38bd'
const ROSA_OSCURO = '#bf0068'
const colores = ['#ff38bd', '#ff8fcf', '#bf0068', '#ff0066', '#ffb3e0', '#a40557', '#ff5fa2', '#d928a7']
Chart.defaults.color = '#fff'
Chart.defaults.font.family = "'Segoe UI', sans-serif"

// --- Gráfico: tiempo por día ---
new Chart(document.getElementById('graficoTiempoDia'), {
  type: 'bar',
  data: {
    labels: dias7.map(etiquetaDia),
    datasets: [{
      label: 'Minutos estudiados',
      data: tiempoPorDia(dias7).map(s => Math.round(s / 60)),
      backgroundColor: ROSA,
      borderRadius: 8
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
      x: { ticks: { color: '#fff' }, grid: { display: false } }
    }
  }
})

// --- Gráfico: temas por día ---
new Chart(document.getElementById('graficoTemasDia'), {
  type: 'bar',
  data: {
    labels: dias7.map(etiquetaDia),
    datasets: [{
      label: 'Temas completados',
      data: temasPorDia(dias7),
      backgroundColor: ROSA_OSCURO,
      borderRadius: 8
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { color: '#fff', precision: 0 }, grid: { color: 'rgba(255,255,255,0.15)' } },
      x: { ticks: { color: '#fff' }, grid: { display: false } }
    }
  }
})

// --- Gráfico: tiempo total por ramo ---
const ramosTiempo = tiempoPorRamo()
if (ramosTiempo.length > 0) {
  new Chart(document.getElementById('graficoRamos'), {
    type: 'doughnut',
    data: {
      labels: ramosTiempo.map(r => r.nombre),
      datasets: [{
        data: ramosTiempo.map(r => Math.round(r.segundos / 60)),
        backgroundColor: colores,
        borderColor: 'rgba(255,255,255,0.3)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#fff', padding: 12 } },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} min` } }
      }
    }
  })
}

// --- Gráfico: progreso del temario (completados vs pendientes) ---
if (temas.total > 0) {
  new Chart(document.getElementById('graficoTemario'), {
    type: 'doughnut',
    data: {
      labels: ['Completados', 'Pendientes'],
      datasets: [{
        data: [temas.completados, temas.total - temas.completados],
        backgroundColor: [ROSA, 'rgba(255,255,255,0.25)'],
        borderColor: 'rgba(255,255,255,0.3)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: '#fff', padding: 12 } } }
    }
  })
}
