// ---------------------------
// Estado de la partida
// ---------------------------
const NPREGUNTAS = 10; // Número de preguntas del cuestionario

// Clave de almacenamiento local
const STORAGE_KEY = "quizStateV1";

let estatDeLaPartida = {
    contadorPreguntes: 0,
    respostesUsuari: [],
    preguntasCorrectas: 0,
    temporizador: 0,
    segundos: 0,
    preguntaActual: 0, // índice de la pregunta mostrada
    mostrantCorreccions: false // després d'enviar, mostrem ✓/X reals
};

// ---------------------------
// Persistencia (localStorage)
// ---------------------------
function saveState() {
    try {
        const state = {
            estatDeLaPartida: {
                contadorPreguntes: estatDeLaPartida.contadorPreguntes,
                respostesUsuari: estatDeLaPartida.respostesUsuari,
                preguntasCorrectas: estatDeLaPartida.preguntasCorrectas,
                segundos: estatDeLaPartida.segundos,
                preguntaActual: estatDeLaPartida.preguntaActual,
                mostrantCorreccions: estatDeLaPartida.mostrantCorreccions
            },
            dataPreguntas
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn("Error al guardar el estado:", e);
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.warn("Error al cargar el estado:", e);
        return null;
    }
}

function clearState() {
    localStorage.removeItem(STORAGE_KEY);
}

// Permite reiniciar la partida desde fuera (p.ej., al borrar el nombre)
function resetQuiz() {
    clearState();
    pararTemporizador();
    estatDeLaPartida.contadorPreguntes = 0;
    estatDeLaPartida.respostesUsuari = [];
    estatDeLaPartida.preguntasCorrectas = 0;
    estatDeLaPartida.segundos = 0;
    estatDeLaPartida.preguntaActual = 0;
    estatDeLaPartida.mostrantCorreccions = false;
    dataPreguntas = [];

    // Limpiar UI básica
    const contenidor = document.getElementById("questionari");
    if (contenidor) contenidor.innerHTML = "";

    // Si el marcador no existe, lo creamos
    if (!document.getElementById("marcador")) {
        const nuevoMarcador = document.createElement("div");
        nuevoMarcador.id = "marcador";
        document.body.appendChild(nuevoMarcador); // O donde lo necesites
    } else {
        document.getElementById("marcador").innerHTML = "";
    }

    const temp = document.getElementById("temporizador");
    if (temp) temp.textContent = "";

    // Iniciar un nuevo juego
    imprimirJuego();
    
    // Forzar la actualización del contador
    actualitzarContador();
}
// Exponer resetQuiz globalmente
window.resetQuiz = resetQuiz;

// ---------------------------
// Temporizador
// ---------------------------
function iniciarTemporizador() {
    pararTemporizador();
    estatDeLaPartida.temporizador = setInterval(() => {
        estatDeLaPartida.segundos++;
        mostrarTemporizador();
        // Guardar estado cada 5 segundos
        if (estatDeLaPartida.segundos % 5 === 0) saveState();
    }, 1000);
}

function pararTemporizador() {
    if (estatDeLaPartida.temporizador) {
        clearInterval(estatDeLaPartida.temporizador);
    }
}

function mostrarTemporizador() {
    const temporizador = document.getElementById("temporizador");
    if (!temporizador) return;

    const minutos = Math.floor(estatDeLaPartida.segundos / 60);
    const segundos = estatDeLaPartida.segundos % 60;
    const segundosStr = segundos < 10 ? `0${segundos}` : segundos;

    temporizador.innerHTML = `Tiempo: ${minutos}:${segundosStr} <span class="reloj">⏳</span>`;
}



// ---------------------------
// Funciones principales
// ---------------------------
function actualitzarContador() {
    const marcador = document.getElementById("marcador");
    if (!marcador) return;

    // Generar el HTML de las preguntas
    const preguntasHTML = Array.from({ length: NPREGUNTAS }, (_, i) => {
        const respostaUsuari = estatDeLaPartida.respostesUsuari[i];
        let badgeClass = 'badge text-bg-secondary no-contestada';
        let simbol = '?';

        if (respostaUsuari !== undefined) {
            if (estatDeLaPartida.mostrantCorreccions && dataPreguntas[i]) {
                const correctaId = Number(dataPreguntas[i].resposta_correcta);
                const esCorrecta = (Number(respostaUsuari) + 1) === correctaId;
                
                badgeClass = esCorrecta ? 'badge correcte' : 'badge incorrecte';
                simbol = esCorrecta ? '✓' : '✗';
            } else {
                badgeClass = 'badge text-bg-primary';
                simbol = (i + 1).toString();
            }
        }

        return `
            <a href="#" class="${badgeClass} pregunta-link" data-pregunta="${i}" 
               style="text-decoration: none; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;">
                ${simbol}
            </a>`;
    }).join('');

    // Construir el HTML final
    marcador.innerHTML = `
        <div class="mb-3">
            <strong>Progreso:</strong> ${estatDeLaPartida.contadorPreguntes}/${NPREGUNTAS} preguntas respondidas
        </div>
        <div class="mb-3">
            <strong>Preguntas:</strong><br>
            <div class="d-flex flex-wrap gap-2 mt-2">
                ${preguntasHTML}
            </div>
        </div>
        <div class="alert ${estatDeLaPartida.mostrantCorreccions ? 'alert-info' : 'alert-secondary'}">
            <strong>Puntuación:</strong> ${estatDeLaPartida.preguntasCorrectas} de ${NPREGUNTAS} correctas
        </div>`;

    // Añadir manejadores de eventos a los enlaces de preguntas
    document.querySelectorAll('.pregunta-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const preguntaIndex = parseInt(link.getAttribute('data-pregunta'));
            if (!isNaN(preguntaIndex)) {
                estatDeLaPartida.preguntaActual = preguntaIndex;
                mostrarPregunta(preguntaIndex);
            }
        });
    });
}

