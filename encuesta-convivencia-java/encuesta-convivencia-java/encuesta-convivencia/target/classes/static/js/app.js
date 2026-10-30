/* =========================================================
   Este archivo habla con el backend en Java usando fetch().
   Las rutas del panel de profesor mandan el token de sesion
   en el encabezado "X-Token" (se obtiene al iniciar sesion
   o registrarse en /api/docentes/...).
========================================================= */

const ESCALA = [
  { valor:0, cara:'😊', rotulo:'Nunca' },
  { valor:1, cara:'🙂', rotulo:'Pocas veces' },
  { valor:2, cara:'😐', rotulo:'A veces' },
  { valor:3, cara:'😟', rotulo:'Muchas veces' },
  { valor:4, cara:'😢', rotulo:'Siempre' }
];

let PREGUNTAS = [];
let estudianteActual = {};
let respuestasActuales = [];
let preguntaActual = 0;
let tokenDocente = "";
let intervaloActualizacion = null;

/* =========================================================
   ACCESIBILIDAD: MODO OSCURO Y TEXTO GRANDE
   (se guardan en localStorage porque esta es una pagina real,
   no un artefacto de Claude, asi que localStorage funciona normal)
========================================================= */
function aplicarPreferenciasGuardadas(){
  if(localStorage.getItem('modoOscuro') === 'si') document.body.classList.add('modo-oscuro');
  if(localStorage.getItem('textoGrande') === 'si') document.body.classList.add('texto-grande');
}
aplicarPreferenciasGuardadas();

document.getElementById('btnModoOscuro').addEventListener('click', () => {
  document.body.classList.toggle('modo-oscuro');
  localStorage.setItem('modoOscuro', document.body.classList.contains('modo-oscuro') ? 'si' : 'no');
});

document.getElementById('btnTextoGrande').addEventListener('click', () => {
  document.body.classList.toggle('texto-grande');
  localStorage.setItem('textoGrande', document.body.classList.contains('texto-grande') ? 'si' : 'no');
});

/* =========================================================
   NAVEGACION ENTRE VISTAS
========================================================= */
const vistas = ["vistaInicio","vistaCurso","vistaEncuesta","vistaResumen","vistaResultadoAlumno","vistaLoginAdmin","vistaAdmin","vistaDocentes"];
function mostrarVista(id){
  vistas.forEach(v => document.getElementById(v).classList.toggle('oculto', v !== id));
  document.getElementById('btnInicio').classList.toggle('oculto', id === 'vistaInicio');
  if(id !== 'vistaAdmin' && intervaloActualizacion){
    clearInterval(intervaloActualizacion);
    intervaloActualizacion = null;
  }
}

document.getElementById('btnInicio').addEventListener('click', () => mostrarVista('vistaInicio'));

document.getElementById('btnSoyEstudiante').addEventListener('click', () => {
  mostrarVista('vistaCurso');
});

document.getElementById('btnSoyAdmin').addEventListener('click', () => {
  mostrarPestanaLogin();
  mostrarVista('vistaLoginAdmin');
});

document.getElementById('btnVolverInicio').addEventListener('click', () => mostrarVista('vistaInicio'));

/** Carga las preguntas adaptadas a la edad del estudiante (o el set estandar si no hay edad). */
async function cargarPreguntas(edad){
  try{
    const url = edad ? `/api/preguntas?edad=${encodeURIComponent(edad)}` : '/api/preguntas';
    const respuesta = await fetch(url);
    PREGUNTAS = await respuesta.json();
  }catch(e){
    alert('No se pudo conectar con el servidor. Revisa que el backend de Java esté corriendo.');
  }
}

