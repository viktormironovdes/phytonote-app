// ================================================================
// КАРТОЧКА РАСТЕНИЯ
// ================================================================

function showAddPlantModal(editId) {
    if (!isBaseEditable(state.currentBaseId)) {
        alert('Это чужая коллекция, вы не можете добавлять растения.');
        return;
    }

    updateLocationSuggestions();

    const modal = document.getElementById('plantModal');
    modal.classList.add('show');
    document.getElementById('plantModalTitle').textContent = editId ? '✏️ Редактировать' : '➕ Новое растение';
    document.getElementById('editFlowerId').value = editId || '';

    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    document.querySelectorAll('#plantModal input[type="date"]').forEach(input => {
        input.setAttribute('max', today);
    });

    if (editId) {
        const f = getFlower(editId);
        if (f) {
            document.getElementById('fName').value = f.name || '';
            document.getElementById('fLatinName').value = f.latin_name || '';
            document.getElementById('fPlantingDate').value = f.planting_date || currentMonth;
            document.getElementById('fPlacement').value = f.placement || '';
            document.getElementById('fLight').value = f.light || 'Рассеянный свет';
            document.getElementById('fCondition').value = f.condition || 'Хорошее';
            document.getElementById('fWaterSummer').value = f.watering_summer || 3;
            document.getElementById('fWaterWinter').value = f.watering_winter || 7;
            document.getElementById('fFert').value = f.fertilizing || 30;
            document.getElementById('fFertStart').value = f.fertilizing_start || 3;
            document.getElementById('fFertEnd').value = f.fertilizing_end || 10;
            document.getElementById('fRepot').value = f.repot_interval || 2;
            document.getElementById('fNotes').value = f.notes || '';
            return;
        }
    }

    document.getElementById('fName').value = '';
    document.getElementById('fLatinName').value = '';
    document.getElementById('fPlantingDate').value = currentMonth;
    document.getElementById('fPlacement').value = '';
    document.getElementById('fLight').value = 'Рассеянный свет';
    document.getElementById('fCondition').value = 'Хорошее';
    document.getElementById('fWaterSummer').value = 3;
    document.getElementById('fWaterWinter').value = 7;
    document.getElementById('fFert').value = 30;
    document.getElementById('fFertStart').value = 3;
    document.getElementById('fFertEnd').value = 10;
    document.getElementById('fRepot').value = 2;
    document.getElementById('fNotes').value = '';
}

function closePlantModal() {
    document.getElementById('plantModal').classList.remove('show');
}

function validatePlantForm() {
    const name = document.getElementById('fName').value.trim();
    if (!name) {
        alert('❌ Введите название растения');
        return false;
    }

    const plantingDate = document.getElementById('fPlantingDate').value;
    if (!plantingDate) {
        alert('❌ Выберите дату посадки');
        return false;
    }

    const waterSummer = parseInt(document.getElementById('fWaterSummer').value);
    if (isNaN(waterSummer) || waterSummer < 1) {
        alert('❌ Полив летом должен быть минимум 1 день');
        document.getElementById('fWaterSummer').value = 3;
        return false;
    }

    const waterWinter = parseInt(document.getElementById('fWaterWinter').value);
    if (isNaN(waterWinter) || waterWinter < 1) {
        alert('❌ Полив зимой должен быть минимум 1 день');
        document.getElementById('fWaterWinter').value = 7;
        return false;
    }

    const fertilizing = parseInt(document.getElementById('fFert').value);
    if (isNaN(fertilizing) || fertilizing < 0) {
        alert('❌ Подкормка не может быть отрицательной');
        document.getElementById('fFert').value = 30;
        return false;
    }

    const repot = parseInt(document.getElementById('fRepot').value);
    if (isNaN(repot) || repot < 1) {
        alert('❌ Пересадка должна быть минимум 1 год');
        document.getElementById('fRepot').value = 2;
        return false;
    }

    return true;
}

