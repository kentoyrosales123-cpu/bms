const isDashboardPage = window.location.pathname.includes("dashboard");

const token = localStorage.getItem("bms_token");

if (isDashboardPage && !token) {
  location.href = "/login";
}

const api = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("bms_token");
    location.href = "/login";
    return;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

let products = [],
  sales = [],
  expenses = [],
  customers = [],
  employees = [],
  chart;
const peso = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-PH") : "");

function setSection(id) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelector(`[data-section="${id}"]`)?.classList.add("active");
  document.getElementById("pageTitle").textContent =
    id.charAt(0).toUpperCase() + id.slice(1);
  document.querySelector(".sidebar").classList.remove("open");
}

if (isDashboardPage) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setSection(btn.dataset.section);
    });
  });
}
const logoutBtn = document.getElementById("logoutBtn");
const menuToggle = document.getElementById("menuToggle");

if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.clear();
    location.href = "/login";
  };
}

if (menuToggle) {
  menuToggle.onclick = () =>
    document.querySelector(".sidebar").classList.toggle("open");
}

function filterTable(tableId, query) {
  const q = query.toLowerCase();
  document.querySelectorAll(`#${tableId} tbody tr`).forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
  });
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
}
function showModal(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modal").classList.add("show");
}

async function refreshReports() {
  try {
    const data = await api("/api/reports/dashboard");

    document.getElementById("salesAmount").innerText = peso(data.totalSales);
    document.getElementById("profitAmount").innerText = peso(data.grossProfit);
    document.getElementById("expenseAmount").innerText = peso(
      data.totalExpenses,
    );
    document.getElementById("netAmount").innerText = peso(data.netProfit);

    await loadProfitLoss();
  } catch (error) {
    alert(error.message);
  }
}

async function loadAll() {
  try {
    await Promise.all([
      loadDashboard(),
      loadInventory(),
      loadCustomers(),
      loadSales(),
      loadExpenses(),
      loadEmployees(),
      loadProfitLoss(),
    ]);
  } catch (error) {
    alert(error.message);
  }
}

async function loadDashboard() {
  const d = await api("/api/reports/dashboard");
  const salesEl = document.getElementById("salesAmount");
  const profitEl = document.getElementById("profitAmount");
  const expenseEl = document.getElementById("expenseAmount");
  const netEl = document.getElementById("netAmount");

  if (salesEl) salesEl.innerText = peso(d.totalSales);
  if (profitEl) profitEl.innerText = peso(d.grossProfit);
  if (expenseEl) expenseEl.innerText = peso(d.totalExpenses);
  if (netEl) netEl.innerText = peso(d.netProfit);
  updateReportCards(d);
  document.getElementById("statsGrid").innerHTML = [
    ["Total Sales", peso(d.totalSales)],
    ["Total Expenses", peso(d.totalExpenses)],
    ["Net Profit", peso(d.netProfit)],
    ["Inventory Items", d.inventoryItems],
    ["Customers", d.totalCustomers],
    ["Employees", d.totalEmployees],
    ["Gross Profit", peso(d.grossProfit)],
    ["Low Stock", d.lowStock.length],
  ]
    .map(
      ([label, value]) =>
        `<div class="stat-card"><p>${label}</p><h3>${value}</h3></div>`,
    )
    .join("");

  document.getElementById("lowStockList").innerHTML = d.lowStock.length
    ? d.lowStock
        .map(
          (p) =>
            `<div class="alert-row"><strong>${p.name}</strong><span class="pill low">${p.stock} left</span></div>`,
        )
        .join("")
    : '<p class="empty">No low stock items.</p>';

  document.getElementById("recentTable").innerHTML =
    `<thead><tr><th>Date</th><th>Product</th><th>Customer</th><th>Qty</th><th>Total</th><th>Profit</th></tr></thead><tbody>${d.recentTransactions.map((s) => `<tr><td>${dateFmt(s.saleDate)}</td><td>${s.product?.name || "Deleted Product"}</td><td>${s.customer?.name || "-"}</td><td>${s.quantity}</td><td>${peso(s.totalAmount)}</td><td>${peso(s.profit)}</td></tr>`).join("")}</tbody>`;

  const labels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const ctx = document.getElementById("monthlyChart");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Sales", data: d.monthly.map((m) => m.sales), tension: 0.35 },
        {
          label: "Profit",
          data: d.monthly.map((m) => m.profit),
          tension: 0.35,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } },
  });
}

