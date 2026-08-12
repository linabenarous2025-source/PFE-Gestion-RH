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
$isUpdate = !empty($data["isUpdate"]);

// Employé peut seulement modifier son propre profil
if ($decoded["role"] !== "manager") {
    if (!$isUpdate || $decoded["matricule"] !== trim($data["matricule"] ?? "")) {
        http_response_code(403);
        echo json_encode(["error" => "Accès refusé"]);
        exit;
    }
}

/* ───── Validation ───── */
$errors = [];

if (empty(trim($data["matricule"] ?? "")))
    $errors["matricule"] = "Le matricule est requis";

if (empty(trim($data["firstName"] ?? "")))
    $errors["firstName"] = "Le prénom est requis";

if (empty(trim($data["lastName"] ?? "")))
    $errors["lastName"] = "Le nom est requis";

if (empty(trim($data["cin"] ?? "")))
    $errors["cin"] = "Le CIN est requis";
elseif (!preg_match('/^[0-9]{8}$/', trim($data["cin"] ?? "")))
    $errors["cin"] = "Le CIN doit contenir 8 chiffres";

if (empty(trim($data["email"] ?? "")))
    $errors["email"] = "L'email est requis";
elseif (!filter_var(trim($data["email"]), FILTER_VALIDATE_EMAIL))
    $errors["email"] = "Email invalide";

if (empty(trim($data["phone"] ?? "")))
    $errors["phone"] = "Le téléphone est requis";
elseif (!preg_match('/^[0-9]{8}$/', trim($data["phone"] ?? "")))
    $errors["phone"] = "Le téléphone doit contenir 8 chiffres";

if (empty(trim($data["department"] ?? "")))
    $errors["department"] = "Le département est requis";

if (empty(trim($data["poste"] ?? "")))
    $errors["poste"] = "Le poste est requis";

if (empty(trim($data["dateEmbauche"] ?? "")))
    $errors["dateEmbauche"] = "La date d'embauche est requise";

if (empty(trim($data["genre"] ?? "")))
    $errors["genre"] = "Le genre est requis";

/* ⭐ Nouveau champ */
if (empty(trim($data["affectation"] ?? "")))
    $errors["affectation"] = "L'affectation est requise";

if (!empty($errors)) {
    echo json_encode(["success" => false, "errors" => $errors]);
    exit;
}

$isUpdate = !empty($data["isUpdate"]);
$matricule = trim($data["matricule"]);

try {

    /* ================= UPDATE ================= */
    if ($isUpdate) {

        $check = $pdo->prepare("
            SELECT matricule FROM employees 
            WHERE email = :email AND matricule != :matricule
        ");
        $check->execute([
            ":email" => trim($data["email"]),
            ":matricule" => $matricule
        ]);

        if ($check->fetch()) {
            echo json_encode([
                "success" => false,
                "errors" => ["email" => "Email déjà utilisé"]
            ]);
            exit;
        }

        $pdo->prepare("
            UPDATE employees SET
                firstName = :firstName,
                lastName = :lastName,
                cin = :cin,
                department = :department,
                poste = :poste,
                email = :email,
                phone = :phone,
                dateEmbauche = :dateEmbauche,
                genre = :genre,
                affectation = :affectation
            WHERE matricule = :matricule
        ")->execute([
            ":matricule" => $matricule,
            ":firstName" => trim($data["firstName"]),
            ":lastName" => trim($data["lastName"]),
            ":cin" => trim($data["cin"]),
            ":department" => trim($data["department"]),
            ":poste" => trim($data["poste"]),
            ":email" => trim($data["email"]),
            ":phone" => trim($data["phone"]),
            ":dateEmbauche" => trim($data["dateEmbauche"]),
            ":genre" => trim($data["genre"]),
            ":affectation" => trim($data["affectation"])
        ]);

        $employee = $data;
        $employee["photoUrl"] =
            "https://ui-avatars.com/api/?name="
            . urlencode($data["firstName"]) . "+"
            . urlencode($data["lastName"])
            . "&background=1D4ED8&color=fff&size=128";

        echo json_encode([
            "success" => true,
            "employee" => $employee,
            "created" => false
        ]);
    }

    /* ================= INSERT ================= */
    else {

        $checks = [
            ["SELECT matricule FROM employees WHERE matricule = :v", [":v" => $matricule], "matricule", "Ce matricule existe déjà"],
            ["SELECT matricule FROM employees WHERE cin = :v", [":v" => trim($data["cin"])], "cin", "Ce CIN existe déjà"],
            ["SELECT matricule FROM employees WHERE email = :v", [":v" => trim($data["email"])], "email", "Cet email existe déjà"],
        ];

        foreach ($checks as [$sql, $params, $field, $msg]) {
            $s = $pdo->prepare($sql);
            $s->execute($params);

            if ($s->fetch()) {
                echo json_encode([
                    "success" => false,
                    "errors" => [$field => $msg]
                ]);
                exit;
            }
        }

        $pdo->prepare("
            INSERT INTO employees
            (matricule, firstName, lastName, cin, department, poste,
             email, phone, dateEmbauche, genre, affectation)
            VALUES
            (:matricule, :firstName, :lastName, :cin, :department, :poste,
             :email, :phone, :dateEmbauche, :genre, :affectation)
        ")->execute([
            ":matricule" => $matricule,
            ":firstName" => trim($data["firstName"]),
            ":lastName" => trim($data["lastName"]),
            ":cin" => trim($data["cin"]),
            ":department" => trim($data["department"]),
            ":poste" => trim($data["poste"]),
            ":email" => trim($data["email"]),
            ":phone" => trim($data["phone"]),
            ":dateEmbauche" => trim($data["dateEmbauche"]),
            ":genre" => trim($data["genre"]),
            ":affectation" => trim($data["affectation"])
        ]);

    /* Create user account automatically */
            try {
                $checkUser = $pdo->prepare("SELECT id FROM users WHERE email = :email OR matricule = :matricule");
                $checkUser->execute([
                    ":email" => trim($data["email"]),
                    ":matricule" => $matricule
                ]);

                $userCreated = false;

                if (!$checkUser->fetch()) {
                    $defaultPwd = "BT@2025";
                    $hashedPwd  = password_hash($defaultPwd, PASSWORD_BCRYPT);

                    $pdo->prepare("
                        INSERT INTO users
                        (email, password, default_password, role, matricule)
                        VALUES (:email, :password, :default_password, 'employee', :matricule)
                    ")->execute([
                        ":email"            => trim($data["email"]),
                        ":password"         => $hashedPwd,
                        ":default_password" => $defaultPwd,
                        ":matricule"        => $matricule,
                    ]);
                    $userCreated = true;
                }
            } catch (PDOException $e) {
                // User creation failed but employee was saved — don't block the response
                error_log("User creation failed for matricule $matricule: " . $e->getMessage());
                $userCreated = false;
            }

            $employee = array_merge($data, [
                "matricule" => $matricule,
                "photoUrl" =>
                    "https://ui-avatars.com/api/?name="
                    . urlencode($data["firstName"]) . "+"
                    . urlencode($data["lastName"])
                    . "&background=1D4ED8&color=fff&size=128"
            ]);

            echo json_encode([
                "success" => true,
                "employee" => $employee,
                "created" => true,
                "userCreated" => $userCreated
            ]);
        }

    } catch (PDOException $e) {
        echo json_encode([
            "success" => false,
            "error" => $e->getMessage()  // ← expose real error instead of generic message
        ]);
    }
    ?>