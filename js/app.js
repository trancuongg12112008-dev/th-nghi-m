// ===== AUTH CHECK =====
if (sessionStorage.getItem('auth') !== 'admin') location.href = 'login.html';

// ===== ROUTER =====
const pages = { dashboard, students, classes, tuition, receipts, discounts };
const pageTitles = { dashboard:'Dashboard', students:'Qu\u1ea3n L\u00fd H\u1ecdc Vi\u00ean', classes:'Qu\u1ea3n L\u00fd L\u1edbp H\u1ecdc', tuition:'Qu\u1ea3n L\u00fd H\u1ecdc Ph\u00ed', receipts:'Bi\u00ean Lai \u0110\u0103ng K\u00fd', discounts:'M\u00e3 Gi\u1ea3m Gi\u00e1' };

function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  document.getElementById('headerTitle').textContent = pageTitles[page] || page;
  document.getElementById('mainContent').innerHTML = '';
  pages[page]();
}

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.page); });
});

// Sidebar toggle
document.getElementById('toggleSidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
  document.querySelector('.main-wrapper').classList.toggle('expanded');
});

// Site name
document.getElementById('siteName').innerHTML = 'Duy Ho\u00e0ng <b>D\u1ea1y To\u00e1n</b>';
document.getElementById('footerName').innerHTML = '\u00a9 2026 <b>Duy Ho\u00e0ng D\u1ea1y To\u00e1n</b> \u2013 Qu\u1ea3n l\u00fd d\u1ec5 d\u00e0ng \u2013 V\u1eadn h\u00e0nh chuy\u00ean nghi\u1ec7p';
document.title = 'Duy Ho\u00e0ng D\u1ea1y To\u00e1n';
function updateClock() {
  const now = new Date();
  document.getElementById('headerDate').textContent = now.toLocaleDateString('vi-VN', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) + '  ' + now.toLocaleTimeString('vi-VN');
}
updateClock();
setInterval(updateClock, 1000);

// ===== MODAL HELPERS =====
function openModal(title, bodyHTML, onConfirm) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  const btn = document.getElementById('modalConfirm');
  btn.style.display = '';
  btn.innerHTML = 'L\u01b0u';
  btn.className = 'btn btn-primary';
  btn.onclick = () => { if(onConfirm()) closeModal(); };
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
document.getElementById('modalClose').onclick = closeModal;
document.getElementById('modalCancel').onclick = closeModal;
document.getElementById('modalOverlay').addEventListener('click', e => { if(e.target === document.getElementById('modalOverlay')) closeModal(); });

