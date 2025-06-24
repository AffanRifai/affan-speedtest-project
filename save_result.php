<?php
header("Content-Type: application/json");

// Ambil JSON dari JS
$data = json_decode(file_get_contents("php://input"), true);

$ping = $data['ping'];
$download = $data['download'];
$upload = $data['upload'];
$ip = $data['ip'];
$isp = $data['isp'];

// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "speedtest"); // ganti user/password sesuai XAMPP kamu
if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["error" => "Koneksi gagal"]);
  exit;
}

// Simpan data ke tabel hasil
$stmt = $conn->prepare("INSERT INTO hasil (ping, download, upload, ip, isp) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("ddsss", $ping, $download, $upload, $ip, $isp);
$stmt->execute();
$stmt->close();
$conn->close();

echo json_encode(["status" => "success"]);
?>
