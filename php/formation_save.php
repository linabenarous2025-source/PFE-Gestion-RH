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

// ── Validation ────────────────────────────────────────────────
$errors = [];
if (empty(trim($data["numero_formation"] ?? ""))) $errors["numero_formation"] = "Le numéro de formation est requis";
if (empty(trim($data["theme"] ?? "")))             $errors["theme"]            = "Le thème est requis";
if (empty(trim($data["description"] ?? "")))       $errors["description"]      = "La description est requise";
if (empty(trim($data["dateDebut"] ?? "")))         $errors["dateDebut"]        = "La date de début est requise";
if (empty(trim($data["dateFin"] ?? "")))           $errors["dateFin"]          = "La date de fin est requise";
if (empty(trim($data["category"] ?? "")))          $errors["category"]         = "La catégorie est requise";
if (empty(trim($data["lieu"] ?? "")))              $errors["lieu"]             = "Le lieu est requis";
if (empty(trim($data["formateur"] ?? "")))         $errors["formateur"]        = "Le formateur est requis";
if (empty(trim($data["modeFormation"] ?? "")))     $errors["modeFormation"]    = "Le mode de formation est requis";

if (!empty($data["dateDebut"]) && !empty($data["dateFin"])) {
    if ($data["dateFin"] < $data["dateDebut"])
        $errors["dateFin"] = "La date de fin doit être après la date de début";
}

if (!empty($errors)) {
    echo json_encode(["success" => false, "errors" => $errors]); exit;
}

$isUpdate = !empty($data["isUpdate"]);
$numero   = trim($data["numero_formation"]);

// Auto-logic montant
$montant     = floatval($data["montant"] ?? 0);
$facture     = $montant == 0 ? "Réglée"  : trim($data["facture"]     ?? "Réglée");
$etatDossier = $montant == 0 ? "Complet" : trim($data["etatDossier"] ?? "Complet");

$participantIds = $data["participantIds"] ?? [];

try {
    if ($isUpdate) {
        // Vérifier doublon numéro sauf pour cette formation
        $check = $pdo->prepare("SELECT numero_formation FROM formations WHERE numero_formation = :nf");
        $check->execute([":nf" => $numero]);
        if (!$check->fetch()) {
            echo json_encode(["success" => false, "errors" => ["numero_formation" => "Formation introuvable"]]); exit;
        }

        $pdo->prepare("UPDATE formations SET
            theme = :theme, description = :description, dateDebut = :dateDebut,
            dateFin = :dateFin, category = :category, status = :status,
            lieu = :lieu, formateur = :formateur, maxParticipants = :maxParticipants,
            modeFormation = :modeFormation, montant = :montant,
            facture = :facture, etatDossier = :etatDossier
            WHERE numero_formation = :nf")
        ->execute([
            ":nf"              => $numero,
            ":theme"           => trim($data["theme"]),
            ":description"     => trim($data["description"]),
            ":dateDebut"       => trim($data["dateDebut"]),
            ":dateFin"         => trim($data["dateFin"]),
            ":category"        => trim($data["category"]),
            ":status"          => trim($data["status"] ?? "Planifiée"),
            ":lieu"            => trim($data["lieu"]),
            ":formateur"       => trim($data["formateur"]),
            ":maxParticipants" => intval($data["maxParticipants"] ?? 20),
            ":modeFormation"   => trim($data["modeFormation"]),
            ":montant"         => $montant,
            ":facture"         => $facture,
            ":etatDossier"     => $etatDossier
        ]);

        // Mettre à jour participants
        $pdo->prepare("DELETE FROM formation_participants WHERE numero_formation = :nf")
            ->execute([":nf" => $numero]);

        foreach ($participantIds as $mat) {
            $pdo->prepare("INSERT IGNORE INTO formation_participants (numero_formation, matricule) VALUES (:nf, :mat)")
                ->execute([":nf" => $numero, ":mat" => $mat]);
        }

    } else {
        // Vérifier doublon numéro
        $check = $pdo->prepare("SELECT numero_formation FROM formations WHERE numero_formation = :nf");
        $check->execute([":nf" => $numero]);
        if ($check->fetch()) {
            echo json_encode(["success" => false, "errors" => ["numero_formation" => "Ce numéro de formation existe déjà"]]); exit;
        }

        $pdo->prepare("INSERT INTO formations
            (numero_formation, theme, description, dateDebut, dateFin, category, status,
             lieu, formateur, maxParticipants, modeFormation, montant, facture, etatDossier)
            VALUES (:nf, :theme, :description, :dateDebut, :dateFin, :category, :status,
             :lieu, :formateur, :maxParticipants, :modeFormation, :montant, :facture, :etatDossier)")
        ->execute([
            ":nf"              => $numero,
            ":theme"           => trim($data["theme"]),
            ":description"     => trim($data["description"]),
            ":dateDebut"       => trim($data["dateDebut"]),
            ":dateFin"         => trim($data["dateFin"]),
            ":category"        => trim($data["category"]),
            ":status"          => trim($data["status"] ?? "Planifiée"),
            ":lieu"            => trim($data["lieu"]),
            ":formateur"       => trim($data["formateur"]),
            ":maxParticipants" => intval($data["maxParticipants"] ?? 20),
            ":modeFormation"   => trim($data["modeFormation"]),
            ":montant"         => $montant,
            ":facture"         => $facture,
            ":etatDossier"     => $etatDossier
        ]);

        foreach ($participantIds as $mat) {
            $pdo->prepare("INSERT IGNORE INTO formation_participants (numero_formation, matricule) VALUES (:nf, :mat)")
                ->execute([":nf" => $numero, ":mat" => $mat]);
        }
    }

    // Retourner la formation complète
    $stmt = $pdo->prepare("SELECT * FROM formations WHERE numero_formation = :nf");
    $stmt->execute([":nf" => $numero]);
    $formation = $stmt->fetch(PDO::FETCH_ASSOC);
    $formation["participantIds"] = $participantIds;

    echo json_encode(["success" => true, "formation" => $formation]);

} catch (PDOException $e) {
    echo json_encode(["error" => "Database error", "details" => $e->getMessage()]);
}
?>
