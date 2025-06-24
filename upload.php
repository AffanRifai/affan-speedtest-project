<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Set timeout dan memory limit
set_time_limit(30);
ignore_user_abort(true);
ini_set('memory_limit', '256M');

// Tangkap data upload
$input = @file_get_contents('php://input');
if ($input === false) {
    http_response_code(400);
    die(json_encode(["error" => "Failed to read input"]));
}

$size = strlen($input);

// Simpan log (opsional)
file_put_contents('upload_log.txt', date('Y-m-d H:i:s')." - ".$size." bytes\n", FILE_APPEND);

http_response_code(200);
echo json_encode([
    "status" => "success",
    "bytes_received" => $size,
    "timestamp" => microtime(true)
]);
?>