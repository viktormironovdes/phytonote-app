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

// ================================================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ИСТОРИЕЙ
// ================================================================

function getWateringInterval(flower) {
    const season = getSeason();
    if (season === 'summer' || season === 'spring') return flower.watering_summer || 3;
    return flower.watering_winter || 7;
}

function getLastEvent(flower, type) {
    if (!flower.history || flower.history.length === 0) return null;
    const events = flower.history
        .filter(h => h.type === type)
        .sort((a, b) => b.date.localeCompare(a.date));
    return events[0] || null;
}

function getLastWateringDate(flower) {
    const event = getLastEvent(flower, 'watering');
    return event ? event.date : null;
}

function getLastFertilizingDate(flower) {
    const event = getLastEvent(flower, 'fertilizing');
    return event ? event.date : null;
}

function getLastRepottingDate(flower) {
    const event = getLastEvent(flower, 'repotting');
    return event ? event.date : null;
}

function getWateringStatus(flower) {
    const lastDate = getLastWateringDate(flower);
    if (!lastDate) return 'yellow';
    const interval = getWateringInterval(flower);
    const last = new Date(lastDate);
    const diff = Math.floor((new Date() - last) / 86400000);
    if (diff >= interval) return 'red';
    if (diff >= interval - 1) return 'yellow';
    return 'green';
}

function getDaysUntilWatering(flower) {
    const lastDate = getLastWateringDate(flower);
    if (!lastDate) return 0;
    const interval = getWateringInterval(flower);
    const last = new Date(lastDate);
    const diff = Math.floor((new Date() - last) / 86400000);
    return interval - diff;
}

// ================================================================
// ИСПРАВЛЕННАЯ ФУНКЦИЯ getNextWateringDate
// ================================================================

function getNextWateringDate(flower) {
    const lastDate = getLastWateringDate(flower);
    const now = new Date();
    const todayStr = getLocalDateStr(now);
    
    // Если нет истории полива — завтра
    if (!lastDate) {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        return d;
    }
    
    const interval = getWateringInterval(flower);
    const last = new Date(lastDate);
    const lastStr = getLocalDateStr(last);
    
    // Если последний полив был сегодня — следующий через interval дней
    if (lastStr === todayStr) {
        const next = new Date(now);
        next.setDate(next.getDate() + interval);
        return next;
    }
    
    // Считаем следующую дату полива от последнего
    const next = new Date(last);
    next.setDate(next.getDate() + interval);
    
    // Если следующая дата уже прошла (просрочка) — возвращаем сегодня
    if (next < now) {
        return new Date(now);
    }
    
    // Если следующая дата в будущем — возвращаем её
    return next;
}

// ================================================================
// ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений)
// ================================================================

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
    const lastDate = getLastFertilizingDate(flower);
    if (!lastDate) return '🟡 Нет данных';
    const diff = Math.floor((new Date() - new Date(lastDate)) / 86400000);
    if (diff >= flower.fertilizing) return '🔴 Пора';
    if (diff >= flower.fertilizing - 2) return '🟡 Скоро';
    return '🟢 В норме';
}

function getDaysUntilFertilizing(flower) {
    if (!flower.fertilizing || flower.fertilizing <= 0) return Infinity;
    if (!isFertilizingActive(flower)) return Infinity;
    const lastDate = getLastFertilizingDate(flower);
    if (!lastDate) return 0;
    const diff = Math.floor((new Date() - new Date(lastDate)) / 86400000);
    return flower.fertilizing - diff;
}

function getNextFertilizingDate(flower) {
    if (!flower.fertilizing || flower.fertilizing <= 0) return null;
    const lastDate = getLastFertilizingDate(flower);
    const now = new Date();
    if (!lastDate) {
        const d = new Date(now);
        d.setDate(d.getDate() + flower.fertilizing);
        return d;
    }
    const last = new Date(lastDate);
    const next = new Date(last);
    next.setDate(next.getDate() + flower.fertilizing);
    
    if (next < now && flower.fertilizing > 0) {
        return new Date(now);
    }
    return next;
}

function getNextRepottingDate(flower) {
    if (!flower.repot_interval || flower.repot_interval <= 0) return null;
    const lastDate = getLastRepottingDate(flower);
    if (!lastDate) return null;
    const last = new Date(lastDate);
    const now = new Date();
    const next = new Date(last);
    next.setFullYear(next.getFullYear() + flower.repot_interval);
    
    if (next < now) {
        return new Date(now);
    }
    return next;
}
