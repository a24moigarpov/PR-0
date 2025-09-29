<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Leer el JSON del cuerpo de la petición
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['respuestas']) || !is_array($input['respuestas'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Parámetro respuestas requerido como array']);
    exit;
}

// Normalizar y validar entradas: esperamos objetos { id, answer }
$respuestasUsuario = [];
foreach ($input['respuestas'] as $idx => $res) {
    if (!is_array($res) || !isset($res['id']) || !isset($res['answer'])) {
        http_response_code(400);
        echo json_encode(['error' => "Elemento de 'respuestas' inválido en índice $idx. Se espera {id, answer}."]);
        exit;
    }
    $qid = (int)$res['id'];
    $ans = (int)$res['answer'];
    $respuestasUsuario[] = ['id' => $qid, 'answer' => $ans];
}

// Si no hay respuestas, devolver 0s
$totalPreguntes = count($respuestasUsuario);
if ($totalPreguntes === 0) {
    echo json_encode(['total' => 0, 'correctas' => 0]);
    exit;
}

// Conexión a MySQL
$dbHost = 'localhost';
$dbName = 'a24moigarpov_pr0';
$dbUser = 'a24moigarpov_a24moigarpov';
$dbPass = 'UJCFWTG-k1';

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

// Obtener respuesta correcta para todos los ids
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

// Mapear id => resposta_correcta
$correctMap = [];
foreach ($rows as $row) {
    $correctMap[(int)$row['id']] = (int)$row['resposta_correcta'];
}

// Contar aciertos
$respuestasCorrectas = 0;
foreach ($respuestasUsuario as $res) {
    $qid = (int)$res['id'];
    $ans = (int)$res['answer'];
    if (array_key_exists($qid, $correctMap) && $correctMap[$qid] === $ans) {
        $respuestasCorrectas++;
    }
}

echo json_encode([
    'total' => $totalPreguntes,
    'correctas' => $respuestasCorrectas
]);
?>
