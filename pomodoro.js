// Configuración
const ESTUDIO = 30 * 60; // 30 minutos en segundos
const DESCANSO = 3 * 60;  // 3 minutos en segundos

let tiempoRestante = ESTUDIO;
let enEstudio = true;
let enMarcha = false;
let intervalId = null;
let tiempoEstudiadoTotal = 0; // Tiempo total estudiado en esta sesión (en segundos)
let ramoActual = null; // Ramo del que viene el usuario

// Elementos del DOM
const tiempoDisplay = document.getElementById('tiempoDisplay');
const modoDisplay = document.getElementById('modoDisplay');
const empezarBtn = document.getElementById('empezarBtn');
const noPodemosBtn = document.getElementById('noPodemosBtn');
const nuevaTareaInput = document.getElementById('nuevaTarea');
const agregarTareaBtn = document.getElementById('agregarTareaBtn');
const listasTareasDiv = document.getElementById('listasTareas');
const modal = document.getElementById('modalConfirm');
const volverPomBtn = document.getElementById('volverPomBtn');
const salirPomBtn = document.getElementById('salirPomBtn');

// Funciones principales
function actualizarDisplay() {
  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  tiempoDisplay.textContent = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function cambiarModo() {
  // Si termina el tiempo de estudio, sumar los 30 minutos
  if (enEstudio) {
    tiempoEstudiadoTotal += ESTUDIO;
  }
  enEstudio = !enEstudio;
  tiempoRestante = enEstudio ? ESTUDIO : DESCANSO;
  modoDisplay.textContent = enEstudio ? 'ESTUDIO' : 'DESCANSO';
  actualizarDisplay();
}

function iniciarCronometro() {
  if (enMarcha) return;
  enMarcha = true;
  empezarBtn.textContent = 'Pausar';
  empezarBtn.classList.add('activo');

  intervalId = setInterval(() => {
    tiempoRestante--;
    actualizarDisplay();

    if (tiempoRestante <= 0) {
      // Sonido o notificación (opcional)
      cambiarModo();
      // Reiniciar el contador
      actualizarDisplay();
    }
  }, 1000);
}

function pausarCronometro() {
  enMarcha = false;
  empezarBtn.textContent = 'Empecemos';
  empezarBtn.classList.remove('activo');
  clearInterval(intervalId);
}

function terminarPomodoro() {
  pausarCronometro();

  // Calcular el tiempo consumido en esta sesión
  let tiempoConsumido = tiempoEstudiadoTotal;
  if (enEstudio && tiempoRestante < ESTUDIO) {
    tiempoConsumido += (ESTUDIO - tiempoRestante);
  }

  // Guardar el tiempo estudiado al ramo si existe
  if (ramoActual) {
    const ramos = JSON.parse(localStorage.getItem('ramos') || '[]');
    const ramoIdx = ramos.findIndex(r => r.name === ramoActual);
    if (ramoIdx >= 0) {
      if (!ramos[ramoIdx].tiempoEstudiado) {
        ramos[ramoIdx].tiempoEstudiado = 0;
      }
      ramos[ramoIdx].tiempoEstudiado += tiempoConsumido;
      localStorage.setItem('ramos', JSON.stringify(ramos));
    }
  }

  // Registrar en el historial con fecha (para el dashboard), con o sin ramo
  if (tiempoConsumido > 0) {
    registrarHistorialEstudio(ramoActual, tiempoConsumido);
  }

  tiempoRestante = ESTUDIO;
  enEstudio = true;
  tiempoEstudiadoTotal = 0;
  actualizarDisplay();
  modoDisplay.textContent = 'ESTUDIO';
}

// Guarda una entrada de tiempo estudiado con la fecha local (YYYY-MM-DD)
function registrarHistorialEstudio(ramo, segundos) {
  const historial = JSON.parse(localStorage.getItem('historialEstudio') || '[]');
  const ahora = new Date();
  const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  historial.push({ fecha, ramo: ramo || null, segundos });
  localStorage.setItem('historialEstudio', JSON.stringify(historial));
}

// Tareas
function obtenerTareas() {
  return JSON.parse(localStorage.getItem('tareasPom') || '[]');
}

function guardarTareas(tareas) {
  localStorage.setItem('tareasPom', JSON.stringify(tareas));
}

function renderizarTareas() {
  const tareas = obtenerTareas();
  listasTareasDiv.innerHTML = '';

  if (tareas.length === 0) {
    listasTareasDiv.innerHTML = '<small style="color:#999">Sin tareas aún</small>';
    return;
  }

  tareas.forEach((tarea, idx) => {
    const div = document.createElement('div');
    div.className = `tarea-item ${tarea.completada ? 'completada' : ''}`;
    div.innerHTML = `
      <input type="checkbox" ${tarea.completada ? 'checked' : ''} onchange="marcarTarea(${idx})">
      <span class="tarea-texto">${tarea.texto}</span>
      <button class="boton-eliminar-tarea" onclick="eliminarTarea(${idx})">✕</button>
    `;
    listasTareasDiv.appendChild(div);
  });
}

function agregarTarea() {
  const texto = nuevaTareaInput.value.trim();
  if (!texto) return alert('Ingresa una tarea');

  const tareas = obtenerTareas();
  tareas.push({ texto, completada: false });
  guardarTareas(tareas);
  nuevaTareaInput.value = '';
  renderizarTareas();
}

function eliminarTarea(idx) {
  const tareas = obtenerTareas();
  tareas.splice(idx, 1);
  guardarTareas(tareas);
  renderizarTareas();
}

function marcarTarea(idx) {
  const tareas = obtenerTareas();
  tareas[idx].completada = !tareas[idx].completada;
  guardarTareas(tareas);
  renderizarTareas();
}

// Modal
function abrirModal() {
  modal.classList.remove('hidden');
}

function cerrarModal() {
  modal.classList.add('hidden');
}

// Event listeners
empezarBtn.addEventListener('click', () => {
  enMarcha ? pausarCronometro() : iniciarCronometro();
});

noPodemosBtn.addEventListener('click', abrirModal);

volverPomBtn.addEventListener('click', () => {
  cerrarModal();
  iniciarCronometro();
});

salirPomBtn.addEventListener('click', () => {
  cerrarModal();
  terminarPomodoro();
  setTimeout(() => {
    alert('Muy bien, descansaste. ¡Vuelve cuando estés listo!');
    window.location.href = 'MisRamos.html';
  }, 300);
});

agregarTareaBtn.addEventListener('click', agregarTarea);
nuevaTareaInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') agregarTarea();
});

// Inicializar
ramoActual = localStorage.getItem('selectedRamoForPom') || null;
actualizarDisplay();
renderizarTareas();
