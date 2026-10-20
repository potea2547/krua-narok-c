/* =============================================================
   ครัวนรก ร้อยม.1 — app.js
   ============================================================= */

// ─── CHEF PIN MAP (แก้ได้) ────────────────────────────────────
const CHEF_PINS = {
  chef1: '1111',   // อ็อฟ  (หัวหน้าเชฟ)
  chef2: '2222',   // ทัพไทย
  chef3: '3333'    // ไอซ์
};
const ADMIN_PIN = '9999'; // PIN สำหรับ admin

// ─── STATE ───────────────────────────────────────────────────
let currentUser      = '';
let currentPage      = 'dashboard';
let currentMeal      = 'ทั้งหมด';
let currentKFilter   = 'all';
let loggedChefId     = null;   // เชฟที่ login อยู่
let selectedChefLogin = 'chef1';
let pendingRating    = 0;
let ratingChefId     = null;

// ─── STORAGE ─────────────────────────────────────────────────
function load(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; }
  catch { return def; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

let chefs       = load('chefs', null);
let menus       = load('menus', []);
let kitchenLogs = load('kitchenLogs', []);
let ownerMsgs   = load('ownerMsgs', []);
let chatHistory = load('chatHistory', []);

/* =============================================================
   setupDemoData()
   ============================================================= */
function setupDemoData() {
  const demoChefs = [
    {
      id: 'chef1', name: 'เชฟอ็อฟ', role: 'หัวหน้าเชฟ', isHead: true,
      bio: 'หัวหน้าครัวนรก ประสบการณ์สูง รสมือจัดจ้าน คุมทีมมาหลายปี',
      photo: null,
      ratings: [{ user: 'ลูกค้า A', score: 5 }, { user: 'ลูกค้า B', score: 4 }],
      comments: [{ user: 'ลูกค้า A', text: 'กะเพราเชฟอ็อฟสุดยอด! 🔥', time: '20/10/2569 10:00' }]
    },
    {
      id: 'chef2', name: 'เชฟทัพไทย', role: 'เชฟครัวร้อน', isHead: false,
      bio: 'เชี่ยวชาญครัวร้อน ทอด ผัด ย่าง ฝีมือดีไม่แพ้ใคร',
      photo: null,
      ratings: [{ user: 'ลูกค้า C', score: 4 }],
      comments: [{ user: 'ลูกค้า C', text: 'หมูทอดกรอบมากเลย', time: '19/10/2569 12:00' }]
    },
    {
      id: 'chef3', name: 'เชฟไอซ์', role: 'เชฟขนมและของหวาน', isHead: false,
      bio: 'ผู้เชี่ยวชาญขนมไทยและของหวาน ทำแล้วหายเร็วมาก',
      photo: null,
      ratings: [{ user: 'ลูกค้า D', score: 5 }],
      comments: [{ user: 'ลูกค้า D', text: 'ทับทิมกรอบอร่อยที่สุด! 😍', time: '18/10/2569 15:00' }]
    }
  ];

  const demoMenus = [
    { id: 'm001', name: 'ข้าวผัดกะเพราหมูไข่ดาว', meal: 'กลางวัน', price: 60,  desc: 'สูตรเด็ดครัวนรก รสจัดจ้าน',       proposedBy: 'เชฟอ็อฟ',   createdAt: '20/10/2569' },
    { id: 'm002', name: 'ต้มยำกุ้งน้ำข้น',         meal: 'เย็น',     price: 120, desc: 'กุ้งสด น้ำข้นเข้มข้น',            proposedBy: 'เชฟอ็อฟ',   createdAt: '20/10/2569' },
    { id: 'm003', name: 'หมูทอดกระเทียม',           meal: 'กลางวัน', price: 70,  desc: 'กรอบนอกนุ่มใน หอมกระเทียม',      proposedBy: 'เชฟทัพไทย', createdAt: '19/10/2569' },
    { id: 'm004', name: 'ไก่ย่างแจ่วบอง',           meal: 'เย็น',     price: 130, desc: 'ไก่บ้านหมักสูตรโบราณ',           proposedBy: 'เชฟทัพไทย', createdAt: '19/10/2569' },
    { id: 'm005', name: 'ทับทิมกรอบ',               meal: 'ของว่าง',  price: 45,  desc: 'น้ำกะทิสด เย็นชื่นใจ',           proposedBy: 'เชฟไอซ์',   createdAt: '18/10/2569' },
    { id: 'm006', name: 'ข้าวเหนียวมะม่วง',          meal: 'ของว่าง',  price: 60,  desc: 'มะม่วงสุก ข้าวเหนียวมูนหอม',    proposedBy: 'เชฟไอซ์',   createdAt: '18/10/2569' },
    { id: 'm007', name: 'โจ๊กไก่',                  meal: 'เช้า',      price: 40,  desc: 'โจ๊กไก่ฉีก ร้อนๆ เช้าๆ',        proposedBy: 'เชฟอ็อฟ',   createdAt: '17/10/2569' }
  ];

  const today = new Date().toLocaleDateString('th-TH');
  const demoKitchen = [
    { id: 'k001', chefId: 'chef1', chefName: 'เชฟอ็อฟ',   menuName: 'กะเพราหมูสับ',    meal: 'กลางวัน', qty: 5,  status: 'done',    note: 'เสร็จแล้วแจกโต๊ะ 3-5', createdAt: today },
    { id: 'k002', chefId: 'chef2', chefName: 'เชฟทัพไทย', menuName: 'หมูทอดกระเทียม',  meal: 'กลางวัน', qty: 3,  status: 'cooking', note: '', createdAt: today },
    { id: 'k003', chefId: 'chef3', chefName: 'เชฟไอซ์',   menuName: 'ทับทิมกรอบ',      meal: 'ของว่าง', qty: 10, status: 'done',    note: 'พร้อมเสิร์ฟ', createdAt: today },
    { id: 'k004', chefId: 'chef1', chefName: 'เชฟอ็อฟ',   menuName: 'ต้มยำกุ้ง',        meal: 'เย็น',    qty: 2,  status: 'cooking', note: 'กำลังตั้งไฟ', createdAt: today }
  ];

  save('chefs', demoChefs);
  save('menus', demoMenus);
  save('kitchenLogs', demoKitchen);

  chefs       = demoChefs;
  menus       = demoMenus;
  kitchenLogs = demoKitchen;

  showToast('✅ โหลดข้อมูลตัวอย่างสำเร็จ');
  if (currentPage === 'dashboard') renderDashboard();
  if (currentPage === 'chefs')     renderChefs();
  if (currentPage === 'kitchen')   renderKitchen();
  if (currentPage === 'menu')      renderMenus();
}

/* =============================================================
   AI ADMIN — ตอบหยาบๆ สไตล์ครัวนรก
   ============================================================= */
const AI_KB = {
  เปิด:      ['เปิดกี่โมง','เวลาเปิด','ปิดกี่โมง','เวลาทำการ'],
  เมนู:      ['เมนูอะไร','มีอะไรบ้าง','เมนูแนะนำ','อาหาร'],
  ราคา:      ['ราคา','เท่าไหร่','แพงไหม','ถูกไหม'],
  เชฟ:       ['เชฟ','คนทำ','ผู้เชี่ยวชาญ'],
  จอง:       ['จอง','จองโต๊ะ','ที่นั่ง','reserve'],
  ที่ตั้ง:   ['อยู่ไหน','ที่ตั้ง','แผนที่','location','ทางไหน'],
  ติดต่อ:    ['โทร','เบอร์','ติดต่อ','contact','line','facebook'],
  รีวิว:     ['รีวิว','อร่อยไหม','ดีไหม','แนะนำ'],
  จอดรถ:     ['จอดรถ','ที่จอด','parking'],
  delivery:  ['ส่ง','เดลิเวอรี','delivery','grab','food panda']
};

const AI_REPLIES = {
  เปิด:      ['เปิดทุกวัน 10โมงเช้า ถึง 4ทุ่ม จะถามทำไมวะ ไม่รู้จะ Google เองหรอ? 😤','เปิด 10:00-22:00 ทุกวัน ไม่มีหยุด ถ้าอยากกิน มาเลย อย่าถามซ้ำ!'],
  เมนู:      ['มีกะเพรา ต้มยำ หมูทอด ไก่ย่าง ของหวานอีกเพียบ ดูในหน้าเมนูได้เลยวะ ขี้เกียจตอบ 😒','เมนูเยอะมาก ไปดูเองในหน้าเมนูสิ ใช้มือเลื่อนเองได้ ไม่ง่อยขนาดนั้นหรอก?'],
  ราคา:      ['ราคาปกติ 40-200 บาท ถ้าแพงไปก็ไปกินที่อื่นสิ ไม่บังคับ 555','เริ่มต้น 40บาท แพงสุด 200บาท คุ้มมาก ถ้าคิดว่าแพงก็แสดงว่าจนไป 😈'],
  เชฟ:       ['มีเชฟอ็อฟ เชฟทัพไทย เชฟไอซ์ ฝีมือดีทุกคน ไปดูในหน้าทีมเชฟเองได้เลย ขี้เกียจพิมพ์!','เชฟเราเก่งทุกคน ไม่ต้องห่วง ถ้าไม่อร่อยค่อยมาบ่นอีกที 😤'],
  จอง:       ['จองได้เลย ทักมาในช่อง "ส่งข้อความถึงเจ้าของ" ข้างบน อย่ามาถามแล้วไม่จอง เสียเวลา!','จองโต๊ะส่งข้อความมาได้เลย ระบุวันเวลา จำนวนคน ถ้าข้อมูลไม่ครบ อย่าโวยวาย'],
  ที่ตั้ง:   ['ร้อยเอ็ด อยู่แถวม.1 ถ้าหาไม่เจอก็ Google Maps เองสิ ไม่มือก็ขาพาไป 😂','อยู่ร้อยเอ็ด ม.1 ไม่รู้จะบอกละเอียดกว่านี้ยังไง ใช้ GPS ได้เลย!'],
  ติดต่อ:    ['ส่งข้อความในเว็บนี้ได้เลย หรือจะโทรมาก็ไม่รับ 555 ติดต่อผ่านเว็บดีสุด!','ติดต่อในเว็บนี้ได้เลย ทำช่องมาให้แล้ว ยังจะถามอีกหรอ? 🙄'],
  รีวิว:     ['อร่อยมาก ถ้าไม่อร่อยก็คงปิดร้านไปนานแล้ว ลองมากินเองสิ อย่านั่งถามอยู่เลย','รีวิวดีทุกอัน ถ้าไม่เชื่อก็ไปกินเองแล้วรู้เอง ไม่มีทางผิดหวัง 🔥'],
  จอดรถ:     ['มีที่จอดรถ หน้าร้าน จอดได้เยอะ อย่าจอดขวาง ไม่งั้นโดนด่าจากเจ้าของด้วย!','จอดหน้าร้านได้เลย ฟรี แต่จอดระเบียบนะ ถ้าจอดห่วยก็โดนด่า ไม่เกี่ยวกัน'],
  delivery:  ['ยังไม่มีเดลิเวอรี มาที่ร้านเองสิ อาหารร้อนๆ อร่อยกว่าตั้งเยอะ ขี้เกียจแค่ไหนเนี่ย!','เดลิเวอรียังไม่มี มากินที่ร้านดีกว่า บรรยากาศดี อาหารร้อน ไม่ต้องรอนาน']
};

const AI_DEFAULT = [
  'ถามอะไรวะ งงเลย ถามใหม่ให้ชัดกว่านี้หน่อย! 😤',
  'ไม่เข้าใจเลย พิมพ์ภาษามนุษย์หน่อยได้ไหม? 🙄',
  'คำถามแปลก ลองถามใหม่ดีกว่า หรือไปถามคนอื่น 555',
  'เอ่อ... ไม่รู้จะตอบอะไร ถามเรื่องร้านได้เลยนะ อย่ามาถามเรื่องชีวิต 😂',
  'เรื่องร้านถามได้นะ เรื่องอื่นไปถามกูเกิ้ลเองเลย ขี้เกียจ!'
];

function aiReply(msg) {
  const m = msg.toLowerCase();
  for (const [topic, keywords] of Object.entries(AI_KB)) {
    if (keywords.some(k => m.includes(k))) {
      const replies = AI_REPLIES[topic];
      return replies[Math.floor(Math.random() * replies.length)];
    }
  }
  return AI_DEFAULT[Math.floor(Math.random() * AI_DEFAULT.length)];
}

/* =============================================================
   CHAT
   ============================================================= */
function sendChat() {
  const inp = document.getElementById('chatInput');
  const msg = inp.value.trim();
  if (!msg) return;
  inp.value = '';

  // เพิ่ม user message
  chatHistory.push({ role: 'user', name: currentUser, text: msg, time: nowStr() });
  save('chatHistory', chatHistory);

  renderChat();

  // AI ตอบหลัง 800ms
  setTimeout(() => {
    const reply = aiReply(msg);
    chatHistory.push({ role: 'ai', name: 'AI แอดมิน 🤖', text: reply, time: nowStr() });
    save('chatHistory', chatHistory);
    renderChat();
    if (currentPage === 'dashboard') renderDashboard();
  }, 800);
}

function renderChat() {
  const win = document.getElementById('chatWindow');
  if (!win) return;
  win.innerHTML = chatHistory.map(m => `
    <div class="chat-msg ${m.role === 'ai' ? 'chat-ai' : 'chat-user'}">
      <div class="chat-name">${escHtml(m.name)}</div>
      <div class="chat-bubble">${escHtml(m.text)}</div>
      <div class="chat-time">${m.time}</div>
    </div>`).join('');
  win.scrollTop = win.scrollHeight;
}

/* =============================================================
   OWNER MESSAGE
   ============================================================= */
function sendOwnerMessage() {
  const inp = document.getElementById('ownerMsgInput');
  const msg = inp.value.trim();
  if (!msg) { showToast('กรุณาพิมพ์ข้อความก่อน'); return; }
  inp.value = '';

  ownerMsgs.push({
    id: 'om' + Date.now(),
    from: currentUser,
    text: msg,
    time: nowStr(),
    replied: false,
    reply: ''
  });
  save('ownerMsgs', ownerMsgs);
  renderOwnerInbox();
  showToast('📨 ส่งข้อความถึงเจ้าของร้านแล้ว');

  // AI ตอบแทนเจ้าของ (style ด่า) หลัง 1.2s
  setTimeout(() => {
    const last = ownerMsgs[ownerMsgs.length - 1];
    last.replied = true;
    last.reply   = aiOwnerReply(msg);
    save('ownerMsgs', ownerMsgs);
    renderOwnerInbox();
    showToast('🤖 AI ตอบแทนเจ้าของร้านแล้ว');
  }, 1200);
}

function aiOwnerReply(msg) {
  const m = msg.toLowerCase();
  // ชุดตอบแทนเจ้าของ — สไตล์ด่า/หยาบ แต่ยังช่วย
  const patterns = [
    { k: ['จอง','โต๊ะ','ที่นั่ง'],     r: ['โอเค จอง ระบุวันเวลาจำนวนคนมาด้วยนะ ไม่งั้นจองยังไงวะ? 😤','จองได้ บอกวัน เวลา กี่คน มาเดี๋ยวนี้เลย อย่าปล่อยไว้นาน!'] },
    { k: ['ร้องเรียน','แย่','ไม่อร่อย','ติ'],r: ['โห มีปัญหาอะไร บอกมาตรงๆ เลย ไม่ต้องอ้อมค้อม จะได้แก้ให้ถูก! 😤','ร้องเรียนได้เลย แต่บอกให้ชัดว่าปัญหาอะไร ไม่งั้นแก้ไม่ถูก นะ?'] },
    { k: ['ชม','อร่อย','ดี','สุดยอด'],   r: ['ขอบคุณนะ แต่ไม่ต้องชมมาก มาอุดหนุนบ่อยๆ ดีกว่า 😂','โอ้โห ขอบคุณที่ชม มาอีกเยอะๆ นะ พาเพื่อนมาด้วย!'] },
    { k: ['สมัคร','งาน','รับสมัคร'],    r: ['อยากทำงานใช่ไหม? ส่งประวัติมาเลย อย่าแค่ถาม ลงมือทำสิ! 😤','สมัครงานได้ แต่ต้องขยัน ถ้าขี้เกียจไม่รับ พูดตรงๆ'] },
  ];
  for (const { k, r } of patterns) {
    if (k.some(kw => m.includes(kw))) return r[Math.floor(Math.random() * r.length)];
  }
  const generic = [
    'ได้รับข้อความแล้ว จะดูให้นะ อย่าโวยวายรอแปปนึง! 😤',
    'โอเค เห็นแล้ว จะจัดการให้ อดใจรอหน่อยนะ อย่าใจร้อน!',
    'รับทราบ ขอบคุณที่ติดต่อมา ถ้าไม่ตอบแปลว่าลืม ทักซ้ำได้ 555',
    'เห็นแล้วๆ จะแก้ให้ ไม่ต้องทักซ้ำนะ กวนใจ! 😂'
  ];
  return generic[Math.floor(Math.random() * generic.length)];
}

function renderOwnerInbox() {
  const box = document.getElementById('ownerInbox');
  if (!box) return;
  if (!ownerMsgs.length) {
    box.innerHTML = '<div class="empty-state"><div class="emoji">📭</div><p>ยังไม่มีข้อความ</p></div>';
    return;
  }
  box.innerHTML = [...ownerMsgs].reverse().map(m => `
    <div class="inbox-item">
      <div class="inbox-from">👤 ${escHtml(m.from)} <span class="inbox-time">${m.time}</span></div>
      <div class="inbox-text">${escHtml(m.text)}</div>
      ${m.replied ? `<div class="inbox-reply">🤖 AI ตอบแทนเจ้าของ: ${escHtml(m.reply)}</div>` : '<div class="inbox-pending">⏳ รอตอบ...</div>'}
    </div>`).join('');
}

/* =============================================================
   CHEF PIN LOGIN
   ============================================================= */
function showChefPin() {
  selectedChefLogin = 'chef1';
  document.getElementById('chefPinInput').value = '';
  document.getElementById('chefPinHint').textContent = '';
  document.querySelectorAll('.chef-select-btn').forEach((b,i) => b.classList.toggle('active', i===0));
  document.getElementById('chefPinOverlay').classList.remove('hidden');
}

function closeChefPin() {
  document.getElementById('chefPinOverlay').classList.add('hidden');
}

function selectChefLogin(chefId, btn) {
  selectedChefLogin = chefId;
  document.querySelectorAll('.chef-select-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('chefPinInput').value = '';
  document.getElementById('chefPinHint').textContent = '';
}

function chefPinLogin() {
  const pin   = document.getElementById('chefPinInput').value.trim();
  const hint  = document.getElementById('chefPinHint');
  if (!pin) { hint.textContent = 'ใส่ PIN ด้วยนะ'; return; }
  if (pin !== CHEF_PINS[selectedChefLogin]) {
    hint.textContent = '❌ PIN ผิด ลองใหม่';
    document.getElementById('chefPinInput').value = '';
    return;
  }
  loggedChefId = selectedChefLogin;
  closeChefPin();
  const chef = chefs && chefs.find(c => c.id === loggedChefId);
  const name = chef ? chef.name : loggedChefId;
  document.getElementById('chefBadge').textContent  = '🍳 ' + name;
  document.getElementById('chefBadge').classList.remove('hidden');
  showToast('🍳 ' + name + ' เข้าสู่ระบบแล้ว');
  showPage('kitchen');
}

function chefLogout() {
  loggedChefId = null;
  document.getElementById('chefBadge').classList.add('hidden');
  document.getElementById('kitchenAddPanel').classList.add('hidden');
  document.getElementById('kitchenLoginPanel').classList.remove('hidden');
  showToast('🚪 ออกจากระบบเชฟแล้ว');
}

/* =============================================================
   KITCHEN LOGS
   ============================================================= */
function addKitchenLog() {
  if (!loggedChefId) { showToast('กรุณา Login ก่อน'); return; }
  const menuName = document.getElementById('kitchenMenuName').value.trim();
  const meal     = document.getElementById('kitchenMeal').value;
  const status   = document.getElementById('kitchenStatus').value;
  const note     = document.getElementById('kitchenNote').value.trim();
  const qty      = parseInt(document.getElementById('kitchenQty').value) || 1;
  if (!menuName) { showToast('ใส่ชื่อเมนูด้วยนะ'); return; }

  const chef = chefs && chefs.find(c => c.id === loggedChefId);
  kitchenLogs.push({
    id: 'k' + Date.now(),
    chefId:   loggedChefId,
    chefName: chef ? chef.name : loggedChefId,
    menuName, meal, qty, status, note,
    createdAt: new Date().toLocaleDateString('th-TH')
  });
  save('kitchenLogs', kitchenLogs);

  document.getElementById('kitchenMenuName').value = '';
  document.getElementById('kitchenNote').value     = '';
  document.getElementById('kitchenQty').value      = '';
  renderKitchen();
  if (currentPage === 'dashboard') renderDashboard();
  showToast('แจ้งงาน "' + menuName + '" แล้ว 🍳');
}

function updateKitchenStatus(id, status) {
  const log = kitchenLogs.find(k => k.id === id);
  if (!log) return;
  // เชฟแก้ได้แค่ของตัวเอง
  if (loggedChefId && log.chefId !== loggedChefId) { showToast('❌ แก้ได้แค่งานของตัวเองนะ'); return; }
  log.status = status;
  save('kitchenLogs', kitchenLogs);
  renderKitchen();
  renderDashboard();
  showToast('อัปเดตสถานะแล้ว ✅');
}

function deleteKitchenLog(id) {
  const log = kitchenLogs.find(k => k.id === id);
  if (!log) return;
  if (loggedChefId && log.chefId !== loggedChefId) { showToast('❌ ลบได้แค่งานของตัวเองนะ'); return; }
  if (!loggedChefId) { showToast('❌ ต้อง Login ก่อนถึงจะลบได้'); return; }
  if (!confirm('ลบงานนี้?')) return;
  kitchenLogs = kitchenLogs.filter(k => k.id !== id);
  save('kitchenLogs', kitchenLogs);
  renderKitchen();
  showToast('ลบแล้ว');
}

function filterKitchen(f, btn) {
  currentKFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderKitchen();
}

function renderKitchen() {
  // แสดง/ซ่อน panel
  if (loggedChefId) {
    document.getElementById('kitchenLoginPanel').classList.add('hidden');
    document.getElementById('kitchenAddPanel').classList.remove('hidden');
    const chef = chefs && chefs.find(c => c.id === loggedChefId);
    document.getElementById('kitchenChefName').textContent = chef ? chef.name : loggedChefId;
  } else {
    document.getElementById('kitchenLoginPanel').classList.remove('hidden');
    document.getElementById('kitchenAddPanel').classList.add('hidden');
  }

  let filtered = [...kitchenLogs];
  const today  = new Date().toLocaleDateString('th-TH');
  if (currentKFilter === 'cooking') filtered = filtered.filter(k => k.status === 'cooking');
  if (currentKFilter === 'done')    filtered = filtered.filter(k => k.status === 'done');
  if (currentKFilter === 'today')   filtered = filtered.filter(k => k.createdAt === today);
  filtered.reverse();

  const list = document.getElementById('kitchenList');
  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state"><div class="emoji">🍳</div><p>ยังไม่มีงานในหมวดนี้</p></div>';
    return;
  }

  const mealIcon = { เช้า: '🌅', กลางวัน: '☀️', เย็น: '🌙', ของว่าง: '🍡' };

  list.innerHTML = filtered.map(k => {
    const isMine  = loggedChefId === k.chefId;
    const canEdit = isMine; // เชฟแก้แค่ของตัวเอง
    return `
    <div class="task-card${k.status === 'done' ? ' done' : ''}">
      <div>
        <div class="task-title">${mealIcon[k.meal]||'🍽️'} ${escHtml(k.menuName)}</div>
        ${k.note ? `<div style="font-size:13px;color:var(--text2);margin-top:3px">📝 ${escHtml(k.note)}</div>` : ''}
        <div class="task-meta">
          <span class="badge" style="background:rgba(255,215,0,.15);color:var(--gold)">👨‍🍳 ${escHtml(k.chefName)}</span>
          <span class="badge badge-cat">${k.meal}</span>
          <span class="badge" style="background:rgba(255,255,255,.07);color:var(--text2)">🍽️ ${k.qty} จาน</span>
          <span class="badge ${k.status==='done' ? 'badge-done' : 'badge-cooking'}">
            ${k.status==='done' ? '✅ เสร็จแล้ว' : '🔥 กำลังปรุง'}
          </span>
          <span class="badge" style="background:rgba(255,255,255,.05);color:var(--text2)">📅 ${k.createdAt}</span>
        </div>
      </div>
      <div class="task-actions">
        ${canEdit && k.status !== 'done' ? `<button class="task-btn task-btn-done" onclick="updateKitchenStatus('${k.id}','done')">✅ เสร็จแล้ว</button>` : ''}
        ${canEdit && k.status === 'done' ? `<button class="task-btn task-btn-progress" onclick="updateKitchenStatus('${k.id}','cooking')">🔥 ยังปรุง</button>` : ''}
        ${canEdit ? `<button class="task-btn task-btn-delete" onclick="deleteKitchenLog('${k.id}')">🗑️</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

/* =============================================================
   DASHBOARD
   ============================================================= */
function renderDashboard() {
  const today       = new Date().toLocaleDateString('th-TH');
  const todayLogs   = kitchenLogs.filter(k => k.createdAt === today);
  const menuDone    = todayLogs.filter(k => k.status === 'done').length;
  const kitchenDone = kitchenLogs.filter(k => k.status === 'done').length;
  const cooking     = kitchenLogs.filter(k => k.status === 'cooking').length;

  document.getElementById('statMenuDone').textContent     = menuDone;
  document.getElementById('statKitchenDone').textContent  = kitchenDone;
  document.getElementById('statKitchenCooking').textContent = cooking;
  document.getElementById('statMessages').textContent     = ownerMsgs.length;
  document.getElementById('welcomeMsg').textContent       = '👋 สวัสดี ' + currentUser + '! ยินดีต้อนรับสู่ครัวนรก';

  // งานครัวล่าสุด
  const rk = document.getElementById('recentKitchen');
  const recentK = [...kitchenLogs].reverse().slice(0, 5);
  const mealIcon = { เช้า: '🌅', กลางวัน: '☀️', เย็น: '🌙', ของว่าง: '🍡' };
  rk.innerHTML = recentK.length
    ? recentK.map(k => `
        <div class="recent-task-item">
          <span class="task-status-dot" style="background:${k.status==='done'?'#2ecc71':'#f39c12'}"></span>
          <span style="flex:1">${mealIcon[k.meal]||'🍽️'} ${escHtml(k.menuName)}</span>
          <span class="badge" style="background:rgba(255,215,0,.15);color:var(--gold)">👨‍🍳 ${escHtml(k.chefName)}</span>
        </div>`).join('')
    : '<div class="empty-state"><div class="emoji">🍳</div><p>ยังไม่มีงานครัว</p></div>';

  // เมนูล่าสุด
  const rm = document.getElementById('recentMenus');
  rm.innerHTML = [...menus].reverse().slice(0,6).map(m =>
    `<span class="menu-chip">${mealIcon[m.meal]||'🍽️'} ${escHtml(m.name)}${m.price?' <span style="color:var(--gold)">'+m.price+'฿</span>':''}</span>`
  ).join('') || '<span style="color:var(--text2)">ยังไม่มีเมนู</span>';
}

/* =============================================================
   CHEFS
   ============================================================= */
function renderChefs() {
  if (!chefs) return;
  document.getElementById('headChefArea').innerHTML = chefs.filter(c => c.isHead).map(chefCardHTML).join('');
  document.getElementById('subChefArea').innerHTML  = chefs.filter(c => !c.isHead).map(chefCardHTML).join('');
}

function chefCardHTML(chef) {
  const avg  = avgRating(chef);
  const stars = [1,2,3,4,5].map(i =>
    `<span class="star${i <= Math.round(avg) ? ' filled' : ''}">⭐</span>`).join('');
  const ratingTxt = avg > 0
    ? avg.toFixed(1) + ' / 5.0 (' + chef.ratings.length + ' คน)'
    : 'ยังไม่มีคะแนน';
  const photoEl = chef.photo
    ? `<img src="${chef.photo}" class="chef-avatar" alt="${escHtml(chef.name)}" />`
    : `<div class="chef-avatar-placeholder">👨‍🍳</div>`;
  return `
  <div class="chef-card${chef.isHead?' head':''}" onclick="openChefModal('${chef.id}')">
    ${photoEl}
    <div class="chef-name">${escHtml(chef.name)}</div>
    <div class="chef-role">${escHtml(chef.role)}</div>
    <div class="chef-stars">${stars}</div>
    <div class="chef-rating-text">${ratingTxt}</div>
    <div class="chef-comment-count">💬 ${chef.comments.length} ความคิดเห็น</div>
  </div>`;
}

function avgRating(chef) {
  if (!chef.ratings || !chef.ratings.length) return 0;
  return chef.ratings.reduce((a, b) => a + b.score, 0) / chef.ratings.length;
}

function openChefModal(chefId) {
  ratingChefId  = chefId;
  pendingRating = 0;
  const chef    = chefs.find(c => c.id === chefId);
  if (!chef) return;
  const avg = avgRating(chef);
  const photoEl = chef.photo
    ? `<img src="${chef.photo}" class="modal-avatar" alt="${escHtml(chef.name)}" />`
    : `<div class="modal-avatar-ph">👨‍🍳</div>`;
  const modalStars = [1,2,3,4,5].map(i =>
    `<span class="modal-star${i<=Math.round(avg)?' filled':''}"
      onclick="setModalRating(${i},'${chefId}')"
      onmouseover="hoverModalRating(${i})"
      onmouseout="resetModalStarHover('${chefId}')">⭐</span>`).join('');
  const commentsHTML = chef.comments.length === 0
    ? '<p style="color:var(--text2);font-size:13px">ยังไม่มีความคิดเห็น</p>'
    : [...chef.comments].reverse().map(c => `
        <div class="comment-item">
          <div class="comment-author">👤 ${escHtml(c.user)}</div>
          <div class="comment-text">${escHtml(c.text)}</div>
          <div class="comment-time">${c.time}</div>
        </div>`).join('');

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-chef-header">
      ${photoEl}
      <div>
        <div style="font-size:22px;font-weight:700">${escHtml(chef.name)}</div>
        <div style="color:var(--text2);font-size:14px;margin-top:4px">${escHtml(chef.role)}</div>
        <div style="font-size:13px;color:var(--text2);margin-top:8px;line-height:1.6">${escHtml(chef.bio)}</div>
        <label class="upload-label" for="photoUp_${chef.id}">📷 อัปโหลดรูปภาพ</label>
        <input class="upload-input" type="file" id="photoUp_${chef.id}" accept="image/*"
          onchange="uploadChefPhoto(event,'${chef.id}')" />
      </div>
    </div>
    <div style="font-size:15px;font-weight:600;margin-bottom:8px">⭐ ให้คะแนนเชฟ</div>
    <div class="modal-stars" id="modalStarsRow">${modalStars}</div>
    <div class="modal-rate-label" id="modalRateLabel">${avg>0?'คะแนนเฉลี่ย '+avg.toFixed(1)+' / 5  ('+chef.ratings.length+' คน)':'ยังไม่มีคะแนน – คุณเป็นคนแรก!'}</div>
    <div style="font-size:15px;font-weight:600;margin:16px 0 10px">💬 ความคิดเห็น</div>
    <div class="comment-box">
      <input type="text" id="commentInput" placeholder="เขียนความคิดเห็น..." maxlength="200" />
      <button onclick="submitComment('${chef.id}')">ส่ง</button>
    </div>
    <div class="comments-list" id="commentsList">${commentsHTML}</div>
  `;
  document.getElementById('chefModal').classList.remove('hidden');
  setTimeout(() => {
    const inp = document.getElementById('commentInput');
    if (inp) inp.addEventListener('keydown', e => { if (e.key==='Enter') submitComment(chefId); });
  }, 50);
}

function closeChefModal() {
  document.getElementById('chefModal').classList.add('hidden');
  pendingRating = 0; ratingChefId = null;
}

function hoverModalRating(score) {
  document.querySelectorAll('.modal-star').forEach((s,i) => s.classList.toggle('filled', i < score));
}

function resetModalStarHover(chefId) {
  const chef = chefs.find(c => c.id === chefId);
  const show = pendingRating || Math.round(avgRating(chef));
  document.querySelectorAll('.modal-star').forEach((s,i) => s.classList.toggle('filled', i < show));
}

function setModalRating(score, chefId) {
  const chef = chefs.find(c => c.id === chefId);
  if (!chef) return;
  pendingRating = score;
  const ex = chef.ratings.findIndex(r => r.user === currentUser);
  if (ex >= 0) chef.ratings[ex].score = score;
  else chef.ratings.push({ user: currentUser, score });
  save('chefs', chefs);
  const avg = avgRating(chef);
  document.getElementById('modalRateLabel').textContent =
    'คุณให้ ' + score + ' ดาว | เฉลี่ย ' + avg.toFixed(1) + ' / 5  (' + chef.ratings.length + ' คน)';
  document.querySelectorAll('.modal-star').forEach((s,i) => s.classList.toggle('filled', i < score));
  showToast('ให้คะแนน ' + score + ' ⭐ แก่ ' + chef.name + ' แล้ว');
  if (currentPage==='chefs') renderChefs();
}

function submitComment(chefId) {
  const inp  = document.getElementById('commentInput');
  const text = inp.value.trim();
  if (!text) return;
  const chef = chefs.find(c => c.id === chefId);
  if (!chef) return;
  chef.comments.push({ user: currentUser, text, time: nowStr() });
  save('chefs', chefs);
  inp.value = '';
  document.getElementById('commentsList').innerHTML =
    [...chef.comments].reverse().map(c => `
      <div class="comment-item">
        <div class="comment-author">👤 ${escHtml(c.user)}</div>
        <div class="comment-text">${escHtml(c.text)}</div>
        <div class="comment-time">${c.time}</div>
      </div>`).join('');
  showToast('ความคิดเห็นถูกส่งแล้ว 💬');
  if (currentPage==='chefs') renderChefs();
}

function uploadChefPhoto(event, chefId) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const chef = chefs.find(c => c.id === chefId);
    if (!chef) return;
    chef.photo = e.target.result;
    save('chefs', chefs);
    showToast('อัปโหลดรูปภาพสำเร็จ 📷');
    openChefModal(chefId);
    if (currentPage==='chefs') renderChefs();
  };
  reader.readAsDataURL(file);
}

/* =============================================================
   MENU
   ============================================================= */
function addMenu() {
  const name  = document.getElementById('menuName').value.trim();
  const meal  = document.getElementById('menuMeal').value;
  const price = document.getElementById('menuPrice').value;
  const desc  = document.getElementById('menuDesc').value.trim();
  if (!name) { showToast('ใส่ชื่อเมนูด้วยนะ'); return; }
  menus.push({ id: 'm'+Date.now(), name, meal, price: price?parseInt(price):null,
    desc, proposedBy: currentUser, createdAt: new Date().toLocaleDateString('th-TH') });
  save('menus', menus);
  document.getElementById('menuName').value  = '';
  document.getElementById('menuPrice').value = '';
  document.getElementById('menuDesc').value  = '';
  renderMenus();
  showToast('เสนอเมนู "'+name+'" แล้ว 🍽️');
}

function showMeal(meal, btn) {
  currentMeal = meal;
  document.querySelectorAll('.meal-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMenus();
}

function renderMenus() {
  const mealIcon = { เช้า:'🌅', กลางวัน:'☀️', เย็น:'🌙', ของว่าง:'🍡' };
  const filtered = (currentMeal==='ทั้งหมด' ? menus : menus.filter(m=>m.meal===currentMeal)).slice().reverse();
  const list = document.getElementById('menuList');
  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state"><div class="emoji">🍽️</div><p>ยังไม่มีเมนู</p></div>';
    return;
  }
  list.innerHTML = filtered.map(m => `
    <div class="menu-card">
      <div class="menu-card-header">
        <div class="menu-card-name">${escHtml(m.name)}</div>
        <span class="menu-card-meal">${mealIcon[m.meal]||'🍽️'} ${m.meal}</span>
      </div>
      ${m.price ? `<div class="menu-card-price">${m.price} ฿</div>` : ''}
      ${m.desc  ? `<div class="menu-card-desc">${escHtml(m.desc)}</div>` : ''}
      <div class="menu-card-author">📅 ${m.createdAt} · เสนอโดย ${escHtml(m.proposedBy)}</div>
      <button class="menu-card-del" onclick="deleteMenu('${m.id}')">🗑️ ลบ</button>
    </div>`).join('');
}

function deleteMenu(id) {
  if (!confirm('ลบเมนูนี้?')) return;
  menus = menus.filter(m => m.id !== id);
  save('menus', menus);
  renderMenus();
  showToast('ลบเมนูแล้ว');
}

/* =============================================================
   AUTH / NAVIGATION
   ============================================================= */
function enterSite() {
  const val = document.getElementById('nameInput').value.trim();
  if (!val) { showToast('ใส่ชื่อก่อนนะ 😊'); return; }
  currentUser = val;
  save('lastUser', val);
  document.getElementById('nameOverlay').classList.add('hidden');
  document.getElementById('navbar').classList.remove('hidden');
  document.getElementById('navUsername').textContent = '👤 ' + val;
  showPage('dashboard');
}

function changeName() {
  const n = prompt('ชื่อใหม่:', currentUser);
  if (n && n.trim()) {
    currentUser = n.trim();
    save('lastUser', currentUser);
    document.getElementById('navUsername').textContent = '👤 ' + currentUser;
    showToast('เปลี่ยนชื่อแล้ว');
  }
}

function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(page + 'Page').classList.remove('hidden');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));
  if (page==='dashboard') renderDashboard();
  if (page==='chefs')     renderChefs();
  if (page==='kitchen')   renderKitchen();
  if (page==='menu')      renderMenus();
  if (page==='chat')      { renderChat(); renderOwnerInbox(); }
}

/* =============================================================
   UTILS
   ============================================================= */
function escHtml(str) {
  return String(str??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function nowStr() {
  return new Date().toLocaleString('th-TH', { dateStyle:'short', timeStyle:'short' });
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* =============================================================
   INIT
   ============================================================= */
window.addEventListener('DOMContentLoaded', () => {
  if (!chefs) setupDemoData();

  const saved = load('lastUser','');
  if (saved) document.getElementById('nameInput').value = saved;

  document.getElementById('nameInput').addEventListener('keydown', e => {
    if (e.key==='Enter') enterSite();
  });
  document.getElementById('chefPinInput').addEventListener('keydown', e => {
    if (e.key==='Enter') chefPinLogin();
  });
  document.getElementById('chefModal').addEventListener('click', function(e) {
    if (e.target===this) closeChefModal();
  });
  document.getElementById('chefPinOverlay').addEventListener('click', function(e) {
    if (e.target===this) closeChefPin();
  });
});
