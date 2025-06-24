<?php
header("Content-Type: text/plain");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");
echo "pong_" . microtime(true); // Tambahkan timestamp untuk validasi
?>