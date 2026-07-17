// ================================================================
// КОЛЛЕКЦИИ (бывшие "Базы")
// ================================================================

let selectedIcon = '🏠';

function renderBases() {
    const container = document.getElementById('basesContainer');
    if (state.bases.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon-big">🌱</span>
                <p>У вас пока нет коллекций</p>
                <p style="font-size:14px;color:#8aa08a;margin-top:4px;">Создайте свою первую коллекцию растений</p>
                <button class="btn" onclick="showCreateBaseModal()" style="margin-top:12px;">➕ Создать коллекцию</button>
            </div>
        `;
        return;
    }
    const myBases = state.bases.filter(b => b.owner === 'Вы');
    const otherBases = state.bases.filter(b => b.owner !== 'Вы');
    let html = '';
    if (myBases.length > 0) {
        html += myBases.map(b => baseCardHtml(b)).join('');
    }
    if (otherBases.length > 0) {
        html += `<div style="font-weight:600;font-size:15px;color:#5c725c;margin:12px 0 8px 0;">🌐 Общие коллекции</div>`;
        html += otherBases.map(b => baseCardHtml(b)).join('');
    }
    container.innerHTML = html;
}

function baseCardHtml(b) {
    const displayName = getBaseDisplayName(b);
    const ownerLabel = b.owner !== 'Вы' ? ` · 👤 ${b.owner}` : '';
    const ownerLetter = b.owner !== 'Вы' ? b.owner.charAt(0).toUpperCase() : '';
    return `
        <div class="card" onclick="openBase('${b.id}')">
            <div class="avatar">
                ${b.owner !== 'Вы' ? `<span class="letter">${ownerLetter}</span>` : b.icon || '📁'}
            </div>
            <div class="info">
                <div class="title">${displayName} ${b.owner !== 'Вы' ? '🔒' : ''}</div>
                <div class="sub">${getFlowersByBase(b.id).length} растений${ownerLabel}</div>
            </div>
        </div>
    `;
}

function openBase(baseId) {
    state.currentBaseId = baseId;
    document.getElementById('basesList').style.display = 'none';
    document.getElementById('basePlantsView').style.display = 'block';
    const base = getBase(baseId);
    const displayName = getBaseDisplayName(base);
    document.getElementById('currentBaseIcon').textContent = base ? base.icon || '🏠' : '🏠';
    document.getElementById('currentBaseTitle').textContent = displayName;
    const isEditable = isBaseEditable(baseId);
    document.getElementById('currentBaseOwner').textContent = base && base.owner !== 'Вы' ? `👤 ${base.owner}` : '';
    document.getElementById('editBaseNameBtn').style.display = 'inline-block';
    document.getElementById('addPlantBtn').style.display = isEditable ? 'block' : 'none';

    const management = document.getElementById('baseManagement');
    if (isEditable) {
        management.style.display = 'block';
        document.getElementById('deleteBaseBtn').textContent = '🗑 Удалить коллекцию';
        document.getElementById('deleteBaseBtn').onclick = deleteCurrentBase;
    } else {
        management.style.display = 'block';
        document.getElementById('deleteBaseBtn').textContent = '🔌 Отключиться от коллекции';
        document.getElementById('deleteBaseBtn').onclick = disconnectFromBase;
    }
    renderBasePlants();
}

function backToBases() {
    document.getElementById('basesList').style.display = 'block';
    document.getElementById('basePlantsView').style.display = 'none';
    renderBases();
}

function renderBasePlants() {
    if (!state.currentBaseId) return;
    const container = document.getElementById('basePlantsList');
    const search = document.getElementById('gardenSearch').value.toLowerCase();
    const isEditable = isBaseEditable(state.currentBaseId);
    let list = getFlowersByBase(state.currentBaseId).filter(f => f.name.toLowerCase().includes(search));
    list.sort((a, b) => a.name.localeCompare(b.name));

    container.innerHTML = list.map(f => {
        const status = getWateringStatus(f);
        const days = getDaysUntilWatering(f);
        const dotClass = status === 'red' ? 'red' : status === 'yellow' ? 'yellow' : 'green';
        const displayName = f.catalog_name || f.name;
        const displayIcon = f.catalog_icon || '🌿';
        const ageDisplay = f.planting_date ? calculateAge(f.planting_date) : '';
        const hasFacts = f.catalog_id && isCatalogLoaded() && getPlantFacts(f).length > 0;
        return `
            <div class="card" onclick="${isEditable ? `showDetail('${f.id}')` : `showReadOnlyDetail('${f.id}')`}">
                <div class="avatar">
                    ${f.photo ? `<img src="${f.photo}" alt="${displayName}">` : displayIcon}
                </div>
                <div class="info">
                    <div class="title">${displayName}</div>
                    <div class="sub">${f.placement || '—'} ${ageDisplay ? '· ' + ageDisplay : ''}</div>
                    <div class="meta"><span>💧 ${days > 0 ? days + ' дн.' : 'сегодня'}</span></div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    ${!isEditable ? '<span class="badge-owner">👁️</span>' : ''}
                    ${hasFacts ? '<span class="badge-owner">📖</span>' : ''}
                    <div class="status-dot ${dotClass}"></div>
                </div>
            </div>
        `;
    }).join('') || '<div style="text-align:center;padding:30px;color:#8aa08a;">🌱 Нет растений в этой коллекции</div>';
}

function deleteCurrentBase() {
    const base = getBase(state.currentBaseId);
    if (!base) return;
    if (!confirm(`Удалить коллекцию "${getBaseDisplayName(base)}" и все растения в ней?`)) return;
    state.flowers = state.flowers.filter(f => f.base_id !== base.id);
    state.history = state.history.filter(h => {
        const flower = state.flowers.find(f => f.id === h.flower_id);
        return flower && flower.base_id !== base.id;
    });
    state.bases = state.bases.filter(b => b.id !== base.id);
    saveState();
    backToBases();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Коллекция удалена');
}

function disconnectFromBase() {
    const base = getBase(state.currentBaseId);
    if (!base) return;
    if (!confirm(`Отключиться от коллекции "${getBaseDisplayName(base)}"? Растения останутся у владельца.`)) return;
    state.bases = state.bases.filter(b => b.id !== base.id);
    state.flowers = state.flowers.filter(f => f.base_id !== base.id);
    state.history = state.history.filter(h => {
        const flower = state.flowers.find(f => f.id === h.flower_id);
        return flower && flower.base_id !== base.id;
    });
    saveState();
    backToBases();
    renderAll();
    renderCare();
    renderCalendar();
    alert('✅ Вы отключились от коллекции');
}

function showCreateBaseModal() {
    document.getElementById('createBaseModal').classList.add('show');
    document.querySelectorAll('#iconSelector button').forEach(b => b.classList.remove('selected'));
    document.querySelector('#iconSelector button[data-icon="🏠"]')?.classList.add('selected');
    selectedIcon = '🏠';
    document.getElementById('baseNameInput').value = '';
}

function closeCreateBaseModal() {
    document.getElementById('createBaseModal').classList.remove('show');
}

function createBase() {
    const name = document.getElementById('baseNameInput').value.trim();
    if (!name) { alert('❌ Введите название'); return; }
    if (state.bases.some(b => b.name === name && b.owner === 'Вы')) {
        alert('❌ Коллекция с таким названием уже существует');
        return;
    }
    state.bases.push({
        id: 'base_' + generateUUID(),
        name: name,
        icon: selectedIcon,
        owner: 'Вы',
        createdAt: new Date().toISOString(),
    });
    saveState();
    closeCreateBaseModal();
    renderAll();
    renderCare();
    renderCalendar();
}

function editBaseName() {
    const base = getBase(state.currentBaseId);
    if (!base) return;
    const currentDisplay = getBaseDisplayName(base);
    const newName = prompt('Новое название коллекции (только для вас):', currentDisplay);
    if (newName && newName.trim()) {
        if (base.owner === 'Вы') {
            base.name = newName.trim();
        } else {
            base.my_name = newName.trim();
        }
        saveState();
        document.getElementById('currentBaseTitle').textContent = getBaseDisplayName(base);
        renderBases();
        renderBasePlants();
    }
}

// Функции экспорта/импорта перенесены в settings.js
// Здесь они вызываются из профиля
