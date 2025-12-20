const API = window.location.origin;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addProductForm");
  const supplierSelect = document.getElementById("supplier");

  async function loadSuppliers() {
    if (!supplierSelect) return;
    supplierSelect.innerHTML = `<option value="">Memuat daftar supplier...</option>`;

    try {
      const res = await fetch(`${API}/suppliers`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Gagal mengambil data supplier");

      const data = await res.json();
      const suppliers = data.suppliers || data || [];

      supplierSelect.innerHTML = `<option value="">Pilih supplier</option>`;
      suppliers.forEach((sup) => {
        const opt = document.createElement("option");
        opt.value = sup.supid;
        opt.textContent = sup.namaSupplier || sup.nama_supplier || sup.supid;
        supplierSelect.appendChild(opt);
      });

      if (suppliers.length === 0) {
        supplierSelect.innerHTML = `<option value="">Belum ada supplier, tambahkan dulu di Dashboard</option>`;
      }
    } catch (err) {
      supplierSelect.innerHTML = `<option value="">Gagal memuat supplier</option>`;
    }
  }

  loadSuppliers();

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const namaItem = document.getElementById("namaBarang")?.value.trim() || "";
    const keterangan = document.getElementById("keterangan")?.value.trim() || "";
    const hargaSatuan = document.getElementById("hargaSatuan")?.value.trim() || "";
    const stok = document.getElementById("stok")?.value.trim() || "";
    const kategoriEl = document.getElementById("kategori");
    const supplierEl = document.getElementById("supplier");
    const fotoInput = document.getElementById("fotoInput");

    const kategori = kategoriEl?.value.trim() || "";
    const supplier = supplierEl?.value.trim() || "";
    const foto = fotoInput && fotoInput.files[0] ? fotoInput.files[0] : null;

    if (!namaItem || !hargaSatuan || !stok) {
      alert("Nama barang, harga, dan stok wajib diisi!");
      return;
    }

    const fd = new FormData();
    fd.append("namaItem", namaItem);
    fd.append("keterangan", keterangan);
    fd.append("hargaSatuan", hargaSatuan);
    fd.append("stok", stok);
    fd.append("catid", kategori);
    fd.append("supid", supplier);
    if (foto) fd.append("foto", foto);

    const btn = form.querySelector('button[type="submit"]') || form.querySelector("button");
    let prevText = "";
    if (btn) {
      btn.disabled = true;
      prevText = btn.textContent;
      btn.textContent = "Uploading...";
    }

    try {
      const res = await fetch(`${API}/items`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        let errMsg = `Gagal menambah produk (status ${res.status})`;
        try {
          const err = await res.json();
          if (err && err.message) errMsg = err.message;
        } catch (_) {}
        throw new Error(errMsg);
      }

      alert("Produk berhasil ditambahkan!");
      window.location.href = "products.html";
    } catch (err) {
      alert(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = prevText || "ADD";
      }
    }
  });

  const fotoInput = document.getElementById("fotoInput");
  const photoBox = document.getElementById("photoBox");
  if (fotoInput && photoBox) {
    fotoInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          photoBox.innerHTML = `<img src="${e.target.result}" alt="Preview" class="w-full h-full object-cover rounded-2xl"/>`;
        };
        reader.readAsDataURL(this.files[0]);
      } else {
        photoBox.textContent = "foto.";
      }
    });
  }
});

function renderSidebarProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const sidebarUsername = document.getElementById("sidebarUsername");
  const profileBtn = document.getElementById("profileBtn");

  if (sidebarUsername && user.username) {
    sidebarUsername.textContent = user.username;
    document.title = user.username + " - Add Product";
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
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("bg-pink-400", "text-white", "shadow");
    } else {
      link.classList.remove("bg-pink-400", "text-white", "shadow");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderSidebarProfile();
  highlightActivePage();

  const profileBtn = document.getElementById("profileBtn");
  const profileModal = document.getElementById("profileModal");
  const profileClose = document.getElementById("profileClose");
  const profileLogout = document.getElementById("profileLogout");
  const profileSave = document.getElementById("profileSave");
  const profileCancel = document.getElementById("profileCancel");
  const profileError = document.getElementById("profileError");
  const profileFotoInput = document.getElementById("profileFotoInput");
  const profileAvatar = document.getElementById("profileAvatar");
  const profileAvatarContainer = document.getElementById("profileAvatarContainer");
  const profilePlaceholder = document.getElementById("profileAvatarPlaceholder");

  function openProfile() {
    if (profileError) {
      profileError.classList.add("hidden");
      profileError.textContent = "";
    }
    if (profileFotoInput) profileFotoInput.value = "";

    const u = JSON.parse(localStorage.getItem("user") || "{}");
    const profileIdEl = document.getElementById("profileId");
    const profileUsernameInputEl = document.getElementById("profileUsernameInput");
    const profileEmailInputEl = document.getElementById("profileEmailInput");
    const profilePasswordInputEl = document.getElementById("profilePasswordInput");

    if (profileIdEl) profileIdEl.textContent = u.id || "-";
    if (profileUsernameInputEl) profileUsernameInputEl.value = u.username || "";
    if (profileEmailInputEl) profileEmailInputEl.value = u.email || "";
    if (profilePasswordInputEl) profilePasswordInputEl.value = "";

    if (u.avatar) {
      if (profileAvatar) {
        profileAvatar.src = u.avatar;
        profileAvatar.classList.remove("hidden");
      }
      if (profilePlaceholder) profilePlaceholder.classList.add("hidden");
    } else {
      if (profileAvatar) profileAvatar.classList.add("hidden");
      if (profilePlaceholder) profilePlaceholder.classList.remove("hidden");
    }

    if (profileModal) {
      profileModal.classList.remove("hidden");
      profileModal.classList.add("flex");
      document.body.style.overflow = "hidden";
    }
  }

  function closeProfile() {
    if (profileModal) {
      profileModal.classList.add("hidden");
      profileModal.classList.remove("flex");
      document.body.style.overflow = "";
    }
  }

  profileBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openProfile();
  });

  profileClose?.addEventListener("click", (e) => {
    e.preventDefault();
    closeProfile();
  });

  profileCancel?.addEventListener("click", (e) => {
    e.preventDefault();
    closeProfile();
  });

  profileModal?.addEventListener("click", (e) => {
    if (e.target === profileModal) closeProfile();
  });

  profileLogout?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("user");
    window.location.href = "../src/login.html";
  });

  profileAvatarContainer?.addEventListener("click", (e) => {
    if (e.target.tagName === "svg" || e.target.tagName === "path") return;
    profileFotoInput?.click();
  });

  profileSave?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (profileError) profileError.classList.add("hidden");

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const id = currentUser.id;

    const usernameVal = document.getElementById("profileUsernameInput")?.value.trim() || "";
    const emailVal = document.getElementById("profileEmailInput")?.value.trim() || "";
    const passwordVal = document.getElementById("profilePasswordInput")?.value || "";
    const newFoto = profileFotoInput?.files[0];

    if (!id) {
      if (profileError) {
        profileError.textContent = "Error: User ID tidak ditemukan. Silakan login ulang.";
        profileError.classList.remove("hidden");
      }
      return;
    }

    if (!usernameVal || !emailVal) {
      if (profileError) {
        profileError.textContent = "Username dan email wajib diisi.";
        profileError.classList.remove("hidden");
      }
      return;
    }

    const fd = new FormData();
    fd.append("id", id);
    fd.append("username", usernameVal);
    fd.append("email", emailVal);
    if (passwordVal) fd.append("password", passwordVal);
    if (newFoto) fd.append("foto", newFoto);

    const profileSaveBtn = e.target;
    const prevText = profileSaveBtn.textContent;
    profileSaveBtn.disabled = true;
    profileSaveBtn.textContent = "Saving...";

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
        
        const updatedUser = {
          ...currentUser,
          username: usernameVal,
          email: emailVal,
        };

        if (profileAvatar && !profileAvatar.classList.contains("hidden")) {
          updatedUser.avatar = profileAvatar.src;
        }

        data = { user: updatedUser };
      }

      if (!res.ok && data?.message) {
        throw new Error(data.message);
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      renderSidebarProfile();

      closeProfile();
    } catch (err) {
      if (profileError) {
        profileError.textContent = err.message || "Gagal memperbarui profile.";
        profileError.classList.remove("hidden");
      }
    } finally {
      profileSaveBtn.disabled = false;
      profileSaveBtn.textContent = prevText;
    }
  });
});

document.getElementById("logoutBtn")?.addEventListener("click", function (e) {
  e.preventDefault();
  localStorage.removeItem("user");
  window.location.href = "../src/login.html";
});

document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("sidebar");
  const mobileOverlay = document.getElementById("mobileOverlay");

  if (!mobileMenuBtn || !sidebar || !mobileOverlay) return;

  function openSidebar() {
    if (sidebar) {
      sidebar.classList.add("mobile-open");
      sidebar.style.display = "flex";
      sidebar.style.visibility = "visible";
      sidebar.style.opacity = "1";
    }
    if (mobileOverlay) mobileOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("mobile-open");
    if (mobileOverlay) mobileOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  mobileMenuBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    openSidebar();
  });

  mobileOverlay.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeSidebar();
  });

  document.querySelectorAll("aside nav a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
    });
  });
});