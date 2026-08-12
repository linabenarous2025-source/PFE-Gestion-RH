<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

try {
    $pdo = new PDO("mysql:host=localhost;charset=utf8", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("USE `gestion-rh`");
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur base de données", "details" => $e->getMessage()]);
    exit;
}

require "jwt.php";

$data      = json_decode(file_get_contents("php://input"), true);
$matricule = trim($data["matricule"] ?? "");
$password  = trim($data["password"]  ?? "");

if (empty($matricule)) {
    http_response_code(400);
    echo json_encode(["error" => "Le matricule est requis"]);
    exit;
}
if (empty($password)) {
    http_response_code(400);
    echo json_encode(["error" => "Le mot de passe est requis"]);
    exit;
}
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(["error" => "Mot de passe trop court"]);
    exit;
}

try {
    // Fetch user from users table
    $stmt = $pdo->prepare("
        SELECT u.id, u.matricule, u.password, u.role, u.default_password,
               e.firstName, e.lastName, e.department, e.poste,
               e.phone, e.cin, e.dateEmbauche, e.genre, e.email
        FROM users u
        LEFT JOIN employees e ON u.matricule = e.matricule
        WHERE u.matricule = :matricule
        LIMIT 1
    ");
    $stmt->execute([":matricule" => $matricule]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // ── FIRST LOGIN: auto-register employee ──────────────────────────────────
    if (!$user) {
        // Check if matricule exists in employees table
        $checkEmp = $pdo->prepare("
            SELECT matricule FROM employees
            WHERE matricule = :matricule
            LIMIT 1
        ");
        $checkEmp->execute([":matricule" => $matricule]);
        $employee = $checkEmp->fetch(PDO::FETCH_ASSOC);

        if ($employee && $password === "BT@2025") {
            // Insert into users with hashed default password
            $hashedPwd = password_hash("BT@2025", PASSWORD_DEFAULT);
            $insert = $pdo->prepare("
                INSERT INTO users (matricule, password, role, default_password)
                VALUES (:matricule, :password, 'employee', 1)
            ");
            $insert->execute([
                ":matricule" => $matricule,
                ":password"  => $hashedPwd
            ]);

            // Re-fetch the full user with employee info
            $stmt->execute([":matricule" => $matricule]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            // Matricule not in employees table OR wrong password
            http_response_code(401);
            echo json_encode(["error" => "Matricule ou mot de passe incorrect"]);
            exit;
        }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Normal password check (for existing users)
    if (!password_verify($password, $user["password"])) {
        http_response_code(401);
        echo json_encode(["error" => "Matricule ou mot de passe incorrect"]);
        exit;
    }

    // Generate JWT token
    $token = JWT::encode([
        "id"        => $user["id"],
        "email"     => $user["email"]     ?? "",
        "role"      => $user["role"],
        "matricule" => $user["matricule"],
        "exp"       => time() + 86400
    ]);

    // Base response
    $response = [
        "success"          => true,
        "token"            => $token,
        "role"             => $user["role"],
        "default_password" => !empty($user["default_password"])
    ];

    // Employee-specific data
    if ($user["role"] === "employee") {
        $firstName = $user["firstName"] ?? "Employé";
        $lastName  = $user["lastName"]  ?? $user["matricule"];

        $response["employee"] = [
            "matricule"    => $user["matricule"],
            "email"        => $user["email"]        ?? "",
            "firstName"    => $firstName,
            "lastName"     => $lastName,
            "department"   => $user["department"]   ?? "",
            "poste"        => $user["poste"]        ?? "",
            "phone"        => $user["phone"]        ?? "",
            "cin"          => $user["cin"]          ?? "",
            "dateEmbauche" => $user["dateEmbauche"] ?? "",
            "genre"        => $user["genre"]        ?? "",
            "photoUrl"     => "https://ui-avatars.com/api/?name="
                . urlencode($firstName) . "+" . urlencode($lastName)
                . "&background=1D4ED8&color=fff&size=128"
        ];
    }

    // Manager-specific data
    if ($user["role"] === "manager") {
        $response["manager"] = [
            "matricule" => $user["matricule"],
            "email"     => $user["email"] ?? "",
        ];
    }

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur base de données", "details" => $e->getMessage()]);
}
?>