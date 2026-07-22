// ================================================================
// КАРТОЧКА РАСТЕНИЯ - СТРАНИЦА
// ================================================================

function showDetail(flowerId) {
    state.detailFlowerId = flowerId;
    state.isDetailEdit = false;
    state.isExpanded = false;
    state.detailTab = 'main';
    state.historyFilter = 'all';
    state.previousPage = state.currentPage;
    navigateTo('detail', { flowerId: flowerId });
}

function renderDetailPage(flowerId) {
    const container = document.getElementById('detailContent');
    const f = getFlower(flowerId);
    if (!f) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:#8aa08a;">🌱 Растение не найдено</div>';
        return;
    }

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

    // ОБНОВЛЕНИЕ ШАПКИ: показываем кнопку редактирования
    const headerEditBtn = document.getElementById('headerDetailEditBtn');
    if (isEditable) {
        headerEditBtn.style.display = 'inline-block';
        headerEditBtn.textContent = editMode ? '💾' : '✏️';
        headerEditBtn.onclick = editMode ? saveDetailEdit : toggleDetailEdit;
    } else {
        headerEditBtn.style.display = 'none';
    }

    // ФОТО - без кнопки редактирования (она теперь в шапке)
    const photoHtml = `
        <div class="detail-header">
            <div class="photo-container" onclick="${editMode ? `document.getElementById('flowerPhotoInput').click()` : ''}">
                ${f.photo ? `<img src="${f.photo}" alt="${displayName}">` : `<div class="no-photo">${displayIcon}</div>`}
                <div class="photo-hint">${editMode ? 'Нажмите, чтобы заменить фото' : ''}</div>
                ${editMode ? `<input type="file" id="flowerPhotoInput" accept="image/*" style="display:none" onchange="handleFlowerPhotoUpload('${f.id}')">` : ''}
            </div>
        </div>
    `;

    // ВКЛАДКИ
    const tabsHtml = `
        <div class="detail-tabs">
            <button class="${state.detailTab === 'main' ? 'active' : ''}" onclick="switchDetailTab('main')">📋 Основное</button>
            <button class="${state.detailTab === 'info' ? 'active' : ''}" onclick="switchDetailTab('info')">📖 Справка</button>
            <button class="${state.detailTab === 'history' ? 'active' : ''}" onclick="switchDetailTab('history')">📜 История</button>
        </div>
    `;

    // ============================================================
    // ВКЛАДКА "ОСНОВНОЕ"
    // ============================================================
    let mainContent = `
        <div class="detail-field">
            <span class="label">🌿 Название</span>
            <span class="value" style="font-weight:700;font-size:18px;">${displayName}</span>
        </div>
    `;

    const catalogPlant = getCatalogPlant(f.catalog_id);
    const latinName = catalogPlant?.facts?.find(fact => fact.characteristic_id === 'botanical_name')?.short || f.latin_name || '';
    if (settings.show_latin_name && latinName) {
        mainContent += `
            <div class="detail-field">
                <span class="label">🔬 Ботаническое</span>
                <span class="value value-italic">${latinName}</span>
            </div>
        `;
    }

    const soilFact = catalogPlant?.facts?.find(fact => fact.characteristic_id === 'soil');
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
        <button class="btn-expand" onclick="toggleDetailExpand()" style="margin-top:12px;">
            ${expanded ? 'Свернуть все характеристики' : 'Развернуть все характеристики'}
            <span class="arrow ${expanded ? 'open' : ''}">▼</span>
        </button>
    `;

    // ============================================================
    // КНОПКИ "ПОЛИТЬ" / "ПОДКОРМИТЬ" / "ПЕРЕСАДИТЬ" (только в Основном)
    // ============================================================
    let actionButtons = '';
    if (isEditable) {
        actionButtons = `
            <div class="detail-actions">
                <button class="btn btn-sm btn-success" onclick="detailWaterNow()">💧 Полить</button>
                <button class="btn btn-sm btn-success" onclick="detailFertilizeNow()">🧪 Подкормить</button>
                <button class="btn btn-sm btn-success" onclick="detailRepotNow()">🔄 Пересадить</button>
            </div>
        `;
    }

    // ============================================================
    // ВКЛАДКА "СПРАВКА"
    // ============================================================
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

    // ============================================================
    // ВКЛАДКА "ИСТОРИЯ УХОДА" (фильтры видны всегда)
    // ============================================================
    const filter = state.historyFilter || 'all';
    
    let filteredHistory = history;
    if (filter !== 'all') {
        filteredHistory = history.filter(h => h.type === filter);
    }
    
    const historyEvents = filteredHistory.slice(0, 30);
    
    const typeMap = { 
        watering: '💧 Полив', 
        fertilizing: '🧪 Подкормка', 
        repotting: '🔄 Пересадка',
        note: '📝 Заметка'
    };
    
    const historyHtml = historyEvents.map(h => {
        const typeDisplay = typeMap[h.type] || h.type;
        const textDisplay = h.text ? `: ${h.text}` : '';
        return `
            <div class="history-item">
                <span style="min-width:100px;">${h.date}</span>
                <span style="flex:1;">${typeDisplay}${textDisplay}</span>
                ${isEditable && editMode ? `
                    <div style="display:flex;gap:4px;flex-shrink:0;">
                        <button class="btn btn-sm btn-outline" onclick="editHistoryEvent('${f.id}', '${h.id}')" style="padding:2px 8px;font-size:11px;">✏️</button>
                        <button class="btn btn-sm btn-outline" onclick="removeHistoryEvent('${f.id}', '${h.id}')" style="padding:2px 8px;font-size:11px;color:#d9534f;border-color:#f0d0d0;">🗑</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('') || 'Нет записей в истории';

    // Фильтры - видны всегда
    const filterButtons = `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <button class="btn btn-sm ${filter === 'all' ? 'btn-success' : 'btn-outline'}" onclick="setDetailHistoryFilter('all')" style="padding:4px 12px;font-size:12px;width:auto;">📋 Все</button>
            <button class="btn btn-sm ${filter === 'watering' ? 'btn-success' : 'btn-outline'}" onclick="setDetailHistoryFilter('watering')" style="padding:4px 12px;font-size:12px;width:auto;">💧 Полив</button>
            <button class="btn btn-sm ${filter === 'fertilizing' ? 'btn-success' : 'btn-outline'}" onclick="setDetailHistoryFilter('fertilizing')" style="padding:4px 12px;font-size:12px;width:auto;">🧪 Подкормка</button>
            <button class="btn btn-sm ${filter === 'repotting' ? 'btn-success' : 'btn-outline'}" onclick="setDetailHistoryFilter('repotting')" style="padding:4px 12px;font-size:12px;width:auto;">🔄 Пересадка</button>
            <button class="btn btn-sm ${filter === 'note' ? 'btn-success' : 'btn-outline'}" onclick="setDetailHistoryFilter('note')" style="padding:4px 12px;font-size:12px;width:auto;">📝 Заметка</button>
        </div>
    `;

    const historyContent = `
        <div style="padding:0 20px 12px 20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-top:4px;">
                <div style="font-weight:600;font-size:14px;">📜 История ухода</div>
                ${isEditable && editMode ? `
                    <button class="btn btn-sm btn-success" onclick="showAddHistoryEventModal('${f.id}')" style="padding:4px 12px;font-size:12px;width:auto;">➕ Добавить</button>
                ` : ''}
            </div>
            ${filterButtons}
            <div style="background:#f8fbf8;border-radius:12px;padding:8px 12px;">
                ${historyHtml}
                ${historyEvents.length >= 30 ? `<div style="text-align:center;font-size:12px;color:#8aa08a;padding:4px 0;">Показаны последние 30 записей</div>` : ''}
            </div>
        </div>
    `;

    // ============================================================
    // КНОПКИ ВТОРОСТЕПЕННЫХ ДЕЙСТВИЙ (Клонировать/Переместить/Удалить)
    // ============================================================
    const secondaryActionsHtml = `
        <div style="padding: 8px 20px 12px 20px; border-top: 1px solid #eef3ee; margin-top: 4px;">
            ${isEditable ? `
                <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
                    <button class="btn btn-sm btn-outline" onclick="showCloneModal()" style="font-size:12px;padding:4px 14px;border-radius:20px;color:#5c725c;border:1px solid #dce4dc;background:transparent;">📋 Клонировать</button>
                    <button class="btn btn-sm btn-outline" onclick="showMoveModal()" style="font-size:12px;padding:4px 14px;border-radius:20px;color:#5c725c;border:1px solid #dce4dc;background:transparent;">📦 Переместить</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteFlower()" style="font-size:12px;padding:4px 14px;border-radius:20px;color:#d9534f;border-color:#f0d0d0;background:transparent;">🗑 Удалить</button>
                </div>
            ` : `
                <span class="readonly-badge" style="margin:auto;display:block;text-align:center;padding:8px;">🔒 Только просмотр</span>
            `}
        </div>
    `;

    // ============================================================
    // СБОРКА
    // ============================================================
    const detailHtml = `
        <div class="detail-container">
            ${photoHtml}
            <div style="padding:0 0 8px 0; display:flex; flex-direction:column; flex:1;">
                ${tabsHtml}
                <div class="detail-tab-content ${state.detailTab === 'main' ? 'active' : ''}" style="padding:0 20px; flex:1;">
                    ${mainContent}
                    ${expandedContent}
                    ${expandBtnHtml}
                    ${actionButtons}
                    ${secondaryActionsHtml}
                </div>
                <div class="detail-tab-content ${state.detailTab === 'info' ? 'active' : ''}" style="padding:0 20px;">
                    ${infoContent}
                    ${secondaryActionsHtml}
                </div>
                <div class="detail-tab-content ${state.detailTab === 'history' ? 'active' : ''}" style="padding:0 20px;">
                    ${historyContent}
                    ${secondaryActionsHtml}
                </div>
            </div>
        </div>
    `;

    container.innerHTML = detailHtml;

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

function toggleDetailEdit() {
    const f = getFlower(state.detailFlowerId);
    if (!f) return;
    if (!isBaseEditable(f.base_id)) {
        alert('Это чужая коллекция, редактирование недоступно.');
        return;
    }
    state.isDetailEdit = !state.isDetailEdit;
    renderDetailPage(state.detailFlowerId);
}

function toggleDetailExpand() {
    state.isExpanded = !state.isExpanded;
    renderDetailPage(state.detailFlowerId);
}

function switchDetailTab(tab) {
    state.detailTab = tab;
    renderDetailPage(state.detailFlowerId);
}

function setDetailHistoryFilter(filter) {
    state.historyFilter = filter;
    renderDetailPage(state.detailFlowerId);
}

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
    renderDetailPage(state.detailFlowerId);
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Изменения сохранены!');
}

function closeDetailPage() {
    // Возвращаемся на предыдущую страницу
    const previousPage = state.previousPage || 'care';
    navigateTo(previousPage);
    state.detailFlowerId = null;
    state.isDetailEdit = false;
    state.isExpanded = false;
    state.detailTab = 'main';
    state.historyFilter = 'all';
    
    // Скрываем кнопку редактирования в шапке
    const headerEditBtn = document.getElementById('headerDetailEditBtn');
    headerEditBtn.style.display = 'none';
}

function detailWaterNow() {
    const f = getFlower(state.detailFlowerId);
    if (!f) return;
    if (!isBaseEditable(f.base_id)) { alert('Это чужая коллекция'); return; }
    const today = getLocalDateStr(new Date());
    
    const existing = (f.history || []).some(h => h.date === today && h.type === 'watering');
    if (existing) {
        alert('Полив уже отмечен сегодня');
        return;
    }
    
    addHistoryEvent(f, 'watering', today);
    saveState();
    renderDetailPage(state.detailFlowerId);
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
    
    addHistoryEvent(f, 'fertilizing', today);
    saveState();
    renderDetailPage(state.detailFlowerId);
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
    
    addHistoryEvent(f, 'repotting', today);
    saveState();
    renderDetailPage(state.detailFlowerId);
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
    closeDetailPage();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Растение удалено');
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
                renderDetailPage(flowerId);
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

// ================================================================
// ПОКАЗАТЬ ФАКТ (из справки)
// ================================================================

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