async function loadInventory() {
  products = await api("/api/inventory");
  document.getElementById("inventoryTable").innerHTML =
    `<thead><tr><th>Name</th><th>Category</th><th>Stock</th><th>Buying</th><th>Selling</th><th>Profit/Item</th><th>Status</th><th>Actions</th></tr></thead><tbody>${products.map((p) => `<tr><td>${p.name}</td><td>${p.category || "-"}</td><td>${p.stock}</td><td>${peso(p.buyingPrice)}</td><td>${peso(p.sellingPrice)}</td><td>${peso(p.sellingPrice - p.buyingPrice)}</td><td><span class="pill ${p.stock <= p.lowStockLimit ? "low" : "ok"}">${p.stock <= p.lowStockLimit ? "Low Stock" : "OK"}</span></td><td><button class="action-btn edit" onclick="openProductModal('${p._id}')">Edit</button><button class="action-btn delete" onclick="deleteItem('/api/inventory/${p._id}')">Delete</button></td></tr>`).join("")}</tbody>`;
}

function productForm(product = {}) {
  return `
    <h2>${product._id ? "Edit" : "Add"} Product</h2>

    <form id="productForm" class="form-grid">
      <div>
        <label>Name</label>
        <input name="name" value="${product.name || ""}" required>
      </div>

      <div>
        <label>SKU</label>
        <input name="sku" value="${product.sku || ""}">
      </div>

      <div>
        <label>Category</label>
        <input name="category" value="${product.category || "General"}">
      </div>

      <div>
        <label>Stock</label>
        <input type="number" name="stock" value="${product.stock || 0}" required>
      </div>

      <div>
        <label>Buying Price</label>
        <input type="number" name="buyingPrice" value="${product.buyingPrice || 0}" required>
      </div>

      <div>
        <label>Selling Price</label>
        <input type="number" name="sellingPrice" value="${product.sellingPrice || 0}" required>
      </div>

      <div>
        <label>Low Stock Limit</label>
        <input type="number" name="lowStockLimit" value="${product.lowStockLimit || 5}">
      </div>

      <div class="full-row">
        <label>Description</label>
        <textarea name="description">${product.description || ""}</textarea>
      </div>

      <button class="btn primary full-row">Save Product</button>
    </form>
  `;
}
function openProductModal(id) {
  const product = products.find((item) => item._id === id) || {};

  showModal(productForm(product));

  document.getElementById("productForm").onsubmit = function (e) {
    saveForm(e, `/api/inventory${id ? `/${id}` : ""}`, id ? "PUT" : "POST");
  };
}

async function loadSales() {
  sales = await api("/api/sales");
  document.getElementById("salesTable").innerHTML =
    `<thead><tr><th>Date</th><th>Product</th><th>Customer</th><th>Qty</th><th>Total</th><th>Profit</th><th>Actions</th></tr></thead><tbody>${sales.map((s) => `<tr><td>${dateFmt(s.saleDate)}</td><td>${s.product?.name || "Deleted Product"}</td><td>${s.customer?.name || "-"}</td><td>${s.quantity}</td><td>${peso(s.totalAmount)}</td><td>${peso(s.profit)}</td><td><button class="action-btn delete" onclick="deleteItem('/api/sales/${s._id}')">Delete</button></td></tr>`).join("")}</tbody>`;
}
function openSaleModal() {
  showModal(
    `<h2>Create Sale</h2><form id="saleForm" class="form-grid"><div><label>Product</label><select name="productId" required>${products.map((p) => `<option value="${p._id}">${p.name} - ${p.stock} in stock - ${peso(p.sellingPrice)}</option>`).join("")}</select></div><div><label>Customer</label><select name="customer"><option value="">Walk-in Customer</option>${customers.map((c) => `<option value="${c._id}">${c.name}</option>`).join("")}</select></div><div><label>Quantity</label><input type="number" name="quantity" min="1" value="1" required></div><div><label>Sale Date</label><input type="date" name="saleDate"></div><div class="full-row"><label>Notes</label><textarea name="notes"></textarea></div><button class="btn primary full-row">Save Sale</button></form>`,
  );
  document.getElementById("saleForm").onsubmit = (e) =>
    saveForm(e, "/api/sales", "POST");
}

