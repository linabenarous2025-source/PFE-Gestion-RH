<?php
$pdo = new PDO("mysql:host=localhost;charset=utf8", "root", "");
$pdo->exec("USE `gestion-rh`");

// Fix manager password
$hash = password_hash("Admin123", PASSWORD_BCRYPT);
$pdo->prepare("UPDATE users SET password = :p WHERE matricule = 'MGR001'")
    ->execute([":p" => $hash]);

$check = $pdo->prepare("SELECT password FROM users WHERE matricule = 'MGR001'");
$check->execute();
$user = $check->fetch(PDO::FETCH_ASSOC);
echo "Manager: " . (password_verify("Admin123", $user["password"]) ? "✅ OK" : "❌ ECHEC") . "<br>";

// Fix all employees passwords
$defaultPassword = "BT@2025";
$empHash = password_hash($defaultPassword, PASSWORD_BCRYPT);
$pdo->prepare("UPDATE users SET password = :p WHERE role = 'employee'")
    ->execute([":p" => $empHash]);

$check2 = $pdo->prepare("SELECT password FROM users WHERE role = 'employee' LIMIT 1");
$check2->execute();
$emp = $check2->fetch(PDO::FETCH_ASSOC);
echo "Employees: " . (password_verify("BT@2025", $emp["password"]) ? "✅ OK" : "❌ ECHEC") . "<br>";
?>
```

Visit it, should show:
```
Manager: ✅ OK
Employees: ✅ OK