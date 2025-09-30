// ---------------------------
// Estado de la partida
// ---------------------------
const NPREGUNTAS = 10; // Cambia según el número de preguntas que quieras usar

// Clave de almacenamiento local
const STORAGE_KEY = "quizStateV1";

//bloquea el scroll
// window.onscroll = function() {
//     window.scrollTo(10, 0);
// };

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
        console.warn("No se pudo guardar el estado:", e);
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        if (!Array.isArray(parsed.dataPreguntas)) return null;
        return parsed;
    } catch (e) {
        console.warn("No se pudo cargar el estado:", e);
        return null;
    }
}

function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
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
    // No reiniciamos segundos aquí: así podemos reanudar desde el valor guardado
    pararTemporizador();
    estatDeLaPartida.temporizador = setInterval(() => {
        estatDeLaPartida.segundos++;
        mostrarTemporizador();
        // Persistimos cada 5s para evitar muchas escrituras
        if (estatDeLaPartida.segundos % 5 === 0) saveState();
    }, 1000);
}

function pararTemporizador() {
    clearInterval(estatDeLaPartida.temporizador);
}

function mostrarTemporizador() {
    const temporizador = document.getElementById("temporizador");
    if (!temporizador) return;

    let minutos = Math.floor(estatDeLaPartida.segundos / 60);
    let segundos = estatDeLaPartida.segundos % 60;
    let segundosStr = segundos < 10 ? `0${segundos}` : segundos;

    temporizador.innerHTML = `Tiempo: ${minutos}:${segundosStr}`;
}

// ---------------------------
// Funciones principales
// ---------------------------
function actualitzarContador() {
    const marcador = document.getElementById("marcador");
    if (!marcador) return;

    let htmlString = `Preguntes respostes ${estatDeLaPartida.contadorPreguntes}/${NPREGUNTAS} <br>`;
    for (let i = 0; i < NPREGUNTAS; i++) {
        const respostaUsuari = estatDeLaPartida.respostesUsuari[i];
        let simbol = "O"; // no contestada

        if (respostaUsuari !== undefined) {
            if (estatDeLaPartida.mostrantCorreccions && dataPreguntas[i]) {
                const correctaId = Number(dataPreguntas[i].resposta_correcta);
                const esCorrecta = (Number(respostaUsuari) + 1) === correctaId;
                simbol = esCorrecta ? "✓" : "X";
            } else {
                simbol = "Contestada";
            }
        }

        htmlString += `Pregunta ${i+1} : <span class='badge text-bg-primary'> ${simbol}</span><br>`;
    }
    htmlString += `<br>`;
    htmlString += `Preguntes correctes: ${estatDeLaPartida.preguntasCorrectas}/${NPREGUNTAS}`;

    marcador.innerHTML = htmlString;
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

    estatDeLaPartida.respostesUsuari[numPregunta] = numResposta;
    actualitzarContador();
    saveState();
}

window.marcarRespuesta = marcarRespuesta;

// ---------------------------
// Mostrar una pregunta
// ---------------------------
let dataPreguntas = [];

// Preload helper to warm up browser cache for image URLs
function preloadImages(urls) {
    try {
        const unique = Array.from(new Set(urls.filter(Boolean)));
        unique.forEach(src => {
            const img = new Image();
            img.decoding = "async";
            img.loading = "eager";
            img.src = src;
            // We don't need to await; cache will be warmed once loaded
        });
    } catch (e) {
        console.warn("preloadImages() error:", e);
    }
}

