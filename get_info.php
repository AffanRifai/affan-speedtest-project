<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Izinkan CORS

function getClientIP() {
    $ip = $_SERVER['HTTP_CLIENT_IP'] ?? 
          $_SERVER['HTTP_X_FORWARDED_FOR'] ?? 
          $_SERVER['REMOTE_ADDR'] ?? 
          'IP tidak diketahui';
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'IP tidak diketahui';
}

function getFallbackInfo() {
    return [
        'client_ip' => getClientIP(),
        'isp' => 'ISP tidak diketahui',
        'server_name' => 'Server Lokal',
        'server_location' => 'Lokasi tidak diketahui',
        'server_ip' => @gethostbyname(gethostname()) ?: 'IP server tidak diketahui'
    ];
}

try {
    // Coba dapatkan info dari API eksternal dengan timeout 2 detik
    $ctx = stream_context_create(['http' => ['timeout' => 2]]);
    $ipData = @file_get_contents("https://ipinfo.io/json", false, $ctx);
    
    if ($ipData === false) {
        throw new Exception("Tidak bisa mengakses ipinfo.io");
    }

    $data = json_decode($ipData, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Data IP tidak valid");
    }

    $response = [
        'client_ip' => $data['ip'] ?? getClientIP(),
        'isp' => $data['org'] ?? 'ISP tidak diketahui',
        'server_name' => 'PLB Net',
        'server_location' => 'Tangerang',
        'server_ip' => gethostbyname(gethostname())
    ];

    echo json_encode($response);
} catch (Exception $e) {
    // Jika semua gagal, kembalikan data fallback
    echo json_encode(getFallbackInfo());
}
?>