/* =========================================================
   DATOS DEL ESTUDIANTE + INICIO DE ENCUESTA
========================================================= */
document.getElementById('btnEmpezarEncuesta').addEventListener('click', async () => {
  const nombre = document.getElementById('inputNombre').value.trim();
  const apellido = document.getElementById('inputApellido').value.trim();
  const edad = document.getElementById('inputEdad').value.trim();
  const institucion = document.getElementById('inputInstitucion').value.trim();
  const curso = document.getElementById('inputCurso').value.trim();

  if(!nombre || !apellido || !edad || !institucion){
    document.getElementById('avisoErrorCurso').classList.remove('oculto');
    return;
  }
  document.getElementById('avisoErrorCurso').classList.add('oculto');

  estudianteActual = { nombre, apellido, edad: parseInt(edad, 10), institucion, curso };

  await cargarPreguntas(estudianteActual.edad);

  preguntaActual = 0;
  respuestasActuales = new Array(PREGUNTAS.length).fill(null);
  mostrarVista('vistaEncuesta');
  renderPregunta();
});

function renderProgreso(){
  const cont = document.getElementById('progresoCamino');
  cont.innerHTML = '';
  PREGUNTAS.forEach((_, i) => {
    const p = document.createElement('div');
    p.className = 'paso';
    if(i < preguntaActual) p.classList.add('hecho');
    if(i === preguntaActual) p.classList.add('actual');
    cont.appendChild(p);
  });
}

function renderPregunta(){
  renderProgreso();
  document.getElementById('numeroPregunta').textContent = `Pregunta ${preguntaActual+1} de ${PREGUNTAS.length}`;
  document.getElementById('textoPregunta').textContent = PREGUNTAS[preguntaActual];

  const cont = document.getElementById('opcionesEmoji');
  cont.innerHTML = '';
  ESCALA.forEach(op => {
    const div = document.createElement('div');
    div.className = 'opcion-emoji';
    if(respuestasActuales[preguntaActual] === op.valor) div.classList.add('seleccionada');
    div.innerHTML = `<div class="cara">${op.cara}</div><div class="rotulo">${op.rotulo}</div>`;
    div.addEventListener('click', () => {
      respuestasActuales[preguntaActual] = op.valor;
      renderPregunta();
      setTimeout(irSiguiente, 260);
    });
    cont.appendChild(div);
  });

  document.getElementById('btnAnterior').disabled = preguntaActual === 0;
  document.getElementById('btnSiguiente').disabled = respuestasActuales[preguntaActual] === null;
}

document.getElementById('btnAnterior').addEventListener('click', () => {
  if(preguntaActual > 0){ preguntaActual--; renderPregunta(); }
});
document.getElementById('btnSiguiente').addEventListener('click', irSiguiente);

function irSiguiente(){
  if(respuestasActuales[preguntaActual] === null) return;
  if(preguntaActual < PREGUNTAS.length - 1){
    preguntaActual++;
    renderPregunta();
  } else {
    mostrarResumen();
  }
}

/* =========================================================
   RESUMEN ANTES DE ENVIAR
========================================================= */
function mostrarResumen(){
  const cont = document.getElementById('listaResumen');
  cont.innerHTML = '';
  PREGUNTAS.forEach((pregunta, i) => {
    const opcion = ESCALA.find(o => o.valor === respuestasActuales[i]);
    const item = document.createElement('div');
    item.className = 'item-resumen';
    item.innerHTML = `
      <span class="num">${i+1}.</span>
      <span class="txt">${pregunta}</span>
      <span class="resp">${opcion.cara} ${opcion.rotulo}</span>
    `;
    cont.appendChild(item);
  });
  mostrarVista('vistaResumen');
}

document.getElementById('btnVolverARevisar').addEventListener('click', () => {
  preguntaActual = 0;
  mostrarVista('vistaEncuesta');
  renderPregunta();
});

document.getElementById('btnConfirmarEnvio').addEventListener('click', finalizarEncuesta);

async function finalizarEncuesta(){
  try{
    const respuesta = await fetch('/api/respuestas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: estudianteActual.nombre,
        apellido: estudianteActual.apellido,
        edad: estudianteActual.edad,
        institucion: estudianteActual.institucion,
        curso: estudianteActual.curso,
        respuestas: respuestasActuales
      })
    });
    const datos = await respuesta.json();
    if(!respuesta.ok){
      alert(datos.error || 'Ocurrió un error al guardar tu respuesta.');
      return;
    }
    mostrarResultadoAlumno(datos.porcentaje, datos.categoria);
  }catch(e){
    alert('No se pudo conectar con el servidor. Revisa que el backend de Java esté corriendo.');
  }
}

