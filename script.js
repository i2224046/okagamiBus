// ゼロ埋めを行う関数（2桁にする）
function zeroPad(num) {
    return num.toString().padStart(2, '0');
}

// CSVファイルの読み込み
function loadCSV(csvFile) {
    return fetch(csvFile)
        .then(response => response.text())
        .then(data => parseCSV(data));
}

// CSVをパースする関数
function parseCSV(data) {
    const rows = data.trim().split('\n');
    const schedule = [];
    
    rows.forEach(row => {
        const cols = row.split(',');
        const hour = cols[0].replace('h', '').trim();
        const minutes = cols.slice(1).map(min => {
            const destination = min.includes('三') ? '三菱ケミカル前'
                            : min.includes('橋') ? '奈良北団地※'
                            : '奈良北団地';
            return { minute: parseInt(min.replace(/[三橋]/g, '').trim()), destination };
        });
        schedule.push({ hour: parseInt(hour), minutes });
    });

    return schedule;
}

// 現在時刻を元に、次のバスまで何分か計算する関数
function findNextBus(schedule) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const upcomingBuses = [];

    for (let i = 0; i < schedule.length; i++) {
        const { hour, minutes } = schedule[i];
        for (let bus of minutes) {
            if (hour > currentHour || (hour === currentHour && bus.minute > currentMinute)) {
                const minutesToBus = (hour * 60 + bus.minute) - (currentHour * 60 + currentMinute);
                upcomingBuses.push({ ...bus, hour, minutesToBus });
                if (upcomingBuses.length === 3) {
                    return upcomingBuses;
                }
            }
        }
    }

    return upcomingBuses; // 残りのバスが3つ未満の場合
}

// 時刻表をテーブルに表示する関数
function displayTimetable(buses) {
    const tbody = document.querySelector('#timetable tbody');
    tbody.innerHTML = ''; // 初期化

    buses.forEach(bus => {
        const row = document.createElement('tr');

        // 時刻のセル
        const timeCell = document.createElement('td');
        timeCell.innerHTML = `<div class="time">${zeroPad(bus.hour)}:${zeroPad(bus.minute)}</div>`;
        row.appendChild(timeCell);

        // 行き先のセル
        const destinationCell = document.createElement('td');
        destinationCell.innerHTML = `<div class="goto">${bus.destination}</div>`;
        row.appendChild(destinationCell);

        // あと何分かのセル
        const minutesToBusCell = document.createElement('td');
        minutesToBusCell.innerHTML = `<div class="min">${bus.minutesToBus}分後</div>`;
        row.appendChild(minutesToBusCell);

        tbody.appendChild(row);
    });
}

// 次のバスを表示する関数
function displayNextBus(bus) {
    const nextBusDiv = document.getElementById('next-bus');
    nextBusDiv.innerHTML = `<p>あと${bus.minutesToBus}分で到着します。</p>`;
}

// 平日か休日かを判断する関数
function isHoliday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: 日曜日, 6: 土曜日
    return dayOfWeek === 0 || dayOfWeek === 6;
}

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
    const csvFile = isHoliday() ? 'holiday.csv' : 'weekdays.csv';

    loadCSV(csvFile).then(schedule => {
        const nextBuses = findNextBus(schedule);
        displayTimetable(nextBuses);
        if (nextBuses.length > 0) {
            displayNextBus(nextBuses[0]);
        }
    });
});
