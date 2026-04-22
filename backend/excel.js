// excel.js — Auto Excel Sync Service
// Updates Excel file automatically on every action

const XLSX     = require('xlsx');
const path     = require('path');
const fs       = require('fs');
const mongoose = require('mongoose');

const EXCEL_PATH = path.join(__dirname, '../exports/PawsHome_LiveData.xlsx');

// Make sure exports folder exists
if (!fs.existsSync(path.dirname(EXCEL_PATH))) {
  fs.mkdirSync(path.dirname(EXCEL_PATH), { recursive: true });
}

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
const fmt = d => d ? new Date(d).toLocaleDateString('en-GB') : '—';
const fmtTime = d => d ? new Date(d).toLocaleString('en-GB') : '—';

async function syncExcel() {
  try {
    // Lazy-load models to avoid circular deps
    const User        = require('./models/User');
    const Pet         = require('./models/Pet');
    const Application = require('./models/Application');

    const [users, pets, apps] = await Promise.all([
      User.find().select('-password').lean(),
      Pet.find().sort('-createdAt').lean(),
      Application.find()
        .populate('pet',       'name species breed')
        .populate('applicant', 'name email')
        .sort('-submittedAt').lean()
    ]);

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: SUMMARY ─────────────────────────────────────
    const summaryRows = [
      ['PawsHome — Live Data Export'],
      [`Last Updated: ${new Date().toLocaleString('en-GB')}`],
      [''],
      ['CATEGORY',             'COUNT'],
      ['Total Users',          users.length],
      ['Admin Users',          users.filter(u=>u.role==='admin').length],
      ['Regular Users',        users.filter(u=>u.role==='user').length],
      [''],
      ['Total Pets',           pets.length],
      ['Available Pets',       pets.filter(p=>p.status==='available').length],
      ['Pending Pets',         pets.filter(p=>p.status==='pending').length],
      ['Adopted Pets',         pets.filter(p=>p.status==='adopted').length],
      [''],
      ['Total Applications',   apps.length],
      ['Pending',              apps.filter(a=>a.status==='pending').length],
      ['Reviewing',            apps.filter(a=>a.status==='reviewing').length],
      ['Approved',             apps.filter(a=>a.status==='approved').length],
      ['Rejected',             apps.filter(a=>a.status==='rejected').length],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws1['!cols'] = [{wch:28},{wch:16}];
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // ── Sheet 2: APPLICATIONS ─────────────────────────────────
    const appsData = apps.map((a, i) => ({
      '#':               i + 1,
      'Applicant Name':  a.personalInfo?.fullName    || a.applicant?.name  || '—',
      'Email':           a.personalInfo?.email       || a.applicant?.email || '—',
      'Phone':           a.personalInfo?.phone       || '—',
      'City':            a.personalInfo?.address?.city  || '—',
      'State':           a.personalInfo?.address?.state || '—',
      'Pet Name':        a.pet?.name    || '—',
      'Pet Species':     cap(a.pet?.species),
      'Pet Breed':       a.pet?.breed   || '—',
      'Status':          cap(a.status),
      'Housing Type':    cap(a.homeEnvironment?.housingType),
      'Has Yard':        a.homeEnvironment?.hasYard   ? 'Yes' : 'No',
      'Is Renting':      a.homeEnvironment?.isRenting ? 'Yes' : 'No',
      'No. Adults':      a.homeEnvironment?.numberOfAdults   || 0,
      'No. Children':    a.homeEnvironment?.numberOfChildren || 0,
      'Has Pets Now':    a.petExperience?.hasPetsNow  ? 'Yes' : 'No',
      'Hours Alone/Day': a.petExperience?.hoursAlonePerDay  || 0,
      'Vet Name':        a.petExperience?.veterinarianName  || '—',
      'Why Adopt':       a.whyAdopt || '—',
      'Admin Notes':     a.adminNotes      || '—',
      'Reject Reason':   a.rejectionReason || '—',
      'Submitted On':    fmtTime(a.submittedAt),
      'Reviewed On':     fmtTime(a.reviewedAt),
    }));

    const ws2 = apps.length > 0
      ? XLSX.utils.json_to_sheet(appsData)
      : XLSX.utils.aoa_to_sheet([['No applications yet']]);

    if (apps.length > 0) {
      ws2['!cols'] = [
        {wch:5},{wch:22},{wch:26},{wch:14},{wch:14},{wch:8},
        {wch:14},{wch:12},{wch:20},{wch:12},{wch:14},{wch:10},
        {wch:10},{wch:10},{wch:12},{wch:12},{wch:14},{wch:20},
        {wch:30},{wch:24},{wch:20},{wch:18},{wch:18}
      ];
    }
    XLSX.utils.book_append_sheet(wb, ws2, 'Applications');

    // ── Sheet 3: PETS ─────────────────────────────────────────
    const petsData = pets.map((p, i) => ({
      '#':              i + 1,
      'Name':           p.name,
      'Species':        cap(p.species),
      'Breed':          p.breed,
      'Age':            `${p.age?.value} ${p.age?.unit}`,
      'Gender':         cap(p.gender),
      'Size':           cap(p.size),
      'City':           p.location?.city  || '—',
      'State':          p.location?.state || '—',
      'Status':         cap(p.status),
      'Vaccinated':     p.health?.vaccinated     ? 'Yes' : 'No',
      'Spayed/Neut':    p.health?.spayedNeutered ? 'Yes' : 'No',
      'Microchipped':   p.health?.microchipped   ? 'Yes' : 'No',
      'Special Needs':  p.health?.specialNeeds   ? 'Yes' : 'No',
      'Added On':       fmt(p.createdAt),
    }));

    const ws3 = pets.length > 0
      ? XLSX.utils.json_to_sheet(petsData)
      : XLSX.utils.aoa_to_sheet([['No pets yet']]);

    if (pets.length > 0) {
      ws3['!cols'] = [
        {wch:5},{wch:14},{wch:10},{wch:22},{wch:10},
        {wch:8},{wch:10},{wch:14},{wch:8},{wch:12},
        {wch:12},{wch:14},{wch:14},{wch:14},{wch:14}
      ];
    }
    XLSX.utils.book_append_sheet(wb, ws3, 'Pets');

    // ── Sheet 4: USERS ────────────────────────────────────────
    const usersData = users.map((u, i) => ({
      '#':        i + 1,
      'Name':     u.name,
      'Email':    u.email,
      'Phone':    u.phone || '—',
      'Role':     cap(u.role),
      'City':     u.address?.city  || '—',
      'State':    u.address?.state || '—',
      'Joined':   fmt(u.createdAt),
    }));

    const ws4 = XLSX.utils.json_to_sheet(usersData);
    ws4['!cols'] = [{wch:5},{wch:20},{wch:26},{wch:14},{wch:8},{wch:14},{wch:8},{wch:14}];
    XLSX.utils.book_append_sheet(wb, ws4, 'Users');

    // ── Save ──────────────────────────────────────────────────
    XLSX.writeFile(wb, EXCEL_PATH);
    console.log(`📊  Excel updated → ${EXCEL_PATH}`);
    return true;

  } catch (err) {
    console.error('❌  Excel sync error:', err.message);
    return false;
  }
}

module.exports = { syncExcel, EXCEL_PATH };
