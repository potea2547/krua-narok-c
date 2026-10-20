/* ═══════════════════════════════════════════════════════════
   ครัวนรก ร้อยม.1 — app.js  (Full Version + Firebase)
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
  // Poll ทุก 5 วินาที (realtime-like)
  poll(path, callback, interval=5000){
    callback(); // เรียกครั้งแรกทันที
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
/* ═══════════════════════════════════════════════════════════
   เชฟว่าจ่าเฉย — AI BOT หยาบๆ แต่เป็นกันเอง
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
  {k:['อร่อย','ดี','สุดยอด','แนะนำ','น่ากิน'],
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
  {k:['สมัครงาน','รับสมัคร','ทำงาน','หางาน'],
   r:['อยากทำงานด้วยใช่มั้ยครับ ส่งข้อความหาเจ้าของได้เลย แต่ต้องขยันนะ ขี้เกียจไม่รับ! 😤',
      'ส่งข้อความมาได้เลยครับ บอกประสบการณ์มาด้วย ถ้าขยันก็รับ ถ้าขี้เกียจก็ไปที่อื่นสิ']},
  {k:['ชม','ขอบคุณ','thank','ดีมาก','เยี่ยม'],
   r:['ขอบคุณมากครับ ยินดีต้อนรับเสมอ มาอีกบ่อยๆ นะ พาเพื่อนมาด้วยก็ดี! 😊',
      'โอ้โห ขอบคุณครับ ทำให้อยากทำอาหารดีๆ ให้อีกเลย มาบ่อยๆ นะ!']}
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
  {k:['เปิด','ปิด','เวลา','กี่โมง'],
   r:['เปิด 10:00-22:00 ทุกวัน ถามทำไมวะ? Google ได้นะ 😤',
      'เปิดสิบโมงเช้าถึงสี่ทุ่ม มาได้เลย อย่าถามซ้ำ!']},
  {k:['เมนู','อาหาร','มีอะไร'],
   r:['ดูในหน้าเมนูได้เลยวะ ขี้เกียจพิมพ์ให้ครบ 😒',
      'เมนูเยอะมาก ไปดูเองในหน้า "อาหาร" สิ ไม่ง่อยขนาดนั้น?']},
  {k:['ราคา','เท่าไหร่','แพง'],
   r:['แพงไปก็ไปกินที่อื่นสิ ไม่บังคับ 555',
      'ราคาปกติ คุ้มมาก ถ้าคิดว่าแพงแสดงว่าจนไป 😈']},
  {k:['จอง','โต๊ะ','ที่นั่ง'],
   r:['จองส่งข้อความมาในช่องเจ้าของร้านได้เลย บอกวัน เวลา กี่คน อย่าลืมนะ!',
      'ส่งข้อความในเว็บนี้ได้เลย แต่บอกข้อมูลให้ครบ ไม่งั้นไม่รับ']},
  {k:['อร่อย','ดี','รีวิว'],
   r:['อร่อยมาก ถ้าไม่เชื่อมากินเองสิ 🔥','รีวิวดีทุกอัน ลองมาดูเองแล้วรู้เอง']},
  {k:['ที่ไหน','อยู่','แผนที่'],
   r:['ร้อยเอ็ด ม.1 ใช้ Google Maps เองสิ! 😂',
      'อยู่ร้อยเอ็ด หาเองได้ GPS มีอยู่แล้ว']},
  {k:['เชฟ','คนทำ'],
   r:['มีเชฟอ็อฟ เชฟทัพไทย เชฟไอซ์ ดูในหน้าทีมเชฟได้เลย',
      'เชฟเราเก่งทุกคน ไปดูเองสิ ขี้เกียจอธิบาย']},
  {k:['delivery','ส่ง','เดลิเวอรี'],
   r:['ยังไม่มีเดลิเวอรี มากินที่ร้านเองดีกว่า อาหารร้อนๆ อร่อยกว่า!',
      'ส่งไม่ได้ มาเองสิ ขี้เกียจนักก็อย่ากิน 555']},
  {k:['สมัคร','งาน','รับสมัคร'],
   r:['ส่งข้อความถึงเจ้าของร้านได้เลย แต่ต้องขยัน ขี้เกียจไม่รับ 😤',
      'อยากทำงานใช่ไหม? ส่งข้อความมาเลย อย่าแค่ถาม']},
  // Bot admin commands
  {k:['ช่วย','admin','แอดมิน','จัดการ'],
   r:['ฉันเป็น AI แอดมินตัวช่วย ถามเรื่องร้านได้เลย หรือบอก admin คนจริงผ่านช่องข้อความ 🤖',
      'AI แอดมินพร้อมช่วย! ถามเรื่องร้านหรือส่งข้อความถึงเจ้าของได้เลย 🔥']}
];
const BOT_DEF=[
  'ถามอะไรวะ? ถามใหม่ให้ชัดกว่านี้ 😤',
  'ไม่เข้าใจเลย พิมภาษามนุษย์หน่อยได้ไหม? 🙄',
  'เรื่องร้านถามได้นะ เรื่องอื่นไปถามกูเกิ้ล 555',
  'งงเลย ถามเรื่องร้านครัวนรกสิ ไม่ใช่เรื่องชีวิต 😂'
];
function aiReply(msg){
  const m=msg.toLowerCase();
  for(const {k,r} of BOT_KB) if(k.some(w=>m.includes(w))) return r[Math.floor(Math.random()*r.length)];
  return BOT_DEF[Math.floor(Math.random()*BOT_DEF.length)];
}

// Owner reply bot (ด่าได้)
const OWNER_REPLIES=[
  {k:['จอง'],r:['โอเค จองได้ บอกวัน เวลา จำนวนคนมาด้วยนะ ไม่งั้นจองไม่ได้ 😤',
    'ได้เลย ระบุวันเวลาให้ชัด อย่าบอกแค่อยากจอง!']},
  {k:['ชม','อร่อย','ดี','ขอบคุณ'],r:['ขอบคุณนะ มาอีกเยอะๆ พาเพื่อนมาด้วย 😄',
    'โอ้โห ขอบคุณ มาบ่อยๆ นะ!']},
  {k:['ร้องเรียน','แย่','ไม่ดี'],r:['บอกให้ชัดว่าปัญหาอะไร จะได้แก้ถูก! 😤',
    'มีปัญหาอะไรบอกตรงๆ เลย ไม่ต้องอ้อมค้อม']},
  {k:['สมัคร','งาน'],r:['ส่งประวัติมาเลย แต่ต้องขยัน ขี้เกียจไม่รับ 😤',
    'สนใจงานใช่ไหม? บอกประสบการณ์มาด้วยนะ']}
];
const OWNER_DEF=['ได้รับข้อความแล้ว จะดูให้ อย่าโวยวาย รอแป็บนึง 😤',
  'โอเค เห็นแล้ว จะจัดการให้ อดใจรอหน่อยนะ!',
  'รับทราบ ขอบคุณที่ติดต่อมา ถ้าไม่ตอบแปลว่าลืม ทักซ้ำได้ 555'];
function ownerAiReply(msg){
  const m=msg.toLowerCase();
  for(const {k,r} of OWNER_REPLIES) if(k.some(w=>m.includes(w))) return r[Math.floor(Math.random()*r.length)];
  return OWNER_DEF[Math.floor(Math.random()*OWNER_DEF.length)];
}

/* ═══════════════════════════════════════════════════════════
   FOOD IMAGE SEARCH (MealDB API)
   ═══════════════════════════════════════════════════════════ */
