const STORE_KEY = "regitrackPrototypeData";
const ACTOR_KEY = "regitrackDemoUser";
const defaultData = {
  accounts: [
    { id: 1, name: "System Administrator", username: "admin", role: "Admin", status: "Active", canApprove: false },
    { id: 2, name: "Registrar Staff", username: "registrar", role: "Registrar Staff", status: "Active", canApprove: false },
    { id: 3, name: "Authorized Registrar", username: "approver", role: "Registrar Staff", status: "Active", canApprove: true },
    { id: 4, name: "Demo Student", username: "student", role: "Student", status: "Active", canApprove: false }
  ],
  documentTypes: ["Transcript of Records (TOR)", "Certificate of Registration (COR)", "Certificate of Enrollment", "Certificate of Graduation", "Certificate of Units Earned"],
  requests: [
    { id: "RT-2026-001", student: "Demo Student", username: "student", course: "BS Information Technology", studentNumber: "2023-00001", yearAttended: "2023–2026", document: "Certificate of Enrollment", purpose: "School requirement", status: "Submitted", submitted: "2026-10-28", releaseDate: "", requirements: "Demo ID uploaded", notes: "" },
    { id: "RT-2026-002", student: "Alex Santos", username: "alex", course: "BS Business Administration", studentNumber: "2022-00114", yearAttended: "2022–2025", document: "Transcript of Records (TOR)", purpose: "Employment", status: "Verification", submitted: "2026-10-27", releaseDate: "", requirements: "ID for review", notes: "" },
    { id: "RT-2026-003", student: "Jamie Cruz", username: "jamie", course: "BS Psychology", studentNumber: "2021-00078", yearAttended: "2021–2025", document: "Certificate of Units Earned", purpose: "Transfer", status: "Processing", submitted: "2026-10-25", releaseDate: "", requirements: "Complete", notes: "" },
    { id: "RT-2026-004", student: "Morgan Reyes", username: "morgan", course: "BS Information Technology", studentNumber: "2020-00330", yearAttended: "2020–2024", document: "Certificate of Graduation", purpose: "Personal record", status: "Ready for Release", submitted: "2026-10-20", releaseDate: "2026-10-31", requirements: "Complete", notes: "Awaiting authorized final approval" },
    { id: "RT-2026-005", student: "Taylor Garcia", username: "taylor", course: "BS Education", studentNumber: "2019-00152", yearAttended: "2019–2023", document: "COR", purpose: "Personal record", status: "Released", submitted: "2026-10-12", releaseDate: "2026-10-18", requirements: "Complete", notes: "Demo record" }
  ],
  activity: [{ at: new Date().toISOString(), actor: "System", action: "Prototype data initialized" }]
};
function readData() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  localStorage.setItem(STORE_KEY, JSON.stringify(defaultData)); return structuredClone(defaultData);
}
function saveData(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function currentUser() {
  try { return JSON.parse(sessionStorage.getItem(ACTOR_KEY) || "null"); } catch (e) { return null; }
}
function requireRole(allowed) {
  const user = currentUser();
  if (!user || !allowed.includes(user.role)) { window.location.href = "index.html"; return null; }
  return user;
}
function logActivity(data, action) {
  const user = currentUser();
  data.activity.unshift({ at: new Date().toISOString(), actor: user ? user.name : "Unknown", action });
  data.activity = data.activity.slice(0, 100);
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function statusClass(status) {
  if (status === "Released" || status === "Approved for Release") return "green";
  if (status === "Ready for Release" || status === "Pending Approval") return "amber";
  if (status === "Rejected" || status === "Requirements Incomplete") return "red";
  if (status === "Submitted" || status === "Verification") return "blue";
  return "";
}
function statusPill(status) { return `<span class="pill ${statusClass(status)}">${escapeHtml(status)}</span>`; }
function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? escapeHtml(value) : d.toLocaleDateString(undefined, {year:"numeric",month:"short",day:"numeric"});
}
function showToast(message) {
  let node = document.getElementById("toast");
  if (!node) { node = document.createElement("div"); node.id = "toast"; node.className = "toast"; node.setAttribute("role","status"); document.body.appendChild(node); }
  node.textContent = message; node.classList.remove("hidden");
  clearTimeout(window.__toastTimer); window.__toastTimer = setTimeout(() => node.classList.add("hidden"), 3200);
}
function signOut() { sessionStorage.removeItem(ACTOR_KEY); window.location.href = "index.html"; }
function shellSetup(user, title, subtitle) {
  document.getElementById("pageTitle").textContent = title;
  document.getElementById("pageSubtitle").textContent = subtitle;
  document.getElementById("userName").textContent = user.name;
  document.getElementById("userRole").textContent = user.role + (user.canApprove ? " · Authorized approver" : "");
  document.getElementById("avatar").textContent = (user.name || "U").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
  document.getElementById("logoutBtn").addEventListener("click", signOut);
  document.querySelectorAll("[data-nav]").forEach(btn => btn.addEventListener("click", () => {
    document.querySelectorAll("[data-nav]").forEach(b=>b.classList.remove("active")); btn.classList.add("active");
    const target = btn.dataset.nav;
    document.querySelectorAll("[data-view]").forEach(v=>v.classList.toggle("hidden", v.dataset.view !== target));
  }));
}
function commonShell(roleLabel, navItems) {
  return `<div class="app">
    <aside class="sidebar">
      <div class="brand"><img src="assets/regitrack-logo.png" alt=""><div><strong>RegiTrack</strong><small>PCU Registrar's Office</small></div></div>
      <div class="nav-label">WORKSPACE</div>
      <nav class="nav">${navItems.map((n,i)=>`<button type="button" data-nav="${n.id}" class="${i===0?"active":""}"><span>${n.icon}</span>${n.label}</button>`).join("")}</nav>
      <div class="side-bottom"><strong>${roleLabel}</strong><p class="role-note">Prototype environment. Do not enter real student data.</p></div>
    </aside>
    <main class="main">
      <header class="topbar"><div><h1 id="pageTitle">Dashboard</h1><p id="pageSubtitle">RegiTrack workspace</p></div><div class="user-chip"><div class="avatar" id="avatar">RT</div><div><strong class="user-name" id="userName">User</strong><p id="userRole" style="margin:4px 0 0;color:#6b7890;font-size:11px"></p></div><button id="logoutBtn" class="btn">Sign out</button></div></header>
      <div class="content" id="appContent"></div>
    </main>
  </div><div id="toast" class="toast hidden" role="status"></div>`;
}
function statCard(label, value, sub, icon) { return `<div class="stat"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><strong>${value}</strong><small>${sub}</small></div>`; }
function requestRows(requests, options={}) {
  if (!requests.length) return `<tr><td colspan="7" class="empty">No requests match your filters.</td></tr>`;
  return requests.map(r=>`<tr><td><strong>${escapeHtml(r.id)}</strong></td><td>${escapeHtml(r.student)}</td><td>${escapeHtml(r.document)}</td><td>${formatDate(r.submitted)}</td><td>${statusPill(r.status)}</td><td>${formatDate(r.releaseDate)}</td><td><button class="btn" data-request-detail="${escapeHtml(r.id)}">View</button></td></tr>`).join("");
}
function bindRequestDetails(root=document) {
  root.querySelectorAll("[data-request-detail]").forEach(btn=>btn.addEventListener("click",()=>{
    const data=readData(), r=data.requests.find(x=>x.id===btn.dataset.requestDetail); if(!r)return;
    alert(`Request ${r.id}\nStudent: ${r.student}\nStudent No.: ${r.studentNumber}\nCourse: ${r.course}\nDocument: ${r.document}\nPurpose: ${r.purpose}\nRequirements: ${r.requirements}\nStatus: ${r.status}\nRelease date: ${r.releaseDate || "Not set"}\nNotes: ${r.notes || "None"}`);
  }));
}
function requestTablePanel(title, subtitle, id="requestsTable") {
 return `<section class="panel"><div class="panel-head"><div><h3>${title}</h3><p>${subtitle}</p></div><div class="toolbar"><input id="requestSearch" class="control search" placeholder="Search request or student"><select id="statusFilter" class="control"><option value="">All statuses</option>${["Submitted","Verification","Requirements Incomplete","Processing","Pending Approval","Ready for Release","Approved for Release","Released","Rejected"].map(s=>`<option>${s}</option>`).join("")}</select></div></div><div class="table-wrap"><table id="${id}"><thead><tr><th>Reference</th><th>Student</th><th>Document</th><th>Submitted</th><th>Status</th><th>Release date</th><th>Action</th></tr></thead><tbody></tbody></table></div></section>`;
}
function renderRequestTable(rows) {
 const tbody=document.querySelector("#requestsTable tbody"); if(!tbody)return;
 const search=(document.getElementById("requestSearch")?.value||"").toLowerCase();
 const status=document.getElementById("statusFilter")?.value||"";
 const filtered=rows.filter(r=>(!status||r.status===status)&&[r.id,r.student,r.document,r.studentNumber].some(v=>String(v||"").toLowerCase().includes(search)));
 tbody.innerHTML=requestRows(filtered); bindRequestDetails(tbody);
}
function attachRequestFilters(rows) {
 document.getElementById("requestSearch")?.addEventListener("input",()=>renderRequestTable(rows));
 document.getElementById("statusFilter")?.addEventListener("change",()=>renderRequestTable(rows));
}