function mostrarResultadoAlumno(porcentaje, categoria){
  ['Roja','Amarilla','Verde'].forEach(c => {
    document.getElementById('luzAlumno'+c).className = 'luz';
  });
  const mensaje = document.getElementById('mensajeAlumno');
  const ayuda = document.getElementById('ayudaEmergencia');

  if(categoria === 'verde'){
    document.getElementById('luzAlumnoVerde').className = 'luz on-verde';
    mensaje.textContent = '¡Qué bueno! Parece que en tu entorno la convivencia va bien. Sigue cuidando a tus compañeros y avisando a un adulto si algo cambia.';
    ayuda.classList.add('oculto');
  } else if(categoria === 'amarillo'){
    document.getElementById('luzAlumnoAmarilla').className = 'luz on-amarilla';
    mensaje.textContent = 'Notamos algunas señales de alerta. Si tú o algún compañero necesita ayuda, cuéntale a un profesor, tus papás o un adulto de confianza.';
    ayuda.classList.add('oculto');
  } else {
    document.getElementById('luzAlumnoRoja').className = 'luz on-roja';
    mensaje.textContent = 'Esto es importante. Por favor cuéntale a un profesor, tus papás o un adulto de confianza lo que está pasando. Tú no tienes la culpa y mereces ayuda.';
    ayuda.classList.remove('oculto');
  }
  mostrarVista('vistaResultadoAlumno');
}

/* =========================================================
   PESTAÑAS LOGIN / REGISTRO
========================================================= */
document.getElementById('pestanaLogin').addEventListener('click', mostrarPestanaLogin);
document.getElementById('pestanaRegistro').addEventListener('click', mostrarPestanaRegistro);

function mostrarPestanaLogin(){
  document.getElementById('pestanaLogin').classList.add('activa');
  document.getElementById('pestanaRegistro').classList.remove('activa');
  document.getElementById('formularioLogin').classList.remove('oculto');
  document.getElementById('formularioRegistro').classList.add('oculto');
  document.getElementById('avisoError').classList.add('oculto');
}

function mostrarPestanaRegistro(){
  document.getElementById('pestanaRegistro').classList.add('activa');
  document.getElementById('pestanaLogin').classList.remove('activa');
  document.getElementById('formularioRegistro').classList.remove('oculto');
  document.getElementById('formularioLogin').classList.add('oculto');
  document.getElementById('avisoErrorRegistro').classList.add('oculto');
}

/* =========================================================
   LOGIN DE DOCENTE (POST /api/docentes/login)
========================================================= */
document.getElementById('btnEntrarAdmin').addEventListener('click', iniciarSesionDocente);
document.getElementById('inputContrasenaLogin').addEventListener('keydown', e => { if(e.key === 'Enter') iniciarSesionDocente(); });

async function iniciarSesionDocente(){
  const nombreUsuario = document.getElementById('inputUsuarioLogin').value.trim();
  const contrasena = document.getElementById('inputContrasenaLogin').value;
  const aviso = document.getElementById('avisoError');
  aviso.classList.add('oculto');

  if(!nombreUsuario || !contrasena){
    aviso.textContent = 'Ingresa tu usuario y contraseña.';
    aviso.classList.remove('oculto');
    return;
  }

  try{
    const respuesta = await fetch('/api/docentes/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario, contrasena })
    });
    const datos = await respuesta.json();
    if(!respuesta.ok){
      aviso.textContent = datos.error || 'Usuario o contraseña incorrectos.';
      aviso.classList.remove('oculto');
      return;
    }
    entrarAlPanel(datos.token);
  }catch(e){
    alert('No se pudo conectar con el servidor. Revisa que el backend de Java esté corriendo.');
  }
}