function saveFlower() {
    if (!validatePlantForm()) return;

    const editId = document.getElementById('editFlowerId').value;
    const today = new Date().toISOString().split('T')[0];

    const data = {
        name: document.getElementById('fName').value.trim(),
        latin_name: document.getElementById('fLatinName').value.trim(),
        planting_date: document.getElementById('fPlantingDate').value,
        placement: document.getElementById('fPlacement').value || '—',
        light: document.getElementById('fLight').value,
        condition: document.getElementById('fCondition').value,
        watering_summer: parseInt(document.getElementById('fWaterSummer').value) || 3,
        watering_winter: parseInt(document.getElementById('fWaterWinter').value) || 7,
        fertilizing: parseInt(document.getElementById('fFert').value) || 30,
        fertilizing_start: parseInt(document.getElementById('fFertStart').value) || 3,
        fertilizing_end: parseInt(document.getElementById('fFertEnd').value) || 10,
        repot_interval: parseInt(document.getElementById('fRepot').value) || 2,
        notes: document.getElementById('fNotes').value.trim(),
    };

    if (editId) {
        const f = getFlower(editId);
        if (f) {
            Object.assign(f, data);
            saveState();
            closePlantModal();
            renderAll();
            renderCare();
            renderCalendar();
            alert('✅ Изменения сохранены!');
        }
    } else {
        const flower = {
            id: 'flower_' + generateUUID(),
            catalog_id: null,
            base_id: state.currentBaseId,
            source_type: 'manual',
            photo: null,
            ...data,
            catalog_name: data.name,
            catalog_icon: '🌿',
            catalog_description: '',
            history: [],
            createdAt: new Date().toISOString()
        };
        state.flowers.push(flower);
        saveState();
        closePlantModal();
        renderAll();
        renderCare();
        renderCalendar();
        alert('✅ Растение добавлено!');
    }
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

// ================================================================
// ДЕТАЛЬНЫЙ ПРОСМОТР
// ================================================================

function showDetail(flowerId) {
    state.detailFlowerId = flowerId;
    state.isDetailEdit = false;
    state.isExpanded = false;
    state.detailTab = 'main';
    renderDetail();
    document.getElementById('detailModal').classList.add('show');
}

function toggleExpand() {
    state.isExpanded = !state.isExpanded;
    renderDetail();
}

function switchDetailTab(tab) {
    state.detailTab = tab;
    renderDetail();
}

function toggleDetailEdit() {
    const f = getFlower(state.detailFlowerId);
    if (!f) return;
    if (!isBaseEditable(f.base_id)) {
        alert('Это чужая коллекция, редактирование недоступно.');
        return;
    }
    state.isDetailEdit = !state.isDetailEdit;
    renderDetail();
}

function renderDetail() {
    const f = getFlower(state.detailFlowerId);
    if (!f) return;

    const base = getBase(f.base_id);
    const isEditable = isBaseEditable(f.base_id);
    const history = getHistoryByFlower(f.id);
    const settings = state.user.display_settings || {};
    const editMode = state.isDetailEdit && isEditable;
    const expanded = state.isExpanded;
    const today = getLocalDateStr(new Date());

    const status = getWateringStatus(f);
    const days = getDaysUntilWatering(f);
    const statusText = status === 'red' ? '🔴 Пора поливать' : status === 'yellow' ? '🟡 Скоро полив' : '🟢 В норме';
    const fertStatus = getFertilizingStatus(f);
    const ageDisplay = f.planting_date ? calculateAge(f.planting_date) : 'Неизвестно';
    const displayName = f.catalog_name || f.name;
    const displayIcon = f.catalog_icon || '🌿';

    const fertilizingPeriod = f.fertilizing_start && f.fertilizing_end ?
        `с ${['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'][f.fertilizing_start-1]} по ${['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'][f.fertilizing_end-1]}` :
        'Не указан';

    // История (последние 5 записей)
    const historyHtml = history.slice(0, 5).map(h => {
        const typeMap = { watering: '💧 Полив', fertilizing: '🧪 Подкормка', repotting: '🔄 Пересадка' };
        return `
            <div class="history-item">
                <span>${h.date}</span>
                <span>${typeMap[h.type] || h.type}</span>
                <span>${h.notes || ''}</span>
                ${isEditable ? `<button class="btn btn-sm btn-outline" onclick="editHistoryEvent('${f.id}', '${h.id}')" style="padding:2px 8px;font-size:11px;">✏️</button>` : ''}
                ${isEditable ? `<button class="btn btn-sm btn-outline" onclick="deleteHistoryEvent('${f.id}', '${h.id}')" style="padding:2px 8px;font-size:11px;color:#d9534f;border-color:#f0d0d0;">🗑</button>` : ''}
            </div>
        `;
    }).join('') || 'Нет истории';

    // ФОТО
    const photoHtml = `
        <div class="detail-header">
            <div class="photo-container" onclick="${isEditable ? `document.getElementById('flowerPhotoInput').click()` : ''}">
                ${f.photo ? `<img src="${f.photo}" alt="${displayName}">` : `<div class="no-photo">${displayIcon}</div>`}
                <div class="photo-hint">${isEditable ? 'Нажмите, чтобы заменить фото' : ''}</div>
                ${isEditable ? `<input type="file" id="flowerPhotoInput" accept="image/*" style="display:none" onchange="handleFlowerPhotoUpload('${f.id}')">` : ''}
            </div>
            ${isEditable ? `
                <button class="edit-btn-overlay" onclick="${editMode ? 'saveDetailEdit()' : 'toggleDetailEdit()'}" title="${editMode ? 'Сохранить' : 'Редактировать'}">
                    ${editMode ? '💾' : '✏️'}
                </button>
            ` : ''}
            <button class="close-btn-overlay" onclick="closeDetailModal()" title="Закрыть">✕</button>
        </div>
    `;

    // ВКЛАДКИ
    const tabsHtml = `
        <div class="detail-tabs">
            <button class="${state.detailTab === 'main' ? 'active' : ''}" onclick="switchDetailTab('main')">📋 Основное</button>
            <button class="${state.detailTab === 'info' ? 'active' : ''}" onclick="switchDetailTab('info')">📖 Справка</button>
        </div>
    `;

    // ВКЛАДКА "ОСНОВНОЕ"
    let mainContent = `
        <div class="detail-field">
            <span class="label">🌿 Название</span>
            <span class="value" style="font-weight:700;font-size:18px;">${displayName}</span>
        </div>
    `;

    const catalogPlant = getCatalogPlant(f.catalog_id);
    const latinName = catalogPlant?.facts?.find(f => f.characteristic_id === 'botanical_name')?.short || f.latin_name || '';
    if (settings.show_latin_name && latinName) {
        mainContent += `
            <div class="detail-field">
                <span class="label">🔬 Ботаническое</span>
                <span class="value value-italic">${latinName}</span>
            </div>
        `;
    }

    const soilFact = catalogPlant?.facts?.find(f => f.characteristic_id === 'soil');
    const soilText = soilFact?.short || f.soil || '—';
    if (expanded) {
        mainContent += `
            <div class="detail-field">
                <span class="label">🌱 Грунт</span>
                <span class="value">${soilText}</span>
            </div>
        `;
    }

    if (settings.show_placement || expanded) {
        mainContent += `
            <div class="detail-field">
                <span class="label">📍 Расположение</span>
                ${editMode ? `<input id="editPlacement" value="${f.placement || ''}" list="editLocationSuggestions"><datalist id="editLocationSuggestions"></datalist>` : `<span class="value">${f.placement || '—'}</span>`}
            </div>
        `;
    }

    if (settings.show_planting_date || expanded) {
        mainContent += `
            <div class="detail-field">
                <span class="label">🌱 Посажено</span>
                ${editMode ? `<input id="editPlantingDate" type="month" value="${f.planting_date || ''}">` : `<span class="value">${f.planting_date ? new Date(f.planting_date).toLocaleString('ru', { month: 'long', year: 'numeric' }) : '—'} (${ageDisplay})</span>`}
            </div>
        `;
    }

    if (settings.show_condition || expanded) {
        mainContent += `
            <div class="detail-field">
                <span class="label">💚 Состояние</span>
                ${editMode ? `
                    <select id="editCondition">
                        <option value="Отличное" ${f.condition === 'Отличное' ? 'selected' : ''}>💚 Отличное</option>
                        <option value="Хорошее" ${f.condition === 'Хорошее' ? 'selected' : ''}>💛 Хорошее</option>
                        <option value="Удовлетворительное" ${f.condition === 'Удовлетворительное' ? 'selected' : ''}>🧡 Удовл.</option>
                        <option value="Плохое" ${f.condition === 'Плохое' ? 'selected' : ''}>❤️ Плохое</option>
                    </select>
                ` : `<span class="value">${f.condition || '—'}</span>`}
            </div>
        `;
    }

    if (settings.show_light || expanded) {
        mainContent += `
            <div class="detail-field">
                <span class="label">☀️ Освещённость</span>
                ${editMode ? `
                    <select id="editLight">
                        <option value="Яркий свет" ${f.light === 'Яркий свет' ? 'selected' : ''}>☀️ Яркий свет</option>
                        <option value="Рассеянный свет" ${f.light === 'Рассеянный свет' ? 'selected' : ''}>🌤 Рассеянный</option>
                        <option value="Полутень" ${f.light === 'Полутень' ? 'selected' : ''}>🌥 Полутень</option>
                        <option value="Тень" ${f.light === 'Тень' ? 'selected' : ''}>🌑 Тень</option>
                    </select>
                ` : `<span class="value">${f.light || '—'}</span>`}
            </div>
        `;
    }

    if (settings.show_watering || expanded) {
        mainContent += `
            <div class="detail-field">
                <span class="label">💧 Полив</span>
                <span class="value">${days > 0 ? 'Через ' + days + ' дн.' : 'Сегодня'} (${statusText})</span>
            </div>
        `;
    }

    if (settings.show_fertilizing || expanded) {
        mainContent += `
            <div class="detail-field">
                <span class="label">🧪 Подкормка</span>
                <span class="value">${fertStatus}</span>
            </div>
        `;
    }

    if ((settings.show_fertilizing_period || expanded) && f.fertilizing > 0) {
        mainContent += `
            <div class="detail-field">
                <span class="label">📅 Период подкормки</span>
                ${editMode ? `
                    <div style="display:flex;gap:8px;width:60%;">
                        <select id="editFertStart" style="flex:1;">
                            ${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => `<option value="${m}" ${f.fertilizing_start === m ? 'selected' : ''}>${['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'][m-1]}</option>`).join('')}
                        </select>
                        <span style="color:#5c725c;">—</span>
                        <select id="editFertEnd" style="flex:1;">
                            ${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => `<option value="${m}" ${f.fertilizing_end === m ? 'selected' : ''}>${['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'][m-1]}</option>`).join('')}
                        </select>
                    </div>
                ` : `<span class="value">${fertilizingPeriod}</span>`}
            </div>
        `;
    }

    if ((settings.show_last_repotting || expanded)) {
        const lastRepotDate = getLastRepottingDate(f);
        mainContent += `
            <div class="detail-field">
                <span class="label">🔄 Последняя пересадка</span>
                <span class="value">${lastRepotDate || '—'}</span>
            </div>
        `;
    }

    if (settings.show_notes || expanded) {
        mainContent += `
            <div class="detail-field">
                <span class="label">📝 Примечания</span>
                ${editMode ? `<textarea id="editNotes" rows="2" style="width:60%;">${f.notes || ''}</textarea>` : `<span class="value">${f.notes || '—'}</span>`}
            </div>
        `;
    }

    // РАЗВЕРНУТЫЕ ПАРАМЕТРЫ
    let expandedContent = '';
    if (expanded) {
        let allBasesOptions = state.bases
            .filter(b => b.owner === 'Вы')
            .map(b => `<option value="${b.id}" ${b.id === f.base_id ? 'selected' : ''}>${b.icon} ${getBaseDisplayName(b)}</option>`)
            .join('');

        expandedContent = `
            <div style="margin-top:8px;border-top:1px solid #eef3ee;padding-top:8px;">
                <div style="font-weight:600;font-size:13px;color:#5c725c;margin-bottom:6px;">🔧 Все характеристики</div>
                <div class="detail-field">
                    <span class="label">📁 Коллекция</span>
                    ${editMode ? `
                        <select id="editBase">
                            ${allBasesOptions}
                        </select>
                    ` : `<span class="value">${base ? getBaseDisplayName(base) + (base.owner !== 'Вы' ? ' (👤 ' + base.owner + ')' : '') : '—'}</span>`}
                </div>
                <div class="detail-field">
                    <span class="label">💧 Полив (лето)</span>
                    ${editMode ? `<input id="editWaterSummer" type="number" min="1" value="${f.watering_summer}">` : `<span class="value">${f.watering_summer} дн.</span>`}
                </div>
                <div class="detail-field">
                    <span class="label">💧 Полив (зима)</span>
                    ${editMode ? `<input id="editWaterWinter" type="number" min="1" value="${f.watering_winter}">` : `<span class="value">${f.watering_winter} дн.</span>`}
                </div>
                <div class="detail-field">
                    <span class="label">🧪 Интервал подкормки</span>
                    ${editMode ? `<input id="editFert" type="number" min="0" value="${f.fertilizing}">` : `<span class="value">${f.fertilizing > 0 ? f.fertilizing + ' дн.' : 'Нет'}</span>`}
                </div>
                <div class="detail-field">
                    <span class="label">📅 Период подкормки</span>
                    <span class="value">${fertilizingPeriod}</span>
                </div>
                <div class="detail-field">
                    <span class="label">🔄 Пересадка</span>
                    ${editMode ? `<input id="editRepot" type="number" min="1" value="${f.repot_interval}">` : `<span class="value">${f.repot_interval} лет</span>`}
                </div>
                ${editMode ? `
                    <div class="detail-field">
                        <span class="label">📝 Примечания</span>
                        <textarea id="editNotesExpanded" rows="2" style="width:60%;">${f.notes || ''}</textarea>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // КНОПКА РАЗВЕРНУТЬ/СВЕРНУТЬ
    const expandBtnHtml = `
        <button class="btn-expand" onclick="toggleExpand()" style="margin-top:12px;">
            ${expanded ? 'Свернуть все характеристики' : 'Развернуть все характеристики'}
            <span class="arrow ${expanded ? 'open' : ''}">▼</span>
        </button>
    `;

    // ИСТОРИЯ (после кнопки разворачивания)
    const historyBlock = `
        <div style="margin-top:12px;padding:0 20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="font-weight:600;font-size:14px;">📜 История ухода</div>
                ${isEditable ? `<button class="btn btn-sm btn-success" onclick="showAddHistoryEventModal('${f.id}')" style="padding:4px 12px;font-size:12px;width:auto;">➕ Добавить</button>` : ''}
            </div>
            ${historyHtml}
        </div>
    `;

    // ВКЛАДКА "СПРАВКА"
    let infoContent = '';
    if (isCatalogLoaded() && f.catalog_id) {
        const plant = getCatalogPlant(f.catalog_id);
        const facts = plant?.facts || [];
        const charMap = {};
        state.catalog.characteristics.forEach(c => charMap[c.id] = c);

        if (facts.length > 0) {
            infoContent = facts.map(fact => {
                const char = charMap[fact.characteristic_id];
                const icon = char ? char.icon : '📌';
                const name = char ? char.name : 'Информация';
                return `
                    <div class="info-fact-item" onclick="showFactDetail('${f.catalog_id}', '${fact.characteristic_id}')">
                        <div class="fact-title">
                            ${icon} ${name}
                        </div>
                        <div class="fact-text">${fact.short}</div>
                        ${fact.source ? `<div class="fact-source">📚 ${fact.source}</div>` : ''}
                    </div>
                `;
            }).join('');
        } else {
            infoContent = `
                <div style="text-align:center;padding:30px 0;color:#8aa08a;">
                    📖 Нет справочной информации о растении
                </div>
            `;
        }
    } else if (!isCatalogLoaded()) {
        infoContent = `
            <div style="text-align:center;padding:30px 0;color:#8aa08a;">
                📚 Каталог не загружен
                <p style="font-size:13px;margin-top:4px;">Импортируйте каталог в разделе "Профиль"</p>
                <button class="btn btn-sm btn-outline" onclick="navigateTo('profile')" style="margin-top:8px;width:auto;">Перейти</button>
            </div>
        `;
    } else {
        infoContent = `
            <div style="text-align:center;padding:30px 0;color:#8aa08a;">
                📖 Нет справочной информации
            </div>
        `;
    }

    // СТАТИЧНЫЕ КНОПКИ
    const actionsHtml = `
        <div class="detail-actions-main">
            ${isEditable ? `
                <button class="btn btn-success" onclick="detailWaterNow()" style="flex:1;">💧 Полив</button>
                <button class="btn btn-success" onclick="detailFertilizeNow()" style="flex:1;">🧪 Подкормка</button>
                <button class="btn btn-success" onclick="detailRepotNow()" style="flex:1;">🔄 Пересадка</button>
            ` : `
                <span class="readonly-badge" style="margin:auto;padding:10px;">🔒 Только просмотр</span>
            `}
        </div>
        ${isEditable ? `
            <div class="detail-actions-secondary">
                <button class="btn btn-sm btn-outline" onclick="showCloneModal()">📋 Клонировать</button>
                <button class="btn btn-sm btn-outline" onclick="showMoveModal()">📦 Переместить</button>
                <button class="btn btn-sm btn-danger" onclick="deleteFlower()">🗑 Удалить</button>
            </div>
        ` : ''}
    `;

    // СБОРКА
    const detailHtml = `
        ${photoHtml}
        <div style="padding:0 0 8px 0;">
            ${tabsHtml}
            <div class="detail-tab-content ${state.detailTab === 'main' ? 'active' : ''}" style="padding:0 20px;">
                ${mainContent}
                ${expandedContent}
                ${expandBtnHtml}
                ${historyBlock}
            </div>
            <div class="detail-tab-content ${state.detailTab === 'info' ? 'active' : ''}" style="padding:0 20px;">
                ${infoContent}
            </div>
            ${actionsHtml}
        </div>
    `;

    document.getElementById('detailBody').innerHTML = detailHtml;

    if (editMode) {
        const editDatalist = document.getElementById('editLocationSuggestions');
        if (editDatalist) {
            const locations = new Set();
            state.flowers
                .filter(fl => fl.base_id === f.base_id)
                .forEach(fl => {
                    if (fl.placement && fl.placement !== '—') {
                        locations.add(fl.placement);
                    }
                });
            editDatalist.innerHTML = [...locations]
                .map(l => `<option value="${l}">`)
                .join('');
        }
    }
}

