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

$data = json_decode(file_get_contents("php://input"), true);

$numero_formation = trim($data["numero_formation"] ?? "");
$action           = trim($data["action"] ?? "");       // "enroll" | "unenroll"
$matricule        = trim($data["matricule"] ?? "");

// ── Validation ──────────────────────────────────────────────
if (!$numero_formation || !$action || !$matricule) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Paramètres manquants"]);
    exit;
}

if (!in_array($action, ["enroll", "unenroll"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Action invalide"]);
    exit;
}

try {
    // Vérifier que la formation existe
    $chkF = $pdo->prepare("SELECT numero_formation FROM formations WHERE numero_formation = :nf");
    $chkF->execute([":nf" => $numero_formation]);
    if (!$chkF->fetch()) {
        echo json_encode(["success" => false, "error" => "Formation introuvable"]);
        exit;
    }

    // Vérifier que l'employé existe
    $chkE = $pdo->prepare("SELECT matricule FROM employees WHERE matricule = :m");
    $chkE->execute([":m" => $matricule]);
    if (!$chkE->fetch()) {
        echo json_encode(["success" => false, "error" => "Employé introuvable"]);
        exit;
    }

    if ($action === "enroll") {
        // Vérifier la capacité max
        $capStmt = $pdo->prepare("
            SELECT f.maxParticipants,
                   COUNT(fp.id) AS current
            FROM formations f
            LEFT JOIN formation_participants fp ON fp.numero_formation = f.numero_formation
            WHERE f.numero_formation = :nf
            GROUP BY f.numero_formation
        ");
        $capStmt->execute([":nf" => $numero_formation]);
        $cap = $capStmt->fetch(PDO::FETCH_ASSOC);

        if ($cap && $cap["current"] >= $cap["maxParticipants"]) {
            echo json_encode(["success" => false, "error" => "Capacité maximale atteinte"]);
            exit;
        }

        // INSERT IGNORE évite l'erreur si déjà inscrit
        $pdo->prepare("
            INSERT IGNORE INTO formation_participants (numero_formation, matricule)
            VALUES (:nf, :m)
        ")->execute([":nf" => $numero_formation, ":m" => $matricule]);

        echo json_encode(["success" => true, "action" => "enrolled"]);

    } else {
        // unenroll
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