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

$search = trim($_GET["search"] ?? "");
$filter = trim($_GET["filter"] ?? "all");

try {
    if (empty($search)) {
        $stmt = $pdo->query("SELECT * FROM employees ORDER BY created_at DESC");
    } else {
        $like = "%$search%";
        switch ($filter) {
            case "matricule":
                $stmt = $pdo->prepare("SELECT * FROM employees WHERE matricule LIKE :s ORDER BY created_at DESC");
                $stmt->execute([":s" => $like]); break;
            case "cin":
                $stmt = $pdo->prepare("SELECT * FROM employees WHERE cin LIKE :s ORDER BY created_at DESC");
                $stmt->execute([":s" => $like]); break;
            case "departement":
                $stmt = $pdo->prepare("SELECT * FROM employees WHERE department LIKE :s ORDER BY created_at DESC");
                $stmt->execute([":s" => $like]); break;
            case "poste":
                $stmt = $pdo->prepare("SELECT * FROM employees WHERE poste LIKE :s ORDER BY created_at DESC");
                $stmt->execute([":s" => $like]); break;
            default:
                $stmt = $pdo->prepare("SELECT * FROM employees WHERE
                    matricule LIKE :s OR cin LIKE :s OR department LIKE :s OR
                    poste LIKE :s OR firstName LIKE :s OR lastName LIKE :s
                    ORDER BY created_at DESC");
                $stmt->execute([":s" => $like]);
        }
    }

    $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($employees as &$emp) {
        $emp["photoUrl"] = "https://ui-avatars.com/api/?name="
            . urlencode($emp["firstName"]) . "+" . urlencode($emp["lastName"])
            . "&background=1D4ED8&color=fff&size=128";
    }

    echo json_encode(["success" => true, "employees" => $employees]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Database error", "details" => $e->getMessage()]);
}
?>
