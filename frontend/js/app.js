// ============================================================
// app.js — PawsHome Frontend Application
// Single-Page Application logic
// ============================================================

const API = '/api'; // Change to 'http://localhost:5000/api' if serving frontend separately

// ── App State ────────────────────────────────────────────────
const State = {
  user:          null,
  token:         null,
  pets:          [],
  currentPet:    null,
  myApps:        [],
  favorites:     [],   // Array of pet IDs
};

// ============================================================
// UTILITIES
// ============================================================

/** Make an API request. Auth header added automatically if token exists. */
async function api(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (State.token) opts.headers['Authorization'] = `Bearer ${State.token}`;
  if (body)        opts.body = JSON.stringify(body);

  const res    = await fetch(`${API}${endpoint}`, opts);
  const json   = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
}

/** Show a toast notification */
function toast(msg, type = 'success') {
  const wrap  = document.getElementById('toastContainer');
  const el    = document.createElement('div');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || '•'}</span>${msg}`;
  wrap.appendChild(el);

  setTimeout(() => {
    el.style.opacity  = '0';
    el.style.transform = 'translateX(110%)';
    el.style.transition = 'all .28s ease';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

/** Navigate to a page view */
function go(pageId) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById(pageId);
  if (pg) { pg.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
}

/** Capitalize first letter */
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

/** Format pet age */
const fmtAge = a => a ? `${a.value} ${a.unit}` : '—';

/** Format date */
const fmtDate = d => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

/** Get a pet's display image (fallback by species) */
function petImg(pet) {
  if (pet.primaryImage && !pet.primaryImage.startsWith('/uploads')) return pet.primaryImage; // External URL
  if (pet.primaryImage) return pet.primaryImage;                                              // Uploaded file
  const fallback = {
    dog:    'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600',
    cat:    'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600',
    rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600',
    bird:   'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600',
  };
  return fallback[pet.species] || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600';
}

// ============================================================
// AUTH
// ============================================================

function loadStoredAuth() {
  const tok  = localStorage.getItem('pawshome_token');
  const user = localStorage.getItem('pawshome_user');
  if (tok && user) {
    State.token = tok;
    State.user  = JSON.parse(user);
    syncNavToAuth();
  }
}

function saveAuth(token, user) {
  State.token = token;
  State.user  = user;
  localStorage.setItem('pawshome_token', token);
  localStorage.setItem('pawshome_user',  JSON.stringify(user));
  syncNavToAuth();
}

function clearAuth() {
  State.token = null;
  State.user  = null;
  State.favorites = [];
  localStorage.removeItem('pawshome_token');
  localStorage.removeItem('pawshome_user');
  syncNavToAuth();
}

function syncNavToAuth() {
  const u = State.user;
  // Authless items - show when NOT logged in
  document.querySelectorAll('[data-guest]').forEach(el => el.style.display = u ? 'none' : '');
  // Auth-required items - show when logged in
  document.querySelectorAll('[data-auth]').forEach(el => el.style.display = u ? '' : 'none');
  // Admin-only items - show when admin
  document.querySelectorAll('[data-admin]').forEach(el => el.style.display = (u && u.role === 'admin') ? '' : 'none');
  // Display name
  document.querySelectorAll('.user-display-name').forEach(el => { if (u) el.textContent = u.name.split(' ')[0]; });
}

async function doLogin(email, password) {
  const r = await api('/auth/login', 'POST', { email, password });
  saveAuth(r.token, r.user);
  toast(`Welcome back, ${r.user.name.split(' ')[0]}! 🐾`);
  if (r.user.role === 'admin') { go('admin-page'); loadAdminStats(); }
  else                         { go('home-page'); loadFeaturedPets(); }
}

async function doSignup(name, email, password, phone) {
  const r = await api('/auth/signup', 'POST', { name, email, password, phone });
  saveAuth(r.token, r.user);
  toast('Welcome to PawsHome! 🐾');
  go('home-page');
  loadFeaturedPets();
}

function doLogout() {
  clearAuth();
  go('home-page');
  loadFeaturedPets();
  toast('You have been logged out.', 'info');
}

// ============================================================
// PETS
// ============================================================

async function loadFeaturedPets() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  grid.innerHTML = spinnerHtml('grid-column:1/-1');
  try {
    const r      = await api('/pets/featured');
    State.pets   = r.pets;
    grid.innerHTML = r.pets.length ? r.pets.map(petCardHtml).join('') : emptyHtml('No pets right now', 'Check back soon!');
    attachCardListeners(grid);
  } catch {
    grid.innerHTML = emptyHtml('Could not load pets', 'Please try again.');
  }
}

async function loadAllPets(filters = {}) {
  const grid    = document.getElementById('browseGrid');
  const countEl = document.getElementById('browseCount');
  if (!grid) return;
  grid.innerHTML = spinnerHtml('grid-column:1/-1');

  const qs = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v]) => v))).toString();

  try {
    const r = await api(`/pets?${qs}`);
    State.pets = r.pets;
    if (countEl) countEl.textContent = `${r.total} pet${r.total !== 1 ? 's' : ''} found`;
    grid.innerHTML = r.pets.length ? r.pets.map(petCardHtml).join('') : emptyHtml('No pets match your search', 'Try adjusting the filters.');
    attachCardListeners(grid);
  } catch {
    grid.innerHTML = emptyHtml('Error loading pets', 'Please try again.');
  }
}

function petCardHtml(pet) {
  const isFav  = State.favorites.includes(pet._id);
  const hDot   = `dot-${pet.status}`;

  return `
  <div class="pet-card" data-id="${pet._id}" role="button" tabindex="0" aria-label="View ${pet.name}">
    <div class="pet-card-img">
      <img src="${petImg(pet)}" alt="${pet.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600'">
      <span class="pet-species-badge">${cap(pet.species)}</span>
      <button class="pet-fav-btn ${isFav ? 'active' : ''}" data-pet-id="${pet._id}" aria-label="${isFav ? 'Remove from wishlist' : 'Add to wishlist'}">${isFav ? '❤️' : '🤍'}</button>
      <span class="pet-status-chip"><span class="dot ${hDot}"></span>${cap(pet.status)}</span>
    </div>
    <div class="pet-card-body">
      <div class="pet-name">${pet.name}</div>
      <div class="pet-breed">${pet.breed}</div>
      <div class="pet-tags">
        <span class="tag">🎂 ${fmtAge(pet.age)}</span>
        <span class="tag">${pet.gender === 'male' ? '♂' : '♀'} ${cap(pet.gender)}</span>
        <span class="tag">📏 ${cap(pet.size)}</span>
      </div>
      ${pet.description ? `<p class="pet-desc">${pet.description}</p>` : ''}
      <div class="pet-card-footer">
        <span class="pet-location">📍 ${pet.location?.city}, ${pet.location?.state}</span>
        <button class="btn btn-primary btn-sm view-btn" data-id="${pet._id}">View →</button>
      </div>
    </div>
  </div>`;
}

function attachCardListeners(container) {
  // Full-card click → open detail (except fav btn click)
  container.querySelectorAll('.pet-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.pet-fav-btn') || e.target.closest('.view-btn')) return;
      openPetDetail(card.dataset.id);
    });
    card.addEventListener('keydown', e => { if (e.key === 'Enter') openPetDetail(card.dataset.id); });
  });

  // View button
  container.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openPetDetail(btn.dataset.id); });
  });

  // Favourite toggle
  container.querySelectorAll('.pet-fav-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); toggleFav(btn.dataset.petId, btn); });
  });
}

async function openPetDetail(id) {
  try {
    const r    = await api(`/pets/${id}`);
    const pet  = r.pet;
    State.currentPet = pet;
    document.getElementById('petModalContent').innerHTML = petDetailHtml(pet);
    document.getElementById('petModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } catch {
    toast('Could not load pet details.', 'error');
  }
}

function petDetailHtml(pet) {
  const hKeys = ['vaccinated', 'spayedNeutered', 'microchipped'];
  const hLabels = { vaccinated: 'Vaccinated', spayedNeutered: 'Spayed / Neutered', microchipped: 'Microchipped' };

  const healthHtml = hKeys.map(k => `
    <span class="hchip ${pet.health?.[k] ? 'yes' : 'no'}">
      ${pet.health?.[k] ? '✓' : '✕'} ${hLabels[k]}
    </span>`).join('');

  const traitsHtml = (pet.traits || []).map(t => `<span class="tchip">🐾 ${t}</span>`).join('');

  const canAdopt = pet.status === 'available';
  const loggedIn = !!State.user;

  return `
    <button class="modal-close" onclick="closePetModal()" aria-label="Close">✕</button>
    <img class="modal-hero-img" src="${petImg(pet)}" alt="${pet.name}" onerror="this.src='https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600'">
    <div class="modal-body">
      <div class="modal-header">
        <div>
          <h2 class="modal-pet-name">${pet.name}</h2>
          <p class="modal-pet-breed">${pet.breed}</p>
        </div>
        <span class="status-badge ${pet.status}">${cap(pet.status)}</span>
      </div>

      <div class="modal-meta">
        <div class="meta-box"><div class="lbl">Species</div><div class="val">${cap(pet.species)}</div></div>
        <div class="meta-box"><div class="lbl">Age</div><div class="val">${fmtAge(pet.age)}</div></div>
        <div class="meta-box"><div class="lbl">Gender</div><div class="val">${cap(pet.gender)}</div></div>
        <div class="meta-box"><div class="lbl">Size</div><div class="val">${cap(pet.size)}</div></div>
        <div class="meta-box"><div class="lbl">Location</div><div class="val">📍 ${pet.location?.city}, ${pet.location?.state}</div></div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">About ${pet.name}</div>
        <p class="modal-desc">${pet.description}</p>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Health</div>
        <div class="health-chips">${healthHtml}</div>
        ${pet.health?.specialNeeds ? `<p style="margin-top:8px;font-size:.8rem;color:var(--honey)">⚠️ Special needs: ${pet.health.specialNeedsDescription || 'Contact us for details'}</p>` : ''}
      </div>

      ${traitsHtml ? `
      <div class="modal-section">
        <div class="modal-section-title">Personality</div>
        <div class="trait-chips">${traitsHtml}</div>
      </div>` : ''}

      <div class="modal-actions">
        ${canAdopt
          ? loggedIn
              ? `<button class="btn btn-primary btn-lg" onclick="startAdoption('${pet._id}')">🐾 Adopt ${pet.name}</button>`
              : `<button class="btn btn-primary btn-lg" onclick="closePetModal(); go('auth-page')">Login to Adopt</button>`
          : `<p style="color:var(--text-soft);font-style:italic">This pet is no longer available.</p>`
        }
        <button class="btn btn-outline" onclick="closePetModal()">Close</button>
      </div>
    </div>`;
}

function closePetModal() {
  document.getElementById('petModal').classList.add('hidden');
  document.body.style.overflow = '';
}

async function toggleFav(petId, btn) {
  if (!State.user) { toast('Log in to save favourites!', 'info'); return; }
  try {
    const r = await api(`/users/favorites/${petId}`, 'POST');
    if (r.favorited) {
      State.favorites.push(petId);
      btn.textContent = '❤️';
      btn.classList.add('active');
    } else {
      State.favorites = State.favorites.filter(id => id !== petId);
      btn.textContent = '🤍';
      btn.classList.remove('active');
    }
    toast(r.message);
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// SEARCH
// ============================================================

function getSearchFilters() {
  return {
    search:  document.getElementById('searchInput')?.value  || '',
    species: document.getElementById('speciesFilter')?.value || '',
    size:    document.getElementById('sizeFilter')?.value   || '',
    gender:  document.getElementById('genderFilter')?.value || '',
    city:    document.getElementById('cityFilter')?.value   || '',
  };
}

function doSearch() {
  go('browse-page');
  loadAllPets(getSearchFilters());
}

// ============================================================
// ADOPTION APPLICATION
// ============================================================

function startAdoption(petId) {
  if (!State.user) { toast('Please log in first!', 'error'); return; }
  closePetModal();

  const pet = State.currentPet || State.pets.find(p => p._id === petId);

  // Pre-fill known data
  setVal('appFullName', State.user.name || '');
  setVal('appEmail',    State.user.email || '');
  setVal('hiddenPetId', petId);

  const nameEl = document.getElementById('adoptingPetName');
  if (nameEl && pet) nameEl.textContent = pet.name;

  go('apply-page');
}

async function submitApplication(e) {
  e.preventDefault();

  const data = {
    petId: getVal('hiddenPetId'),
    personalInfo: {
      fullName: getVal('appFullName'),
      email:    getVal('appEmail'),
      phone:    getVal('appPhone'),
      address: {
        street: getVal('appStreet'),
        city:   getVal('appCity'),
        state:  getVal('appState'),
        zip:    getVal('appZip'),
      }
    },
    homeEnvironment: {
      housingType:        getVal('appHousingType'),
      hasYard:            chk('appYard'),
      isRenting:          chk('appRenting'),
      landlordAllowsPets: chk('appLandlord'),
      numberOfAdults:     parseInt(getVal('appAdults'))   || 1,
      numberOfChildren:   parseInt(getVal('appChildren')) || 0,
      childrenAges:       getVal('appChildAges'),
    },
    petExperience: {
      hasPetsNow:         chk('appHasPets'),
      currentPets:        getVal('appCurrentPets'),
      previousExperience: getVal('appPrevExp'),
      hoursAlonePerDay:   parseInt(getVal('appHoursAlone')) || 0,
      veterinarianName:   getVal('appVetName'),
    },
    whyAdopt: getVal('appWhyAdopt'),
    agreements: {
      agreeToVisit:          chk('agreeVisit'),
      agreeToFees:           chk('agreeFees'),
      agreeToResponsibility: chk('agreeResp'),
    }
  };

  if (!data.agreements.agreeToVisit || !data.agreements.agreeToFees || !data.agreements.agreeToResponsibility) {
    toast('Please accept all agreements.', 'error'); return;
  }

  const btn = document.getElementById('submitAppBtn');
  btn.disabled = true; btn.textContent = 'Submitting…';

  try {
    await api('/applications', 'POST', data);
    toast("Application submitted! We'll be in touch soon. 🐾");
    go('track-page');
    loadMyApplications();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Submit Application';
  }
}

// ============================================================
// APPLICATION TRACKING
// ============================================================

async function loadMyApplications() {
  const wrap = document.getElementById('myAppsList');
  if (!wrap) return;
  wrap.innerHTML = spinnerHtml();

  try {
    const r      = await api('/applications/my');
    State.myApps = r.applications;
    wrap.innerHTML = r.applications.length ? r.applications.map(appCardHtml).join('') : `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>No applications yet</h3>
        <p>Browse pets and apply to adopt one!</p>
        <br><button class="btn btn-primary" onclick="go('browse-page');loadAllPets()">Browse Pets</button>
      </div>`;
  } catch {
    wrap.innerHTML = emptyHtml('Error loading applications', 'Please try again.');
  }
}

function appCardHtml(app) {
  const icons = { pending: '⏳', reviewing: '🔍', approved: '✅', rejected: '❌' };
  return `
  <div class="app-card">
    <img class="app-pet-thumb" src="${petImg(app.pet || {})}" alt="${app.pet?.name || ''}" onerror="this.src='https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300'">
    <div>
      <div class="app-pet-name">${app.pet?.name || 'Unknown Pet'}</div>
      <div style="font-size:.8rem;color:var(--text-soft);margin-top:2px">${app.pet?.breed || ''} · ${cap(app.pet?.species || '')}</div>
      <span class="status-badge ${app.status}" style="margin-top:8px;display:inline-flex">${icons[app.status] || ''} ${cap(app.status)}</span>
      <div class="app-date">Applied: ${fmtDate(app.submittedAt)}</div>
      ${app.adminNotes     ? `<div class="admin-note">Note: ${app.adminNotes}</div>` : ''}
      ${app.rejectionReason ? `<div class="rejection-note">Reason: ${app.rejectionReason}</div>` : ''}
    </div>
  </div>`;
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================

function showAdmin() {
  if (!State.user || State.user.role !== 'admin') { toast('Admin access required.', 'error'); return; }
  go('admin-page');
  switchAdminPanel('overview');
}

async function loadAdminStats() {
  try {
    const r = await api('/admin/stats');
    const { stats, recentApplications } = r;

    setText('aStat-total',     stats.pets.total);
    setText('aStat-available', stats.pets.available);
    setText('aStat-adopted',   stats.pets.adopted);
    setText('aStat-pendApps',  stats.applications.pending);
    setText('aStat-users',     stats.users.total);

    const tbody = document.getElementById('recentAppsBody');
    if (tbody) {
      tbody.innerHTML = recentApplications.length
        ? recentApplications.map(a => `
          <tr>
            <td><strong>${a.applicant?.name || '—'}</strong><br><small style="color:var(--text-soft)">${a.applicant?.email || ''}</small></td>
            <td>${a.pet?.name || '—'}</td>
            <td><span class="status-badge ${a.status}">${cap(a.status)}</span></td>
            <td>${fmtDate(a.submittedAt)}</td>
          </tr>`).join('')
        : '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-soft)">No applications yet.</td></tr>';
    }
  } catch (err) { toast(err.message, 'error'); }
}

async function loadAdminPets() {
  const tbody = document.getElementById('adminPetsBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px"><div class="spinner" style="margin:auto"></div></td></tr>';

  try {
    const r = await api('/pets?limit=100&status=available');
    const a = await api('/pets?limit=100&status=adopted');
    const p = await api('/pets?limit=100&status=pending');
    const pets = [...r.pets, ...a.pets, ...p.pets];

    tbody.innerHTML = pets.length
      ? pets.map(pet => `
        <tr>
          <td><img class="pet-thumb" src="${petImg(pet)}" alt="${pet.name}" onerror="this.src='https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=100'"></td>
          <td><strong>${pet.name}</strong></td>
          <td>${cap(pet.species)} · ${pet.breed}</td>
          <td>${pet.location?.city}, ${pet.location?.state}</td>
          <td><span class="status-badge ${pet.status}">${cap(pet.status)}</span></td>
          <td>
            <div class="action-btns">
              <button class="btn btn-sm btn-danger" onclick="adminDeletePet('${pet._id}','${pet.name}')">Delete</button>
            </div>
          </td>
        </tr>`).join('')
      : '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-soft)">No pets added yet.</td></tr>';
  } catch { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#a5372c;padding:20px">Error loading pets.</td></tr>'; }
}

async function loadAdminApplications() {
  const tbody = document.getElementById('adminAppsBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px"><div class="spinner" style="margin:auto"></div></td></tr>';

  try {
    const r = await api('/applications');

    tbody.innerHTML = r.applications.length
      ? r.applications.map(app => `
        <tr>
          <td><strong>${app.applicant?.name || '—'}</strong><br><small style="color:var(--text-soft)">${app.applicant?.email || ''}</small></td>
          <td>${app.pet?.name || '—'}</td>
          <td><span class="status-badge ${app.status}">${cap(app.status)}</span></td>
          <td>${fmtDate(app.submittedAt)}</td>
          <td>
            <div class="action-btns">
              ${['pending','reviewing'].includes(app.status) ? `
                <button class="btn btn-sm btn-moss" onclick="updateAppStatus('${app._id}','approved')">✓ Approve</button>
                <button class="btn btn-sm btn-danger" onclick="rejectApp('${app._id}')">✕ Reject</button>` : ''}
              ${app.status === 'pending' ? `<button class="btn btn-sm btn-outline" onclick="updateAppStatus('${app._id}','reviewing')">Review</button>` : ''}
            </div>
          </td>
        </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-soft)">No applications yet.</td></tr>';
  } catch { toast('Error loading applications.', 'error'); }
}

