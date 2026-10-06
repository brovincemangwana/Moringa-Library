const Store = (() => {
  const KEY = "school-library-v1";
  const seed = {
    books: [
      { id: 1, title: "Things Fall Apart", author: "Chinua Achebe", category: "Fiction", borrowedBy: null, due: null },
      { id: 2, title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", borrowedBy: null, due: null },
      { id: 3, title: "The River Between", author: "Ngũgĩ wa Thiong'o", category: "Fiction", borrowedBy: null, due: null }
    ],
    members: [
      { id: 1, name: "Amina Wanjiru", className: "Form 3B" }
    ]
  };

  let data = JSON.parse(localStorage.getItem(KEY) || "null") || seed;
  const listeners = [];

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(data));
    listeners.forEach(fn => fn());
  };

  return {
    get books() { return data.books; },
    get members() { return data.members; },
    onChange(fn) { listeners.push(fn); },
    save,
    nextId(list) { return list.length ? Math.max(...list.map(i => i.id)) + 1 : 1; }
  };
})();

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

const bookList = document.getElementById("book-list");
const bookEmpty = document.getElementById("book-empty");
const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("filter-status");

function renderCatalog() {
  const q = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  const shown = Store.books.filter(b =>
    (b.title + " " + b.author).toLowerCase().includes(q) &&
    (status === "all" || (status === "available") === !b.borrowedBy)
  );

  bookList.innerHTML = shown.map(b => `
    <li class="book-card">
      <h3>${escapeHtml(b.title)}</h3>
      <p>${escapeHtml(b.author)} (${escapeHtml(b.category)})</p>
      <span class="badge ${b.borrowedBy ? "out" : ""}">${b.borrowedBy ? "Borrowed" : "Available"}</span>
    </li>`).join("");

  bookEmpty.hidden = shown.length > 0;
}

document.getElementById("add-book-form").addEventListener("submit", e => {
  e.preventDefault();
  Store.books.push({
    id: Store.nextId(Store.books),
    title: document.getElementById("book-title").value.trim(),
    author: document.getElementById("book-author").value.trim(),
    category: document.getElementById("book-category").value,
    borrowedBy: null,
    due: null
  });
  Store.save();
  e.target.reset();
});

searchInput.addEventListener("input", renderCatalog);
statusFilter.addEventListener("change", renderCatalog);
Store.onChange(renderCatalog);
renderCatalog();

const LOAN_DAYS = 14;
const memberSelect = document.getElementById("borrow-member");
const bookSelect = document.getElementById("borrow-book");
const loansBody = document.querySelector("#loans-table tbody");
const loansEmpty = document.getElementById("loans-empty");
const memberList = document.getElementById("member-list");

function renderCirculation() {
  memberSelect.innerHTML = Store.members
    .map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("");

  bookSelect.innerHTML = Store.books
    .filter(b => !b.borrowedBy)
    .map(b => `<option value="${b.id}">${escapeHtml(b.title)}</option>`).join("");

  memberList.innerHTML = Store.members
    .map(m => `<li>${escapeHtml(m.name)}, ${escapeHtml(m.className)}</li>`).join("");

  const loans = Store.books.filter(b => b.borrowedBy);
  const today = new Date().toISOString().slice(0, 10);

  loansBody.innerHTML = loans.map(b => {
    const m = Store.members.find(x => x.id === b.borrowedBy);
    const late = b.due < today;
    return `<tr>
      <td>${escapeHtml(b.title)}</td>
      <td>${m ? escapeHtml(m.name) : "Unknown"}</td>
      <td class="${late ? "overdue" : ""}">${b.due}${late ? " (overdue)" : ""}</td>
      <td><button data-return="${b.id}">Return</button></td>
    </tr>`;
  }).join("");

  loansEmpty.hidden = loans.length > 0;
}

document.getElementById("borrow-form").addEventListener("submit", e => {
  e.preventDefault();
  const book = Store.books.find(b => b.id === Number(bookSelect.value));
  if (!book) return;
  const due = new Date();
  due.setDate(due.getDate() + LOAN_DAYS);
  book.borrowedBy = Number(memberSelect.value);
  book.due = due.toISOString().slice(0, 10);
  Store.save();
});

loansBody.addEventListener("click", e => {
  const id = e.target.dataset.return;
  if (!id) return;
  const book = Store.books.find(b => b.id === Number(id));
  book.borrowedBy = null;
  book.due = null;
  Store.save();
});

document.getElementById("member-form").addEventListener("submit", e => {
  e.preventDefault();
  Store.members.push({
    id: Store.nextId(Store.members),
    name: document.getElementById("member-name").value.trim(),
    className: document.getElementById("member-class").value.trim()
  });
  Store.save();
  e.target.reset();
});

Store.onChange(renderCirculation);
renderCirculation();