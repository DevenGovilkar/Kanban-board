// ===========================
//   STATE
// ===========================
let tasks = JSON.parse(localStorage.getItem("kanban_tasks")) || [];
let editingId = null;
let deletingId = null;
let draggedId = null;

// ===========================
//   UTILITY
// ===========================
function generateId() {
  return "task-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

function saveTasks() {
  localStorage.setItem("kanban_tasks", JSON.stringify(tasks));
}

function showToast(msg = "Done!", type = "success") {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  toastMsg.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
}

// ===========================
//   RENDER
// ===========================
function renderBoard() {
  const statuses = ["todo", "inprogress", "review", "done"];

  statuses.forEach((status) => {
    const list = document.getElementById(`${status}List`);
    const count = document.getElementById(`${status}Count`);
    const filtered = tasks.filter((t) => t.status === status);

    count.textContent = filtered.length;
    list.innerHTML = "";

    filtered.forEach((task) => {
      const card = createCard(task);
      list.appendChild(card);
    });
  });

  // Total badge
  document.getElementById("totalCount").textContent =
    tasks.length + (tasks.length === 1 ? " task" : " tasks");
}

function createCard(task) {
  const card = document.createElement("div");
  card.className = `task-card${task.status === "done" ? " task--done" : ""}`;
  card.setAttribute("draggable", true);
  card.setAttribute("data-id", task.id);

  card.innerHTML = `
    <div class="task-card__top">
      <span class="task-card__title">${escapeHTML(task.title)}</span>
      <div class="task-card__actions">
        <button class="btn btn--icon" onclick="openEditModal('${task.id}')" title="Edit">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn--icon" onclick="openDeleteModal('${task.id}')" title="Delete" style="color: var(--danger)">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
    ${task.desc ? `<p class="task-card__desc">${escapeHTML(task.desc)}</p>` : ""}
    <div class="task-card__footer">
      <div class="task-card__meta">
        <span class="priority-badge priority-badge--${task.priority}">${task.priority}</span>
        ${task.tag ? `<span class="tag-badge">${escapeHTML(task.tag)}</span>` : ""}
      </div>
      <span class="task-card__id">#${task.id.slice(-4)}</span>
    </div>
  `;

  // Drag events
  card.addEventListener("dragstart", (e) => {
    draggedId = task.id;
    setTimeout(() => card.classList.add("dragging"), 0);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    draggedId = null;
    document.querySelectorAll(".column__body").forEach((col) =>
      col.classList.remove("drag-over")
    );
  });

  return card;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===========================
//   DRAG & DROP
// ===========================
function allowDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.add("drag-over");
}

function drop(e, newStatus) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");

  if (!draggedId) return;

  const task = tasks.find((t) => t.id === draggedId);
  if (task && task.status !== newStatus) {
    task.status = newStatus;
    saveTasks();
    renderBoard();
    showToast(`Moved to ${statusLabel(newStatus)}`);
  }
}

// Remove drag-over highlight when leaving
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".column__body").forEach((col) => {
    col.addEventListener("dragleave", (e) => {
      if (!col.contains(e.relatedTarget)) {
        col.classList.remove("drag-over");
      }
    });
  });
});

function statusLabel(status) {
  return { todo: "To Do", inprogress: "In Progress", review: "Review", done: "Done" }[status] || status;
}

// ===========================
//   MODAL — ADD / EDIT
// ===========================
function openAddModal(status = "todo") {
  editingId = null;
  document.getElementById("modalTitle").textContent = "Add New Task";
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskPriority").value = "medium";
  document.getElementById("taskStatus").value = status;
  document.getElementById("taskTag").value = "";
  document.getElementById("charCount").textContent = "0/80";
  document.getElementById("saveTaskBtn").textContent = "Save Task";
  toggleModal("modalOverlay", true);
  document.getElementById("taskTitle").focus();
}

function openEditModal(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  editingId = id;
  document.getElementById("modalTitle").textContent = "Edit Task";
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDesc").value = task.desc || "";
  document.getElementById("taskPriority").value = task.priority;
  document.getElementById("taskStatus").value = task.status;
  document.getElementById("taskTag").value = task.tag || "";
  document.getElementById("charCount").textContent = `${task.title.length}/80`;
  document.getElementById("saveTaskBtn").textContent = "Update Task";
  toggleModal("modalOverlay", true);
  document.getElementById("taskTitle").focus();
}

function closeAddModal() {
  toggleModal("modalOverlay", false);
}

