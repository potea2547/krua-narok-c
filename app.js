/* ═══════════════════════════════════════════════════════════
   ครัวนรก ร้อยม.1 — app.js (Full Version + Firebase)
   ═══════════════════════════════════════════════════════════ */

// ─── FIREBASE CONFIG ──────────────────────────────────────────
const FB_URL = 'https://krua-narok-c-32494-default-rtdb.firebaseio.com';

// Firebase REST helpers
const FB = {
  async get(path){
    try{
      const r = await fetch(`${FB_URL}/${path}.json`);
      return await r.json();
    } catch(e){ return null; }
  },
  async set(path, data){
    try{
      await fetch(`${FB_URL}/${path}.json`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
    } catch(e){}
  },
  async push(path, data){
    try{
      const r = await fetch(`${FB_URL}/${path}.json`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      return await r.json(); // { name: "-Nxxx" }
    } catch(e){ return null; }
  },
  async delete(path){
    try{
      await fetch(`${FB_URL}/${path}.json`, { method:'DELETE' });
    } catch(e){}
  },
  poll(path, callback, interval=5000){
    callback();
    return setInterval(callback, interval);
  }
};

// ─── PINS ─────────────────────────────────────────────────────
const ADMIN_PIN = '159787';
const CHEF_PINS = { chef1:'1111', chef2:'2222', chef3:'3333' };

// ─── STATE ────────────────────────────────────────────────────
let currentUser   = '';
let isAdmin       = false;
let loggedChefId  = null;
let currentPage   = 'dashboard';
let currentMeal   = 'ทั้งหมด';
let currentKF     = 'all';
let currentFoodCat= 'ทั้งหมด';
let selectedChef  = 'chef1';
let pendingRating = 0;

// ─── STORAGE ──────────────────────────────────────────────────
const S = {
  get:(k,d)=>{ try{return JSON.parse(localStorage.getItem(k))??d}catch{return d} },
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))
};

let chefs       = S.get('chefs_v2', null);
let kitchenLogs = S.get('kitchenLogs', []);
let menus       = S.get('menus_v2', []);
let foodItems   = S.get('foodItems', []);
let ownerMsgs   = S.get('ownerMsgs', []);
let chatHist    = S.get('chatHist', []);

/* ═══════════════════════════════════════════════════════════
   DEMO DATA
   ═══════════════════════════════════════════════════════════ */
