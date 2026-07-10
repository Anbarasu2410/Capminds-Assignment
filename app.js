/* ===== State ===== */
let appointments = JSON.parse(localStorage.getItem('capminds_appts') || '[]');
let currentView = 'calendar';
let calViewMode = 'month';
let currentDate = new Date();
let editingId = null;
let detailId = null;
let filterPatient = '';
let filterDoctor = '';
let filterDateFrom = '';
let filterDateTo = '';

/* ===== Persist ===== */
function saveData() {
  localStorage.setItem('capminds_appts', JSON.stringify(appointments));
}

/* ===== Utilities ===== */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function formatTime(t) {
  if (!t) return '';
  const [hh, mm] = t.split(':');
  const h = parseInt(hh, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${mm} ${ampm}`;
}

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayIso() { return isoDate(new Date()); }

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ===== Sidebar Toggle ===== */
const sidebar = document.getElementById('sidebar');
const mainWrapper = document.getElementById('mainWrapper');
const sidebarToggle = document.getElementById('sidebarToggle');

sidebarToggle.addEventListener('click', () => {
  const isCollapsed = sidebar.classList.toggle('collapsed');
  mainWrapper.classList.toggle('sidebar-collapsed', isCollapsed);
});

/* ===== Nav ===== */
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;
    document.getElementById('viewCalendar').classList.toggle('hidden', currentView !== 'calendar');
    document.getElementById('viewDashboard').classList.toggle('hidden', currentView !== 'dashboard');
    if (currentView === 'dashboard') renderDashboard();
    if (currentView === 'calendar') renderCalendar();
  });
});

/* ===== Book Appointment Button ===== */
document.getElementById('btnBookAppointment').addEventListener('click', () => openModal());

/* ===== Modal ===== */
function openModal(apptId) {
  editingId = apptId || null;
  const overlay = document.getElementById('modalOverlay');
  clearErrors();

  if (editingId) {
    const appt = appointments.find(a => a.id === editingId);
    if (!appt) return;
    document.getElementById('fPatient').value = appt.patient;
    document.getElementById('fDoctor').value = appt.doctor;
    document.getElementById('fHospital').value = appt.hospital;
    document.getElementById('fSpecialty').value = appt.specialty;
    document.getElementById('fDate').value = appt.date;
    document.getElementById('fTime').value = appt.time;
    document.getElementById('fReason').value = appt.reason;
    document.getElementById('modalTitle').textContent = 'Edit Appointment';
    document.querySelectorAll('select.form-select').forEach(updateSelectColor);
  } else {
    document.getElementById('apptForm').reset();
    document.getElementById('modalTitle').textContent = 'Schedule Appointment';
    document.querySelectorAll('select.form-select').forEach(sel => { sel.value = ''; updateSelectColor(sel); });
  }

  overlay.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  editingId = null;
  clearErrors();
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

/* ===== Validation ===== */
function clearErrors() {
  ['Patient','Doctor','Hospital','Specialty','Date','Time'].forEach(f => {
    const el = document.getElementById('err' + f);
    const inp = document.getElementById('f' + f);
    if (el) el.textContent = '';
    if (inp) inp.closest('.form-group').classList.remove('has-error');
  });
}

function setError(field, msg) {
  const el = document.getElementById('err' + field);
  const inp = document.getElementById('f' + field);
  if (el) el.textContent = msg;
  if (inp) inp.closest('.form-group').classList.add('has-error');
}

function validateForm() {
  clearErrors();
  let valid = true;
  const required = [
    { id: 'fPatient', key: 'Patient', label: 'Patient name' },
    { id: 'fDoctor', key: 'Doctor', label: 'Doctor name' },
    { id: 'fHospital', key: 'Hospital', label: 'Hospital name' },
    { id: 'fSpecialty', key: 'Specialty', label: 'Specialty' },
    { id: 'fDate', key: 'Date', label: 'Date' },
    { id: 'fTime', key: 'Time', label: 'Time' },
  ];
  required.forEach(({ id, key, label }) => {
    const val = document.getElementById(id).value.trim();
    if (!val) { setError(key, `${label} is required`); valid = false; }
  });
  return valid;
}

/* ===== Form Submit ===== */
document.getElementById('apptForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm()) return;

  const appt = {
    id: editingId || uid(),
    patient: document.getElementById('fPatient').value.trim(),
    doctor: document.getElementById('fDoctor').value.trim(),
    hospital: document.getElementById('fHospital').value.trim(),
    specialty: document.getElementById('fSpecialty').value,
    date: document.getElementById('fDate').value,
    time: document.getElementById('fTime').value,
    reason: document.getElementById('fReason').value.trim(),
  };

  if (editingId) {
    const idx = appointments.findIndex(a => a.id === editingId);
    if (idx > -1) appointments[idx] = appt;
  } else {
    appointments.push(appt);
  }

  saveData();
  closeModal();
  renderCalendar();
  if (currentView === 'dashboard') renderDashboard();
});

/* ===== Delete ===== */
function deleteAppt(id) {
  if (!confirm('Delete this appointment?')) return;
  appointments = appointments.filter(a => a.id !== id);
  saveData();
  closeDetail();
  renderCalendar();
  if (currentView === 'dashboard') renderDashboard();
}

/* ===== Detail Modal ===== */
function openDetail(id) {
  detailId = id;
  const appt = appointments.find(a => a.id === id);
  if (!appt) return;
  const content = document.getElementById('detailContent');
  content.innerHTML = `
    <span class="detail-label">Patient</span><span class="detail-value">${escHtml(appt.patient)}</span>
    <span class="detail-label">Doctor</span><span class="detail-value">${escHtml(appt.doctor)}</span>
    <span class="detail-label">Hospital</span><span class="detail-value">${escHtml(appt.hospital)}</span>
    <span class="detail-label">Specialty</span><span class="detail-value">${escHtml(appt.specialty)}</span>
    <span class="detail-label">Date</span><span class="detail-value">${formatDate(appt.date)}</span>
    <span class="detail-label">Time</span><span class="detail-value">${formatTime(appt.time)}</span>
    <span class="detail-label">Reason</span><span class="detail-value">${escHtml(appt.reason || '—')}</span>
  `;
  document.getElementById('detailOverlay').classList.remove('hidden');
}

function closeDetail() {
  document.getElementById('detailOverlay').classList.add('hidden');
  detailId = null;
}

document.getElementById('detailClose').addEventListener('click', closeDetail);
document.getElementById('detailOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('detailOverlay')) closeDetail();
});
document.getElementById('detailEdit').addEventListener('click', () => {
  const id = detailId;
  closeDetail();
  openModal(id);
});
document.getElementById('detailDelete').addEventListener('click', () => {
  deleteAppt(detailId);
});

/* ===== Calendar ===== */
const calViewSelect = document.getElementById('calViewSelect');
calViewSelect.addEventListener('change', () => {
  calViewMode = calViewSelect.value;
  document.getElementById('calMonthView').classList.toggle('hidden', calViewMode !== 'month');
  document.getElementById('calWeekView').classList.toggle('hidden', calViewMode !== 'week');
  renderCalendar();
});

document.getElementById('calPrev').addEventListener('click', () => {
  if (calViewMode === 'month') {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  } else {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    currentDate = d;
  }
  renderCalendar();
});

document.getElementById('calNext').addEventListener('click', () => {
  if (calViewMode === 'month') {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  } else {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    currentDate = d;
  }
  renderCalendar();
});

document.getElementById('btnToday').addEventListener('click', () => {
  currentDate = new Date();
  renderCalendar();
});

function renderCalendar() {
  updateCalLabel();
  if (calViewMode === 'month') renderMonthView();
  else renderWeekView();
}

function updateCalLabel() {
  const opts = { year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('calMonthLabel').textContent = currentDate.toLocaleDateString('en-US', opts);
}

/* --- Month View --- */
function renderMonthView() {
  const body = document.getElementById('calBody');
  body.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = todayIso();

  // Use filtered appointments for calendar too
  const visibleAppts = getFilteredAppts();

  let cells = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), otherMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), otherMonth: false });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, next++), otherMonth: true });
  }

  cells.forEach(({ date, otherMonth }) => {
    const iso = isoDate(date);
    const dayAppts = visibleAppts.filter(a => a.date === iso);

    const cell = document.createElement('div');
    cell.className = 'cal-cell' +
      (otherMonth ? ' other-month' : '') +
      (iso === today ? ' today' : '');
    cell.dataset.date = iso;

    const dateLabel = document.createElement('div');
    dateLabel.className = 'cal-date';
    dateLabel.textContent = date.getDate();
    cell.appendChild(dateLabel);

    dayAppts.forEach(appt => cell.appendChild(makeChip(appt)));

    cell.addEventListener('click', e => {
      if (e.target.closest('.chip-btn')) return;
      if (e.target.closest('.appt-chip')) {
        openDetail(e.target.closest('.appt-chip').dataset.id);
        return;
      }
      openModalWithDate(iso);
    });

    body.appendChild(cell);
  });
}

function makeChip(appt) {
  const chip = document.createElement('div');
  chip.className = 'appt-chip';
  chip.dataset.id = appt.id;

  const info = document.createElement('div');
  info.className = 'chip-info';

  const patient = document.createElement('span');
  patient.className = 'chip-patient';
  patient.textContent = appt.patient;

  const doctor = document.createElement('span');
  doctor.className = 'chip-doctor';
  doctor.textContent = appt.doctor;

  const time = document.createElement('span');
  time.className = 'chip-time';
  time.textContent = formatTime(appt.time);

  info.appendChild(patient);
  info.appendChild(doctor);
  info.appendChild(time);

  const actions = document.createElement('div');
  actions.className = 'chip-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'chip-btn';
  editBtn.title = 'Edit';
  editBtn.textContent = '✏️';
  editBtn.addEventListener('click', e => { e.stopPropagation(); openModal(appt.id); });

  const delBtn = document.createElement('button');
  delBtn.className = 'chip-btn';
  delBtn.title = 'Delete';
  delBtn.textContent = '🗑️';
  delBtn.addEventListener('click', e => { e.stopPropagation(); deleteAppt(appt.id); });

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);
  chip.appendChild(info);
  chip.appendChild(actions);

  return chip;
}

function openModalWithDate(iso) {
  openModal();
  setTimeout(() => { document.getElementById('fDate').value = iso; }, 10);
}

/* --- Week View --- */
function renderWeekView() {
  const grid = document.getElementById('weekGrid');
  grid.innerHTML = '';

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }

  const today = todayIso();
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const headerRow = document.createElement('div');
  headerRow.className = 'week-header-row';

  const timeCorner = document.createElement('div');
  timeCorner.className = 'week-day-col';
  timeCorner.textContent = '';
  headerRow.appendChild(timeCorner);

  days.forEach((d, i) => {
    const iso = isoDate(d);
    const col = document.createElement('div');
    col.className = 'week-day-col' + (iso === today ? ' today' : '');
    col.innerHTML = `<div>${dayNames[i]}</div><div style="font-size:13px;font-weight:700">${d.getDate()}</div>`;
    headerRow.appendChild(col);
  });

  grid.appendChild(headerRow);

  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'week-body';

  const visibleAppts = getFilteredAppts();

  // Hours 7am–8pm
  for (let h = 7; h <= 20; h++) {
    const row = document.createElement('div');
    row.className = 'week-row';

    const timeCell = document.createElement('div');
    timeCell.className = 'week-time-col';
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    timeCell.textContent = `${hr}:00 ${ampm}`;
    row.appendChild(timeCell);

    days.forEach(d => {
      const iso = isoDate(d);
      const cell = document.createElement('div');
      cell.className = 'week-cell' + (iso === today ? ' today' : '');

      const slotAppts = visibleAppts.filter(a => {
        if (a.date !== iso) return false;
        const apptH = parseInt(a.time.split(':')[0], 10);
        return apptH === h;
      });

      slotAppts.forEach(appt => {
        const chip = document.createElement('div');
        chip.className = 'appt-chip';
        chip.style.marginBottom = '2px';
        chip.dataset.id = appt.id;

        const pt = document.createElement('span');
        pt.className = 'chip-patient';
        pt.textContent = appt.patient;

        const actions = document.createElement('div');
        actions.className = 'chip-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'chip-btn';
        editBtn.textContent = '✏️';
        editBtn.addEventListener('click', e => { e.stopPropagation(); openModal(appt.id); });

        const delBtn = document.createElement('button');
        delBtn.className = 'chip-btn';
        delBtn.textContent = '🗑️';
        delBtn.addEventListener('click', e => { e.stopPropagation(); deleteAppt(appt.id); });

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        const info = document.createElement('div');
        info.className = 'chip-info';
        info.appendChild(pt);

        chip.appendChild(info);
        chip.appendChild(actions);
        chip.addEventListener('click', () => openDetail(appt.id));
        cell.appendChild(chip);
      });

      row.appendChild(cell);
    });

    bodyWrap.appendChild(row);
  }

  grid.appendChild(bodyWrap);
}

/* ===== Dashboard ===== */
function getFilteredAppts() {
  return appointments.filter(a => {
    const matchPatient = !filterPatient || a.patient.toLowerCase().includes(filterPatient.toLowerCase());
    const matchDoctor = !filterDoctor || a.doctor.toLowerCase().includes(filterDoctor.toLowerCase());
    const matchFrom = !filterDateFrom || a.date >= filterDateFrom;
    const matchTo = !filterDateTo || a.date <= filterDateTo;
    return matchPatient && matchDoctor && matchFrom && matchTo;
  });
}

function renderDashboard() {
  const tbody = document.getElementById('apptTableBody');
  const emptyState = document.getElementById('emptyState');
  const filtered = getFilteredAppts();

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    document.getElementById('apptTable').style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    document.getElementById('apptTable').style.display = 'table';

    filtered.sort((a, b) => (a.date > b.date ? 1 : -1));

    filtered.forEach(appt => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="td-patient" data-id="${appt.id}">${escHtml(appt.patient)}</td>
        <td>${escHtml(appt.doctor)}</td>
        <td>${escHtml(appt.hospital)}</td>
        <td>${escHtml(appt.specialty)}</td>
        <td>${formatDate(appt.date)}</td>
        <td class="td-time">${formatTime(appt.time)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-action edit-btn" data-id="${appt.id}" title="Edit">✏️</button>
            <button class="btn-action delete btn-del" data-id="${appt.id}" title="Delete">🗑️</button>
          </div>
        </td>
      `;

      tr.querySelector('.td-patient').addEventListener('click', () => openDetail(appt.id));
      tr.querySelector('.edit-btn').addEventListener('click', () => openModal(appt.id));
      tr.querySelector('.btn-del').addEventListener('click', () => deleteAppt(appt.id));

      tbody.appendChild(tr);
    });
  }
}

/* ===== Filter Listeners ===== */
document.getElementById('btnUpdate').addEventListener('click', () => {
  filterPatient = document.getElementById('searchPatient').value.trim();
  filterDoctor = document.getElementById('searchDoctor').value.trim();
  filterDateFrom = document.getElementById('filterDateFrom').value;
  filterDateTo = document.getElementById('filterDateTo').value;
  renderDashboard();
  renderCalendar();
});

['searchPatient', 'searchDoctor'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    filterPatient = document.getElementById('searchPatient').value.trim();
    filterDoctor = document.getElementById('searchDoctor').value.trim();
    renderDashboard();
    renderCalendar();
  });
});

['filterDateFrom', 'filterDateTo'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    filterDateFrom = document.getElementById('filterDateFrom').value;
    filterDateTo = document.getElementById('filterDateTo').value;
    renderDashboard();
    renderCalendar();
  });
});

/* ===== Init ===== */
renderCalendar();

/* ===== Select placeholder color ===== */
function updateSelectColor(sel) {
  sel.style.color = sel.value === '' ? '#aaa' : '';
}

document.querySelectorAll('select.form-select').forEach(sel => {
  updateSelectColor(sel);
  sel.addEventListener('change', () => updateSelectColor(sel));
});
