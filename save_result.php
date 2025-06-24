<?php
$data = json_decode(file_get_contents("php://input"), true);
$dl = $data['download'];
$ul = $data['upload'];
$ping = $data['ping'];

// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "speedtest");
if ($conn->connect_error) die("Koneksi gagal");

// Simpan ke database
$stmt = $conn->prepare("INSERT INTO hasil (download, upload, ping, waktu) VALUES (?, ?, ?, NOW())");
$stmt->bind_param("ddd", $dl, $ul, $ping);
$stmt->execute();
$stmt->close();
$conn->close();
echo "OK";
?>