/* =========================================================
   REGISTRO DE DOCENTE (POST /api/docentes/registro)
========================================================= */
document.getElementById('btnRegistrarAdmin').addEventListener('click', registrarDocente);

async function registrarDocente(){
  const nombreCompleto = document.getElementById('inputNombreCompletoRegistro').value.trim();
  const institucion = document.getElementById('inputInstitucionRegistro').value.trim();
  const nombreUsuario = document.getElementById('inputUsuarioRegistro').value.trim();
  const contrasena = document.getElementById('inputContrasenaRegistro').value;
  const codigoInvitacion = document.getElementById('inputCodigoInvitacion').value.trim();
  const aviso = document.getElementById('avisoErrorRegistro');
  aviso.classList.add('oculto');

  if(!nombreCompleto || !nombreUsuario || !contrasena || !codigoInvitacion){
    aviso.textContent = 'Completa tu nombre, usuario, contraseña y el código de invitación.';
    aviso.classList.remove('oculto');
    return;
  }
  if(contrasena.length < 6){
    aviso.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    aviso.classList.remove('oculto');
    return;
  }

  try{
    const respuesta = await fetch('/api/docentes/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreCompleto, institucion, nombreUsuario, contrasena, codigoInvitacion })
    });
    const datos = await respuesta.json();
    if(!respuesta.ok){
      aviso.textContent = datos.error || 'No se pudo crear la cuenta.';
      aviso.classList.remove('oculto');
      return;
    }
    entrarAlPanel(datos.token);
  }catch(e){
    alert('No se pudo conectar con el servidor. Revisa que el backend de Java esté corriendo.');
  }
}

function entrarAlPanel(token){
  tokenDocente = token;
  mostrarVista('vistaAdmin');
  cargarDashboard();
  intervaloActualizacion = setInterval(cargarDashboard, 5000);
}

/* =========================================================
   DASHBOARD ADMIN (GET /api/estadisticas)
========================================================= */
document.getElementById('filtroCurso').addEventListener('change', cargarDashboard);
document.getElementById('filtroInstitucion').addEventListener('change', cargarDashboard);

/* =========================================================
   GESTION DE PROFESORES
========================================================= */
document.getElementById('btnVerDocentes').addEventListener('click', () => {
  mostrarVista('vistaDocentes');
  cargarListaDocentes();
});

document.getElementById('btnVolverAlPanel').addEventListener('click', () => {
  mostrarVista('vistaAdmin');
});

async function cargarListaDocentes(){
  const cont = document.getElementById('listaDocentes');
  cont.innerHTML = '<div class="vacio">Cargando...</div>';

  let docentes;
  try{
    const respuesta = await fetch('/api/docentes', { headers: { 'X-Token': tokenDocente } });
    if(!respuesta.ok){
      alert('Tu sesión expiró. Vuelve a iniciar sesión.');
      mostrarVista('vistaLoginAdmin');
      return;
    }
    docentes = await respuesta.json();
  }catch(e){
    cont.innerHTML = '<div class="vacio">No se pudo cargar la lista.</div>';
    return;
  }

  if(docentes.length === 0){
    cont.innerHTML = '<div class="vacio">No hay trabajadores sociales registrados.</div>';
    return;
  }

  cont.innerHTML = docentes.map(d => `
    <div class="item-docente">
      <div class="info-docente">
        <div class="nombre">${escaparHtml(d.nombreCompleto)} <span style="color:var(--texto-suave); font-weight:400;">(@${escaparHtml(d.nombreUsuario)})</span></div>
        <div class="detalle">${escaparHtml(d.institucion)} — registrado el ${escaparHtml(d.fechaRegistro)}</div>
      </div>
      <button class="btn-eliminar-docente" data-id="${d.id}" data-nombre="${escaparHtml(d.nombreCompleto)}">Eliminar</button>
    </div>
  `).join('');

  cont.querySelectorAll('.btn-eliminar-docente').forEach(boton => {
    boton.addEventListener('click', () => eliminarDocente(boton.dataset.id, boton.dataset.nombre));
  });
}

