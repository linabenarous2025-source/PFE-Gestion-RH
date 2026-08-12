<?php
// HEADERS CORS 
// Autorise les requêtes depuis le frontend React (Vite dev server)
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");          // Méthodes HTTP acceptées
header("Access-Control-Allow-Headers: Content-Type, Authorization"); // Headers autorisés
header("Content-Type: application/json");                       // Réponse toujours en JSON

// Gestion des requêtes préliminaires CORS (preflight)
// Le navigateur envoie d'abord OPTIONS avant la vraie requête POST
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

require "config.php"; // Connexion PDO à la base de données ($pdo)
require "jwt.php";    // Classe utilitaire pour gérer les tokens JWT


// ÉTAPE 1 — Authentification : vérifier le token JWT

// JWT::fromRequest() lit le header "Authorization: Bearer <token>"
// et retourne le payload décodé (ex: ["matricule" => "EMP001"])
// Si le token est absent, expiré ou invalide → retourne false
$decoded = JWT::fromRequest();
if (!$decoded) {
    http_response_code(401); // 401 Unauthorized
    echo json_encode(["error" => "Non autorisé"]);
    exit;
}


// ÉTAPE 2 — Récupération des données envoyées en POST (JSON)

$data            = json_decode(file_get_contents("php://input"), true);
$currentPassword = trim($data["currentPassword"] ?? ""); // Mot de passe actuel
$newPassword     = trim($data["newPassword"]     ?? ""); // Nouveau mot de passe
$confirmPassword = trim($data["confirmPassword"] ?? ""); // Confirmation du nouveau


// ÉTAPE 3 — Validation des champs

if (empty($currentPassword)) {
    http_response_code(400); // 400 Bad Request
    echo json_encode(["error" => "Le mot de passe actuel est requis"]);
    exit;
}
if (empty($newPassword)) {
    http_response_code(400);
    echo json_encode(["error" => "Le nouveau mot de passe est requis"]);
    exit;
}
if (strlen($newPassword) < 6) {
    // Longueur minimale de sécurité
    http_response_code(400);
    echo json_encode(["error" => "Minimum 6 caractères"]);
    exit;
}
if ($newPassword !== $confirmPassword) {
    // Les deux saisies du nouveau mot de passe doivent être identiques
    http_response_code(400);
    echo json_encode(["error" => "Les mots de passe ne correspondent pas"]);
    exit;
}
if ($currentPassword === $newPassword) {
    // Inutile de "changer" pour le même mot de passe
    http_response_code(400);
    echo json_encode(["error" => "Le nouveau mot de passe doit être différent"]);
    exit;
}

// ============================================================
// ÉTAPE 4 à 6 — Opérations en base de données
// ============================================================
try {
    // ÉTAPE 4 — Récupérer l'utilisateur depuis son matricule (extrait du JWT)
    // On utilise une requête préparée pour éviter les injections SQL
    $stmt = $pdo->prepare("SELECT id, password FROM users WHERE matricule = :matricule");
    $stmt->execute([":matricule" => $decoded["matricule"]]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC); // Résultat sous forme de tableau associatif

    if (!$user) {
        // Cas rare : le token est valide mais l'utilisateur n'existe plus en BDD
        http_response_code(404);
        echo json_encode(["error" => "Utilisateur introuvable"]);
        exit;
    }

    // ÉTAPE 5 — Vérifier que l'ancien mot de passe est correct
    // password_verify() compare le texte brut avec le hash bcrypt stocké en BDD
    if (!password_verify($currentPassword, $user["password"])) {
        http_response_code(401);
        echo json_encode(["error" => "Mot de passe actuel incorrect"]);
        exit;
    }

    // ÉTAPE 6 — Hasher le nouveau mot de passe et mettre à jour la BDD
    $hashed = password_hash($newPassword, PASSWORD_BCRYPT); // Hash sécurisé avec bcrypt

    // On remet aussi default_password à 0 :
    // Cela indique que l'utilisateur a personnalisé son mot de passe
    // (utile si un mot de passe temporaire avait été attribué à la création du compte)
    $pdo->prepare("
        UPDATE users 
        SET password = :password, default_password = 0 
        WHERE id = :id
    ")->execute([
        ":password" => $hashed,
        ":id"       => $user["id"]
    ]);

    // Succès — réponse 200 implicite
    echo json_encode([
        "success" => true,
        "message" => "Mot de passe modifié avec succès"
    ]);

} catch (PDOException $e) {
    // Erreur inattendue côté base de données
    http_response_code(500); // 500 Internal Server Error
    echo json_encode(["error" => "Erreur base de données", "details" => $e->getMessage()]);
    // ⚠️ En production, masquer $e->getMessage() pour ne pas exposer la structure interne
}
?>