// ================================================================
// РАБОТА С ИСТОРИЕЙ В КАРТОЧКЕ
// ================================================================

function showAddHistoryEventModal(flowerId) {
    const f = getFlower(flowerId);
    if (!f) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
        <div class="modal-content">
            <h2>➕ Добавить событие</h2>
            <div class="modal-scroll">
                <label>Тип события</label>
                <select id="newHistoryType" style="width:calc(100% - 40px);margin:0 20px;padding:10px;border-radius:12px;border:1px solid #dce4dc;font-size:14px;">
                    <option value="watering">💧 Полив</option>
                    <option value="fertilizing">🧪 Подкормка</option>
                    <option value="repotting">🔄 Пересадка</option>
                </select>
                <label style="margin-top:10px;">Дата</label>
                <input id="newHistoryDate" type="date" value="${getLocalDateStr(new Date())}" style="width:calc(100% - 40px);margin:0 20px;padding:10px;border-radius:12px;border:1px solid #dce4dc;font-size:14px;">
                <label style="margin-top:10px;">Примечание</label>
                <input id="newHistoryNotes" placeholder="Дополнительная информация..." style="width:calc(100% - 40px);margin:0 20px;padding:10px;border-radius:12px;border:1px solid #dce4dc;font-size:14px;">
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').classList.remove('show')">Отмена</button>
                <button class="btn-save" onclick="addHistoryEventFromModal('${flowerId}')">Добавить</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });
}

