const SUPABASE_URL = 'https://rxqmvguyntontpgxupeh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cW12Z3V5bnRvbnRwZ3h1cGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTEyMjAsImV4cCI6MjA5OTIyNzIyMH0.4bil8xGsGpMfOygS3JvGdLeP3_M99FCmOTKGgKsHX3s';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const els = {
    tbody: document.getElementById('rsvp-table-body'),
    status: document.getElementById('page-status'),
    statRsvp: document.getElementById('stat-rsvp-count'),
    statGuests: document.getElementById('stat-total-guests'),
    statGuestsDecline: document.getElementById('stat-total-guests-decline'),
    statApproved: document.getElementById('stat-approved-messages'),
    modal: document.getElementById('create-modal'),
    openBtn: document.getElementById('open-create-btn'),
    closeBtn: document.getElementById('close-create-btn'),
    cancelBtn: document.getElementById('cancel-create-btn'),
    createForm: document.getElementById('create-form'),
    submitBtn: document.getElementById('submit-create-btn')
};

function showStatus(message, type = 'ok') {
    els.status.textContent = message;
    els.status.className = `status ${type} show`;
}

function escapeHtml(str = '') {
    return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function openModal() {
    els.modal.classList.add('open');
}

function closeModal() {
    els.modal.classList.remove('open');
    els.createForm.reset();
    document.getElementById('create-guests').value = 0;
}

function updateStats(rows) {
    els.statRsvp.textContent = rows.length;
    els.statGuestsDecline.textContent = rows
    .filter(r => r.attending === 'Regretfully declines')
    .reduce((sum, r) => sum + (Number(r.guests) || 0), 0);

    els.statGuests.textContent = rows
    .filter(r => r.attending === 'Joyfully accepts')
    .reduce((sum, r) => sum + (Number(r.guests) || 0), 0);

    els.statApproved.textContent = rows.filter(r => {
    const msg = (r.message || '').trim();
    return msg && r.is_approved && r.show_message;
    }).length;
}

function getWebsiteStatus(row) {
    return row.show_message ? 'visible' : 'hidden';
}

function renderRows(rows) {
    if (!rows.length) {
    els.tbody.innerHTML = '<tr><td colspan="7" class="empty">No RSVP records yet.</td></tr>';
    return;
    }

    els.tbody.innerHTML = rows.map(row => {
    const msg = (row.message || '').trim();
    const status = getWebsiteStatus(row);
    return `
        <tr>
        <td>${escapeHtml(row.name || '')}</td>
        <td>${escapeHtml(row.email || '')}</td>
        <td>${escapeHtml(row.attending || '')}</td>
        <td>${row.guests ?? 0}</td>
        <td class="message">${msg ? escapeHtml(msg) : '<span class="muted">No message</span>'}</td>
        <td>
            <span class="status-pill ${status}">
            ${status === 'visible' ? 'Currently visible' : 'Hidden'}
            </span>
        </td>
        <td>
            <div class="action-stack">
            <button
                class="btn secondary small js-show"
                data-id="${row.id}"
                ${row.show_message ? 'disabled' : ''}>
                Show
            </button>
            <button
                class="btn hide small js-hide"
                data-id="${row.id}"
                ${!row.show_message ? 'disabled' : ''}>
                Hide
            </button>
            </div>
        </td>
        </tr>
    `;
    }).join('');
}

async function loadRsvps() {
    const { data, error } = await supabaseClient
    .from('rsvps')
    .select('id, name, email, attending, guests, message, is_approved, show_message')
    .order('created_at', { ascending: false });

    if (error) {
    console.error(error);
    showStatus('Failed to load RSVP records. Check your Supabase config or policies.', 'err');
    els.tbody.innerHTML = '<tr><td colspan="7" class="empty">Could not load RSVP records.</td></tr>';
    return;
    }

    const rows = data || [];
    updateStats(rows);
    renderRows(rows);
}

async function setMessageVisibility(id, shouldShow) {
    const { error } = await supabaseClient
    .from('rsvps')
    .update({
        show_message: shouldShow,
        is_approved: shouldShow
    })
    .eq('id', id);

    if (error) {
    console.error(error);
    showStatus('Could not update the RSVP row.', 'err');
    return;
    }

    showStatus(
    shouldShow ? 'Message is now visible on the website.' : 'Message hidden from the website.',
    'ok'
    );
    await loadRsvps();
}

async function handleCreateSubmit(e) {
    e.preventDefault();

    const payload = {
    name: document.getElementById('create-name').value.trim() || null,
    email: document.getElementById('create-email').value.trim().toLowerCase() || null,
    attending: document.getElementById('create-attending').value || 'Joyfully accepts',
    guests: Number(document.getElementById('create-guests').value || 0),
    message: document.getElementById('create-message').value.trim() || null,
    is_approved: false,
    show_message: false
    };

    els.submitBtn.disabled = true;
    els.submitBtn.textContent = 'Saving…';

    try {
    const { error } = await supabaseClient.from('rsvps').insert([payload]);
    if (error) throw error;

    showStatus('RSVP record added.', 'ok');
    closeModal();
    await loadRsvps();
    } catch (error) {
    console.error(error);
    showStatus('Could not save RSVP record. Check your table columns / insert policy.', 'err');
    } finally {
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = 'Save RSVP';
    }
}

els.openBtn.addEventListener('click', openModal);
els.closeBtn.addEventListener('click', closeModal);
els.cancelBtn.addEventListener('click', closeModal);
els.modal.addEventListener('click', (e) => {
    if (e.target === els.modal) closeModal();
});

els.createForm.addEventListener('submit', handleCreateSubmit);

els.tbody.addEventListener('click', async (e) => {
    const showBtn = e.target.closest('.js-show');
    if (showBtn && !showBtn.disabled) {
    await setMessageVisibility(showBtn.dataset.id, true);
    return;
    }

    const hideBtn = e.target.closest('.js-hide');
    if (hideBtn && !hideBtn.disabled) {
    await setMessageVisibility(hideBtn.dataset.id, false);
    }
});

loadRsvps();