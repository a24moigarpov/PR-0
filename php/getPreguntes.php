<?php
// Headers para API REST
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuración de la base de datos
$dbHost = 'localhost';
$dbName = 'a24moigarpov_pr0';
$dbUser = 'a24moigarpov_a24moigarpov';
$dbPass = 'UJCFWTG-k1';

// Conectar PDO
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

// Helper para sanitizar strings simples
function val($arr, $key, $default = '') {
    return isset($arr[$key]) ? trim((string)$arr[$key]) : $default;
}

// Obtener el método HTTP y la acción
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Si no hay input JSON, usar POST/GET tradicional
if (!$input) {
    $input = $_POST ?: $_GET;
}

$action = val($input, 'action', '');

try {
    switch ($method) {
        case 'GET':
            if ($action === 'admin') {
                // Obtener todas las preguntas para el admin (incluye imatge)
                $sql = 'SELECT id, pregunta, resposta_1, resposta_2, resposta_3, resposta_4, resposta_correcta, imatge FROM `preguntes` ORDER BY id DESC';
                $stmt = $pdo->query($sql);
                $rows = $stmt->fetchAll();
                
                echo json_encode([
                    'success' => true,
                    'questions' => $rows
                ]);
            } elseif (isset($input['id']) && $input['id'] !== '') {
                // Obtener una pregunta específica por ID
                $id = (int)$input['id'];
                $sql = 'SELECT id, pregunta, resposta_1, resposta_2, resposta_3, resposta_4, resposta_correcta, imatge FROM `preguntes` WHERE id = :id';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':id' => $id]);
                $row = $stmt->fetch();
                
                if ($row) {
                    echo json_encode([
                        'success' => true,
                        'question' => $row
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Pregunta no encontrada'
                    ]);
                }
            } else {
                // Obtener preguntas para el quiz
                $numPreguntes = isset($input['num']) ? intval($input['num']) : 10;
                
                $sql = "SELECT id, pregunta, resposta_1, resposta_2, resposta_3, resposta_4, imatge FROM `preguntes` ORDER BY RAND() LIMIT :lim";
                $stmt = $pdo->prepare($sql);
                $lim = max(1, $numPreguntes);
                $stmt->bindValue(':lim', $lim, PDO::PARAM_INT);
                $stmt->execute();
                $rows = $stmt->fetchAll();
                
                // Normalizar respuestas
                $preguntesAPI = [];
                foreach ($rows as $row) {
                    $answersArr = [];
                    foreach (['resposta_1','resposta_2','resposta_3','resposta_4'] as $key) {
                        if (isset($row[$key]) && $row[$key] !== null && $row[$key] !== '') {
                            $answersArr[] = $row[$key];
                        }
                    }

                    $preguntesAPI[] = [
                        'id' => (int)$row['id'],
                        'question' => $row['pregunta'],
                        'answers' => array_values($answersArr),
                        'imatge' => isset($row['imatge']) ? $row['imatge'] : null,
                    ];
                }

                echo json_encode([
                    'success' => true,
                    'questions' => $preguntesAPI
                ]);
            }
            break;

        case 'POST':
            if ($action === 'create') {
                // Crear nueva pregunta
                $question = val($input, 'question');
                $answer1 = val($input, 'answer1');
                $answer2 = val($input, 'answer2');
                $answer3 = val($input, 'answer3');
                $answer4 = val($input, 'answer4');
                $correctIndex = isset($input['correctIndex']) ? (int)$input['correctIndex'] : 0;
                $imageUrl = isset($input['imageUrl']) ? trim($input['imageUrl']) : '';

                if ($question === '' || $answer1 === '' || $answer2 === '' || $answer3 === '' || $answer4 === '') {
                    throw new RuntimeException('Todos los campos de pregunta y respuestas son obligatorios.');
                }
                if ($correctIndex < 0 || $correctIndex > 3) {
                    throw new RuntimeException('El índice correcto debe estar entre 0 y 3.');
                }

                $sql = 'INSERT INTO `preguntes` (pregunta, resposta_1, resposta_2, resposta_3, resposta_4, resposta_correcta, imatge) VALUES (:q, :a1, :a2, :a3, :a4, :ci, :img)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':q' => $question,
                    ':a1' => $answer1,
                    ':a2' => $answer2,
                    ':a3' => $answer3,
                    ':a4' => $answer4,
                    ':ci' => $correctIndex,
                    ':img' => $imageUrl
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Pregunta creada correctamente.',
                    'id' => (int)$pdo->lastInsertId()
                ]);

            } elseif ($action === 'update') {
                // Actualizar pregunta existente
                $id = isset($input['id']) ? (int)$input['id'] : 0;
                $question = val($input, 'question');
                $answer1 = val($input, 'answer1');
                $answer2 = val($input, 'answer2');
                $answer3 = val($input, 'answer3');
                $answer4 = val($input, 'answer4');
                $correctIndex = isset($input['correctIndex']) ? (int)$input['correctIndex'] : 0;
                $imageUrl = val($input, 'imageUrl', '');

                if ($id <= 0) {
                    throw new RuntimeException('ID inválido.');
                }
                if ($question === '' || $answer1 === '' || $answer2 === '' || $answer3 === '' || $answer4 === '') {
                    throw new RuntimeException('Todos los campos de pregunta y respuestas son obligatorios.');
                }
                if ($correctIndex < 0 || $correctIndex > 3) {
                    throw new RuntimeException('El índice correcto debe estar entre 0 y 3.');
                }

                $sql = 'UPDATE `preguntes` SET pregunta=:q, resposta_1=:a1, resposta_2=:a2, resposta_3=:a3, resposta_4=:a4, resposta_correcta=:ci, imatge=:img WHERE id=:id';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':q' => $question,
                    ':a1' => $answer1,
                    ':a2' => $answer2,
                    ':a3' => $answer3,
                    ':a4' => $answer4,
                    ':ci' => $correctIndex,
                    ':img' => $imageUrl,
                    ':id' => $id,
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Pregunta actualizada correctamente.'
                ]);

            } elseif ($action === 'delete') {
                // Eliminar pregunta
                $id = (int)val($input, 'id', '0');
                if ($id <= 0) {
                    throw new RuntimeException('ID inválido.');
                }

                $stmt = $pdo->prepare('DELETE FROM `preguntes` WHERE id = :id');
                $stmt->execute([':id' => $id]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Pregunta eliminada correctamente.'
                ]);
            } else {
                throw new RuntimeException('Acción no válida.');
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }

} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>