function addHistoryEventFromModal(flowerId) {
    const f = getFlower(flowerId);
    if (!f) return;
    
    const type = document.getElementById('newHistoryType').value;
    const date = document.getElementById('newHistoryDate').value;
    const notes = document.getElementById('newHistoryNotes').value.trim();
    
    if (!date) {
        alert('Выберите дату');
        return;
    }
    
    addHistoryEvent(f, type, date, notes);
    saveState();
    document.querySelector('#detailModal .modal-overlay.show')?.classList.remove('show');
    // Закрываем модалку добавления
    document.querySelectorAll('.modal-overlay.show').forEach(el => {
        if (el.id !== 'detailModal') el.classList.remove('show');
    });
    renderDetail();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Событие добавлено в историю!');
}

function editHistoryEvent(flowerId, eventId) {
    const f = getFlower(flowerId);
    if (!f) return;
    const event = f.history.find(h => h.id === eventId);
    if (!event) return;
    
    const typeMap = { watering: '💧 Полив', fertilizing: '🧪 Подкормка', repotting: '🔄 Пересадка' };
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
        <div class="modal-content">
            <h2>✏️ Редактировать событие</h2>
            <div class="modal-scroll">
                <label>Тип события</label>
                <select id="editHistoryType" style="width:calc(100% - 40px);margin:0 20px;padding:10px;border-radius:12px;border:1px solid #dce4dc;font-size:14px;">
                    <option value="watering" ${event.type === 'watering' ? 'selected' : ''}>💧 Полив</option>
                    <option value="fertilizing" ${event.type === 'fertilizing' ? 'selected' : ''}>🧪 Подкормка</option>
                    <option value="repotting" ${event.type === 'repotting' ? 'selected' : ''}>🔄 Пересадка</option>
                </select>
                <label style="margin-top:10px;">Дата</label>
                <input id="editHistoryDate" type="date" value="${event.date}" style="width:calc(100% - 40px);margin:0 20px;padding:10px;border-radius:12px;border:1px solid #dce4dc;font-size:14px;">
                <label style="margin-top:10px;">Примечание</label>
                <input id="editHistoryNotes" placeholder="Дополнительная информация..." value="${event.notes || ''}" style="width:calc(100% - 40px);margin:0 20px;padding:10px;border-radius:12px;border:1px solid #dce4dc;font-size:14px;">
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').classList.remove('show')">Отмена</button>
                <button class="btn-save" onclick="saveHistoryEventEdit('${flowerId}', '${eventId}')">Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });
}

