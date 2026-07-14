// ================================================================
// РАБОТА С ДАННЫМИ (LocalStorage)
// ================================================================

let state = {
    bases: [],
    flowers: [],
    history: [],
    catalog: [],
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
};

function loadState() {
    try {
        const raw = localStorage.getItem('flowerAppState');
        if (raw) {
            const data = JSON.parse(raw);
            state.bases = data.bases || [];
            state.flowers = data.flowers || [];
            state.history = data.history || [];
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
        } else {
            initDemoData();
        }
    } catch (e) { initDemoData(); }
}

function saveState() {
    const data = {
        bases: state.bases,
        flowers: state.flowers,
        history: state.history,
        user: state.user,
    };
    localStorage.setItem('flowerAppState', JSON.stringify(data));
    updateCounts();
}

function initDemoData() {
    state.bases = [];
    state.flowers = [];
    state.history = [];
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
function getHistoryByFlower(flowerId) { return state.history.filter(h => h.flower_id === flowerId).sort((a, b) => a.date.localeCompare(b.date)); }
function isBaseEditable(baseId) {
    const base = getBase(baseId);
    return base && base.owner === 'Вы';
}
function getBaseDisplayName(base) {
    if (!base) return '—';
    if (base.my_name && base.owner !== 'Вы') return base.my_name;
    return base.name;
}