<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

require "config.php";
require "jwt.php";

$decoded = JWT::fromRequest();
if (!$decoded) { http_response_code(401); echo json_encode(["error" => "Non autorisé"]); exit; }

$data      = json_decode(file_get_contents("php://input"), true);
$id        = intval($data["id"] ?? 0);
$matricule = $decoded["matricule"];

if (!$id) { echo json_encode(["error" => "ID requis"]); exit; }

try {
    $check = $pdo->prepare("SELECT id, status FROM formation_requests WHERE id = :id AND matricule = :matricule");
    $check->execute([":id" => $id, ":matricule" => $matricule]);
    $req = $check->fetch(PDO::FETCH_ASSOC);

    if (!$req) { echo json_encode(["success" => false, "error" => "Demande introuvable"]); exit; }
    if ($req["status"] !== "En attente") { echo json_encode(["success" => false, "error" => "Impossible de supprimer une demande déjà traitée"]); exit; }

    $pdo->prepare("DELETE FROM formation_requests WHERE id = :id AND matricule = :matricule")
        ->execute([":id" => $id, ":matricule" => $matricule]);

    echo json_encode(["success" => true]);

} catch (PDOException $e) {
    echo json_encode(["error" => "Database error", "details" => $e->getMessage()]);
}
?>