function saveHistoryEventEdit(flowerId, eventId) {
    const f = getFlower(flowerId);
    if (!f) return;
    
    const type = document.getElementById('editHistoryType').value;
    const date = document.getElementById('editHistoryDate').value;
    const notes = document.getElementById('editHistoryNotes').value.trim();
    
    if (!date) {
        alert('Выберите дату');
        return;
    }
    
    const event = f.history.find(h => h.id === eventId);
    if (event) {
        event.type = type;
        event.date = date;
        event.notes = notes;
        saveState();
    }
    
    document.querySelectorAll('.modal-overlay.show').forEach(el => {
        if (el.id !== 'detailModal') el.classList.remove('show');
    });
    renderDetail();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Событие обновлено!');
}

function deleteHistoryEvent(flowerId, eventId) {
    if (!confirm('Удалить эту запись из истории?')) return;
    const f = getFlower(flowerId);
    if (!f) return;
    deleteHistoryEvent(f, eventId);
    saveState();
    renderDetail();
    renderAll();
    renderCare();
    renderCalendar();
}

// ================================================================
// СОХРАНЕНИЕ ИЗМЕНЕНИЙ В КАРТОЧКЕ
// ================================================================

function saveDetailEdit() {
    const f = getFlower(state.detailFlowerId);
    if (!f) return;

    const placementInput = document.getElementById('editPlacement');
    if (placementInput) f.placement = placementInput.value.trim() || '—';

    const plantingInput = document.getElementById('editPlantingDate');
    if (plantingInput) f.planting_date = plantingInput.value;

    const conditionInput = document.getElementById('editCondition');
    if (conditionInput) f.condition = conditionInput.value;

    const lightInput = document.getElementById('editLight');
    if (lightInput) f.light = lightInput.value;

    const baseInput = document.getElementById('editBase');
    if (baseInput) {
        const newBaseId = baseInput.value;
        if (newBaseId !== f.base_id && getBase(newBaseId)) {
            f.base_id = newBaseId;
        }
    }

    const waterSummerInput = document.getElementById('editWaterSummer');
    if (waterSummerInput) f.watering_summer = parseInt(waterSummerInput.value) || 3;

    const waterWinterInput = document.getElementById('editWaterWinter');
    if (waterWinterInput) f.watering_winter = parseInt(waterWinterInput.value) || 7;

    const fertInput = document.getElementById('editFert');
    if (fertInput) f.fertilizing = parseInt(fertInput.value) || 0;

    const fertStartInput = document.getElementById('editFertStart');
    if (fertStartInput) f.fertilizing_start = parseInt(fertStartInput.value) || 3;

    const fertEndInput = document.getElementById('editFertEnd');
    if (fertEndInput) f.fertilizing_end = parseInt(fertEndInput.value) || 10;

    const repotInput = document.getElementById('editRepot');
    if (repotInput) f.repot_interval = parseInt(repotInput.value) || 2;

    const notesInput = document.getElementById('editNotes') || document.getElementById('editNotesExpanded');
    if (notesInput) f.notes = notesInput.value.trim();

    state.isDetailEdit = false;
    saveState();
    renderDetail();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Изменения сохранены!');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('show');
    state.detailFlowerId = null;
    state.isDetailEdit = false;
    state.isExpanded = false;
    state.detailTab = 'main';
}

