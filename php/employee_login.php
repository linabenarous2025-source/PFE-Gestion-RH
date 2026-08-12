<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require "config.php";


$matricule = isset($_GET["matricule"]) ? trim($_GET["matricule"]) : "";

if (empty($matricule)) {
    echo json_encode(["error" => "Matricule required"]);
    exit;
}

try {
    // requête avec matricule
    $stmt = $pdo->prepare("SELECT * FROM employees WHERE matricule = :matricule LIMIT 1");
    $stmt->execute([":matricule" => $matricule]);
    $employee = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$employee) {
        echo json_encode(["success" => false]);
    } else {
        $employee["photoUrl"] = "https://ui-avatars.com/api/?name=" .
            urlencode($employee["firstName"]) . "+" .
            urlencode($employee["lastName"]) .
            "&background=1D4ED8&color=fff&size=128";

        echo json_encode([
            "success" => true,
            "employee" => $employee
        ]);
    }

} catch (PDOException $e) {
    echo json_encode([
        "error" => "Database error",
        "details" => $e->getMessage()
    ]);
}
?>