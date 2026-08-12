<?php
// config.example.php
// Copy this file to config.php and fill in your real values.
// config.php should NOT be committed to git.

define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', '3306');

// Example connection using PDO
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}