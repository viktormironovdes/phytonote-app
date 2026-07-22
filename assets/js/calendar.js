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

        let hasDone = false;
        let hasPlanned = false;
        let hasNote = false;

        state.flowers.forEach(f => {
            if (!isBaseEditable(f.base_id)) return;

            const historyEvents = (f.history || []).filter(h => h.date === dateStr);
            
            historyEvents.forEach(h => {
                if (h.type === 'watering' || h.type === 'fertilizing' || h.type === 'repotting') {
                    hasDone = true;
                }
                if (h.type === 'note') {
                    hasNote = true;
                }
            });

            if (dateStr >= todayStr) {
                const nextWateringDate = getNextWateringDate(f);
                if (getLocalDateStr(nextWateringDate) === dateStr) {
                    const hasDoneToday = (f.history || []).some(h => h.date === dateStr && h.type === 'watering');
                    if (!hasDoneToday) hasPlanned = true;
                }
                
                if (f.fertilizing > 0 && isFertilizingActive(f)) {
                    const nextFertDate = getNextFertilizingDate(f);
                    if (nextFertDate && getLocalDateStr(nextFertDate) === dateStr) {
                        const hasDoneToday = (f.history || []).some(h => h.date === dateStr && h.type === 'fertilizing');
                        if (!hasDoneToday) hasPlanned = true;
                    }
                }
                
                if (f.repot_interval > 0) {
                    const nextRepotDate = getNextRepottingDate(f);
                    if (nextRepotDate && getLocalDateStr(nextRepotDate) === dateStr) {
                        const hasDoneToday = (f.history || []).some(h => h.date === dateStr && h.type === 'repotting');
                        if (!hasDoneToday) hasPlanned = true;
                    }
                }
            }
        });

        let dotColor = '';
        if (hasDone) {
            dotColor = 'green';
        } else if (hasPlanned) {
            dotColor = 'orange';
        }

        const noteIcon = hasNote ? '💬' : '';

        const isToday = dateStr === todayStr;
        const isSelected = dateStr === state.selectedCalendarDate;

        let dayClass = 'day';
        if (isToday) dayClass += ' active';
        if (isSelected) dayClass += ' selected';

        html += `<div class="${dayClass}" onclick="selectCalendarDay('${dateStr}')" style="position:relative;">
            ${d}
            ${noteIcon ? `<span style="position:absolute;top:2px;right:4px;font-size:10px;">${noteIcon}</span>` : ''}
            ${dotColor ? `<div class="dots"><span class="dot ${dotColor}"></span></div>` : ''}
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

        const historyEvents = (f.history || []).filter(h => h.date === dateStr);
        historyEvents.forEach(h => {
            events.push({ flower: f, type: h.type, date: h.date, planned: false, text: h.text || '' });
        });

        const now = new Date();
        const todayStr = getLocalDateStr(now);
        
        if (dateStr >= todayStr) {
            const nextWateringDate = getNextWateringDate(f);
            if (getLocalDateStr(nextWateringDate) === dateStr) {
                const hasDone = (f.history || []).some(h => h.date === dateStr && h.type === 'watering');
                if (!hasDone) {
                    events.push({ flower: f, type: 'watering', date: dateStr, planned: true, text: '' });
                }
            }
            
            if (f.fertilizing > 0 && isFertilizingActive(f)) {
                const nextFertDate = getNextFertilizingDate(f);
                if (nextFertDate && getLocalDateStr(nextFertDate) === dateStr) {
                    const hasDone = (f.history || []).some(h => h.date === dateStr && h.type === 'fertilizing');
                    if (!hasDone) {
                        events.push({ flower: f, type: 'fertilizing', date: dateStr, planned: true, text: '' });
                    }
                }
            }
            
            if (f.repot_interval > 0) {
                const nextRepotDate = getNextRepottingDate(f);
                if (nextRepotDate && getLocalDateStr(nextRepotDate) === dateStr) {
                    const hasDone = (f.history || []).some(h => h.date === dateStr && h.type === 'repotting');
                    if (!hasDone) {
                        events.push({ flower: f, type: 'repotting', date: dateStr, planned: true, text: '' });
                    }
                }
            }
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

    const typeMap = { 
        watering: '💧 Полив', 
        fertilizing: '🧪 Подкормка', 
        repotting: '🔄 Пересадка',
        note: '💬 Заметка'
    };
    
    container.innerHTML = events.map(e => {
        const status = e.planned ? '🟠 Запланировано' : '🟢 Выполнено';
        const displayName = e.flower.catalog_name || e.flower.name;
        const textDisplay = e.text ? `: ${e.text}` : '';
        const isNote = e.type === 'note';
        
        return `
            <div class="event-plank" onclick="${isNote ? '' : `showDetail('${e.flower.id}')`}" style="${isNote ? 'border-left-color: #4a90d9; cursor: default;' : 'cursor: pointer;'}">
                <div>
                    <div class="name">${displayName} ${isNote ? '💬' : ''}</div>
                    <div class="sub">${e.flower.placement || '—'} · ${typeMap[e.type] || e.type}${textDisplay}</div>
                </div>
                <span class="badge" style="${isNote ? 'background:#dce8f5;color:#2d5a7a;' : ''}">${isNote ? '📝 Заметка' : status}</span>
            </div>
        `;
    }).join('');
}
