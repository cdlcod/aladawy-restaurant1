
let cart = JSON.parse(localStorage.getItem("aladawyCart") || "[]");
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const money = n => `${Number(n).toLocaleString("ar-EG")} جنيه`;

function saveCart(){
  localStorage.setItem("aladawyCart", JSON.stringify(cart));
}

function toast(message){
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(()=>el.classList.remove("show"),2200);
}

function renderMenu(){
  const grid = $("#menuGrid");
  const search = $("#search").value.trim().toLowerCase();
  const active = document.querySelector(".filter.active")?.dataset.cat || "الكل";
  const list = MENU.filter(item => {
    const matchesCat = active === "الكل" || item.cat === active;
    const text = `${item.name} ${item.desc} ${item.cat}`.toLowerCase();
    return matchesCat && text.includes(search);
  });

  grid.innerHTML = list.map(item => `
    <article class="card">
      <div class="card-media">
        <img src="${item.img}" alt="${item.name}" loading="lazy">
        <span class="badge">${item.cat}</span>
      </div>
      <div class="card-body">
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
        <div class="card-bottom">
          <div class="price">${money(item.price)} <small>/ الوجبة</small></div>
          <button class="add" onclick="addToCart('${item.id}')">+</button>
        </div>
      </div>
    </article>
  `).join("");

  $("#empty").style.display = list.length ? "none" : "block";
}

function addToCart(id){
  const item = MENU.find(x => x.id === id);
  if(!item) return;
  const existing = cart.find(x => x.id === id);
  if(existing) existing.qty++;
  else cart.push({id:item.id, qty:1});
  saveCart();
  renderCart();
  openCart();
  toast(`تمت إضافة ${item.name} 🔥`);
}

function changeQty(id, delta){
  const row = cart.find(x => x.id === id);
  if(!row) return;
  row.qty += delta;
  if(row.qty <= 0) cart = cart.filter(x => x.id !== id);
  saveCart();
  renderCart();
}

function removeItem(id){
  cart = cart.filter(x => x.id !== id);
  saveCart();
  renderCart();
}

function renderCart(){
  const box = $("#cartItems");
  const empty = $("#cartEmpty");
  const count = cart.reduce((sum,x)=>sum+x.qty,0);
  const total = cart.reduce((sum,x)=>{
    const item = MENU.find(m=>m.id===x.id);
    return sum + (item ? item.price*x.qty : 0);
  },0);

  $("#cartCount").textContent = count;
  $("#floatingCount").textContent = count;
  $("#total").textContent = money(total);

  if(!cart.length){
    box.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  box.innerHTML = cart.map(row=>{
    const item = MENU.find(m=>m.id===row.id);
    return `
      <div class="cart-item">
        <div>
          <h4>${item.name}</h4>
          <small>${money(item.price)} × ${row.qty}</small>
        </div>
        <div>
          <div class="qty">
            <button onclick="changeQty('${item.id}',1)">+</button>
            <b>${row.qty}</b>
            <button onclick="changeQty('${item.id}',-1)">−</button>
          </div>
          <button class="remove" onclick="removeItem('${item.id}')">حذف</button>
        </div>
      </div>
    `;
  }).join("");
}

function openCart(){
  $("#cartDrawer").classList.add("open");
  $("#overlay").classList.add("show");
}
function closeCart(){
  $("#cartDrawer").classList.remove("open");
  $("#overlay").classList.remove("show");
}

function sendWhatsApp(){
  if(!cart.length){
    toast("السلة فاضية — اختار وجبة الأول 😄");
    return;
  }

  // غيّر الرقم ده لرقم المطعم بصيغة دولية بدون +
  const phone = "201200085525";
  

  let total = 0;
  let msg = "🔥 *طلب جديد من قصر العدوي للمشويات*%0A%0A";

  cart.forEach(row=>{
    const item = MENU.find(m=>m.id===row.id);
    const sub = item.price * row.qty;
    total += sub;
    msg += `🍽️ ${item.name}%0Aالكمية: ${row.qty}%0Aالسعر: ${sub} جنيه%0A%0A`;
  });

  msg += `💰 *الإجمالي: ${total} جنيه*`;
  window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
}

$$(".filter").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    $$(".filter").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    renderMenu();
  });
});

$("#search").addEventListener("input", renderMenu);
$("#openCart").addEventListener("click", openCart);
$("#floatingCart").addEventListener("click", openCart);
$("#heroCart").addEventListener("click", openCart);
$("#contactOrder").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);
$("#checkout").addEventListener("click", sendWhatsApp);
$("#clearCart").addEventListener("click", ()=>{
  cart = [];
  saveCart();
  renderCart();
  toast("اتمسحت السلة");
});

document.addEventListener("keydown", e=>{
  if(e.key === "Escape") closeCart();
});

renderMenu();
renderCart();
