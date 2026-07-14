// ================================================================
// КАТАЛОГ РАСТЕНИЙ
// ================================================================

function loadCatalog() {
    try {
        const saved = localStorage.getItem('customCatalog');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.catalog = parsed.plants || [];
        } else {
            state.catalog = [];
        }
    } catch (e) {
        state.catalog = [];
    }
    updateCatalogStatus();
    renderCatalog();
}

function saveCatalogToStorage() {
    const data = { version: '2.0', plants: state.catalog };
    localStorage.setItem('customCatalog', JSON.stringify(data));
    updateCatalogStatus();
    renderCatalog();
}

function updateCatalogStatus() {
    const count = state.catalog.length;
    document.getElementById('catalogStatus').textContent = count > 0 ? `Загружено ${count} растений` : 'Не загружен';
}

function getCatalogPlant(catalogId) {
    return state.catalog.find(p => p.id === catalogId);
}

function renderCatalog() {
    const container = document.getElementById('catalogList');
    const search = document.getElementById('plantsSearch').value.toLowerCase();

    const growthFilter = document.getElementById('filterGrowth').value;
    const lightFilter = document.getElementById('filterLight').value;
    const safetyFilter = document.getElementById('filterSafety').value;

    if (state.catalog.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon-big">🌱</span>
                <p>Каталог пуст</p>
                <p style="font-size:14px;color:#8aa08a;margin-top:4px;">Импортируйте JSON-файл с растениями в разделе "Профиль"</p>
                <button class="btn btn-outline" onclick="navigateTo('profile')">Перейти в профиль</button>
            </div>
        `;
        return;
    }

    let list = state.catalog.filter(p => p.name.toLowerCase().includes(search));

    if (growthFilter !== 'all') {
        list = list.filter(p => p.growth_forms && p.growth_forms.includes(growthFilter));
    }

    if (lightFilter !== 'all') {
        list = list.filter(p => p.light_needs === lightFilter);
    }

    if (safetyFilter === 'safe_pets') {
        list = list.filter(p => !p.dangerous_pets);
    } else if (safetyFilter === 'safe_children') {
        list = list.filter(p => !p.dangerous_children);
    } else if (safetyFilter === 'safe_all') {
        list = list.filter(p => !p.dangerous_pets && !p.dangerous_children);
    }

    list.sort((a, b) => a.name.localeCompare(b.name));

    container.innerHTML = list.map(p => `
        <div class="card" onclick="showCatalogPreview('${p.id}')">
            <div class="avatar">${p.icon || '🌿'}</div>
            <div class="info">
                <div class="title">${p.name}</div>
                <div class="sub">${p.description ? p.description.substring(0, 60) + '...' : ''}</div>
            </div>
            <div style="font-size:20px;">→</div>
        </div>
    `).join('') || '<div style="text-align:center;padding:30px;color:#8aa08a;">🌱 Нет растений, соответствующих фильтрам</div>';
}

function importCatalog(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.plants && Array.isArray(data.plants)) {
                state.catalog = data.plants;
                saveCatalogToStorage();
                alert('✅ Каталог импортирован (' + state.catalog.length + ' растений)');
                renderAll();
            } else {
                alert('❌ Неверный формат файла. Ожидается { "plants": [...] }');
            }
        } catch (err) {
            alert('❌ Ошибка чтения файла: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function exportCatalog() {
    if (state.catalog.length === 0) {
        alert('Каталог пуст. Нечего экспортировать.');
        return;
    }
    const data = { version: '2.0', plants: state.catalog };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function clearCatalog() {
    if (state.catalog.length === 0) {
        alert('Каталог уже пуст.');
        return;
    }
    if (!confirm('🗑 Удалить весь каталог растений? Растения в ваших коллекциях не пострадают.')) return;
    state.catalog = [];
    localStorage.removeItem('customCatalog');
    updateCatalogStatus();
    renderCatalog();
    alert('✅ Каталог очищен');
}

function showCatalogPreview(catalogId) {
    const plant = state.catalog.find(p => p.id === catalogId);
    if (!plant) return;
    if (state.bases.length === 0) {
        alert('Сначала создайте коллекцию в разделе "Коллекции"');
        return;
    }
    const myBases = state.bases.filter(b => b.owner === 'Вы');
    if (myBases.length === 0) {
        alert('У вас нет своих коллекций. Создайте коллекцию в разделе "Коллекции"');
        return;
    }
    const basesOptions = myBases.map(b => `<option value="${b.id}">${b.icon} ${getBaseDisplayName(b)}</option>`).join('');

    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.id = 'previewModal';
    overlay.innerHTML = `
        <div class="modal-content">
            <div style="display:flex;justify-content:flex-end;padding:12px 16px 0 0;">
                <button class="edit-toggle" onclick="document.getElementById('previewModal').remove()">✕</button>
            </div>
            <div class="modal-scroll" style="padding:0 20px 20px 20px;">
                <div style="text-align:center;">
                    <div style="font-size:48px;">${plant.icon || '🌿'}</div>
                    <div style="font-size:20px;font-weight:700;margin:8px 0;">${plant.name}</div>
                    <div style="font-size:14px;color:#5c725c;margin-bottom:12px;">${plant.description || ''}</div>
                </div>
                <div style="text-align:left;font-size:14px;background:#f4f7f4;padding:12px;border-radius:12px;">
                    📂 Форма роста: ${plant.growth_forms ? plant.growth_forms.join(', ') : '—'}<br>
                    ☀️ Свет: ${plant.light_needs || '—'}<br>
                    ${plant.dangerous_pets ? '⚠️ Опасно для животных: Да' : '✅ Безопасно для животных'}<br>
                    ${plant.dangerous_children ? '⚠️ Опасно для детей: Да' : '✅ Безопасно для детей'}<br>
                    💧 Полив: летом ${plant.default_watering_summer || 3} дн., зимой ${plant.default_watering_winter || 7} дн.<br>
                    🧪 Подкормка: ${plant.default_fertilizing || 30} дн.<br>
                    🔄 Пересадка: ${plant.default_repot_interval || 2} года<br>
                    🌱 Грунт: ${plant.default_soil || '—'}
                </div>
                ${plant.care_guide ? `
                    <div style="margin-top:12px;">
                        <div style="font-weight:600;font-size:14px;margin-bottom:4px;">📖 Подробный уход</div>
                        <div class="care-guide" style="margin:0;">${plant.care_guide}</div>
                    </div>
                ` : ''}
                <div style="margin-top:14px;">
                    <label style="font-weight:600;display:block;margin-bottom:4px;">Добавить в коллекцию:</label>
                    <select id="previewBaseSelect" style="width:100%;padding:10px;border-radius:12px;border:1px solid #dce4dc;margin-bottom:8px;font-size:14px;">${basesOptions}</select>

                    <label style="font-weight:600;display:block;margin-bottom:4px;">📍 Расположение:</label>
                    <input id="previewPlacement" placeholder="Гостиная, кухня..." style="width:100%;padding:10px;border-radius:12px;border:1px solid #dce4dc;margin-bottom:8px;font-size:14px;" list="previewLocationSuggestions">
                    <datalist id="previewLocationSuggestions"></datalist>

                    <label style="font-weight:600;display:block;margin-bottom:4px;">🌱 Дата посадки (месяц-год):</label>
                    <input id="previewPlantingDate" type="month" value="${currentMonth}" style="width:100%;padding:10px;border-radius:12px;border:1px solid #dce4dc;margin-bottom:8px;font-size:14px;">

                    <label style="font-weight:600;display:block;margin-bottom:4px;">📅 Последний полив:</label>
                    <input id="previewLastWatering" type="date" value="${today}" style="width:100%;padding:10px;border-radius:12px;border:1px solid #dce4dc;margin-bottom:8px;font-size:14px;" max="${today}">

                    <label style="font-weight:600;display:block;margin-bottom:4px;">🧪 Последняя подкормка:</label>
                    <input id="previewLastFertilizing" type="date" value="${today}" style="width:100%;padding:10px;border-radius:12px;border:1px solid #dce4dc;margin-bottom:8px;font-size:14px;" max="${today}">

                    <label style="font-weight:600;display:block;margin-bottom:4px;">🔄 Последняя пересадка:</label>
                    <input id="previewLastRepotting" type="date" value="${today}" style="width:100%;padding:10px;border-radius:12px;border:1px solid #dce4dc;margin-bottom:8px;font-size:14px;" max="${today}">

                    <button class="btn" onclick="addFromPreview('${plant.id}')" style="margin-top:4px;">➕ Добавить в коллекцию</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
        updateLocationSuggestionsForPreview();
    }, 100);

    overlay.addEventListener('click', function(e) { if (e.target === this) this.remove(); });
}

