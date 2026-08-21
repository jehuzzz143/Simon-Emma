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
    submitBtn: document.getElementById('submit-create-btn'),
    paginationInfo: document.getElementById('pagination-info'),
    paginationPages: document.getElementById('pagination-pages'),
    prevPageBtn: document.getElementById('prev-page-btn'),
    nextPageBtn: document.getElementById('next-page-btn')
};

const PAGE_SIZE = 20;
let allRows = [];
let currentPage = 1;

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
            <button
                class="btn danger small js-delete"
                data-id="${row.id}"
                data-name="${escapeHtml(row.name || 'this guest')}">
                Delete
            </button>
            </div>
        </td>
        </tr>
    `;
    }).join('');
}

function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = allRows.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
    const end = Math.min(currentPage * PAGE_SIZE, allRows.length);

    els.paginationInfo.textContent = allRows.length
    ? `Showing ${start}-${end} of ${allRows.length}`
    : 'No RSVP records yet.';
    els.paginationPages.textContent = `Page ${currentPage} of ${totalPages}`;

    els.prevPageBtn.disabled = currentPage <= 1;
    els.nextPageBtn.disabled = currentPage >= totalPages;
}

function renderPage() {
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageRows = allRows.slice(start, start + PAGE_SIZE);
    renderRows(pageRows);
    renderPagination();
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

    allRows = data || [];
    updateStats(allRows);
    renderPage();
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

async function deleteRsvp(id) {
    const { error } = await supabaseClient
    .from('rsvps')
    .delete()
    .eq('id', id);

    if (error) {
    console.error(error);
    showStatus('Could not delete the RSVP row.', 'err');
    return;
    }

    showStatus('RSVP record deleted.', 'ok');
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
    return;
    }

    const deleteBtn = e.target.closest('.js-delete');
    if (deleteBtn) {
    const name = deleteBtn.dataset.name;
    if (confirm(`Delete RSVP for ${name}? This cannot be undone.`)) {
        await deleteRsvp(deleteBtn.dataset.id);
    }
    }
});

// ---------- background music settings ----------
const musicEls = {
    urlInput: document.getElementById('music-youtube-url'),
    startInput: document.getElementById('music-start-time'),
    preview: document.getElementById('music-start-preview'),
    status: document.getElementById('music-status'),
    saveBtn: document.getElementById('music-save-btn'),
};

function extractYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
}

function formatMmSs(totalSeconds) {
    const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
}

async function loadMusicSettings() {
    const { data, error } = await supabaseClient
    .from('site_settings')
    .select('youtube_url, start_time')
    .eq('id', 1)
    .maybeSingle();

    if (error) {
    console.error(error);
    musicEls.status.textContent = 'Could not load current settings.';
    return;
    }

    musicEls.urlInput.value = (data && data.youtube_url) || '';
    musicEls.startInput.value = (data && data.start_time) || 0;
    musicEls.preview.textContent = formatMmSs(musicEls.startInput.value);
}

musicEls.startInput.addEventListener('input', () => {
    musicEls.preview.textContent = formatMmSs(musicEls.startInput.value);
});

musicEls.saveBtn.addEventListener('click', async () => {
    const url = musicEls.urlInput.value.trim();
    const startTime = Math.max(0, Math.floor(Number(musicEls.startInput.value) || 0));

    if (url && !extractYouTubeId(url)) {
    musicEls.status.textContent = 'That doesn’t look like a valid YouTube link.';
    musicEls.status.style.color = 'var(--err)';
    return;
    }

    musicEls.saveBtn.disabled = true;
    musicEls.saveBtn.textContent = 'Saving…';
    musicEls.status.style.color = '';

    try {
    const { error } = await supabaseClient
        .from('site_settings')
        .upsert({ id: 1, youtube_url: url || null, start_time: startTime, updated_at: new Date().toISOString() });
    if (error) throw error;

    musicEls.status.textContent = 'Saved. Refresh the main site to hear it.';
    } catch (error) {
    console.error(error);
    musicEls.status.textContent = 'Could not save music settings.';
    musicEls.status.style.color = 'var(--err)';
    } finally {
    musicEls.saveBtn.disabled = false;
    musicEls.saveBtn.textContent = 'Save Music Settings';
    }
});

loadMusicSettings();

els.prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
    currentPage -= 1;
    renderPage();
    }
});

els.nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
    if (currentPage < totalPages) {
    currentPage += 1;
    renderPage();
    }
});

loadRsvps();