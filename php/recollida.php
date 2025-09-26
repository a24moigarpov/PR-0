<?php
header('Content-Type: application/json');

// Leer JSON enviado desde el frontend
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$preguntasCorrectas = 0;
$respostesUsuari = $data['respostesUsuari'] ?? [];
// Tiempo total que tardó el usuario (en segundos)
$tiempo = isset($data['tiempo']) ? (int)$data['tiempo'] : 0;

// Cargar preguntas originales
$questionsFile = __DIR__ . '/../js/data.json';
$questions = json_decode(file_get_contents($questionsFile), true);

// Comparar respuestas
foreach ($respostesUsuari as $i => $userIdx0) {
    if (isset($questions[$i]['resposta_correcta'])) {
        // respuesta_correcta es 1-based, userIdx0 es 0-based
        if ((int)$userIdx0 + 1 === (int)$questions[$i]['resposta_correcta']) {
            $preguntasCorrectas++;
        }
    }
}

// Devolver resultado
echo json_encode([
    'totalPreguntas' => count($respostesUsuari),
    'respuestasUsuario' => $respostesUsuari,
    'preguntasCorrectas' => $preguntasCorrectas,
    'tiempo' => $tiempo
]);