function setupDemoData(){
  const demoChefs=[
    { id:'chef1',name:'เชฟอ็อฟ',role:'หัวหน้าเชฟ',isHead:true,
      bio:'หัวหน้าครัวนรก ประสบการณ์สูง รสมือจัดจ้าน คุมทีมมาหลายปี',
      photo:'S__27639813.jpg',ratings:[{user:'ลูกค้า A',score:5},{user:'ลูกค้า B',score:4}],
      comments:[{user:'ลูกค้า A',text:'กะเพราเชฟอ็อฟสุดยอด! 🔥',time:'20/10/69 10:00'}]},
    { id:'chef2',name:'เชฟทัพไทย',role:'เชฟครัวร้อน',isHead:false,
      bio:'เชี่ยวชาญครัวร้อน ทอด ผัด ย่าง ฝีมือดีไม่แพ้ใคร',
      photo:'S__27639823_0.jpg',ratings:[{user:'ลูกค้า C',score:4}],
      comments:[{user:'ลูกค้า C',text:'หมูทอดกรอบมากเลย 👍',time:'19/10/69 12:00'}]},
    { id:'chef3',name:'เชฟไอซ์',role:'เชฟขนมและของหวาน',isHead:false,
      bio:'ผู้เชี่ยวชาญขนมไทยและของหวาน ทำแล้วหายเร็วมาก',
      photo:'S__27639822_0.jpg',ratings:[{user:'ลูกค้า D',score:5}],
      comments:[{user:'ลูกค้า D',text:'ทับทิมกรอบอร่อยที่สุด! 😍',time:'18/10/69 15:00'}]}
  ];
  const today=new Date().toLocaleDateString('th-TH');
  const demoKitchen=[
    {id:'k001',chefId:'chef1',chefName:'เชฟอ็อฟ',menuName:'กะเพราหมูสับ',
     meal:'กลางวัน',qty:5,status:'done',note:'เสร็จแล้ว',
     photo:null,foodImg:'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg',createdAt:today},
    {id:'k002',chefId:'chef2',chefName:'เชฟทัพไทย',menuName:'หมูทอดกระเทียม',
     meal:'กลางวัน',qty:3,status:'cooking',note:'กำลังทำ',
     photo:null,foodImg:null,createdAt:today},
    {id:'k003',chefId:'chef3',chefName:'เชฟไอซ์',menuName:'ทับทิมกรอบ',
     meal:'ของว่าง',qty:10,status:'done',note:'พร้อมเสิร์ฟ',
     photo:null,foodImg:null,createdAt:today}
  ];
  const demoMenus=[
    {id:'m001',name:'ข้าวผัดกะเพราหมู',meal:'กลางวัน',desc:'สูตรเด็ด',
     proposedBy:'เชฟอ็อฟ',isChef:true,foodImg:'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg',createdAt:today},
    {id:'m002',name:'ต้มยำกุ้ง',meal:'เย็น',desc:'น้ำข้นเข้มข้น',
     proposedBy:'ลูกค้า A',isChef:false,foodImg:null,createdAt:today}
  ];
  const demoFood=[
    {id:'f001',name:'ข้าวผัดกะเพรา',category:'อาหารจานเดียว',
     desc:'กะเพราหมูสับรสจัด ไข่ดาวกรอบ',
     photo:null,foodImg:'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg',
     addedBy:'admin',createdAt:today},
    {id:'f002',name:'ต้มยำกุ้ง',category:'ซุป/แกง',
     desc:'น้ำข้นกุ้งสด',
     photo:null,foodImg:'https://www.themealdb.com/images/media/meals/hyarod1565090529.jpg',
     addedBy:'admin',createdAt:today},
    {id:'f003',name:'ทับทิมกรอบ',category:'ของหวาน',
     desc:'น้ำกะทิสดเย็นชื่นใจ',
     photo:null,foodImg:null,
     addedBy:'admin',createdAt:today}
  ];
  S.set('chefs_v2',demoChefs); S.set('kitchenLogs',demoKitchen);
  S.set('menus_v2',demoMenus); S.set('foodItems',demoFood);
  chefs=demoChefs; kitchenLogs=demoKitchen; menus=demoMenus; foodItems=demoFood;
  showToast('✅ โหลดข้อมูลตัวอย่างสำเร็จ');
  renderCurrentPage();
}

/* ═══════════════════════════════════════════════════════════
   เชฟว่าจ่าเฉย — AI BOT
   ═══════════════════════════════════════════════════════════ */
const BOT_NAME = 'เชฟว่าจ่าเฉย 👨‍🍳';
const BOT_AVATAR = '👨‍🍳';

