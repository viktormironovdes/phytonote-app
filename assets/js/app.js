// ================================================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Загружаем состояние
    loadState();

    // Навигация
    document.querySelectorAll('.bottom-nav .tab').forEach(tab => {
        tab.addEventListener('click', () => navigateTo(tab.dataset.page));
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
    loadProfile();

    // Открываем раздел "Уход"
    navigateTo('care');
});