// ===========================
//   MODAL — DELETE
// ===========================
function openDeleteModal(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  deletingId = id;
  document.getElementById("deleteTaskName").textContent = `"${task.title}"`;
  toggleModal("deleteOverlay", true);
}

function closeDeleteModal() {
  toggleModal("deleteOverlay", false);
  deletingId = null;
}

// ===========================
//   TASK CRUD
// ===========================
function saveTask() {
  const title = document.getElementById("taskTitle").value.trim();
  if (!title) {
    document.getElementById("taskTitle").focus();
    document.getElementById("taskTitle").style.borderColor = "var(--danger)";
    setTimeout(() => (document.getElementById("taskTitle").style.borderColor = ""), 1500);
    return;
  }

  const taskData = {
    title,
    desc: document.getElementById("taskDesc").value.trim(),
    priority: document.getElementById("taskPriority").value,
    status: document.getElementById("taskStatus").value,
    tag: document.getElementById("taskTag").value.trim(),
  };

  if (editingId) {
    const idx = tasks.findIndex((t) => t.id === editingId);
    if (idx !== -1) tasks[idx] = { ...tasks[idx], ...taskData };
    showToast("Task updated!");
  } else {
    tasks.push({ id: generateId(), createdAt: Date.now(), ...taskData });
    showToast("Task added!");
  }

  saveTasks();
  renderBoard();
  closeAddModal();
}

function deleteTask() {
  if (!deletingId) return;
  tasks = tasks.filter((t) => t.id !== deletingId);
  saveTasks();
  renderBoard();
  closeDeleteModal();
  showToast("Task deleted");
}

function clearAll() {
  if (!tasks.length) return;
  if (confirm("Clear all tasks? This cannot be undone.")) {
    tasks = [];
    saveTasks();
    renderBoard();
    showToast("Board cleared");
  }
}

// ===========================
//   TOGGLE MODAL HELPER
// ===========================
function toggleModal(id, show) {
  document.getElementById(id).classList.toggle("active", show);
}

// ===========================
//   EVENT LISTENERS
// ===========================
document.getElementById("addTaskBtn").addEventListener("click", () => openAddModal());
document.getElementById("clearAllBtn").addEventListener("click", clearAll);
document.getElementById("saveTaskBtn").addEventListener("click", saveTask);
document.getElementById("cancelBtn").addEventListener("click", closeAddModal);
document.getElementById("closeModal").addEventListener("click", closeAddModal);

document.getElementById("confirmDeleteBtn").addEventListener("click", deleteTask);
document.getElementById("cancelDeleteBtn").addEventListener("click", closeDeleteModal);
document.getElementById("closeDeleteModal").addEventListener("click", closeDeleteModal);

// Column + buttons
document.querySelectorAll(".column__add").forEach((btn) => {
  btn.addEventListener("click", () => openAddModal(btn.dataset.status));
});

// Close modal on overlay click
document.getElementById("modalOverlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeAddModal();
});
document.getElementById("deleteOverlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeDeleteModal();
});

// Keyboard: Enter to save, Escape to close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAddModal();
    closeDeleteModal();
  }
  if (e.key === "Enter" && document.getElementById("modalOverlay").classList.contains("active")) {
    const active = document.activeElement;
    if (active.tagName !== "TEXTAREA" && active.tagName !== "SELECT") {
      saveTask();
    }
  }
});

// Character counter
document.getElementById("taskTitle").addEventListener("input", function () {
  document.getElementById("charCount").textContent = `${this.value.length}/80`;
});

// ===========================
//   SEED DATA (first load)
// ===========================
function seedData() {
  if (tasks.length > 0) return;
  tasks = [
    {
      id: generateId(),
      title: "Design landing page wireframe",
      desc: "Create low-fidelity mockups for the homepage and hero section.",
      priority: "high",
      status: "todo",
      tag: "Design",
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      title: "Set up project repository",
      desc: "Initialize Git repo, add .gitignore, and push initial commit.",
      priority: "medium",
      status: "done",
      tag: "DevOps",
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      title: "Build authentication API",
      desc: "JWT-based login and register endpoints with bcrypt hashing.",
      priority: "high",
      status: "inprogress",
      tag: "Backend",
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      title: "Code review: dashboard module",
      desc: "Review PR #42 for performance issues and naming conventions.",
      priority: "medium",
      status: "review",
      tag: "Frontend",
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      title: "Write unit tests for user service",
      desc: "Cover all CRUD operations with Jest test cases.",
      priority: "low",
      status: "todo",
      tag: "Testing",
      createdAt: Date.now(),
    },
  ];
  saveTasks();
}

// ===========================
//   INIT
// ===========================
seedData();
renderBoard();
