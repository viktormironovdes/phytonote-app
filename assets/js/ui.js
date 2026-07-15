// ================================================================
// ОТРИСОВКА ИНТЕРФЕЙСА
// ================================================================

function updateCounts() {
    document.getElementById('totalBases').textContent = state.bases.length;
    document.getElementById('totalPlants').textContent = state.flowers.length;
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    
    document.querySelectorAll('.bottom-nav .tab').forEach(t => t.classList.remove('active'));
    const tab = document.querySelector(`.bottom-nav .tab[data-page="${page}"]`);
    if (tab) tab.classList.add('active');

    const titles = {
        plants: 'Растения',
        garden: 'Коллекции',
        care: 'Уход',
        calendar: 'Календарь',
        profile: 'Профиль'
    };
    document.getElementById('pageTitle').textContent = titles[page] || 'PhytoNote';
    document.getElementById('headerEditBtn').style.display = 'none';

    state.currentPage = page;
    if (page === 'plants') renderCatalog();
    else if (page === 'garden') { renderBases(); }
    else if (page === 'calendar') { renderCalendar(); }
    else if (page === 'care') renderCare();
    else if (page === 'profile') {
        loadProfile();
        updateCounts();
    }
}

function renderAll() {
    renderCatalog();
    renderBases();
    if (state.currentBaseId) renderBasePlants();
    renderCalendar();
    renderCare();
    updateCounts();
}

function updateDebugInfo() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', { hour12: false });
    const dateStr = now.toLocaleDateString('ru-RU');
    const debugTime = document.getElementById('debugTime');
    const debugDate = document.getElementById('debugDate');
    if (debugTime) debugTime.textContent = timeStr;
    if (debugDate) debugDate.textContent = dateStr;
}
setInterval(updateDebugInfo, 1000);
updateDebugInfo();
