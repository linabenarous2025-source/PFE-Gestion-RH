<?php
try {
    $pdo = new PDO("mysql:host=localhost;charset=utf8", "root", "");
    $pdo->exec("USE `gestion-rh`");
    echo "✅ Connexion OK";
} catch(PDOException $e) {
    echo "❌ Erreur: " . $e->getMessage();
}
?>