async function updateAppStatus(id, status, reason = '') {
  try {
    await api(`/applications/${id}/status`, 'PUT', { status, rejectionReason: reason });
    toast(`Application ${status}!`);
    loadAdminApplications();
    loadAdminStats();
  } catch (err) { toast(err.message, 'error'); }
}

async function rejectApp(id) {
  const reason = prompt('Reason for rejection (optional):') || '';
  await updateAppStatus(id, 'rejected', reason);
}

async function adminDeletePet(id, name) {
  if (!confirm(`Remove "${name}" from listings? This cannot be undone.`)) return;
  try {
    await api(`/pets/${id}`, 'DELETE');
    toast(`${name} removed.`);
    loadAdminPets();
    loadAdminStats();
  } catch (err) { toast(err.message, 'error'); }
}

async function submitAddPet(e) {
  e.preventDefault();

  const petData = {
    name:    getVal('pName'),
    species: getVal('pSpecies'),
    breed:   getVal('pBreed'),
    age:     { value: parseInt(getVal('pAgeVal')), unit: getVal('pAgeUnit') },
    gender:  getVal('pGender'),
    size:    getVal('pSize'),
    location: { city: getVal('pCity'), state: getVal('pState') },
    description: getVal('pDesc'),
    health: {
      vaccinated:    chk('pVaccinated'),
      spayedNeutered: chk('pSpayed'),
      microchipped:  chk('pMicrochip'),
      specialNeeds:  chk('pSpecialNeeds'),
      specialNeedsDescription: getVal('pSpecialDesc'),
    },
    primaryImage: getVal('pImageUrl'),
    status: 'available',
  };

  const btn = document.getElementById('addPetBtn');
  btn.disabled = true; btn.textContent = 'Adding…';

  try {
    await api('/pets', 'POST', petData);
    toast(`${petData.name} added! 🐾`);
    e.target.reset();
    switchAdminPanel('pets');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Add Pet';
  }
}

