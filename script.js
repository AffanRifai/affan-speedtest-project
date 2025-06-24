let chart;

const pingSpan = document.getElementById("ping");
const downloadSpan = document.getElementById("download");
const uploadSpan = document.getElementById("upload");
const liveSpeed = document.getElementById("liveSpeed");

let info = {
  isp: "-",
  ip: "-",
  server: "-"
};

// Muat info ISP, IP, dan server terbaik otomatis saat halaman dibuka
async function loadInfo() {
  const elements = {
    isp: document.getElementById("isp"),
    ip: document.getElementById("ip"),
    server: document.getElementById("server")
  };

  // Set loading state
  elements.isp.textContent = "🔄 Memuat ISP...";
  elements.ip.textContent = "🔄 Memuat IP...";
  elements.server.textContent = "🔄 Memuat server...";

  try {
    const res = await fetch("get_info.php");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();

    // Update info object
    info.isp = data.isp || "ISP tidak diketahui";
    info.ip = data.client_ip || "IP tidak diketahui";
    info.server = data.server_name
      ? `${data.server_name} (${data.server_ip}) - ${data.server_location}`
      : "Server tidak diketahui";

    // Update UI
    elements.isp.textContent = info.isp;
    elements.ip.textContent = info.ip;
    elements.server.textContent = info.server;

  } catch (error) {
    console.error("Gagal memuat info:", error);
    elements.isp.textContent = "Gagal memuat ISP";
    elements.ip.textContent = "Gagal memuat IP";
    elements.server.textContent = "Gagal memuat server";

    // Coba gunakan IP dari browser sebagai fallback
    try {
      const ice = await new Promise((resolve, reject) => {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel("");
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
        pc.onicecandidate = ice => {
          if (!ice.candidate) return;
          const ip = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate)?.[1];
          if (ip) {
            pc.onicecandidate = null;
            pc.close();
            resolve(ip);
          }
        };
        setTimeout(() => reject("Timeout"), 1000);
      });
      elements.ip.textContent = ice || "IP tidak terdeteksi";
    } catch (e) {
      elements.ip.textContent = "IP tidak terdeteksi";
    }
  }
}

window.onload = function () {
  loadInfo();
  updateHistoryTable();
  updateStats();
};

async function startTest() {
  document.getElementById("goBtn").style.display = "none";
  document.getElementById("liveSpeed").style.display = "block";
  pingSpan.textContent = downloadSpan.textContent = uploadSpan.textContent = "…";
  renderChart(0);
  liveSpeed.textContent = "0.00 Mbps";

  const ping = await runPingTest();
  pingSpan.textContent = ping;

  const download = await runDownloadTest();
  downloadSpan.textContent = download;
  renderChart(download);

  const upload = await runUploadTest();
  uploadSpan.textContent = upload;

  liveSpeed.textContent = "0.00 Mbps";

  // Set max speed berdasarkan hasil download tertinggi
  const history = JSON.parse(localStorage.getItem("speedHistory") || "[]");
  const maxDownload = history.reduce((max, item) =>
    Math.max(max, parseFloat(item.download)), 100); // Default 100 Mbps
  renderChart(0, maxDownload); // Anda perlu modifikasi renderChart untuk menerima parameter maxSpeed

  const waktu = new Date().toLocaleString();
  const result = { waktu, ping, download, upload };
  saveToHistory(result);
  updateHistoryTable();
  updateStats();

  await fetch("save_result.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ping, download, upload,
      ip: info.ip,
      isp: info.isp,
      server: info.server
    })
  });

  document.getElementById("goBtn").style.display = "block";
}

async function runPingTest() {
  let totalPing = 0;
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    await fetch("ping.php?" + Math.random());
    totalPing += performance.now() - start;
  }
  return (totalPing / 3).toFixed(2);

  // Di fungsi runPingTest, runDownloadTest, dan runUploadTest tambahkan try-catch:

  async function runPingTest() {
    try {
      let totalPing = 0;
      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        const response = await fetch("ping.php?" + Math.random());
        if (!response.ok) throw new Error("Ping test failed");
        totalPing += performance.now() - start;
      }
      return (totalPing / 3).toFixed(2);
    } catch (error) {
      console.error("Ping error:", error);
      return "0"; // Return nilai default jika error
    }
  }
}