function updateLocationSuggestionsForPreview() {
    const baseSelect = document.getElementById('previewBaseSelect');
    if (!baseSelect) return;
    const baseId = baseSelect.value;
    const datalist = document.getElementById('previewLocationSuggestions');
    if (!datalist) return;

    const locations = new Set();
    state.flowers
        .filter(f => f.base_id === baseId)
        .forEach(f => {
            if (f.placement && f.placement !== '—') {
                locations.add(f.placement);
            }
        });

    datalist.innerHTML = [...locations]
        .map(l => `<option value="${l}">`)
        .join('');
}

function addFromPreview(catalogId) {
    const select = document.getElementById('previewBaseSelect');
    const baseId = select ? select.value : null;
    if (!baseId || !getBase(baseId)) { alert('Выберите коллекцию'); return; }

    const plant = state.catalog.find(p => p.id === catalogId);
    if (!plant) return;

    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    const flower = {
        id: 'flower_' + generateUUID(),
        catalog_id: plant.id,
        base_id: baseId,
        source_type: 'catalog',

        name: plant.name,
        latin_name: '',
        placement: document.getElementById('previewPlacement')?.value || '—',
        planting_date: document.getElementById('previewPlantingDate')?.value || currentMonth,
        condition: 'Хорошее',
        light: plant.default_light || 'Рассеянный свет',
        photo: null,

        watering_summer: plant.default_watering_summer || 3,
        watering_winter: plant.default_watering_winter || 7,
        fertilizing: plant.default_fertilizing || 30,
        fertilizing_start: 3,
        fertilizing_end: 10,
        repot_interval: plant.default_repot_interval || 2,

        last_watering: document.getElementById('previewLastWatering')?.value || today,
        last_fertilizing: document.getElementById('previewLastFertilizing')?.value || today,
        last_repotting: document.getElementById('previewLastRepotting')?.value || today,

        care_info: plant.care_guide || '',
        notes: plant.default_soil ? 'Грунт: ' + plant.default_soil : '',
        createdAt: new Date().toISOString()
    };

    state.flowers.push(flower);
    state.history.push({
        id: 'hist_' + generateUUID(),
        flower_id: flower.id,
        date: flower.last_watering,
        type: 'watering',
        notes: 'Добавлено из каталога'
    });
    if (flower.fertilizing > 0) {
        state.history.push({
            id: 'hist_' + generateUUID(),
            flower_id: flower.id,
            date: flower.last_fertilizing,
            type: 'fertilizing',
            notes: 'Добавлено из каталога'
        });
    }
    state.history.push({
        id: 'hist_' + generateUUID(),
        flower_id: flower.id,
        date: flower.last_repotting,
        type: 'repotting',
        notes: 'Добавлено из каталога'
    });

    saveState();
    document.getElementById('previewModal')?.remove();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ ' + plant.name + ' добавлен в коллекцию!');
}