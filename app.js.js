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
  const demoKitchen