async function runDownloadTest() {
  try {
    const duration = 10000; // 10 detik
    const startTime = Date.now();
    let totalBytes = 0;
    let testUrl = `files/dummy_5mb.dat?rand=${Date.now()}`; // Gunakan timestamp untuk cache busting

    // Test koneksi file dummy terlebih dahulu
    const testRes = await fetch(testUrl, { method: 'HEAD' });
    if (!testRes.ok) {
      throw new Error('File dummy tidak ditemukan');
    }

    while (Date.now() - startTime < duration) {
      const t0 = performance.now();
      const res = await fetch(testUrl);
      const blob = await res.blob();
      const t1 = performance.now();

      updateLiveSpeed(speedMbps, 'download');
      renderChart(speedMbps, 'download');

      const sizeBytes = blob.size;
      if (sizeBytes === 0) {
        throw new Error('File dummy kosong');
      }

      const timeSec = (t1 - t0) / 1000;
      const speedMbps = (sizeBytes * 8) / (timeSec * 1024 * 1024);

      totalBytes += sizeBytes;
      updateLiveSpeed(speedMbps);
      renderChart(speedMbps);

      // Buat URL baru untuk menghindari cache
      testUrl = `files/dummy_5mb.dat?rand=${Date.now()}`;
    }

    const totalTime = (Date.now() - startTime) / 1000;
    const finalSpeed = (totalBytes * 8) / (totalTime * 1024 * 1024);
    return finalSpeed.toFixed(2);
  } catch (error) {
    console.error('Download test error:', error);
    return "0.00"; // Return 0 jika error
  }
}

async function runUploadTest() {
  const duration = 10000;
  const startTime = Date.now();
  let totalBytes = 0;
  const data = new Uint8Array(5 * 1024 * 1024);

  while (Date.now() - startTime < duration) {
    const t0 = performance.now();
    await fetch("upload.php", {
      method: "POST",
      body: data
    });

updateLiveSpeed(speedMbps, 'upload');
    renderChart(speedMbps, 'upload');

    const t1 = performance.now();

    const sizeBytes = data.length;
    const timeSec = (t1 - t0) / 1000;
    const speedMbps = (sizeBytes * 8) / (timeSec * 1024 * 1024);

    totalBytes += sizeBytes;
    updateLiveSpeed(speedMbps);
    renderChart(speedMbps);
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const finalSpeed = (totalBytes * 8) / (totalTime * 1024 * 1024);
  return finalSpeed.toFixed(2);

  // Di fungsi runPingTest, runDownloadTest, dan runUploadTest tambahkan try-catch:

  async function runPingTest() {
    try {
      let totalPing = 0;
      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        const response = await fetch("ping.php?" + Math.random());
        if (!response.ok) throw new Error("Ping test failed");
        totalPing += performance.now() - start;
      }
      return (totalPing / 3).toFixed(2);
    } catch (error) {
      console.error("Ping error:", error);
      return "0"; // Return nilai default jika error
    }
  }
}

// Render chart speedometer
// Ganti fungsi renderChart dengan ini:
function renderChart(value, mode) {
  if (chart) {
    // Nonaktifkan animasi saat update nilai
    chart.options.animation = false;
    chart.update();
    chart.destroy();
  }

  const ctx = document.getElementById("chart").getContext("2d");
  const maxSpeed = 100;
  const normalizedValue = Math.min(value, maxSpeed);

  currentMode = mode; // Update mode saat ini

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [normalizedValue, maxSpeed - normalizedValue],
        backgroundColor: [
          mode === 'download' ? '#a855f7' : '#3b82f6', // Ungu untuk download, biru untuk upload
          '#1e293b' // Abu-abu tetap
        ],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      rotation: -90,
      circumference: 180,
      cutout: '80%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1000,
        easing: 'easeOutQuart',
        onComplete: () => {
          // Setel ulang animasi setelah render awal
          chart.options.animation = false;
        }
      }
    }
  });
}

// Update juga fungsi updateLiveSpeed untuk sinkronisasi:
function updateLiveSpeed(speed, mode) {
  const maxSpeed = 100;
  const normalizedSpeed = Math.min(speed, maxSpeed);
  liveSpeed.textContent = normalizedSpeed.toFixed(2) + " Mbps";

  if (chart) {
    // Update warna berdasarkan mode
    chart.data.datasets[0].backgroundColor[0] =
      mode === 'download' ? '#a855f7' : '#3b82f6';

    // Update data tanpa animasi
    chart.data.datasets[0].data = [normalizedSpeed, maxSpeed - normalizedSpeed];
    chart.update();
  }
}

function saveToHistory(result) {
  const history = JSON.parse(localStorage.getItem("speedHistory") || "[]");
  history.push(result);
  localStorage.setItem("speedHistory", JSON.stringify(history));
}

function updateHistoryTable() {
  const history = JSON.parse(localStorage.getItem("speedHistory") || "[]");
  const tbody = document.querySelector("#historyContent tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  history.slice(-10).reverse().forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.waktu}</td><td>${row.ping} ms</td><td>${row.download} Mbps</td><td>${row.upload} Mbps</td>`;
    tbody.appendChild(tr);
  });
}

function updateStats() {
  const history = JSON.parse(localStorage.getItem("speedHistory") || "[]");
  if (history.length === 0) return;

  const avg = (key) => (history.reduce((a, b) => a + parseFloat(b[key]), 0) / history.length).toFixed(2);
  const statsBox = document.getElementById("statsContent");
  if (!statsBox) return;

  statsBox.innerHTML = `
    <p>Rata-rata Ping: ${avg("ping")} ms</p>
    <p>Rata-rata Download: ${avg("download")} Mbps</p>
    <p>Rata-rata Upload: ${avg("upload")} Mbps</p>
  `;
}
