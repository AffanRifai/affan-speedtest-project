<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Tangani preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Pastikan hanya POST yang diterima
if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit();
}

// Validasi input JSON
$json = file_get_contents("php://input");
if ($json === false) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid request"]);
    exit();
}

$data = json_decode($json, true);
if ($data === null) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON"]);
    exit();
}

// Validasi parameter
$required = ['ping', 'download', 'upload', 'ip', 'isp', 'server'];
foreach ($required as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing field: $field"]);
        exit;
    }
}

// Koneksi database yang lebih aman
$dbConfig = [
    'host' => 'localhost',
    'user' => 'speedtest_user', // Gunakan user khusus, bukan root
    'pass' => 'strong_password', // Gunakan password yang kuat
    'name' => 'speedtest'
];

try {
    $conn = new mysqli($dbConfig['host'], $dbConfig['user'], $dbConfig['pass'], $dbConfig['name']);
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Validasi dan sanitasi input
    $ping = filter_var($data['ping'], FILTER_VALIDATE_FLOAT) !== false ? floatval($data['ping']) : 0;

    $download = filter_var($data['download'], FILTER_VALIDATE_FLOAT) !== false ? floatval($data['download']) : 0;

    $upload = filter_var($data['upload'], FILTER_VALIDATE_FLOAT) !== false ? floatval($data['upload']) : 0;

    $ip = $conn->real_escape_string(substr($data['ip'], 0, 45));
    $isp = $conn->real_escape_string(substr($data['isp'], 0, 255));
    $server = $conn->real_escape_string(substr($data['server'], 0, 255));

    // Prepared statement
    $stmt = $conn->prepare("INSERT INTO hasil (ping, download, upload, ip, isp, server) VALUES (?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("ddssss", $ping, $download, $upload, $ip, $isp, $server);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    $stmt->close();
    $conn->close();

    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>