
let cart = JSON.parse(localStorage.getItem("aladawyCart") || "[]");

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const money = n => `${Number(n).toLocaleString("ar-EG")} جنيه`;

function saveCart() {
  localStorage.setItem("aladawyCart", JSON.stringify(cart));
}

function toast(message) {
  const el = $("#toast");

  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 2200);
}

// عرض أصناف المنيو
function renderMenu() {
  const grid = $("#menuGrid");
  const searchInput = $("#search");

  if (!grid || !searchInput) return;

  const search = searchInput.value.trim().toLowerCase();

  const active =
    document.querySelector(".filter.active")?.dataset.cat || "الكل";

  const list = MENU.filter(item => {
    const matchesCat = active === "الكل" || item.cat === active;

    const text =
      `${item.name} ${item.desc || ""} ${item.cat}`.toLowerCase();

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
        <p>${item.desc || ""}</p>

        <div class="card-bottom">
          <div class="price">
            ${money(item.price)} <small>/ الوجبة</small>
          </div>

          <button class="add" onclick="addToCart('${item.id}')">
            +
          </button>
        </div>
      </div>
    </article>
  `).join("");

  const empty = $("#empty");

  if (empty) {
    empty.style.display = list.length ? "none" : "block";
  }
}

// إضافة صنف للسلة
function addToCart(id) {
  const item = MENU.find(x => String(x.id) === String(id));

  if (!item) {
    toast("الصنف غير موجود");
    return;
  }

  const existing = cart.find(x => String(x.id) === String(id));

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: item.id,
      qty: 1
    });
  }

  saveCart();
  renderCart();
  openCart();

  toast(`تمت إضافة ${item.name} 🔥`);
}

// زيادة أو تقليل الكمية
function changeQty(id, delta) {
  const row = cart.find(x => String(x.id) === String(id));

  if (!row) return;

  row.qty += delta;

  if (row.qty <= 0) {
    cart = cart.filter(x => String(x.id) !== String(id));
  }

  saveCart();
  renderCart();
}

// حذف صنف
function removeItem(id) {
  cart = cart.filter(x => String(x.id) !== String(id));

  saveCart();
  renderCart();

  toast("تم حذف الصنف");
}

// عرض محتويات السلة
function renderCart() {
  const box = $("#cartItems");
  const empty = $("#cartEmpty");

  if (!box || !empty) return;

  // تجاهل أي صنف لم يعد موجودًا في المنيو
  cart = cart.filter(row =>
    MENU.some(item => String(item.id) === String(row.id))
  );

  const count = cart.reduce((sum, row) => sum + row.qty, 0);

  const total = cart.reduce((sum, row) => {
    const item = MENU.find(x => String(x.id) === String(row.id));

    return sum + (item ? item.price * row.qty : 0);
  }, 0);

  if ($("#cartCount")) {
    $("#cartCount").textContent = count;
  }

  if ($("#floatingCount")) {
    $("#floatingCount").textContent = count;
  }

  if ($("#total")) {
    $("#total").textContent = money(total);
  }

  if (!cart.length) {
    box.innerHTML = "";
    empty.style.display = "block";
    saveCart();
    return;
  }

  empty.style.display = "none";

  box.innerHTML = cart.map(row => {
    const item = MENU.find(x => String(x.id) === String(row.id));

    if (!item) return "";

    return `
      <div class="cart-item">
        <div>
          <h4>${item.name}</h4>
          <small>${money(item.price)} × ${row.qty}</small>
        </div>

        <div>
          <div class="qty">
            <button onclick="changeQty('${item.id}', 1)">+</button>

            <b>${row.qty}</b>

            <button onclick="changeQty('${item.id}', -1)">−</button>
          </div>

          <button class="remove"
            onclick="removeItem('${item.id}')">
            حذف
          </button>
        </div>
      </div>
    `;
  }).join("");

  saveCart();
}

// فتح السلة
function openCart() {
  $("#cartDrawer")?.classList.add("open");
  $("#overlay")?.classList.add("show");
}

// إغلاق السلة
function closeCart() {
  $("#cartDrawer")?.classList.remove("open");
  $("#overlay")?.classList.remove("show");
}

// إرسال الطلب على واتساب
function sendWhatsApp() {
  if (!cart.length) {
    toast("السلة فاضية — اختار وجبة الأول 😄");
    return;
  }

  // قراءة بيانات العميل
  const name = $("#customerName")?.value.trim() || "";
  const address = $("#customerAddress")?.value.trim() || "";
  const customerPhone = $("#customerPhone")?.value.trim() || "";

  // التأكد من إدخال البيانات
  if (!name) {
    toast("من فضلك اكتب اسم العميل");
    $("#customerName")?.focus();
    return;
  }

  if (!address) {
    toast("من فضلك اكتب عنوان التوصيل");
    $("#customerAddress")?.focus();
    return;
  }

  if (!customerPhone) {
    toast("من فضلك اكتب رقم موبايلك");
    $("#customerPhone")?.focus();
    return;
  }

  // التحقق من رقم الموبايل المصري
  const normalizedPhone = customerPhone.replace(/[\s()-]/g, "");

  if (!/^(\+?20|0)?1[0125]\d{8}$/.test(normalizedPhone)) {
    toast("اكتب رقم موبايل مصري صحيح");
    $("#customerPhone")?.focus();
    return;
  }

  // رقم واتساب المطعم بصيغة دولية بدون علامة +
  const restaurantPhone = "201200085525";

  let total = 0;

  // بيانات العميل في رسالة واتساب
  let msg =
    "🔥 طلب جديد من قصر العدوي للمشويات\n\n" +
    "👤 اسم العميل: " + name + "\n" +
    "📍 عنوان التوصيل: " + address + "\n" +
    "📞 رقم موبايل العميل: " + customerPhone + "\n\n" +
    "🍽️ تفاصيل الطلب:\n";

  // تفاصيل الأصناف والكميات
  cart.forEach(row => {
    const item = MENU.find(x => String(x.id) === String(row.id));

    if (!item) return;

    const subtotal = item.price * row.qty;

    total += subtotal;

    msg +=
      "\n🍴 " + item.name +
      "\nالكمية: " + row.qty +
      "\nالسعر: " + subtotal + " جنيه\n";
  });

  msg +=
    "\n💰 الإجمالي: " + total + " جنيه\n\n" +
    "شكرًا لطلبك من قصر العدوي للمشويات ❤️";

  const url =
    "https://wa.me/" +
    restaurantPhone +
    "?text=" +
    encodeURIComponent(msg);

  // فتح واتساب برسالة الطلب
  const whatsappWindow = window.open(url, "_blank");

  if (!whatsappWindow) {
    // بديل إذا منع المتصفح فتح نافذة جديدة
    window.location.href = url;
  }
}

// تشغيل فلاتر المنيو
$$(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".filter").forEach(x => x.classList.remove("active"));

    btn.classList.add("active");

    renderMenu();
  });
});

// البحث
$("#search")?.addEventListener("input", renderMenu);

// أزرار فتح السلة
$("#openCart")?.addEventListener("click", openCart);
$("#floatingCart")?.addEventListener("click", openCart);
$("#heroCart")?.addEventListener("click", openCart);
$("#contactOrder")?.addEventListener("click", openCart);

// أزرار إغلاق السلة
$("#closeCart")?.addEventListener("click", closeCart);
$("#overlay")?.addEventListener("click", closeCart);

// إرسال الطلب
$("#checkout")?.addEventListener("click", sendWhatsApp);

// مسح السلة
$("#clearCart")?.addEventListener("click", () => {
  cart = [];

  saveCart();
  renderCart();

  toast("اتمسحت السلة");
});

// إغلاق السلة بزر Escape
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeCart();
  }
});

// تشغيل الموقع
renderMenu();
renderCart();
