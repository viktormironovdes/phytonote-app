// ================================================================
// КАТАЛОГ РАСТЕНИЙ (версия 3.0)
// ================================================================

function loadCatalog() {
    try {
        const saved = localStorage.getItem('customCatalog');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.version === '3.0' && parsed.plants && parsed.characteristics) {
                state.catalog = parsed;
                state.catalogLoaded = true;
            } else {
                state.catalog = convertOldCatalog(parsed);
                state.catalogLoaded = true;
            }
        } else {
            state.catalog = { version: '3.0', characteristics: [], plants: [] };
            state.catalogLoaded = false;
        }
    } catch (e) {
        state.catalog = { version: '3.0', characteristics: [], plants: [] };
        state.catalogLoaded = false;
    }
    updateCatalogStatus();
    renderCatalog();
}

function saveCatalogToStorage() {
    localStorage.setItem('customCatalog', JSON.stringify(state.catalog));
    updateCatalogStatus();
    renderCatalog();
}

function convertOldCatalog(oldData) {
    const characteristics = [
        { id: 'watering', name: 'Полив', icon: '💧' },
        { id: 'lighting', name: 'Освещение', icon: '☀️' },
        { id: 'fertilizing', name: 'Подкормка', icon: '🧪' },
        { id: 'repotting', name: 'Пересадка', icon: '🔄' },
        { id: 'soil', name: 'Грунт', icon: '🌱' },
        { id: 'temperature', name: 'Температура', icon: '🌡️' },
        { id: 'humidity', name: 'Влажность', icon: '💨' },
        { id: 'origin', name: 'Происхождение', icon: '🌍' },
        { id: 'history', name: 'История', icon: '📖' },
        { id: 'leaf', name: 'Листья', icon: '🍃' },
        { id: 'flowering', name: 'Цветение', icon: '🌸' },
        { id: 'toxicity', name: 'Токсичность', icon: '⚠️' },
        { id: 'general', name: 'Общее', icon: '📌' },
        { id: 'family', name: 'Семейство', icon: '🧬' },
        { id: 'problems', name: 'Возможные проблемы', icon: '❗' },
    ];
    
    const plants = (oldData.plants || []).map(p => {
        const facts = [];
        if (p.care_guide) {
            const lines = p.care_guide.split('\n').filter(l => l.trim());
            const factMap = {
                'Освещение': 'lighting',
                'Полив': 'watering',
                'Температура': 'temperature',
                'Влажность': 'humidity',
                'Подкормка': 'fertilizing',
                'Пересадка': 'repotting',
                'Проблемы': 'problems',
            };
            
            lines.forEach(line => {
                for (const [key, value] of Object.entries(factMap)) {
                    if (line.includes(key)) {
                        const text = line.replace(/[🌱💧🌡💦🌿🔄⚠️*]/g, '').trim();
                        facts.push({
                            characteristic_id: value,
                            short: text.substring(0, 200),
                            full: text,
                            source: 'Из справочника'
                        });
                        break;
                    }
                }
            });
        }
        
        return {
            id: p.id,
            name: p.name,
            icon: p.icon || '🌿',
            description: p.description || '',
            growth_forms: p.growth_forms || [],
            light_needs: p.light_needs || '',
            dangerous_pets: p.dangerous_pets || false,
            dangerous_children: p.dangerous_children || false,
            default_watering_summer: p.default_watering_summer || 3,
            default_watering_winter: p.default_watering_winter || 7,
            default_fertilizing: p.default_fertilizing || 30,
            default_repot_interval: p.default_repot_interval || 2,
            default_light: p.default_light || 'Рассеянный свет',
            default_soil: p.default_soil || '',
            facts: facts.length > 0 ? facts : [
                {
                    characteristic_id: 'general',
                    short: p.description || 'Информация о растении',
                    full: p.description || 'Нет подробной информации',
                    source: 'Ботанический справочник'
                }
            ]
        };
    });
    
    return {
        version: '3.0',
        characteristics: characteristics,
        plants: plants
    };
}

