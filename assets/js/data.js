// ================================================================
// РАБОТА С ДАННЫМИ (LocalStorage)
// ================================================================

let state = {
    bases: [],
    flowers: [],
    catalog: {
        version: '3.0',
        characteristics: [],
        plants: []
    },
    user: {
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
    },
    currentBaseId: null,
    currentPage: 'care',
    detailFlowerId: null,
    isDetailEdit: false,
    isExpanded: false,
    selectedCalendarDate: null,
    detailTab: 'main',
    historyFilter: 'all',
    catalogLoaded: false,
};

function loadState() {
    try {
        const raw = localStorage.getItem('flowerAppState');
        if (raw) {
            const data = JSON.parse(raw);
            state.bases = data.bases || [];
            state.flowers = data.flowers || [];
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
            
            // Убеждаемся, что имя всегда есть
            if (!state.user.name || state.user.name.trim() === '') {
                state.user.name = 'Вы';
            }
            
            if (!state.user.display_settings) {
                state.user.display_settings = {
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
                };
            }
            
            // Миграция: старые поля last_* → history
            state.flowers.forEach(flower => {
                if (!flower.history) flower.history = [];
                
                if (flower.last_watering) {
                    const hasEvent = flower.history.some(h => 
                        h.type === 'watering' && h.date === flower.last_watering
                    );
                    if (!hasEvent) {
                        flower.history.push({
                            id: 'hist_' + generateUUID(),
                            date: flower.last_watering,
                            type: 'watering',
                            text: ''
                        });
                    }
                    delete flower.last_watering;
                }
                
                if (flower.last_fertilizing) {
                    const hasEvent = flower.history.some(h => 
                        h.type === 'fertilizing' && h.date === flower.last_fertilizing
                    );
                    if (!hasEvent) {
                        flower.history.push({
                            id: 'hist_' + generateUUID(),
                            date: flower.last_fertilizing,
                            type: 'fertilizing',
                            text: ''
                        });
                    }
                    delete flower.last_fertilizing;
                }
                
                if (flower.last_repotting) {
                    const hasEvent = flower.history.some(h => 
                        h.type === 'repotting' && h.date === flower.last_repotting
                    );
                    if (!hasEvent) {
                        flower.history.push({
                            id: 'hist_' + generateUUID(),
                            date: flower.last_repotting,
                            type: 'repotting',
                            text: ''
                        });
                    }
                    delete flower.last_repotting;
                }
            });
        } else {
            initDemoData();
        }
    } catch (e) { 
        console.error('❌ Ошибка загрузки состояния:', e);
        initDemoData(); 
    }
    saveState();
}

function saveState() {
    const data = {
        bases: state.bases,
        flowers: state.flowers,
        user: state.user,
    };
    localStorage.setItem('flowerAppState', JSON.stringify(data));
    updateCounts();
}

function initDemoData() {
    state.bases = [];
    state.flowers = [];
    state.user = {
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
}

function getBase(id) { return state.bases.find(b => b.id === id); }
function getFlower(id) { return state.flowers.find(f => f.id === id); }
function getFlowersByBase(baseId) { return state.flowers.filter(f => f.base_id === baseId); }

function isBaseEditable(baseId) {
    const base = getBase(baseId);
    return base && base.owner === 'Вы';
}

function getBaseDisplayName(base) {
    if (!base) return '—';
    if (base.my_name && base.owner !== 'Вы') return base.my_name;
    return base.name;
}

function getHistoryByFlower(flowerId) {
    const flower = getFlower(flowerId);
    if (!flower || !flower.history) return [];
    return flower.history.sort((a, b) => b.date.localeCompare(a.date));
}

function addHistoryEvent(flower, type, date, text = '') {
    if (!flower.history) flower.history = [];
    
    // Проверяем дубликат (для полива/подкормки/пересадки)
    if (type !== 'note') {
        const exists = flower.history.some(h => h.date === date && h.type === type);
        if (exists) return false;
    }
    
    flower.history.push({
        id: 'hist_' + generateUUID(),
        date: date || getLocalDateStr(new Date()),
        type: type,
        text: text || ''
    });
    flower.history.sort((a, b) => b.date.localeCompare(a.date));
    return true;
}

function updateHistoryEvent(flower, eventId, newDate, newType, newText) {
    const event = flower.history.find(h => h.id === eventId);
    if (event) {
        if (newDate) event.date = newDate;
        if (newType) event.type = newType;
        if (newText !== undefined) event.text = newText;
        flower.history.sort((a, b) => b.date.localeCompare(a.date));
    }
}

function deleteHistoryEvent(flower, eventId) {
    flower.history = flower.history.filter(h => h.id !== eventId);
}

// ================================================================
// РАБОТА С КАТАЛОГОМ
// ================================================================

function getCatalogPlant(catalogId) {
    return state.catalog.plants.find(p => p.id === catalogId);
}

function getCharacteristics() {
    return state.catalog.characteristics || [];
}

function getCharacteristic(id) {
    return state.catalog.characteristics.find(c => c.id === id);
}

function getPlantFacts(flower) {
    if (!flower || !flower.catalog_id) return [];
    const catalogPlant = getCatalogPlant(flower.catalog_id);
    if (!catalogPlant || !catalogPlant.facts) return [];
    return catalogPlant.facts;
}

function isCatalogLoaded() {
    return state.catalog.plants && state.catalog.plants.length > 0;
}
