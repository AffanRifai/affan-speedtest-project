<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Set konfigurasi server
set_time_limit(0); // No timeout
ignore_user_abort(true);
ini_set('memory_limit', '256M');
ini_set('post_max_size', '100M');
ini_set('upload_max_filesize', '100M');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start measurement
$startTime = microtime(true);
$bytesReceived = 0;

// Baca input streaming
$input = fopen('php://input', 'rb');
$tempFile = tempnam(sys_get_temp_dir(), 'upload_');
$output = fopen($tempFile, 'wb');

if (!$input || !$output) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to open streams']);
    exit();
}

while (!feof($input)) {
    $bytesReceived += fwrite($output, fread($input, 8192));
}

fclose($input);
fclose($output);
unlink($tempFile); // Hapus file temp

// Response
$duration = microtime(true) - $startTime;
$speedMbps = ($bytesReceived * 8) / ($duration * 1024 * 1024);

http_response_code(200);
echo json_encode([
    'status' => 'success',
    'bytes_received' => $bytesReceived,
    'duration_seconds' => round($duration, 3),
    'speed_mbps' => round($speedMbps, 2)
]);
?>