async function eliminarDocente(id, nombre){
  if(!confirm(`¿Seguro que quieres eliminar la cuenta de ${nombre}? Esta acción no se puede deshacer.`)) return;
  try{
    const respuesta = await fetch(`/api/docentes/${id}`, { method: 'DELETE', headers: { 'X-Token': tokenDocente } });
    const datos = await respuesta.json();
    if(!respuesta.ok){
      alert(datos.error || 'No se pudo eliminar el trabajador social.');
      return;
    }
    cargarListaDocentes();
  }catch(e){
    alert('No se pudo conectar con el servidor.');
  }
}
document.getElementById('btnBorrarTodo').addEventListener('click', async () => {
  if(!confirm('¿Seguro que quieres borrar TODAS las respuestas? Esta acción no se puede deshacer.')) return;
  try{
    await fetch('/api/respuestas', { method: 'DELETE', headers: { 'X-Token': tokenDocente } });
    cargarDashboard();
  }catch(e){
    alert('No se pudo borrar la información. Intenta de nuevo.');
  }
});

document.getElementById('btnExportarPdf').addEventListener('click', () => window.print());

document.getElementById('btnExportarExcel').addEventListener('click', async () => {
  const curso = document.getElementById('filtroCurso').value || 'todos';
  const institucion = document.getElementById('filtroInstitucion').value || 'todas';
  try{
    const respuesta = await fetch(
        `/api/respuestas/exportar?curso=${encodeURIComponent(curso)}&institucion=${encodeURIComponent(institucion)}`,
        { headers: { 'X-Token': tokenDocente } }
    );
    if(!respuesta.ok){
      alert('No se pudo exportar. Vuelve a iniciar sesión.');
      return;
    }
    const filas = await respuesta.json();
    descargarComoCsv(filas);
  }catch(e){
    alert('No se pudo conectar con el servidor.');
  }
});

function descargarComoCsv(filas){
  const encabezados = ['Fecha','Estudiante','Edad','Institución','Curso','Puntaje','Nivel','Comentario'];
  const lineas = [encabezados.join(';')];
  filas.forEach(r => {
    const fila = [r.fecha, r.nombreCompleto, r.edad ?? '', r.institucion, r.curso, r.porcentaje + '%', textoCategoria(r.categoria), r.comentario ?? ''];
    lineas.push(fila.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';'));
  });
  const csv = '\uFEFF' + lineas.join('\r\n'); // \uFEFF para que Excel detecte bien los acentos
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = `resultados-convivencia-${new Date().toISOString().slice(0,10)}.csv`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

async function cargarDashboard(){
  const selectCurso = document.getElementById('filtroCurso');
  const selectInstitucion = document.getElementById('filtroInstitucion');
  const cursoElegido = selectCurso.value || 'todos';
  const institucionElegida = selectInstitucion.value || 'todas';

  let datosEstadisticas;
  try{
    const respuesta = await fetch(
        `/api/estadisticas?curso=${encodeURIComponent(cursoElegido)}&institucion=${encodeURIComponent(institucionElegida)}`,
        { headers: { 'X-Token': tokenDocente } }
    );
    if(!respuesta.ok){
      alert('Tu sesión expiró. Vuelve a iniciar sesión.');
      mostrarVista('vistaLoginAdmin');
      return;
    }
    datosEstadisticas = await respuesta.json();
  }catch(e){
    console.error('No se pudo cargar el panel:', e);
    return;
  }

  const cursoActual = selectCurso.value;
  selectCurso.innerHTML = '<option value="todos">Todos los cursos</option>' +
      datosEstadisticas.cursos.map(c => `<option value="${escaparHtml(c)}">${escaparHtml(c)}</option>`).join('');
  if(datosEstadisticas.cursos.includes(cursoActual)) selectCurso.value = cursoActual;

  const institucionActual = selectInstitucion.value;
  selectInstitucion.innerHTML = '<option value="todas">Todas las instituciones</option>' +
      datosEstadisticas.instituciones.map(i => `<option value="${escaparHtml(i)}">${escaparHtml(i)}</option>`).join('');
  if(datosEstadisticas.instituciones.includes(institucionActual)) selectInstitucion.value = institucionActual;

  document.getElementById('ultimaActualizacion').textContent =
      'Actualizado ' + new Date().toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit', second:'2-digit'});

  renderDashboard(datosEstadisticas);
  cargarEvolucion(cursoElegido, institucionElegida);
}

function escaparHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function textoCategoria(cat){
  if(cat==='verde') return 'Nivel bajo';
  if(cat==='amarillo') return 'Nivel medio';
  return 'Nivel alto';
}
function colorDe(cat){ return cat==='verde' ? 'var(--verde)' : cat==='amarillo' ? 'var(--amarillo)' : 'var(--rojo)'; }
function pct(parte, total){ return total ? Math.round((parte/total)*100) : 0; }

function renderDashboard(d){
  const cont = document.getElementById('contenidoAdmin');
  cont.innerHTML = '';

  /* ---- Alertas automaticas (siempre visibles, sin importar el filtro) ---- */
  const hayAlertasCursos = d.alertasCursos && d.alertasCursos.length > 0;
  const hayAlertasInstituciones = d.alertasInstituciones && d.alertasInstituciones.length > 0;
  if(hayAlertasCursos || hayAlertasInstituciones){
    const panelAlertas = document.createElement('div');
    panelAlertas.className = 'panel panel-alertas';
    let chips = '';
    if(hayAlertasInstituciones){
      chips += d.alertasInstituciones.map(a => `<span class="chip-alerta">🏫 ${escaparHtml(a.nombre)} — ${a.promedio}%</span>`).join('');
    }
    if(hayAlertasCursos){
      chips += d.alertasCursos.map(a => `<span class="chip-alerta">👥 ${escaparHtml(a.nombre)} — ${a.promedio}%</span>`).join('');
    }
    panelAlertas.innerHTML = `
      <h3>⚠️ Alertas activas</h3>
      <div class="sub">Estos grupos tienen un promedio en nivel alto (rojo), sin importar el filtro que tengas puesto</div>
      <div class="lista-alertas">${chips}</div>
    `;
    cont.appendChild(panelAlertas);
  }

  if(d.total === 0){
    cont.innerHTML += `<div class="panel"><div class="vacio">Todavía no hay respuestas registradas. 📭<br>Comparte el enlace con tus estudiantes para empezar a ver resultados aquí.</div></div>`;
    return;
  }

  const filaStats = document.createElement('div');
  filaStats.className = 'fila-estadisticas';
  filaStats.innerHTML = `
    <div class="stat"><div class="valor">${d.total}</div><div class="etiqueta">Respuestas</div></div>
    <div class="stat"><div class="valor">${d.promedioGeneral}%</div><div class="etiqueta">Promedio general</div></div>
    <div class="stat"><div class="valor">${d.instituciones.length}</div><div class="etiqueta">Instituciones</div></div>
  `;
  cont.appendChild(filaStats);

  const panelSemaforo = document.createElement('div');
  panelSemaforo.className = 'panel';
  panelSemaforo.innerHTML = `
    <h3>Semáforo general</h3>
    <div class="sub">Nivel de percepción de violencia escolar en el grupo seleccionado</div>
    <div class="fila-semaforo-admin" style="margin-top:14px;">
      <div class="semaforo-admin">
        <div class="luz ${d.categoriaGeneral==='rojo'?'on-roja':''}"></div>
        <div class="luz ${d.categoriaGeneral==='amarillo'?'on-amarilla':''}"></div>
        <div class="luz ${d.categoriaGeneral==='verde'?'on-verde':''}"></div>
      </div>
      <div>
        <div style="font-family:'Baloo 2'; font-size:1.6em; font-weight:700; color:var(--azul-oscuro);">${d.promedioGeneral}%</div>
        <div style="color:var(--texto-suave); font-size:0.9em;">${textoCategoria(d.categoriaGeneral)}</div>
      </div>
    </div>
  `;
  cont.appendChild(panelSemaforo);

  /* ---- Evolucion en el tiempo (se llena aparte, de forma asincrona) ---- */
  const panelEvolucion = document.createElement('div');
  panelEvolucion.className = 'panel';
  panelEvolucion.id = 'panelEvolucion';
  panelEvolucion.innerHTML = `
    <h3>Evolución en el tiempo</h3>
    <div class="sub">Promedio de percepción de violencia escolar por día</div>
    <div class="grafica-evolucion" id="graficaEvolucion"><div class="vacio">Cargando...</div></div>
  `;
  cont.appendChild(panelEvolucion);

  const conteo = d.distribucion;
  const total3 = conteo.verde + conteo.amarillo + conteo.rojo;
  const pv = total3 ? (conteo.verde/total3*360) : 0;
  const pa = total3 ? (conteo.amarillo/total3*360) : 0;
  const gradiente = `conic-gradient(var(--verde) 0deg ${pv}deg, var(--amarillo) ${pv}deg ${pv+pa}deg, var(--rojo) ${pv+pa}deg 360deg)`;

  const panelDona = document.createElement('div');
  panelDona.className = 'panel';
  panelDona.innerHTML = `
    <h3>Distribución de estudiantes</h3>
    <div class="sub">Cuántos estudiantes cayeron en cada nivel del semáforo</div>
    <div class="dona-envoltorio" style="margin-top:14px;">
      <div class="dona" style="background:${gradiente};"></div>
      <div class="leyenda-dona">
        <span><span class="punto" style="background:var(--verde);"></span>Verde: ${conteo.verde} (${pct(conteo.verde,total3)}%)</span>
        <span><span class="punto" style="background:var(--amarillo);"></span>Amarillo: ${conteo.amarillo} (${pct(conteo.amarillo,total3)}%)</span>
        <span><span class="punto" style="background:var(--rojo);"></span>Rojo: ${conteo.rojo} (${pct(conteo.rojo,total3)}%)</span>
      </div>
    </div>
  `;
  cont.appendChild(panelDona);

  const panelBarras = document.createElement('div');
  panelBarras.className = 'panel';
  let barrasHtml = `<h3>Resultados por pregunta</h3><div class="sub">Promedio de frecuencia reportada, en porcentaje</div><div style="margin-top:16px;">`;
  PREGUNTAS.forEach((p, i) => {
    const val = d.promediosPregunta[i] ?? 0;
    barrasHtml += `
      <div class="barra-pregunta">
        <div class="txt"><span>${i+1}. ${p}</span><span><strong>${val}%</strong></span></div>
        <div class="fondo-barra"><div class="relleno-barra" style="width:${val}%;"></div></div>
      </div>
    `;
  });
  barrasHtml += `</div>`;
  panelBarras.innerHTML = barrasHtml;
  cont.appendChild(panelBarras);

  const panelTabla = document.createElement('div');
  panelTabla.className = 'panel';
  let filas = d.recientes.map(r => `
    <tr>
      <td>${escaparHtml(r.fecha)}</td>
      <td>${escaparHtml(r.nombreCompleto)}</td>
      <td>${r.edad ?? '-'}</td>
      <td>${escaparHtml(r.institucion)}</td>
      <td>${escaparHtml(r.curso)}</td>
      <td>${r.porcentaje}%</td>
      <td><span class="etiqueta-color" style="background:${colorDe(r.categoria)};">${textoCategoria(r.categoria)}</span></td>
      <td>
        ${r.comentario ? `<span class="texto-comentario">${escaparHtml(r.comentario)}</span>` : ''}
        <button class="btn-comentario" data-id="${r.id}" data-actual="${escaparHtml(r.comentario ?? '')}">
          ${r.comentario ? 'Editar' : '+ Agregar'}
        </button>
      </td>
    </tr>
  `).join('');
  panelTabla.innerHTML = `
    <h3>Respuestas recientes</h3>
    <div class="sub">Últimas ${d.recientes.length} respuestas registradas</div>
    <div style="overflow-x:auto; margin-top:12px;">
      <table>
        <thead><tr><th>Fecha</th><th>Estudiante</th><th>Edad</th><th>Institución</th><th>Curso</th><th>Puntaje</th><th>Nivel</th><th>Comentario</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
  `;
  cont.appendChild(panelTabla);

  panelTabla.querySelectorAll('.btn-comentario').forEach(boton => {
    boton.addEventListener('click', () => editarComentario(boton.dataset.id, boton.dataset.actual));
  });
}

