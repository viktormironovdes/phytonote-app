// ================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ================================================================

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getLocalDateStr(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateAge(plantingDate) {
    if (!plantingDate) return 'Неизвестно';
    const parts = plantingDate.split('-');
    const plantYear = parseInt(parts[0]);
    const plantMonth = parseInt(parts[1]) - 1;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let years = currentYear - plantYear;
    let months = currentMonth - plantMonth;
    if (months < 0) {
        years--;
        months += 12;
    }

    if (years === 0 && months === 0) return 'Только посажено';
    if (years === 0) return months + ' мес.';
    if (months === 0) return years + ' лет';
    return years + ' лет ' + months + ' мес.';
}

function getSeason() {
    const m = new Date().getMonth();
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    if (m >= 8 && m <= 10) return 'autumn';
    return 'winter';
}

function getWateringInterval(flower) {
    const season = getSeason();
    if (season === 'summer' || season === 'spring') return flower.watering_summer || 3;
    return flower.watering_winter || 7;
}

function getWateringStatus(flower) {
    const interval = getWateringInterval(flower);
    const last = new Date(flower.last_watering || Date.now());
    const diff = Math.floor((new Date() - last) / 86400000);
    if (diff >= interval) return 'red';
    if (diff >= interval - 1) return 'yellow';
    return 'green';
}

function getDaysUntilWatering(flower) {
    const interval = getWateringInterval(flower);
    const last = new Date(flower.last_watering || Date.now());
    const diff = Math.floor((new Date() - last) / 86400000);
    return interval - diff;
}

function getNextWateringDate(flower) {
    const interval = getWateringInterval(flower);
    const last = new Date(flower.last_watering || Date.now());
    const d = new Date(last);
    d.setDate(d.getDate() + interval);
    return d;
}

function isFertilizingActive(flower) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const start = flower.fertilizing_start || 3;
    const end = flower.fertilizing_end || 10;
    if (start <= end) {
        return month >= start && month <= end;
    } else {
        return month >= start || month <= end;
    }
}

function getFertilizingStatus(flower) {
    if (!flower.fertilizing || flower.fertilizing <= 0) return 'Не требуется';
    if (!isFertilizingActive(flower)) return '⏸️ Период покоя';
    const last = new Date(flower.last_fertilizing || Date.now());
    const diff = Math.floor((new Date() - last) / 86400000);
    if (diff >= flower.fertilizing) return '🔴 Пора';
    if (diff >= flower.fertilizing - 2) return '🟡 Скоро';
    return '🟢 В норме';
}

function getDaysUntilFertilizing(flower) {
    if (!flower.fertilizing || flower.fertilizing <= 0) return Infinity;
    if (!isFertilizingActive(flower)) return Infinity;
    const last = new Date(flower.last_fertilizing || Date.now());
    const diff = Math.floor((new Date() - last) / 86400000);
    return flower.fertilizing - diff;
}
