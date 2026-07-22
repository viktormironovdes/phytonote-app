// ================================================================
// ПРОФИЛЬ И НАСТРОЙКИ
// ================================================================

// Импортируем Capacitor Filesystem (если доступен)
let CapacitorFilesystem = null;
try {
    // Проверяем, запущено ли приложение в Capacitor
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        // Динамический импорт для Capacitor
        import('@capacitor/filesystem').then(module => {
            CapacitorFilesystem = module.Filesystem;
            console.log('✅ Capacitor Filesystem loaded');
        }).catch(() => {
            console.log('⚠️ Capacitor Filesystem not available, using fallback');
        });
    }
} catch (e) {
    console.log('⚠️ Capacitor not available, using fallback');
}

function saveProfile() {
    const newName = document.getElementById('profileNameInput').value.trim() || 'Вы';
    state.user.name = newName;
    state.user.email = document.getElementById('profileEmailInput').value.trim();
    state.user.notifications = {
        push: document.getElementById('notifPush').checked,
        email: document.getElementById('notifEmail').checked,
    };
    saveState();
    updateAvatarDisplay();
}

function loadProfile() {
    document.getElementById('profileNameInput').value = state.user.name || 'Вы';
    document.getElementById('profileEmailInput').value = state.user.email || '';
    document.getElementById('notifPush').checked = state.user.notifications?.push ?? true;
    document.getElementById('notifEmail').checked = state.user.notifications?.email ?? false;
    updateAvatarDisplay();
}

