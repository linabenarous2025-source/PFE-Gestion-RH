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
$id     = intval($data["id"] ?? 0);
$status = trim($data["status"] ?? "");

if (!$id) { echo json_encode(["error" => "ID requis"]); exit; }
if (!in_array($status, ["Approuvée", "Refusée", "En attente"])) {
    echo json_encode(["error" => "Statut invalide"]); exit;
}

try {
    $pdo->prepare("UPDATE formation_requests SET status = :status WHERE id = :id")
        ->execute([":status" => $status, ":id" => $id]);

    $stmt = $pdo->prepare("SELECT * FROM formation_requests WHERE id = :id");
    $stmt->execute([":id" => $id]);
    echo json_encode(["success" => true, "request" => $stmt->fetch(PDO::FETCH_ASSOC)]);

} catch (PDOException $e) {
    echo json_encode(["error" => "Database error", "details" => $e->getMessage()]);
}
?>