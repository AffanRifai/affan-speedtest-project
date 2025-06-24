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

async function runPingTest() {
  let totalPing = 0;
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    await fetch("ping.php?" + Math.random());
    totalPing += performance.now() - start;
  }
  return (totalPing / 3).toFixed(2);
}

async function runDownloadTest() {
  const duration = 10000;
  const startTime = Date.now();
  let totalBytes = 0;

  while (Date.now() - startTime < duration) {
    const urls = Array.from({ length: 4 }, () => `files/dummy_5mb.dat?rand=${Math.random()}`);
    const promises = urls.map(async url => {
      const t0 = performance.now();
      const res = await fetch(url);
      const blob = await res.blob();
      const t1 = performance.now();

      const sizeBytes = blob.size;
      const timeSec = (t1 - t0) / 1000;
      const speedMbps = (sizeBytes * 8) / (timeSec * 1024 * 1024);

      totalBytes += sizeBytes;
      updateLiveSpeed(speedMbps);
      renderChart(speedMbps);
    });

    await Promise.all(promises);
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const finalSpeed = (totalBytes * 8) / (totalTime * 1024 * 1024);
  return finalSpeed.toFixed(2);
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
}

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
      rotation: -90 * (Math.PI / 180),
      circumference: 180 * (Math.PI / 180),
      cutout: '80%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

function updateLiveSpeed(speed) {
  liveSpeed.textContent = speed.toFixed(2) + " Mbps";
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