function marcarRespuesta(numPregunta, numResposta) {
    numPregunta = Number(numPregunta);
    numResposta = Number(numResposta);

    if (estatDeLaPartida.respostesUsuari[numPregunta] === undefined) {
        estatDeLaPartida.contadorPreguntes++;
        if (estatDeLaPartida.contadorPreguntes === NPREGUNTAS) {
            const btnEnviar = document.getElementById("btnEnviar");
            if (btnEnviar) btnEnviar.style.display = "block";
        }
    }

    // Guardar la respuesta
    estatDeLaPartida.respostesUsuari[numPregunta] = numResposta;
    
    // Actualizar la interfaz
    const answerButtons = document.querySelectorAll(`button[data-pregunta="${numPregunta}"]`);
    answerButtons.forEach(btn => {
        // Actualizar la clase de selección sin mostrar feedback todavía
        const isSelected = Number(btn.dataset.resposta) === numResposta;
        btn.classList.toggle("btn-seleccionada", isSelected);
    });
    
    actualitzarContador();
    saveState();
}

window.marcarRespuesta = marcarRespuesta;

// ---------------------------
// Mostrar una pregunta
// ---------------------------
let dataPreguntas = [];

/**
 * Precarga imágenes para mejorar el rendimiento
 * @param {string[]} urls - Array de URLs de imágenes a precargar
 */
function preloadImages(urls) {
    if (!Array.isArray(urls)) return;
    
    try {
        // Filtrar URLs vacías y duplicadas
        const uniqueUrls = [...new Set(urls.filter(Boolean))];
        
        // Precargar cada imagen
        uniqueUrls.forEach(src => {
            const img = new Image();
            img.decoding = "async";
            img.loading = "eager";
            img.src = src;
        });
    } catch (error) {
        console.warn("Error al precargar imágenes:", error);
    }
}

/**
 * Muestra una pregunta en el contenedor especificado
 * @param {number} idx - Índice de la pregunta a mostrar
 */