async function loadExpenses() {
  expenses = await api("/api/expenses");
  document.getElementById("expensesTable").innerHTML =
    `<thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Notes</th><th>Actions</th></tr></thead><tbody>${expenses.map((e) => `<tr><td>${dateFmt(e.expenseDate)}</td><td>${e.title}</td><td>${e.category}</td><td>${peso(e.amount)}</td><td>${e.notes || ""}</td><td><button class="action-btn edit" onclick="openExpenseModal('${e._id}')">Edit</button><button class="action-btn delete" onclick="deleteItem('/api/expenses/${e._id}')">Delete</button></td></tr>`).join("")}</tbody>`;
}
function expenseForm(e = {}) {
  return `<h2>${e._id ? "Edit" : "Add"} Expense</h2><form id="expenseForm" class="form-grid"><div><label>Title</label><input name="title" value="${e.title || ""}" required></div><div><label>Category</label><input name="category" value="${e.category || "General"}" required></div><div><label>Amount</label><input type="number" name="amount" value="${e.amount || 0}" required></div><div><label>Date</label><input type="date" name="expenseDate" value="${e.expenseDate ? e.expenseDate.slice(0, 10) : ""}"></div><div class="full-row"><label>Notes</label><textarea name="notes">${e.notes || ""}</textarea></div><button class="btn primary full-row">Save Expense</button></form>`;
}
function openExpenseModal(id) {
  const e = expenses.find((x) => x._id === id) || {};
  showModal(expenseForm(e));
  document.getElementById("expenseForm").onsubmit = (ev) =>
    saveForm(ev, `/api/expenses${id ? `/${id}` : ""}`, id ? "PUT" : "POST");
}

async function loadCustomers() {
  customers = await api("/api/customers");
  document.getElementById("customersTable").innerHTML =
    `<thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>Address</th><th>Actions</th></tr></thead><tbody>${customers.map((c) => `<tr><td>${c.name}</td><td>${c.contactNumber || ""}</td><td>${c.email || ""}</td><td>${c.address || ""}</td><td><button class="action-btn edit" onclick="openCustomerModal('${c._id}')">Edit</button><button class="action-btn delete" onclick="deleteItem('/api/customers/${c._id}')">Delete</button></td></tr>`).join("")}</tbody>`;
}
function customerForm(c = {}) {
  return `<h2>${c._id ? "Edit" : "Add"} Customer</h2><form id="customerForm" class="form-grid"><div><label>Name</label><input name="name" value="${c.name || ""}" required></div><div><label>Contact Number</label><input name="contactNumber" value="${c.contactNumber || ""}"></div><div><label>Email</label><input type="email" name="email" value="${c.email || ""}"></div><div><label>Address</label><input name="address" value="${c.address || ""}"></div><div class="full-row"><label>Notes</label><textarea name="notes">${c.notes || ""}</textarea></div><button class="btn primary full-row">Save Customer</button></form>`;
}
function openCustomerModal(id) {
  const c = customers.find((x) => x._id === id) || {};
  showModal(customerForm(c));
  document.getElementById("customerForm").onsubmit = (e) =>
    saveForm(e, `/api/customers${id ? `/${id}` : ""}`, id ? "PUT" : "POST");
}

async function loadEmployees() {
  employees = await api("/api/employees");
  document.getElementById("employeesTable").innerHTML =
    `<thead><tr><th>Name</th><th>Position</th><th>Salary</th><th>Contact</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead><tbody>${employees.map((e) => `<tr><td>${e.name}</td><td>${e.position}</td><td>${peso(e.salary)}</td><td>${e.contactNumber || ""}</td><td>${e.email || ""}</td><td><span class="pill ${e.status === "Active" ? "ok" : "low"}">${e.status}</span></td><td><button class="action-btn edit" onclick="openEmployeeModal('${e._id}')">Edit</button><button class="action-btn delete" onclick="deleteItem('/api/employees/${e._id}')">Delete</button></td></tr>`).join("")}</tbody>`;
}
function employeeForm(e = {}) {
  return `<h2>${e._id ? "Edit" : "Add"} Employee</h2><form id="employeeForm" class="form-grid"><div><label>Name</label><input name="name" value="${e.name || ""}" required></div><div><label>Position</label><input name="position" value="${e.position || ""}" required></div><div><label>Salary</label><input type="number" name="salary" value="${e.salary || 0}"></div><div><label>Contact</label><input name="contactNumber" value="${e.contactNumber || ""}"></div><div><label>Email</label><input type="email" name="email" value="${e.email || ""}"></div><div><label>Status</label><select name="status"><option ${e.status === "Active" ? "selected" : ""}>Active</option><option ${e.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div><button class="btn primary full-row">Save Employee</button></form>`;
}
function openEmployeeModal(id) {
  const emp = employees.find((x) => x._id === id) || {};
  showModal(employeeForm(emp));
  document.getElementById("employeeForm").onsubmit = (e) =>
    saveForm(e, `/api/employees${id ? `/${id}` : ""}`, id ? "PUT" : "POST");
}

