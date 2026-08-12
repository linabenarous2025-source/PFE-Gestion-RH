<?php
require "config.php";

$matricule = "MGR001";
$password  = password_hash("Admin123", PASSWORD_BCRYPT);

// Check if user exists
$check = $pdo->prepare("SELECT COUNT(*) FROM users WHERE matricule = :matricule");
$check->execute([":matricule" => $matricule]);

if ($check->fetchColumn() > 0) {
    echo "⚠️ Manager already exists";
    exit;
}

// Insert
$stmt = $pdo->prepare("
    INSERT INTO users (matricule, password, role)
    VALUES (:matricule, :password, 'manager')
");

$stmt->execute([
    ":matricule" => $matricule,
    ":password"  => $password
]);

echo "✅ Manager créé ! Matricule: $matricule | Password: Admin123";
?>