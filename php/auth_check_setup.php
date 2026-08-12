<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require "config.php";

try {
    // Check if at least one manager exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'manager'");
    $count = $stmt->fetchColumn();

    echo json_encode([
        "setup"         => true,
        "managerExists" => $count > 0
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Erreur base de données", 
        "details" => $e->getMessage(),
        "code" => $e->getCode()
    ]);
}
?>
