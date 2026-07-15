// ================================================================
// РАЗДЕЛ "УХОД" (с случайными фактами)
// ================================================================

function getRandomFact() {
    if (!isCatalogLoaded()) return null;
    
    const allFacts = [];
    state.catalog.plants.forEach(plant => {
        if (plant.facts) {
            plant.facts.forEach(fact => {
                allFacts.push({
                    ...fact,
                    plant_name: plant.name,
                    plant_icon: plant.icon || '🌿',
                    plant_id: plant.id
                });
            });
        }
    });
    
    if (allFacts.length === 0) return null;
    return allFacts[Math.floor(Math.random() * allFacts.length)];
}

function renderCare() {
    const container = document.getElementById('careList');
    if (!container) return;
    
    const range = document.querySelector('#careRange .active')?.dataset.range || 'today';
    let maxDays = range === 'today' ? 0 : range === 'tomorrow' ? 1 : range === 'week' ? 7 : 30;

    // Генерируем случайный факт
    const randomFact = getRandomFact();
    let factHtml = '';
    if (randomFact && isCatalogLoaded()) {
        const char = getCharacteristic(randomFact.characteristic_id);
        const icon = char ? char.icon : '📌';
        factHtml = `
            <div class="fact-card" style="background:#f8fbf8;border-radius:12px;padding:14px 16px;border-left:4px solid #3a7a3a;margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-weight:600;font-size:14px;color:#1e2e1e;">
                        ${randomFact.plant_icon} ${randomFact.plant_name}
                    </div>
                    <button class="btn btn-sm btn-outline" onclick="renderCare()" style="padding:2px 12px;font-size:11px;">🔄 Другой</button>
                </div>
                <div style="font-size:13px;color:#2d4a2d;margin-top:4px;">
                    ${icon} ${char ? char.name : ''}: ${randomFact.short}
                </div>
                ${randomFact.source ? `<div style="font-size:11px;color:#8aa08a;margin-top:4px;">📚 ${randomFact.source}</div>` : ''}
                <button class="btn btn-sm btn-outline" onclick="showFactDetail('${randomFact.plant_id}', '${randomFact.characteristic_id}')" style="margin-top:6px;padding:4px 12px;font-size:12px;width:auto;">📖 Подробнее</button>
            </div>
        `;
    } else if (!isCatalogLoaded()) {
        factHtml = `
            <div class="fact-card" style="background:#f8fbf8;border-radius:12px;padding:14px 16px;border-left:4px solid #e8b830;margin-bottom:16px;">
                <div style="font-weight:600;font-size:14px;color:#1e2e1e;">📚 Каталог не загружен</div>
                <div style="font-size:13px;color:#5c725c;margin-top:4px;">Импортируйте каталог растений в разделе "Профиль" для отображения интересных фактов.</div>
                <button class="btn btn-sm btn-outline" onclick="navigateTo('profile')" style="margin-top:6px;padding:4px 12px;font-size:12px;width:auto;">Перейти в профиль</button>
            </div>
        `;
    }

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

    let eventsHtml = '';
    if (events.length === 0) {
        eventsHtml = `
            <div class="empty-state">
                <span class="icon-big">🎉</span>
                <p>Всё в порядке!</p>
                <p style="font-size:14px;color:#8aa08a;">Нет растений, требующих внимания</p>
            </div>
        `;
    } else {
        eventsHtml = events.map(e => {
            const typeName = e.type === 'watering' ? 'Полив' : 'Подкормка';
            const displayName = e.flower.catalog_name || e.flower.name;
            return `
                <div class="card-care">
                    <div class="avatar">
                        ${e.flower.photo ? `<img src="${e.flower.photo}" alt="${displayName}">` : (e.flower.catalog_icon || '🌿')}
                    </div>
                    <div class="info">
                        <div class="title">${displayName}</div>
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

    container.innerHTML = factHtml + eventsHtml;
}

function showFactDetail(plantId, characteristicId) {
    const plant = getCatalogPlant(plantId);
    if (!plant) return;
    const fact = plant.facts?.find(f => f.characteristic_id === characteristicId);
    if (!fact) return;
    const char = getCharacteristic(characteristicId);
    const icon = char ? char.icon : '📌';
    const name = char ? char.name : 'Информация';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
        <div class="modal-content">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px 0 20px;flex-shrink:0;">
                <h2 style="margin:0;font-size:18px;">${icon} ${name}</h2>
                <button class="edit-toggle" onclick="this.closest('.modal-overlay').classList.remove('show')">✕</button>
            </div>
            <div class="modal-scroll" style="padding:0 20px 20px 20px;">
                <div style="font-size:14px;line-height:1.6;color:#1e2e1e;white-space:pre-wrap;">${fact.full}</div>
                ${fact.source ? `<div style="margin-top:12px;font-size:12px;color:#8aa08a;">📚 Источник: ${fact.source}</div>` : ''}
                <div style="margin-top:8px;font-size:12px;color:#5c725c;">🌿 ${plant.name}</div>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').classList.remove('show')">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });
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
    alert(`✅ ${actionName} для "${f.catalog_name || f.name}" отмечен!`);
}
