const HOST = "m51f72c5.ala.asia-southeast1.emqxsl.com";
const OFFLINE_MS = 30000;                       // ESP32 ส่งทุก 10 วิ
const lastSeen = { 1: 0, 2: 0, 3: 0, 4: 0 };
const valveOn = { 1: false, 2: false, 3: false, 4: false };
let mainSeen = 0, mainOnline = false;
const $ = id => document.getElementById(id);
const pending = {};

function setValveUI(z, on) {
  valveOn[z] = on;
  const b = document.querySelector(`.valve-btn[data-zone="${z}"]`);
  if (b) {
    b.classList.toggle("on", on);
    b.classList.remove("pending");
    b.setAttribute("aria-checked", on);
  }
  if ($("v" + z)) $("v" + z).innerText = on ? "เปิด" : "ปิด";
  $("zone" + z)?.classList.toggle("watering", on);
  clearTimeout(pending[z]);
}

function addLog(msg) {                          // เขียนลงกล่อง "บันทึกเหตุการณ์"
  const box = document.querySelector(".text_istory");
  if (!box) return;
  const d = document.createElement("div");
  d.textContent = new Date().toLocaleTimeString("th-TH") + " · " + msg;
  box.prepend(d);
  while (box.children.length > 30) box.lastChild.remove();
}

const client = mqtt.connect(`wss://${HOST}:8084/mqtt`, {
  username: "web",
  password: "ookdku2489zx",                  // อย่าวางรหัสจริงในแชต
  clientId: "web-" + Math.random().toString(16).slice(2, 8),
  reconnectPeriod: 3000,
});

client.on("connect", () => { addLog("✅ เชื่อมต่อ broker แล้ว"); client.subscribe("garden/#"); });
client.on("error", e => addLog("❌ " + e.message));
client.on("close", () => addLog("⚠️ หลุดการเชื่อมต่อ"));

client.on("message", (topic, payload) => {
  const v = payload.toString(), p = topic.split("/");

  // ตัวหลัก / ESP32 (รองรับทั้ง garden/esp32/... และ garden/main/...)
  if (p[1] === "main" || p[1] === "esp32") {
    if (p[2] === "status") {
      mainOnline = (v === "online");
      addLog(mainOnline ? "📟 ESP32 ออนไลน์" : "📟 ESP32 ออฟไลน์");
    }
    const map = { temp: "temp", humidity: "humidity", light: "light" };
    if (map[p[2]] && $(map[p[2]])) {
      $(map[p[2]]).innerText = parseFloat(v).toFixed(p[2] === "light" ? 0 : 1);
      mainSeen = Date.now();
    }
    return;
  }

  const m = /^zone([1-4])$/.exec(p[1] || "");
  if (!m) return;
  const z = +m[1];

  if (p[2] === "moisture") {
    if ($("m" + z)) $("m" + z).innerText = Math.round(parseFloat(v));
    lastSeen[z] = Date.now();
  } else if (p[2] === "valve" && p[3] === "state") {
    const on = (v === "ON");
    if (on !== valveOn[z]) addLog((on ? "💦 วาล์วเปิด" : "🛑 วาล์วปิด") + " โซน " + z);
    setValveUI(z, on);
  }
});

// ปุ่มเปิด/ปิดวาล์ว (ส่งคำสั่ง แล้วรอ ESP32 รายงานสถานะกลับมาเปลี่ยนหน้าจอ)
document.addEventListener("click", e => {
  const b = e.target.closest(".valve-btn");
  if (!b || b.classList.contains("pending")) return;
  const z = +b.dataset.zone;
  if (!client.connected) return addLog("⚠️ ยังไม่ได้เชื่อมต่อ broker");

  const want = !valveOn[z];
  b.classList.add("pending");
  client.publish(`garden/zone${z}/valve/set`, want ? "ON" : "OFF", { qos: 1 });
  addLog("📤 สั่ง" + (want ? "เปิด" : "ปิด") + "วาล์ว โซน " + z);

  pending[z] = setTimeout(() => {           // ESP32 ไม่ตอบ
    b.classList.remove("pending");
    addLog("⏱️ โซน " + z + " ไม่ตอบกลับ ตรวจสอบ ESP32");
  }, 6000);
});

function checkStatus() {
  const now = Date.now();
  let active = 0;
  for (let i = 1; i <= 4; i++) {
    const on = now - lastSeen[i] <= OFFLINE_MS;
    $("zone" + i)?.classList.toggle("online", on);
    if (on) active++;
    else if ($("m" + i)) $("m" + i).innerText = "--";
    const btn = document.querySelector(`.valve-btn[data-zone="${i}"]`);
    if (btn) btn.disabled = !on || !client.connected;
  }
  if ($("onlineCount")) $("onlineCount").innerText = active;
  if (now - mainSeen > OFFLINE_MS) {
    ["temp", "humidity", "light"].forEach(k => { if ($(k)) $(k).innerText = "--"; });
  }
}
setInterval(checkStatus, 1000);