function switchAdminPanel(name) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.toggle('active', i.dataset.panel === name));
  const panel = document.getElementById(`panel-${name}`);
  if (panel) panel.classList.add('active');

  if (name === 'overview')      loadAdminStats();
  if (name === 'pets')          loadAdminPets();
  if (name === 'applications')  loadAdminApplications();
}

// ============================================================
// AUTH TABS
// ============================================================
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('loginForm').classList.toggle('hidden',  tab !== 'login');
  document.getElementById('signupForm').classList.toggle('hidden', tab !== 'signup');
}

// ============================================================
// HELPERS
// ============================================================
const getVal   = id => document.getElementById(id)?.value || '';
const setVal   = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
const chk      = id => document.getElementById(id)?.checked || false;
const setText  = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

const spinnerHtml = (style = '') =>
  `<div class="spinner-wrap" style="${style}"><div class="spinner"></div><p style="color:var(--text-soft)">Loading…</p></div>`;

const emptyHtml = (h, p) =>
  `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🐾</div><h3>${h}</h3><p>${p}</p></div>`;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadStoredAuth();

  // ── Nav ───────────────────────────────────────────────────
  document.getElementById('navLogo')?.addEventListener('click',    () => { go('home-page'); loadFeaturedPets(); });
  document.getElementById('navBrowse')?.addEventListener('click',  () => { go('browse-page'); loadAllPets(); });
  document.getElementById('navTrack')?.addEventListener('click',   () => { go('track-page'); loadMyApplications(); });
  document.getElementById('navAdmin')?.addEventListener('click',   showAdmin);
  document.getElementById('navLogin')?.addEventListener('click',   () => go('auth-page'));
  document.getElementById('navLogout')?.addEventListener('click',  doLogout);
  document.getElementById('hamburger')?.addEventListener('click',  () => document.getElementById('navLinks').classList.toggle('mobile-open'));

  // ── Hero buttons ──────────────────────────────────────────
  document.getElementById('heroBrowseBtn')?.addEventListener('click', () => { go('browse-page'); loadAllPets(); });
  document.getElementById('heroSignupBtn')?.addEventListener('click', () => go('auth-page'));

  // ── Search ────────────────────────────────────────────────
  document.getElementById('searchBtn')?.addEventListener('click', doSearch);
  document.getElementById('searchInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  // ── Auth forms ────────────────────────────────────────────
  document.getElementById('loginFormEl')?.addEventListener('submit', async e => {
    e.preventDefault();
    try   { await doLogin(getVal('loginEmail'), getVal('loginPassword')); }
    catch (err) { toast(err.message, 'error'); }
  });

  document.getElementById('signupFormEl')?.addEventListener('submit', async e => {
    e.preventDefault();
    try   { await doSignup(getVal('signupName'), getVal('signupEmail'), getVal('signupPassword'), getVal('signupPhone')); }
    catch (err) { toast(err.message, 'error'); }
  });

  // ── Application form ──────────────────────────────────────
  document.getElementById('appFormEl')?.addEventListener('submit', submitApplication);

  // ── Add-pet form (admin) ──────────────────────────────────
  document.getElementById('addPetFormEl')?.addEventListener('submit', submitAddPet);

  // ── Modal backdrop click-to-close ─────────────────────────
  document.getElementById('petModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closePetModal();
  });

  // ── Load home page data ───────────────────────────────────
  loadFeaturedPets();
});