function showReadOnlyDetail(flowerId) {
    state.detailFlowerId = flowerId;
    state.isDetailEdit = false;
    state.isExpanded = false;
    state.detailTab = 'main';
    renderDetail();
    document.getElementById('detailModal').classList.add('show');
}

// ================================================================
// ДЕЙСТВИЯ (ПОЛИВ, ПОДКОРМКА, ПЕРЕСАДКА)
// ================================================================

function detailWaterNow() {
    const f = getFlower(state.detailFlowerId);
    if (!f) return;
    if (!isBaseEditable(f.base_id)) { alert('Это чужая коллекция'); return; }
    const today = getLocalDateStr(new Date());
    
    // Проверяем, не было ли уже полива сегодня
    const existing = (f.history || []).some(h => h.date === today && h.type === 'watering');
    if (existing) {
        alert('Полив уже отмечен сегодня');
        return;
    }
    
    addHistoryEvent(f, 'watering', today, 'Полив');
    saveState();
    renderDetail();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Полив отмечен!');
}

function detailFertilizeNow() {
    const f = getFlower(state.detailFlowerId);
    if (!f) return;
    if (!isBaseEditable(f.base_id)) { alert('Это чужая коллекция'); return; }
    const today = getLocalDateStr(new Date());
    
    const existing = (f.history || []).some(h => h.date === today && h.type === 'fertilizing');
    if (existing) {
        alert('Подкормка уже отмечена сегодня');
        return;
    }
    
    addHistoryEvent(f, 'fertilizing', today, 'Подкормка');
    saveState();
    renderDetail();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Подкормка отмечена!');
}

