<?php
// Para depuración: ver qué llega en crudo
// file_get_contents('php://input') lee el body tal cual
$raw = file_get_contents("php://input");

// 1) Si llega como JSON
$dataJSON = json_decode($raw, true);

// 2) Si llega como FormData o x-www-form-urlencoded, se reciben en $_POST
$dataPOST = $_POST;

// Inicializamos variables de resultado
$preguntasCorrectas = 0;
$error = null;

try {
    // Solo calculamos si tenemos el JSON esperado desde el front
    if (is_array($dataJSON) && isset($dataJSON['respostesUsuari']) && is_array($dataJSON['respostesUsuari'])) {
        $respostesUsuari = $dataJSON['respostesUsuari']; // array de índices (0..n)

        // Cargar las preguntas y respuestas correctas del fichero data.json
        $dataPath = __DIR__ . '/../js/data.json';
        if (!file_exists($dataPath)) {
            throw new Exception('No se encuentra el fichero de datos: ' . $dataPath);
        }

        $jsonContent = file_get_contents($dataPath);
        if ($jsonContent === false) {
            throw new Exception('No se pudo leer el fichero de datos');
        }

        $questions = json_decode($jsonContent, true);
        if (!is_array($questions)) {
            throw new Exception('El fichero de datos no contiene JSON válido');
        }

        // Comparar respuestas. Nota: en data.json la "resposta_correcta" está 1-based.
        // En el front se envía el índice 0-based (j). Por tanto comparamos (j + 1) == resposta_correcta
        $n = min(count($respostesUsuari), count($questions));
        for ($i = 0; $i < $n; $i++) {
            // Puede que alguna posición no esté definida
            if (!isset($respostesUsuari[$i])) {
                continue;
            }

            $userIdx0 = $respostesUsuari[$i]; // 0-based
            $correct1 = isset($questions[$i]['resposta_correcta']) ? $questions[$i]['resposta_correcta'] : null; // 1-based

            if ($correct1 === null) {
                continue;
            }

            if ((int)$userIdx0 + 1 === (int)$correct1) {
                $preguntasCorrectas++;
            }
        }
    }
} catch (Exception $ex) {
    $error = $ex->getMessage();
}

// Montamos respuesta para ver qué ha llegado y el cálculo
$response = [
    'raw_input' => $raw,
    'json_decode' => $dataJSON,
    'post' => $dataPOST,
    'preguntasCorrectas_servidor' => $preguntasCorrectas,
    'error' => $error
];

// Mostramos como JSON para ver en consola del fetch
header('Content-Type: application/json');
echo json_encode($response);