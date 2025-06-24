let chart;

async function startTest() {
  const size = document.getElementById("fileSize").value;
  document.getElementById("download").textContent = "Mengukur download...";
  document.getElementById("upload").textContent = "Mengukur upload...";
  document.getElementById("ping").textContent = "Mengukur ping...";

  // Download
  const dlStart = performance.now();
  await fetch(`files/dummy_${size}mb.dat?` + Math.random());
  const dlEnd = performance.now();
  const dlTime = (dlEnd - dlStart) / 1000;
  const dlSpeed = (size / dlTime).toFixed(2);

  // Upload
  const data = new Uint8Array(size * 1024 * 1024);
  const ulStart = performance.now();
  await fetch("upload.php", {
    method: "POST",
    body: data
  });
  const ulEnd = performance.now();
  const ulTime = (ulEnd - ulStart) / 1000;
  const ulSpeed = (size / ulTime).toFixed(2);

  // Ping
  let totalPing = 0;
  for (let i = 0; i < 5; i++) {
    const pingStart = performance.now();
    await fetch("ping.php?" + Math.random());
    const pingEnd = performance.now();
    totalPing += (pingEnd - pingStart);
  }
  const pingAvg = (totalPing / 5).toFixed(2);

  // Tampilkan hasil
  document.getElementById("download").textContent = `Download: ${dlSpeed} MBps`;
  document.getElementById("upload").textContent = `Upload: ${ulSpeed} MBps`;
  document.getElementById("ping").textContent = `Ping: ${pingAvg} ms`;

  // Simpan hasil ke database (opsional)
  await fetch("save_result.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      download: dlSpeed,
      upload: ulSpeed,
      ping: pingAvg
    })
  });

  // Grafik
  if (chart) chart.destroy();
  const ctx = document.getElementById('speedChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Download', 'Upload', 'Ping'],
      datasets: [{
        label: 'Hasil Tes',
        data: [dlSpeed, ulSpeed, pingAvg],
        backgroundColor: ['#4285F4', '#0F9D58', '#F4B400']
      }]
    }
  });
}
