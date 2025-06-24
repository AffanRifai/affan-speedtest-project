<?php
header("Content-Type: text/plain");

// Validasi request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die("Method not allowed");
}

// Dapatkan ukuran upload
$contentLength = (int)$_SERVER['CONTENT_LENGTH'];
$maxSize = 10 * 1024 * 1024; // 10MB max

if ($contentLength > $maxSize) {
    http_response_code(413);
    die("File too large");
}

// Baca input (kita tidak menyimpan, hanya mengukur)
$data = file_get_contents('php://input');
if ($data === false) {
    http_response_code(400);
    die("Error reading upload data");
}

http_response_code(200);
echo "Upload received: " . strlen($data) . " bytes";
?>