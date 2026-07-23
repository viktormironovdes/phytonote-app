// ================================================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 PhytoNote инициализация...');
    
    // Загружаем состояние (с миграцией)
    loadState();
    console.log('📊 Состояние загружено:', state);
    console.log('👤 Пользователь:', state.user);

    // Навигация
    document.querySelectorAll('.bottom-nav .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Если мы на странице карточки, закрываем её
            if (state.currentPage === 'detail') {
                closeDetailPage();
            }
            navigateTo(tab.dataset.page);
        });
    });

    // Фильтры в разделе "Уход"
    document.querySelectorAll('#careRange button').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#careRange button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderCare();
        });
    });

    // Закрытие модалок по клику на фон
    document.querySelectorAll('.modal-overlay').forEach(el => {
        el.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('show');
        });
    });

    // Обновление подсказок при смене базы в превью
    document.addEventListener('change', function(e) {
        if (e.target.id === 'previewBaseSelect') {
            updateLocationSuggestionsForPreview();
        }
    });

    // Инициализация иконок
    document.querySelectorAll('#iconSelector button').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#iconSelector button').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedIcon = this.dataset.icon;
        });
    });

    // Загрузка каталога и отрисовка
    loadCatalog();
    renderAll();
    
    // Загружаем профиль и ОБЯЗАТЕЛЬНО обновляем аватар
    loadProfile();
    
    // ДОПОЛНИТЕЛЬНО: принудительно обновляем аватар через 100мс (на случай, если DOM ещё не готов)
    setTimeout(function() {
        console.log('🔄 Принудительное обновление аватарки через 100мс');
        updateAvatarDisplay();
    }, 100);

    // Открываем раздел "Уход"
    navigateTo('care');

    // Обработка системной кнопки "Назад" (Android)
    window.addEventListener('popstate', function(event) {
        if (state.currentPage === 'detail') {
            closeDetailPage();
        }
    });
});