const BOT_KB=[
  {k:['เปิด','ปิด','เวลา','กี่โมง'],
   r:['เปิดทุกวันครับ 10 โมงเช้าถึง 4 ทุ่ม มาได้เลย ถ้าไม่มาก็อดกินสิ 555',
      'เปิด 10:00–22:00 ทุกวันเลย ไม่มีหยุด ถ้าอยากกินมาได้เลยครับ อย่าถามซ้ำ!']},
  {k:['เมนู','อาหาร','มีอะไร','กินอะไร','สั่งอะไร'],
   r:['มีกะเพรา ต้มยำ หมูทอด ไก่ย่าง ขนมไทยเพียบเลยครับ ไปดูหน้าเมนูได้เลย ขี้เกียจพิมให้ครบ 555',
      'เมนูเยอะมากครับ เข้าไปดูหน้าอาหารได้เลย อย่านั่งถามคนเดียวสิ!']},
  {k:['ราคา','เท่าไหร่','แพง','ถูก','ค่าอาหาร'],
   r:['ราคาปกติเลยครับ 40–200 บาท ถ้าคิดว่าแพงไปก็ไปกินที่อื่นสิ ไม่บังคับ 😂',
      'ไม่แพงหรอกครับ คุ้มมาก ถ้าคิดว่าแพง... อ้าว จนไปหน่อยมั้ย 555']},
  {k:['จอง','โต๊ะ','ที่นั่ง','reserve','นั่ง'],
   r:['จองโต๊ะส่งข้อความมาในช่อง "ส่งข้อความถึงเจ้าของ" ได้เลยครับ บอกวัน เวลา กี่คน ไม่บอกก็จองไม่ได้นะ!',
      'ส่งข้อความมาจองได้เลยครับ แต่ถ้าบอกข้อมูลไม่ครบ อย่าโวยวายนะ ไม่รู้จะจองยังไงให้']},
  {k:['อร่อย','ดี','สุดยอด','แนะนำ','น่ากิน','รีวิว'],
   r:['อร่อยแน่นอนครับ ถ้าไม่อร่อยคงปิดร้านไปนานแล้ว ลองมากินเองสิ 🔥',
      'ดีที่สุดในร้อยเอ็ดเลยครับ พูดเองเชื่อเองนะ แต่มันจริงๆ มาลองได้เลย!']},
  {k:['ที่ไหน','อยู่ที่','แผนที่','ทางไหน','ที่อยู่','ตั้งอยู่'],
   r:['อยู่ร้อยเอ็ด ม.1 ครับ เปิด Google Maps แล้วพิมพ์ "ครัวนรก ร้อยม.1" ได้เลย ง่ายมาก 😅',
      'ร้อยเอ็ด ม.1 ครับ ถ้าหาไม่เจอก็ Google Maps สิ ไม่ยากเลย']},
  {k:['เชฟ','คนทำ','ใครทำ','ทีม'],
   r:['มีเชฟอ็อฟ หัวหน้าเชฟ เชฟทัพไทย เชฟไอซ์ครับ ทุกคนเก่งทั้งนั้น ไปดูหน้าทีมเชฟได้เลย!',
      'เชฟเราฝีมือดีทุกคนครับ หัวหน้าเชฟอ็อฟเป็นคนคุม ไปดูประวัติในหน้าทีมเชฟได้เลยนะ']},
  {k:['delivery','ส่ง','เดลิเวอรี','grab','food panda'],
   r:['ยังไม่มีเดลิเวอรีครับ มากินที่ร้านดีกว่า อาหารร้อนๆ อร่อยกว่าตั้งเยอะ 555',
      'ไม่มีส่งครับ มาเองเลยดีกว่า บรรยากาศร้านดีมาก อาหารร้อนๆ อร่อยกว่าแน่นอน!']},
  {k:['สมัครงาน','รับสมัคร','ทำงาน','หางาน','สมัคร'],
   r:['อยากทำงานด้วยใช่มั้ยครับ ส่งข้อความหาเจ้าของได้เลย แต่ต้องขยันนะ ขี้เกียจไม่รับ! 😤',
      'ส่งข้อความมาได้เลยครับ บอกประสบการณ์มาด้วย ถ้าขยันก็รับ ถ้าขี้เกียจก็ไปที่อื่นสิ']},
  {k:['ชม','ขอบคุณ','thank','ดีมาก','เยี่ยม'],
   r:['ขอบคุณมากครับ ยินดีต้อนรับเสมอ มาอีกบ่อยๆ นะ พาเพื่อนมาด้วยก็ดี! 😊',
      'โอ้โห ขอบคุณครับ ทำให้อยากทำอาหารดีๆ ให้อีกเลย มาบ่อยๆนะ!']},
  {k:['ช่วย','admin','แอดมิน','จัดการ'],
   r:['ฉันเป็น AI แอดมินตัวช่วย ถามเรื่องร้านได้เลย หรือบอก admin คนจริงผ่านช่องข้อความ 🤖',
      'AI แอดมินพร้อมช่วย! ถามเรื่องร้านหรือส่งข้อความถึงเจ้าของได้เลย 🔥']}
];

const BOT_DEF=[
  'ถามอะไรครับ? ไม่ค่อยเข้าใจเลย ลองถามใหม่ให้ชัดกว่านี้ได้ไหม 😅',
  'งงเลยครับ พิมภาษามนุษย์หน่อยได้ไหม? ถามเรื่องร้านได้เลยนะ 555',
  'ไม่แน่ใจว่าจะตอบยังไงดีครับ ลองถามเรื่องเมนู เวลาเปิด หรือจองโต๊ะแทนดีกว่า!',
  'เออ... ไม่รู้จะตอบอะไรดีครับ ถามเรื่องร้านได้เลย ยินดีตอบทุกอย่าง!'
];

function aiReply(msg){
  const m=msg.toLowerCase();
  for(const {k,r} of BOT_KB) if(k.some(w=>m.includes(w))) return r[Math.floor(Math.random()*r.length)];
  return BOT_DEF[Math.floor(Math.random()*BOT_DEF.length)];
}

