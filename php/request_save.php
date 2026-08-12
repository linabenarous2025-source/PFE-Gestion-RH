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

$data      = json_decode(file_get_contents("php://input"), true);
$isUpdate  = !empty($data["id"]);
$matricule = $decoded["matricule"];

$errors = [];
if (empty(trim($data["title"] ?? "")))         $errors["title"]         = "Le titre est requis";
if (empty(trim($data["description"] ?? "")))   $errors["description"]   = "La description est requise";
if (empty(trim($data["justification"] ?? ""))) $errors["justification"] = "La justification est requise";
if (empty(trim($data["category"] ?? "")))      $errors["category"]      = "La catégorie est requise";

if (!empty($errors)) {
    echo json_encode(["success" => false, "errors" => $errors]);
    exit;
}

try {
    if ($isUpdate) {
        $check = $pdo->prepare("SELECT id, status FROM formation_requests WHERE id = :id AND matricule = :matricule");
        $check->execute([":id" => $data["id"], ":matricule" => $matricule]);
        $req = $check->fetch(PDO::FETCH_ASSOC);

        if (!$req) { echo json_encode(["success" => false, "error" => "Demande introuvable"]); exit; }
        if ($req["status"] !== "En attente") { echo json_encode(["success" => false, "error" => "Impossible de modifier une demande déjà traitée"]); exit; }

        $pdo->prepare("
            UPDATE formation_requests SET
                title         = :title,
                description   = :description,
                category      = :category,
                justification = :justification
            WHERE id = :id AND matricule = :matricule
        ")->execute([
            ":title"         => trim($data["title"]),
            ":description"   => trim($data["description"]),
            ":category"      => trim($data["category"]),
            ":justification" => trim($data["justification"]),
            ":id"            => $data["id"],
            ":matricule"     => $matricule,
        ]);

        $stmt = $pdo->prepare("SELECT * FROM formation_requests WHERE id = :id");
        $stmt->execute([":id" => $data["id"]]);
        echo json_encode(["success" => true, "request" => $stmt->fetch(PDO::FETCH_ASSOC)]);

    } else {
        $pdo->prepare("
            INSERT INTO formation_requests (matricule, title, description, category, justification, status, dateRequest)
            VALUES (:matricule, :title, :description, :category, :justification, 'En attente', NOW())
        ")->execute([
            ":matricule"     => $matricule,
            ":title"         => trim($data["title"]),
            ":description"   => trim($data["description"]),
            ":category"      => trim($data["category"]),
            ":justification" => trim($data["justification"]),
        ]);

        $id = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM formation_requests WHERE id = :id");
        $stmt->execute([":id" => $id]);
        echo json_encode(["success" => true, "request" => $stmt->fetch(PDO::FETCH_ASSOC)]);
    }

} catch (PDOException $e) {
    echo json_encode(["error" => "Database error", "details" => $e->getMessage()]);
}
?>