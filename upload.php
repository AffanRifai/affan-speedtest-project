<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Tangani preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Pastikan hanya menerima POST
if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit();
}

// Baca input
$data = file_get_contents('php://input');
$size = strlen($data);

// Simpan hasil (untuk debugging)
file_put_contents('upload_debug.log', date('Y-m-d H:i:s')." - ".$size." bytes\n", FILE_APPEND);

http_response_code(200);
echo json_encode([
    'status' => 'success',
    'bytes_received' => $size,
    'timestamp' => microtime(true)
]);
?>