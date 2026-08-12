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
    $stmt = $pdo->query("SELECT * FROM formation_requests ORDER BY dateRequest DESC");
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "requests" => $requests]);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>