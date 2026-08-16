const storageKey = "uangHematData";

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

let state = JSON.parse(localStorage.getItem(storageKey)) || {
  transactions: [],
  goal: {
    name: "Liburan impian",
    target: 1000000,
    saved: 0
  }
};

function formatRupiah(number) {
  return money.format(number);
}

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function calculateTotals() {
  let income = 0;
  let expense = 0;

  state.transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      income += transaction.amount;
    } else {
      expense += transaction.amount;
    }
  });

  return {
    income,
    expense,
    balance: income - expense - state.goal.saved
  };
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function render() {
  const totals = calculateTotals();

  document.getElementById("income").textContent = formatRupiah(totals.income);
  document.getElementById("expense").textContent = formatRupiah(totals.expense);
  document.getElementById("saved").textContent = formatRupiah(state.goal.saved);
  document.getElementById("balance").textContent = formatRupiah(totals.balance);

  document.getElementById("balanceHint").textContent =
    totals.balance < 0
      ? "Pengeluaran dan tabungan melebihi pemasukan."
      : "Sisa uangmu bisa dipakai untuk kebutuhan atau ditabung.";

  document.getElementById("goalTitle").textContent = state.goal.name;
  document.getElementById("goalSaved").textContent = formatRupiah(state.goal.saved);
  document.getElementById("goalTarget").textContent = formatRupiah(state.goal.target);

  const percentage = Math.min(
    100,
    Math.round((state.goal.saved / state.goal.target) * 100) || 0
  );

  document.getElementById("progressBar").style.width = `${percentage}%`;
  document.getElementById("goalPercent").textContent = `${percentage}% tercapai`;

  document.getElementById("goalName").value = state.goal.name;
  document.getElementById("goalAmount").value = state.goal.target;

  const history = document.getElementById("history");

  if (state.transactions.length === 0) {
    history.innerHTML = "<p>Belum ada transaksi.</p>";
    return;
  }

  history.innerHTML = state.transactions
    .slice(0, 8)
    .map((transaction) => {
      const sign = transaction.type === "income" ? "+" : "−";
      const icon = transaction.type === "income" ? "↗" : "↘";

      return `
        <div class="transaction ${transaction.type}">
          <div class="transaction-icon">${icon}</div>
          <div class="transaction-info">
            <strong>${escapeHtml(transaction.title)}</strong>
            <span>${escapeHtml(transaction.category)}</span>
          </div>
          <strong class="transaction-amount">
            ${sign}${formatRupiah(transaction.amount)}
          </strong>
        </div>
      `;
    })
    .join("");
}

document.getElementById("transactionForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);

  state.transactions.unshift({
    type: formData.get("type"),
    title: formData.get("title"),
    amount: Number(formData.get("amount")),
    category: formData.get("category")
  });

  saveData();
  event.target.reset();
  render();
});

document.getElementById("goalForm").addEventListener("submit", (event) => {
  event.preventDefault();

  state.goal.name = document.getElementById("goalName").value;
  state.goal.target = Number(document.getElementById("goalAmount").value);

  saveData();
  render();
});

document.getElementById("savingForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(document.getElementById("savingAmount").value);

  state.goal.saved += amount;

  saveData();
  document.getElementById("savingAmount").value = "";
  document.getElementById("savingNote").textContent =
    `${formatRupiah(amount)} berhasil ditambahkan ke tabungan.`;

  render();
});

document.getElementById("clearButton").addEventListener("click", () => {
  const confirmed = confirm("Hapus semua transaksi?");

  if (!confirmed) return;

  state.transactions = [];
  saveData();
  render();
});

document.getElementById("receiptButton").addEventListener("click", () => {
  const totals = calculateTotals();

  document.getElementById("receiptDate").textContent =
    new Date().toLocaleString("id-ID");

  document.getElementById("receiptIncome").textContent =
    formatRupiah(totals.income);

  document.getElementById("receiptExpense").textContent =
    formatRupiah(totals.expense);

  document.getElementById("receiptSaving").textContent =
    formatRupiah(state.goal.saved);

  document.getElementById("receiptBalance").textContent =
    formatRupiah(totals.balance);

  const items = document.getElementById("receiptItems");

  items.innerHTML = state.transactions.length
    ? state.transactions
        .slice(0, 6)
        .map((transaction) => {
          const sign = transaction.type === "income" ? "+" : "−";

          return `
            <div class="receipt-item">
              <span>${escapeHtml(transaction.title)}</span>
              <strong>${sign}${formatRupiah(transaction.amount)}</strong>
            </div>
          `;
        })
        .join("")
    : "<p>Belum ada transaksi.</p>";

  document.getElementById("receiptDialog").showModal();
});

document.getElementById("closeReceipt").addEventListener("click", () => {
  document.getElementById("receiptDialog").close();
});

document.getElementById("printReceipt").addEventListener("click", () => {
  window.print();
});

document.getElementById("resetAppButton").addEventListener("click", () => {
  const confirmed = confirm(
    "Yakin ingin menghapus semua transaksi, tabungan, dan target?"
  );

  if (!confirmed) return;

  localStorage.removeItem(storageKey);
  location.reload();
});

document.getElementById("today").textContent =
  new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

render();