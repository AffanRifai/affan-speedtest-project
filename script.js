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
  document.getElementById("isp").textContent = "🔄 Memuat ISP...";
  document.getElementById("ip").textContent = "🔄 Memuat IP...";
  document.getElementById("server").textContent = "🔄 Memuat server...";

  try {
    const res = await fetch("get_info.php");
    const data = await res.json();

    info.isp = data.isp;
    info.ip = data.client_ip;
    info.server = `${data.server_name} (${data.server_ip}) – ${data.server_location}`;

    document.getElementById("isp").textContent = info.isp;
    document.getElementById("ip").textContent = info.ip;
    document.getElementById("server").textContent = info.server;
  } catch {
    document.getElementById("isp").textContent = "Gagal memuat ISP";
    document.getElementById("ip").textContent = "Gagal memuat IP";
    document.getElementById("server").textContent = "Gagal memuat server";
  }
}

window.onload = function () {
  loadInfo();
  updateHistoryTable();
  updateStats();
};

// Fungsi utama saat tombol GO ditekan
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

// Pengujian Ping
async function runPingTest() {
  let totalPing = 0;
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    await fetch("ping.php?" + Math.random());
    totalPing += performance.now() - start;
  }
  return (totalPing / 3).toFixed(2);
}

// Pengujian Download realtime
async function runDownloadTest() {
  const duration = 10000; // 10 detik
  const startTime = Date.now();
  let totalBytes = 0;

  const fetchChunk = async () => {
    const res = await fetch(`files/dummy_10mb.dat?rand=${Math.random()}`, { cache: "no-store" });
    const blob = await res.blob();
    return blob.size;
  };

  while (Date.now() - startTime < duration) {
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(fetchChunk());
    }
    const sizes = await Promise.all(promises);
    const batchSize = sizes.reduce((a, b) => a + b, 0);
    totalBytes += batchSize;

    const elapsed = (Date.now() - startTime) / 1000;
    const speedMbps = (totalBytes * 8) / (elapsed * 1024 * 1024);
    updateLiveSpeed(speedMbps);
    renderChart(speedMbps);
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const finalSpeed = (totalBytes * 8) / (totalTime * 1024 * 1024);
  return finalSpeed.toFixed(2);
}


// Pengujian Upload realtime
async function runUploadTest() {
  const duration = 10000; // 10 detik
  const startTime = Date.now();
  let totalBytes = 0;
  const data = new Uint8Array(5 * 1024 * 1024); // 5MB

  const uploadChunk = async () => {
    const res = await fetch("upload.php", {
      method: "POST",
      body: data
    });
    return data.length;
  };

  while (Date.now() - startTime < duration) {
    const promises = [];
    for (let i = 0; i < 2; i++) {
      promises.push(uploadChunk());
    }
    const sizes = await Promise.all(promises);
    const batchSize = sizes.reduce((a, b) => a + b, 0);
    totalBytes += batchSize;

    const elapsed = (Date.now() - startTime) / 1000;
    const speedMbps = (totalBytes * 8) / (elapsed * 1024 * 1024);
    updateLiveSpeed(speedMbps);
    renderChart(speedMbps);
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const finalSpeed = (totalBytes * 8) / (totalTime * 1024 * 1024);
  return finalSpeed.toFixed(2);
}


// Render chart speedometer
function renderChart(value) {
  if (chart) chart.destroy();
  const ctx = document.getElementById("chart").getContext("2d");

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [value, 1000 - value],
        backgroundColor: ['#a855f7', '#1e293b'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // penting untuk proporsional
      rotation: -90,
      circumference: 180,
      cutout: '80%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });



}


// Update angka live di luar speedometer
function updateLiveSpeed(speed) {
  liveSpeed.textContent = speed.toFixed(2) + " Mbps";
}

// Simpan ke localStorage
function saveToHistory(result) {
  const history = JSON.parse(localStorage.getItem("speedHistory") || "[]");
  history.push(result);
  localStorage.setItem("speedHistory", JSON.stringify(history));
}

function updateHistoryTable() {
  const history = JSON.parse(localStorage.getItem("speedHistory") || "[]");
  const tbody = document.querySelector("#historyContent tbody");
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
  document.getElementById("statsContent").innerHTML = `
    <p>Rata-rata Ping: ${avg("ping")} ms</p>
    <p>Rata-rata Download: ${avg("download")} Mbps</p>
    <p>Rata-rata Upload: ${avg("upload")} Mbps</p>
  `;
}