function detailRepotNow() {
    const f = getFlower(state.detailFlowerId);
    if (!f) return;
    if (!isBaseEditable(f.base_id)) { alert('Это чужая коллекция'); return; }
    const today = getLocalDateStr(new Date());
    
    const existing = (f.history || []).some(h => h.date === today && h.type === 'repotting');
    if (existing) {
        alert('Пересадка уже отмечена сегодня');
        return;
    }
    
    addHistoryEvent(f, 'repotting', today, 'Пересадка');
    saveState();
    renderDetail();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Пересадка отмечена!');
}

function deleteFlower() {
    if (!confirm('❌ Удалить это растение?')) return;
    const f = getFlower(state.detailFlowerId);
    if (!f) return;
    if (!isBaseEditable(f.base_id)) { alert('Это чужая коллекция'); return; }
    state.flowers = state.flowers.filter(fl => fl.id !== f.id);
    saveState();
    closeDetailModal();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Растение удалено');
}

// ================================================================
// ПЕРЕМЕЩЕНИЕ
// ================================================================

function showMoveModal() {
    const f = getFlower(state.detailFlowerId);
    if (!f) return;
    if (!isBaseEditable(f.base_id)) {
        alert('Нельзя переместить растение из чужой коллекции');
        return;
    }

    const myBases = state.bases.filter(b => b.owner === 'Вы' && b.id !== f.base_id);
    if (myBases.length === 0) {
        alert('Нет доступных коллекций для перемещения');
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.id = 'moveModal';
    overlay.innerHTML = `
        <div class="modal-content">
            <h2>📦 Переместить в коллекцию</h2>
            <div class="modal-scroll">
                <label>Выберите целевую коллекцию</label>
                <select id="moveBaseSelect" style="width:calc(100% - 40px);margin:0 20px;padding:10px;border-radius:12px;border:1px solid #dce4dc;font-size:14px;">
                    ${myBases.map(b => `<option value="${b.id}">${b.icon} ${getBaseDisplayName(b)}</option>`).join('')}
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').classList.remove('show')">Отмена</button>
                <button class="btn-save" onclick="executeMove()">Переместить</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });
}

function closeMoveModal() {
    const modal = document.getElementById('moveModal');
    if (modal) modal.classList.remove('show');
}

function executeMove() {
    const select = document.getElementById('moveBaseSelect');
    if (!select) return;
    const targetBaseId = select.value;
    const f = getFlower(state.detailFlowerId);
    if (!f) return;

    f.base_id = targetBaseId;
    saveState();
    closeMoveModal();
    closeDetailModal();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Растение перемещено в "' + getBaseDisplayName(getBase(targetBaseId)) + '"');
}

// ================================================================
// КЛОНИРОВАНИЕ
// ================================================================

function showCloneModal() {
    const myBases = state.bases.filter(b => b.owner === 'Вы');
    if (myBases.length === 0) { alert('У вас нет своих коллекций'); return; }
    const select = document.getElementById('cloneBaseSelect');
    select.innerHTML = myBases.map(b => `<option value="${b.id}">${b.icon} ${getBaseDisplayName(b)}</option>`).join('');
    document.getElementById('cloneModal').classList.add('show');
}

function closeCloneModal() {
    document.getElementById('cloneModal').classList.remove('show');
}

function executeClone() {
    const targetBaseId = document.getElementById('cloneBaseSelect').value;
    const original = getFlower(state.detailFlowerId);
    if (!original) return;

    const today = getLocalDateStr(new Date());

    const clone = {
        id: 'flower_' + generateUUID(),
        catalog_id: original.catalog_id,
        base_id: targetBaseId,
        source_type: 'cloned',
        name: original.name || original.catalog_name || 'Растение',
        latin_name: original.latin_name || '',
        placement: original.placement || '—',
        planting_date: original.planting_date || new Date().toISOString().slice(0, 7),
        photo: null,
        condition: original.condition || 'Хорошее',
        light: original.light || 'Рассеянный свет',
        watering_summer: original.watering_summer || 3,
        watering_winter: original.watering_winter || 7,
        fertilizing: original.fertilizing || 30,
        fertilizing_start: original.fertilizing_start || 3,
        fertilizing_end: original.fertilizing_end || 10,
        repot_interval: original.repot_interval || 2,
        notes: original.notes || '(клон)',
        catalog_name: original.catalog_name || original.name || 'Растение',
        catalog_icon: original.catalog_icon || '🌿',
        catalog_description: original.catalog_description || '',
        history: [],
        createdAt: new Date().toISOString()
    };

    state.flowers.push(clone);
    saveState();
    closeCloneModal();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Клон создан в коллекции "' + getBaseDisplayName(getBase(targetBaseId)) + '"');
}

function handleFlowerPhotoUpload(flowerId) {
    const f = getFlower(flowerId);
    if (!f) return;
    if (!isBaseEditable(f.base_id)) {
        alert('Это чужая коллекция, вы не можете менять фото.');
        return;
    }
    const input = document.getElementById('flowerPhotoInput');
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 600;
            canvas.width = size;
            canvas.height = size;
            ctx.drawImage(img, 0, 0, size, size);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            const flower = getFlower(flowerId);
            if (flower) {
                flower.photo = dataUrl;
                saveState();
                renderDetail();
                renderAll();
                renderCare();
                renderCalendar();
                alert('✅ Фото добавлено!');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
}