async function fetchFoodImage(name){
  try{
    const eng=await translateToEng(name);
    const res=await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(eng)}`);
    const data=await res.json();
    if(data.meals && data.meals[0]) return data.meals[0].strMealThumb;
  } catch(e){}
  // fallback: Unsplash food photo
  return `https://source.unsplash.com/400x300/?${encodeURIComponent(name+' food thai')}`;
}

// แปลชื่ออาหารไทยเป็น Eng (ตาราง basic)
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
  return thaiName; // ส่งเป็นภาษาไทยไป — Unsplash จะ fallback
}

// Preview รูปก่อนเพิ่ม
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
  currentPage=page;
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  const pg=document.getElementById(page+'Page');
  if(pg) pg.classList.remove('hidden');
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.toggle('active',l.dataset.page===page));
  renderCurrentPage();
}
function renderCurrentPage(){
  if(currentPage==='dashboard') renderDashboard();
  if(currentPage==='chefs')     renderChefs();
  if(currentPage==='kitchen')   renderKitchen();
  if(currentPage==='menu')      renderMenuPage();
  if(currentPage==='food')      renderFood();
  if(currentPage==='chat')      {renderChat();renderInbox();}
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════ */
function renderDashboard(){
  const today=new Date().toLocaleDateString('th-TH');
  const todayK=kitchenLogs.filter(k=>k.createdAt===today);
  document.getElementById('statMenuDone').textContent  = todayK.filter(k=>k.status==='done').length;
  document.getElementById('statKitchenDone').textContent=kitchenLogs.filter(k=>k.status==='done').length;
  document.getElementById('statCooking').textContent   = kitchenLogs.filter(k=>k.status==='cooking').length;
  const totalRatings=chefs?chefs.reduce((a,c)=>a+c.ratings.length,0):0;
  document.getElementById('statReviews').textContent   = totalRatings;
  document.getElementById('welcomeMsg').textContent    = '👋 สวัสดี '+currentUser+(isAdmin?' (Admin)':loggedChefId?' (เชฟ)':'')+' !';

  const mi={เช้า:'🌅',กลางวัน:'☀️',เย็น:'🌙',ของว่าง:'🍡'};
  const rk=document.getElementById('recentKitchen');
  const rKlogs=[...kitchenLogs].reverse().slice(0,5);
  rk.innerHTML=rKlogs.length?rKlogs.map(k=>`
    <div class="feed-item">
      <span class="feed-dot" style="background:${k.status==='done'?'#2ecc71':'#ff6b35'}"></span>
      ${k.foodImg?`<img src="${k.foodImg}" style="width:36px;height:36px;border-radius:6px;object-fit:cover" onerror="this.style.display='none'">`:
        '<span style="font-size:22px">'+(mi[k.meal]||'🍽️')+'</span>'}
      <span style="flex:1">${escH(k.menuName)}</span>
      <span class="badge b-chef">👨‍🍳 ${escH(k.chefName)}</span>
    </div>`).join('')
    :'<div class="empty-state"><div class="ei">🍳</div><p>ยังไม่มีงานครัว</p></div>';

  const rm=document.getElementById('recentMenus');
  rm.innerHTML=[...menus].reverse().slice(0,6).map(m=>
    `<span class="chip">${mi[m.meal]||'🍽️'} ${escH(m.name)}</span>`).join('')||
    '<span style="color:var(--t2)">ยังไม่มีเมนู</span>';
}

/* ═══════════════════════════════════════════════════════════
   CHEFS
   ═══════════════════════════════════════════════════════════ */
function renderChefs(){
  if(!chefs)return;
  document.getElementById('headChefArea').innerHTML=chefs.filter(c=>c.isHead).map(chefCard).join('');
  document.getElementById('subChefArea').innerHTML =chefs.filter(c=>!c.isHead).map(chefCard).join('');
}
function chefCard(c){
  const avg=avgR(c),stars=[1,2,3,4,5].map(i=>`<span class="star${i<=Math.round(avg)?' filled':''}">⭐</span>`).join('');
  const ph=c.photo?`<img src="${c.photo}" class="chef-avatar" alt="${escH(c.name)}">`:`<div class="chef-avatar-ph">👨‍🍳</div>`;
  return`<div class="chef-card${c.isHead?' head-card':''}" onclick="openChefModal('${c.id}')">
    ${ph}<div class="chef-name">${escH(c.name)}</div>
    <div class="chef-role">${escH(c.role)}</div>
    <div class="chef-stars">${stars}</div>
    <div class="chef-rating-txt">${avg>0?avg.toFixed(1)+' / 5 ('+c.ratings.length+' คน)':'ยังไม่มีคะแนน'}</div>
    <div class="chef-comments-count">💬 ${c.comments.length} ความคิดเห็น</div>
  </div>`;
}
function avgR(c){
  if(!c.ratings?.length)return 0;
  return c.ratings.reduce((a,b)=>a+b.score,0)/c.ratings.length;
}

function openChefModal(id){
  const c=chefs.find(x=>x.id===id); if(!c)return;
  const avg=avgR(c);
  const ph=c.photo?`<img src="${c.photo}" class="modal-av">`:`<div class="modal-av-ph">👨‍🍳</div>`;
  const stars=[1,2,3,4,5].map(i=>
    `<span class="modal-star${i<=Math.round(avg)?' filled':''}"
      onclick="setRating(${i},'${id}')" onmouseover="hoverR(${i})" onmouseout="resetR('${id}')">⭐</span>`).join('');
  const uploadBtn=isAdmin?`<label class="upload-label" for="upPhoto_${id}">📷 เปลี่ยนรูป</label>
    <input class="upload-input" type="file" id="upPhoto_${id}" accept="image/*" onchange="uploadChefPhoto(event,'${id}')">`:
    `<div style="font-size:12px;color:var(--t2);margin-top:8px">🔐 Admin เท่านั้นที่เปลี่ยนรูปได้</div>`;
  const cms=c.comments.length?[...c.comments].reverse().map(cm=>`
    <div class="comment-item">
      <div class="comment-author">👤 ${escH(cm.user)}</div>
      <div class="comment-text">${escH(cm.text)}</div>
      <div class="comment-time">${cm.time}</div>
    </div>`).join(''):`<p style="color:var(--t2);font-size:13px">ยังไม่มีความคิดเห็น</p>`;
  document.getElementById('modalContent').innerHTML=`
    <div class="modal-chef-head">
      ${ph}
      <div>
        <div style="font-size:22px;font-weight:700">${escH(c.name)}</div>
        <div style="color:var(--t2);font-size:14px">${escH(c.role)}</div>
        <div style="font-size:13px;color:var(--t2);margin-top:8px;line-height:1.5">${escH(c.bio)}</div>
        ${uploadBtn}
      </div>
    </div>
    <div style="font-size:15px;font-weight:600;margin-bottom:8px">⭐ ให้คะแนน</div>
    <div class="modal-stars" id="mStars">${stars}</div>
    <div class="modal-rate-label" id="mRateLbl">${avg>0?'เฉลี่ย '+avg.toFixed(1)+' / 5 ('+c.ratings.length+' คน)':'เป็นคนแรกที่ให้คะแนน!'}</div>
    <div style="font-size:15px;font-weight:600;margin:16px 0 10px">💬 ความคิดเห็น</div>
    <div class="comment-box">
      <input type="text" id="cmtInput" placeholder="เขียนความคิดเห็น..." maxlength="200"/>
      <button onclick="submitComment('${id}')">ส่ง</button>
    </div>
    <div class="comments-list" id="cmtList">${cms}</div>`;
  document.getElementById('chefModal').classList.remove('hidden');
  setTimeout(()=>{
    const inp=document.getElementById('cmtInput');
    if(inp) inp.addEventListener('keydown',e=>{if(e.key==='Enter')submitComment(id);});
  },50);
}
function closeChefModal(){document.getElementById('chefModal').classList.add('hidden');}
function hoverR(s){document.querySelectorAll('.modal-star').forEach((x,i)=>x.classList.toggle('filled',i<s))}
function resetR(id){const c=chefs.find(x=>x.id===id);const sh=pendingRating||Math.round(avgR(c));document.querySelectorAll('.modal-star').forEach((x,i)=>x.classList.toggle('filled',i<sh))}
function setRating(score,id){
  const c=chefs.find(x=>x.id===id);if(!c)return;
  pendingRating=score;
  const ex=c.ratings.findIndex(r=>r.user===currentUser);
  if(ex>=0)c.ratings[ex].score=score; else c.ratings.push({user:currentUser,score});
  S.set('chefs_v2',chefs);
  document.getElementById('mRateLbl').textContent='คุณให้ '+score+' ⭐ | เฉลี่ย '+avgR(c).toFixed(1)+' ('+c.ratings.length+' คน)';
  document.querySelectorAll('.modal-star').forEach((x,i)=>x.classList.toggle('filled',i<score));
  showToast('ให้คะแนน '+score+' ⭐ แล้ว');
  if(currentPage==='chefs')renderChefs();
}
function submitComment(id){
  const inp=document.getElementById('cmtInput');
  const txt=inp.value.trim();if(!txt)return;
  const c=chefs.find(x=>x.id===id);if(!c)return;
  c.comments.push({user:currentUser,text:txt,time:nowStr()});
  S.set('chefs_v2',chefs); inp.value='';
  document.getElementById('cmtList').innerHTML=[...c.comments].reverse().map(cm=>`
    <div class="comment-item">
      <div class="comment-author">👤 ${escH(cm.user)}</div>
      <div class="comment-text">${escH(cm.text)}</div>
      <div class="comment-time">${cm.time}</div>
    </div>`).join('');
  showToast('ความคิดเห็นถูกส่งแล้ว 💬');
  if(currentPage==='chefs')renderChefs();
}
function uploadChefPhoto(evt,id){
  if(!isAdmin){showToast('❌ เฉพาะ Admin เท่านั้น');return;}
  const f=evt.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{const c=chefs.find(x=>x.id===id);if(!c)return;c.photo=e.target.result;S.set('chefs_v2',chefs);showToast('อัปโหลดรูปแล้ว 📷');openChefModal(id);if(currentPage==='chefs')renderChefs();};
  r.readAsDataURL(f);
}

/* ═══════════════════════════════════════════════════════════
   KITCHEN — เชฟแจ้งงาน พร้อมรูปภาพอัตโนมัติ
   ═══════════════════════════════════════════════════════════ */
async function addKitchenLog(){
  if(!loggedChefId){showToast('Login ก่อนนะ');return;}
  const name=document.getElementById('kitchenMenuName').value.trim();
  if(!name){showToast('ใส่ชื่อเมนูด้วย');return;}
  const meal  =document.getElementById('kitchenMeal').value;
  const status=document.getElementById('kitchenStatus').value;
  const note  =document.getElementById('kitchenNote').value.trim();
  const qty   =parseInt(document.getElementById('kitchenQty').value)||1;
  const c=chefs&&chefs.find(x=>x.id===loggedChefId);
  showToast('🔍 กำลังหารูป...');
  const img=await fetchFoodImage(name);
  const newLog={id:'k'+Date.now(),chefId:loggedChefId,chefName:c?c.name:loggedChefId,
    menuName:name,meal,qty,status,note,foodImg:img||null,photo:null,
    createdAt:new Date().toLocaleDateString('th-TH')};
  // บันทึกลง Firebase
  await FB.push('kitchenLogs', newLog);
  kitchenLogs.push(newLog); // update local
  S.set('kitchenLogs',kitchenLogs);
  document.getElementById('kitchenMenuName').value='';
  document.getElementById('kitchenNote').value='';
  document.getElementById('kitchenQty').value='';
  renderKitchen(); renderDashboard();
  showToast('แจ้งงาน "'+name+'" แล้ว 🍳 (sync แล้ว)');
}
async function updateKStatus(id,st){
  const k=kitchenLogs.find(x=>x.id===id);if(!k)return;
  if(loggedChefId&&k.chefId!==loggedChefId&&!isAdmin){showToast('❌ แก้ได้แค่งานตัวเอง');return;}
  k.status=st;
  // หา Firebase key
  const all=await FB.get('kitchenLogs');
  if(all){
    const fbKey=Object.keys(all).find(k2=>all[k2].id===id);
    if(fbKey) await FB.set('kitchenLogs/'+fbKey+'/status', st);
  }
  S.set('kitchenLogs',kitchenLogs);renderKitchen();renderDashboard();showToast('อัปเดตแล้ว ✅');
}
async function deleteKLog(id){
  const k=kitchenLogs.find(x=>x.id===id);if(!k)return;
  if(!isAdmin&&(!loggedChefId||k.chefId!==loggedChefId)){showToast('❌ ไม่มีสิทธิ์ลบ');return;}
  if(!confirm('ลบงานนี้?'))return;
  // ลบจาก Firebase
  const all=await FB.get('kitchenLogs');
  if(all){
    const fbKey=Object.keys(all).find(k2=>all[k2].id===id);
    if(fbKey) await FB.delete('kitchenLogs/'+fbKey);
  }
  kitchenLogs=kitchenLogs.filter(x=>x.id!==id);
  S.set('kitchenLogs',kitchenLogs);renderKitchen();showToast('ลบแล้ว');
}
function filterKitchen(f,btn){
  currentKF=f;document.querySelectorAll('#kitchenPage .fbtn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderKitchen();
}
function renderKitchen(){
  const mi={เช้า:'🌅',กลางวัน:'☀️',เย็น:'🌙',ของว่าง:'🍡'};
  if(loggedChefId||isAdmin){
    document.getElementById('kitchenLoginPanel').classList.add('hidden');
    document.getElementById('kitchenAddPanel').classList.remove('hidden');
    const c=chefs&&chefs.find(x=>x.id===loggedChefId);
    document.getElementById('kitchenChefName').textContent=c?c.name:(isAdmin?'Admin':'');
  } else {
    document.getElementById('kitchenLoginPanel').classList.remove('hidden');
    document.getElementById('kitchenAddPanel').classList.add('hidden');
  }
  const today=new Date().toLocaleDateString('th-TH');
  let fl=[...kitchenLogs];
  if(currentKF==='cooking') fl=fl.filter(k=>k.status==='cooking');
  if(currentKF==='done')    fl=fl.filter(k=>k.status==='done');
  if(currentKF==='today')   fl=fl.filter(k=>k.createdAt===today);
  fl.reverse();
  const list=document.getElementById('kitchenList');
  if(!fl.length){list.innerHTML='<div class="empty-state"><div class="ei">🍳</div><p>ยังไม่มีงาน</p></div>';return;}
  list.innerHTML=fl.map(k=>{
    const canEdit=isAdmin||(loggedChefId&&k.chefId===loggedChefId);
    return`<div class="kcard${k.status==='done'?' done':''}">
      <div>
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:6px">
          ${k.foodImg?`<img src="${k.foodImg}" style="width:60px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">`:''}
          <div>
            <div class="kcard-title">${mi[k.meal]||'🍽️'} ${escH(k.menuName)}</div>
            ${k.note?`<div style="font-size:13px;color:var(--t2)">📝 ${escH(k.note)}</div>`:''}
          </div>
        </div>
        <div class="kcard-meta">
          <span class="badge b-chef">👨‍🍳 ${escH(k.chefName)}</span>
          <span class="badge b-meal">${k.meal}</span>
          <span class="badge b-qty">🍽️ ${k.qty} จาน</span>
          <span class="badge ${k.status==='done'?'b-done':'b-cook'}">${k.status==='done'?'✅ เสร็จ':'🔥 กำลังปรุง'}</span>
          <span class="badge b-date">📅 ${k.createdAt}</span>
        </div>
      </div>
      <div class="kcard-actions">
        ${canEdit&&k.status!=='done'?`<button class="act-btn act-done" onclick="updateKStatus('${k.id}','done')">✅ เสร็จ</button>`:''}
        ${canEdit&&k.status==='done' ?`<button class="act-btn act-undo" onclick="updateKStatus('${k.id}','cooking')">🔥 ยังปรุง</button>`:''}
        ${canEdit?`<button class="act-btn act-del" onclick="deleteKLog('${k.id}')">🗑️</button>`:''}
      </div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════
   MENU PAGE — ผู้ชม+เชฟเสนอได้, Admin จัดการเต็ม
   ═══════════════════════════════════════════════════════════ */
async function addMenu(){
  const name=document.getElementById('menuName').value.trim();
  if(!name){showToast('ใส่ชื่อเมนูด้วย');return;}
  const meal=document.getElementById('menuMeal').value;
  const desc=document.getElementById('menuDesc').value.trim();
  const isChef=!!loggedChefId;
  showToast('🔍 กำลังหารูป...');
  const img=await fetchFoodImage(name);
  menus.push({id:'m'+Date.now(),name,meal,desc,foodImg:img,
    proposedBy:currentUser,isChef,isAdmin:isAdmin,
    createdAt:new Date().toLocaleDateString('th-TH')});
  S.set('menus_v2',menus);
  // sync Firebase
  FB.push('menus_v2', menus[menus.length-1]);
  document.getElementById('menuName').value='';
  document.getElementById('menuDesc').value='';
  renderMenuPage();
  showToast((isChef?'🍳 เชฟ':'💡')+' เสนอเมนู "'+name+'" แล้ว (sync แล้ว)');
}
async function addAdminMenu(){
  if(!isAdmin){showToast('❌ เฉพาะ Admin');return;}
  const name=document.getElementById('adminMenuName').value.trim();
  if(!name){showToast('ใส่ชื่อเมนูด้วย');return;}
  const meal =document.getElementById('adminMenuMeal').value;
  const price=document.getElementById('adminMenuPrice').value;
  const desc =document.getElementById('adminMenuDesc').value.trim();
  showToast('🔍 กำลังหารูป...');
  const img=await fetchFoodImage(name);
  menus.push({id:'m'+Date.now(),name,meal,price:price?parseInt(price):null,desc,foodImg:img,
    proposedBy:'Admin',isAdminMenu:true,
    createdAt:new Date().toLocaleDateString('th-TH')});
  S.set('menus_v2',menus);
  document.getElementById('adminMenuName').value='';
  document.getElementById('adminMenuPrice').value='';
  document.getElementById('adminMenuDesc').value='';
  renderMenuPage(); showToast('✅ เพิ่มเมนูของร้านแล้ว');
}
function deleteMenu(id){
  if(!isAdmin){showToast('❌ Admin เท่านั้น');return;}
  if(!confirm('ลบเมนูนี้?'))return;
  menus=menus.filter(m=>m.id!==id);S.set('menus_v2',menus);renderMenuPage();showToast('ลบแล้ว');
}
function showMeal(m,btn){
  currentMeal=m;document.querySelectorAll('.mtab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderMenuPage();
}
function renderMenuPage(){
  if(isAdmin) document.getElementById('adminMenuPanel')?.classList.remove('hidden');
  const mi={เช้า:'🌅',กลางวัน:'☀️',เย็น:'🌙',ของว่าง:'🍡'};
  const filtered=currentMeal==='ทั้งหมด'?menus:menus.filter(m=>m.meal===currentMeal);
  const official=filtered.filter(m=>m.isAdminMenu).reverse();
  const suggest =filtered.filter(m=>!m.isAdminMenu).reverse();
  const mkCard=(m)=>`
    <div class="menu-card${!m.isAdminMenu?' suggest-item':''}">
      ${m.foodImg?`<img src="${m.foodImg}" style="width:100%;height:150px;object-fit:cover;border-radius:8px;margin-bottom:10px" onerror="this.style.display='none'">`:
        `<div style="height:80px;display:flex;align-items:center;justify-content:center;font-size:48px">${mi[m.meal]||'🍽️'}</div>`}
      <div class="mc-head">
        <div class="mc-name">${escH(m.name)}</div>
        <span class="${m.isAdminMenu?'mc-meal':'mc-suggest-tag'}">${m.isAdminMenu?(mi[m.meal]+' '+m.meal):'💡 แนะนำ'}</span>
      </div>
      ${m.price?`<div class="mc-price">${m.price} ฿</div>`:''}
      ${m.desc?`<div class="mc-desc">${escH(m.desc)}</div>`:''}
      <div class="mc-author">📅 ${m.createdAt} · ${escH(m.proposedBy)}${m.isChef?' 🍳':''}</div>
      ${isAdmin?`<button class="mc-del" onclick="deleteMenu('${m.id}')">🗑️ ลบ</button>`:''}
    </div>`;
  document.getElementById('menuList').innerHTML=official.length?official.map(mkCard).join(''):'<div class="empty-state"><div class="ei">🍽️</div><p>ยังไม่มีเมนูของร้าน</p></div>';
  document.getElementById('suggestList').innerHTML=suggest.length?suggest.map(mkCard).join(''):'<div class="empty-state"><div class="ei">💡</div><p>ยังไม่มีเมนูที่แนะนำ — เสนอได้เลย!</p></div>';
}

/* ═══════════════════════════════════════════════════════════
   FOOD PAGE — หน้าอาหารรูปจริง (Admin+ผู้ชมเสนอได้)
   ═══════════════════════════════════════════════════════════ */
async function addFoodItem(){
  const name=document.getElementById('foodName').value.trim();
  if(!name){showToast('ใส่ชื่ออาหารด้วย');return;}
  const cat =document.getElementById('foodCat').value;
  const desc=document.getElementById('foodDesc').value.trim();
  showToast('🔍 กำลังหารูป...');
  const img=await fetchFoodImage(name);
  foodItems.push({id:'f'+Date.now(),name,category:cat,desc,foodImg:img,photo:null,
    addedBy:currentUser,isAdmin,
    createdAt:new Date().toLocaleDateString('th-TH')});
  S.set('foodItems',foodItems);
  document.getElementById('foodName').value='';
  document.getElementById('foodDesc').value='';
  const prev=document.getElementById('foodImgPreview');
  if(prev){prev.innerHTML='';prev.dataset.imgUrl='';}
  renderFood(); showToast('เพิ่มอาหาร "'+name+'" แล้ว 🍽️');
}
function uploadFoodPhoto(evt,id){
  if(!isAdmin){showToast('❌ Admin เท่านั้น');return;}
  const f=evt.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{const item=foodItems.find(x=>x.id===id);if(!item)return;item.photo=e.target.result;S.set('foodItems',foodItems);renderFood();showToast('อัปโหลดรูปแล้ว 📷');};
  r.readAsDataURL(f);
}
function deleteFoodItem(id){
  if(!isAdmin){showToast('❌ Admin เท่านั้น');return;}
  if(!confirm('ลบอาหารนี้?'))return;
  foodItems=foodItems.filter(x=>x.id!==id);S.set('foodItems',foodItems);renderFood();showToast('ลบแล้ว');
}
function filterFood(cat,btn){
  currentFoodCat=cat;document.querySelectorAll('#foodPage .ftab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderFood();
}
function renderFood(){
  const filtered=currentFoodCat==='ทั้งหมด'?foodItems:foodItems.filter(f=>f.category===currentFoodCat);
  const list=document.getElementById('foodGrid');
  if(!list)return;
  if(!filtered.length){list.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div class="ei">🍽️</div><p>ยังไม่มีรายการอาหาร — เพิ่มได้เลย!</p></div>';return;}
  list.innerHTML=[...filtered].reverse().map(f=>{
    const imgSrc=f.photo||f.foodImg;
    return`<div class="food-card">
      ${imgSrc
        ?`<img src="${imgSrc}" class="food-img" onerror="this.src='';this.style.background='var(--bg3)'" alt="${escH(f.name)}">`
        :`<div class="food-img-ph">🍽️</div>`}
      <div class="food-body">
        <div class="food-name">${escH(f.name)}</div>
        <div class="food-cat">${escH(f.category)}</div>
        ${f.desc?`<div class="food-desc">${escH(f.desc)}</div>`:''}
        <div class="food-author">👤 ${escH(f.addedBy)} · ${f.createdAt}${f.isAdmin?' 🔐':''}</div>
        ${isAdmin?`
          <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
            <label class="upload-label" style="font-size:11px;padding:4px 10px" for="upFood_${f.id}">📷 เปลี่ยนรูป</label>
            <input class="upload-input" type="file" id="upFood_${f.id}" accept="image/*" onchange="uploadFoodPhoto(event,'${f.id}')">
            <button class="mc-del" onclick="deleteFoodItem('${f.id}')">🗑️</button>
          </div>`:''}
      </div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════
   CHAT + OWNER MESSAGES
   ═══════════════════════════════════════════════════════════ */
function sendChat(){
  const inp=document.getElementById('chatInput');
  const msg=inp.value.trim();if(!msg)return;
  inp.value='';
  chatHist.push({role:'user',name:currentUser,text:msg,time:nowStr()});
  S.set('chatHist',chatHist); renderChat();
  setTimeout(()=>{
    const reply=aiReply(msg);
    chatHist.push({role:'ai',name:'🤖 AI แอดมิน',text:reply,time:nowStr()});
    S.set('chatHist',chatHist); renderChat();
  },700);
}
function renderChat(){
  const win=document.getElementById('chatWindow');if(!win)return;
  if(!chatHist.length){
    win.innerHTML=`<div class="chat-ai-row">
      <div class="chat-bot-avatar">👨‍🍳</div>
      <div class="chat-msg chat-ai">
        <div class="chat-name">${BOT_NAME}</div>
        <div class="chat-bubble">สวัสดีครับ! ผมเชฟว่าจ่าเฉย ถามเรื่องร้านได้เลยนะครับ จะตอบให้เต็มที่ แต่ถ้าถามแปลกๆ ระวังโดนต่อยปากนะ 555 🔥</div>
      </div>
    </div>`;
    return;
  }
  win.innerHTML=chatHist.map(m=>{
    if(m.role==='ai') return `
      <div class="chat-ai-row">
        <div class="chat-bot-avatar">👨‍🍳</div>
        <div class="chat-msg chat-ai">
          <div class="chat-name">${BOT_NAME}</div>
          <div class="chat-bubble">${escH(m.text)}</div>
          <div class="chat-time">${m.time}</div>
        </div>
      </div>`;
    return `<div class="chat-msg chat-user">
      <div class="chat-name">👤 ${escH(m.name)}</div>
      <div class="chat-bubble">${escH(m.text)}</div>
      <div class="chat-time">${m.time}</div>
    </div>`;
  }).join('');
  win.scrollTop=win.scrollHeight;
}
function sendOwnerMessage(){
  const inp=document.getElementById('ownerMsgInput');
  const msg=inp.value.trim();if(!msg){showToast('พิมพ์ข้อความก่อน');return;}
  inp.value='';
  const newMsg={id:'om'+Date.now(),from:currentUser,text:msg,time:nowStr(),replied:false,reply:''};
  ownerMsgs.push(newMsg);
  S.set('ownerMsgs',ownerMsgs);
  // บันทึกลง Firebase
  FB.push('ownerMsgs', newMsg);
  renderInbox(); showToast('📨 ส่งข้อความแล้ว');
  setTimeout(()=>{
    const last=ownerMsgs[ownerMsgs.length-1];
    last.replied=true; last.reply=ownerAiReply(msg);
    S.set('ownerMsgs',ownerMsgs);
    FB.push('ownerMsgs', last);
    renderInbox(); showToast('🤖 AI ตอบแล้ว');
  },1200);
}
function renderInbox(){
  const box=document.getElementById('ownerInbox');if(!box)return;
  if(!ownerMsgs.length){box.innerHTML='<div class="empty-state"><div class="ei">📭</div><p>ยังไม่มีข้อความ</p></div>';return;}
  box.innerHTML=[...ownerMsgs].reverse().map(m=>`
    <div class="inbox-item">
      <div class="inbox-from">👤 ${escH(m.from)} <span class="inbox-time">${m.time}</span></div>
      <div class="inbox-text">${escH(m.text)}</div>
      ${m.replied?`<div class="inbox-reply">🤖 AI: ${escH(m.reply)}</div>`:`<div class="inbox-pending">⏳ รอตอบ...</div>`}
    </div>`).join('');
}

/* ═══════════════════════════════════════════════════════════
   UTILS + INIT
   ═══════════════════════════════════════════════════════════ */
function escH(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function nowStr(){return new Date().toLocaleString('th-TH',{dateStyle:'short',timeStyle:'short'})}
let _tt;
function showToast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove('show'),3000);
}

// โหลดข้อมูล real-time จาก Firebase
async function syncFromFirebase(){
  try{
    // kitchenLogs
    const kData = await FB.get('kitchenLogs');
    if(kData){
      kitchenLogs = Object.values(kData).filter(Boolean);
      S.set('kitchenLogs', kitchenLogs);
    }
    // menus
    const mData = await FB.get('menus_v2');
    if(mData){
      menus = Object.values(mData).filter(Boolean);
      S.set('menus_v2', menus);
    }
    // ownerMsgs
    const oData = await FB.get('ownerMsgs');
    if(oData){
      ownerMsgs = Object.values(oData).filter(Boolean);
      S.set('ownerMsgs', ownerMsgs);
    }
    // chefs ratings & comments
    const cData = await FB.get('chefs_v2');
    if(cData && chefs){
      const fbChefs = Object.values(cData).filter(Boolean);
      fbChefs.forEach(fc=>{
        const local = chefs.find(c=>c.id===fc.id);
        if(local){
          local.ratings  = fc.ratings  || local.ratings;
          local.comments = fc.comments || local.comments;
        }
      });
      S.set('chefs_v2', chefs);
    }
    renderCurrentPage();
  } catch(e){}
}

window.addEventListener('DOMContentLoaded',()=>{
  if(!chefs) setupDemoData();
  const su=S.get('lastUser','');
  if(su) document.getElementById('nameInput').value=su;
  if(S.get('isAdmin',false)){isAdmin=true;}

  document.getElementById('nameInput').addEventListener('keydown',e=>{if(e.key==='Enter')enterSite()});
  document.getElementById('adminPinInput').addEventListener('keydown',e=>{if(e.key==='Enter')adminLogin()});
  document.getElementById('chefPinInput').addEventListener('keydown',e=>{if(e.key==='Enter')chefPinLogin()});

  document.getElementById('chefModal').addEventListener('click',function(e){if(e.target===this)closeChefModal()});
  document.getElementById('chefPinOverlay').addEventListener('click',function(e){if(e.target===this)closeChefPin()});
  document.getElementById('adminOverlay').addEventListener('click',function(e){if(e.target===this)closeAdminLogin()});

  // Sync จาก Firebase ทุก 5 วิ (ทุกคนเห็นข้อมูลเหมือนกัน)
  syncFromFirebase();
  setInterval(syncFromFirebase, 5000);
});