function updateCatalogStatus() {
    const count = state.catalog.plants.length;
    const statusEl = document.getElementById('catalogStatus');
    if (statusEl) {
        statusEl.textContent = count > 0 ? `Загружено ${count} растений (v${state.catalog.version})` : 'Не загружен';
    }
}

function renderCatalog() {
    const container = document.getElementById('catalogList');
    if (!container) return;
    
    const search = document.getElementById('plantsSearch')?.value.toLowerCase() || '';
    const growthFilter = document.getElementById('filterGrowth')?.value || 'all';
    const lightFilter = document.getElementById('filterLight')?.value || 'all';
    const safetyFilter = document.getElementById('filterSafety')?.value || 'all';

    if (state.catalog.plants.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon-big">🌱</span>
                <p>Каталог пуст</p>
                <p style="font-size:14px;color:#8aa08a;margin-top:4px;">Импортируйте JSON-файл с растениями (версия 3.0) в разделе "Профиль"</p>
                <button class="btn btn-outline" onclick="navigateTo('profile')">Перейти в профиль</button>
            </div>
        `;
        return;
    }

    let list = state.catalog.plants.filter(p => 
        p.name.toLowerCase().includes(search)
    );

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
            if (data.version === '3.0' && data.plants && data.characteristics) {
                state.catalog = data;
                state.catalogLoaded = true;
                saveCatalogToStorage();
                alert('✅ Каталог версии 3.0 импортирован (' + state.catalog.plants.length + ' растений)');
                renderAll();
            } else if (data.plants) {
                const converted = convertOldCatalog(data);
                state.catalog = converted;
                state.catalogLoaded = true;
                saveCatalogToStorage();
                alert('✅ Старый каталог преобразован в версию 3.0 (' + state.catalog.plants.length + ' растений)');
                renderAll();
            } else {
                alert('❌ Неверный формат файла. Ожидается { "version": "3.0", "plants": [...], "characteristics": [...] }');
            }
        } catch (err) {
            alert('❌ Ошибка чтения файла: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function exportCatalog() {
    if (state.catalog.plants.length === 0) {
        alert('Каталог пуст. Нечего экспортировать.');
        return;
    }
    const blob = new Blob([JSON.stringify(state.catalog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog_v3_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function clearCatalog() {
    if (state.catalog.plants.length === 0) {
        alert('Каталог уже пуст.');
        return;
    }
    if (!confirm('🗑 Удалить весь каталог растений? Растения в ваших коллекциях не пострадают, но справочная информация исчезнет.')) return;
    state.catalog = { version: '3.0', characteristics: [], plants: [] };
    state.catalogLoaded = false;
    localStorage.removeItem('customCatalog');
    updateCatalogStatus();
    renderCatalog();
    alert('✅ Каталог очищен');
}

// ================================================================
// ПРЕВЬЮ КАТАЛОГА И ДОБАВЛЕНИЕ В КОЛЛЕКЦИЮ
// ================================================================

function showCatalogPreview(catalogId) {
    const plant = getCatalogPlant(catalogId);
    if (!plant) {
        alert('Растение не найдено в каталоге');
        return;
    }
    
    if (state.bases.length === 0) {
        alert('Сначала создайте коллекцию в разделе "Коллекции"');
        return;
    }
    
    const myBases = state.bases.filter(b => b.owner === 'Вы');
    if (myBases.length === 0) {
        alert('У вас нет своих коллекций. Создайте коллекцию в разделе "Коллекции"');
        return;
    }
    
    const basesOptions = myBases.map(b => 
        `<option value="${b.id}">${b.icon} ${getBaseDisplayName(b)}</option>`
    ).join('');
    
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    let factsHtml = '';
    if (plant.facts && plant.facts.length > 0) {
        const charMap = {};
        state.catalog.characteristics.forEach(c => charMap[c.id] = c);
        factsHtml = '<div style="margin-top:12px;"><div style="font-weight:600;font-size:14px;margin-bottom:4px;">📖 Справка</div>';
        plant.facts.slice(0, 3).forEach(fact => {
            const char = charMap[fact.characteristic_id];
            const icon = char ? char.icon : '📌';
            factsHtml += `
                <div style="background:#f4f7f4;border-radius:8px;padding:8px 12px;margin-bottom:6px;">
                    <div style="font-weight:600;font-size:13px;">${icon} ${char ? char.name : 'Информация'}</div>
                    <div style="font-size:13px;color:#2d4a2d;">${fact.short}</div>
                    ${fact.source ? `<div style="font-size:11px;color:#8aa08a;margin-top:2px;">📚 ${fact.source}</div>` : ''}
                </div>
            `;
        });
        if (plant.facts.length > 3) {
            factsHtml += `<div style="font-size:12px;color:#8aa08a;text-align:center;">+ еще ${plant.facts.length - 3} фактов</div>`;
        }
        factsHtml += '</div>';
    }

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
                ${factsHtml}
                <div style="margin-top:14px;">
                    <label style="font-weight:600;display:block;margin-bottom:4px;">Добавить в коллекцию:</label>
                    <select id="previewBaseSelect" style="width:100%;padding:10px;border-radius:12px;border:1px solid #dce4dc;margin-bottom:8px;font-size:14px;">${basesOptions}</select>

                    <label style="font-weight:600;display:block;margin-bottom:4px;">📍 Расположение:</label>
                    <input id="previewPlacement" placeholder="Гостиная, кухня..." style="width:100%;padding:10px;border-radius:12px;border:1px solid #dce4dc;margin-bottom:8px;font-size:14px;" list="previewLocationSuggestions">
                    <datalist id="previewLocationSuggestions"></datalist>

                    <label style="font-weight:600;display:block;margin-bottom:4px;">🌱 Дата посадки (месяц-год):</label>
                    <input id="previewPlantingDate" type="month" value="${currentMonth}" style="width:100%;padding:10px;border-radius:12px;border:1px solid #dce4dc;margin-bottom:8px;font-size:14px;">

                    <button class="btn" onclick="addFromCatalogPreview('${plant.id}')" style="margin-top:4px;">➕ Добавить в коллекцию</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
        updateLocationSuggestionsForPreview();
    }, 100);

    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
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

document.addEventListener('change', function(e) {
    if (e.target.id === 'previewBaseSelect') {
        updateLocationSuggestionsForPreview();
    }
});

function addFromCatalogPreview(catalogId) {
    const select = document.getElementById('previewBaseSelect');
    const baseId = select ? select.value : null;
    
    if (!baseId || !getBase(baseId)) {
        alert('Выберите коллекцию');
        return;
    }

    const plant = getCatalogPlant(catalogId);
    if (!plant) {
        alert('Растение не найдено в каталоге');
        return;
    }

    const today = getLocalDateStr(new Date());
    const currentMonth = new Date().toISOString().slice(0, 7);

    const flower = {
        id: 'flower_' + generateUUID(),
        catalog_id: plant.id,
        base_id: baseId,
        source_type: 'catalog',
        
        name: plant.name,
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
        notes: plant.default_soil ? 'Грунт: ' + plant.default_soil : '',
        latin_name: '',
        
        catalog_name: plant.name,
        catalog_icon: plant.icon || '🌿',
        catalog_description: plant.description || '',
        
        // ← ИСТОРИЯ ПУСТАЯ, БУДЕТ ЗАПОЛНЯТЬСЯ ПРИ ДЕЙСТВИЯХ
        history: [],
        
        createdAt: new Date().toISOString()
    };

    state.flowers.push(flower);
    saveState();
    
    const previewModal = document.getElementById('previewModal');
    if (previewModal) previewModal.remove();
    
    renderAll();
    renderCare();
    renderCalendar();
    
    alert('✅ ' + plant.name + ' добавлен в коллекцию!');
}

function updateLocationSuggestions() {
    const baseId = state.currentBaseId;
    const datalist = document.getElementById('locationSuggestions');
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