function mostrarPregunta(idx) {
    const contenidor = document.getElementById("questionari");
    if (!contenidor || !dataPreguntas[idx]) return;

    const preguntaObj = dataPreguntas[idx];
    const tieneImagen = Boolean(preguntaObj.imatge);
    
    // Construir el HTML de las respuestas
    const respuestasHTML = preguntaObj.respostes
        .map((respuesta, j) => 
            `<button class="btn btn-primary w-100 my-2" 
                    data-pregunta="${idx}" 
                    data-resposta="${j}">
                ${respuesta.etiqueta}
            </button>`
        )
        .join('');

    // Construir el HTML completo
    const htmlString = `
        <h3>${preguntaObj.pregunta}</h3>
        ${tieneImagen ? 
            `<div class="image-container">
                <img class="img" src="${preguntaObj.imatge}" 
                     alt="Pregunta ${idx + 1}" 
                     loading="eager" 
                     decoding="async" 
                     fetchpriority="high">
            </div>` : ''
        }
        <div class="question-layout">
            <div class="answers-col">
                ${respuestasHTML}
            </div>
            <div class="sidebar-col">
                <div id="marcador-slot"></div>
            </div>
        </div>
        <button id="btnEnviar" class="btn" style="display:none">Enviar Respuestas</button>
        <div class="nav-pager">
            <button id="btnAnterior" class="btn btn-secondary">Anterior</button>
            <button id="btnSiguiente" class="btn btn-secondary">Siguiente</button>
        </div>
    `;

    // Guardar referencia al marcador antes de modificar el DOM
    const marcador = document.getElementById("marcador");
    
    // Renderizar el contenido
    contenidor.innerHTML = htmlString;

    // Mover el marcador a su nueva ubicación si es necesario
    const marcadorSlot = contenidor.querySelector("#marcador-slot");
    if (marcador && marcadorSlot && marcador.parentElement !== marcadorSlot) {
        marcadorSlot.appendChild(marcador);
    }

    // Configurar manejadores de eventos si no estamos mostrando correcciones
    if (!estatDeLaPartida.mostrantCorreccions) {
        const answerButtons = contenidor.querySelectorAll("button[data-pregunta]");
        
        answerButtons.forEach(btn => {
            // Clonar el botón para eliminar manejadores anteriores
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Configurar manejador de clic
            newBtn.addEventListener("click", (e) => {
                e.preventDefault();
                if (!estatDeLaPartida.mostrantCorreccions) {
                    marcarRespuesta(parseInt(newBtn.dataset.pregunta), parseInt(newBtn.dataset.resposta));
                }
            });

            // Mostrar el estado guardado de la respuesta
            const respuestaUsuario = estatDeLaPartida.respostesUsuari[idx];
            if (respuestaUsuario === undefined) return;
            
            const opcionIdx = parseInt(newBtn.dataset.resposta);
            
            // Actualizar clases del botón
            newBtn.classList.toggle("btn-seleccionada", opcionIdx === respuestaUsuario);
            
            // Si estamos en modo revisión, mostrar retroalimentación visual
            if (estatDeLaPartida.mostrantCorreccions) {
                const correctaId = parseInt(preguntaObj.resposta_correcta);
                const esCorrecta = (respuestaUsuario + 1) === correctaId;
                const esOpcionCorrecta = opcionIdx === (correctaId - 1);
                const esOpcionSeleccionada = opcionIdx === respuestaUsuario;
                
                if (esOpcionSeleccionada) {
                    newBtn.classList.add(esCorrecta ? "correcta" : "incorrecta");
                }
                if (esOpcionCorrecta) {
                    newBtn.classList.add("resposta-correcta");
                }
            }
        });
    } else {
        // Modo de revisión - Mostrar retroalimentación de respuestas
        const correctaId = parseInt(preguntaObj.resposta_correcta);
        const correctaIdx0 = correctaId - 1;
        const respuestaUsuario = estatDeLaPartida.respostesUsuari[idx];
        const answerButtons = contenidor.querySelectorAll("button[data-pregunta]");

        answerButtons.forEach(btn => {
            const opcionIdx = parseInt(btn.dataset.resposta);
            btn.disabled = true;
            btn.classList.remove("btn-primary", "btn-seleccionada");

            // Determinar el estado de la opción actual
            const esOpcionCorrecta = opcionIdx === correctaIdx0;
            const esOpcionSeleccionada = respuestaUsuario === opcionIdx;
            
            // Aplicar estilos según el estado de la opción
            if (esOpcionCorrecta) {
                btn.classList.add("correcta", "resposta-correcta");
            }
            
            if (esOpcionSeleccionada) {
                btn.classList.add(esOpcionCorrecta ? "correcta" : "incorrecta");
            }
        });
    }

    // Configurar navegación entre preguntas
    const configurarNavegacion = (btn, incremento) => {
        if (!btn) return;
        
        btn.disabled = (incremento < 0 && idx === 0) || 
                      (incremento > 0 && idx === NPREGUNTAS - 1);
        
        // Usar event delegation para manejar los clics
        btn.onclick = (e) => {
            e.preventDefault();
            estatDeLaPartida.preguntaActual += incremento;
            mostrarPregunta(estatDeLaPartida.preguntaActual);
            saveState();
        };
    };

    configurarNavegacion(document.getElementById("btnAnterior"), -1);
    configurarNavegacion(document.getElementById("btnSiguiente"), 1);

    // Configurar botón de envío
    const btnEnviar = document.getElementById("btnEnviar");
    if (btnEnviar) {
        // Mostrar el botón solo si se han contestado todas las preguntas
        btnEnviar.style.display = estatDeLaPartida.contadorPreguntes === NPREGUNTAS ? "block" : "none";
        
        btnEnviar.onclick = async (e) => {
            e.preventDefault();
            if (btnEnviar.disabled) return;
            
            btnEnviar.disabled = true;
            
            try {
                const respuestasAPI = dataPreguntas.map((p, idx) => ({
                    id: p.id,
                    answer: estatDeLaPartida.respostesUsuari[idx] ?? -1
                }));

                const response = await fetch("./php/recollida.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        respuestas: respuestasAPI,
                        tiempo: estatDeLaPartida.segundos,
                        totalContestadas: estatDeLaPartida.contadorPreguntes
                    })
                });

                const data = await response.json();
                console.log("[RECOLLIDA] Respuesta del servidor:", data);
                
                // Actualizar estado con los resultados
                estatDeLaPartida.preguntasCorrectas = data.correctas ?? 0;
                estatDeLaPartida.mostrantCorreccions = true;

                // Actualizar respuestas correctas
                if (data.correctIndex) {
                    dataPreguntas.forEach(p => {
                        p.resposta_correcta = data.correctIndex[p.id];
                    });
                }

                // Actualizar la interfaz
                actualitzarContador();
                pararTemporizador();
                mostrarPregunta(estatDeLaPartida.preguntaActual);
                
                // Guardar estado final
                saveState();
            } catch (error) {
                console.error("[RECOLLIDA] Error enviando respuestas:", error);
                btnEnviar.disabled = false;
                alert("Error al enviar las respuestas. Por favor, inténtalo de nuevo.");
            }
        };
    }

    actualitzarContador();
}

