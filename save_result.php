<?php
header("Content-Type: application/json");

// Ambil JSON dari JS
$data = json_decode(file_get_contents("php://input"), true);

$ping = $data['ping'] ?? 0;
$download = $data['download'] ?? 0;
$upload = $data['upload'] ?? 0;
$ip = $data['ip'] ?? '-';
$isp = $data['isp'] ?? '-';
$server = $data['server'] ?? '-';

// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "speedtest");
if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["error" => "Koneksi database gagal"]);
  exit;
}

// Validasi nilai masuk akal
$ping = is_numeric($ping) && $ping > 0 && $ping < 1000 ? $ping : 0;
$download = is_numeric($download) && $download > 0 && $download < 1000 ? $download : 0;
$upload = is_numeric($upload) && $upload > 0 && $upload < 1000 ? $upload : 0;

// Simpan ke tabel hasil
$stmt = $conn->prepare("INSERT INTO hasil (ping, download, upload, ip, isp, server) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ddssss", $ping, $download, $upload, $ip, $isp, $server);
$stmt->execute();
$stmt->close();
$conn->close();

echo json_encode(["status" => "success"]);