function updateAvatarDisplay() {
    const letterEl = document.getElementById('avatarLetter');
    const imgEl = document.getElementById('avatarImage');
    if (state.user.avatar) {
        letterEl.style.display = 'none';
        imgEl.style.display = 'block';
        imgEl.src = state.user.avatar;
    } else {
        letterEl.style.display = 'block';
        imgEl.style.display = 'none';
        const name = state.user.name || 'Вы';
        letterEl.textContent = name.charAt(0).toUpperCase();
    }
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 200;
            canvas.width = size;
            canvas.height = size;
            ctx.drawImage(img, 0, 0, size, size);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            state.user.avatar = dataUrl;
            saveState();
            updateAvatarDisplay();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function showDisplaySettingsModal() {
    const settings = state.user.display_settings || {};
    document.getElementById('settingsPlacement').checked = settings.show_placement !== undefined ? settings.show_placement : true;
    document.getElementById('settingsCondition').checked = settings.show_condition !== undefined ? settings.show_condition : true;
    document.getElementById('settingsLight').checked = settings.show_light !== undefined ? settings.show_light : true;
    document.getElementById('settingsWatering').checked = settings.show_watering !== undefined ? settings.show_watering : true;
    document.getElementById('settingsFertilizing').checked = settings.show_fertilizing !== undefined ? settings.show_fertilizing : true;
    document.getElementById('settingsLatinName').checked = settings.show_latin_name || false;
    document.getElementById('settingsPlantingDate').checked = settings.show_planting_date || false;
    document.getElementById('settingsFertilizingPeriod').checked = settings.show_fertilizing_period || false;
    document.getElementById('settingsLastRepotting').checked = settings.show_last_repotting || false;
    document.getElementById('settingsNotes').checked = settings.show_notes || false;
    document.getElementById('settingsCareInfo').checked = settings.show_care_info || false;
    document.getElementById('displaySettingsModal').classList.add('show');
}

function closeDisplaySettingsModal() {
    document.getElementById('displaySettingsModal').classList.remove('show');
}

function saveDisplaySettings() {
    state.user.display_settings = {
        show_placement: document.getElementById('settingsPlacement').checked,
        show_condition: document.getElementById('settingsCondition').checked,
        show_light: document.getElementById('settingsLight').checked,
        show_watering: document.getElementById('settingsWatering').checked,
        show_fertilizing: document.getElementById('settingsFertilizing').checked,
        show_latin_name: document.getElementById('settingsLatinName').checked,
        show_planting_date: document.getElementById('settingsPlantingDate').checked,
        show_fertilizing_period: document.getElementById('settingsFertilizingPeriod').checked,
        show_last_repotting: document.getElementById('settingsLastRepotting').checked,
        show_notes: document.getElementById('settingsNotes').checked,
        show_care_info: document.getElementById('settingsCareInfo').checked,
    };
    saveState();
    if (state.detailFlowerId) {
        renderDetail();
    }
}

// ================================================================
// ЭКСПОРТ/ИМПОРТ КОЛЛЕКЦИЙ (С ПОДДЕРЖКОЙ ANDROID)
// ================================================================

function showExportBaseModal() {
    if (state.bases.length === 0) { alert('Нет коллекций для экспорта'); return; }
    const select = document.getElementById('exportBaseSelect');
    select.innerHTML = state.bases.map(b => `<option value="${b.id}">${b.icon} ${getBaseDisplayName(b)}</option>`).join('');
    document.getElementById('exportBaseModal').classList.add('show');
}

function closeExportBaseModal() {
    document.getElementById('exportBaseModal').classList.remove('show');
}

async function executeExportBase() {
    const baseId = document.getElementById('exportBaseSelect').value;
    const base = getBase(baseId);
    if (!base) return;
    const flowers = getFlowersByBase(baseId);
    const data = { base, flowers, exportedAt: new Date().toISOString() };
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = `collection_${base.name}_${new Date().toISOString().split('T')[0]}.json`;

    try {
        // Пробуем использовать Capacitor Filesystem (для Android)
        if (CapacitorFilesystem && window.Capacitor && window.Capacitor.isNativePlatform()) {
            console.log('📱 Using Capacitor Filesystem for Android export');
            
            // Запрашиваем разрешение на запись (Android 13+)
            const result = await CapacitorFilesystem.requestPermissions();
            if (result.permissions.storage !== 'granted') {
                alert('❌ Нет разрешения на запись файлов. Дайте разрешение в настройках.');
                return;
            }

            // Сохраняем файл
            await CapacitorFilesystem.writeFile({
                path: fileName,
                data: jsonString,
                directory: 'DOWNLOAD',
                encoding: 'utf8'
            });
            
            alert(`✅ Коллекция экспортирована!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
        } else {
            // Fallback: браузерное скачивание (для ПК)
            console.log('💻 Using browser download fallback');
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            alert(`✅ Коллекция экспортирована!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
        }
    } catch (error) {
        console.error('Export error:', error);
        
        // Если Capacitor не сработал, пробуем браузерный метод
        try {
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            alert(`✅ Коллекция экспортирована!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
        } catch (fallbackError) {
            alert(`❌ Ошибка при экспорте: ${error.message}`);
        }
    }
    
    closeExportBaseModal();
}

function importBase(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.base || !data.flowers) { alert('Неверный формат'); return; }
            if (state.bases.some(b => b.name === data.base.name && b.owner === 'Вы')) {
                if (!confirm(`Коллекция "${data.base.name}" уже существует. Создать копию?`)) return;
                data.base.name = data.base.name + ' (копия)';
            }
            const newBaseId = 'base_' + generateUUID();
            data.base.id = newBaseId;
            data.base.owner = 'Вы';
            state.bases.push(data.base);
            data.flowers.forEach(f => {
                const newId = 'flower_' + generateUUID();
                f.id = newId;
                f.base_id = newBaseId;
                if (!f.latin_name) f.latin_name = '';
                if (!f.planting_date) f.planting_date = new Date().toISOString().slice(0, 7);
                if (!f.fertilizing_start) f.fertilizing_start = 3;
                if (!f.fertilizing_end) f.fertilizing_end = 10;
                if (!f.catalog_name) f.catalog_name = f.name;
                if (!f.catalog_icon) f.catalog_icon = '🌿';
                if (!f.catalog_description) f.catalog_description = '';
                if (!f.history) f.history = [];
                state.flowers.push(f);
            });
            saveState();
            renderAll();
            renderCare();
            renderCalendar();
            alert('✅ Коллекция импортирована');
        } catch (err) { alert('Ошибка: ' + err.message); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ================================================================
// ЭКСПОРТ/ИМПОРТ ВСЕХ ДАННЫХ
// ================================================================

async function exportAllData() {
    const data = { bases: state.bases, flowers: state.flowers, user: state.user };
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = `all_data_${new Date().toISOString().split('T')[0]}.json`;

    try {
        if (CapacitorFilesystem && window.Capacitor && window.Capacitor.isNativePlatform()) {
            await CapacitorFilesystem.requestPermissions();
            await CapacitorFilesystem.writeFile({
                path: fileName,
                data: jsonString,
                directory: 'DOWNLOAD',
                encoding: 'utf8'
            });
            alert(`✅ Все данные экспортированы!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
        } else {
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            alert(`✅ Все данные экспортированы!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
        }
    } catch (error) {
        alert(`❌ Ошибка при экспорте: ${error.message}`);
    }
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.bases && data.flowers) {
                state.bases = data.bases;
                state.flowers = data.flowers;
                state.user = data.user || {
                    name: 'Вы',
                    email: '',
                    avatar: null,
                    notifications: { push: true, email: false },
                    display_settings: {
                        show_placement: true,
                        show_condition: true,
                        show_light: true,
                        show_watering: true,
                        show_fertilizing: true,
                        show_latin_name: false,
                        show_planting_date: false,
                        show_fertilizing_period: false,
                        show_last_repotting: false,
                        show_notes: false,
                        show_care_info: false,
                    }
                };
                saveState();
                renderAll();
                renderCare();
                renderCalendar();
                alert('✅ Данные успешно импортированы!');
            } else {
                alert('❌ Неверный формат файла');
            }
        } catch (err) {
            alert('❌ Ошибка чтения файла: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function getLogs() {
    try {
        const raw = localStorage.getItem('appLogs');
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

async function exportLogs() {
    const logs = getLogs();
    if (logs.length === 0) {
        alert('Логи пусты');
        return;
    }
    const jsonString = JSON.stringify(logs, null, 2);
    const fileName = `phytonote_logs_${new Date().toISOString().split('T')[0]}.json`;

    try {
        if (CapacitorFilesystem && window.Capacitor && window.Capacitor.isNativePlatform()) {
            await CapacitorFilesystem.requestPermissions();
            await CapacitorFilesystem.writeFile({
                path: fileName,
                data: jsonString,
                directory: 'DOWNLOAD',
                encoding: 'utf8'
            });
            alert(`✅ Логи экспортированы!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
        } else {
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            alert(`✅ Логи экспортированы!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
        }
    } catch (error) {
        alert(`❌ Ошибка при экспорте: ${error.message}`);
    }
}