async function saveForm(e, url, method) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target).entries());
  Object.keys(body).forEach((k) => {
    if (body[k] === "") delete body[k];
    if (
      [
        "stock",
        "buyingPrice",
        "sellingPrice",
        "lowStockLimit",
        "quantity",
        "amount",
        "salary",
      ].includes(k)
    )
      body[k] = Number(body[k]);
  });
  try {
    await api(url, { method, body: JSON.stringify(body) });
    closeModal();
    await loadAll();
  } catch (err) {
    alert(err.message);
  }
}
async function deleteItem(url) {
  if (!confirm("Delete this record?")) return;
  try {
    await api(url, { method: "DELETE" });
    await loadAll();
  } catch (e) {
    alert(e.message);
  }
}

async function loadProfitLoss() {
  const report = await api("/api/reports/dashboard");

  document.getElementById("profitLossBox").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <p>Total Sales</p>
        <h3>${peso(report.totalSales)}</h3>
      </div>

      <div class="stat-card">
        <p>Gross Profit</p>
        <h3>${peso(report.grossProfit)}</h3>
      </div>

      <div class="stat-card">
        <p>Expenses</p>
        <h3>${peso(report.totalExpenses)}</h3>
      </div>

      <div class="stat-card">
        <p>Net Profit</p>
        <h3>${peso(report.netProfit)}</h3>
      </div>
    </div>
  `;
}
function downloadReport(type) {
  window.open(`/api/reports/export/${type}?token=${token}`, "_blank");
}

const miniChartConfig = (id, color, data) => {
  new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels: ["1", "2", "3", "4", "5", "6", "7"],
      datasets: [
        {
          data: data,
          borderColor: color,
          backgroundColor: color,
          tension: 0.4,
          fill: false,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { display: false },
      },
    },
  });
};

window.addEventListener("load", () => {
  if (document.getElementById("salesMiniChart")) {
    miniChartConfig("salesMiniChart", "#2563eb", [4, 6, 5, 8, 7, 10, 9]);
  }

  if (document.getElementById("profitMiniChart")) {
    miniChartConfig("profitMiniChart", "#16a34a", [2, 3, 4, 3, 5, 6, 5]);
  }

  if (document.getElementById("expenseMiniChart")) {
    miniChartConfig("expenseMiniChart", "#ea580c", [5, 4, 6, 5, 7, 6, 8]);
  }

  if (document.getElementById("netMiniChart")) {
    miniChartConfig("netMiniChart", "#7c3aed", [1, 2, 3, 4, 3, 5, 6]);
  }
});

function updateReportCards(data) {
  const salesEl = document.getElementById("salesAmount");
  const profitEl = document.getElementById("profitAmount");
  const expenseEl = document.getElementById("expenseAmount");
  const netEl = document.getElementById("netAmount");

  if (salesEl) salesEl.innerText = peso(data.totalSales);
  if (profitEl) profitEl.innerText = peso(data.grossProfit);
  if (expenseEl) expenseEl.innerText = peso(data.totalExpenses);
  if (netEl) netEl.innerText = peso(data.netProfit);
}

const typingText = document.getElementById("typingText");

if (typingText) {
  const lines = [
    "Manage Sales",
    "Track Inventory",
    "Monitor Expenses",
    "Handle Customers",
    "Manage Employees",
    "Track Profit",
    "One Smart System",
  ];

  let lineIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function typeLoop() {
    const currentText = lines[lineIndex];

    if (!isDeleting) {
      typingText.textContent = currentText.substring(0, charIndex + 1);

      charIndex++;

      if (charIndex === currentText.length) {
        isDeleting = true;

        setTimeout(typeLoop, 1400);

        return;
      }
    } else {
      typingText.textContent = currentText.substring(0, charIndex - 1);

      charIndex--;

      if (charIndex === 0) {
        isDeleting = false;

        lineIndex++;

        if (lineIndex >= lines.length) {
          lineIndex = 0;
        }
      }
    }

    setTimeout(typeLoop, isDeleting ? 35 : 70);
  }

  typeLoop();
}
if (isDashboardPage) {
  loadAll();
}
