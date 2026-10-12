setInterval(() => {
            let time = new Date().toLocaleTimeString('th-TH'); // ดึงเวลาปัจจุบันของเครื่อง (ชั่วโมง:นาที:วินาที)
            document.getElementById('clock').textContent = time;
}, 1000);