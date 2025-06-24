async function startTest() {
  document.getElementById("download").textContent = "Mengukur download...";
  document.getElementById("upload").textContent = "Mengukur upload...";
  document.getElementById("ping").textContent = "Mengukur ping...";

  // Download Test
  const startDL = performance.now();
  await fetch("files/dummy_10mb.dat?" + Math.random()); // cache buster
  const endDL = performance.now();
  const dlTime = (endDL - startDL) / 1000; // detik
  const dlSpeed = (10 / dlTime).toFixed(2); // 10 MB / detik = Mbps
  document.getElementById("download").textContent = `Download: ${dlSpeed} MBps`;

  // Upload Test
  const data = new Uint8Array(5 * 1024 * 1024); // 5MB
  const startUL = performance.now();
  await fetch("upload.php", {
    method: "POST",
    body: data
  });
  const endUL = performance.now();
  const ulTime = (endUL - startUL) / 1000;
  const ulSpeed = (5 / ulTime).toFixed(2);
  document.getElementById("upload").textContent = `Upload: ${ulSpeed} MBps`;

  // Ping Test
  let totalPing = 0;
  for (let i = 0; i < 5; i++) {
    const pingStart = performance.now();
    await fetch("ping.php?" + Math.random());
    const pingEnd = performance.now();
    totalPing += (pingEnd - pingStart);
  }
  const avgPing = (totalPing / 5).toFixed(2);
  document.getElementById("ping").textContent = `Ping: ${avgPing} ms`;
}
