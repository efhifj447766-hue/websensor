const esp32Url = "http://10.10.0.2/data"; // 🔴 เปลี่ยน IP นี้ให้ตรงกับ ESP32 ของคุณ

async function fetchSensorData() {
    try {
        let response = await fetch(esp32Url);
        let data = await response.json();

        // นำค่ามาแสดงผลบนหน้าเว็บ
        document.getElementById('temp').innerText = data.temperature;
        document.getElementById('humidity').innerText = data.humidity;
        document.getElementById('light').innerText = data.light;
    } catch (error) {
        console.error('ไม่สามารถเชื่อมต่อกับ ESP32 ได้:', error);
    }
}

// ดึงข้อมูลอัตโนมัติทุกๆ 2 วินาที
setInterval(fetchSensorData, 2000);

// เรียกใช้งานทันทีเมื่อเปิดเว็บ
fetchSensorData();

const dataUrl = "https://webhook.site/your-unique-id-here";

let lastDataTime = Date.now();

async function fetchSensorData() {
    try {
        let response = await fetch(dataUrl);
        let text = await response.text();

        // สมมติข้อมูลที่ส่งมาเป็น JSON
        // หมายเหตุ: สำหรับ Webhook.site จะดึง Request ล่าสุดมาแปลง
        // หากใช้ Webhook.site อาจต้องปรับวิธีอ่านข้อมูลเล็กน้อยตามหน้าเว็บจริง

        // สมมติว่าดึงข้อมูลสำเร็จและอัปเดตค่า:
        // document.getElementById('temp').innerText = data.temperature;
        // document.getElementById('humidity').innerText = data.humidity;

        // อัปเดตเวลาล่าสุดที่ติดต่อได้
        lastDataTime = Date.now();
    } catch (error) {
        console.error('Connection error:', error);
    }
}

// ฟังก์ชันตรวจสอบสถานะทุกๆ 1 วินาที
function checkConnectionStatus() {
    let now = Date.now();
    let statusBox = document.getElementById('statusIndicator');

    // ถ้าเวลาผ่านไปเกิน 6 วินาที โดยไม่มีข้อมูลเข้ามาใหม่ ถือว่าออฟไลน์
    if (now - lastDataTime > 6000) {
        statusBox.className = "status-box"; // สีแดง
        statusBox.innerText = "🔴 อุปกรณ์ออฟไลน์ (Disconnected)";
        document.getElementById('temp').innerText = "--";
        document.getElementById('humidity').innerText = "--";
    } else {
        statusBox.className = "status-box online"; // สีเขียว
        statusBox.innerText = "🟢 กำลังทำงาน (Online)";
    }
}

// ดึงข้อมูลทุก 2 วินาที
setInterval(fetchSensorData, 2000);

// เช็คสถานะการทำงานทุก 1 วินาที
setInterval(checkConnectionStatus, 1000);
const lastSeen = {
    1: 0,
    2: 0,
    3: 0,
    4: 0
};

// ฟังก์ชันจำลองการรับข้อมูล (สามารถเปลี่ยนไปดึงจาก API หรือ MQTT จริงได้ทีหลัง)
async function fetchAllZonesData() {
    // ตัวอย่างจำลอง: สมมติว่าดึงข้อมูลสำเร็จและระบุว่าโซน 1 กับโซน 3 ส่งค่าเข้ามา
    // ในการใช้งานจริง คุณสามารถวนลูปดึงข้อมูลจาก Endpoint ของแต่ละโซน หรือผ่าน MQTT ได้
    let currentTime = Date.now();

    // --- [จำลองข้อมูลเข้า] สมมติให้โซน 1 และ 2 ส่งข้อมูลเข้ามาสดๆ ---
    updateZoneData(1, 26.5, 60.2, currentTime);
    updateZoneData(2, 28.1, 55.4, currentTime);
    // โซน 3 และ 4 ปล่อยไว้ (จำลองว่าออฟไลน์อยู่)
}

function updateZoneData(zoneId, temp, humi, time) {
    document.getElementById(`t${zoneId}`).innerText = temp;
    document.getElementById(`h${zoneId}`).innerText = humi;
    lastSeen[zoneId] = time; // บันทึกเวลาล่าสุดที่ได้รับข้อมูล
}

// เช็คสถานะออนไลน์/ออฟไลน์ทุกๆ 1 วินาที
function checkStatus() {
    let now = Date.now();
    let activeCount = 0;

    for (let i = 1; i <= 4; i++) {
        let card = document.getElementById(`zone{i}`.replace('{i}', i)); // แก้ไขการเรียก ID

        // ถ้าภายใน 6 วินาทีนี้ มีข้อมูลส่งมา ถือว่าออนไลน์
        if (now - lastSeen[i] <= 6000) {
            card.classList.add('online');
            activeCount++;
        } else {
            card.classList.remove('online');
            document.getElementById(`t${i}`).innerText = "--";
            document.getElementById(`h${i}`).innerText = "--";
        }
    }

    // แสดงจำนวนรวมที่ออนไลน์
    document.getElementById('onlineCount').innerText = activeCount;
}

// จำลองการดึงข้อมูลทุกๆ 2 วินาที
setInterval(fetchAllZonesData, 2000);

// ตรวจสอบสถานะและอัปเดตหน้าจอทุก 1 วินาที
setInterval(checkStatus, 1000);