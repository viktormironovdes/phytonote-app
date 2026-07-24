// ================================================================
// ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ - ИНИЦИАЛИЗАЦИЯ
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📸 PhotoNote инициализация...');
    
    loadState();
    console.log('📊 Данные загружены:', {
        references: state.references.length,
        schemes: state.schemes.length,
        equipment: state.equipment.length,
        cheatsheets: state.cheatsheets.length
    });
    
    // ================================================================
    // НАВИГАЦИЯ ПО МЕНЮ (с поддержкой touch на телефоне)
    // ================================================================
    document.querySelectorAll('.bottom-nav .tab').forEach(tab => {
        // Для кликов мышкой
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page === 'detail') return;
            navigateTo(page);
        });
        
        // Для касаний на телефоне
        tab.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page === 'detail') return;
            navigateTo(page);
        });
    });
    
    // ================================================================
    // ЗАКРЫТИЕ МОДАЛОК
    // ================================================================
    document.querySelectorAll('.modal-overlay').forEach(el => {
        el.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
    
    // ================================================================
    // ПОИСК С ДЕБАУНСОМ
    // ================================================================
    const searchInput = document.getElementById('referencesSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    // ================================================================
    // ЗАГРУЗКА ГЛАВНОЙ СТРАНИЦЫ
    // ================================================================
    navigateTo('references');
    
    setTimeout(updateAvatarDisplay, 100);
    
    console.log('✅ PhotoNote готова к работе!');
});
