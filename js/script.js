import preguntes from "../js/data.js";

//global para que el click funcione
window.marcarRespuesta = marcarRespuesta;

let estatDeLaPartida = {
 contadorPreguntes : 0,
 respostesUsuari: []
}

function actualitzarContador() {
    let marcador = document.getElementById("marcador");
    marcador.innerHTML = `Pregunta ${estatDeLaPartida.contadorPreguntes} Respostes ${estatDeLaPartida.respostesUsuari.length}`;
}
function marcarRespuesta(numPregunta, numRespuesta) {
    console.log(`S'ha seleccionat la resposta ${numRespuesta} de la pregunta ${numPregunta}`);
    
    estatDeLaPartida.contadorPreguntes++;
    estatDeLaPartida.respostesUsuari[numPregunta] = numRespuesta;
    console.log(estatDeLaPartida);
    actualitzarContador();
}

window.addEventListener('DOMContentLoaded', (event) => {


        let contenidor = document.getElementById("preguntes");
        let html = "";

        for (let i = 0; i < preguntes.length; i++) {
            html += `<h3>${preguntes[i].pregunta}</h3>`;
            html += `<img src="${preguntes[i].imatge}" alt="Imatge de la pregunta ${i + 1}"> <br>`;

            for (let j = 0; j < preguntes[i].respostes.length; j++) {
                html += `<button onclick="marcarRespuesta(${i + 1}, ${j + 1})">
                    ${preguntes[i].respostes[j].etiqueta}
                </button>`;
            }

        }

    contenidor.innerHTML = html;
});


window.addEventListener('DOMContentLoaded', (event) => {
    fetch("./data.js")
    .then(response => response.json())
    .then(data => {
        preguntes = data;
        mostrarPregunta(preguntes[0]);
    })
});



// insertar al HTML
contenidor.innerHTML = html;
