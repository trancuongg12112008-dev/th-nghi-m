// ===== DATABASE ADMIN (sync_data) =====
const SUPABASE_URL = 'https://xxodvdfwyojhezijljgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XjUmK_8J9ri0g2c72eVW5A_TixYReU-';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== DATABASE HỌC VIÊN (web học riêng) =====
const DB_B_URL = 'https://gojpmogjretoxplydjvg.supabase.co';
const DB_B_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvanBtb2dqcmV0b3hwbHlkanZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0Nzg4ODEsImV4cCI6MjA5MzA1NDg4MX0.iLCNd2VRMiZoFp6_KclZlFsOenUNoM041tl1fobHKDA';
const dbB = supabase.createClient(DB_B_URL, DB_B_KEY);

// ===== LOAD / SAVE ADMIN DB =====
async function loadDB() {
  try {
    const { data, error } = await supabaseClient.from('sync_data').select('db_json').eq('id', 1).single();
    if (error) {
      console.error('Load DB error:', error);
      alert('Không thể tải dữ liệu từ đám mây. Hãy chắc chắn bạn đã tạo bảng SQL!');
      return;
    }
    if (data && data.db_json) {
      DB.students  = data.db_json.students  || [];
      DB.classes   = data.db_json.classes   || [];
      DB.receipts  = data.db_json.receipts  || [];
      DB.discounts = data.db_json.discounts || [];
    }
  } catch(e) { console.error('Load DB Exception:', e); }
}

async function saveDB() {
  try {
    const { error } = await supabaseClient.from('sync_data').update({ db_json: DB }).eq('id', 1);
    if (error) console.error('Save DB error:', error);
  } catch(e) { console.error('Save DB Exception:', e); }
}

// ===== ĐỒNG BỘ HỌC VIÊN → WEB HỌC =====
async function syncStudentToB(s) {
  try {
    const cl = getClassById(s.centerClass);
    const payload = {
      student_code: s.id,
      full_name:    s.name,
      phone:        s.phone || null,
      username:     s.email || s.id,
      password:     s.id,
      class_name:   cl?.name || null,
      active:       true,
      notes:        s.note || null,
      created_at:   s.createdAt || new Date().toISOString()
    };
    // Upsert theo username
    const { error } = await dbB.from('students').upsert(payload, { onConflict: 'username' });
    if (error) console.error('Sync student error:', error);
  } catch(e) { console.error('Sync student exception:', e); }
}

// ===== ĐỒNG BỘ LỚP → WEB HỌC =====
async function syncClassToB(cl) {
  try {
    const payload = {
      name:       cl.name,
      start_date: cl.startDate || null,
      end_date:   cl.endDate   || null
    };
    const { error } = await dbB.from('classes').upsert(payload, { onConflict: 'name' });
    if (error) console.error('Sync class error:', error);
  } catch(e) { console.error('Sync class exception:', e); }
}

// ===== CẬP NHẬT LỚP HỌC VIÊN KHI TẠO BIÊN LAI =====
async function syncReceiptToB(studentId, classId) {
  try {
    const s  = DB.students.find(x => x.id === studentId);
    const cl = getClassById(classId);
    if (!s || !cl) return;
    const { error } = await dbB.from('students')
      .update({ class_name: cl.name })
      .eq('username', s.email || s.id);
    if (error) console.error('Sync receipt error:', error);
  } catch(e) { console.error('Sync receipt exception:', e); }
}

const DB = {
  students: [],
  classes:  [],
  receipts: [],
  discounts: []
};

// ===== HELPERS =====
function getClassById(id) { return DB.classes.find(c => c.id === id); }
function getStudentsByClass(classId) { return DB.students.filter(s => s.centerClass === classId); }
function formatCurrency(n) { return Number(n).toLocaleString('vi-VN') + ' VNĐ'; }
function formatDate(d) { if (!d) return ''; const p = d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }

function genStudentId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const used = new Set(DB.students.map(s => s.id));
  let id;
  do {
    id = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (used.has(id));
  return id;
}

function genClassId(name) {
  const noAccent = name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').replace(/\s+/g,'').toUpperCase();
  const existing = new Set(DB.classes.map(c => c.id));
  let num;
  do { num = Math.floor(Math.random() * 900) + 100; } while (existing.has(`${noAccent}-${num}`));
  return `${noAccent}-${num}`;
}

function genId(prefix, arr) {
  const nums = arr.map(x => parseInt(x.id.replace(prefix,''))).filter(n=>!isNaN(n));
  const next = nums.length ? Math.max(...nums)+1 : 1;
  return prefix + String(next).padStart(3,'0');
}