// ---------------------------
// Generar preguntas
// ---------------------------
async function imprimirJuego() {
    try {
        // Empezamos desde 0 en un juego nuevo
        estatDeLaPartida.segundos = 0;
        iniciarTemporizador();
        const response = await fetch(`./php/getPreguntes.php?num=${NPREGUNTAS}`);
        if (!response.ok) throw new Error("No se pudieron cargar las preguntas");

        const json = await response.json();
        if (!json.success) throw new Error("Error en API: " + (json.error || ""));

        dataPreguntas = json.questions.map(q => ({
            id: q.id,
            pregunta: q.question,
            respostes: q.answers.map(a => ({ etiqueta: a })),
            resposta_correcta: null,
            imatge: q.imatge || null
        }));

        // Start preloading all images in background so navigation is instant
        const imageUrls = dataPreguntas.map(p => p.imatge).filter(Boolean);
        if (imageUrls.length) preloadImages(imageUrls);

        mostrarPregunta(estatDeLaPartida.preguntaActual);
        saveState();

    } catch (error) {
        console.error("Error cargando preguntas:", error);
    }
}

// ---------------------------
// Inicialización
// ---------------------------
window.addEventListener("DOMContentLoaded", () => {
    const restored = loadState();
    if (restored) {
        // Restauramos datos y estado
        dataPreguntas = restored.dataPreguntas;
        estatDeLaPartida.contadorPreguntes = restored.estatDeLaPartida.contadorPreguntes || 0;
        estatDeLaPartida.respostesUsuari = restored.estatDeLaPartida.respostesUsuari || [];
        estatDeLaPartida.preguntasCorrectas = restored.estatDeLaPartida.preguntasCorrectas || 0;
        estatDeLaPartida.segundos = restored.estatDeLaPartida.segundos || 0;
        estatDeLaPartida.preguntaActual = restored.estatDeLaPartida.preguntaActual || 0;
        estatDeLaPartida.mostrantCorreccions = !!restored.estatDeLaPartida.mostrantCorreccions;

        iniciarTemporizador();
        mostrarPregunta(estatDeLaPartida.preguntaActual);
        mostrarTemporizador();
        actualitzarContador();
    } else {
        imprimirJuego();
    }
});
