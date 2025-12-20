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

  if (!p?.foto || !p.foto.startsWith("http")) {
    return fallback;
  }
  return p.foto;
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
  if (!grid) return;
  grid.innerHTML = list.length > 0 
    ? list.map(card).join("") 
    : '<div class="col-span-full text-center text-gray-500 py-12">Tidak ada produk ditemukan</div>';
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
  if (!grid) return;
  
  try {
    grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-12">Loading...</div>';
    
    const res = await fetch(`${API}/items`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server tidak mengembalikan JSON");
    }
    
    const data = await res.json();
    PRODUCTS = data.items || [];
    applySearch();
  } catch (err) {
    if (grid) {
      grid.innerHTML = `
        <div class="col-span-full text-center text-red-500 py-12">
          <p class="font-bold mb-2">Gagal memuat produk</p>
          <p class="text-sm">${err.message}</p>
          <button onclick="reloadProducts()" class="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">
            Coba Lagi
          </button>
        </div>
      `;
    }
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
    
    const contentType = res.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal hapus produk");
      }
    } else {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    }
    
    await reloadProducts();
    alert("Produk berhasil dihapus!");
  } catch (err) {
    alert("Gagal menghapus produk: " + err.message);
  }
}

function renderSidebarProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const sidebarUsername = document.getElementById("sidebarUsername");
  const profileBtn = document.getElementById("profileBtn");

  if (sidebarUsername && user.username) {
    sidebarUsername.textContent = user.username;
  }

  if (profileBtn) {
    if (user.avatar) {
      profileBtn.innerHTML = `<img src="${user.avatar}" class="w-full h-full object-cover rounded-full"/>`;
    } else {
      profileBtn.innerHTML = "👤";
    }
  }
}

function highlightActivePage() {
  const currentPage = location.pathname.split("/").pop();
  document.querySelectorAll("aside nav a").forEach((link) => {
    link.classList.toggle(
      "bg-pink-400",
      link.getAttribute("href") === currentPage
    );
  });
}

// === MAIN INITIALIZATION ===
document.addEventListener("DOMContentLoaded", () => {
  // Load products
  reloadProducts();

  // Render profile sidebar
  renderSidebarProfile();

  // Highlight active page
  highlightActivePage();

  // Search functionality
  if (search) {
    search.addEventListener("input", applySearch);
  }

  // Category chips filter
  if (chipsContainer) {
    chipsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      const val = btn.dataset.value;
      btn.classList.toggle("selected");
      SELECTED_CATEGORIES.has(val)
        ? SELECTED_CATEGORIES.delete(val)
        : SELECTED_CATEGORIES.add(val);
      applySearch();
    });
  }

  // Mobile menu
  const btn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobileOverlay");

  if (btn && sidebar && overlay) {
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
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user");
      window.location.href = "../src/login.html";
    });
  }

  // === PROFILE MODAL ===
  const profileBtn = document.getElementById("profileBtn");
  const profileModal = document.getElementById("profileModal");
  const profileClose = document.getElementById("profileClose");
  const profileCancel = document.getElementById("profileCancel");
  const profileSave = document.getElementById("profileSave");
  const profileLogout = document.getElementById("profileLogout");

  const profileId = document.getElementById("profileId");
  const usernameInput = document.getElementById("profileUsernameInput");
  const emailInput = document.getElementById("profileEmailInput");
  const passwordInput = document.getElementById("profilePasswordInput");
  const avatarImg = document.getElementById("profileAvatar");
  const avatarPlaceholder = document.getElementById("profileAvatarPlaceholder");
  const avatarContainer = document.getElementById("profileAvatarContainer");
  const fotoInput = document.getElementById("profileFotoInput");

  if (profileBtn && profileModal) {
    // Trigger file input when clicking avatar container
    if (avatarContainer) {
      avatarContainer.addEventListener("click", (e) => {
        // Prevent triggering when clicking the overlay icon
        if (e.target.tagName === 'svg' || e.target.tagName === 'path') return;
        fotoInput?.click();
      });
    }

    // Open profile modal
    profileBtn.addEventListener("click", () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (profileId) profileId.textContent = user.id || "-";
      if (usernameInput) usernameInput.value = user.username || "";
      if (emailInput) emailInput.value = user.email || "";
      if (passwordInput) passwordInput.value = "";

      if (user.avatar && avatarImg && avatarPlaceholder) {
        avatarImg.src = user.avatar;
        avatarImg.classList.remove("hidden");
        avatarPlaceholder.classList.add("hidden");
      } else if (avatarImg && avatarPlaceholder) {
        avatarImg.classList.add("hidden");
        avatarPlaceholder.classList.remove("hidden");
      }

      profileModal.classList.remove("hidden");
      profileModal.classList.add("flex");
      document.body.style.overflow = "hidden";
    });

    // Close profile modal
    const closeProfile = () => {
      profileModal.classList.add("hidden");
      profileModal.classList.remove("flex");
      document.body.style.overflow = "";
    };

    if (profileClose) {
      profileClose.addEventListener("click", closeProfile);
    }
    
    if (profileCancel) {
      profileCancel.addEventListener("click", closeProfile);
    }
    
    profileModal.addEventListener("click", (e) => {
      if (e.target === profileModal) closeProfile();
    });

    // Logout from profile modal
    if (profileLogout) {
      profileLogout.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("user");
        window.location.href = "../src/login.html";
      });
    }

    // Save profile
    if (profileSave) {
      profileSave.addEventListener("click", async (e) => {
        e.preventDefault();
        
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        const fd = new FormData();
        fd.append("id", user.id);
        fd.append("username", usernameInput.value.trim());
        fd.append("email", emailInput.value.trim());

        if (passwordInput.value.trim()) {
          fd.append("password", passwordInput.value);
        }

        // Include avatar if uploaded via crop
        if (fotoInput && fotoInput.files && fotoInput.files[0]) {
          fd.append("foto", fotoInput.files[0]);
        }

        try {
          const res = await fetch(`${API}/login/profile`, {
            method: "PATCH",
            body: fd,
          });

          const contentType = res.headers.get("content-type");
          let data;
          
          if (contentType && contentType.includes("application/json")) {
            data = await res.json();
          } else {
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            
            // Build user object with updated data
            const updatedUser = {
              ...user,
              username: usernameInput.value.trim(),
              email: emailInput.value.trim()
            };
            
            // If avatar was uploaded, use the current preview
            if (avatarImg && !avatarImg.classList.contains('hidden')) {
              updatedUser.avatar = avatarImg.src;
            }
            
            data = { user: updatedUser };
          }
          
          if (!res.ok && data?.message) {
            throw new Error(data.message);
          }

          localStorage.setItem("user", JSON.stringify(data.user));
          renderSidebarProfile();

          alert("Profil berhasil diperbarui");
          closeProfile();
        } catch (err) {
          alert("Gagal update profil: " + err.message);
        }
      });
    }
  }
});