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
    http_response_code(401); echo json_encode(["error" => "Non autorisé"]); exit;
}

$data   = json_decode(file_get_contents("php://input"), true);
$numero = trim($data["numero_formation"] ?? "");

if (empty($numero)) { echo json_encode(["error" => "Numéro de formation requis"]); exit; }

try {
    $pdo->prepare("DELETE FROM formation_participants WHERE numero_formation = :nf")
        ->execute([":nf" => $numero]);
    $pdo->prepare("DELETE FROM formations WHERE numero_formation = :nf")
        ->execute([":nf" => $numero]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Database error", "details" => $e->getMessage()]);
}
?>
