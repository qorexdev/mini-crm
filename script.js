let leads = JSON.parse(localStorage.getItem('mini-crm-leads')) || [];
let isDarkMode = localStorage.getItem('mini-crm-dark-mode') === 'true';

const STATUS_LABELS = {
    'new': { text: 'Новая', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' },
    'in_progress': { text: 'В работе', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' },
    'done': { text: 'Завершено', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' },
    'cancelled': { text: 'Отменено', class: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' }
};

const tableBody = document.getElementById('leadsTableBody');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const modal = document.getElementById('leadModal');
const form = document.getElementById('leadForm');
const modalTitleText = document.getElementById('modalTitleText');
const themeIcon = document.getElementById('themeIcon');
const themeIconMobile = document.getElementById('themeIconMobile');
const mobileMenu = document.getElementById('mobileMenu');

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderLeads();
    updateStats();

    searchInput.addEventListener('input', renderLeads);
    statusFilter.addEventListener('change', renderLeads);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (!modal.classList.contains('hidden')) closeModal();
            closeDropdown();
        }
    });

    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('customDropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            closeDropdown();
        }

        const modalDropdown = document.getElementById('modalStatusDropdown');
        if (modalDropdown && !modalDropdown.contains(e.target)) {
            closeModalDropdown();
        }
    });

    const phoneInput = document.getElementById('leadPhone');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (!value) return e.target.value = '';

        if (value[0] === '8') value = '7' + value.slice(1);
        if (value[0] !== '7') value = '7' + value;

        value = value.substring(0, 11);

        let formattedValue = '+7';
        if (value.length > 1) formattedValue += ' (' + value.substring(1, 4);
        if (value.length > 4) formattedValue += ') ' + value.substring(4, 7);
        if (value.length > 7) formattedValue += '-' + value.substring(7, 9);
        if (value.length > 9) formattedValue += '-' + value.substring(9, 11);

        e.target.value = formattedValue;
    });
});

function initTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    updateThemeIcons(isDark);
}

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');

    localStorage.setItem('mini-crm-dark-mode', isDark);
    updateThemeIcons(isDark);
}

function updateThemeIcons(isDark) {
    const iconClass = isDark ? 'fa-sun' : 'fa-moon';

    if (themeIcon) {
        themeIcon.className = `fa-solid ${iconClass} text-xl transition-transform duration-500 ${isDark ? 'rotate-180' : 'rotate-0'}`;
    }

    if (themeIconMobile) {
        themeIconMobile.className = `fa-solid ${iconClass} text-xl`;
    }
}

function toggleMobileMenu() {
    const isHidden = mobileMenu.classList.contains('hidden');

    if (isHidden) {

        mobileMenu.classList.remove('hidden');
        requestAnimationFrame(() => {
            mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px';
            mobileMenu.style.opacity = '1';
        });
    } else {

        mobileMenu.style.maxHeight = '0';
        mobileMenu.style.opacity = '0';

        setTimeout(() => {
            mobileMenu.classList.add('hidden');
        }, 300);
    }
}

function saveLeads(highlightId = null) {
    localStorage.setItem('mini-crm-leads', JSON.stringify(leads));
    updateStats();
    renderLeads(highlightId);
}

function updateStats() {
    document.getElementById('statTotal').textContent = leads.length;
    document.getElementById('statNew').textContent = leads.filter(l => l.status === 'new').length;
    document.getElementById('statProgress').textContent = leads.filter(l => l.status === 'in_progress').length;
    document.getElementById('statDone').textContent = leads.filter(l => l.status === 'done').length;
}

