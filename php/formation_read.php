<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

require "config.php";
require "jwt.php";

$decoded = JWT::fromRequest();
if (!$decoded) { http_response_code(401); echo json_encode(["error" => "Non autorisé"]); exit; }

try {
    $stmt = $pdo->query("SELECT * FROM formations ORDER BY created_at DESC");
    $formations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($formations as &$f) {
        $ps = $pdo->prepare("SELECT matricule FROM formation_participants WHERE numero_formation = :nf");
        $ps->execute([":nf" => $f["numero_formation"]]);
        $f["participantIds"] = array_column($ps->fetchAll(PDO::FETCH_ASSOC), "matricule");
    }

    echo json_encode(["success" => true, "formations" => $formations]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Database error", "details" => $e->getMessage()]);
}
?>
