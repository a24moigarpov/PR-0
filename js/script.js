// ---------------------------
// Estado de la partida
// ---------------------------
const NPREGUNTAS = 10; // Cambia según el número de preguntas que quieras usar

let estatDeLaPartida = {
    contadorPreguntes: 0,
    respostesUsuari: [],
    preguntasCorrectas: 0
};

// ---------------------------
// Funciones principales
// ---------------------------
function actualitzarContador() {
    const marcador = document.getElementById("marcador");
    if (!marcador) return;

    let htmlString = `Preguntes respostes ${estatDeLaPartida.contadorPreguntes}/${NPREGUNTAS} <br>`;
    for (let i = 0; i < estatDeLaPartida.respostesUsuari.length; i++) {
        htmlString += `Pregunta ${i} : <span class='badge text-bg-primary'> 
                        ${(estatDeLaPartida.respostesUsuari[i] == undefined ? "O" : "X")}
                       </span><br>`;
    }

    marcador.innerHTML = htmlString;
}

function marcarRespuesta(numPregunta, numResposta) {
    numPregunta = Number(numPregunta);
    numResposta = Number(numResposta);

    console.log(`Pregunta ${numPregunta} - Respuesta ${numResposta}`);

    // Solo contar si aún no se había respondido
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
// Generar preguntas y botones
// ---------------------------
async function imprimirJuego() {
    try {
        const response = await fetch("./js/data.json");
        if (!response.ok) throw new Error("No se pudo cargar data.json");

        const data = await response.json(); // data es un array de preguntas
        const contenidor = document.getElementById("questionari"); // asegúrate de que exista en HTML
        if (!contenidor) throw new Error("No existe el contenedor #questionari");

        let htmlString = "";

        for (let i = 0; i < NPREGUNTAS; i++) {
            const preguntaObj = data[i]; // accedemos directamente al objeto de la pregunta

            htmlString += `<h3>${preguntaObj.pregunta}</h3>`;
            htmlString += `<img src="${preguntaObj.imatge}" alt="Pregunta ${i+1}" style="max-width:300px; display:block; margin:8px 0;">`;

            for (let j = 0; j < preguntaObj.respostes.length; j++) {
                htmlString += `<button class="btn btn-primary w-100 my-2" 
                                    data-pregunta="${i}" 
                                    data-resposta="${j}">
                                    ${preguntaObj.respostes[j].etiqueta}
                               </button>`;
            }
        }

        // Botón de enviar respuestas (oculto hasta completar todas las preguntas)
        htmlString += `<button id="btnEnviar" class="btn btn-danger" style="display:none">Enviar Respuestas</button>`;

        contenidor.innerHTML = htmlString;

        // Delegación de eventos para los botones
        contenidor.addEventListener("click", (e) => {
            const btn = e.target.closest("button");
            if (!btn || !contenidor.contains(btn)) return;

            const numPregunta = btn.dataset.pregunta;
            const numResposta = btn.dataset.resposta;

            if (numPregunta !== undefined && numResposta !== undefined) {
                marcarRespuesta(numPregunta, numResposta);
            }
        });

        // Evento para enviar respuestas al servidor
        const btnEnviar = document.getElementById("btnEnviar");
        if (btnEnviar) {
            btnEnviar.addEventListener("click", () => {
                const url = "./php/recollida.php"; // Cambia a tu endpoint real

                // Enviar un payload limpio sin 'preguntasCorrectas' para evitar confusión en el servidor
                const payload = {
                    contadorPreguntes: estatDeLaPartida.contadorPreguntes,
                    respostesUsuari: estatDeLaPartida.respostesUsuari
                };

                fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(data => {
                    console.log("JSON ->", data);
                    const correctes = data?.preguntasCorrectas_servidor ?? 0;
                    // Actualizar estado local con el resultado del servidor
                    estatDeLaPartida.preguntasCorrectas = correctes;
                    // Mostrar resultado de forma visible
                    const marcador = document.getElementById("marcador");
                    if (marcador) {
                        const p = document.createElement("p");
                        p.className = "resultat";
                        p.textContent = `Respostes correctes: ${correctes}/${NPREGUNTAS}`;
                        marcador.appendChild(p);
                    } else {
                        alert(`Respostes correctes: ${correctes}/${NPREGUNTAS}`);
                    }
                })
                .catch(err => console.error('Error enviant respostes:', err));
            });
        }

        actualitzarContador();

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
