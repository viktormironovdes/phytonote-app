// ================================================================
// ПРОФИЛЬ И НАСТРОЙКИ
// ================================================================

// ================================================================
// 1. ИНИЦИАЛИЗАЦИЯ ПЛАГИНОВ CAPACITOR
// ================================================================

let Share = null;
let Filesystem = null;
let isNative = false;

// Проверяем наличие Capacitor
if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    isNative = true;
    console.log('📱 Запущено на нативной платформе (Android)');
    
    // Получаем Share плагин
    if (window.Capacitor.Plugins && window.Capacitor.Plugins.Share) {
        Share = window.Capacitor.Plugins.Share;
        console.log('✅ Capacitor Share загружен');
    } else {
        console.warn('⚠️ Capacitor Share не найден');
    }
    
    // Получаем Filesystem плагин
    if (window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
        Filesystem = window.Capacitor.Plugins.Filesystem;
        console.log('✅ Capacitor Filesystem загружен');
    } else {
        console.warn('⚠️ Capacitor Filesystem не найден');
    }
} else {
    console.log('💻 Запущено в браузере (Web)');
}

// ================================================================
// 2. РАБОТА С РАЗРЕШЕНИЯМИ
// ================================================================

/**
 * Проверяет и запрашивает разрешение на запись файлов
 * @returns {Promise<boolean>} true — разрешение есть, false — нет
 */
async function checkStoragePermission() {
    if (!isNative) {
        console.log('💻 В браузере разрешения не требуются');
        return true;
    }
    
    if (!Filesystem) {
        console.warn('⚠️ Filesystem плагин не загружен');
        return false;
    }
    
    try {
        console.log('📱 Запрашиваем разрешение на запись файлов...');
        const result = await Filesystem.requestPermissions();
        console.log('📱 Результат запроса разрешений:', result);
        
        // Проверяем, какое разрешение запрашивали
        const permission = result.publicStorage || result.storage || result.permissions?.storage;
        
        if (permission === 'granted') {
            console.log('✅ Разрешение получено');
            return true;
        } else {
            console.log('❌ Разрешение не получено');
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка запроса разрешений:', error);
        
        // Для Android 13+ может быть другая структура ответа
        try {
            // Пробуем альтернативный способ проверки
            const status = await Filesystem.checkPermissions();
            console.log('📱 Статус разрешений:', status);
            
            const permission = status.publicStorage || status.storage || status.permissions?.storage;
            return permission === 'granted';
        } catch (e) {
            console.error('❌ Ошибка проверки разрешений:', e);
            return false;
        }
    }
}

/**
 * Открывает экран настроек приложения
 */
async function openAppSettings() {
    if (!isNative) {
        alert('❌ Разрешение не получено.\n\nВ браузере сохранение файлов работает автоматически.');
        return;
    }
    
    try {
        // Пробуем открыть настройки приложения через Capacitor
        if (window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            await window.Capacitor.Plugins.App.openSettings();
            console.log('✅ Открыты настройки приложения');
        } else {
            // Если App плагин не доступен, показываем инструкцию
            showPermissionInstruction();
        }
    } catch (error) {
        console.error('❌ Ошибка открытия настроек:', error);
        showPermissionInstruction();
    }
}

/**
 * Показывает инструкцию по включению разрешений
 */
function showPermissionInstruction() {
    alert(
        '❌ Нет разрешения на сохранение файлов.\n\n' +
        'Чтобы включить разрешение:\n' +
        '1. Настройки телефона\n' +
        '2. Приложения → PhytoNote\n' +
        '3. Разрешения\n' +
        '4. Включить "Файлы и медиа"\n\n' +
        'После этого попробуйте снова.'
    );
}

// ================================================================
// 3. ПРОФИЛЬ
// ================================================================

function saveProfile() {
    const nameInput = document.getElementById('profileNameInput');
    const emailInput = document.getElementById('profileEmailInput');
    
    if (!nameInput || !emailInput) {
        console.error('❌ Profile inputs not found');
        return;
    }
    
    const newName = nameInput.value.trim() || 'Вы';
    const newEmail = emailInput.value.trim();
    
    console.log('💾 Saving profile:', { name: newName, email: newEmail });
    
    state.user.name = newName;
    state.user.email = newEmail;
    
    state.user.notifications = {
        push: document.getElementById('notifPush')?.checked ?? true,
        email: document.getElementById('notifEmail')?.checked ?? false,
    };
    
    saveState();
    updateAvatarDisplay();
    alert('✅ Профиль сохранён!');
}

function loadProfile() {
    console.log('📂 Loading profile...');
    
    if (!state.user.name || state.user.name.trim() === '') {
        state.user.name = 'Вы';
        saveState();
    }
    
    document.getElementById('profileNameInput').value = state.user.name || 'Вы';
    document.getElementById('profileEmailInput').value = state.user.email || '';
    document.getElementById('notifPush').checked = state.user.notifications?.push ?? true;
    document.getElementById('notifEmail').checked = state.user.notifications?.email ?? false;
    
    updateAvatarDisplay();
}

function updateAvatarDisplay() {
    const letterEl = document.getElementById('avatarLetter');
    const imgEl = document.getElementById('avatarImage');
    
    if (!letterEl || !imgEl) {
        console.error('❌ Элементы аватарки не найдены');
        return;
    }
    
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
            alert('✅ Аватар обновлён!');
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
        renderDetailPage(state.detailFlowerId);
    }
}