function mostrarPregunta(idx) {
    const contenidor = document.getElementById("questionari");
    if (!contenidor || !dataPreguntas[idx]) return;

    const preguntaObj = dataPreguntas[idx];

    let htmlString = `<h3>${preguntaObj.pregunta}</h3>`;
    if (preguntaObj.imatge) {
        htmlString += `<div class="image-container"><img class="img" src="${preguntaObj.imatge}" alt="Pregunta ${idx+1}" loading="eager" decoding="async" fetchpriority="high"></div>`;
    }

    // Layout: respuestas a la izquierda y marcador a la derecha, ambos debajo de la imagen
    htmlString += `<div class="question-layout">`;
    htmlString += `<div class="answers-col">`;

    for (let j = 0; j < preguntaObj.respostes.length; j++) {
        htmlString += `<button class="btn btn-primary w-100 my-2" 
                            data-pregunta="${idx}" 
                            data-resposta="${j}">
                            ${preguntaObj.respostes[j].etiqueta}
                       </button>`;
    }

    htmlString += `</div>`; // fin answers-col
    htmlString += `<div class="sidebar-col"><div id="marcador-slot"></div></div>`;
    htmlString += `</div>`; // fin question-layout

    // Botón Enviar arriba de los botones de navegación (oculto hasta contestar todo)
    htmlString += `<button id="btnEnviar" class="btn" style="display:none">Enviar Respuestas</button>`;

    // Navegación compacta debajo de todo
    htmlString += `
        <div class="nav-pager">
            <button id="btnAnterior" class="btn btn-secondary">Anterior</button>
            <button id="btnSiguiente" class="btn btn-secondary">Siguiente</button>
        </div>
    `;

    // Capturamos referencia al marcador ANTES de reemplazar el contenido
    const marcador = document.getElementById("marcador");

    // Render del contenido de la pregunta
    contenidor.innerHTML = htmlString;

    // Recolocar el marcador en la nueva ranura lateral de esta vista
    const marcadorSlot = contenidor.querySelector("#marcador-slot");
    if (marcador && marcadorSlot && marcador.parentElement !== marcadorSlot) {
        marcadorSlot.appendChild(marcador);
    }

    const answerButtons = contenidor.querySelectorAll("button[data-pregunta]");

    if (!estatDeLaPartida.mostrantCorreccions) {
        answerButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                marcarRespuesta(btn.dataset.pregunta, btn.dataset.resposta);

                contenidor.querySelectorAll(`button[data-pregunta="${btn.dataset.pregunta}"]`)
                          .forEach(b => b.classList.remove("btn-seleccionada"));

                btn.classList.add("btn-seleccionada");
            });

            if (estatDeLaPartida.respostesUsuari[idx] !== undefined &&
                Number(btn.dataset.resposta) === estatDeLaPartida.respostesUsuari[idx]) {
                btn.classList.add("btn-seleccionada");
            }
        });
    } else {
        const correctaId = Number(preguntaObj.resposta_correcta);
        const correctaIdx0 = correctaId - 1;
        const respuestaUsuario = estatDeLaPartida.respostesUsuari[idx];

        answerButtons.forEach(btn => {
            const opcionIdx = Number(btn.dataset.resposta);
            btn.disabled = true;

            if (opcionIdx === correctaIdx0) btn.classList.add("btn-correcta");
            if (respuestaUsuario !== undefined && respuestaUsuario === opcionIdx && respuestaUsuario !== correctaIdx0) {
                btn.classList.add("btn-incorrecta");
            }
            btn.classList.remove("btn-seleccionada");
        });
    }

    const btnAnterior = document.getElementById("btnAnterior");
    const btnSiguiente = document.getElementById("btnSiguiente");

    if (btnAnterior) {
        btnAnterior.disabled = idx === 0;
        btnAnterior.addEventListener("click", () => {
            estatDeLaPartida.preguntaActual--;
            mostrarPregunta(estatDeLaPartida.preguntaActual);
            saveState();
        });
    }

    if (btnSiguiente) {
        btnSiguiente.disabled = idx === NPREGUNTAS - 1;
        btnSiguiente.addEventListener("click", () => {
            estatDeLaPartida.preguntaActual++;
            mostrarPregunta(estatDeLaPartida.preguntaActual);
            saveState();
        });
    }

    const btnEnviar = document.getElementById("btnEnviar");
    if (btnEnviar) {
        // Si ya se han contestado todas, mostrar el botón tras re-render
        if (estatDeLaPartida.contadorPreguntes === NPREGUNTAS) {
            btnEnviar.style.display = "block";
        }
        btnEnviar.addEventListener("click", () => {
            // Transformar respuestas para enviar al backend
            const respuestasAPI = dataPreguntas.map((p, idx) => ({
                id: p.id,
                answer: estatDeLaPartida.respostesUsuari[idx] ?? -1
            }));

            const payload = {
                respuestas: respuestasAPI,
                tiempo: estatDeLaPartida.segundos,
                totalContestadas: estatDeLaPartida.contadorPreguntes
            };

            fetch("./php/recollida.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(async res => {
                const raw = await res.text();
                try {
                    return JSON.parse(raw);
                } catch (e) {
                    throw new Error("Respuesta no es JSON válido: " + e.message);
                }
            })
            .then(data => {
                console.log("[RECOLLIDA] Respuesta del servidor:", data);
                estatDeLaPartida.preguntasCorrectas = data.correctas ?? 0;
                estatDeLaPartida.mostrantCorreccions = true;

                // Asignar respuesta correcta a cada pregunta
                if (data.correctIndex) {
                    dataPreguntas.forEach(p => {
                        p.resposta_correcta = data.correctIndex[p.id];
                    });
                }

                actualitzarContador();
                pararTemporizador();
                mostrarPregunta(estatDeLaPartida.preguntaActual);

                btnEnviar.disabled = true;
                btnEnviar.style.display = "none";
                // Guardamos el estado final (por si el usuario recarga para ver correcciones)
                saveState();
            })
            .catch(err => console.error("[RECOLLIDA] Error enviando respuestas:", err));
        });
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
