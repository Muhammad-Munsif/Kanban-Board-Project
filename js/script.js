document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const board = document.getElementById("board");
  const addTaskBtn = document.getElementById("add-task-btn");
  const taskModal = document.getElementById("task-modal");
  const detailModal = document.getElementById("detail-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const closeDetailModalBtn = document.getElementById("close-detail-modal");
  const cancelTaskBtn = document.getElementById("cancel-task");
  const taskForm = document.getElementById("task-form");
  const editTaskBtn = document.getElementById("edit-task-btn");
  const deleteTaskBtn = document.getElementById("delete-task-btn");
  const addTaskToColumnBtns = document.querySelectorAll(".add-task-to-column");

  // Task data
  let tasks = JSON.parse(localStorage.getItem("kanban-tasks")) || [];
  let currentTaskId = null;

  // Initialize the board
  function initBoard() {
    renderTasks();
    setupDragAndDrop();
    updateTaskCounts();
  }

  // Render all tasks
  function renderTasks() {
    // Clear all columns
    document.querySelectorAll('[id$="-tasks"]').forEach((column) => {
      column.innerHTML = "";
    });

    // Render each task
    tasks.forEach((task) => {
      renderTask(task);
    });
  }

  // Render a single task
  function renderTask(task) {
    const column = document.getElementById(`${task.status}-tasks`);
    if (!column) return;

    const taskElement = document.createElement("div");
    taskElement.className =
      "task-card bg-white p-3 rounded-md shadow cursor-move border-l-4";
    taskElement.dataset.taskId = task.id;
    taskElement.draggable = true;

    // Set border color based on priority
    if (task.priority === "high") {
      taskElement.classList.add("border-red-500");
    } else if (task.priority === "medium") {
      taskElement.classList.add("border-yellow-500");
    } else {
      taskElement.classList.add("border-green-500");
    }

    taskElement.innerHTML = `
            <h3 class="font-medium text-gray-800 truncate">${task.title}</h3>
            <p class="text-sm text-gray-600 mt-1 line-clamp-2">${
              task.description || "No description"
            }</p>
            <div class="flex justify-between items-center mt-3">
                <span class="text-xs text-gray-500">${formatDate(
                  task.dueDate
                )}</span>
                <span class="priority-${
                  task.priority
                } px-2 py-1 text-xs font-semibold rounded-full">${
      task.priority
    }</span>
            </div>
        `;

    // Add click event to show task details
    taskElement.addEventListener("click", () => showTaskDetails(task.id));

    column.appendChild(taskElement);
  }

  // Show task details modal
  function showTaskDetails(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    currentTaskId = taskId;

    // Populate detail modal
    document.getElementById("detail-title").textContent = task.title;
    document.getElementById("detail-description").textContent =
      task.description || "No description provided";
    document.getElementById("detail-due-date").textContent = task.dueDate
      ? formatDate(task.dueDate)
      : "No due date";
    document.getElementById(
      "detail-created-at"
    ).textContent = `Created on ${formatDate(task.createdAt)}`;

    // Set status and priority badges
    const statusBadge = document.getElementById("detail-status");
    statusBadge.textContent = getStatusText(task.status);
    statusBadge.className = `inline-block px-2 py-1 text-xs font-semibold rounded-full mr-2 status-${task.status}`;

    const priorityBadge = document.getElementById("detail-priority");
    priorityBadge.textContent = task.priority;
    priorityBadge.className = `inline-block px-2 py-1 text-xs font-semibold rounded-full priority-${task.priority}`;

    // Show modal
    detailModal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  // Get display text for status
  function getStatusText(status) {
    const statusMap = {
      backlog: "Backlog",
      "in-progress": "In Progress",
      "in-review": "In Review",
      done: "Done",
    };
    return statusMap[status] || status;
  }

  // Update task counts in each column
  function updateTaskCounts() {
    const counts = {
      backlog: 0,
      "in-progress": 0,
      "in-review": 0,
      done: 0,
    };

    tasks.forEach((task) => {
      counts[task.status]++;
    });

    document.getElementById("backlog-count").textContent = counts.backlog;
    document.getElementById("in-progress-count").textContent =
      counts["in-progress"];
    document.getElementById("in-review-count").textContent =
      counts["in-review"];
    document.getElementById("done-count").textContent = counts.done;
  }

  // Setup drag and drop functionality
  function setupDragAndDrop() {
    const taskElements = document.querySelectorAll(".task-card");
    const columns = document.querySelectorAll('[id$="-tasks"]');

    // Add drag events to each task
    taskElements.forEach((task) => {
      task.addEventListener("dragstart", handleDragStart);
      task.addEventListener("dragend", handleDragEnd);
    });

    // Add drop events to each column
    columns.forEach((column) => {
      column.addEventListener("dragover", handleDragOver);
      column.addEventListener("dragenter", handleDragEnter);
      column.addEventListener("dragleave", handleDragLeave);
      column.addEventListener("drop", handleDrop);
    });
  }

  // Drag start handler
  function handleDragStart(e) {
    e.target.classList.add("dragging");
    e.dataTransfer.setData("text/plain", e.target.dataset.taskId);
  }

  // Drag end handler
  function handleDragEnd(e) {
    e.target.classList.remove("dragging");
  }

  // Drag over handler
  function handleDragOver(e) {
    e.preventDefault();
  }

  // Drag enter handler
  function handleDragEnter(e) {
    e.preventDefault();
    e.target.closest(".column").classList.add("drag-over");
  }

  // Drag leave handler
  function handleDragLeave(e) {
    e.target.closest(".column").classList.remove("drag-over");
  }

  // Drop handler
  function handleDrop(e) {
    e.preventDefault();
    e.target.closest(".column").classList.remove("drag-over");

    const taskId = e.dataTransfer.getData("text/plain");
    const newStatus = e.target.closest('[id$="-tasks"]').dataset.status;

    // Update task status
    updateTaskStatus(taskId, newStatus);
  }

  // Update task status
  function updateTaskStatus(taskId, newStatus) {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    tasks[taskIndex].status = newStatus;
    saveTasks();
    renderTasks();
    updateTaskCounts();
  }

  // Save tasks to localStorage
  function saveTasks() {
    localStorage.setItem("kanban-tasks", JSON.stringify(tasks));
  }

  // Show add task modal
  function showAddTaskModal(status = "backlog") {
    // Reset form
    taskForm.reset();
    document.getElementById("task-status").value = status;
    currentTaskId = null;

    // Show modal
    taskModal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }

  // Close all modals
  function closeAllModals() {
    taskModal.classList.add("hidden");
    detailModal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }

  // Handle task form submission
  function handleTaskFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById("task-title").value.trim();
    const description = document
      .getElementById("task-description")
      .value.trim();
    const status = document.getElementById("task-status").value;
    const priority = document.getElementById("task-priority").value;
    const dueDate = document.getElementById("task-due-date").value;

    if (!title) {
      alert("Task title is required");
      return;
    }

    if (currentTaskId) {
      // Update existing task
      const taskIndex = tasks.findIndex((t) => t.id === currentTaskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          title,
          description,
          status,
          priority,
          dueDate,
        };
      }
    } else {
      // Create new task
      const newTask = {
        id: Date.now().toString(),
        title,
        description,
        status,
        priority,
        dueDate,
        createdAt: new Date().toISOString(),
      };
      tasks.push(newTask);
    }

    saveTasks();
    renderTasks();
    updateTaskCounts();
    closeAllModals();
  }

  // Handle edit task
  function handleEditTask() {
    if (!currentTaskId) return;

    const task = tasks.find((t) => t.id === currentTaskId);
    if (!task) return;

    // Fill form with task data
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-description").value = task.description || "";
    document.getElementById("task-status").value = task.status;
    document.getElementById("task-priority").value = task.priority;
    document.getElementById("task-due-date").value = task.dueDate || "";

    // Switch to task modal
    detailModal.classList.add("hidden");
    taskModal.classList.remove("hidden");
  }

  // Handle delete task
  function handleDeleteTask() {
    if (!currentTaskId) return;

    if (confirm("Are you sure you want to delete this task?")) {
      tasks = tasks.filter((t) => t.id !== currentTaskId);
      saveTasks();
      renderTasks();
      updateTaskCounts();
      closeAllModals();
    }
  }

  // Event Listeners
  addTaskBtn.addEventListener("click", () => showAddTaskModal());
  closeModalBtn.addEventListener("click", closeAllModals);
  closeDetailModalBtn.addEventListener("click", closeAllModals);
  cancelTaskBtn.addEventListener("click", closeAllModals);
  taskForm.addEventListener("submit", handleTaskFormSubmit);
  editTaskBtn.addEventListener("click", handleEditTask);
  deleteTaskBtn.addEventListener("click", handleDeleteTask);

  // Add task to specific column buttons
  addTaskToColumnBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const status = btn.dataset.status;
      showAddTaskModal(status);
    });
  });

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === taskModal || e.target === detailModal) {
      closeAllModals();
    }
  });

  // Initialize the board
  initBoard();

  // Add some sample tasks if the board is empty
  if (tasks.length === 0) {
    tasks = [
      {
        id: "1",
        title: "Design new logo",
        description: "Create logo concepts for the new branding",
        status: "backlog",
        priority: "high",
        dueDate: "2023-12-15",
        createdAt: "2023-11-01",
      },
      {
        id: "2",
        title: "Implement user authentication",
        description: "Add login and registration functionality",
        status: "in-progress",
        priority: "medium",
        dueDate: "2023-11-30",
        createdAt: "2023-10-25",
      },
      {
        id: "3",
        title: "Write API documentation",
        description: "Document all endpoints for the REST API",
        status: "in-review",
        priority: "low",
        dueDate: "2023-11-20",
        createdAt: "2023-11-05",
      },
      {
        id: "4",
        title: "Setup CI/CD pipeline",
        description:
          "Configure GitHub Actions for automated testing and deployment",
        status: "done",
        priority: "high",
        dueDate: "2023-11-10",
        createdAt: "2023-10-15",
      },
    ];
    saveTasks();
    renderTasks();
    updateTaskCounts();
  }
});