// ================================================================
// 4. ЭКСПОРТ КОЛЛЕКЦИЙ
// ================================================================

function showExportBaseModal() {
    if (state.bases.length === 0) { 
        alert('❌ Нет коллекций для экспорта'); 
        return; 
    }
    const select = document.getElementById('exportBaseSelect');
    select.innerHTML = state.bases.map(b => `<option value="${b.id}">${b.icon} ${getBaseDisplayName(b)}</option>`).join('');
    document.getElementById('exportBaseModal').classList.add('show');
}

function closeExportBaseModal() {
    document.getElementById('exportBaseModal').classList.remove('show');
}

// ================================================================
// 4A. ЭКСПОРТ — СОХРАНЕНИЕ НА УСТРОЙСТВО (FILESYSTEM)
// ================================================================

async function executeExportBase() {
    const baseId = document.getElementById('exportBaseSelect').value;
    const base = getBase(baseId);
    if (!base) return;
    const flowers = getFlowersByBase(baseId);
    const data = { base, flowers, exportedAt: new Date().toISOString() };
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = `collection_${base.name}_${new Date().toISOString().split('T')[0]}.json`;

    console.log('📤 Экспорт коллекции (сохранение):', { baseId, fileName, isNative });

    // Проверяем разрешение
    const hasPermission = await checkStoragePermission();
    if (!hasPermission) {
        const goToSettings = confirm(
            '❌ Нет разрешения на сохранение файлов.\n\n' +
            'Хотите перейти в настройки, чтобы включить его?'
        );
        if (goToSettings) {
            await openAppSettings();
        }
        return;
    }

    try {
        if (isNative && Filesystem) {
            console.log('📱 Сохраняем файл через Filesystem...');
            
            // Пробуем сохранить в Downloads
            try {
                await Filesystem.writeFile({
                    path: fileName,
                    data: jsonString,
                    directory: 'DOWNLOAD',
                    encoding: 'utf8'
                });
                console.log('✅ Файл сохранён в Downloads');
                alert(`✅ Коллекция сохранена!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
                closeExportBaseModal();
                return;
            } catch (downloadError) {
                console.warn('⚠️ Ошибка сохранения в Downloads:', downloadError);
                
                // Пробуем сохранить в Documents
                try {
                    await Filesystem.writeFile({
                        path: fileName,
                        data: jsonString,
                        directory: 'DOCUMENTS',
                        encoding: 'utf8'
                    });
                    console.log('✅ Файл сохранён в Documents');
                    alert(`✅ Коллекция сохранена!\n📁 Папка: Документы (Documents)\n📄 Файл: ${fileName}`);
                    closeExportBaseModal();
                    return;
                } catch (docError) {
                    console.warn('⚠️ Ошибка сохранения в Documents:', docError);
                    
                    // Пробуем сохранить в Data (внутреннее хранилище)
                    try {
                        await Filesystem.writeFile({
                            path: fileName,
                            data: jsonString,
                            directory: 'DATA',
                            encoding: 'utf8'
                        });
                        console.log('✅ Файл сохранён в Data');
                        alert(`✅ Коллекция сохранена!\n📁 Папка: Данные приложения\n📄 Файл: ${fileName}\n\n⚠️ Файл сохранён во внутреннем хранилище. Скопируйте его через проводник.`);
                        closeExportBaseModal();
                        return;
                    } catch (dataError) {
                        console.error('❌ Все попытки сохранения не удались:', dataError);
                        alert(`❌ Не удалось сохранить файл.\n\nОшибка: ${dataError.message}\n\nПопробуйте использовать "Поделиться" для отправки файла.`);
                    }
                }
            }
        } else {
            // Web режим — браузерное скачивание
            console.log('💻 Браузерное скачивание');
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            alert(`✅ Коллекция скачана!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
            closeExportBaseModal();
        }
    } catch (error) {
        console.error('❌ Критическая ошибка экспорта:', error);
        alert(`❌ Ошибка при сохранении: ${error.message}\n\nПопробуйте использовать "Поделиться" для отправки файла.`);
    }
}

// ================================================================
// 4B. ЭКСПОРТ — ПОДЕЛИТЬСЯ (SHARE)
// ================================================================

async function shareBase() {
    const baseId = document.getElementById('exportBaseSelect').value;
    const base = getBase(baseId);
    if (!base) return;
    const flowers = getFlowersByBase(baseId);
    const data = { base, flowers, exportedAt: new Date().toISOString() };
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = `collection_${base.name}_${new Date().toISOString().split('T')[0]}.json`;

    console.log('📤 Экспорт коллекции (поделиться):', { baseId, fileName, isNative });

    try {
        if (isNative && Share) {
            console.log('📱 Открываем окно "Поделиться"...');
            
            await Share.share({
                title: `Коллекция: ${base.name}`,
                text: `📋 Коллекция "${base.name}"\n🌱 Растений: ${flowers.length}\n📅 Экспортировано: ${new Date().toLocaleDateString('ru-RU')}\n\nДанные прилагаются в виде файла.`,
                files: [{
                    data: jsonString,
                    mimeType: 'application/json',
                    fileName: fileName
                }]
            });
            
            console.log('✅ Окно "Поделиться" открыто');
            alert('✅ Открыто окно "Поделиться"! Выберите куда сохранить или отправить файл.');
            closeExportBaseModal();
            
        } else {
            // Web режим — браузерное скачивание
            console.log('💻 Браузерное скачивание');
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            alert(`✅ Коллекция скачана!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
            closeExportBaseModal();
        }
    } catch (error) {
        console.error('❌ Ошибка при открытии "Поделиться":', error);
        alert(`❌ Ошибка: ${error.message}`);
    }
}

// ================================================================
// 5. ИМПОРТ КОЛЛЕКЦИИ
// ================================================================

function importBase(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.base || !data.flowers) { 
                alert('❌ Неверный формат файла'); 
                return; 
            }
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
            alert('✅ Коллекция импортирована!');
        } catch (err) { 
            alert('❌ Ошибка чтения файла: ' + err.message); 
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ================================================================
// 6. ЭКСПОРТ ВСЕХ ДАННЫХ
// ================================================================

async function exportAllData() {
    const data = { bases: state.bases, flowers: state.flowers, user: state.user };
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = `all_data_${new Date().toISOString().split('T')[0]}.json`;

    console.log('📤 Экспорт всех данных:', { fileName, isNative });

    // Проверяем разрешение
    const hasPermission = await checkStoragePermission();
    if (!hasPermission) {
        const goToSettings = confirm(
            '❌ Нет разрешения на сохранение файлов.\n\n' +
            'Хотите перейти в настройки, чтобы включить его?'
        );
        if (goToSettings) {
            await openAppSettings();
        }
        return;
    }

    try {
        if (isNative && Filesystem) {
            try {
                await Filesystem.writeFile({
                    path: fileName,
                    data: jsonString,
                    directory: 'DOWNLOAD',
                    encoding: 'utf8'
                });
                alert(`✅ Все данные сохранены!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
                return;
            } catch (e) {
                try {
                    await Filesystem.writeFile({
                        path: fileName,
                        data: jsonString,
                        directory: 'DOCUMENTS',
                        encoding: 'utf8'
                    });
                    alert(`✅ Все данные сохранены!\n📁 Папка: Документы (Documents)\n📄 Файл: ${fileName}`);
                    return;
                } catch (e2) {
                    alert(`❌ Ошибка: ${e2.message}`);
                }
            }
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
            alert(`✅ Все данные скачаны!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
        }
    } catch (error) {
        alert(`❌ Ошибка: ${error.message}`);
    }
}

// ================================================================
// 7. SHARE ВСЕХ ДАННЫХ
// ================================================================

async function shareAllData() {
    const data = { bases: state.bases, flowers: state.flowers, user: state.user };
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = `all_data_${new Date().toISOString().split('T')[0]}.json`;

    console.log('📤 Поделиться всеми данными:', { fileName, isNative });

    try {
        if (isNative && Share) {
            await Share.share({
                title: 'Все данные PhytoNote',
                text: `📋 Полный экспорт данных PhytoNote\n📁 Коллекций: ${state.bases.length}\n🌱 Растений: ${state.flowers.length}\n📅 Экспортировано: ${new Date().toLocaleDateString('ru-RU')}\n\nДанные прилагаются в виде файла.`,
                files: [{
                    data: jsonString,
                    mimeType: 'application/json',
                    fileName: fileName
                }]
            });
            alert('✅ Открыто окно "Поделиться"! Выберите куда сохранить или отправить файл.');
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
            alert(`✅ Все данные скачаны!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
        }
    } catch (error) {
        alert(`❌ Ошибка: ${error.message}`);
    }
}

// ================================================================
// 8. ИМПОРТ ВСЕХ ДАННЫХ
// ================================================================

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

// ================================================================
// 9. ЛОГИ
// ================================================================

function getLogs() {
    try {
        const raw = localStorage.getItem('appLogs');
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

async function exportLogs() {
    const logs = getLogs();
    if (logs.length === 0) {
        alert('📋 Логи пусты');
        return;
    }
    const jsonString = JSON.stringify(logs, null, 2);
    const fileName = `phytonote_logs_${new Date().toISOString().split('T')[0]}.json`;

    try {
        if (isNative && Filesystem) {
            try {
                await Filesystem.writeFile({
                    path: fileName,
                    data: jsonString,
                    directory: 'DOWNLOAD',
                    encoding: 'utf8'
                });
                alert(`✅ Логи сохранены!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
                return;
            } catch (e) {
                try {
                    await Filesystem.writeFile({
                        path: fileName,
                        data: jsonString,
                        directory: 'DOCUMENTS',
                        encoding: 'utf8'
                    });
                    alert(`✅ Логи сохранены!\n📁 Папка: Документы (Documents)\n📄 Файл: ${fileName}`);
                    return;
                } catch (e2) {
                    alert(`❌ Ошибка: ${e2.message}`);
                }
            }
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
            alert(`✅ Логи скачаны!\n📁 Папка: Загрузки (Downloads)\n📄 Файл: ${fileName}`);
        }
    } catch (error) {
        alert(`❌ Ошибка: ${error.message}`);
    }
}
