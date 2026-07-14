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

            const doneEvents = state.history.filter(h =>
                h.date === dateStr &&
                h.flower_id === f.id &&
                h.type === 'watering'
            );
            if (doneEvents.length > 0) {
                hasDone = true;
            }

            if (dateStr >= todayStr) {
                const nextWateringDate = getNextWateringDate(f);
                const nextWateringStr = getLocalDateStr(nextWateringDate);

                let effectiveDateStr = nextWateringStr;
                if (dateStr === todayStr && nextWateringDate < now && f.last_watering !== todayStr) {
                    effectiveDateStr = todayStr;
                }

                if (effectiveDateStr === dateStr) {
                    hasPlanned = true;
                }

                if (f.fertilizing > 0 && isFertilizingActive(f) && !hasPlanned) {
                    const lastF = new Date(f.last_fertilizing || f.last_watering || Date.now());
                    const nextF = new Date(lastF);
                    nextF.setDate(nextF.getDate() + f.fertilizing);
                    if (getLocalDateStr(nextF) === dateStr) {
                        hasPlanned = true;
                    }
                }

                if (f.repot_interval > 0 && f.last_repotting && !hasPlanned) {
                    const lastR = new Date(f.last_repotting);
                    const nextR = new Date(lastR);
                    nextR.setFullYear(nextR.getFullYear() + f.repot_interval);
                    if (getLocalDateStr(nextR) === dateStr) {
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

        const nextWateringDate = getNextWateringDate(f);
        const nextWateringStr = getLocalDateStr(nextWateringDate);
        const now = new Date();
        const todayStr = getLocalDateStr(now);

        let plannedDateStr = nextWateringStr;
        if (nextWateringDate < now && f.last_watering !== todayStr) {
            plannedDateStr = todayStr;
        }

        if (plannedDateStr === dateStr) {
            events.push({ flower: f, type: 'watering', date: dateStr, planned: true });
        }

        if (f.fertilizing > 0 && isFertilizingActive(f)) {
            const lastF = new Date(f.last_fertilizing || f.last_watering || Date.now());
            const nextF = new Date(lastF);
            nextF.setDate(nextF.getDate() + f.fertilizing);
            if (getLocalDateStr(nextF) === dateStr) {
                events.push({ flower: f, type: 'fertilizing', date: dateStr, planned: true });
            }
        }

        if (f.repot_interval > 0 && f.last_repotting) {
            const lastR = new Date(f.last_repotting);
            const nextR = new Date(lastR);
            nextR.setFullYear(nextR.getFullYear() + f.repot_interval);
            if (getLocalDateStr(nextR) === dateStr) {
                events.push({ flower: f, type: 'repotting', date: dateStr, planned: true });
            }
        }
    });

    const doneEvents = state.history.filter(h => h.date === dateStr && state.flowers.some(f =>
        f.id === h.flower_id && isBaseEditable(f.base_id)
    ));
    doneEvents.forEach(h => {
        const f = getFlower(h.flower_id);
        if (f) {
            events.push({ flower: f, type: h.type, date: h.date, planned: false, notes: h.notes });
        }
    });

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
        return `
            <div class="event-plank" onclick="showDetail('${e.flower.id}')">
                <div>
                    <div class="name">${e.flower.name}</div>
                    <div class="sub">${e.flower.placement || ''} · ${typeMap[e.type] || e.type}</div>
                </div>
                <span class="badge">${status}</span>
            </div>
        `;
    }).join('');
}