// ---------------------------
// Estado de la partida
// ---------------------------
const NPREGUNTAS = 10; // Cambia según el número de preguntas que quieras usar

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
// Temporizador
// ---------------------------
function iniciarTemporizador() {
    estatDeLaPartida.segundos = 0; // tiempo en segundos
    estatDeLaPartida.temporizador = setInterval(() => {
        estatDeLaPartida.segundos++;
        mostrarTemporizador();
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
        const respostaUsuari = estatDeLaPartida.respostesUsuari[i]; // index 0..n-1
        let simbol = "O"; // no contestada

        if (respostaUsuari !== undefined) {
            if (estatDeLaPartida.mostrantCorreccions && dataPreguntas[i]) {
                // data.json guarda "resposta_correcta" com id 1..n, nosaltres guardem index 0..n-1
                const correctaId = Number(dataPreguntas[i].resposta_correcta);
                const esCorrecta = (Number(respostaUsuari) + 1) === correctaId;
                simbol = esCorrecta ? "✓" : "X";
            } else {
                // abans d'enviar només marquem com contestada
                simbol = "Contestada"; // punt per indicat contestada sense valorar
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

    console.log(`Pregunta ${numPregunta} - Respuesta ${numResposta}`);

    if (estatDeLaPartida.respostesUsuari[numPregunta] === undefined) {
        estatDeLaPartida.contadorPreguntes++;
        if (estatDeLaPartida.contadorPreguntes === NPREGUNTAS) {
            const btnEnviar = document.getElementById("btnEnviar");
            if (btnEnviar) btnEnviar.style.display = "block";
        }
    }

    estatDeLaPartida.respostesUsuari[numPregunta] = numResposta;
    actualitzarContador();
}

window.marcarRespuesta = marcarRespuesta;

// ---------------------------
// Mostrar una pregunta
// ---------------------------
let dataPreguntas = [];

function mostrarPregunta(idx) {
    const contenidor = document.getElementById("questionari");
    if (!contenidor || !dataPreguntas[idx]) return;

    const preguntaObj = dataPreguntas[idx];

    let htmlString = `<h3>${preguntaObj.pregunta}</h3>`;
    htmlString += `<img class="img" src="${preguntaObj.imatge}" alt="Pregunta ${idx+1}">`;

    for (let j = 0; j < preguntaObj.respostes.length; j++) {
        htmlString += `<button class="btn btn-primary w-100 my-2" 
                            data-pregunta="${idx}" 
                            data-resposta="${j}">
                            ${preguntaObj.respostes[j].etiqueta}
                       </button>`;
    }

    // Botones navegación
    htmlString += `
        <div class="mt-3">
            <br>
            <button id="btnAnterior" class="btn btn-secondary">Anterior</button>
            <button id="btnSiguiente" class="btn btn-secondary">Siguiente</button>
        </div>
    `;

    // Botón enviar (solo al final)
    if (idx === NPREGUNTAS - 1) {
        htmlString += `<button id="btnEnviar" class="btn btn-danger" style="display:none">Enviar Respuestas</button>`;
    }

    contenidor.innerHTML = htmlString;

    // Delegación eventos respuestas o modo revisión
    const answerButtons = contenidor.querySelectorAll("button[data-pregunta]");

    if (!estatDeLaPartida.mostrantCorreccions) {
        // Modo normal: permitir seleccionar y cambiar antes de enviar
        answerButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                marcarRespuesta(btn.dataset.pregunta, btn.dataset.resposta);

                // Quitar selección previa en esa pregunta
                contenidor
                    .querySelectorAll(`button[data-pregunta="${btn.dataset.pregunta}"]`)
                    .forEach(b => b.classList.remove("btn-seleccionada"));

                // Marcar este como seleccionado
                btn.classList.add("btn-seleccionada");
            });

            // Si ya estaba respondida, lo pintamos directamente al cargar
            if (
                estatDeLaPartida.respostesUsuari[idx] !== undefined &&
                Number(btn.dataset.resposta) === estatDeLaPartida.respostesUsuari[idx]
            ) {
                btn.classList.add("btn-seleccionada");
            }
        });
    } else {
        // Modo revisión: bloquear cambios y colorear correcto/incorrecto
        const correctaId = Number(preguntaObj.resposta_correcta); // 1-based
        const correctaIdx0 = correctaId - 1; // 0-based
        const respuestaUsuario = estatDeLaPartida.respostesUsuari[idx]; // 0-based o undefined

        answerButtons.forEach(btn => {
            const opcionIdx = Number(btn.dataset.resposta);

            // Bloquear cambios
            btn.disabled = true;

            // Siempre marcar la correcta en verde
            if (opcionIdx === correctaIdx0) {
                btn.classList.add("btn-correcta");
            }

            // Si el usuario respondió y fue incorrecta, marcar su selección en rojo
            if (
                respuestaUsuario !== undefined &&
                respuestaUsuario === opcionIdx &&
                respuestaUsuario !== correctaIdx0
            ) {
                btn.classList.add("btn-incorrecta");
            }

            // Quitar marcador de selección gris si lo tuviera
            btn.classList.remove("btn-seleccionada");
        });
    }
    // Navegación
    const btnAnterior = document.getElementById("btnAnterior");
    const btnSiguiente = document.getElementById("btnSiguiente");

    if (btnAnterior) {
        btnAnterior.disabled = idx === 0;
        btnAnterior.addEventListener("click", () => {
            estatDeLaPartida.preguntaActual--;
            mostrarPregunta(estatDeLaPartida.preguntaActual);
        });
    }

    if (btnSiguiente) {
        btnSiguiente.disabled = idx === NPREGUNTAS - 1;
        btnSiguiente.addEventListener("click", () => {
            estatDeLaPartida.preguntaActual++;
            mostrarPregunta(estatDeLaPartida.preguntaActual);
        });
    }

    // Enviar respuestas
    const btnEnviar = document.getElementById("btnEnviar");
    if (btnEnviar) {
        btnEnviar.addEventListener("click", () => {
            const url = "./php/recollida.php";

            const payload = {
                contadorPreguntes: estatDeLaPartida.contadorPreguntes,
                respostesUsuari: estatDeLaPartida.respostesUsuari,
                tiempo: estatDeLaPartida.segundos
            };

            fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                console.log("JSON ->", data);
                // Acceptar tant "preguntasCorrectas" com "preguntasCorrectas_servidor"
                const correctes = (data && (data.preguntasCorrectas ?? data.preguntasCorrectas_servidor)) ?? 0;
                estatDeLaPartida.preguntasCorrectas = correctes;
                estatDeLaPartida.mostrantCorreccions = true;

                const marcador = document.getElementById("marcador");
                if (marcador) {
                    const p = document.createElement("p");
                    p.className = "resultat";
                    p.textContent = `Respostes correctes: ${correctes}/${NPREGUNTAS}`;
                    marcador.appendChild(p);
                } else {
                    alert(`Respostes correctes: ${correctes}/${NPREGUNTAS}`);
                }

                // refrescar per mostrar ✓/X per cada pregunta
                actualitzarContador();
                pararTemporizador();

                // Ocultar y desactivar el botón enviar tras enviar
                btnEnviar.disabled = true;
                btnEnviar.style.display = "none";

                // Re-render de la pregunta actual para aplicar colores y bloqueo
                mostrarPregunta(estatDeLaPartida.preguntaActual);
            })
            .catch(err => console.error("Error enviant respostes:", err));
        });
        
    }

    actualitzarContador();
}

// ---------------------------
// Generar preguntas
// ---------------------------
async function imprimirJuego() {
    try {
        iniciarTemporizador();
        const response = await fetch("./js/data.json");
        if (!response.ok) throw new Error("No se pudo cargar data.json");

        dataPreguntas = await response.json();
        mostrarPregunta(estatDeLaPartida.preguntaActual);

    } catch (error) {
        console.error("Error cargando preguntas:", error);
    }
}

// ---------------------------
// Inicialización
// ---------------------------
window.addEventListener("DOMContentLoaded", () => {
    imprimirJuego();
});
