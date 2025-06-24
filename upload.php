<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

// Simpan file upload untuk pengukuran
$input = file_get_contents('php://input');
$size = strlen($input);

if ($size === 0) {
    http_response_code(400);
    echo json_encode(["error" => "No data received"]);
    exit;
}

// Simpan hasil pengukuran
file_put_contents('upload_measurement.txt', $size . "\n", FILE_APPEND);

http_response_code(200);
echo json_encode([
    "status" => "success",
    "bytes_received" => $size
]);
?>