function renderLeads(arg) {
    const highlightId = (typeof arg === 'number') ? arg : null;
    const searchTerm = searchInput.value.toLowerCase();
    const filterStatus = statusFilter.value;

    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.name.toLowerCase().includes(searchTerm) ||
            (lead.email || '').toLowerCase().includes(searchTerm) ||
            lead.phone.toLowerCase().includes(searchTerm) ||
            lead.comment.toLowerCase().includes(searchTerm);

        const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    tableBody.innerHTML = '';

    if (filteredLeads.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    filteredLeads.forEach(lead => {
        const tr = document.createElement('tr');
        tr.dataset.id = lead.id;
        tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group border-b border-slate-200 dark:border-slate-700 last:border-0';

        if (lead.id === highlightId) {
            tr.classList.add('bg-brand-50', 'dark:bg-brand-900/30');
            setTimeout(() => {
                tr.classList.remove('bg-brand-50', 'dark:bg-brand-900/30');
            }, 2000);
        }

        const statusConfig = STATUS_LABELS[lead.status] || STATUS_LABELS['new'];
        const dateStr = new Date(lead.date).toLocaleDateString('ru-RU', {
            day: '2-digit', month: '2-digit', year: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap" data-label="Клиент">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-xs">
                        ${getInitials(lead.name)}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-slate-900 dark:text-white select-text">${escapeHtml(lead.name)}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Email">
                <div class="text-sm text-slate-600 dark:text-slate-300 select-text">
                    ${lead.email ? `<a href="mailto:${escapeHtml(lead.email)}" class="hover:text-brand-600 dark:hover:text-brand-400 hover:underline transition-colors">${escapeHtml(lead.email)}</a>` : '<span class="text-slate-400 dark:text-slate-500">—</span>'}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Телефон">
                <div class="text-sm text-slate-600 dark:text-slate-300 font-mono select-text">
                    <a href="tel:${escapeHtml(lead.phone)}" class="hover:text-brand-600 dark:hover:text-brand-400 hover:underline transition-colors">
                        ${escapeHtml(lead.phone)}
                    </a>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Статус">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig.class}">
                    ${statusConfig.text}
                </span>
            </td>
            <td class="px-6 py-4" data-label="Комментарий">
                <div class="text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate select-text" title="${escapeHtml(lead.comment)}">
                    ${escapeHtml(lead.comment || '-')}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400 dark:text-slate-500 font-mono text-xs" data-label="Дата">
                ${dateStr}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" data-label="Действия">
                <button onclick="editLead(${lead.id})" class="text-brand-600 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 mr-3 transition-colors p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Редактировать">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="deleteLead(${lead.id})" class="text-red-400 hover:text-red-600 transition-colors p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Удалить">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function openModal(leadId = null) {
    const isEdit = leadId !== null;
    modalTitleText.textContent = isEdit ? 'Редактировать заявку' : 'Новая заявка';

    let initialStatus = 'new';
    if (isEdit) {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;
        document.getElementById('leadId').value = lead.id;
        document.getElementById('leadName').value = lead.name;
        document.getElementById('leadEmail').value = lead.email || '';
        document.getElementById('leadPhone').value = lead.phone;
        document.getElementById('leadStatus').value = lead.status;
        initialStatus = lead.status;
        document.getElementById('leadComment').value = lead.comment;
    } else {
        form.reset();
        document.getElementById('leadId').value = '';
        document.getElementById('leadEmail').value = '';
        document.getElementById('leadStatus').value = 'new';
        initialStatus = 'new';
    }

    const statusTextMap = {
        'new': 'Новая',
        'in_progress': 'В работе',
        'done': 'Завершено',
        'cancelled': 'Отменено'
    };
    document.getElementById('modalStatusValue').textContent = statusTextMap[initialStatus] || 'Новая';

    document.querySelectorAll('.modal-check-icon').forEach(icon => {
        icon.classList.remove('opacity-100');
        icon.classList.add('opacity-0');
    });
    const selectedOption = document.querySelector(`div[data-value="${initialStatus}"] .modal-check-icon`);
    if (selectedOption) {
        selectedOption.classList.remove('opacity-0');
        selectedOption.classList.add('opacity-100');
    }

    modal.classList.remove('hidden');
    const panel = modal.querySelector('.transform');

    panel.style.opacity = '0';
    panel.style.transform = 'scale(0.95) translateY(10px)';

    requestAnimationFrame(() => {

        panel.style.transition = 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        panel.style.opacity = '1';
        panel.style.transform = 'scale(1) translateY(0)';
    });

    setTimeout(() => {
        document.getElementById('leadName').focus();
    }, 50);
}

function closeModal() {
    const panel = modal.querySelector('.transform');

    panel.style.transition = 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
    panel.style.opacity = '0';
    panel.style.transform = 'scale(0.95) translateY(10px)';

    setTimeout(() => {
        modal.classList.add('hidden');

        panel.style.transition = '';
        panel.style.opacity = '';
        panel.style.transform = '';
    }, 150);
}

function handleFormSubmit(event) {
    event.preventDefault();

    const idStr = document.getElementById('leadId').value;
    const name = document.getElementById('leadName').value;
    const email = document.getElementById('leadEmail').value;
    const phone = document.getElementById('leadPhone').value;
    const status = document.getElementById('leadStatus').value;
    const comment = document.getElementById('leadComment').value;

    if (idStr) {

        const id = parseInt(idStr);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index] = { ...leads[index], name, email, phone, status, comment };
            showToast('Заявка обновлена');
            saveLeads(id);
        } else {
             saveLeads();
        }
    } else {

        const newLead = {
            id: Date.now(),
            name,
            email,
            phone,
            status,
            comment,
            date: new Date().toISOString()
        };
        leads.push(newLead);
        showToast('Заявка создана');
        saveLeads(newLead.id);
    }

    closeModal();
}

function toggleDropdown() {
    const options = document.getElementById('dropdownOptions');
    const icon = document.getElementById('dropdownIcon');
    const isHidden = options.classList.contains('hidden');

    if (isHidden) {
        options.classList.remove('hidden');

        requestAnimationFrame(() => {
            options.classList.remove('opacity-0', 'scale-95');
            options.classList.add('opacity-100', 'scale-100');
            icon.classList.add('rotate-180');
        });
    } else {
        closeDropdown();
    }
}

function closeDropdown() {
    const options = document.getElementById('dropdownOptions');
    const icon = document.getElementById('dropdownIcon');

    if (!options || options.classList.contains('hidden')) return;

    options.classList.remove('opacity-100', 'scale-100');
    options.classList.add('opacity-0', 'scale-95');
    icon.classList.remove('rotate-180');

    setTimeout(() => {
        options.classList.add('hidden');
    }, 200);
}

function selectStatus(value, text) {

    statusFilter.value = value;

    const dropdownValue = document.getElementById('dropdownValue');
    if (dropdownValue) dropdownValue.textContent = text;

    document.querySelectorAll('.check-icon').forEach(icon => {
        icon.classList.remove('opacity-100');
        icon.classList.add('opacity-0');
    });
    const selectedOption = document.querySelector(`div[data-value="${value}"] .check-icon`);
    if (selectedOption) {
        selectedOption.classList.remove('opacity-0');
        selectedOption.classList.add('opacity-100');
    }

    renderLeads();
    closeDropdown();
}

function filterByStatus(status) {
    const textMap = {
        'all': 'Все статусы',
        'new': 'Новая',
        'in_progress': 'В работе',
        'done': 'Завершено',
        'cancelled': 'Отменено'
    };

    selectStatus(status, textMap[status] || 'Все статусы');
}

function deleteLead(id) {
    if (!confirm('Вы уверены, что хотите удалить эту заявку?')) return;

    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) {

        row.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out, height 0.3s ease-out';
        row.style.opacity = '0';
        row.style.transform = 'translateX(10px)';

        setTimeout(() => {
            leads = leads.filter(l => l.id !== id);
            saveLeads();
            showToast('Заявка удалена');
        }, 300);
    } else {
        leads = leads.filter(l => l.id !== id);
        saveLeads();
        showToast('Заявка удалена');
    }
}

function editLead(id) {
    openModal(id);
}

function toggleModalDropdown() {
    const options = document.getElementById('modalStatusOptions');
    const icon = document.getElementById('modalStatusIcon');
    const isHidden = options.classList.contains('hidden');

    if (isHidden) {
        options.classList.remove('hidden');
        requestAnimationFrame(() => {
            options.classList.remove('opacity-0', 'scale-95');
            options.classList.add('opacity-100', 'scale-100');
            icon.classList.add('rotate-180');
        });
    } else {
        closeModalDropdown();
    }
}

function closeModalDropdown() {
    const options = document.getElementById('modalStatusOptions');
    const icon = document.getElementById('modalStatusIcon');

    if (!options || options.classList.contains('hidden')) return;

    options.classList.remove('opacity-100', 'scale-100');
    options.classList.add('opacity-0', 'scale-95');
    icon.classList.remove('rotate-180');

    setTimeout(() => {
        options.classList.add('hidden');
    }, 200);
}

function selectModalStatus(value, text) {

    document.getElementById('leadStatus').value = value;

    document.getElementById('modalStatusValue').textContent = text;

    document.querySelectorAll('.modal-check-icon').forEach(icon => {
        icon.classList.remove('opacity-100');
        icon.classList.add('opacity-0');
    });
    const selectedOption = document.querySelector(`div[data-value="${value}"] .modal-check-icon`);
    if (selectedOption) {
        selectedOption.classList.remove('opacity-0');
        selectedOption.classList.add('opacity-100');
    }

    closeModalDropdown();
}

function exportToCSV() {
    if (leads.length === 0) {
        showToast('Нет данных для экспорта', 'info');
        return;
    }

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Comment', 'Date'];
    const csvRows = [headers.join(',')];

    leads.forEach(lead => {
        const row = [
            lead.id,
            `"${(lead.name || '').replace(/"/g, '""')}"`,
            `"${(lead.email || '').replace(/"/g, '""')}"`,
            `"${(lead.phone || '').replace(/"/g, '""')}"`,
            lead.status,
            `"${(lead.comment || '').replace(/"/g, '""')}"`,
            lead.date
        ];
        csvRows.push(row.join(','));
    });

    const csvContent = "\uFEFF" + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `crm_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Экспорт завершен');
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        try {
            const rows = text.split('\n').filter(row => row.trim());

            const startIndex = (rows[0].includes('ID') || rows[0].includes('Name')) ? 1 : 0;

            let count = 0;
            for (let i = startIndex; i < rows.length; i++) {

                const cols = parseCSVRow(rows[i]);
                if (cols.length >= 2) {
                    const newLead = {
                        id: Date.now() + i,
                        name: cols[1]?.replace(/^"|"$/g, '') || 'Без имени',
                        email: cols[2]?.replace(/^"|"$/g, '') || '',
                        phone: cols[3]?.replace(/^"|"$/g, '') || '',
                        status: validateStatus(cols[4]) || 'new',
                        comment: cols[5]?.replace(/^"|"$/g, '') || '',
                        date: cols[6] || new Date().toISOString()
                    };
                    leads.push(newLead);
                    count++;
                }
            }
            saveLeads();
            showToast(`Импортировано ${count} заявок`, 'success');
            event.target.value = '';
        } catch (err) {
            console.error(err);
            showToast('Ошибка при импорте: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

function generateDemoData() {
    if (leads.length > 0) {
        if (!confirm('Это добавит тестовые данные к вашим текущим заявкам. Продолжить?')) return;
    }

    const demoLeads = [
        { name: 'Александр Петров', email: 'a.petrov@mail.ru', phone: '+7 (900) 123-45-67', status: 'new', comment: 'Интересуется тарифом "Бизнес"', date: new Date(Date.now() - 10000000).toISOString() },
        { name: 'Мария Сидорова', email: 'maria.s@gmail.com', phone: '+7 (900) 987-65-43', status: 'in_progress', comment: 'Ждет КП на почту, перезвонить в среду', date: new Date(Date.now() - 50000000).toISOString() },
        { name: 'ООО "Вектор"', email: 'info@vektor.ru', phone: '+7 (495) 000-00-00', status: 'done', comment: 'Оплатили счет №452', date: new Date(Date.now() - 100000000).toISOString() },
        { name: 'Дмитрий Козлов', email: '', phone: '+7 (999) 111-22-33', status: 'cancelled', comment: 'Передумали, дорого', date: new Date(Date.now() - 20000000).toISOString() },
        { name: 'Елена Новикова', email: 'lena.n@yandex.ru', phone: '+7 (900) 555-55-55', status: 'new', comment: 'Заявка с сайта', date: new Date().toISOString() }
    ];

    demoLeads.forEach((l, index) => {
        leads.push({
            id: Date.now() + index,
            ...l
        });
    });

    saveLeads();
    showToast('Демо-данные добавлены');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toastMessage.textContent = message;

    const configs = {
        success: { icon: 'fa-check', color: 'text-green-500 bg-green-50 dark:bg-green-900/30' },
        error: { icon: 'fa-triangle-exclamation', color: 'text-red-500 bg-red-50 dark:bg-red-900/30' },
        info: { icon: 'fa-info', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' }
    };

    const config = configs[type] || configs.success;

    toastIcon.className = `flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.color}`;
    toastIcon.innerHTML = `<i class="fa-solid ${config.icon}"></i>`;

    toast.classList.remove('-translate-y-24', 'opacity-0');

    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
        toast.classList.add('-translate-y-24', 'opacity-0');
    }, 3000);
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function parseCSVRow(row) {
    // Regex to handle comma-separated values, respecting quotes
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
    const columns = [];
    let match;
    while ((match = regex.exec(row))) {

        columns.push(match[1] ? match[1].replace(/""/g, '"') : match[2]);
    }
    return columns;
}

function validateStatus(status) {
    const valid = ['new', 'in_progress', 'done', 'cancelled'];
    return valid.includes(status) ? status : 'new';
}
