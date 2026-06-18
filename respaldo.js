// Respaldo y restauración de StudyQuest / Dominique
// Exporta e importa todo el progreso guardado en localStorage como un archivo .json

// Claves de datos reales (se omiten las temporales selected...)
const CLAVES_RESPALDO = [
  'ramos',
  'pruebas',
  'horario',
  'tareasPom',
  'historialEstudio',
  'historialTemas'
]

// ---------- EXPORTAR ----------
function respaldarDatos() {
  const datos = {}
  CLAVES_RESPALDO.forEach(clave => {
    const valor = localStorage.getItem(clave)
    if (valor !== null) {
      datos[clave] = JSON.parse(valor)
    }
  })

  // Envoltura con metadatos: facilita validar al restaurar
  const respaldo = {
    app: 'Dominique',
    version: 1,
    fecha: new Date().toISOString(),
    datos
  }

  const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  // Nombre con la fecha de hoy: respaldo-dominique-2026-06-18.json
  const hoy = new Date()
  const fechaTexto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `respaldo-dominique-${fechaTexto}.json`
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}

// ---------- IMPORTAR ----------
function restaurarDatos(input) {
  const archivo = input.files[0]
  if (!archivo) return

  const lector = new FileReader()
  lector.onload = function (e) {
    let respaldo
    try {
      respaldo = JSON.parse(e.target.result)
    } catch (err) {
      alert('El archivo no es un respaldo válido (no se pudo leer el JSON).')
      input.value = ''
      return
    }

    // Aceptar tanto el formato con envoltura {datos:...} como un objeto plano
    const datos = respaldo.datos || respaldo

    // Validación mínima: que tenga al menos una de nuestras claves
    const tieneAlgo = CLAVES_RESPALDO.some(c => datos[c] !== undefined)
    if (!tieneAlgo) {
      alert('El archivo no parece un respaldo de Dominique.')
      input.value = ''
      return
    }

    const confirmar = confirm(
      'Esto reemplazará tus datos actuales (ramos, pruebas, horario, etc.) con los del respaldo. ¿Continuar?'
    )
    if (!confirmar) {
      input.value = ''
      return
    }

    // Escribir cada clave presente en el respaldo
    CLAVES_RESPALDO.forEach(clave => {
      if (datos[clave] !== undefined) {
        localStorage.setItem(clave, JSON.stringify(datos[clave]))
      }
    })

    alert('¡Datos restaurados! La página se recargará.')
    location.reload()
  }

  lector.onerror = function () {
    alert('No se pudo leer el archivo.')
    input.value = ''
  }

  lector.readAsText(archivo)
}
