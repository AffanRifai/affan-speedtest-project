<?php
header('Content-Type: application/json');

// IP server (IPv4)
$server_ip = gethostbyname(gethostname());

// Lokasi dan nama server bisa kamu atur manual (kalau belum pakai GeoIP)
$server_location = "Bandung, Indonesia";
$server_name = "Server Lokal";

// Data JSON ke browser
echo json_encode([
  "server_ip" => $server_ip,
  "server_name" => $server_name,
  "location" => $server_location
]);
?>
