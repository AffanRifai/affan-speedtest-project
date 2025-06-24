<?php
header('Content-Type: application/json');

// Ambil IP public & info ISP dari API eksternal
$ipData = json_decode(file_get_contents("https://ipinfo.io/json"), true);

$response = [
  'client_ip' => $ipData['ip'] ?? 'IP tidak diketahui',
  'isp' => $ipData['org'] ?? 'ISP tidak diketahui',
  'server_name' => 'PLB Net',
  'server_location' => 'Tangerang',
  'server_ip' => gethostbyname(gethostname()) // IP lokal server ini
];

echo json_encode($response);
?>
