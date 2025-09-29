<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Leer JSON enviado desde el frontend
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!isset($data['respuestas']) || !is_array($data['respuestas'])) {
    http_response_code(400);
    echo json_encode(['error' => "El cuerpo debe incluir 'respuestas' como array de {id, answer}"]);
    exit;
}

// Normalizar respuestas { id, answer }
$respuestasUsuario = [];
foreach ($data['respuestas'] as $idx => $res) {
    if (!is_array($res) || !isset($res['id']) || !isset($res['answer'])) {
        http_response_code(400);
        echo json_encode(['error' => "Elemento inválido en 'respuestas' en índice $idx. Esperado {id, answer}."]);
        exit;
    }
    $qid = (int)$res['id'];
    $ans0 = (int)$res['answer']; // 0-based desde el frontend
    $respuestasUsuario[] = ['id' => $qid, 'answer0' => $ans0];
}

$total = count($respuestasUsuario);
$tiempo = isset($data['tiempo']) ? (int)$data['tiempo'] : 0;
$totalContestadasReq = isset($data['totalContestadas']) ? (int)$data['totalContestadas'] : null;
if ($total === 0) {
    echo json_encode(['total' => 0, 'correctas' => 0, 'correctIndex' => new stdClass()]);
    exit;
}

// Conexión a MySQL
$dbHost = 'localhost';
$dbName = 'PR0';
$dbUser = 'root';
$dbPass = '';

try {
    $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos', 'details' => $e->getMessage()]);
    exit;
}

// Obtener respuesta correcta (1-based) para los IDs
$ids = array_values(array_unique(array_map(fn($r) => (int)$r['id'], $respuestasUsuario)));
$placeholders = implode(',', array_fill(0, count($ids), '?'));

try {
    $sql = "SELECT id, resposta_correcta FROM `preguntes` WHERE id IN ($placeholders)";
    $stmt = $pdo->prepare($sql);
    foreach ($ids as $i => $val) {
        $stmt->bindValue($i + 1, $val, PDO::PARAM_INT);
    }
    $stmt->execute();
    $rows = $stmt->fetchAll();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al consultar respuestas correctas', 'details' => $e->getMessage()]);
    exit;
}

// Mapa id => correcta (1-based)
$correctMap = [];
foreach ($rows as $row) {
    $correctMap[(int)$row['id']] = (int)$row['resposta_correcta'];
}

// Contar aciertos: comparar (answer0 + 1) con correcta (1-based)
$correctas = 0;
$contestadas = 0; // número de respuestas con índice válido (>=0)
foreach ($respuestasUsuario as $res) {
    $qid = (int)$res['id'];
    $ans0 = (int)$res['answer0'];
    if ($ans0 >= 0) {
        $contestadas++;
    }
    if (array_key_exists($qid, $correctMap) && $ans0 >= 0 && ($ans0 + 1) === $correctMap[$qid]) {
        $correctas++;
    }
}

echo json_encode([
    'total' => $total,
    'correctas' => $correctas,
    // Devuelve el índice correcto por id (1-based) para que el frontend pueda marcar
    'correctIndex' => $correctMap,
    // Compatibilidad con formato anterior
    'totalPreguntas' => $total,
    'preguntasCorrectas' => $correctas,
    'respuestasUsuario' => array_map(fn($r) => (int)$r['answer0'], $respuestasUsuario),
    'tiempo' => $tiempo,
    // Nuevos campos para claridad
    'contestadas' => $contestadas,
    'totalContestadas' => $totalContestadasReq ?? $contestadas,
]);

?>