// Owner reply bot
const OWNER_REPLIES=[
  {k:['จอง'],r:['โอเคครับ จองได้เลย บอกวัน เวลา จำนวนคนมาด้วยนะ ไม่บอกจะจองยังไง 😤',
    'ได้เลยครับ ระบุวันเวลาให้ชัด อย่าบอกแค่อยากจอง ไม่รู้จะจัดให้ยังไง']},
  {k:['ชม','อร่อย','ดี','ขอบคุณ'],r:['ขอบคุณมากครับ ดีใจที่ชอบ มาอีกเยอะๆ นะ พาเพื่อนมาด้วย 😄',
    'โอ้โห ขอบคุณครับ รู้สึกดีมากเลย มาบ่อยๆ นะ!']},
  {k:['ร้องเรียน','แย่','ไม่ดี','ปัญหา'],r:['บอกให้ชัดเลยครับว่าปัญหาอะไร จะได้แก้ไขให้ถูกต้อง ขอโทษด้วยนะครับ',
    'ขอโทษด้วยครับ มีปัญหาอะไรบอกตรงๆ เลย จะรีบแก้ไขให้เลย']},
  {k:['สมัคร','งาน'],r:['ส่งประวัติมาได้เลยครับ แต่ต้องขยันนะ ขี้เกียจไม่รับ 😤',
    'สนใจงานใช่มั้ยครับ บอกประสบการณ์มาด้วยนะ จะได้พิจารณาได้']}
];

const OWNER_DEF=[
  'ได้รับข้อความแล้วครับ จะดูให้เร็วๆ นี้ รอแป็บนึงนะ! 😊',
  'โอเคครับ เห็นแล้ว จะจัดการให้ ขอบคุณที่ติดต่อมา',
  'รับทราบครับ ขอบคุณมาก ถ้าไม่ตอบแปลว่าลืม ทักซ้ำได้เลยนะ'
];

function ownerAiReply(msg){
  const m=msg.toLowerCase();
  for(const {k,r} of OWNER_REPLIES) if(k.some(w=>m.includes(w))) return r[Math.floor(Math.random()*r.length)];
  return OWNER_DEF[Math.floor(Math.random()*OWNER_DEF.length)];
}

/* ═══════════════════════════════════════════════════════════
   FOOD IMAGE SEARCH
   ═══════════════════════════════════════════════════════════ */
