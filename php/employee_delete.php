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

$data = json_decode(file_get_contents("php://input"), true);
$matricule = trim($data["matricule"] ?? "");

if (empty($matricule)) { echo json_encode(["error" => "Matricule requis"]); exit; }

try {
    // Supprimer le compte user associé
    $pdo->prepare("DELETE FROM users WHERE matricule = :matricule")
        ->execute([":matricule" => $matricule]);

    // Supprimer les participations
    $pdo->prepare("DELETE FROM formation_participants WHERE matricule = :matricule")
        ->execute([":matricule" => $matricule]);

    // Supprimer les demandes
    $pdo->prepare("DELETE FROM formation_requests WHERE matricule = :matricule")
        ->execute([":matricule" => $matricule]);

    // Supprimer l'employé
    $pdo->prepare("DELETE FROM employees WHERE matricule = :matricule")
        ->execute([":matricule" => $matricule]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Database error", "details" => $e->getMessage()]);
}
?>