// ===== TOAST =====
function toast(msg, type='success') {
  saveDB(); // lưu mỗi khi có thay đổi
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:28px;right:28px;background:${type==='success'?'#10b981':type==='error'?'#ef4444':'#f59e0b'};color:#fff;padding:12px 22px;border-radius:10px;font-size:.9rem;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.15);animation:fadeIn .3s`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// ===== CONFIRM DELETE =====
function confirmDelete(msg, onYes) {
  openModal('Xác nhận xóa', `<p style="color:#ef4444;font-size:1rem;"><i class="fas fa-exclamation-triangle"></i> ${msg}</p>`, () => { onYes(); return true; });
  document.getElementById('modalConfirm').textContent = 'Xóa';
  document.getElementById('modalConfirm').className = 'btn btn-danger';
}

// ===== PAGE: DASHBOARD =====
function dashboard() {
  const c = document.getElementById('mainContent');
  const totalStudents = DB.students.length;
  const totalClasses = DB.classes.length;

  // Thời gian thực
  const now = new Date(); now.setHours(0,0,0,0);
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed
  const curMonthStr = `${curYear}-${String(curMonth+1).padStart(2,'0')}`;
  const curMonthLabel = `tháng ${curMonth+1}/${curYear}`;

  // Doanh thu tháng hiện tại
  const monthRevenue = DB.receipts.filter(r => r.date && r.date.startsWith(curMonthStr)).reduce((a,r) => a+r.amount, 0);

  // Thông báo khóa học
  const notify = DB.classes.map(cl => {
    if (!cl.endDate) return null;
    const end = new Date(cl.endDate); end.setHours(0,0,0,0);
    const days = Math.round((end - now) / (1000*60*60*24));
    if (days < 0) return { cl, days, type: 'ended' };
    if (days <= 30) return { cl, days, type: 'soon' };
    return null;
  }).filter(Boolean);

  // Doanh thu 6 tháng gần nhất từ dữ liệu thực
  const revenueLabels = [];
  const revenueData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(curYear, curMonth - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    revenueLabels.push(`T${d.getMonth()+1}/${d.getFullYear()}`);
    revenueData.push(DB.receipts.filter(r => r.date && r.date.startsWith(key)).reduce((a,r) => a+r.amount, 0));
  }

  c.innerHTML = `
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-icon"><i class="fas fa-user-graduate"></i></div><div class="stat-info"><div class="stat-value">${totalStudents}</div><div class="stat-label">Tổng học viên</div></div></div>
    <div class="stat-card green"><div class="stat-icon"><i class="fas fa-chalkboard-teacher"></i></div><div class="stat-info"><div class="stat-value">${totalClasses}</div><div class="stat-label">Tổng lớp học</div></div></div>
    <div class="stat-card blue"><div class="stat-icon"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-value">${formatCurrency(monthRevenue)}</div><div class="stat-label">Doanh thu ${curMonthLabel}</div></div></div>
  </div>
  ${notify.length ? `
  <div class="card" style="border-left:4px solid #f59e0b;margin-bottom:24px">
    <div class="card-header" style="padding-bottom:12px;margin-bottom:12px">
      <div class="card-title"><i class="fas fa-bell" style="color:#f59e0b"></i> Thông báo khóa học</div>
      <span class="badge badge-warning">${notify.length} thông báo</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${notify.map(n => `
        <div style="display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:10px;background:${n.type==='ended'?'rgba(239,68,68,0.06)':'rgba(245,158,11,0.06)'}">
          <div style="width:40px;height:40px;border-radius:10px;background:${n.type==='ended'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)'};display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:${n.type==='ended'?'#ef4444':'#f59e0b'}">
            <i class="fas fa-${n.type==='ended'?'times-circle':'clock'}"></i>
          </div>
          <div style="flex:1">
            <div style="font-weight:700;color:#1e293b">${n.cl.name}</div>
            <div style="font-size:.82rem;color:#64748b;margin-top:2px">
              ${n.cl.subject ? n.cl.subject + ' · ' : ''}Kết thúc: ${formatDate(n.cl.endDate)}
            </div>
          </div>
          <span style="font-size:.82rem;font-weight:700;padding:5px 12px;border-radius:20px;background:${n.type==='ended'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)'};color:${n.type==='ended'?'#ef4444':'#f59e0b'}">
            ${n.type==='ended' ? 'Đã kết thúc' : `Còn ${n.days} ngày`}
          </span>
        </div>`).join('')}
    </div>
  </div>` : ''}
  <div class="charts-grid">
    <div class="chart-card"><h3><i class="fas fa-chart-bar"></i> Học viên theo lớp</h3><canvas id="chartClass" height="200"></canvas></div>
    <div class="chart-card"><h3><i class="fas fa-chart-line"></i> Doanh thu 6 tháng gần nhất</h3><canvas id="chartRevenue" height="200"></canvas></div>
  </div>`;

  // Charts
  new Chart(document.getElementById('chartClass'), {
    type: 'bar',
    data: {
      labels: DB.classes.map(c=>c.name),
      datasets: [{ label: 'Số học viên', data: DB.classes.map(c=>getStudentsByClass(c.id).length), backgroundColor: ['#4f46e5','#7c3aed','#3b82f6'], borderRadius: 8 }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
  new Chart(document.getElementById('chartRevenue'), {
    type: 'line',
    data: {
      labels: revenueLabels,
      datasets: [{ label: 'Doanh thu (đ)', data: revenueData, borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.08)', tension: 0.4, fill: true, pointBackgroundColor: '#4f46e5' }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}

// ===== PAGE: STUDENTS =====
function students() {
  const c = document.getElementById('mainContent');
  let filter = '';

  function render() {
    let list = DB.students.filter(s =>
      (!filter || s.name.toLowerCase().includes(filter) || s.id.toLowerCase().includes(filter) || s.phone.includes(filter))
    );
    c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-user-graduate"></i> Danh Sách Học Viên</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" id="btnAddStudent"><i class="fas fa-plus"></i> Thêm học viên</button>
          <button class="btn btn-danger" id="btnClearStudents"><i class="fas fa-trash-alt"></i> Xóa tất cả</button>
        </div>
      </div>
      <div class="toolbar">
        <div class="search-box"><i class="fas fa-search"></i><input type="text" placeholder="Tìm theo tên, mã, SĐT..." id="searchStudent" value="${filter}"/></div>
        <button class="btn btn-success" id="btnExportExcel"><i class="fas fa-file-excel"></i> Xu&#7845;t Excel</button>
        <label class="btn btn-info" style="cursor:pointer"><i class="fas fa-upload"></i> Nh&#7853;p Excel/CSV<input type="file" id="importExcel" accept=".xlsx,.xls,.csv" style="display:none"/></label>
        <button class="btn btn-secondary" id="btnDownloadTemplate"><i class="fas fa-download"></i> T&#7843;i file m&#7851;u</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mã HV</th><th>Họ và tên</th><th>SĐT</th><th>Gmail</th><th>Lớp</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
          <tbody>
          ${list.map(s=>`<tr>
            <td><b>${s.id}</b></td><td>${s.name}</td><td>${s.phone||'—'}</td><td>${s.email||'—'}</td>
            <td>${getClassById(s.centerClass)?.name||'—'}</td>
            <td>${s.createdAt ? formatDate(s.createdAt) : '—'}</td>
            <td><div class="action-btns">
              <button class="btn btn-info btn-sm" onclick="viewStudent('${s.id}')"><i class="fas fa-eye"></i></button>
              <button class="btn btn-warning btn-sm" onclick="editStudent('${s.id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')"><i class="fas fa-trash"></i></button>
            </div></td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    document.getElementById('btnAddStudent').onclick = () => addStudentModal();
    document.getElementById('btnClearStudents').onclick = () => {
      confirmDelete('X\u00f3a to\u00e0n b\u1ed9 h\u1ecdc vi\u00ean? H\u00e0nh \u0111\u1ed9ng n\u00e0y kh\u00f4ng th\u1ec3 ho\u00e0n t\u00e1c!', () => {
        DB.students = []; saveDB(); toast('X\u00f3a to\u00e0n b\u1ed9 h\u1ecdc vi\u00ean th\u00e0nh c\u00f4ng!', 'warning'); render();
      });
    };
    document.getElementById('searchStudent').oninput = e => { filter = e.target.value.toLowerCase(); render(); };
    document.getElementById('btnExportExcel').onclick = () => exportStudentsExcel();
    document.getElementById('importExcel').onchange = e => importStudentsExcel(e);
    document.getElementById('btnDownloadTemplate').onclick = () => downloadTemplate();
  }
  render();

  window.viewStudent = (id) => {
    const s = DB.students.find(x=>x.id===id);
    const regHistory = DB.receipts.filter(r => r.studentId === id);
    const historyHTML = regHistory.length === 0
      ? `<div style="text-align:center;padding:20px;color:#94a3b8"><i class="fas fa-inbox" style="font-size:1.5rem;display:block;margin-bottom:6px"></i>Ch\u01b0a \u0111\u0103ng k\u00fd kh\u00f3a n\u00e0o</div>`
      : `<div class="table-wrap"><table>
          <thead><tr><th>M\u00e3 BL</th><th>L\u1edbp</th><th>Ng\u00e0y \u0111\u0103ng k\u00fd</th><th>H\u1ecdc ph\u00ed</th><th>M\u00e3 gi\u1ea3m</th><th>Tr\u1ea1ng th\u00e1i</th></tr></thead>
          <tbody>${regHistory.map(r=>{
            const cl = getClassById(r.classId);
            const now = new Date(); now.setHours(0,0,0,0);
            const end = cl?.endDate ? new Date(cl.endDate) : null;
            const start = cl?.startDate ? new Date(cl.startDate) : null;
            let status, badge;
            if (!end) { status='\u0110ang h\u1ecdc'; badge='badge-info'; }
            else if (end < now) { status='\u0110\u00e3 h\u1ecdc xong'; badge='badge-success'; }
            else if (start && start > now) { status='Ch\u01b0a b\u1eaft \u0111\u1ea7u'; badge='badge-warning'; }
            else { status='\u0110ang h\u1ecdc'; badge='badge-info'; }
            return `<tr>
              <td><b>${r.id}</b></td>
              <td>${cl?.name||r.classId}</td>
              <td>${formatDate(r.date)}</td>
              <td style="color:#10b981;font-weight:700">${formatCurrency(r.amount)}</td>
              <td>${r.discountCode?"<span class=\"badge badge-primary\">"+r.discountCode+"</span>":'—'}</td>
              <td><span class="badge ${badge}">${status}</span></td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>`;

    openModal('Chi ti\u1ebft h\u1ecdc vi\u00ean \u2013 ' + s.name, `
      <div class="form-grid" style="margin-bottom:20px">
        ${[['M\u00e3 h\u1ecdc vi\u00ean',s.id],['H\u1ecd v\u00e0 t\u00ean',s.name],['S\u0110T',s.phone||'—'],['Gmail',s.email||'—'],['L\u1edbp hi\u1ec7n t\u1ea1i',getClassById(s.centerClass)?.name||'—'],['Ng\u00e0y b\u1eaft \u0111\u1ea7u',formatDate(getClassById(s.centerClass)?.startDate)],['Ng\u00e0y k\u1ebft th\u00fac',formatDate(getClassById(s.centerClass)?.endDate)],['H\u1ecdc ph\u00ed',formatCurrency(getClassById(s.centerClass)?.fee||0)],['Ghi ch\u00fa',s.note||'—']].map(([l,v])=>`<div class="form-group"><label>${l}</label><input readonly value="${v}"/></div>`).join('')}
      </div>
      <div style="font-weight:700;color:var(--text);margin-bottom:10px;font-size:.95rem"><i class="fas fa-history" style="color:var(--primary)"></i> L\u1ecbch s\u1eed \u0111\u0103ng k\u00fd (${regHistory.length} kh\u00f3a)</div>
      ${historyHTML}`, () => true);
    document.getElementById('modalConfirm').style.display='none';
  };

  window.editStudent = (id) => {
    const s = DB.students.find(x=>x.id===id);
    openModal('Sửa thông tin học viên', studentForm(s), () => {
      const f = collectStudentForm();
      if (!f) return false;
      Object.assign(s, f);
      syncStudentToB(s);
      toast('Đã cập nhật học viên!');
      render(); return true;
    });
    document.getElementById('modalConfirm').textContent = 'Lưu';
    document.getElementById('modalConfirm').className = 'btn btn-primary';
  };

  window.deleteStudent = (id) => {
    confirmDelete('Bạn có chắc muốn xóa học viên này?', () => {
      const i = DB.students.findIndex(x=>x.id===id);
      DB.students.splice(i,1); toast('Đã xóa học viên!','warning'); render();
    });
  };

  function addStudentModal() {
    openModal('Thêm học viên mới', studentForm(), () => {
      const f = collectStudentForm();
      if (!f) return false;
      f.id = document.getElementById('f_id').value.trim() || genStudentId();
      f.createdAt = new Date().toISOString().split('T')[0];
      if (DB.students.find(x => x.id === f.id)) { toast('Mã HV đã tồn tại!', 'error'); return false; }
      DB.students.push(f);
      syncStudentToB(f);
      toast('Đã thêm học viên!'); render(); return true;
    });
    document.getElementById('modalConfirm').textContent = 'Thêm';
    document.getElementById('modalConfirm').className = 'btn btn-primary';
  }

  function studentForm(s={}) {
    return `<div class="form-grid">
      <div class="form-group"><label>Họ và tên *</label><input id="f_name" value="${s.name||''}"/></div>
      <div class="form-group"><label>Mã HV <span style="color:#94a3b8;font-weight:400">(để trống hệ thống tự tạo)</span></label><input id="f_id" value="${s.id||''}" placeholder="Tự động tạo nếu để trống"/></div>
      <div class="form-group"><label>Số điện thoại</label><input id="f_phone" value="${s.phone||''}"/></div>
      <div class="form-group"><label>Gmail</label><input type="email" id="f_email" value="${s.email||''}"/></div>
      <div class="form-group" style="grid-column:1/-1"><label>Ghi chú</label><textarea id="f_note">${s.note||''}</textarea></div>
    </div>`;
  }

  function collectStudentForm() {
    const name = document.getElementById('f_name').value.trim();
    if (!name) { toast('Vui lòng nhập họ tên!','error'); return null; }
    return {
      name,
      phone: document.getElementById('f_phone').value,
      email: document.getElementById('f_email').value,
      note: document.getElementById('f_note').value
    };
  }
}

// ===== PAGE: CLASSES =====
function classes() {
  const c = document.getElementById('mainContent');

  function render() {
    c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-chalkboard-teacher"></i> Danh Sách Lớp Học</div>
        <button class="btn btn-primary" id="btnAddClass"><i class="fas fa-plus"></i> Tạo lớp mới</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mã lớp</th><th>Tên lớp</th><th>Bắt đầu</th><th>Kết thúc</th><th>Học phí</th><th>Thao tác</th></tr></thead>
          <tbody>
          ${DB.classes.map(cl=>`<tr>
            <td><b>${cl.id}</b></td><td><a href="#" style="color:var(--primary);font-weight:700;text-decoration:none" onclick="viewClassStudents('${cl.id}')">${cl.name}</a></td>
            <td>${formatDate(cl.startDate)}</td><td>${formatDate(cl.endDate)}</td>
            <td style="color:#10b981;font-weight:700">${formatCurrency(cl.fee||0)}</td>
            <td><div class="action-btns">
              <button class="btn btn-info btn-sm" onclick="viewClassStudents('${cl.id}')"><i class="fas fa-users"></i></button>
              <button class="btn btn-warning btn-sm" onclick="editClass('${cl.id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteClass('${cl.id}')"><i class="fas fa-trash"></i></button>
            </div></td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    document.getElementById('btnAddClass').onclick = () => addClassModal();
  }
  render();

  window.viewClassStudents = (id) => {
    const cl = getClassById(id);
    const list = getStudentsByClass(id);
    openModal(`${cl.name} – ${list.length} h\u1ecdc vi\u00ean`, `
      <div style="margin-bottom:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">
        <span class="badge badge-primary"><i class="fas fa-users"></i> ${list.length} h\u1ecdc vi\u00ean</span>
        <span class="badge badge-info"><i class="fas fa-calendar"></i> ${formatDate(cl.startDate)} \u2192 ${formatDate(cl.endDate)}</span>
        <span class="badge badge-success"><i class="fas fa-coins"></i> ${formatCurrency(cl.fee||0)}</span>
        <button class="btn btn-warning btn-sm" onclick="transferStudentModal('${id}')"><i class="fas fa-exchange-alt"></i> Chuy\u1ec3n l\u1edbp</button>
      </div>
      ${list.length === 0
        ? `<div style="text-align:center;padding:32px;color:#94a3b8"><i class="fas fa-user-slash" style="font-size:2rem;margin-bottom:8px;display:block"></i>Ch\u01b0a c\u00f3 h\u1ecdc vi\u00ean n\u00e0o trong l\u1edbp n\u00e0y</div>`
        : `<div class="table-wrap"><table>
            <thead><tr><th>M\u00e3 HV</th><th>H\u1ecd t\u00ean</th><th>S\u0110T</th><th>Gmail</th></tr></thead>
            <tbody>${list.map(s=>`<tr>
              <td><b>${s.id}</b></td>
              <td>${s.name}</td>
              <td>${s.phone||'—'}</td>
              <td>${s.email||'—'}</td>
            </tr>`).join('')}</tbody>
          </table></div>`
      }`, () => true);
    document.getElementById('modalConfirm').style.display='none';
  };

  window.transferStudentModal = (fromClassId) => {
    const list = getStudentsByClass(fromClassId);
    openModal('Chuyển học viên sang lớp khác', `
      <div class="form-grid">
        <div class="form-group"><label>Chọn học viên</label><select id="t_student">${list.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>Chuyển sang lớp</label><select id="t_class">${DB.classes.filter(cl=>cl.id!==fromClassId).map(cl=>`<option value="${cl.id}">${cl.name}</option>`).join('')}</select></div>
      </div>`, () => {
      const sid = document.getElementById('t_student').value;
      const cid = document.getElementById('t_class').value;
      const s = DB.students.find(x=>x.id===sid);
      s.centerClass = cid;
      toast(`Đã chuyển ${s.name} sang ${getClassById(cid).name}`);
      render(); return true;
    });
  };

  window.editClass = (id) => {
    const cl = DB.classes.find(x=>x.id===id);
    openModal('Chỉnh sửa lớp học', classForm(cl), () => {
      const f = collectClassForm();
      if (!f) return false;
      Object.assign(cl, f);
      toast('Đã cập nhật lớp học!'); render(); return true;
    });
  };

  window.deleteClass = (id) => {
    confirmDelete('Bạn có chắc muốn xóa lớp học này?', () => {
      const i = DB.classes.findIndex(x=>x.id===id);
      DB.classes.splice(i,1); toast('Đã xóa lớp!','warning'); render();
    });
  };

  function addClassModal() {
    openModal('Tạo lớp học mới', classForm(), () => {
      const f = collectClassForm();
      if (!f) return false;
      f.id = genClassId(f.name);
      DB.classes.push(f);
      syncClassToB(f);
      toast('Đã tạo lớp mới!'); render(); return true;
    });
  }

  function classForm(cl={}) {
    return `<div class="form-grid">
      <div class="form-group"><label>Tên lớp *</label><input id="c_name" value="${cl.name||''}"/></div>
      <div class="form-group"><label>Ngày bắt đầu khóa</label><input type="date" id="c_startDate" value="${cl.startDate||''}"/></div>
      <div class="form-group"><label>Ngày kết thúc khóa</label><input type="date" id="c_endDate" value="${cl.endDate||''}"/></div>
      <div class="form-group"><label>Học phí (VNĐ)</label><input type="number" id="c_fee" value="${cl.fee||''}"/></div>
    </div>`;
  }

  function collectClassForm() {
    const name = document.getElementById('c_name').value.trim();
    if (!name) { toast('Vui lòng nhập tên lớp!','error'); return null; }
    return { name, startDate: document.getElementById('c_startDate').value, endDate: document.getElementById('c_endDate').value, fee: Number(document.getElementById('c_fee').value)||0 };
  }
}

// ===== PAGE: TUITION =====
function tuition() {
  const c = document.getElementById('mainContent');

  function render() {
    const total = DB.students.reduce((a,s) => a + (getClassById(s.centerClass)?.fee||0), 0);

    c.innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(2,1fr)">
      <div class="stat-card blue"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-value">${DB.students.length}</div><div class="stat-label">Tổng học viên</div></div></div>
      <div class="stat-card green"><div class="stat-icon"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-value">${formatCurrency(total)}</div><div class="stat-label">Tổng học phí thu được</div></div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-money-bill-wave"></i> Danh Sách Học Phí</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mã HV</th><th>Họ tên</th><th>Lớp</th><th>Thời hạn khóa học</th><th>Học phí</th></tr></thead>
          <tbody>
          ${DB.students.map(s=>{const cl=getClassById(s.centerClass); return `<tr>
            <td><b>${s.id}</b></td><td>${s.name}</td>
            <td>${cl?.name||s.centerClass}</td>
            <td style="font-size:.82rem">${cl?.startDate?formatDate(cl.startDate)+' \u2192 '+formatDate(cl.endDate):'—'}</td>
            <td style="color:#10b981;font-weight:700">${formatCurrency(cl?.fee||0)}</td>
          </tr>`}).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }
  render();
}

// ===== PAGE: RECEIPTS =====
function receipts() {
  const c = document.getElementById('mainContent');

  function render() {
    c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-receipt"></i> Bi\u00ean Lai \u0110\u0103ng K\u00fd</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" id="btnAddReceipt"><i class="fas fa-plus"></i> T\u1ea1o bi\u00ean lai</button>
          <button class="btn btn-success" id="btnBulkReceipt"><i class="fas fa-layer-group"></i> T\u1ea1o h\u00e0ng lo\u1ea1t</button>
          <button class="btn btn-danger" id="btnClearReceipts"><i class="fas fa-trash-alt"></i> X\u00f3a t\u1ea5t c\u1ea3</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>M\u00e3 BL</th><th>Ng\u00e0y t\u1ea1o</th><th>H\u1ecdc vi\u00ean</th><th>M\u00e3 HV</th><th>L\u1edbp \u0111\u0103ng k\u00fd</th><th>M\u00e3 gi\u1ea3m</th><th>H\u1ecdc ph\u00ed</th><th>Ghi ch\u00fa</th><th>Thao t\u00e1c</th></tr></thead>
          <tbody>
          ${DB.receipts.map(r=>`<tr>
            <td><b>${r.id}</b></td>
            <td>${formatDate(r.date)}</td>
            <td>${r.studentName}</td>
            <td>${r.studentId}</td>
            <td>${getClassById(r.classId)?.name||r.classId}</td>
            <td>${r.discountCode?"<span class=\"badge badge-primary\">"+r.discountCode+"</span>":'—'}</td>
            <td style="color:#10b981;font-weight:700">${formatCurrency(r.amount)}</td>
            <td>${r.note||'—'}</td>
            <td><div class="action-btns">
              <button class="btn btn-info btn-sm" onclick="previewReceipt('${r.id}')"><i class="fas fa-eye"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteReceipt('${r.id}')"><i class="fas fa-trash"></i></button>
            </div></td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    document.getElementById('btnAddReceipt').onclick = () => addReceiptModal();
    document.getElementById('btnBulkReceipt').onclick = () => bulkReceiptModal();
    document.getElementById('btnClearReceipts').onclick = () => {
      confirmDelete('X\u00f3a to\u00e0n b\u1ed9 bi\u00ean lai? H\u00e0nh \u0111\u1ed9ng n\u00e0y kh\u00f4ng th\u1ec3 ho\u00e0n t\u00e1c!', () => {
        DB.receipts = []; saveDB(); toast('X\u00f3a to\u00e0n b\u1ed9 bi\u00ean lai th\u00e0nh c\u00f4ng!', 'warning'); render();
      });
    };
  }
  render();

  window.previewReceipt = (id) => {
    const r = DB.receipts.find(x=>x.id===id);
    const cl = getClassById(r.classId);
    const s = DB.students.find(x=>x.id===r.studentId);
    // Tính đợt đăng ký: đếm số biên lai cùng học viên + lớp, sắp xếp theo ngày
    const sameClassReceipts = DB.receipts
      .filter(x => x.studentId===r.studentId && x.classId===r.classId)
      .sort((a,b) => a.date.localeCompare(b.date));
    const dotDangKy = sameClassReceipts.findIndex(x=>x.id===r.id) + 1;
    openModal('Bi\u00ean Lai \u0110\u0103ng K\u00fd', `
      <div class="receipt-preview">
        <div class="receipt-title">DUY HO\u00c0NG D\u1ea0Y TO\u00c1N</div>
        <div class="receipt-sub">Qu\u1ea3n l\u00fd d\u1ec5 d\u00e0ng \u2013 V\u1eadn h\u00e0nh chuy\u00ean nghi\u1ec7p</div>
        ${[
          ['M\u00e3 bi\u00ean lai', r.id],
          ['\u0110\u0103ng k\u00fd', `\u0110\u1ee3t ${dotDangKy} \u2013 ${cl?.name||r.classId}`],
          ['Ng\u00e0y t\u1ea1o', formatDate(r.date)],
          ['T\u00ean h\u1ecdc vi\u00ean', r.studentName],
          ['Mã học viên', `${r.studentId} <span style="color:#10b981;font-size:.8rem">(mật khẩu đăng nhập)</span>`],
          ['Gmail', `${s?.email||'—'} <span style="color:#10b981;font-size:.8rem">(tên đăng nhập)</span>`],
          ['L\u1edbp \u0111\u0103ng k\u00fd', cl?.name||r.classId],
          ['Th\u1eddi h\u1ea1n', cl?.startDate ? formatDate(cl.startDate)+' \u2192 '+formatDate(cl.endDate) : '—'],
          ['M\u00e3 gi\u1ea3m gi\u00e1', r.discountCode||'—'],
          ['Ghi ch\u00fa', r.note||'—']
        ].map(([l,v])=>`<div class="receipt-row"><span>${l}:</span><b>${v}</b></div>`).join('')}
        <div class="receipt-total">Học phí: ${formatCurrency(r.amount)}</div>
        <div style="margin-top:20px;text-align:right">
          <div style="font-size:.82rem;color:#64748b;margin-bottom:4px">Xác nhận người tạo biên lai</div>
          <img src="signature.png" style="height:110px;mix-blend-mode:multiply;opacity:1;filter:contrast(2) brightness(0.6)"/>
          <div style="font-weight:700;color:#1e293b;margin-top:4px">Trợ Lý Tr.Cường</div>
        </div>
      </div>`, () => { window.print(); return true; });
    document.getElementById('modalConfirm').innerHTML = '<i class="fas fa-print"></i> In bi\u00ean lai';
  };

  window.deleteReceipt = (id) => {
    confirmDelete('Xóa biên lai này?', () => {
      DB.receipts.splice(DB.receipts.findIndex(x=>x.id===id), 1);
      toast('Đã xóa biên lai!', 'warning'); render();
    });
  };

  function bulkReceiptModal() {
    if (!DB.classes.length) { toast('Ch\u01b0a c\u00f3 l\u1edbp n\u00e0o!', 'error'); return; }
    openModal('T\u1ea1o bi\u00ean lai h\u00e0ng lo\u1ea1t', `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group"><label>Ch\u1ecdn l\u1edbp *</label>
          <select id="bulk_class" onchange="updateBulkPreview()" style="border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:.9rem;width:100%;outline:none">
            ${DB.classes.map(cl=>`<option value="${cl.id}" data-fee="${cl.fee||0}">${cl.name} (${getStudentsByClass(cl.id).length} h\u1ecdc vi\u00ean)</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Ng\u00e0y t\u1ea1o</label>
          <input type="date" id="bulk_date" value="${new Date().toISOString().split('T')[0]}" style="border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:.9rem;width:100%;outline:none"/>
        </div>
        <div class="form-group"><label>M\u00e3 gi\u1ea3m gi\u00e1 (t\u00f9y ch\u1ecdn)</label>
          <input id="bulk_discount" placeholder="Nh\u1eadp m\u00e3..." oninput="updateBulkPreview()" style="text-transform:uppercase;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:.9rem;width:100%;outline:none"/>
        </div>
        <div id="bulk_preview" style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:14px 16px;font-size:.9rem"></div>
      </div>`, () => {
      const cid = document.getElementById('bulk_class').value;
      const date = document.getElementById('bulk_date').value;
      const dcode = document.getElementById('bulk_discount').value.trim().toUpperCase();
      const cl = getClassById(cid);
      const students = getStudentsByClass(cid);
      if (!students.length) { toast('L\u1edbp n\u00e0y ch\u01b0a c\u00f3 h\u1ecdc vi\u00ean!', 'error'); return false; }
      let fee = cl?.fee || 0;
      if (dcode) {
        const disc = DB.discounts.find(x=>x.code===dcode && x.active);
        if (disc) {
          fee = disc.type==='percent' ? Math.round(fee*(1-disc.value/100)) : Math.max(0, fee-disc.value);
          disc.usedCount = (disc.usedCount||0) + students.length;
          if (disc.maxUse>0 && disc.usedCount>=disc.maxUse) disc.active=false;
        }
      }
      students.forEach(s => {
        s.centerClass = cid;
        DB.receipts.push({ id: genId('BL',DB.receipts), date, studentName: s.name, studentId: s.id, classId: cid, amount: fee, discountCode: dcode||null, note: '' });
        syncReceiptToB(s.id, cid);
      });
      toast('T\u1ea1o ' + students.length + ' bi\u00ean lai th\u00e0nh c\u00f4ng!');
      render(); return true;
    });
    setTimeout(() => updateBulkPreview(), 50);
  }

  window.updateBulkPreview = () => {
    const sel = document.getElementById('bulk_class');
    if (!sel) return;
    const cid = sel.value;
    const cl = getClassById(cid);
    const students = getStudentsByClass(cid);
    const dcode = (document.getElementById('bulk_discount')?.value||'').trim().toUpperCase();
    let fee = cl?.fee || 0;
    let discInfo = '';
    if (dcode) {
      const disc = DB.discounts.find(x=>x.code===dcode && x.active);
      if (disc) {
        const before = fee;
        fee = disc.type==='percent' ? Math.round(fee*(1-disc.value/100)) : Math.max(0, fee-disc.value);
        discInfo = ' <span style="color:#10b981">(-'+formatCurrency(before-fee)+')</span>';
      } else if (dcode) {
        discInfo = ' <span style="color:#ef4444">M\u00e3 kh\u00f4ng h\u1ee3p l\u1ec7</span>';
      }
    }
    const preview = document.getElementById('bulk_preview');
    if (preview) preview.innerHTML = `
      <div style="font-weight:700;color:#166534;margin-bottom:8px"><i class="fas fa-info-circle"></i> X\u00e1c nh\u1eadn t\u1ea1o h\u00e0ng lo\u1ea1t</div>
      <div style="display:flex;flex-direction:column;gap:6px;color:#15803d">
        <div>L\u1edbp: <b>${cl?.name||cid}</b></div>
        <div>S\u1ed1 h\u1ecdc vi\u00ean: <b>${students.length}</b></div>
        <div>H\u1ecdc ph\u00ed m\u1ed7i bi\u00ean lai: <b>${formatCurrency(fee)}</b>${discInfo}</div>
        <div>T\u1ed5ng thu: <b>${formatCurrency(fee*students.length)}</b></div>
      </div>`;
  };

  function addReceiptModal() {
    const firstFee = DB.classes[0]?.fee || 0;
    openModal('T\u1ea1o bi\u00ean lai \u0111\u0103ng k\u00fd', `
      <div style="display:flex;flex-direction:column;gap:16px">

        <div style="background:linear-gradient(135deg,rgba(79,70,229,.06),rgba(124,58,237,.06));border-radius:12px;padding:16px 18px;border:1px solid rgba(79,70,229,.12)">
          <div style="font-size:.8rem;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px"><i class="fas fa-user-graduate"></i> H\u1ecdc vi\u00ean</div>
          <input id="r_student_search" placeholder="\ud83d\udd0d T\u00ecm theo t\u00ean, m\u00e3, s\u0111t..." oninput="filterReceiptStudents()"
            style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:.9rem;outline:none;margin-bottom:8px;transition:.2s"
            onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
          <select id="r_student" onchange="checkStudentHistory();autoSelectClass()" size="4"
            style="width:100%;border-radius:8px;border:1.5px solid var(--border);padding:4px;font-size:.9rem;outline:none">
            ${DB.students.map(s=>`<option value="${s.id}">${s.name} \u2013 ${s.phone||s.id}</option>`).join('')}
          </select>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label>L\u1edbp \u0111\u0103ng k\u00fd *</label>
            <select id="r_class" onchange="updateReceiptFee();checkStudentHistory()"
              style="border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:.9rem;width:100%;outline:none">
              ${DB.classes.map(cl=>`<option value="${cl.id}" data-fee="${cl.fee||0}">${cl.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Ng\u00e0y t\u1ea1o</label>
            <input type="date" id="r_date" value="${new Date().toISOString().split('T')[0]}"
              style="border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:.9rem;width:100%;outline:none"/>
          </div>
        </div>

        <div id="r_history_warn" style="display:none;background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:10px 14px;font-size:.85rem;color:#854d0e">
          <i class="fas fa-exclamation-triangle"></i> <span id="r_history_text"></span>
        </div>

        <div style="background:#f8fafc;border-radius:12px;padding:16px 18px;border:1px solid var(--border)">
          <div style="font-size:.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px"><i class="fas fa-coins"></i> H\u1ecdc ph\u00ed</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label>H\u1ecdc ph\u00ed g\u1ed1c</label>
              <input type="number" id="r_fee_original" value="${firstFee}" readonly
                style="background:#fff;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:.9rem;width:100%;color:#64748b"/>
            </div>
            <div class="form-group"><label>M\u00e3 gi\u1ea3m gi\u00e1</label>
              <input id="r_discount_code" placeholder="Nh\u1eadp m\u00e3..." oninput="updateReceiptFee()"
                style="text-transform:uppercase;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:.9rem;width:100%;outline:none;transition:.2s"
                onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
            </div>
          </div>
          <div style="margin-top:10px;background:linear-gradient(135deg,rgba(16,185,129,.08),rgba(16,185,129,.04));border:1.5px solid rgba(16,185,129,.2);border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600;color:var(--text-muted)">T\u1ed5ng h\u1ecdc ph\u00ed</span>
            <span id="r_amount_display" style="font-size:1.2rem;font-weight:800;color:#10b981">${Number(firstFee).toLocaleString('vi-VN')} VN\u0110</span>
            <input type="number" id="r_amount" value="${firstFee}" readonly style="display:none"/>
          </div>
        </div>

        <div class="form-group"><label>Ghi ch\u00fa</label>
          <input id="r_note" placeholder="Ghi ch\u00fa th\u00eam n\u1ebfu c\u00f3..."
            style="border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:.9rem;width:100%;outline:none;transition:.2s"
            onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
        </div>
      </div>`, () => {
      const sid = document.getElementById('r_student').value;
      const cid = document.getElementById('r_class').value;
      const amt = Number(document.getElementById('r_amount').value)||0;
      const dcode = document.getElementById('r_discount_code').value.trim().toUpperCase();
      if (!sid) { toast('Ch\u1ecdn h\u1ecdc vi\u00ean!','error'); return false; }
      // Đánh dấu mã đã dùng
      if (dcode) {
        const disc = DB.discounts.find(x=>x.code===dcode && x.active);
        if (disc) { disc.usedCount = (disc.usedCount||0)+1; if (disc.maxUse>0 && disc.usedCount>=disc.maxUse) disc.active=false; }
      }
      const s = DB.students.find(x=>x.id===sid);
      s.centerClass = cid;
      DB.receipts.push({ id: genId('BL',DB.receipts), date: document.getElementById('r_date').value, studentName: s.name, studentId: sid, classId: cid, amount: amt, discountCode: dcode||null, note: document.getElementById('r_note').value });
      syncReceiptToB(sid, cid);
      toast('T\u1ea1o bi\u00ean lai th\u00e0nh c\u00f4ng!'); render(); return true;
    });
    setTimeout(() => autoSelectClass(), 50);
  }

  window.filterReceiptStudents = () => {
    const q = document.getElementById('r_student_search').value.toLowerCase();
    const sel = document.getElementById('r_student');
    sel.innerHTML = DB.students
      .filter(s => !q || s.name.toLowerCase().includes(q) || (s.phone||'').includes(q) || s.id.toLowerCase().includes(q))
      .map(s=>`<option value="${s.id}">${s.name} – ${s.phone||s.id}</option>`).join('');
    if (sel.options.length) { sel.selectedIndex = 0; autoSelectClass(); }
  };

  window.autoSelectClass = () => {
    const sid = document.getElementById('r_student')?.value;
    const s = DB.students.find(x=>x.id===sid);
    if (!s || !s.centerClass) return;
    const sel = document.getElementById('r_class');
    if (!sel) return;
    sel.value = s.centerClass;
    updateReceiptFee();
    checkStudentHistory();
  };

  window.checkStudentHistory = () => {
    const sid = document.getElementById('r_student')?.value;
    const cid = document.getElementById('r_class')?.value;
    const warn = document.getElementById('r_history_warn');
    const text = document.getElementById('r_history_text');
    if (!sid || !cid || !warn) return;
    const oldReceipt = DB.receipts.find(r => r.studentId===sid && r.classId===cid);
    const s = DB.students.find(x=>x.id===sid);
    const cl = getClassById(cid);
    if (oldReceipt) {
      text.textContent = `${s?.name} \u0111\u00e3 c\u00f3 bi\u00ean lai \u0111\u0103ng k\u00fd l\u1edbp "${cl?.name}" ng\u00e0y ${formatDate(oldReceipt.date)}. B\u1ea1n v\u1eabn c\u00f3 th\u1ec3 ti\u1ebfp t\u1ee5c t\u1ea1o m\u1edbi.`;
      warn.style.display = 'block';
    } else {
      warn.style.display = 'none';
    }
  };

  window.updateReceiptFee = () => {
    const sel = document.getElementById('r_class');
    const fee = Number(sel.options[sel.selectedIndex]?.dataset.fee||0);
    document.getElementById('r_fee_original').value = fee;
    const code = (document.getElementById('r_discount_code')?.value||'').trim().toUpperCase();
    const disc = DB.discounts.find(x=>x.code===code && x.active);
    let final = fee;
    if (disc) { final = disc.type==='percent' ? Math.round(fee*(1-disc.value/100)) : Math.max(0, fee-disc.value); }
    document.getElementById('r_amount').value = final;
    const disp = document.getElementById('r_amount_display');
    if (disp) disp.textContent = Number(final).toLocaleString('vi-VN') + ' VN\u0110';
  };
}

// ===== PAGE: DISCOUNTS =====
function discounts() {
  const c = document.getElementById('mainContent');

  function render() {
    c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-tags" style="color:var(--primary)"></i> Qu\u1ea3n L\u00fd M\u00e3 Gi\u1ea3m Gi\u00e1</div>
        <button class="btn btn-primary" id="btnAddDiscount"><i class="fas fa-plus"></i> T\u1ea1o m\u00e3 m\u1edbi</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>M\u00e3</th><th>Lo\u1ea1i gi\u1ea3m</th><th>Gi\u00e1 tr\u1ecb</th><th>S\u1ed1 l\u1ea7n d\u00f9ng</th><th>\u0110\u00e3 d\u00f9ng</th><th>Tr\u1ea1ng th\u00e1i</th><th>Thao t\u00e1c</th></tr></thead>
          <tbody>
          ${DB.discounts.map(d=>`<tr>
            <td><b style="color:var(--primary);font-size:1rem;letter-spacing:1px">${d.code}</b></td>
            <td>${d.type==='percent'?'Ph\u1ea7n tr\u0103m':'S\u1ed1 ti\u1ec1n c\u1ed1 \u0111\u1ecbnh'}</td>
            <td style="color:#10b981;font-weight:700">${d.type==='percent'?d.value+'%':formatCurrency(d.value)}</td>
            <td>${d.maxUse===0?'Kh\u00f4ng gi\u1edbi h\u1ea1n':d.maxUse}</td>
            <td>${d.usedCount||0}</td>
            <td><span class="badge ${d.active?'badge-success':'badge-danger'}">${d.active?'\u0110ang ho\u1ea1t \u0111\u1ed9ng':'V\u00f4 hi\u1ec7u'}</span></td>
            <td><div class="action-btns">
              <button class="btn btn-info btn-sm" onclick="editDiscount('${d.code}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-warning btn-sm" onclick="toggleDiscount('${d.code}')"><i class="fas fa-power-off"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteDiscount('${d.code}')"><i class="fas fa-trash"></i></button>
            </div></td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    document.getElementById('btnAddDiscount').onclick = () => addDiscountModal();
  }
  render();

  window.editDiscount = (code) => {
    const d = DB.discounts.find(x=>x.code===code);
    openModal('Ch\u1ec9nh s\u1eeda m\u00e3 gi\u1ea3m gi\u00e1', `
      <div class="form-grid">
        <div class="form-group"><label>M\u00e3 gi\u1ea3m gi\u00e1</label><input id="d_code" value="${d.code}" style="text-transform:uppercase"/></div>
        <div class="form-group"><label>Lo\u1ea1i gi\u1ea3m</label>
          <select id="d_type">
            <option value="percent" ${d.type==='percent'?'selected':''}>Ph\u1ea7n tr\u0103m (%)</option>
            <option value="fixed" ${d.type==='fixed'?'selected':''}>S\u1ed1 ti\u1ec1n c\u1ed1 \u0111\u1ecbnh (VN\u0110)</option>
          </select>
        </div>
        <div class="form-group"><label>Gi\u00e1 tr\u1ecb</label><input type="number" id="d_value" value="${d.value}"/></div>
        <div class="form-group"><label>S\u1ed1 l\u1ea7n d\u00f9ng (0 = kh\u00f4ng gi\u1edbi h\u1ea1n)</label><input type="number" id="d_maxUse" value="${d.maxUse}"/></div>
      </div>`, () => {
      const newCode = document.getElementById('d_code').value.trim().toUpperCase();
      const value = Number(document.getElementById('d_value').value);
      if (!newCode) { toast('Nh\u1eadp m\u00e3!','error'); return false; }
      if (!value || value <= 0) { toast('Nh\u1eadp gi\u00e1 tr\u1ecb h\u1ee3p l\u1ec7!','error'); return false; }
      d.code = newCode;
      d.type = document.getElementById('d_type').value;
      d.value = value;
      d.maxUse = Number(document.getElementById('d_maxUse').value)||0;
      toast('C\u1eadp nh\u1eadt th\u00e0nh c\u00f4ng!'); render(); return true;
    });
    document.getElementById('modalConfirm').textContent = 'L\u01b0u';
  };

  window.toggleDiscount = (code) => {
    const d = DB.discounts.find(x=>x.code===code);
    d.active = !d.active;
    toast(d.active ? 'M\u00e3 \u0111\u00e3 k\u00edch ho\u1ea1t!' : 'M\u00e3 \u0111\u00e3 v\u00f4 hi\u1ec7u h\u00f3a!', 'warning');
    render();
  };

  window.deleteDiscount = (code) => {
    confirmDelete('X\u00f3a m\u00e3 gi\u1ea3m gi\u00e1 n\u00e0y?', () => {
      DB.discounts.splice(DB.discounts.findIndex(x=>x.code===code), 1);
      toast('X\u00f3a th\u00e0nh c\u00f4ng!', 'warning'); render();
    });
  };

  function addDiscountModal() {
    openModal('T\u1ea1o m\u00e3 gi\u1ea3m gi\u00e1', `
      <div class="form-grid">
        <div class="form-group"><label>M\u00e3 gi\u1ea3m gi\u00e1 *</label><input id="d_code" placeholder="VD: GIAM50, KHAI_GIANG..." style="text-transform:uppercase"/></div>
        <div class="form-group"><label>Lo\u1ea1i gi\u1ea3m</label>
          <select id="d_type">
            <option value="percent">Ph\u1ea7n tr\u0103m (%)</option>
            <option value="fixed">S\u1ed1 ti\u1ec1n c\u1ed1 \u0111\u1ecbnh (VN\u0110)</option>
          </select>
        </div>
        <div class="form-group"><label>Gi\u00e1 tr\u1ecb *</label><input type="number" id="d_value" placeholder="VD: 10 ho\u1eb7c 100000"/></div>
        <div class="form-group"><label>S\u1ed1 l\u1ea7n d\u00f9ng (0 = kh\u00f4ng gi\u1edbi h\u1ea1n)</label><input type="number" id="d_maxUse" value="0"/></div>
      </div>`, () => {
      const code = document.getElementById('d_code').value.trim().toUpperCase();
      const value = Number(document.getElementById('d_value').value);
      if (!code) { toast('Nh\u1eadp m\u00e3!', 'error'); return false; }
      if (!value || value <= 0) { toast('Nh\u1eadp gi\u00e1 tr\u1ecb h\u1ee3p l\u1ec7!', 'error'); return false; }
      if (DB.discounts.find(x=>x.code===code)) { toast('M\u00e3 \u0111\u00e3 t\u1ed3n t\u1ea1i!', 'error'); return false; }
      DB.discounts.push({ code, type: document.getElementById('d_type').value, value, maxUse: Number(document.getElementById('d_maxUse').value)||0, usedCount: 0, active: true });
      toast('T\u1ea1o m\u00e3 th\u00e0nh c\u00f4ng!'); render(); return true;
    });
  }
}

// ===== EXPORT EXCEL =====
function downloadTemplate() {
  const csv = '\uFEFFH\u1ecd v\u00e0 T\u00ean,S\u1ed1 \u0110i\u1ec7n Tho\u1ea1i,Gmail,L\u1edbp,Ghi Ch\u00fa\nNguy\u1ec5n V\u0103n A,0901234567,example@gmail.com,T\u00ean l\u1edbp \u0111\u00fang trong h\u1ec7 th\u1ed1ng,\nTr\u1ea7n Th\u1ecb B,0912345678,example2@gmail.com,T\u00ean l\u1edbp \u0111\u00fang trong h\u1ec7 th\u1ed1ng,Ghi ch\u00fa n\u1ebfu c\u00f3';  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'MauNhapHocVien.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('T\u1ea3i file m\u1eabu th\u00e0nh c\u00f4ng!');
}

function exportStudentsExcel() {
  if (!DB.students.length) { toast('Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u \u0111\u1ec3 xu\u1ea5t!', 'warning'); return; }
  if (typeof XLSX === 'undefined') { toast('Th\u01b0 vi\u1ec7n xu\u1ea5t file ch\u01b0a s\u1eb5n s\u00e0ng, th\u1eed l\u1ea1i!', 'error'); return; }
  const rows = DB.students.map(s => ({
    'M\u00e3 H\u1ecdc Vi\u00ean': s.id,
    'H\u1ecd v\u00e0 T\u00ean': s.name,
    'S\u1ed1 \u0110i\u1ec7n Tho\u1ea1i': s.phone || '',
    'Gmail': s.email || '',
    'L\u1edbp': getClassById(s.centerClass)?.name || s.centerClass || '',
    'Ghi Ch\u00fa': s.note || ''
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh s\u00e1ch h\u1ecdc vi\u00ean');
  ws['!cols'] = [20,30,18,30,20,30].map(w=>({wch:w}));
  XLSX.writeFile(wb, 'DanhSachHocVien.xlsx');
  toast('Xu\u1ea5t Excel th\u00e0nh c\u00f4ng!');
}

function importStudentsExcel(e) {
  const file = e.target.files[0];
  if (!file) return;
  const isCsv = file.name.endsWith('.csv');
  if (!isCsv && typeof XLSX === 'undefined') { toast('Th\u01b0 vi\u1ec7n ch\u01b0a s\u1eb5n s\u00e0ng, h\u00e3y d\u00f9ng file CSV!', 'error'); e.target.value=''; return; }
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      let rows = [];
      if (isCsv) {
        const lines = ev.target.result.replace(/^\uFEFF/,'').split('\n').filter(l=>l.trim());
        const headers = lines[0].split(',').map(h=>h.trim());
        rows = lines.slice(1).map(line => {
          const vals = line.split(',');
          const obj = {};
          headers.forEach((h,i) => obj[h] = (vals[i]||'').trim());
          return obj;
        });
      } else {
        const wb = XLSX.read(ev.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws);
      }
      let added = 0, skipped = 0;
      rows.forEach(r => {
        const name = r['H\u1ecd v\u00e0 T\u00ean'] || r['Ho va Ten'] || r['name'] || '';
        if (!name) { skipped++; return; }
        const phone = String(r['S\u1ed1 \u0110i\u1ec7n Tho\u1ea1i'] || r['SDT'] || r['phone'] || '');
        const email = r['Gmail'] || r['email'] || '';
        const note  = r['Ghi Ch\u00fa'] || r['note'] || '';
        const className = r['L\u1edbp'] || r['Lop'] || r['class'] || '';
        const cl = DB.classes.find(c => c.name === className);
        const centerClass = cl ? cl.id : (DB.classes[0]?.id || '');
        const id = genStudentId();
        DB.students.push({ id, name, phone, email, centerClass, note });
        added++;
      });
      saveDB();
      toast(`Nh\u1eadp th\u00e0nh c\u00f4ng ${added} h\u1ecdc vi\u00ean${skipped?' (b\u1ecf qua '+skipped+' d\u00f2ng l\u1ed7i)':''}!`);
      navigate('students');
    } catch(err) { toast('File kh\u00f4ng h\u1ee3p l\u1ec7!', 'error'); }
    e.target.value = '';
  };
  isCsv ? reader.readAsText(file, 'UTF-8') : reader.readAsBinaryString(file);
}

// ===== INIT =====
async function initApp() {
  const c = document.getElementById('mainContent');
  if (c) {
    c.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:80vh;font-size:1.2rem;color:#64748b"><i class="fas fa-spinner fa-spin" style="margin-right:10px"></i> Đang đồng bộ dữ liệu...</div>';
  }
  await loadDB();
  navigate('dashboard');
}

initApp();
