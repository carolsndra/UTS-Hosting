const API = window.location.origin;
const grid = document.getElementById("grid");
const search = document.getElementById("searchInput");
const chipsContainer = document.getElementById("categoryChips");
const SELECTED_CATEGORIES = new Set();

let PRODUCTS = [];

const fmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function resolveImg(p) {
  const fallback =
    "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4e6.svg";
  return p?.foto || fallback;
}

function card(p) {
  const imgSrc = resolveImg(p);
  return `
    <article class="product-card bg-white rounded-lg shadow border relative overflow-visible">
      <div class="bg-gray-50 h-48 grid place-items-center">
        <img src="${imgSrc}"
          alt="${p.namaItem ?? "-"}"
          class="h-40 w-40 object-contain"
          onerror="this.onerror=null;this.src='https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4e6.svg';"/>
      </div>

      <div class="p-4 relative">
        <span class="absolute -top-3 right-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
          ${p.stok ?? 0} in stock
        </span>

        <h3 class="text-lg font-semibold mt-2">${p.namaItem ?? "-"}</h3>
        <p class="text-sm text-gray-500">${p.keterangan ?? "-"}</p>

        <div class="mt-2">
          <p class="text-xs text-pink-600 font-medium mb-1">
            ${p.namaKategori || "Kategori"}
          </p>
          <p class="text-2xl font-bold text-blue-700">
            ${fmt.format(p.hargaSatuan || 0)}
          </p>
        </div>

        <div class="pt-4 flex gap-3">
          <button onclick="editProduct('${p.id}')"
            class="flex-1 border rounded-lg px-3 py-2 hover:bg-gray-50">
            Edit
          </button>
          <button onclick="deleteProduct('${p.id}')"
            class="flex-1 bg-red-600 text-white rounded-lg px-3 py-2 hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </article>
  `;
}

function render(list) {
  grid.innerHTML = list.map(card).join("");
}

function applySearch() {
  const q = (search?.value || "").toLowerCase().trim();

  const filtered = q
    ? PRODUCTS.filter((p) =>
        [p.namaItem, p.keterangan]
          .filter(Boolean)
          .some((s) => s.toLowerCase().includes(q))
      )
    : PRODUCTS;

  const filteredByCat =
    SELECTED_CATEGORIES.size > 0
      ? filtered.filter((p) =>
          SELECTED_CATEGORIES.has(String(p.catid || ""))
        )
      : filtered;

  render(filteredByCat);
}

async function reloadProducts() {
  try {
    const res = await fetch(`${API}/items`);
    if (!res.ok) throw new Error("Gagal ambil produk");
    const data = await res.json();
    PRODUCTS = data.items || [];
    applySearch();
  } catch (err) {
    console.error(err);
    grid.innerHTML =
      `<div class="col-span-full text-center text-red-500">
        Gagal memuat produk
      </div>`;
  }
}

function editProduct(id) {
  if (!confirm("Yakin ingin mengedit produk ini?")) return;
  window.location.href = `edit.html?id=${encodeURIComponent(id)}`;
}

async function deleteProduct(id) {
  if (!confirm("Yakin mau hapus produk ini?")) return;
  try {
    const res = await fetch(`${API}/items/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Gagal hapus produk");
    await reloadProducts();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  reloadProducts();

  search?.addEventListener("input", applySearch);

  chipsContainer?.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    const val = btn.dataset.value;
    btn.classList.toggle("selected");
    SELECTED_CATEGORIES.has(val)
      ? SELECTED_CATEGORIES.delete(val)
      : SELECTED_CATEGORIES.add(val);
    applySearch();
  });
});

(function () {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const sidebarUsername = document.getElementById("sidebarUsername");
  if (sidebarUsername && user.username) {
    sidebarUsername.textContent = user.username;
  }
})();

(function () {
  const currentPage = location.pathname.split("/").pop();
  document.querySelectorAll("aside nav a").forEach((link) => {
    link.classList.toggle(
      "bg-pink-400",
      link.getAttribute("href") === currentPage
    );
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobileOverlay");

  if (!btn || !sidebar || !overlay) return;

  const open = () => {
    sidebar.classList.add("mobile-open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    sidebar.classList.remove("mobile-open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    sidebar.classList.contains("mobile-open") ? close() : open();
  });

  overlay.addEventListener("click", close);
});

document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("user");
  window.location.href = "../src/login.html";
});
