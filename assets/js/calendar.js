// ================================================================
// КАЛЕНДАРЬ
// ================================================================

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayStr = getLocalDateStr(now);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    weekdays.forEach(d => html += `<div class="weekday">${d}</div>`);

    const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
    for (let i = 0; i < startOffset; i++) {
        html += `<div class="day other-month"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dateStr = getLocalDateStr(dateObj);

        let hasPlanned = false;
        let hasDone = false;

        state.flowers.forEach(f => {
            if (!isBaseEditable(f.base_id)) return;

            // Проверяем выполненные события из истории
            const doneEvents = (f.history || []).filter(h =>
                h.date === dateStr &&
                (h.type === 'watering' || h.type === 'fertilizing')
            );
            if (doneEvents.length > 0) {
                hasDone = true;
            }

            // Проверяем запланированные события (ИСПРАВЛЕННАЯ ЛОГИКА)
            // Для всех дней, включая сегодня
            const nextWateringDate = getNextWateringDate(f);
            const nextWateringStr = getLocalDateStr(nextWateringDate);
            
            // Если сегодня и полив уже должен был быть (просрочка) — показываем как запланировано
            if (dateStr === todayStr && nextWateringDate <= now) {
                hasPlanned = true;
            } else if (nextWateringStr === dateStr) {
                hasPlanned = true;
            }

            // Подкормка
            if (f.fertilizing > 0 && isFertilizingActive(f)) {
                const nextFertDate = getNextFertilizingDate(f);
                if (nextFertDate) {
                    const nextFertStr = getLocalDateStr(nextFertDate);
                    if (dateStr === todayStr && nextFertDate <= now) {
                        hasPlanned = true;
                    } else if (nextFertStr === dateStr) {
                        hasPlanned = true;
                    }
                }
            }

            // Пересадка
            if (f.repot_interval > 0) {
                const nextRepotDate = getNextRepottingDate(f);
                if (nextRepotDate) {
                    const nextRepotStr = getLocalDateStr(nextRepotDate);
                    if (dateStr === todayStr && nextRepotDate <= now) {
                        hasPlanned = true;
                    } else if (nextRepotStr === dateStr) {
                        hasPlanned = true;
                    }
                }
            }
        });

        let dots = '';
        if (hasDone) dots += `<span class="dot green"></span>`;
        if (hasPlanned) dots += `<span class="dot orange"></span>`;

        const isToday = dateStr === todayStr;
        const isSelected = dateStr === state.selectedCalendarDate;

        let dayClass = 'day';
        if (isToday) dayClass += ' active';
        if (isSelected) dayClass += ' selected';

        html += `<div class="${dayClass}" onclick="selectCalendarDay('${dateStr}')">
            ${d}<div class="dots">${dots}</div>
        </div>`;
    }

    grid.innerHTML = html;
    document.getElementById('calendarHeader').textContent =
        `${['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'][month]} ${year}`;

    if (state.selectedCalendarDate) {
        showDayEvents(state.selectedCalendarDate);
    } else {
        showDayEvents(todayStr);
    }
}

function selectCalendarDay(dateStr) {
    state.selectedCalendarDate = dateStr;
    renderCalendar();
}

function showDayEvents(dateStr) {
    const container = document.getElementById('calendarEvents');
    const events = [];

    state.flowers.forEach(f => {
        if (!isBaseEditable(f.base_id)) return;

        // События из истории
        const historyEvents = (f.history || []).filter(h => h.date === dateStr);
        historyEvents.forEach(h => {
            events.push({ flower: f, type: h.type, date: h.date, planned: false, notes: h.notes });
        });

        // Запланированные события (ИСПРАВЛЕННАЯ ЛОГИКА)
        const now = new Date();
        const todayStr = getLocalDateStr(now);

        // Полив
        const nextWateringDate = getNextWateringDate(f);
        const nextWateringStr = getLocalDateStr(nextWateringDate);
        let isWateringPlanned = false;
        if (dateStr === todayStr && nextWateringDate <= now) {
            isWateringPlanned = true;
        } else if (nextWateringStr === dateStr) {
            isWateringPlanned = true;
        }
        if (isWateringPlanned) {
            const hasDone = (f.history || []).some(h => h.date === dateStr && h.type === 'watering');
            if (!hasDone) {
                events.push({ flower: f, type: 'watering', date: dateStr, planned: true });
            }
        }

        // Подкормка
        if (f.fertilizing > 0 && isFertilizingActive(f)) {
            const nextFertDate = getNextFertilizingDate(f);
            if (nextFertDate) {
                const nextFertStr = getLocalDateStr(nextFertDate);
                let isFertPlanned = false;
                if (dateStr === todayStr && nextFertDate <= now) {
                    isFertPlanned = true;
                } else if (nextFertStr === dateStr) {
                    isFertPlanned = true;
                }
                if (isFertPlanned) {
                    const hasDone = (f.history || []).some(h => h.date === dateStr && h.type === 'fertilizing');
                    if (!hasDone) {
                        events.push({ flower: f, type: 'fertilizing', date: dateStr, planned: true });
                    }
                }
            }
        }

        // Пересадка
        if (f.repot_interval > 0) {
            const nextRepotDate = getNextRepottingDate(f);
            if (nextRepotDate) {
                const nextRepotStr = getLocalDateStr(nextRepotDate);
                let isRepotPlanned = false;
                if (dateStr === todayStr && nextRepotDate <= now) {
                    isRepotPlanned = true;
                } else if (nextRepotStr === dateStr) {
                    isRepotPlanned = true;
                }
                if (isRepotPlanned) {
                    const hasDone = (f.history || []).some(h => h.date === dateStr && h.type === 'repotting');
                    if (!hasDone) {
                        events.push({ flower: f, type: 'repotting', date: dateStr, planned: true });
                    }
                }
            }
        }
    });

    // Сортировка: сначала выполненные, потом запланированные
    events.sort((a, b) => {
        if (a.planned === b.planned) return 0;
        return a.planned ? 1 : -1;
    });

    if (events.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:20px;color:#8aa08a;">
                ✨ Нет событий на этот день
            </div>
        `;
        return;
    }

    const typeMap = { watering: '💧 Полив', fertilizing: '🧪 Подкормка', repotting: '🔄 Пересадка' };
    container.innerHTML = events.map(e => {
        const status = e.planned ? '🟠 Запланировано' : '🟢 Выполнено';
        const displayName = e.flower.catalog_name || e.flower.name;
        return `
            <div class="event-plank" onclick="showDetail('${e.flower.id}')">
                <div>
                    <div class="name">${displayName}</div>
                    <div class="sub">${e.flower.placement || ''} · ${typeMap[e.type] || e.type}</div>
                </div>
                <span class="badge">${status}</span>
            </div>
        `;
    }).join('');
}
