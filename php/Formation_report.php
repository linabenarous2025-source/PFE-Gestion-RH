<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

require "config.php";
require "jwt.php";

$decoded = JWT::fromRequest();
if (!$decoded || $decoded["role"] !== "manager") {
    http_response_code(401);
    echo json_encode(["error" => "Non autorisé"]);
    exit;
}

$data   = json_decode(file_get_contents("php://input"), true);
$numero = trim($data["numero_formation"] ?? "");

if (!$numero) { echo json_encode(["error" => "Numéro de formation requis"]); exit; }

try {
    $check = $pdo->prepare("SELECT status FROM formations WHERE numero_formation = :num");
    $check->execute([":num" => $numero]);
    $formation = $check->fetch(PDO::FETCH_ASSOC);

    if (!$formation) { echo json_encode(["error" => "Formation introuvable"]); exit; }
    if (in_array($formation["status"], ["Terminée", "Annulée"])) {
        echo json_encode(["error" => "Impossible de reporter une formation {$formation['status']}"]); exit;
    }

    $pdo->prepare("UPDATE formations SET status = 'Reportée' WHERE numero_formation = :num")
        ->execute([":num" => $numero]);

    echo json_encode(["success" => true, "numero_formation" => $numero, "status" => "Reportée"]);

} catch (PDOException $e) {
    echo json_encode(["error" => "Database error", "details" => $e->getMessage()]);
}
?>