async function fetchFoodImage(name){
  try{
    const eng=await translateToEng(name);
    const res=await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(eng)}`);
    const data=await res.json();
    if(data.meals && data.meals[0]) return data.meals[0].strMealThumb;
  } catch(e){}
  return null;
}

const FOOD_DICT={
  'กะเพรา':'basil stir fry','ต้มยำ':'tom yum','ต้มข่า':'tom kha',
  'แกงเขียวหวาน':'green curry','แกงแดง':'red curry','แกงมัสมั่น':'massaman curry',
  'ผัดไทย':'pad thai','ข้าวผัด':'fried rice','ข้าวผัดกะเพรา':'basil fried rice',
  'หมูทอด':'pork fry','ไก่ย่าง':'grilled chicken','ปลาทอด':'fried fish',
  'ยำวุ้นเส้น':'glass noodle salad','ส้มตำ':'papaya salad','ลาบ':'laab',
  'น้ำตก':'nam tok','สุกี้':'sukiyaki','ชาบู':'shabu',
  'ทับทิมกรอบ':'ruby red dessert','ข้าวเหนียวมะม่วง':'mango sticky rice',
  'ลอดช่อง':'lod chong','บัวลอย':'bua loy','โจ๊ก':'congee','ข้าวต้ม':'rice soup'
};

function translateToEng(thaiName){
  const lower=thaiName.toLowerCase();
  for(const[th,en] of Object.entries(FOOD_DICT)) if(lower.includes(th)) return en;
  return thaiName;
}

async function previewFoodImage(inputId, previewId){
  const name=document.getElementById(inputId)?.value.trim();
  if(!name) return;
  const prev=document.getElementById(previewId);
  if(!prev) return;
  prev.innerHTML='<div style="color:var(--t2);font-size:13px">🔍 กำลังหารูป...</div>';
  const url=await fetchFoodImage(name);
  prev.innerHTML=url
    ? `<img src="${url}" style="width:100%;max-width:260px;border-radius:10px;margin-top:8px" onerror="this.style.display='none'">`
    : '<div style="color:var(--t2)">ไม่พบรูป</div>';
  prev.dataset.imgUrl=url||'';
}

/* ═══════════════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════════════ */
function enterSite(){
  const val=document.getElementById('nameInput').value.trim();
  if(!val){showToast('ใส่ชื่อก่อนนะ 😊');return;}
  currentUser=val; S.set('lastUser',val);
  document.getElementById('nameOverlay').classList.add('hidden');
  document.getElementById('navbar').classList.remove('hidden');
  updateNavUser(); showPage('dashboard');
}

function showAdminLogin(){document.getElementById('adminOverlay').classList.remove('hidden')}
function closeAdminLogin(){document.getElementById('adminOverlay').classList.add('hidden')}

function adminLogin(){
  const name=document.getElementById('adminNameInput').value.trim();
  const pin =document.getElementById('adminPinInput').value.trim();
  const hint=document.getElementById('adminLoginHint');
  if(!name){hint.textContent='ใส่ชื่อด้วยนะ';return;}
  if(pin!==ADMIN_PIN){hint.textContent='❌ PIN ผิด';document.getElementById('adminPinInput').value='';return;}
  currentUser=name||'Admin'; isAdmin=true;
  S.set('lastUser',currentUser); S.set('isAdmin',true);
  document.getElementById('nameOverlay').classList.add('hidden');
  document.getElementById('adminOverlay').classList.add('hidden');
  document.getElementById('navbar').classList.remove('hidden');
  document.getElementById('adminLoginBtn').classList.add('hidden');
  document.getElementById('adminLogoutBtn').classList.remove('hidden');
  updateNavUser(); updateAdminPanels(); showPage('dashboard');
  showToast('🔐 เข้าสู่ระบบ Admin แล้ว!');
}

function adminLogout(){
  isAdmin=false; S.set('isAdmin',false);
  document.getElementById('adminLoginBtn').classList.remove('hidden');
  document.getElementById('adminLogoutBtn').classList.add('hidden');
  updateNavUser(); updateAdminPanels();
  showToast('🚪 ออกจาก Admin แล้ว');
}

function updateNavUser(){
  document.getElementById('navUsername').textContent='👤 '+currentUser;
  const rb=document.getElementById('roleBadge');
  if(isAdmin){rb.textContent='🔐 Admin';rb.className='role-badge role-admin';}
  else if(loggedChefId){
    const c=chefs&&chefs.find(x=>x.id===loggedChefId);
    rb.textContent='🍳 '+(c?c.name:loggedChefId);rb.className='role-badge role-chef';
  } else {rb.textContent='👁️ ผู้ชม';rb.className='role-badge role-viewer';}
}

function updateAdminPanels(){
  const p=document.getElementById('adminMenuPanel');
  if(p) p.classList.toggle('hidden',!isAdmin);
}

function changeName(){
  const n=prompt('ชื่อใหม่:',currentUser);
  if(n&&n.trim()){currentUser=n.trim();S.set('lastUser',currentUser);updateNavUser();}
}

/* CHEF PIN */
function showChefPin(){
  selectedChef='chef1';
  document.getElementById('chefPinInput').value='';
  document.getElementById('chefPinHint').textContent='';
  document.querySelectorAll('.chef-select-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
  document.getElementById('chefPinOverlay').classList.remove('hidden');
}

function closeChefPin(){document.getElementById('chefPinOverlay').classList.add('hidden')}

function selectChefLogin(id,btn){
  selectedChef=id;
  document.querySelectorAll('.chef-select-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('chefPinInput').value='';
}

function chefPinLogin(){
  const pin=document.getElementById('chefPinInput').value.trim();
  const hint=document.getElementById('chefPinHint');
  if(!pin){hint.textContent='ใส่ PIN ด้วย';return;}
  if(pin!==CHEF_PINS[selectedChef]){hint.textContent='❌ PIN ผิด';document.getElementById('chefPinInput').value='';return;}
  loggedChefId=selectedChef; closeChefPin();
  const c=chefs&&chefs.find(x=>x.id===loggedChefId);
  updateNavUser();
  showToast('🍳 '+(c?c.name:loggedChefId)+' เข้าระบบแล้ว');
  showPage('kitchen');
}

function chefLogout(){
  loggedChefId=null; updateNavUser();
  document.getElementById('kitchenLoginPanel')?.classList.remove('hidden');
  document.getElementById('kitchenAddPanel')?.classList.add('hidden');
  showToast('🚪 ออกจากระบบเชฟแล้ว');
}

/* ═══════════════════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════════════════ */
function showPage(page){
  currentPage=page