async function editarComentario(id, comentarioActual){
  const nuevo = window.prompt('Observación para esta respuesta:', comentarioActual || '');
  if(nuevo === null) return; // cancelado
  try{
    await fetch(`/api/respuestas/${id}/comentario`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Token': tokenDocente },
      body: JSON.stringify({ comentario: nuevo })
    });
    cargarDashboard();
  }catch(e){
    alert('No se pudo guardar el comentario.');
  }
}

/* =========================================================
   GRAFICA DE EVOLUCION EN EL TIEMPO (SVG dibujado a mano)
========================================================= */
async function cargarEvolucion(curso, institucion){
  const contenedor = document.getElementById('graficaEvolucion');
  if(!contenedor) return;

  let puntos;
  try{
    const respuesta = await fetch(
        `/api/estadisticas/evolucion?curso=${encodeURIComponent(curso)}&institucion=${encodeURIComponent(institucion)}`,
        { headers: { 'X-Token': tokenDocente } }
    );
    if(!respuesta.ok) return;
    puntos = await respuesta.json();
  }catch(e){
    return;
  }

  if(!puntos || puntos.length === 0){
    contenedor.innerHTML = '<div class="vacio">Aún no hay suficientes datos para mostrar una evolución.</div>';
    return;
  }
  if(puntos.length === 1){
    contenedor.innerHTML = `<div class="vacio">Solo hay datos de un día (${escaparHtml(puntos[0].fecha)}: ${puntos[0].promedio}%). Se necesitan al menos 2 días distintos para ver una evolución.</div>`;
    return;
  }

  const ancho = 600, alto = 200, margen = 30;
  const pasoX = (ancho - margen*2) / (puntos.length - 1);
  const coordX = i => margen + i * pasoX;
  const coordY = valor => alto - margen - (valor / 100) * (alto - margen*2);

  const coords = puntos.map((p, i) => `${coordX(i)},${coordY(p.promedio)}`).join(' ');

  const circulos = puntos.map((p, i) => `
    <circle cx="${coordX(i)}" cy="${coordY(p.promedio)}" r="4" fill="var(--coral)" />
    <text x="${coordX(i)}" y="${coordY(p.promedio)-10}" font-size="11" text-anchor="middle" fill="var(--texto)">${p.promedio}%</text>
    <text x="${coordX(i)}" y="${alto-8}" font-size="10" text-anchor="middle" fill="var(--texto-suave)">${p.fecha}</text>
  `).join('');

  // Lineas de referencia del semaforo (30% y 60%)
  const yVerde = coordY(30);
  const yAmarillo = coordY(60);

  contenedor.innerHTML = `
    <svg viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg">
      <line x1="${margen}" y1="${yVerde}" x2="${ancho-margen}" y2="${yVerde}" stroke="var(--verde)" stroke-dasharray="4 3" stroke-width="1"/>
      <line x1="${margen}" y1="${yAmarillo}" x2="${ancho-margen}" y2="${yAmarillo}" stroke="var(--amarillo)" stroke-dasharray="4 3" stroke-width="1"/>
      <polyline points="${coords}" fill="none" stroke="var(--azul)" stroke-width="2.5"/>
      ${circulos}
    </svg>
  `;
}

cargarPreguntas();
