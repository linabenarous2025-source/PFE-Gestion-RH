<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

require "config.php";
require "jwt.php";

$decoded = JWT::fromRequest();
if (!$decoded) {
    http_response_code(401);
    echo json_encode(["error" => "Non autorisé"]);
    exit;
}

$data             = json_decode(file_get_contents("php://input"), true);
$numero_formation = trim($data["numero_formation"] ?? "");
$action           = trim($data["action"] ?? ""); // "enroll" | "unenroll"
$matricule        = $decoded["matricule"]; // Toujours le matricule du token

if (empty($numero_formation) || empty($action)) {
    http_response_code(400);
    echo json_encode(["error" => "Paramètres manquants"]);
    exit;
}

if (!in_array($action, ["enroll", "unenroll"])) {
    http_response_code(400);
    echo json_encode(["error" => "Action invalide"]);
    exit;
}

try {
    // Vérifier que la formation existe
    $chkF = $pdo->prepare("SELECT numero_formation, maxParticipants FROM formations WHERE numero_formation = :nf");
    $chkF->execute([":nf" => $numero_formation]);
    $formation = $chkF->fetch(PDO::FETCH_ASSOC);

    if (!$formation) {
        echo json_encode(["success" => false, "error" => "Formation introuvable"]);
        exit;
    }

    if ($action === "enroll") {
        // Vérifier capacité
        $capStmt = $pdo->prepare("SELECT COUNT(*) as current FROM formation_participants WHERE numero_formation = :nf");
        $capStmt->execute([":nf" => $numero_formation]);
        $cap = $capStmt->fetch(PDO::FETCH_ASSOC);

        if ($cap["current"] >= $formation["maxParticipants"]) {
            echo json_encode(["success" => false, "error" => "Capacité maximale atteinte"]);
            exit;
        }

        $pdo->prepare("
            INSERT IGNORE INTO formation_participants (numero_formation, matricule)
            VALUES (:nf, :m)
        ")->execute([":nf" => $numero_formation, ":m" => $matricule]);

        echo json_encode(["success" => true, "action" => "enrolled"]);

    } else {
        $pdo->prepare("
            DELETE FROM formation_participants
            WHERE numero_formation = :nf AND matricule = :m
        ")->execute([":nf" => $numero_formation, ":m" => $matricule]);

        echo json_encode(["success" => true, "action" => "unenrolled"]);
    }

} catch (PDOException $e) {
    echo json_encode(["error" => "Database error", "details" => $e->getMessage()]);
}
?>