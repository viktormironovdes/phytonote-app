// ================================================================
// РАЗДЕЛ "УХОД"
// ================================================================

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

function renderCare() {
    const container = document.getElementById('careList');
    const range = document.querySelector('#careRange .active')?.dataset.range || 'today';

    let maxDays = range === 'today' ? 0 : range === 'tomorrow' ? 1 : range === 'week' ? 7 : 30;

    let events = [];
    state.flowers.forEach(f => {
        if (!isBaseEditable(f.base_id)) return;

        const daysWater = getDaysUntilWatering(f);
        if (daysWater <= maxDays && daysWater >= -30) {
            let label;
            if (daysWater === 0) label = 'Сегодня';
            else if (daysWater === 1) label = 'Завтра';
            else if (daysWater > 0) label = `Через ${daysWater} дн.`;
            else label = `Просрочка ${Math.abs(daysWater)} дн.`;

            events.push({
                flower: f,
                days: daysWater,
                type: 'watering',
                label: label,
                action: '💧 Полить',
                icon: '💧',
            });
        }

        if (f.fertilizing > 0 && isFertilizingActive(f)) {
            const daysF = getDaysUntilFertilizing(f);
            if (daysF <= maxDays && daysF >= -30 && daysF !== Infinity) {
                let label;
                if (daysF === 0) label = 'Сегодня';
                else if (daysF === 1) label = 'Завтра';
                else if (daysF > 0) label = `Через ${daysF} дн.`;
                else label = `Просрочка ${Math.abs(daysF)} дн.`;

                events.push({
                    flower: f,
                    days: daysF,
                    type: 'fertilizing',
                    label: label,
                    action: '🧪 Подкормить',
                    icon: '🧪',
                });
            }
        }
    });

    events.sort((a, b) => a.days - b.days);

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon-big">🎉</span>
                <p>Всё в порядке!</p>
                <p style="font-size:14px;color:#8aa08a;">Нет растений, требующих внимания</p>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map(e => {
        const typeName = e.type === 'watering' ? 'Полив' : 'Подкормка';
        return `
            <div class="card-care">
                <div class="avatar">
                    ${e.flower.photo ? `<img src="${e.flower.photo}" alt="${e.flower.name}">` : '🌿'}
                </div>
                <div class="info">
                    <div class="title">${e.flower.name}</div>
                    <div class="sub">${e.flower.placement || '—'} · ${getBaseDisplayName(getBase(e.flower.base_id))}</div>
                    <div class="meta">
                        <span>${e.icon} ${typeName} (${e.label})</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-success action-btn" onclick="doCareAction('${e.flower.id}', '${e.type}')">
                    ${e.action}
                </button>
            </div>
        `;
    }).join('');
}

function doCareAction(flowerId, type) {
    const f = getFlower(flowerId);
    if (!f) return;
    if (!isBaseEditable(f.base_id)) {
        alert('Это чужая коллекция, вы не можете менять данные.');
        return;
    }
    const today = getLocalDateStr(new Date());
    const actionName = type === 'watering' ? 'Полив' : 'Подкормка';
    const field = type === 'watering' ? 'last_watering' : 'last_fertilizing';

    if (f[field] === today) {
        alert(`${actionName} уже отмечен сегодня.`);
        return;
    }

    f[field] = today;
    state.history.push({
        id: 'hist_' + generateUUID(),
        flower_id: f.id,
        date: today,
        type: type,
        notes: `${actionName} (из раздела "Уход")`
    });

    saveState();
    renderCare();
    renderAll();
    renderCalendar();
    alert(`✅ ${actionName} для "${f.name}" отмечен!`);
}