const STORAGE_KEY = "pm_passwords";
const THEME_KEY = "pm_theme";

const form = document.getElementById("passwordForm");
const websiteInput = document.getElementById("websiteInput");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const searchInput = document.getElementById("searchInput");
const tableBody = document.getElementById("passwordTableBody");
const rowTemplate = document.getElementById("passwordRowTemplate");
const saveButton = document.getElementById("saveButton");
const cancelEditBtn = document.getElementById("cancelEdit");
const themeToggle = document.getElementById("themeToggle");
const generateBtn = document.getElementById("generatePassword");
const splashScreen = document.getElementById("splashScreen");

let passwords = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    passwords = loadPasswords();
    renderPasswords();
    handleSplashScreen();
});

form.addEventListener("submit", event => {
    event.preventDefault();
    const website = websiteInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!website || !username || !password) return;

    if (editingId) {
        updatePassword(editingId, { website, username, password });
    } else {
        addPassword({ website, username, password });
    }

    resetForm();
    renderPasswords();
});

form.addEventListener("reset", () => {
    resetForm();
});

searchInput.addEventListener("input", () => {
    renderPasswords(searchInput.value.trim().toLowerCase());
});

tableBody.addEventListener("click", event => {
    const row = event.target.closest("tr");
    if (!row || !row.dataset.id) return;
    const entry = passwords.find(item => item.id === row.dataset.id);
    if (!entry) return;

    if (event.target.matches(".delete-btn")) {
        deletePassword(entry.id);
        renderPasswords();
    } else if (event.target.matches(".edit-btn")) {
        startEdit(entry);
    } else if (event.target.matches(".copy-btn")) {
        copyToClipboard(decode(entry.password));
        event.target.textContent = "Copied!";
        setTimeout(() => (event.target.textContent = "Copy"), 1200);
    }
});

themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
});

generateBtn.addEventListener("click", () => {
    passwordInput.value = generatePassword();
});

function addPassword({ website, username, password }) {
    const passwordObj = {
        id: crypto.randomUUID(),
        website,
        username,
        password: encode(password),
        createdAt: Date.now()
    };
    passwords.push(passwordObj);
    persist();
}

function updatePassword(id, { website, username, password }) {
    passwords = passwords.map(item =>
        item.id === id
            ? {
                  ...item,
                  website,
                  username,
                  password: encode(password),
                  updatedAt: Date.now()
              }
            : item
    );
    persist();
}

function deletePassword(id) {
    passwords = passwords.filter(item => item.id !== id);
    persist();
}

function startEdit(entry) {
    editingId = entry.id;
    websiteInput.value = entry.website;
    usernameInput.value = entry.username;
    passwordInput.value = decode(entry.password);
    saveButton.textContent = "Update Password";
    cancelEditBtn.hidden = false;
}

function resetForm() {
    form.reset();
    editingId = null;
    saveButton.textContent = "Save Password";
    cancelEditBtn.hidden = true;
}

function renderPasswords(filter = "") {
    tableBody.innerHTML = "";
    const filtered = passwords.filter(entry => {
        const text = `${entry.website} ${entry.username}`.toLowerCase();
        return text.includes(filter);
    });

    if (filtered.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.classList.add("empty");
        emptyRow.innerHTML = '<td colspan="4">No matching passwords.</td>';
        tableBody.appendChild(emptyRow);
        return;
    }

    filtered.forEach(entry => {
        const clone = rowTemplate.content.cloneNode(true);
        const row = clone.querySelector("tr");
        row.dataset.id = entry.id;
        clone.querySelector(".website").textContent = entry.website;
        clone.querySelector(".username").textContent = entry.username;
        clone.querySelector(".password-text").textContent = decode(entry.password);
        tableBody.appendChild(clone);
    });
}

function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passwords));
}

function loadPasswords() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function encode(value) {
    try {
        return btoa(value);
    } catch {
        return value;
    }
}

function decode(value) {
    try {
        return atob(value);
    } catch {
        return value;
    }
}

function copyToClipboard(text) {
    navigator.clipboard?.writeText(text).catch(() => {
        // Fallback: create a temporary element for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
    });
}

function loadTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
    themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    themeToggle.setAttribute("aria-pressed", String(isDark));
}

function generatePassword(length = 14) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let result = "";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        result += charset[array[i] % charset.length];
    }
    return result;
}

// Lightweight splash similar to YouTube's intro logo
function handleSplashScreen() {
    if (!splashScreen) {
        document.body.classList.remove("preloading");
        return;
    }
    setTimeout(() => {
        splashScreen.classList.add("hide");
        document.body.classList.remove("preloading");
        setTimeout(() => splashScreen.remove(), 600);
    }, 2000);
}

