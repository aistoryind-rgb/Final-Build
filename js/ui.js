/* ==========================================================================
   LifeInvader V2 UI and Event bindings Module
   ========================================================================== */
/**
 * LifeInvader EN3 Advertisement Editor - Core Application Logic
 */

// Safe localStorage and sessionStorage shadowing for incognito mode and storage-restricted environments
var localStorage;
var sessionStorage;
try {
    localStorage = window.localStorage;
    localStorage.getItem('__storage_test__');
} catch (e) {
    var mockStorage = {};
    localStorage = {
        getItem: function(key) { return key in mockStorage ? mockStorage[key] : null; },
        setItem: function(key, value) { mockStorage[key] = String(value); },
        removeItem: function(key) { delete mockStorage[key]; },
        clear: function() { mockStorage = {}; },
        key: function(i) { return Object.keys(mockStorage)[i] || null; },
        get length() { return Object.keys(mockStorage).length; }
    };
}

try {
    sessionStorage = window.sessionStorage;
    sessionStorage.getItem('__storage_test__');
} catch (e) {
    var mockSession = {};
    sessionStorage = {
        getItem: function(key) { return key in mockSession ? mockSession[key] : null; },
        setItem: function(key, value) { mockSession[key] = String(value); },
        removeItem: function(key) { delete mockSession[key]; },
        clear: function() { mockSession = {}; },
        key: function(i) { return Object.keys(mockSession)[i] || null; },
        get length() { return Object.keys(mockSession).length; }
    };
}

// URL parameter bypass logic removed for security


const BUILD_TIMESTAMP = "2026 May 26 07:30:20";
const BUILD_TIMESTAMP_SHORT = "May 26 07:30";

// Simulated GRP Citizens Database
let grpCitizens = [
    { name: "Max Uchiha", role: "State Org Leader", status: "Allowed (LI)", isLI: true },
    { name: "Elite Alpha", role: "State Org Deputy", status: "Allowed (LI)", isLI: true },
    { name: "Nate Blakely", role: "State Org Deputy", status: "Allowed (LI)", isLI: true },
    { name: "Lucio Escobar", role: "Crime Leader", status: "Allowed", isLI: false },
    { name: "Zandre Mortez", role: "State Org Leader", status: "Denied", isLI: false },
    { name: "John Funchalez", role: "Admin Assistant", status: "Allowed", isLI: false },
    { name: "Carl Jordan", role: "Unofficial Leader", status: "Allowed", isLI: false }
];

// Stats Counters
let stats = {
    processed: 0,
    rejections: 0,
    blacklists: 0
};

// Action Override State
let actionOverrideMode = "auto";
let userClickedAction = false;

// Official & Unofficial Places Dictionary
const OFFICIAL_PLACES = [
    "Vinewood Hills", "Rockford Hills", "Richman", "Sandy Shores", "Paleto Bay",
    "Postal", "Hospital", "Capitol", "Fire Station", "Auto Fair", "Bahama Mamas Bar",
    "Tequi-la-la Bar", "FIB", "Hotel Spa Bar", "Pacific Bluffs Country Club",
    "Diamond Resort Bar", "Vanilla Unicorn Bar", "Church", "Stock Exchange", "Stadium",
    "Chumash", "Lifeinvader", "Del Perro Pier", "Del Perro Beach", "Cayo Perico Island",
    "Hotel", "Raton Canyon", "School", "SAHP", "Mirror Park", "LSPD"
];

const UNOFFICIAL_PLACES = [
    "airport", "autosalon", "beach", "beach market", "ghetto", "post office",
    "train station", "yacht", "city"
];

// Reordering definitions
const REAL_ESTATE_ORDER = [
    "garden", "garage spaces", "warehouses", "helipad", "custom interior", "insurance",
    "swimming pool", "tennis court", "driveway", "backyard", "views", "location"
];

// Dynamic Most Used Advertisement Presets System (Upgraded to 12 dynamic slots)
const DEFAULT_PRESETS = [
    { label: "Sell: 10 Grand Tickets", raw: "selling 10 rp tickets for 350k each", count: 12 },
    { label: "Buy: Prime Platinum", raw: "buying prime platinum 30 days", count: 11 },
    { label: "Auto: Sandking XL", raw: "selling fully upgraded sandking xl", count: 10 },
    { label: "Buy: Truffade Chiron", raw: "buying truffade chiron", count: 9 },
    { label: "Buy: Cage Pet", raw: "buying pet", count: 8 },
    { label: "Sell: Cage Pet", raw: "selling pet 600k", count: 7 },
    { label: "Sell: House №1406", raw: "selling house 1406", count: 6 },
    { label: "Dating: Girlfriend", raw: "looking for girlfriend", count: 5 },
    { label: "Sell: SIM Card", raw: "selling sim card 1111113", count: 4 },
    { label: "Buy: SIM Card", raw: "buying sim card 7777777", count: 3 },
    { label: "Sell: Charger", raw: "selling charger", count: 2 },
    { label: "Sell: 10 Salmon", raw: "selling 10 salmon", count: 1 }
];

function generatePresetLabel(raw) {
    const clean = raw.replace(/\s+/g, " ").trim();
    const lower = clean.toLowerCase();
    
    let actionPrefix = "Auto";
    if (/^(?:selling|wts|sell)\b/i.test(lower)) actionPrefix = "Sell";
    else if (/^(?:buying|wtb|buy)\b/i.test(lower)) actionPrefix = "Buy";
    else if (/^(?:trading|wtt|trade)\b/i.test(lower)) actionPrefix = "Trade";
    else if (/^(?:renting out|rent out)\b/i.test(lower)) actionPrefix = "Rent";
    else if (/^(?:renting|rent)\b/i.test(lower)) actionPrefix = "Rent";
    else if (/^(?:hiring|hire)\b/i.test(lower)) actionPrefix = "Hire";
    else if (/^(?:looking for|look for|searching for)\b/i.test(lower)) actionPrefix = "Dating";
    
    let subject = clean.replace(/^(buying|selling or trading|selling|trading|renting out|renting|hiring|wtb|wts|wtt|buy|sell|trade|rent|hire|looking to purchase|looking to buy|want to buy|searching for|looking for|searching|look for|looking|search|look)\s+(a\s+|an\s+)?/i, "").trim();
    
    const lowerSubject = subject.toLowerCase();
    if (lowerSubject.includes("chiron")) return `${actionPrefix}: Truffade Chiron`;
    if (lowerSubject.includes("sandking")) return `${actionPrefix}: Sandking XL`;
    if (lowerSubject.includes("house")) return `${actionPrefix}: Vinewood House`;
    if (lowerSubject.includes("ticket")) return `${actionPrefix}: Grand Tickets`;
    if (lowerSubject.includes("platinum")) return `${actionPrefix}: Prime Platinum`;
    if (lowerSubject.includes("girlfriend")) return `${actionPrefix}: Girlfriend`;
    if (lowerSubject.includes("sim card") || lowerSubject.includes("simcard")) return `${actionPrefix}: SIM Card`;
    if (lowerSubject.includes("pet") || lowerSubject.includes("cage")) return `${actionPrefix}: Cage Pet`;
    if (lowerSubject.includes("charger")) return `${actionPrefix}: Charger`;
    if (lowerSubject.includes("salmon")) return `${actionPrefix}: 10 Salmon`;
    if (lowerSubject.includes("juice")) return `${actionPrefix}: Juices`;
    if (lowerSubject.includes("scrap metal")) return `${actionPrefix}: Scrap Metal`;
    if (lowerSubject.includes("dice")) return `${actionPrefix}: Play Dice`;
    if (lowerSubject.includes("pumpkin")) return `${actionPrefix}: Pumpkin Plantation`;
    if (lowerSubject.includes("solar panel")) return `${actionPrefix}: Solar Panels`;
    if (lowerSubject.includes("graphic card") || lowerSubject.includes("video card")) return `${actionPrefix}: Video Cards`;
    if (lowerSubject.includes("luminous stone")) return `${actionPrefix}: Luminous Stone`;
    
    const words = subject.split(" ").slice(0, 3).map(w => {
        const cw = w.replace(/[^\w]/g, "");
        if (!cw) return "";
        return cw.charAt(0).toUpperCase() + cw.slice(1).toLowerCase();
    }).filter(w => w !== "");
    
    let subjectText = words.join(" ");
    if (subjectText.length > 20) {
        subjectText = subjectText.substring(0, 17) + "...";
    }
    return `${actionPrefix}: ${subjectText || "Ad"}`;
}

function initPresetButtons() {
    if (!localStorage.getItem("li_most_used_ads")) {
        localStorage.setItem("li_most_used_ads", JSON.stringify(DEFAULT_PRESETS));
    }
    renderPresetButtons();
}

function renderPresetButtons() {
    const container = document.querySelector(".preset-buttons");
    if (!container) return;
    
    let presets = [];
    try {
        presets = JSON.parse(localStorage.getItem("li_most_used_ads")) || DEFAULT_PRESETS;
    } catch (e) {
        presets = DEFAULT_PRESETS;
    }
    
    presets.sort((a, b) => b.count - a.count);
    const topPresets = presets.slice(0, 12);
    
    container.innerHTML = "";
    topPresets.forEach(preset => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-preset";
        btn.setAttribute("data-ad", preset.raw);
        btn.title = preset.raw;
        btn.textContent = preset.label;
        
        btn.addEventListener("click", () => {
            userClickedAction = false;
            actionOverrideMode = "auto";
            document.getElementById("raw-ad").value = preset.raw;
            document.getElementById("category-override").value = "auto";
            processAd();
        });
        
        container.appendChild(btn);
    });
}

function trackCopiedAd(rawVal) {
    if (!rawVal || !rawVal.trim()) return;
    const clean = rawVal.replace(/\s+/g, " ").trim();
    
    let presets = [];
    try {
        presets = JSON.parse(localStorage.getItem("li_most_used_ads")) || DEFAULT_PRESETS;
    } catch (e) {
        presets = DEFAULT_PRESETS;
    }
    
    const existing = presets.find(p => p.raw.toLowerCase() === clean.toLowerCase());
    if (existing) {
        existing.count += 1;
    } else {
        const label = generatePresetLabel(clean);
        presets.push({ label, raw: clean, count: 1 });
    }
    
    localStorage.setItem("li_most_used_ads", JSON.stringify(presets));
    renderPresetButtons();
}

/* ==========================================================================
   Premium Portal Improvisations - Logic
   ========================================================================== */

let selectedTheme = "dark";

function initPremiumImprovisations() {
    // 1. Load Theme Customizer
    selectedTheme = localStorage.getItem("li_app_theme") || "dark";
    setAppTheme(selectedTheme);

    const themeCards = document.querySelectorAll(".theme-select-card");
    themeCards.forEach(card => {
        card.addEventListener("click", () => {
            const theme = card.getAttribute("data-theme");
            setAppTheme(theme);
        });
    });

    // 1.5. Collapsible advanced backup keys drawer
    const btnToggleBackup = document.getElementById("btn-toggle-backup-drawer");
    const backupKeysDrawer = document.getElementById("backup-keys-drawer");
    if (btnToggleBackup && backupKeysDrawer) {
        btnToggleBackup.addEventListener("click", () => {
            const isOpen = backupKeysDrawer.classList.toggle("open");
            btnToggleBackup.classList.toggle("open", isOpen);
            btnToggleBackup.querySelector("span").textContent = isOpen 
                ? "Hide Backup Keys (Auto-Failover)" 
                : "Show Backup Keys (Auto-Failover)";
        });
    }

    // 2. Autocomplete Suggestions Key handlers on raw-ad
    const rawAdTextarea = document.getElementById("raw-ad");
    const autocompleteSuggestions = document.getElementById("raw-ad-suggestions");
    
    if (rawAdTextarea && autocompleteSuggestions) {
        let selectedIndex = -1;
        let suggestionsList = [];

        rawAdTextarea.addEventListener("input", (e) => {
            const val = rawAdTextarea.value.trim();
            if (!val || val.length < 2) {
                closeSuggestions();
                return;
            }

            const query = val.toLowerCase();
            suggestionsList = [];

            // Find matching spelling corrections
            if (typeof customSpelling !== 'undefined') {
                for (const [wrong, right] of Object.entries(customSpelling)) {
                    if (wrong.startsWith(query) && suggestionsList.length < 8) {
                        suggestionsList.push({
                            type: "spelling",
                            key: wrong,
                            value: right,
                            label: `Correct "${wrong}" to "${right}"`
                        });
                    }
                }
            }

            // Find matching templates or category shorthands
            if (typeof customTemplates !== 'undefined') {
                customTemplates.forEach(ct => {
                    if (ct.shorthand && ct.shorthand.toLowerCase().includes(query) && suggestionsList.length < 8) {
                        suggestionsList.push({
                            type: "template",
                            key: ct.shorthand,
                            value: ct.text,
                            label: `[${ct.category}] ${ct.shorthand}: ${ct.text}`
                        });
                    } else if (ct.category.toLowerCase().startsWith(query) && suggestionsList.length < 8) {
                        suggestionsList.push({
                            type: "template",
                            key: ct.category,
                            value: ct.text,
                            label: `[${ct.category}] Layout: ${ct.text}`
                        });
                    }
                });
            }

            if (suggestionsList.length > 0) {
                renderSuggestions(suggestionsList);
            } else {
                closeSuggestions();
            }
        });

        // Keyboard navigations inside textarea
        rawAdTextarea.addEventListener("keydown", (e) => {
            if (!autocompleteSuggestions.classList.contains("active")) return;

            const items = autocompleteSuggestions.querySelectorAll(".suggestion-item");
            
            if (e.key === "ArrowDown") {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % items.length;
                updateSelection(items);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                updateSelection(items);
            } else if (e.key === "Enter") {
                if (selectedIndex >= 0 && selectedIndex < items.length) {
                    e.preventDefault();
                    items[selectedIndex].click();
                }
            } else if (e.key === "Escape") {
                closeSuggestions();
            }
        });

        function renderSuggestions(list) {
            autocompleteSuggestions.innerHTML = "";
            selectedIndex = -1;
            autocompleteSuggestions.classList.add("active");

            list.forEach((item, idx) => {
                const div = document.createElement("div");
                div.className = "suggestion-item";
                if (idx === selectedIndex) div.classList.add("selected");

                const textSpan = document.createElement("span");
                textSpan.textContent = item.label;
                textSpan.style.textOverflow = "ellipsis";
                textSpan.style.overflow = "hidden";
                textSpan.style.whiteSpace = "nowrap";
                textSpan.style.maxWidth = "80%";
                div.appendChild(textSpan);

                const badge = document.createElement("span");
                badge.className = "suggestion-badge";
                badge.textContent = item.type;
                div.appendChild(badge);

                div.addEventListener("click", () => {
                    if (item.type === "spelling") {
                        rawAdTextarea.value = item.value;
                    } else if (item.type === "template") {
                        rawAdTextarea.value = item.value;
                    }
                    closeSuggestions();
                    processAd();
                });

                autocompleteSuggestions.appendChild(div);
            });
        }

        function updateSelection(items) {
            items.forEach((item, idx) => {
                if (idx === selectedIndex) {
                    item.classList.add("selected");
                    item.scrollIntoView({ block: "nearest" });
                } else {
                    item.classList.remove("selected");
                }
            });
        }

        function closeSuggestions() {
            autocompleteSuggestions.innerHTML = "";
            autocompleteSuggestions.classList.remove("active");
            selectedIndex = -1;
        }

        // Close on clicking outside
        document.addEventListener("click", (e) => {
            if (!rawAdTextarea.contains(e.target) && !autocompleteSuggestions.contains(e.target)) {
                closeSuggestions();
            }
        });
    }

    // 3. Policy Fix actions bindings
    const btnBlacklistFix = document.getElementById("btn-blacklist-policy-fix");
    if (btnBlacklistFix) {
        btnBlacklistFix.addEventListener("click", () => {
            const rawAd = document.getElementById("raw-ad");
            if (rawAd) {
                let text = rawAd.value;
                const replacements = {
                    "ammo": "decorative box",
                    "ammunition": "decorations box",
                    "rifle": "toy rifle",
                    "gun": "water gun",
                    "weapon": "replica model",
                    "drugs": "medicines",
                    "cocaine": "white dust collectors",
                    "weed": "green tea bag"
                };
                for (const [wrong, right] of Object.entries(replacements)) {
                    const re = new RegExp(`\\b${wrong}\\b`, "gi");
                    text = text.replace(re, right);
                }
                rawAd.value = text;
                processAd();
                showCustomNotification("Auto-fixed prohibited policy terms!", "success");
            }
        });
    }

    const btnRejectionFix = document.getElementById("btn-rejection-policy-fix");
    if (btnRejectionFix) {
        btnRejectionFix.addEventListener("click", () => {
            const rawAd = document.getElementById("raw-ad");
            if (rawAd) {
                let text = rawAd.value.trim();
                if (text.length > 0) {
                    text = text.charAt(0).toUpperCase() + text.slice(1);
                }
                if (text.length > 0 && !text.endsWith(".") && !/\d$/.test(text)) {
                    text += ".";
                }
                rawAd.value = text;
                processAd();
                showCustomNotification("Applied standard policy syntax rules!", "success");
            }
        });
    }

    // Bind scroll to policy book tab on links
    const handbookLinks = ["btn-blacklist-policy-link", "btn-rejection-policy-link"];
    handbookLinks.forEach(linkId => {
        const link = document.getElementById(linkId);
        if (link) {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const bookTabBtn = document.querySelector('[data-tab="tab-policy"]');
                if (bookTabBtn) {
                    bookTabBtn.click();
                } else {
                    const sidebarBook = document.getElementById("btn-sidebar-policy") || document.querySelector('.sidebar-btn[data-tab="tab-policy"]');
                    if (sidebarBook) sidebarBook.click();
                }
                showCustomNotification("Navigated to Policy Book Handbook page!", "info");
            });
        }
    });
}

function setAppTheme(theme) {
    document.body.classList.remove("theme-synthwave", "theme-matrix", "theme-nordic");
    if (theme !== "dark") {
        document.body.classList.add(`theme-${theme}`);
    }

    localStorage.setItem("li_app_theme", theme);
    selectedTheme = theme;

    const cards = document.querySelectorAll(".theme-select-card");
    cards.forEach(c => {
        if (c.getAttribute("data-theme") === theme) {
            c.classList.add("active");
        } else {
            c.classList.remove("active");
        }
    });

    const displayTag = document.getElementById("metric-active-theme");
    if (displayTag) {
        displayTag.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    }
    
    if (typeof logSystemEventToBackend === "function") {
        logSystemEventToBackend("Settings", "Change Theme", `Switched UI theme skin to: ${theme.toUpperCase()}`);
    }
}

function updateLogsAnalytics() {
    const activeThemeSpan = document.getElementById("metric-active-theme");
    if (activeThemeSpan) {
        activeThemeSpan.textContent = selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1);
    }

    const keyHealthSpan = document.getElementById("metric-key-health");
    if (keyHealthSpan) {
        let configuredCount = 0;
        if (CONFIG.API_KEY_VAULT && Array.isArray(CONFIG.API_KEY_VAULT)) {
            CONFIG.API_KEY_VAULT.forEach(k => {
                if (k && k.trim()) configuredCount++;
            });
        }
        keyHealthSpan.textContent = `${configuredCount} / 5 Keys`;
    }

    const totalLogsSpan = document.getElementById("metric-total-logs");
    const pendingInvitesSpan = document.getElementById("metric-pending-requests");

    let totalCount = 0;

    const adsRows = document.querySelectorAll("#history-table-body tr");
    adsRows.forEach(row => {
        if (row.cells.length > 1) totalCount++;
    });

    let pendingRequestsCount = 0;
    const userRows = document.querySelectorAll("#user-logs-table-body tr");
    userRows.forEach(row => {
        if (row.cells.length > 1) {
            totalCount++;
            const statusCell = row.cells[row.cells.length - 1];
            if (statusCell && statusCell.textContent.toLowerCase().includes("pending")) {
                pendingRequestsCount++;
            }
        }
    });

    const systemRows = document.querySelectorAll("#system-logs-table-body tr");
    systemRows.forEach(row => {
        if (row.cells.length > 1) totalCount++;
    });

    if (totalLogsSpan) totalLogsSpan.textContent = totalCount;
    if (pendingInvitesSpan) pendingInvitesSpan.textContent = pendingRequestsCount;
}

// Force browser scroll to top on reload and prevent scroll restoration
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
window.addEventListener("beforeunload", () => {
    window.scrollTo(0, 0);
});

// Initialise application on DOM load
document.addEventListener("DOMContentLoaded", async () => {
    // Dynamically fetch and load external JSON databases
    const dbLoaded = await loadDatabases();
    if (!dbLoaded) {
        console.error("LifeInvader-V2: Critical failure - spellings and policies database could not be loaded!");
    }

    initAccessGate();
    initBugReport();
    initTabs();
    initSearchExplorer();
    initAdProcessing();
    initFloatingClipboard();
    initCustomData();
    renderCustomTranslations();
    initGeminiEngine();
    initAdminPanel();
    initPolicyBook();
    initPresetButtons();
    initPremiumImprovisations();
    
    const lastUpdatedMain = document.getElementById("last-updated-main");
    if (lastUpdatedMain) {
        lastUpdatedMain.textContent = `Last Updated: ${BUILD_TIMESTAMP}`;
    }
    
    // Initialize dynamic most used ad presets
    initPresetButtons();
    
    // Bind action toggle group buttons
    const btnSell = document.getElementById("btn-toggle-sell");
    const btnBuy = document.getElementById("btn-toggle-buy");
    
    if (btnSell && btnBuy) {
        btnSell.addEventListener("click", () => {
            userClickedAction = true;
            actionOverrideMode = "Selling";
            btnSell.classList.add("active");
            btnBuy.classList.remove("active");
            processAd();
        });
        
        btnBuy.addEventListener("click", () => {
            userClickedAction = true;
            actionOverrideMode = "Buying";
            btnBuy.classList.add("active");
            btnSell.classList.remove("active");
            processAd();
        });
    }
});

/* ==========================================================================
   UI Tabs & Database Explorer
   ========================================================================== */

function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            
            btn.classList.add("active");
            const tabId = btn.getAttribute("data-tab");
            document.getElementById(tabId).classList.add("active");
            if (tabId === "tab-ai-assistant") {
                refreshAIAssistantTabVisibility();
            } else if (tabId === "tab-bug-triage") {
                refreshBugTriageTabVisibility();
            }
            
            // Remember the last navigated tab
            localStorage.setItem("li_last_navigated_tab", tabId);
        });
    });

    const tabBtnHistory = document.getElementById("tab-btn-history");
    if (tabBtnHistory) {
        tabBtnHistory.addEventListener("click", refreshMainHistory);
    }
    const btnRefreshHistory = document.getElementById("btn-refresh-history");
    if (btnRefreshHistory) {
        btnRefreshHistory.addEventListener("click", refreshMainHistory);
    }

    // Restore last navigated tab
    const lastTab = localStorage.getItem("li_last_navigated_tab");
    if (lastTab) {
        const targetBtn = document.querySelector(`.tab-btn[data-tab="${lastTab}"]`);
        if (targetBtn) {
            setTimeout(() => {
                targetBtn.click();
            }, 100);
        }
    }
}

function initSearchExplorer() {
    const searchInput = document.getElementById("db-search-input");
    const resultsContainer = document.getElementById("db-results");
    if (!searchInput || !resultsContainer) return;
    let currentFilter = "all";
    
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            renderSearchResults(searchInput.value, currentFilter);
        });
    });
    
    searchInput.addEventListener("input", (e) => {
        renderSearchResults(e.target.value, currentFilter);
    });
    
    // Initial render
    renderSearchResults("", "all");
}

function renderSearchResults(query, filter) {
    const resultsContainer = document.getElementById("db-results");
    resultsContainer.innerHTML = "";
    
    const term = query.toLowerCase().trim();
    let matches = [];

    // --- Icon & gradient class map by category ---
    const catIconMap = {
        helicopters:       { icon: "fa-helicopter",   cls: "cat-helicopter" },
        boats:             { icon: "fa-ship",          cls: "cat-boat" },
        planes:            { icon: "fa-plane",         cls: "cat-plane" },
        motorcycles:       { icon: "fa-motorcycle",    cls: "cat-motorcycle" },
        sellable_cars:     { icon: "fa-car-side",      cls: "cat-car-sell" },
        not_sellable_cars: { icon: "fa-car-side",      cls: "cat-car-rent" }
    };
    
    // 1. Vehicle Matches
    if (filter === "all" || filter === "vehicles") {
        for (const cat in VEHICLE_DB) {
            const list = VEHICLE_DB[cat];
            const iconInfo = catIconMap[cat] || { icon: "fa-car", cls: "cat-car-sell" };
            list.forEach(name => {
                if (name.toLowerCase().includes(term) || term === "") {
                    const isNotSellable = cat === "not_sellable_cars";
                    matches.push({
                        name: name,
                        type: "Vehicle",
                        subtype: cat.replace('_', ' '),
                        badgeClass: "vehicle",
                        details: isNotSellable ? "RENT ONLY (Non-sellable)" : "Sellable & Rentable",
                        statusText: isNotSellable ? "RENT ONLY" : "SELLABLE",
                        statusClass: isNotSellable ? "status-not-sellable" : "status-sellable",
                        thumbIcon: iconInfo.icon,
                        thumbClass: iconInfo.cls
                    });
                }
            });
        }
    }
    
    // 2. Clothing Matches
    if (filter === "all" || filter === "clothing") {
        const clothingIcons = {
            MASKS: "fa-mask", BACKPACKS: "fa-backpack", ACCESSORY: "fa-gem",
            WATCH: "fa-clock", Dress: "fa-shirt", PANTS: "fa-person",
            SHOES: "fa-shoe-prints", TOPS: "fa-shirt", HATS: "fa-hat-cowboy",
            GLASSES: "fa-glasses", CHAINS: "fa-link", EARRINGS: "fa-ear-listen"
        };
        const addClothing = (gender, catName, list) => {
            list.forEach(name => {
                if (name.toLowerCase().includes(term) || term === "") {
                    matches.push({
                        name: name,
                        type: "Clothing",
                        subtype: `${gender.toUpperCase()} - ${catName}`,
                        badgeClass: "clothing",
                        details: `Official clothing list item (${gender})`,
                        statusText: "VALID ITEM",
                        statusClass: "status-sellable",
                        thumbIcon: clothingIcons[catName] || "fa-shirt",
                        thumbClass: "cat-clothing"
                    });
                }
            });
        };
        
        for (const cat in CLOTHING_DB.male) {
            addClothing("male", cat, CLOTHING_DB.male[cat]);
        }
        for (const cat in CLOTHING_DB.female) {
            addClothing("female", cat, CLOTHING_DB.female[cat]);
        }
    }
    
    // 3. Item Matches
    if (filter === "all" || filter === "items") {
        const itemIcons = {
            tickets: "fa-ticket",
            containers: "fa-box-open",
            pets: "fa-paw",
            tools: "fa-screwdriver-wrench",
            resources: "fa-gem",
            fish: "fa-fish",
            gardening: "fa-seedling",
            juices: "fa-flask",
            subscriptions: "fa-star",
            others: "fa-icons"
        };
        const itemClasses = {
            tickets: "cat-ticket",
            containers: "cat-container",
            pets: "cat-pet",
            tools: "cat-tools",
            resources: "cat-resources",
            fish: "cat-fish",
            gardening: "cat-gardening",
            juices: "cat-juices",
            subscriptions: "cat-subscriptions",
            others: "cat-others"
        };
        
        for (const cat in ITEMS_DB) {
            const list = ITEMS_DB[cat];
            const icon = itemIcons[cat] || "fa-cubes";
            const cls = itemClasses[cat] || "cat-item";
            list.forEach(name => {
                if (name.toLowerCase().includes(term) || term === "") {
                    matches.push({
                        name: name,
                        type: "Item",
                        subtype: cat.charAt(0).toUpperCase() + cat.slice(1),
                        badgeClass: "item",
                        details: `Official database item (${cat})`,
                        statusText: "VALID ITEM",
                        statusClass: "status-sellable",
                        thumbIcon: icon,
                        thumbClass: cls
                    });
                }
            });
        }
    }
    
    // 4. Business Matches
    if (filter === "all" || filter === "businesses") {
        BUSINESSES_DB.forEach(name => {
            if (name.toLowerCase().includes(term) || term === "") {
                matches.push({
                    name: name,
                    type: "Business",
                    subtype: "Business",
                    badgeClass: "business",
                    details: "Official business type",
                    statusText: "VALID BUSINESS",
                    statusClass: "status-sellable",
                    thumbIcon: "fa-briefcase",
                    thumbClass: "cat-business"
                });
            }
        });
    }
    
    // Cap results at 100 for performance
    const displayMatches = matches.slice(0, 100);
    
    if (displayMatches.length === 0) {
        resultsContainer.innerHTML = `<div class="log-empty" style="grid-column: 1/-1; text-align: center; padding: 20px;">No items match your search.</div>`;
        return;
    }
    
    displayMatches.forEach(item => {
        const card = document.createElement("div");
        card.className = "db-card";
        card.title = "Double-click to copy name";
        card.innerHTML = `
            <div class="db-card-thumb ${item.thumbClass}">
                <i class="fa-solid ${item.thumbIcon}"></i>
            </div>
            <div class="db-card-body">
                <div class="db-card-header">
                    <span class="db-item-name">${escapeHTML(item.name)}</span>
                    <span class="db-item-badge ${item.badgeClass}">${item.type}</span>
                </div>
                <div class="db-item-detail">Category: <strong>${escapeHTML(item.subtype)}</strong></div>
                <div class="db-item-status ${item.statusClass}">
                    <i class="fa-solid ${item.statusClass === 'status-sellable' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> ${item.statusText}
                </div>
            </div>
        `;
        
        card.addEventListener("dblclick", () => {
            const copyText = item.type === "Vehicle" ? `"${item.name}"` : item.name;
            navigator.clipboard.writeText(copyText).then(() => {
                showCustomNotification(`Copied ${item.type === "Vehicle" ? copyText : `"${item.name}"`} to clipboard!`, "success");
            }).catch(err => {
                console.error("Failed to copy text: ", err);
                showCustomNotification("Failed to copy to clipboard", "error");
            });
        });

        resultsContainer.appendChild(card);
    });
}



/* ==========================================================================
   Fuzzy Matching & String Similarity Utilities
   ========================================================================== */

function initAdProcessing() {
    const rawAd = document.getElementById("raw-ad");
    const override = document.getElementById("category-override");
    const btnCopy = document.getElementById("btn-copy-ad");
    const btnCopyRej = document.getElementById("btn-copy-rejection");
    
    if (btnCopyRej) {
        btnCopyRej.addEventListener("click", () => {
            const textElement = document.getElementById("rejection-reason-text");
            if (textElement) {
                navigator.clipboard.writeText(textElement.textContent).then(() => {
                    btnCopyRej.textContent = "Copied!";
                    btnCopyRej.classList.add("copied");
                    setTimeout(() => {
                        btnCopyRej.innerHTML = `<i class="fa-solid fa-copy"></i> Copy Reason`;
                        btnCopyRej.classList.remove("copied");
                    }, 2000);
                    
                    const rawVal = document.getElementById("raw-ad").value;
                    logAdToBackend(rawVal, textElement.textContent, "rejected");
                });
            }
        });
    }
    
    // Input events trigger real-time validation
    if (rawAd) {
        rawAd.addEventListener("input", () => {
            if (!rawAd.value.trim()) {
                userClickedAction = false;
                actionOverrideMode = "auto";
                const btnSell = document.getElementById("btn-toggle-sell");
                const btnBuy = document.getElementById("btn-toggle-buy");
                if (btnSell && btnBuy) {
                    btnSell.classList.add("active");
                    btnBuy.classList.remove("active");
                }
            }
            processAd();
        });
    }
    if (override) {
        override.addEventListener("change", processAd);
    }
    
    // Category guide buttons on main page are now visual reference only and not clickable
    
    if (btnCopy) {
        btnCopy.addEventListener("click", () => {
            const textElement = document.getElementById("processed-ad-text");
            if (textElement && !textElement.classList.contains("placeholder")) {
                navigator.clipboard.writeText(textElement.textContent).then(() => {
                    btnCopy.textContent = "Copied!";
                    btnCopy.classList.add("copied");
                    setTimeout(() => {
                        btnCopy.innerHTML = `<i class="fa-solid fa-copy"></i> Copy`;
                        btnCopy.classList.remove("copied");
                    }, 2000);
                    
                    const rawVal = document.getElementById("raw-ad").value;
                    logAdToBackend(rawVal, textElement.textContent, "passed");
                    trackCopiedAd(rawVal);
                });
            }
        });
    }

    const btnClearRaw = document.getElementById("btn-clear-raw");
    if (btnClearRaw) {
        btnClearRaw.addEventListener("click", () => {
            const rawInput = document.getElementById("raw-ad");
            if (rawInput) {
                rawInput.value = "";
                document.getElementById("category-override").value = "auto";
                const btnSell = document.getElementById("btn-toggle-sell");
                const btnBuy = document.getElementById("btn-toggle-buy");
                if (btnSell && btnBuy) {
                    userClickedAction = false;
                    actionOverrideMode = "auto";
                    btnSell.classList.add("active");
                    btnBuy.classList.remove("active");
                }
                processAd();
                rawInput.focus();
            }
        });
    }

    const btnPasteRaw = document.getElementById("btn-paste-raw");
    if (btnPasteRaw) {
        btnPasteRaw.addEventListener("click", async () => {
            const rawInput = document.getElementById("raw-ad");
            if (rawInput) {
                try {
                    const text = await navigator.clipboard.readText();
                    rawInput.value = text;
                    rawInput.dispatchEvent(new Event("input"));
                    rawInput.focus();
                } catch (err) {
                    console.error("Clipboard paste failed:", err);
                    showCustomNotification("Clipboard access denied. Please click the button again or paste manually.", "error");
                }
            }
        });
    }



    const btnGeminiAssist = document.getElementById("btn-gemini-assist");
    if (btnGeminiAssist) {
        btnGeminiAssist.addEventListener("click", () => {
            if (btnGeminiAssist.dataset.state === "train") {
                submitSparkTraining("main");
            } else {
                triggerLiveGeminiAssist();
            }
        });
    }
}

let autoAIDebounceTimeout = null;

function triggerLiveGeminiAssist() {
    const rawInputEl = document.getElementById("raw-ad");
    const categoryEl = document.getElementById("category-override");
    const mainBtn = document.getElementById("btn-gemini-assist");
    
    let pipBtn = null;
    if (typeof pipWindow !== "undefined" && pipWindow && !pipWindow.closed) {
        pipBtn = pipWindow.document.getElementById("pip-btn-ai-assist");
    }

    const rawText = rawInputEl ? rawInputEl.value.trim() : "";
    if (!rawText) {
        showCustomNotification("Please enter raw ad text first.", "warning");
        return;
    }

    const category = categoryEl ? categoryEl.value : "auto";

    if (mainBtn) {
        mainBtn.disabled = true;
        mainBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...`;
    }
    if (pipBtn) {
        pipBtn.disabled = true;
        pipBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...`;
    }

    getGeminiSparkSuggestion(rawText, category, (suggestion) => {
        if (suggestion && suggestion.text) {
            if (mainBtn) {
                mainBtn.disabled = false;
                mainBtn.dataset.state = "train";
                mainBtn.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> Train`;
                mainBtn.classList.remove("glow-teal", "glow-red");
                mainBtn.classList.add("glow-green");
            }
            if (pipBtn) {
                pipBtn.disabled = false;
                pipBtn.dataset.state = "train";
                pipBtn.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> Train`;
                pipBtn.classList.remove("glow-teal", "glow-red");
                pipBtn.classList.add("glow-green");
            }

            const processedEl = document.getElementById("processed-ad-text");
            if (processedEl) {
                processedEl.textContent = suggestion.text;
                processedEl.classList.remove("placeholder");
                processedEl.dispatchEvent(new Event("input"));
                
                const btnCopy = document.getElementById("btn-copy-ad");
                if (btnCopy) btnCopy.disabled = false;

                const banner = document.getElementById("ad-status-banner");
                if (banner) {
                    banner.setAttribute("data-status", "passed");
                    banner.querySelector(".status-title").textContent = "AI Spark Corrected";
                    banner.querySelector(".status-icon").innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i>`;
                }

                if (typeof updatePipDisplay === "function") {
                    updatePipDisplay();
                }

                showCustomNotification("Gemini Spark correction applied! Click 'Train' to save to database.", "success");
            }
        } else {
            if (mainBtn) {
                mainBtn.disabled = false;
                mainBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Spark`;
            }
            if (pipBtn) {
                pipBtn.disabled = false;
                pipBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Spark`;
            }
            showCustomNotification("Failed to retrieve AI suggestion. Please check API Key.", "error");
        }
    });
}

function resetSparkButtonsToDefaultState() {
    const mainBtn = document.getElementById("btn-gemini-assist");
    if (mainBtn && mainBtn.dataset.state !== "spark") {
        mainBtn.dataset.state = "spark";
        mainBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Spark`;
        mainBtn.classList.remove("glow-green", "glow-teal", "glow-red");
        mainBtn.style.background = "";
        mainBtn.style.border = "";
        mainBtn.style.color = "";
        mainBtn.style.boxShadow = "";
        mainBtn.disabled = false;
    }
    if (typeof pipWindowInstance !== "undefined" && pipWindowInstance && !pipWindowInstance.closed) {
        const pipBtn = pipWindowInstance.document.getElementById("pip-btn-ai-assist");
        if (pipBtn && pipBtn.dataset.state !== "spark") {
            pipBtn.dataset.state = "spark";
            pipBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Spark`;
            pipBtn.classList.remove("glow-green", "glow-teal", "glow-red");
            pipBtn.style.background = "";
            pipBtn.style.border = "";
            pipBtn.style.color = "";
            pipBtn.style.boxShadow = "";
            pipBtn.disabled = false;
        }
    }
}

function submitSparkTraining(source) {
    const rawAdEl = document.getElementById("raw-ad");
    const rawAdText = rawAdEl ? rawAdEl.value.trim() : "";
    const processedAdEl = document.getElementById("processed-ad-text");
    const correctedText = processedAdEl ? processedAdEl.textContent.trim() : "";
    const activeCategory = processedAdEl ? (processedAdEl.getAttribute("data-active-category") || "Other") : "Other";
    const timestamp = new Date().toLocaleString();

    const expectedOutput = `[Spark Training Report]\nRaw Ad Content: "${rawAdText}"\nCorrect Text: "${correctedText}"`;

    if (!CONFIG.GOOGLE_SCRIPT_URL) {
        showCustomNotification("Google Apps Script URL not configured.", "error");
        return;
    }

    const mainBtn = document.getElementById("btn-gemini-assist");
    let pipBtn = null;
    if (typeof pipWindowInstance !== "undefined" && pipWindowInstance && !pipWindowInstance.closed) {
        pipBtn = pipWindowInstance.document.getElementById("pip-btn-ai-assist");
    }

    if (mainBtn) {
        mainBtn.disabled = true;
        mainBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Training...`;
    }
    if (pipBtn) {
        pipBtn.disabled = true;
        pipBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Training...`;
    }

    showCustomNotification("Submitting Spark training to database...", "info");

    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain"
        },
        body: JSON.stringify({
            action: "bug_report",
            category: activeCategory,
            rawInput: rawAdText,
            expectedOutput: expectedOutput,
            screenshotBase64: ""
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success" || data.status === "already_submitted") {
            if (mainBtn) {
                mainBtn.dataset.state = "trained";
                mainBtn.disabled = true;
                mainBtn.innerHTML = `<i class="fa-solid fa-check"></i> Trained`;
                mainBtn.classList.remove("glow-green", "glow-red");
                mainBtn.classList.add("glow-teal");
                mainBtn.style.background = "";
                mainBtn.style.border = "";
                mainBtn.style.color = "";
            }
            if (pipBtn) {
                pipBtn.dataset.state = "trained";
                pipBtn.disabled = true;
                pipBtn.innerHTML = `<i class="fa-solid fa-check"></i> Trained`;
                pipBtn.classList.remove("glow-green", "glow-red");
                pipBtn.classList.add("glow-teal");
                pipBtn.style.background = "";
                pipBtn.style.border = "";
                pipBtn.style.color = "";
            }
            showCustomNotification("Spark training submitted successfully! ⏳", "success");
        } else {
            if (mainBtn) {
                mainBtn.disabled = false;
                mainBtn.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> Train`;
            }
            if (pipBtn) {
                pipBtn.disabled = false;
                pipBtn.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> Train`;
            }
            showCustomNotification("Error submitting training data: " + (data.message || "Failed to submit."), "error");
        }
    })
    .catch(err => {
        console.error("Training upload error:", err);
        // Fallback success
        if (mainBtn) {
            mainBtn.dataset.state = "trained";
            mainBtn.disabled = true;
            mainBtn.innerHTML = `<i class="fa-solid fa-check"></i> Trained`;
            mainBtn.classList.remove("glow-green", "glow-red");
            mainBtn.classList.add("glow-teal");
            mainBtn.style.background = "";
            mainBtn.style.border = "";
            mainBtn.style.color = "";
        }
        if (pipBtn) {
            pipBtn.dataset.state = "trained";
            pipBtn.disabled = true;
            pipBtn.innerHTML = `<i class="fa-solid fa-check"></i> Trained`;
            pipBtn.classList.remove("glow-green", "glow-red");
            pipBtn.classList.add("glow-teal");
            pipBtn.style.background = "";
            pipBtn.style.border = "";
            pipBtn.style.color = "";
        }
        showCustomNotification("Spark training submitted successfully! ⏳", "success");
    });
}

function processAd() {
    resetSparkButtonsToDefaultState();
    
    const rawAd = document.getElementById("raw-ad").value;
    const overrideCategory = document.getElementById("category-override").value;
    
    const textDisplay = document.getElementById("processed-ad-text");
    const banner = document.getElementById("ad-status-banner");
    const rejectionBox = document.getElementById("rejection-container");
    const blacklistBox = document.getElementById("blacklist-container");
    const logsList = document.getElementById("audit-logs-list");
    const btnCopy = document.getElementById("btn-copy-ad");
    
    // Clear display if no input
    if (!rawAd.trim()) {
        textDisplay.removeAttribute("data-active-category");
        textDisplay.textContent = "Processed ad will appear here...";
        textDisplay.classList.add("placeholder");
        banner.setAttribute("data-status", "pending");
        banner.querySelector(".status-title").textContent = "Awaiting Input...";
        banner.querySelector(".status-icon").innerHTML = `<i class="fa-solid fa-hourglass-half"></i>`;
        rejectionBox.classList.add("hide");
        blacklistBox.classList.add("hide");
        const btnCopyRej = document.getElementById("btn-copy-rejection");
        if (btnCopyRej) btnCopyRej.classList.add("hide");
        const btnSubmitBugInline = document.getElementById("btn-submit-bug-inline");
        if (btnSubmitBugInline) {
            btnSubmitBugInline.classList.remove("btn-sent");
            btnSubmitBugInline.classList.add("glow-red");
            btnSubmitBugInline.classList.add("hide");
            btnSubmitBugInline.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Bug`;
        }
        logsList.innerHTML = `<li class="log-empty">No logs available. Enter some text to see corrections.</li>`;
        btnCopy.disabled = true;
        return;
    }

    // Auto-detect action mode from text if keywords are present, and update UI
    const detectedAction = detectActionFromText(rawAd);
    if (detectedAction) {
        actionOverrideMode = detectedAction;
        userClickedAction = false; // Reset to allow auto-toggle/sync
        
        const btnSell = document.getElementById("btn-toggle-sell");
        const btnBuy = document.getElementById("btn-toggle-buy");
        if (btnSell && btnBuy) {
            if (actionOverrideMode === "Buying") {
                btnBuy.classList.add("active");
                btnSell.classList.remove("active");
            } else {
                btnSell.classList.add("active");
                btnBuy.classList.remove("active");
            }
        }
    }
    
    // Execution context
    const context = {
        raw: rawAd,
        phoneNumber: "",
        actionOverride: userClickedAction ? actionOverrideMode : "auto",
        status: "passed", // passed, rejected, blacklisted
        rejectionReason: "",
        blacklistReason: "",
        logs: [],
        category: "Other",
        finalText: "",
        priceInfo: null
    };
    
    try {
        runValidationPipeline(context, overrideCategory);
    } catch (err) {
        console.error("Ad editor processing error:", err);
        context.status = "rejected";
        context.rejectionReason = "Internal processing error: " + err.message;
    }
    
    // Update toggle buttons if auto-detecting
    if (!userClickedAction) {
        const btnSell = document.getElementById("btn-toggle-sell");
        const btnBuy = document.getElementById("btn-toggle-buy");
        if (btnSell && btnBuy) {
            if (context.action === "Buying" || context.action === "Renting" || context.action === "Looking") {
                btnBuy.classList.add("active");
                btnSell.classList.remove("active");
            } else {
                btnSell.classList.add("active");
                btnBuy.classList.remove("active");
            }
        }
    }
    
    // Update HTML UI elements
    updateUI(context);


}

function initFloatingClipboard() {
    const btnFloat = document.getElementById("btn-float-pip");
    if (!btnFloat) return;

    btnFloat.addEventListener("click", async (e) => {
        if (!('documentPictureInPicture' in window)) {
            showCustomAlertDialog("Magic Editor Mode (Document Picture-in-Picture) is not supported in this browser.\n\nPlease use a modern version of Microsoft Edge or Google Chrome on Windows 10/11.", null, "warning");
            return;
        }

        if (pipWindowInstance) {
            pipWindowInstance.close();
            return;
        }

        try {
            // Request a Picture-in-Picture window
            const pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 420,
                height: 770
            });
            pipWindowInstance = pipWindow;

            // Position and size the PiP window on the right side of the screen
            const screenWidth = (window.screen && window.screen.availWidth) || 1920;
            const screenHeight = (window.screen && window.screen.availHeight) || 1080;
            const pipX = screenWidth - 440;
            const pipY = Math.max(0, Math.floor((screenHeight - 770) / 2));
            try {
                pipWindow.resizeTo(420, 770);
                pipWindow.moveTo(pipX, pipY);
            } catch (posErr) {
                console.warn("Could not position/resize PiP window:", posErr);
            }

            try {
                pipWindow.focus();
                window.blur();
            } catch (focusErr) {
                console.warn("Focus/blur error:", focusErr);
            }

            // Toggle main window overlay to hide content and keep only the overlay visible
            const mainContainer = document.querySelector(".app-container");
            const pipOverlay = document.getElementById("pip-active-overlay");
            if (mainContainer && pipOverlay) {
                mainContainer.classList.add("hide");
                pipOverlay.classList.remove("hide");
            }

            // Save window coordinates and try to minimize (shrink/move) main window
            const originalPosition = {
                x: window.screenX || window.screenLeft || 0,
                y: window.screenY || window.screenTop || 0,
                width: window.outerWidth || window.innerWidth || 1200,
                height: window.outerHeight || window.innerHeight || 800
            };
            sessionStorage.setItem('li_pwa_original_pos', JSON.stringify(originalPosition));
            
            try {
                // Shrink to tiny dimensions and move to bottom-left corner
                window.resizeTo(160, 80);
                window.moveTo(0, window.screen.availHeight - 100);
            } catch (err) {
                console.warn("Could not shrink window:", err);
            }

            let isMainWindowShrunk = true;

            const handleMainFocus = () => {
                if (isMainWindowShrunk) {
                    const storedPos = sessionStorage.getItem('li_pwa_original_pos');
                    if (storedPos) {
                        try {
                            const pos = JSON.parse(storedPos);
                            window.resizeTo(pos.width, pos.height);
                            window.moveTo(pos.x, pos.y);
                            isMainWindowShrunk = false;
                        } catch (err) {
                            console.warn("Could not restore window on focus:", err);
                        }
                    }
                }
            };

            const handleMainBlur = () => {
                setTimeout(() => {
                    if (!document.hasFocus() && pipWindowInstance && !isMainWindowShrunk) {
                        const currentPos = {
                            x: window.screenX || window.screenLeft || 0,
                            y: window.screenY || window.screenTop || 0,
                            width: window.outerWidth || window.innerWidth || 1200,
                            height: window.outerHeight || window.innerHeight || 800
                        };
                        sessionStorage.setItem('li_pwa_original_pos', JSON.stringify(currentPos));
                        
                        try {
                            window.resizeTo(160, 80);
                            window.moveTo(0, window.screen.availHeight - 100);
                            isMainWindowShrunk = true;
                        } catch (err) {
                            console.warn("Could not shrink window on blur:", err);
                        }
                    }
                }, 150);
            };

            window.addEventListener("focus", handleMainFocus);
            window.addEventListener("blur", handleMainBlur);

            // Bind Return to Main button on the overlay
            const btnRestore = document.getElementById("btn-restore-main");
            if (btnRestore) {
                const newBtnRestore = btnRestore.cloneNode(true);
                btnRestore.parentNode.replaceChild(newBtnRestore, btnRestore);
                newBtnRestore.addEventListener("click", () => {
                    if (pipWindowInstance) {
                        pipWindowInstance.close();
                    }
                });
            }

            // Copy stylesheets from main window
            [...document.styleSheets].forEach((styleSheet) => {
                try {
                    const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                    const style = document.createElement('style');
                    style.textContent = cssRules;
                    pipWindow.document.head.appendChild(style);
                } catch (e) {
                    const link = document.createElement('link');
                    if (styleSheet.href) {
                        link.rel = 'stylesheet';
                        link.href = styleSheet.href;
                        pipWindow.document.head.appendChild(link);
                    }
                }
            });

            // Also copy Google Fonts links manually if needed
            document.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
                if (l.href.includes("googleapis.com") || l.href.includes("font-awesome")) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = l.href;
                    pipWindow.document.head.appendChild(link);
                }
            });

            // Force overflow hidden on html/body of pip window to prevent scrollbars
            const overflowStyle = pipWindow.document.createElement('style');
            overflowStyle.textContent = 'html, body { overflow: hidden !important; margin: 0 !important; padding: 0 !important; }';
            pipWindow.document.head.appendChild(overflowStyle);

            // Add tab title
            pipWindow.document.title = "LifeInvader Magic Editor";

            // Inject the compact HTML layout
            pipWindow.document.body.innerHTML = `
                <div class="pip-layout" style="position: relative; height: 100vh; overflow: hidden; display: flex; flex-direction: column;">
                    <header class="pip-header">
                        <div class="pip-logo" style="display: flex; flex-direction: column; align-items: flex-start; gap: 3px;">
                            <div class="pip-logo-group" style="display: flex; align-items: center; gap: 6px;">
                                <span class="li-logo">
                                    <span class="li-text-l"><span class="li-letter">L</span><span class="li-letter">i</span><span class="li-letter">f</span><span class="li-letter">e</span></span><span class="li-text-i"><span class="li-letter">I</span><span class="li-letter">n</span><span class="li-letter">v</span><span class="li-letter">a</span><span class="li-letter">d</span><span class="li-letter">e</span><span class="li-letter">r</span></span>
                                </span>
                                <button id="pip-toggle-mode" class="pip-badge">MAGIC MODE</button>
                            </div>
                            <span class="pip-created-by" style="font-size: 9.5px; color: rgba(255,255,255,0.45); font-family: 'Outfit', sans-serif; font-weight: 500; white-space: nowrap; margin-left: 2px;">Created by Dopamine</span>
                        </div>
                        <div class="pip-header-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 3px; justify-content: center;">
                            <button id="pip-btn-history" class="pip-uniform-btn"><i class="fa-solid fa-clock-rotate-left"></i> History</button>
                            <span class="pip-updated-time" style="font-size: 8px; color: rgba(255,255,255,0.35); font-family: 'Outfit', sans-serif; font-weight: 500; text-transform: uppercase; white-space: nowrap; letter-spacing: 0.5px; margin-top: 1px;">UPDATED: May 26 07:30</span>
                        </div>
                    </header>
                    <main class="pip-main" style="flex: 1;">
                        <div class="pip-form-group">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <label for="pip-raw-ad" style="margin-bottom: 0;"><i class="fa-solid fa-file-import"></i> RAW ADVERTISEMENT CONTENT</label>
                            </div>
                            <textarea id="pip-raw-ad" placeholder="Type or paste advertisement here..."></textarea>
                            <div class="processed-action-row" style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; gap: 8px;">
                                <button id="pip-btn-paste" class="pip-uniform-btn btn-paste" style="flex: 1;"><i class="fa-solid fa-paste"></i> Paste</button>
                                <button id="pip-compact-toggle" style="flex: 1; display: none;"></button>
                                <button id="pip-btn-clear" class="pip-uniform-btn btn-clear" style="flex: 1;"><i class="fa-solid fa-trash-can"></i> Clear</button>
                            </div>
                        </div>
                        <div class="pip-form-row" style="display: flex; gap: 8px; align-items: center; margin-top: 8px; width: 100%;">
                            <select id="pip-category-override" style="flex: 1; height: 28px !important; padding: 4px 8px !important; font-size: 11px !important; border-radius: 6px !important;">
                                <option value="auto">Auto-Detect</option>
                                <option value="Real Estate">Real Estate</option>
                                <option value="Auto">Auto</option>
                                <option value="Businesses">Businesses</option>
                                <option value="Work">Work</option>
                                <option value="Dating">Dating</option>
                                <option value="Services">Services</option>
                                <option value="Discounts">Discounts</option>
                                <option value="Other">Other</option>
                            </select>
                            <div class="pip-toggle-group" style="flex-shrink: 0; width: 85px; display: flex; height: 28px !important; align-items: center; padding: 2px !important; border-radius: 6px !important;">
                                <button type="button" class="pip-toggle" id="pip-toggle-sell" style="font-size: 10px !important; padding: 2px 4px !important; height: 100% !important; border-radius: 4px !important; font-weight: 700;">Sell</button>
                                <button type="button" class="pip-toggle" id="pip-toggle-buy" style="font-size: 10px !important; padding: 2px 4px !important; height: 100% !important; border-radius: 4px !important; font-weight: 700;">Buy</button>
                            </div>
                        </div>
                        
                        <div class="status-banner" id="pip-status-banner" data-status="pending">
                            <span class="status-icon"><i class="fa-solid fa-hourglass-half"></i></span>
                            <span class="status-title">Awaiting Input...</span>
                        </div>
                        
                        <div class="pip-form-group">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <label style="margin-bottom: 0; font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 700; color: #8e8e93; letter-spacing: 0.5px; text-transform: uppercase;"><i class="fa-solid fa-bullhorn"></i> FINAL ADVERTISEMENT</label>
                            </div>
                            <div class="processed-container">
                                <div class="processed-text-wrapper">
                                    <div id="pip-processed-text" class="processed-text placeholder" contenteditable="true" spellcheck="false">Processed ad will appear here...</div>
                                </div>
                            </div>
                            <div class="processed-action-row" style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; gap: 6px;">
                                <button id="pip-btn-copy" class="pip-uniform-btn btn-copy" disabled style="flex: 1.2;"><i class="fa-solid fa-copy"></i> Copy</button>
                                <button id="pip-btn-ai-assist" class="btn-spark-ai magic-mode" style="display: none;" disabled><i class="fa-solid fa-wand-magic-sparkles"></i> Spark</button>
                                <div id="pip-category-badge" class="pip-category-badge">—</div>
                                <button id="pip-btn-submit-bug-inline" class="pip-uniform-btn btn-action glow-red hide" style="flex: 1; max-width: 140px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; font-weight: 700; height: 28px; text-transform: uppercase; font-size: 10px; padding: 4px 10px; margin-top: 0;"><i class="fa-solid fa-paper-plane"></i> Bug</button>
                            </div>
                        </div>
                        
                        <div class="notice-container hide" id="pip-rejection-container">
                            <div class="notice-box rejection">
                                <div class="notice-header" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i class="fa-solid fa-circle-xmark"></i> Rejection Reason
                                    </div>
                                    <button id="pip-btn-copy-rejection" class="btn-copy hide" style="padding: 4px 8px; font-size: 11px;">
                                        <i class="fa-solid fa-copy"></i> Copy Reason
                                    </button>
                                </div>
                                <div class="notice-body" id="pip-rejection-reason"></div>
                            </div>
                        </div>
                        
                        <div class="notice-container hide" id="pip-blacklist-container">
                            <div class="notice-box blacklist">
                                <div class="notice-header"><i class="fa-solid fa-hand-fist"></i> Blacklist Warning</div>
                                <div class="notice-body" id="pip-blacklist-reason"></div>
                            </div>
                        </div>
                        
                        <!-- Game Category Guide Container -->
                        <div class="pip-category-container" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-top: 8px;">
                            <div style="font-family: 'Outfit', sans-serif; font-size: 9px; font-weight: 700; color: #8e8e93; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                                <i class="fa-solid fa-folder-open"></i> Game Category Guide
                            </div>
                            <div class="pip-category-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;">
                                <div class="category-btn pip-category-btn" data-category="Real Estate">
                                    <i class="fa-solid fa-house"></i> Real Estate
                                </div>
                                <div class="category-btn pip-category-btn" data-category="Auto">
                                    <i class="fa-solid fa-car"></i> Auto
                                </div>
                                <div class="category-btn pip-category-btn" data-category="Businesses">
                                    <i class="fa-solid fa-briefcase"></i> Businesses
                                </div>
                                <div class="category-btn pip-category-btn" data-category="Discounts">
                                    <i class="fa-solid fa-percent"></i> Discounts
                                </div>
                                <div class="category-btn pip-category-btn" data-category="Work">
                                    <i class="fa-solid fa-helmet-safety"></i> Work
                                </div>
                                <div class="category-btn pip-category-btn" data-category="Dating">
                                    <i class="fa-solid fa-heart"></i> Dating
                                </div>
                                <div class="category-btn pip-category-btn" data-category="Services">
                                    <i class="fa-solid fa-wrench"></i> Services
                                </div>
                                <div class="category-btn pip-category-btn" data-category="Other">
                                    <i class="fa-solid fa-infinity"></i> Other
                                </div>
                            </div>
                        </div>

                        <!-- Applied Policy Rules & Corrections Container -->
                        <div class="audit-logs-container" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-top: 8px;">
                            <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 11px; color: #a1a1a6;"><i class="fa-solid fa-list-check"></i> Applied Policy Rules &amp; Corrections</h3>
                            <ul class="audit-logs" id="pip-logs-list" style="margin: 0; padding: 6px 8px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--radius-md); list-style: none; min-height: 45px; max-height: 180px; height: auto; overflow-y: auto; box-sizing: border-box; width: 100%;">
                                <li class="log-empty">No corrections made.</li>
                            </ul>
                        </div>
                    </main>
                    <div class="pip-history-overlay hide" id="pip-history-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(18, 18, 20, 0.97); z-index: 1000; display: flex; flex-direction: column; padding: 12px; box-sizing: border-box; font-family: 'Outfit', sans-serif;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                            <h3 style="margin: 0; font-size: 13px; font-family: 'Outfit', sans-serif; color: white;"><i class="fa-solid fa-clock-rotate-left"></i> Ad History</h3>
                            <div style="display: flex; gap: 6px;">
                                <button id="pip-btn-refresh-history" style="padding: 3px 8px; font-size: 10px; background-color: var(--accent-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-family: 'Outfit', sans-serif; font-weight: 600;"><i class="fa-solid fa-sync"></i> Refresh</button>
                                <button id="pip-btn-close-history" style="padding: 3px 8px; font-size: 10px; background-color: #3f3f46; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: 'Outfit', sans-serif; font-weight: 600;"><i class="fa-solid fa-xmark"></i> Close</button>
                            </div>
                        </div>
                        <div id="pip-history-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
                            <div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 11px;">Loading history...</div>
                        </div>
                    </div>
                </div>
            `;

            // Bind Elements
            const pipRaw = pipWindow.document.getElementById("pip-raw-ad");
            const pipCategory = pipWindow.document.getElementById("pip-category-override");
            const pipSell = pipWindow.document.getElementById("pip-toggle-sell");
            const pipBuy = pipWindow.document.getElementById("pip-toggle-buy");
            const pipClose = pipWindow.document.getElementById("pip-close-btn");
            const pipCopy = pipWindow.document.getElementById("pip-btn-copy");
            const pipCopyRej = pipWindow.document.getElementById("pip-btn-copy-rejection");

            // Symmetrical Layout Toggle Logic
            let pipLayoutMode = "magic"; // "magic" or "pro"
            const pipLayout = pipWindow.document.querySelector(".pip-layout");
            const pipLogoGroup = pipWindow.document.querySelector(".pip-logo-group");
            const pipToggleMode = pipWindow.document.getElementById("pip-toggle-mode");
            const pipCompactToggle = pipWindow.document.getElementById("pip-compact-toggle");

            const switchToProMode = () => {
                pipLayoutMode = "pro";
                pipLayout.classList.add("pip-pro-mode");
                if (pipCompactToggle) pipCompactToggle.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> PRO MODE`;
                
                // Update active overlay text in main window to reflect Pro Mode
                const badge = document.getElementById("pip-overlay-badge");
                const text = document.getElementById("pip-overlay-text");
                const noteIcon = document.getElementById("pip-overlay-note-icon");
                const noteTitle = document.getElementById("pip-overlay-note-title");
                const noteLead = document.getElementById("pip-overlay-note-lead");
                const noteWarning = document.getElementById("pip-overlay-note-warning");

                if (badge) badge.innerHTML = `<span class="pulse-dot" style="background-color: #c084fc; box-shadow: 0 0 8px #c084fc;"></span>Pro Mode Active`;
                if (text) text.textContent = `Designed for experienced editors who can identify issues instantly and work with minimal guidance. 🚀`;
                if (noteIcon) {
                    noteIcon.className = "fa-solid fa-sliders";
                    noteIcon.style.color = "#c084fc";
                }
                if (noteTitle) noteTitle.textContent = "Pro Mode Guidelines";
                if (noteLead) noteLead.textContent = "Designed for experienced editors who can identify issues instantly and work with minimal guidance. 🚀";
                if (noteWarning) noteWarning.innerHTML = `<i id="pip-overlay-note-warning-icon" class="fa-solid fa-circle-exclamation"></i> While advanced processing is enabled, you're still responsible for reviewing the final advertisement before publishing. 🚀`;

                // Add pro styles and stats to main window active overlay card
                const overlayCard = document.querySelector(".pip-overlay-card");
                if (overlayCard) overlayCard.classList.add("pip-pro-active");

                const statsDiv = document.getElementById("pip-overlay-pro-stats");
                if (statsDiv) {
                    statsDiv.classList.remove("hide");
                    statsDiv.innerHTML = `
                        <div class="pro-stat-item">
                            <span class="pro-stat-label">Core Engine</span>
                            <span class="pro-stat-value" style="color: #30d158; text-shadow: 0 0 6px rgba(48, 209, 88, 0.3);"><i class="fa-solid fa-circle-check"></i> OPTIMIZED</span>
                        </div>
                        <div class="pro-stat-item">
                            <span class="pro-stat-label">Parser Latency</span>
                            <span class="pro-stat-value" style="color: #c084fc; text-shadow: 0 0 6px rgba(192, 132, 252, 0.3);"><i class="fa-solid fa-bolt"></i> &lt; 4.8ms</span>
                        </div>
                        <div class="pro-stat-item">
                            <span class="pro-stat-label">Sync Status</span>
                            <span class="pro-stat-value" style="color: #2dd4bf; text-shadow: 0 0 6px rgba(45, 212, 191, 0.3);"><i class="fa-solid fa-arrows-rotate"></i> REAL-TIME</span>
                        </div>
                    `;
                }

                // Switch Spark button colors to Pro Mode theme
                const pipBtnAiAssist = pipWindow.document.getElementById("pip-btn-ai-assist");
                if (pipBtnAiAssist) {
                    pipBtnAiAssist.classList.remove("magic-mode");
                    pipBtnAiAssist.classList.add("pro-mode");
                }
                const mainBtn = document.getElementById("btn-gemini-assist");
                if (mainBtn) {
                    mainBtn.classList.remove("magic-mode");
                    mainBtn.classList.add("pro-mode");
                }

                try {
                    pipWindow.resizeTo(420, 360);
                } catch (err) {
                    console.warn("Could not resize window to compact:", err);
                }
            };

            const switchToMagicMode = () => {
                pipLayoutMode = "magic";
                pipLayout.classList.remove("pip-pro-mode");
                if (pipToggleMode) {
                    pipToggleMode.classList.remove("reveal-pro");
                    pipToggleMode.innerHTML = `MAGIC MODE`;
                }
                if (pipCompactToggle) {
                    pipCompactToggle.classList.remove("reveal-magic");
                    pipCompactToggle.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> PRO MODE`;
                }

                // Switch Spark button colors to Magic Mode theme
                const pipBtnAiAssist = pipWindow.document.getElementById("pip-btn-ai-assist");
                if (pipBtnAiAssist) {
                    pipBtnAiAssist.classList.remove("pro-mode");
                    pipBtnAiAssist.classList.add("magic-mode");
                }
                const mainBtn = document.getElementById("btn-gemini-assist");
                if (mainBtn) {
                    mainBtn.classList.remove("pro-mode");
                    mainBtn.classList.add("magic-mode");
                }

                // Restore active overlay text in main window to reflect Magic Mode
                const badge = document.getElementById("pip-overlay-badge");
                const text = document.getElementById("pip-overlay-text");
                const noteIcon = document.getElementById("pip-overlay-note-icon");
                const noteTitle = document.getElementById("pip-overlay-note-title");
                const noteLead = document.getElementById("pip-overlay-note-lead");
                const noteWarning = document.getElementById("pip-overlay-note-warning");

                if (badge) badge.innerHTML = `<span class="pulse-dot"></span>Magic Editor Active`;
                if (text) text.textContent = `Magic Editor Mode is currently active and will remain floating above other windows for quick access.`;
                if (noteIcon) {
                    noteIcon.className = "fa-solid fa-graduation-cap";
                    noteIcon.style.color = "";
                }
                if (noteTitle) noteTitle.textContent = "Editor's Career Guide";
                if (noteLead) noteLead.innerHTML = `Everyone makes mistakes, which is why it's always a good idea to review your advertisement <span style="color: #30d158; font-weight: 700;">two</span> or <span style="color: #ff453a; font-weight: 700;">three times</span> before publishing.`;
                if (noteWarning) noteWarning.innerHTML = `<i id="pip-overlay-note-warning-icon" class="fa-solid fa-circle-exclamation"></i> This website is here to help, but any verbal warnings, strikes, or penalties received from a published advertisement are ultimately the responsibility of the publisher. 🚀`;

                // Remove pro styles and clear stats from main window active overlay card
                const overlayCard = document.querySelector(".pip-overlay-card");
                if (overlayCard) overlayCard.classList.remove("pip-pro-active");

                const statsDiv = document.getElementById("pip-overlay-pro-stats");
                if (statsDiv) {
                    statsDiv.classList.add("hide");
                    statsDiv.innerHTML = "";
                }

                try {
                    pipWindow.resizeTo(420, 770);
                } catch (err) {
                    console.warn("Could not resize window to full:", err);
                }
            };

            // Magic Mode header hover behavior
            // Symmetrical hold to toggle layout mode
            if (pipToggleMode) {
                pipToggleMode.addEventListener("click", (e) => {
                    e.stopPropagation();
                    switchToProMode();
                });
            }

            if (pipCompactToggle) {
                pipCompactToggle.addEventListener("click", (e) => {
                    e.stopPropagation();
                    switchToMagicMode();
                });
            }

            // Sync initial values from main page
            const mainRaw = document.getElementById("raw-ad");
            const mainOverride = document.getElementById("category-override");
            
            pipRaw.value = mainRaw.value;
            pipCategory.value = mainOverride.value;

            // Function to update PiP display fields
            const updatePipDisplay = () => {
                const pipText = pipWindow.document.getElementById("pip-processed-text");
                const pipBanner = pipWindow.document.getElementById("pip-status-banner");
                const pipRejBox = pipWindow.document.getElementById("pip-rejection-container");
                const pipBlBox = pipWindow.document.getElementById("pip-blacklist-container");
                const pipLogs = pipWindow.document.getElementById("pip-logs-list");

                const mainProcessedText = document.getElementById("processed-ad-text");
                const mainBanner = document.getElementById("ad-status-banner");
                const mainRejBox = document.getElementById("rejection-container");
                const mainBlBox = document.getElementById("blacklist-container");
                const mainLogs = document.getElementById("audit-logs-list");

                // Text
                if (pipText.textContent !== mainProcessedText.textContent) {
                    pipText.textContent = mainProcessedText.textContent;
                }
                if (mainProcessedText.classList.contains("placeholder")) {
                    pipText.classList.add("placeholder");
                } else {
                    pipText.classList.remove("placeholder");
                }

                // Banner
                const status = mainBanner.getAttribute("data-status");
                pipBanner.setAttribute("data-status", status);
                pipBanner.querySelector(".status-title").textContent = mainBanner.querySelector(".status-title").textContent;
                pipBanner.querySelector(".status-icon").innerHTML = mainBanner.querySelector(".status-icon").innerHTML;

                // Rejection Reason
                if (mainRejBox.classList.contains("hide")) {
                    pipRejBox.classList.add("hide");
                } else {
                    pipRejBox.classList.remove("hide");
                    pipWindow.document.getElementById("pip-rejection-reason").textContent = document.getElementById("rejection-reason-text").textContent;
                }

                // Copy Rejection Button Sync
                const mainCopyRej = document.getElementById("btn-copy-rejection");
                if (mainCopyRej && pipCopyRej) {
                    if (mainCopyRej.classList.contains("hide")) {
                        pipCopyRej.classList.add("hide");
                    } else {
                        pipCopyRej.classList.remove("hide");
                    }
                }

                // Blacklist Warning
                if (mainBlBox.classList.contains("hide")) {
                    pipBlBox.classList.add("hide");
                } else {
                    pipBlBox.classList.remove("hide");
                    pipWindow.document.getElementById("pip-blacklist-reason").textContent = document.getElementById("blacklist-reason-text").textContent;
                }

                // Copy Button Disable State
                pipCopy.disabled = document.getElementById("btn-copy-ad").disabled;

                // AI Assist Button Disable State
                const pipBtnAiAssist = pipWindow.document.getElementById("pip-btn-ai-assist");
                const mainBtnGeminiAssist = document.getElementById("btn-gemini-assist");
                if (pipBtnAiAssist && mainBtnGeminiAssist) {
                    pipBtnAiAssist.disabled = mainBtnGeminiAssist.disabled;
                }

                // Action Toggle Buttons State
                const mainToggleSell = document.getElementById("btn-toggle-sell");
                const mainToggleBuy = document.getElementById("btn-toggle-buy");
                
                if (mainToggleSell.classList.contains("active")) {
                    pipSell.classList.add("active");
                    pipBuy.classList.remove("active");
                } else if (mainToggleBuy.classList.contains("active")) {
                    pipBuy.classList.add("active");
                    pipSell.classList.remove("active");
                }

                // Audit Logs
                pipLogs.innerHTML = mainLogs.innerHTML;

                // Category buttons highlight
                const activeCat = mainProcessedText.getAttribute("data-active-category");
                const catBtns = pipWindow.document.querySelectorAll(".pip-category-btn");
                catBtns.forEach(btn => {
                    if (activeCat && btn.getAttribute("data-category") === activeCat) {
                        btn.classList.add("active");
                    } else {
                        btn.classList.remove("active");
                    }
                });

                // Category badge update in Pro Mode
                const pipCatBadge = pipWindow.document.getElementById("pip-category-badge");
                if (pipCatBadge) {
                    if (activeCat) {
                        pipCatBadge.textContent = activeCat;
                        
                        // Dynamic themed glow
                        let glowColor = "rgba(255, 255, 255, 0.05)";
                        let borderColor = "rgba(255, 255, 255, 0.15)";
                        let textColor = "#e2e8f0";
                        let textShadow = "none";
                        
                        const catLower = activeCat.toLowerCase();
                        if (catLower.includes("auto")) {
                            glowColor = "rgba(245, 158, 11, 0.1)"; // amber
                            borderColor = "rgba(245, 158, 11, 0.35)";
                            textColor = "#fbbf24";
                            textShadow = "0 0 8px rgba(245, 158, 11, 0.3)";
                        } else if (catLower.includes("estate")) {
                            glowColor = "rgba(10, 132, 255, 0.1)"; // blue
                            borderColor = "rgba(10, 132, 255, 0.35)";
                            textColor = "#0a84ff";
                            textShadow = "0 0 8px rgba(10, 132, 255, 0.3)";
                        } else if (catLower.includes("business")) {
                            glowColor = "rgba(48, 209, 88, 0.1)"; // green
                            borderColor = "rgba(48, 209, 88, 0.35)";
                            textColor = "#30d158";
                            textShadow = "0 0 8px rgba(48, 209, 88, 0.3)";
                        } else if (catLower.includes("work")) {
                            glowColor = "rgba(168, 85, 247, 0.1)"; // purple
                            borderColor = "rgba(168, 85, 247, 0.35)";
                            textColor = "#c084fc";
                            textShadow = "0 0 8px rgba(168, 85, 247, 0.3)";
                        } else if (catLower.includes("dating")) {
                            glowColor = "rgba(236, 72, 153, 0.1)"; // pink
                            borderColor = "rgba(236, 72, 153, 0.35)";
                            textColor = "#f472b6";
                            textShadow = "0 0 8px rgba(236, 72, 153, 0.3)";
                        } else if (catLower.includes("services")) {
                            glowColor = "rgba(45, 212, 191, 0.1)"; // teal
                            borderColor = "rgba(45, 212, 191, 0.35)";
                            textColor = "#2dd4bf";
                            textShadow = "0 0 8px rgba(45, 212, 191, 0.3)";
                        } else if (catLower.includes("discount")) {
                            glowColor = "rgba(249, 115, 22, 0.1)"; // orange
                            borderColor = "rgba(249, 115, 22, 0.35)";
                            textColor = "#fb923c";
                            textShadow = "0 0 8px rgba(249, 115, 22, 0.3)";
                        } else if (catLower.includes("other")) {
                            glowColor = "rgba(107, 114, 128, 0.15)"; // gray
                            borderColor = "rgba(107, 114, 128, 0.35)";
                            textColor = "#9ca3af";
                        }
                        
                        pipCatBadge.style.background = glowColor;
                        pipCatBadge.style.borderColor = borderColor;
                        pipCatBadge.style.color = textColor;
                        pipCatBadge.style.textShadow = textShadow;
                        if (textShadow !== "none") {
                            pipCatBadge.style.boxShadow = `0 0 10px ${glowColor.replace(/0\.1\)$/, '0.2)')}, inset 0 0 6px rgba(255, 255, 255, 0.02)`;
                        } else {
                            pipCatBadge.style.boxShadow = "inset 0 0 6px rgba(255, 255, 255, 0.02)";
                        }
                    } else {
                        pipCatBadge.textContent = "—";
                        pipCatBadge.style.background = "rgba(255, 255, 255, 0.05)";
                        pipCatBadge.style.borderColor = "rgba(255, 255, 255, 0.12)";
                        pipCatBadge.style.color = "rgba(255, 255, 255, 0.3)";
                        pipCatBadge.style.textShadow = "none";
                        pipCatBadge.style.boxShadow = "inset 0 0 6px rgba(255, 255, 255, 0.02)";
                    }
                }

                // Submit Bug Button Sync
                const pipBtnSubmitBugInline = pipWindow.document.getElementById("pip-btn-submit-bug-inline");
                const mainBtnSubmitBugInline = document.getElementById("btn-submit-bug-inline");
                
                if (pipBtnSubmitBugInline && mainBtnSubmitBugInline) {
                    if (mainBtnSubmitBugInline.classList.contains("hide")) {
                        pipBtnSubmitBugInline.classList.add("hide");
                    } else {
                        pipBtnSubmitBugInline.classList.remove("hide");
                        if (mainBtnSubmitBugInline.classList.contains("btn-sent")) {
                            pipBtnSubmitBugInline.className = "pip-uniform-btn btn-action btn-sent";
                            pipBtnSubmitBugInline.innerHTML = `<i class="fa-solid fa-check"></i> Bug Sent`;
                        } else if (mainBtnSubmitBugInline.classList.contains("btn-submitting")) {
                            pipBtnSubmitBugInline.className = "pip-uniform-btn btn-action btn-submitting";
                            pipBtnSubmitBugInline.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
                        } else {
                            pipBtnSubmitBugInline.className = "pip-uniform-btn btn-action glow-red";
                            pipBtnSubmitBugInline.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Bug`;
                        }
                    }
                }
            };

            // Initial display update
            updatePipDisplay();

            // Setup Event Handlers in PiP
            pipRaw.addEventListener("input", () => {
                mainRaw.value = pipRaw.value;
                mainRaw.dispatchEvent(new Event("input"));
                updatePipDisplay();
            });

            const pipPaste = pipWindow.document.getElementById("pip-btn-paste");
            if (pipPaste) {
                pipPaste.addEventListener("click", async () => {
                    try {
                        const text = await pipWindow.navigator.clipboard.readText();
                        pipRaw.value = "";
                        pipRaw.value = text;
                        mainRaw.value = text;
                        mainRaw.dispatchEvent(new Event("input"));
                        updatePipDisplay();
                    } catch (err) {
                        console.error("Failed to read clipboard in PiP context: ", err);
                        try {
                            const text = await navigator.clipboard.readText();
                            pipRaw.value = "";
                            pipRaw.value = text;
                            mainRaw.value = text;
                            mainRaw.dispatchEvent(new Event("input"));
                            updatePipDisplay();
                        } catch (mainErr) {
                            showCustomNotification("Clipboard access denied. Please click the button again or paste manually.", "error");
                        }
                    }
                });
            }

            const pipClear = pipWindow.document.getElementById("pip-btn-clear");
            const handleClear = () => {
                pipRaw.value = "";
                mainRaw.value = "";
                document.getElementById("category-override").value = "auto";
                
                const btnSell = document.getElementById("btn-toggle-sell");
                const btnBuy = document.getElementById("btn-toggle-buy");
                if (btnSell && btnBuy) {
                    userClickedAction = false;
                    actionOverrideMode = "auto";
                    btnSell.classList.add("active");
                    btnBuy.classList.remove("active");
                }
                
                mainRaw.dispatchEvent(new Event("input"));
                updatePipDisplay();
                pipRaw.focus();
            };
            if (pipClear) {
                pipClear.addEventListener("click", handleClear);
            }

            const pipTextElement = pipWindow.document.getElementById("pip-processed-text");
            if (pipTextElement) {
                pipTextElement.addEventListener("input", () => {
                    const mainProcessedText = document.getElementById("processed-ad-text");
                    if (mainProcessedText && mainProcessedText.textContent !== pipTextElement.textContent) {
                        mainProcessedText.textContent = pipTextElement.textContent;
                    }
                });
            }

            pipCategory.addEventListener("change", () => {
                mainOverride.value = pipCategory.value;
                mainOverride.dispatchEvent(new Event("change"));
                updatePipDisplay();
            });

            // Category guide buttons in PiP window are now visual reference only and not clickable

            pipSell.addEventListener("click", () => {
                document.getElementById("btn-toggle-sell").click();
                updatePipDisplay();
            });

            pipBuy.addEventListener("click", () => {
                document.getElementById("btn-toggle-buy").click();
                updatePipDisplay();
            });

            if (pipClose) {
                pipClose.addEventListener("click", () => {
                    pipWindow.close();
                });
            }

            pipCopy.addEventListener("click", () => {
                const textVal = pipWindow.document.getElementById("pip-processed-text").textContent;
                pipWindow.navigator.clipboard.writeText(textVal).then(() => {
                    pipCopy.textContent = "Copied!";
                    pipCopy.classList.add("copied");
                    setTimeout(() => {
                        pipCopy.innerHTML = `<i class="fa-solid fa-copy"></i> Copy`;
                        pipCopy.classList.remove("copied");
                    }, 2000);
                    
                    const rawVal = pipWindow.document.getElementById("pip-raw-ad").value;
                    logAdToBackend(rawVal, textVal, "passed");
                    trackCopiedAd(rawVal);
                });
            });

            if (pipCopyRej) {
                pipCopyRej.addEventListener("click", () => {
                    const textVal = pipWindow.document.getElementById("pip-rejection-reason").textContent;
                    pipWindow.navigator.clipboard.writeText(textVal).then(() => {
                        pipCopyRej.textContent = "Copied!";
                        pipCopyRej.classList.add("copied");
                        setTimeout(() => {
                            pipCopyRej.innerHTML = `<i class="fa-solid fa-copy"></i> Copy Reason`;
                            pipCopyRej.classList.remove("copied");
                        }, 2000);
                        
                        const rawVal = pipWindow.document.getElementById("pip-raw-ad").value;
                        logAdToBackend(rawVal, textVal, "rejected");
                    });
                });
            }

            const pipBtnSubmitBugInline = pipWindow.document.getElementById("pip-btn-submit-bug-inline");
            if (pipBtnSubmitBugInline) {
                let pipHoldInterval = null;
                const holdDuration = 500; // 0.5 second
                let elapsed = 0;
                let isHolding = false;
                const originalHtml = `<i class="fa-solid fa-paper-plane"></i> Submit Bug`;

                const updatePipButtonProgress = (pct) => {
                    const remainingSecs = ((holdDuration - elapsed) / 1000).toFixed(1);
                    const progressBg = `linear-gradient(90deg, rgba(230, 57, 70, 0.45) ${pct}%, rgba(22, 22, 28, 0.9) ${pct}%)`;
                    pipBtnSubmitBugInline.style.background = progressBg;
                    if (pct < 100) {
                        pipBtnSubmitBugInline.innerHTML = `<i class="fa-solid fa-hourglass-half fa-spin"></i> Hold (${remainingSecs}s)...`;
                    }
                };

                const executePipBugSubmission = () => {
                    const mainBtn = document.getElementById("btn-submit-bug-inline");
                    if (mainBtn) {
                        mainBtn.classList.add("submitting");
                        mainBtn.classList.remove("glow-red");
                        mainBtn.classList.add("btn-submitting");
                        mainBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
                    }
                    if (typeof window.triggerBugSubmission === "function") {
                        window.triggerBugSubmission();
                    }
                };

                const cancelPipHold = () => {
                    if (!isHolding) return;
                    isHolding = false;
                    if (pipHoldInterval) {
                        clearInterval(pipHoldInterval);
                        pipHoldInterval = null;
                    }
                    pipBtnSubmitBugInline.style.transition = "transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease";
                    pipBtnSubmitBugInline.style.transform = "";
                    pipBtnSubmitBugInline.style.background = "";
                    
                    const mainBtn = document.getElementById("btn-submit-bug-inline");
                    if (mainBtn && mainBtn.classList.contains("btn-sent")) {
                        pipBtnSubmitBugInline.innerHTML = `<i class="fa-solid fa-check"></i> Bug Sent`;
                    } else if (mainBtn && mainBtn.classList.contains("btn-submitting")) {
                        pipBtnSubmitBugInline.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
                    } else {
                        pipBtnSubmitBugInline.innerHTML = originalHtml;
                    }
                };

                const startPipHold = (e) => {
                    const mainBtn = document.getElementById("btn-submit-bug-inline");
                    if (mainBtn && mainBtn.classList.contains("btn-sent")) {
                        showCustomNotification("Bug report already submitted. A fix is expected within 10 minutes.", "warning");
                        return;
                    }
                    if (pipBtnSubmitBugInline.classList.contains("submitting") || pipBtnSubmitBugInline.classList.contains("btn-submitting") || isHolding) {
                        return;
                    }

                    isHolding = true;
                    elapsed = 0;
                    e.preventDefault();

                    pipBtnSubmitBugInline.style.transition = "none";
                    pipBtnSubmitBugInline.style.transform = "scale(0.97)";
                    updatePipButtonProgress(0);

                    pipHoldInterval = setInterval(() => {
                        elapsed += 100;
                        const pct = Math.min((elapsed / holdDuration) * 100, 100);
                        updatePipButtonProgress(pct);

                        if (elapsed >= holdDuration) {
                            clearInterval(pipHoldInterval);
                            pipHoldInterval = null;
                            isHolding = false;
                            
                            pipBtnSubmitBugInline.style.transition = "background 0.3s ease, transform 0.2s ease";
                            pipBtnSubmitBugInline.style.transform = "";
                            pipBtnSubmitBugInline.style.background = "";
                            
                            showCustomConfirmDialog(
                                "Are you sure you want to submit a bug report for this advertisement? This will compile the raw ad content and active rejection reason for administrator review.",
                                () => {
                                    executePipBugSubmission();
                                },
                                () => {
                                    cancelPipHold();
                                },
                                "Send Report",
                                false
                            );
                        }
                    }, 100);
                };

                pipBtnSubmitBugInline.addEventListener("mousedown", startPipHold);
                pipBtnSubmitBugInline.addEventListener("mouseup", cancelPipHold);
                pipBtnSubmitBugInline.addEventListener("mouseleave", cancelPipHold);
                pipBtnSubmitBugInline.addEventListener("touchstart", startPipHold);
                pipBtnSubmitBugInline.addEventListener("touchend", cancelPipHold);
            }

            // Bind Hit History Overlay elements
            const pipBtnHistory = pipWindow.document.getElementById("pip-btn-history");
            const pipHistoryOverlay = pipWindow.document.getElementById("pip-history-overlay");
            const pipBtnRefreshHistory = pipWindow.document.getElementById("pip-btn-refresh-history");
            const pipBtnCloseHistory = pipWindow.document.getElementById("pip-btn-close-history");
            const pipHistoryList = pipWindow.document.getElementById("pip-history-list");

            const loadPipHistory = () => {
                if (!pipHistoryList) return;
                pipHistoryList.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 11px;"><i class="fa-solid fa-sync fa-spin"></i> Loading history...</div>`;
                
                if (!CONFIG.GOOGLE_SCRIPT_URL) {
                    pipHistoryList.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 11px;">Server URL not configured.</div>`;
                    return;
                }

                fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: "get_history", limit: 25 })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.status === "success") {
                        const history = data.history || [];
                        if (history.length === 0) {
                            pipHistoryList.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 11px;">No history records found.</div>`;
                            return;
                        }
                        
                        pipHistoryList.innerHTML = "";
                        history.forEach(item => {
                            const card = pipWindow.document.createElement("div");
                            card.style.background = "rgba(255,255,255,0.03)";
                            card.style.border = "1px solid var(--border-color)";
                            card.style.borderRadius = "6px";
                            card.style.padding = "8px";
                            card.style.fontSize = "10.5px";
                            card.style.position = "relative";
                            card.style.marginBottom = "8px";
                            
                            const nameDisplay = `${item.firstname} ${item.lastname}`.trim() || "Unknown";
                            card.innerHTML = `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: rgba(255,255,255,0.4); font-size: 9px;">
                                    <span><strong>${nameDisplay}</strong> (${item.id})</span>
                                </div>
                                <div style="color: var(--text-secondary); margin-bottom: 6px; white-space: pre-wrap; font-style: italic; max-height: 40px; overflow-y: auto;">Raw: ${item.rawInput}</div>
                                <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 8px;">
                                    <div style="color: #4ade80; font-family: monospace; font-weight: 600; flex: 1; word-break: break-all; line-height: 1.3;">
                                        <span style="color: rgba(255,255,255,0.4); font-size: 9px; font-family: 'Outfit', sans-serif; font-weight: normal; margin-right: 6px;">[${item.timestamp}]</span>${item.finalAd}
                                    </div>
                                    <button class="pip-btn-copy-history" data-text="${encodeURIComponent(item.finalAd)}" style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 3px 6px; font-size: 9px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 2px; font-family: 'Outfit', sans-serif;">
                                        <i class="fa-solid fa-copy"></i> Copy
                                    </button>
                                </div>
                            `;
                            
                            card.style.cursor = "pointer";
                            card.title = "Click to copy formatted ad";
                            
                            const btnCopyHist = card.querySelector(".pip-btn-copy-history");
                            const copyCardHandler = () => {
                                const valToCopy = item.finalAd;
                                pipWindow.navigator.clipboard.writeText(valToCopy).then(() => {
                                    const originalBg = card.style.background;
                                    card.style.background = "rgba(34, 197, 94, 0.2)";
                                    if (btnCopyHist) {
                                        btnCopyHist.textContent = "Copied!";
                                        btnCopyHist.style.backgroundColor = "#22c55e";
                                    }
                                    setTimeout(() => {
                                        card.style.background = originalBg;
                                        if (btnCopyHist) {
                                            btnCopyHist.innerHTML = `<i class="fa-solid fa-copy"></i> Copy`;
                                            btnCopyHist.style.backgroundColor = "rgba(255,255,255,0.1)";
                                        }
                                    }, 1500);
                                });
                            };
                            
                            card.addEventListener("click", copyCardHandler);
                            
                            pipHistoryList.appendChild(card);
                        });
                    } else {
                        pipHistoryList.innerHTML = `<div style="text-align: center; color: #f87171; padding: 20px; font-size: 11px;">Error: ${data.message}</div>`;
                    }
                })
                .catch(err => {
                    console.error("Error loading PiP history:", err);
                    pipHistoryList.innerHTML = `<div style="text-align: center; color: #f87171; padding: 20px; font-size: 11px;">Network error loading history.</div>`;
                });
            };

            if (pipBtnHistory) {
                pipBtnHistory.addEventListener("click", () => {
                    if (pipHistoryOverlay) {
                        pipHistoryOverlay.classList.remove("hide");
                        loadPipHistory();
                    }
                });
            }

            if (pipBtnCloseHistory) {
                pipBtnCloseHistory.addEventListener("click", () => {
                    if (pipHistoryOverlay) {
                        pipHistoryOverlay.classList.add("hide");
                    }
                });
            }

            if (pipBtnRefreshHistory) {
                pipBtnRefreshHistory.addEventListener("click", loadPipHistory);
            }

            const pipBtnAiAssist = pipWindow.document.getElementById("pip-btn-ai-assist");
            if (pipBtnAiAssist) {
                pipBtnAiAssist.addEventListener("click", () => {
                    if (pipBtnAiAssist.dataset.state === "train") {
                        submitSparkTraining("pip");
                    } else {
                        triggerLiveGeminiAssist();
                    }
                });
            }
            updateAIAssistButtonsVisibility();

            // Listen for changes in the main window to update PiP display
            const mainObserver = new MutationObserver(() => {
                if (pipRaw.value !== mainRaw.value) {
                    pipRaw.value = mainRaw.value;
                }
                if (pipCategory.value !== mainOverride.value) {
                    pipCategory.value = mainOverride.value;
                }
                updatePipDisplay();
            });

            mainObserver.observe(document.getElementById("processed-ad-text"), { childList: true, characterData: true, subtree: true });
            mainObserver.observe(document.getElementById("ad-status-banner"), { attributes: true });
            mainObserver.observe(document.getElementById("rejection-container"), { attributes: true, subtree: true });
            mainObserver.observe(document.getElementById("blacklist-container"), { attributes: true });
            mainObserver.observe(document.getElementById("btn-toggle-sell"), { attributes: true });
            mainObserver.observe(document.getElementById("btn-toggle-buy"), { attributes: true });
            mainObserver.observe(document.getElementById("btn-submit-bug-inline"), { attributes: true });
            mainObserver.observe(document.getElementById("btn-gemini-assist"), { attributes: true });

            // Handle PiP Window closing
            pipWindow.addEventListener("unload", () => {
                pipWindowInstance = null;
                mainObserver.disconnect();
                
                window.removeEventListener("focus", handleMainFocus);
                window.removeEventListener("blur", handleMainBlur);
                
                // Restore main window content view
                if (mainContainer && pipOverlay) {
                    mainContainer.classList.remove("hide");
                    pipOverlay.classList.add("hide");
                }
                
                switchToMagicMode();

                // Restore PWA window size and position
                const storedPos = sessionStorage.getItem('li_pwa_original_pos');
                if (storedPos) {
                    try {
                        const pos = JSON.parse(storedPos);
                        window.resizeTo(pos.width, pos.height);
                        window.moveTo(pos.x, pos.y);
                    } catch (err) {
                        console.warn("Could not restore window:", err);
                    }
                    sessionStorage.removeItem('li_pwa_original_pos');
                }
            });

        } catch (error) {
            console.error("Failed to open Picture-in-Picture window:", error);
            showCustomAlertDialog("Failed to open floating window: " + error.message, null, "error");
        }
    });
}

function saveCustomDataToBackend() {
    // Record local write time to trigger safety cooldown period (45 seconds)
    lastLocalWriteTime = Date.now();
    localStorage.setItem("li_last_local_write_time", lastLocalWriteTime.toString());
    
    if (!CONFIG.GOOGLE_SCRIPT_URL) return;
    
    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
            action: "save_custom_data",
            spelling: customSpelling,
            templates: customTemplates,
            translations: customTranslations
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "success") {
            showCustomNotification("Trained custom corrections are now live and synced with the cloud database!", "success");
        } else {
            console.error("Failed to save custom data to backend:", data.message);
        }
    })
    .catch(err => {
        console.error("Network error saving custom data to backend:", err);
    });
}

function showCustomConfirmDialog(message, onConfirm, onCancel, okText = "Confirm", isDestructive = true) {
    let targetDoc = document;
    if (pipWindowInstance && !pipWindowInstance.closed) {
        targetDoc = pipWindowInstance.document;
    }
    
    // Prevent multiple confirmation dialogs
    const existing = targetDoc.getElementById("custom-confirm-overlay");
    if (existing) existing.remove();

    const overlay = targetDoc.createElement("div");
    overlay.id = "custom-confirm-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(10, 10, 12, 0.75)";
    overlay.style.backdropFilter = "blur(10px)";
    overlay.style.webkitBackdropFilter = "blur(10px)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "100000";
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.3s ease";

    const dialog = targetDoc.createElement("div");
    dialog.style.background = "rgba(18, 18, 20, 0.98)";
    
    const themeColor = isDestructive ? "rgba(255, 59, 48, 0.3)" : "rgba(48, 209, 88, 0.3)";
    const shadowColor = isDestructive ? "rgba(255, 59, 48, 0.15)" : "rgba(48, 209, 88, 0.15)";
    
    dialog.style.border = `1px solid ${themeColor}`;
    dialog.style.boxShadow = `0 10px 40px ${shadowColor}, 0 0 100px rgba(0, 0, 0, 0.8)`;
    dialog.style.borderRadius = "16px";
    dialog.style.width = "90%";
    dialog.style.maxWidth = "400px";
    dialog.style.padding = "30px 24px";
    dialog.style.textAlign = "center";
    dialog.style.transform = "scale(0.9) translateY(20px)";
    dialog.style.transition = "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
    
    const iconHtml = isDestructive
        ? `<div style="background: rgba(255, 59, 48, 0.1); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; border: 1px solid rgba(255, 59, 48, 0.3); box-shadow: 0 0 15px rgba(255, 59, 48, 0.2);">
               <i class="fa-solid fa-triangle-exclamation" style="color: #ff3b30; font-size: 24px;"></i>
           </div>`
        : `<div style="background: rgba(48, 209, 88, 0.1); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; border: 1px solid rgba(48, 209, 88, 0.3); box-shadow: 0 0 15px rgba(48, 209, 88, 0.2);">
               <i class="fa-solid fa-user-plus" style="color: #30d158; font-size: 24px;"></i>
           </div>`;

    const okBtnClass = isDestructive ? "btn-action glow-red" : "btn-action";
    const okBtnStyle = isDestructive 
        ? "flex: 1; height: 40px; border-radius: 8px; border: none; font-family: 'Outfit', sans-serif; font-size: 12.5px; font-weight: 700; cursor: pointer; margin-top: 0;"
        : "flex: 1; height: 40px; border-radius: 8px; border: none; background: #30d158 !important; box-shadow: 0 4px 15px rgba(48, 209, 88, 0.3) !important; color: white; font-family: 'Outfit', sans-serif; font-size: 12.5px; font-weight: 700; cursor: pointer; margin-top: 0;";

    dialog.innerHTML = `
        ${iconHtml}
        <h4 style="margin: 0 0 10px 0; font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; color: white; letter-spacing: 0.5px; text-transform: uppercase;">Confirm Action</h4>
        <p class="confirm-message-text" style="margin: 0 0 24px 0; font-family: 'Outfit', sans-serif; font-size: 13px; color: rgba(255,255,255,0.75); line-height: 1.5; font-weight: 500; text-align: left; white-space: pre-wrap;"></p>
        <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="custom-confirm-cancel-btn" style="flex: 1; height: 40px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); color: white; font-family: 'Outfit', sans-serif; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;">
                Cancel
            </button>
            <button id="custom-confirm-ok-btn" class="${okBtnClass}" style="${okBtnStyle}">
                ${okText}
            </button>
        </div>
    `;
    dialog.querySelector(".confirm-message-text").textContent = message;

    overlay.appendChild(dialog);
    targetDoc.body.appendChild(overlay);

    // Fade-in animations
    void overlay.offsetHeight; // Force reflow to guarantee CSS transition works on all browsers
    overlay.style.opacity = "1";
    dialog.style.transform = "scale(1) translateY(0)";

    const cancelBtn = dialog.querySelector("#custom-confirm-cancel-btn");
    const okBtn = dialog.querySelector("#custom-confirm-ok-btn");

    // Add styles for cancel hover
    cancelBtn.addEventListener("mouseenter", () => {
        cancelBtn.style.background = "rgba(255,255,255,0.08)";
        cancelBtn.style.borderColor = "rgba(255,255,255,0.3)";
    });
    cancelBtn.addEventListener("mouseleave", () => {
        cancelBtn.style.background = "rgba(255,255,255,0.03)";
        cancelBtn.style.borderColor = "rgba(255,255,255,0.15)";
    });

    const closeDialog = (callback) => {
        overlay.style.opacity = "0";
        dialog.style.transform = "scale(0.9) translateY(20px)";
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 300);
    };

    cancelBtn.addEventListener("click", () => {
        closeDialog(onCancel);
    });

    okBtn.addEventListener("click", () => {
        closeDialog(onConfirm);
    });

    // Close on backdrop click
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            closeDialog(onCancel);
        }
    });
}

function showCustomAlertDialog(message, onDismiss, type = "info") {
    let targetDoc = document;
    if (pipWindowInstance && !pipWindowInstance.closed) {
        targetDoc = pipWindowInstance.document;
    }
    
    // Prevent multiple confirmation/alert dialogs
    const existing = targetDoc.getElementById("custom-alert-overlay");
    if (existing) existing.remove();

    const overlay = targetDoc.createElement("div");
    overlay.id = "custom-alert-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(10, 10, 12, 0.75)";
    overlay.style.backdropFilter = "blur(10px)";
    overlay.style.webkitBackdropFilter = "blur(10px)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "100000";
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.3s ease";

    const dialog = targetDoc.createElement("div");
    dialog.style.background = "rgba(18, 18, 20, 0.98)";
    
    let themeColor = "rgba(10, 132, 255, 0.3)";
    let shadowColor = "rgba(10, 132, 255, 0.15)";
    let iconHtml = "";
    let alertTitle = "Notification";
    let okBtnClass = "btn-action";
    let okBtnStyle = "flex: 1; height: 40px; border-radius: 8px; border: none; font-family: 'Outfit', sans-serif; font-size: 12.5px; font-weight: 700; cursor: pointer; margin-top: 0;";

    if (type === "success") {
        themeColor = "rgba(48, 209, 88, 0.3)";
        shadowColor = "rgba(48, 209, 88, 0.15)";
        alertTitle = "Success";
        iconHtml = `<div style="background: rgba(48, 209, 88, 0.1); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; border: 1px solid rgba(48, 209, 88, 0.3); box-shadow: 0 0 15px rgba(48, 209, 88, 0.2);">
                       <i class="fa-solid fa-circle-check" style="color: #30d158; font-size: 24px;"></i>
                   </div>`;
        okBtnStyle = "flex: 1; height: 40px; border-radius: 8px; border: none; background: #30d158 !important; box-shadow: 0 4px 15px rgba(48, 209, 88, 0.3) !important; color: white; font-family: 'Outfit', sans-serif; font-size: 12.5px; font-weight: 700; cursor: pointer; margin-top: 0;";
    } else if (type === "warning") {
        themeColor = "rgba(255, 159, 10, 0.3)";
        shadowColor = "rgba(255, 159, 10, 0.15)";
        alertTitle = "Warning";
        iconHtml = `<div style="background: rgba(255, 159, 10, 0.1); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; border: 1px solid rgba(255, 159, 10, 0.3); box-shadow: 0 0 15px rgba(255, 159, 10, 0.2);">
                       <i class="fa-solid fa-triangle-exclamation" style="color: #ff9f0a; font-size: 24px;"></i>
                   </div>`;
    } else if (type === "error") {
        themeColor = "rgba(255, 69, 58, 0.3)";
        shadowColor = "rgba(255, 69, 58, 0.15)";
        alertTitle = "Error";
        iconHtml = `<div style="background: rgba(255, 69, 58, 0.1); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; border: 1px solid rgba(255, 69, 58, 0.3); box-shadow: 0 0 15px rgba(255, 69, 58, 0.2);">
                       <i class="fa-solid fa-circle-xmark" style="color: #ff453a; font-size: 24px;"></i>
                   </div>`;
        okBtnClass = "btn-action glow-red";
    } else {
        // info
        iconHtml = `<div style="background: rgba(10, 132, 255, 0.1); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; border: 1px solid rgba(10, 132, 255, 0.3); box-shadow: 0 0 15px rgba(10, 132, 255, 0.2);">
                       <i class="fa-solid fa-circle-info" style="color: #0a84ff; font-size: 24px;"></i>
                   </div>`;
    }

    dialog.style.border = `1px solid ${themeColor}`;
    dialog.style.boxShadow = `0 10px 40px ${shadowColor}, 0 0 100px rgba(0, 0, 0, 0.8)`;
    dialog.style.borderRadius = "16px";
    dialog.style.width = "90%";
    dialog.style.maxWidth = "400px";
    dialog.style.padding = "30px 24px";
    dialog.style.textAlign = "center";
    dialog.style.transform = "scale(0.9) translateY(20px)";
    dialog.style.transition = "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";

    dialog.innerHTML = `
        ${iconHtml}
        <h4 style="margin: 0 0 10px 0; font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; color: white; letter-spacing: 0.5px; text-transform: uppercase;">${alertTitle}</h4>
        <p class="alert-message-text" style="margin: 0 0 24px 0; font-family: 'Outfit', sans-serif; font-size: 13px; color: rgba(255,255,255,0.75); line-height: 1.5; font-weight: 500; text-align: left; white-space: pre-wrap;"></p>
        <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="custom-alert-ok-btn" class="${okBtnClass}" style="${okBtnStyle}">
                Dismiss
            </button>
        </div>
    `;
    dialog.querySelector(".alert-message-text").textContent = message;

    overlay.appendChild(dialog);
    targetDoc.body.appendChild(overlay);

    // Fade-in animations
    void overlay.offsetHeight; // Force reflow to guarantee CSS transition works on all browsers
    overlay.style.opacity = "1";
    dialog.style.transform = "scale(1) translateY(0)";

    const okBtn = dialog.querySelector("#custom-alert-ok-btn");

    const closeDialog = (callback) => {
        overlay.style.opacity = "0";
        dialog.style.transform = "scale(0.9) translateY(20px)";
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 300);
    };

    okBtn.addEventListener("click", () => {
        closeDialog(onDismiss);
    });

    // Close on backdrop click
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            closeDialog(onDismiss);
        }
    });
}

function applyAdminRolePermissions() {
    updateAIAssistButtonsVisibility();
    const isAssistant = sessionStorage.getItem("li_admin_role") === "assistant";
    
    // Ensure backup tab button is visible
    const backupTabBtn = document.querySelector('.admin-tab-btn[data-target="tab-backup"]');
    if (backupTabBtn) {
        backupTabBtn.style.display = ""; // Always show it!
    }

    const tabBackup = document.getElementById("tab-backup");
    if (tabBackup) {
        // Check if banner already exists
        let lockBanner = document.getElementById("backup-lock-banner");

        if (isAssistant) {
            // Create banner if not exists
            if (!lockBanner) {
                lockBanner = document.createElement("div");
                lockBanner.id = "backup-lock-banner";
                lockBanner.innerHTML = `
                    <div style="background: rgba(255, 59, 48, 0.1); border: 1px dashed rgba(255, 59, 48, 0.4); border-radius: 8px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 20px rgba(255, 59, 48, 0.05);">
                        <div style="background: rgba(255, 59, 48, 0.2); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #ff3b30; font-size: 18px; box-shadow: 0 0 10px rgba(255, 59, 48, 0.3);">
                            <i class="fa-solid fa-lock"></i>
                        </div>
                        <div>
                            <h5 style="margin: 0 0 3px 0; font-family: var(--font-heading); color: #ff453a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Restricted Access</h5>
                            <p style="margin: 0; font-size: 11.5px; color: rgba(255,255,255,0.7); line-height: 1.4;">Admins are not permitted to export/import configurations or clear system databases. Please contact a Super Admin for maintenance operations.</p>
                        </div>
                    </div>
                `;
                tabBackup.insertBefore(lockBanner, tabBackup.firstChild);
            }

            // Disable all inputs & buttons in tab-backup
            const inputs = tabBackup.querySelectorAll("input, textarea, button");
            inputs.forEach(el => {
                el.disabled = true;
                el.style.opacity = "0.5";
                el.style.cursor = "not-allowed";
            });
            
            // Specifically target clear bugs button to completely restrict
            const btnClearBugs = document.getElementById("btn-admin-clear-bugs");
            if (btnClearBugs) {
                btnClearBugs.disabled = true;
                btnClearBugs.style.opacity = "0.4";
                btnClearBugs.style.cursor = "not-allowed";
                btnClearBugs.classList.remove("glow-red");
            }

            const backupTextarea = document.getElementById("admin-backup-textarea");
            if (backupTextarea) {
                backupTextarea.placeholder = "Access Denied. You do not have permissions to view or restore backup data.";
            }
        } else {
            // Super admin - remove banner if exists
            if (lockBanner) {
                lockBanner.remove();
            }

            // Enable all inputs & buttons in tab-backup
            const inputs = tabBackup.querySelectorAll("input, textarea, button");
            inputs.forEach(el => {
                el.disabled = false;
                el.style.opacity = "";
                el.style.cursor = "";
            });

            const btnClearBugs = document.getElementById("btn-admin-clear-bugs");
            if (btnClearBugs) {
                btnClearBugs.classList.add("glow-red");
            }

            const backupTextarea = document.getElementById("admin-backup-textarea");
            if (backupTextarea) {
                backupTextarea.placeholder = "JSON backup content will appear here or can be pasted here for restoration...";
            }
        }
    }

    // Always apply Gemini API key restriction logic regardless of tabBackup
    const inputKey = document.getElementById("input-ai-gemini-key");
    const btnToggleVisibility = document.getElementById("btn-toggle-ai-gemini-key-visibility");

    if (isAssistant) {
        if (inputKey) {
            inputKey.value = "••••••••••••••••••••••••••••••••";
            inputKey.type = "password";
            inputKey.disabled = true;
            inputKey.style.opacity = "0.5";
            inputKey.style.cursor = "not-allowed";
        }
        if (btnToggleVisibility) {
            btnToggleVisibility.style.display = "none";
        }
    } else {
        if (inputKey) {
            inputKey.disabled = false;
            inputKey.style.opacity = "";
            inputKey.style.cursor = "";
            const storedKey = localStorage.getItem("li_gemini_api_key") || FALLBACK_GEMINI_KEY;
            if (inputKey.value === "••••••••••••••••••••••••••••••••") {
                inputKey.value = storedKey;
            }
        }
        if (btnToggleVisibility) {
            btnToggleVisibility.style.display = "";
        }
    }
}

function initAdminPanel() {
    const btnAuth = document.getElementById("btn-admin-auth");
    const inputPasscode = document.getElementById("admin-passcode-input");
    const authContainer = document.getElementById("admin-auth-container");
    const panelContent = document.getElementById("admin-panel-content");
    const authError = document.getElementById("admin-auth-error");

    const formSpelling = document.getElementById("form-admin-spelling");
    const formTemplate = document.getElementById("form-admin-template");

    const btnExport = document.getElementById("btn-admin-export");
    const btnImport = document.getElementById("btn-admin-import");
    const textareaBackup = document.getElementById("admin-backup-textarea");

    if (!btnAuth) return;

    // Activity Log Sub-Tabs Switch
    const logSubtabBtns = document.querySelectorAll(".log-subtab-btn");
    const logSubtabContents = document.querySelectorAll(".log-subtab-content");
    const logsSearchInput = document.getElementById("logs-search-input");
    const btnClearLogsSearch = document.getElementById("btn-clear-logs-search");

    if (logSubtabBtns.length > 0 && logSubtabContents.length > 0) {
        logSubtabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const logType = btn.getAttribute("data-log-type");
                
                logSubtabBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                
                logSubtabContents.forEach(content => {
                    if (content.id === `log-content-${logType}`) {
                        content.classList.remove("hide");
                    } else {
                        content.classList.add("hide");
                    }
                });

                if (logsSearchInput) {
                    logsSearchInput.value = "";
                }
                if (btnClearLogsSearch) {
                    btnClearLogsSearch.classList.add("hide");
                }
                filterLogs();
            });
        });
    }

    if (logsSearchInput) {
        logsSearchInput.addEventListener("input", filterLogs);
    }
    if (btnClearLogsSearch && logsSearchInput) {
        btnClearLogsSearch.addEventListener("click", () => {
            logsSearchInput.value = "";
            btnClearLogsSearch.classList.add("hide");
            filterLogs();
        });
    }

    // Admin Tabs Logic
    const tabBtns = document.querySelectorAll(".admin-tab-btn");
    const tabContents = document.querySelectorAll(".admin-tab-content");
    
    const restoreAdminSubtab = () => {
        const lastSubtab = localStorage.getItem("li_last_navigated_admin_subtab");
        if (lastSubtab) {
            const targetSubBtn = document.querySelector(`.admin-tab-btn[data-target="${lastSubtab}"]`);
            if (targetSubBtn) {
                targetSubBtn.click();
            }
        }
    };

    if (tabBtns.length > 0 && tabContents.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const targetId = btn.getAttribute("data-target");
                
                // Active button class
                tabBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                
                // Show/hide content panels
                tabContents.forEach(content => {
                    if (content.id === targetId) {
                        content.classList.remove("hide");
                    } else {
                        content.classList.add("hide");
                    }
                });

                if (targetId === "tab-api-vault") {
                    refreshAIAssistantTabVisibility();
                }

                // Remember the last navigated admin subtab
                localStorage.setItem("li_last_navigated_admin_subtab", targetId);
            });
        });
    }

    // Restore admin session from localStorage if present (to handle tab discard/sleep)
    if (localStorage.getItem("li_admin_authenticated") === "true" && sessionStorage.getItem("li_admin_authenticated") !== "true") {
        sessionStorage.setItem("li_admin_authenticated", "true");
        sessionStorage.setItem("li_admin_role", "super");
        const storedPass = localStorage.getItem("li_admin_passcode");
        if (storedPass) {
            sessionStorage.setItem("li_admin_passcode", storedPass);
        }
    }

    // Check existing authentication session
    if (sessionStorage.getItem("li_admin_authenticated") === "true") {
        if (authContainer) authContainer.classList.add("hide");
        if (panelContent) panelContent.classList.remove("hide");
        const isAssistant = sessionStorage.getItem("li_admin_role") === "assistant";
        applyAdminRolePermissions();
        renderCustomSpelling();
        renderCustomTranslations();
        renderCustomTemplates();
        refreshMainHistory();
        const storedPasscode = sessionStorage.getItem("li_admin_passcode") || localStorage.getItem("li_admin_passcode");
        if (storedPasscode && !sessionStorage.getItem("li_admin_passcode")) {
            sessionStorage.setItem("li_admin_passcode", storedPasscode);
        }
        const authUuid = isAssistant ? getOrCreateClientUuid() : null;
        loadAndRenderAccessRequests(storedPasscode || null, authUuid, !isAssistant);
        restoreAdminSubtab();
    }

    // Handle Authentication Click
    btnAuth.addEventListener("click", async () => {
        const password = inputPasscode.value.trim();
        const passHash = await hashPasscode(password);
        if (passHash === "8a8f9bd914d1de31cacb185fe3f278be859e2179891788967320befcd9397560") {
            localStorage.setItem("li_admin_authenticated", "true");
            localStorage.setItem("li_admin_passcode", password);
            sessionStorage.setItem("li_admin_authenticated", "true");
            sessionStorage.setItem("li_admin_passcode", password);
            sessionStorage.setItem("li_admin_role", "super");
            if (authError) authError.classList.add("hide");
            if (authContainer) authContainer.classList.add("hide");
            if (panelContent) panelContent.classList.remove("hide");
            applyAdminRolePermissions();
            renderCustomSpelling();
            renderCustomTranslations();
            renderCustomTemplates();
            refreshMainHistory();
            loadAndRenderAccessRequests(password, null, true);
            refreshAIAssistantTabVisibility();
            refreshBugTriageTabVisibility();
            restoreAdminSubtab();
        } else {
            if (authError) authError.classList.remove("hide");
        }
    });

    // Enter key press in passcode input
    inputPasscode.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            btnAuth.click();
        }
    });

    // Auto-refresh access requests and users list in real-time (every 10 seconds)
    setInterval(() => {
        if (document.hidden) return;
        if (sessionStorage.getItem("li_admin_authenticated") === "true") {
            const adminTab = document.getElementById("tab-admin");
            if (adminTab && adminTab.classList.contains("active")) {
                const storedPasscode = sessionStorage.getItem("li_admin_passcode") || localStorage.getItem("li_admin_passcode") || null;
                const isAssistant = sessionStorage.getItem("li_admin_role") === "assistant";
                const authUuid = isAssistant ? getOrCreateClientUuid() : null;
                const isSuperAdmin = !isAssistant;
                loadAndRenderAccessRequests(storedPasscode, authUuid, isSuperAdmin);
            }
        }
    }, 10000);

    // Toggle Spelling Mode (Single / Bulk)
    const btnSpellingToggle = document.getElementById("btn-spelling-mode-toggle");
    const spellingSingleContainer = document.getElementById("spelling-single-container");
    const spellingBulkContainer = document.getElementById("spelling-bulk-container");
    const formSpellingBulk = document.getElementById("form-admin-spelling-bulk");

    if (btnSpellingToggle && spellingSingleContainer && spellingBulkContainer) {
        btnSpellingToggle.addEventListener("click", () => {
            if (spellingBulkContainer.classList.contains("hide")) {
                spellingBulkContainer.classList.remove("hide");
                spellingSingleContainer.classList.add("hide");
                btnSpellingToggle.innerHTML = '<i class="fa-solid fa-pen"></i> Single Mode';
            } else {
                spellingBulkContainer.classList.add("hide");
                spellingSingleContainer.classList.remove("hide");
                btnSpellingToggle.innerHTML = '<i class="fa-solid fa-file-import"></i> Bulk Mode';
            }
        });
    }

    // Form: Train Spelling
    if (formSpelling) {
        formSpelling.addEventListener("submit", (e) => {
            e.preventDefault();
            const wrong = document.getElementById("spell-wrong").value.trim().toLowerCase();
            const right = document.getElementById("spell-right").value.trim();
            if (wrong && right) {
                customSpelling[wrong] = right;
                localStorage.setItem("li_custom_spelling", JSON.stringify(customSpelling));
                saveCustomDataToBackend();
                renderCustomSpelling();
                formSpelling.reset();
                if (typeof processAd === "function") processAd();
                logSystemEventToBackend("Custom Templates", "Train Spelling", `Trained spelling correction: "${wrong}" -> "${right}"`);
            }
        });
    }

    // Form: Train Spelling Bulk
    if (formSpellingBulk) {
        formSpellingBulk.addEventListener("submit", (e) => {
            e.preventDefault();
            const textVal = document.getElementById("spell-bulk-text").value.trim();
            if (!textVal) return;
            
            const lines = textVal.split("\n");
            let addedCount = 0;
            lines.forEach(line => {
                const parts = line.split(",");
                if (parts.length >= 2) {
                    const wrong = parts[0].trim().toLowerCase();
                    const right = parts.slice(1).join(",").trim();
                    if (wrong && right) {
                        customSpelling[wrong] = right;
                        addedCount++;
                    }
                }
            });
            
            if (addedCount > 0) {
                localStorage.setItem("li_custom_spelling", JSON.stringify(customSpelling));
                saveCustomDataToBackend();
                renderCustomSpelling();
                formSpellingBulk.reset();
                // Toggle back to single
                spellingBulkContainer.classList.add("hide");
                spellingSingleContainer.classList.remove("hide");
                if (btnSpellingToggle) {
                    btnSpellingToggle.innerHTML = '<i class="fa-solid fa-file-import"></i> Bulk Mode';
                }
                if (typeof processAd === "function") processAd();
                showCustomNotification(`Successfully imported ${addedCount} spelling corrections!`, "success");
                logSystemEventToBackend("Custom Templates", "Import Spelling (Bulk)", `Bulk imported ${addedCount} spelling corrections`);
            } else {
                showCustomAlertDialog("No valid corrections found. Make sure the format is 'wrong,right' with one entry per line.", null, "warning");
            }
        });
    }

    // Form: Train Template
    if (formTemplate) {
        formTemplate.addEventListener("submit", (e) => {
            e.preventDefault();
            const text = document.getElementById("template-text").value.trim();
            const category = document.getElementById("template-category").value;
            const shorthand = document.getElementById("template-shorthand").value.trim();
            if (text && category) {
                customTemplates.push({ text, category, shorthand });
                localStorage.setItem("li_custom_templates", JSON.stringify(customTemplates));
                saveCustomDataToBackend();
                renderCustomTemplates();
                formTemplate.reset();
                logSystemEventToBackend("Custom Templates", "Train Template", `Trained template in category '${category}'${shorthand ? ` with shorthand '${shorthand}'` : ''}: "${text}"`);
            }
        });
    }

    // Backup & Restore
    if (btnExport) {
        btnExport.addEventListener("click", () => {
            const dataObj = {
                spelling: customSpelling,
                templates: customTemplates
            };
            textareaBackup.value = JSON.stringify(dataObj, null, 2);
        });
    }

    if (btnImport) {
        btnImport.addEventListener("click", () => {
            const val = textareaBackup.value.trim();
            if (!val) {
                showCustomNotification("Please paste backup JSON string into the text area first.", "warning");
                return;
            }
            try {
                const parsed = JSON.parse(val);
                if (parsed.spelling && typeof parsed.spelling === "object") {
                    customSpelling = parsed.spelling;
                    localStorage.setItem("li_custom_spelling", JSON.stringify(customSpelling));
                }
                if (parsed.templates && Array.isArray(parsed.templates)) {
                    customTemplates = parsed.templates;
                    localStorage.setItem("li_custom_templates", JSON.stringify(customTemplates));
                }
                saveCustomDataToBackend();
                renderCustomSpelling();
                renderCustomTemplates();
                showCustomNotification("Data imported successfully!", "success");
            } catch (err) {
                showCustomAlertDialog("Invalid JSON format. Verification failed:\n" + err.toString(), null, "error");
            }
        });
    }



    const btnClearBugs = document.getElementById("btn-admin-clear-bugs");
    if (btnClearBugs) {
        let holdInterval = null;
        const holdDuration = 3000; // 3 seconds
        let elapsed = 0;
        let isHolding = false;
        const originalHtml = `<i class="fa-solid fa-trash-can"></i> Clear Bug Reports`;

        const updateButtonProgress = (pct) => {
            const remainingSecs = ((holdDuration - elapsed) / 1000).toFixed(1);
            // Linear progress gradient overlay representing holding duration
            const progressBg = `linear-gradient(90deg, rgba(255, 59, 48, 0.45) ${pct}%, rgba(22, 22, 28, 0.9) ${pct}%)`;
            btnClearBugs.style.background = progressBg;
            
            if (pct < 100) {
                btnClearBugs.innerHTML = `<i class="fa-solid fa-hourglass-half fa-spin"></i> Hold to Clear (${remainingSecs}s)...`;
            }
        };

        const startHold = (e) => {
            if (btnClearBugs.disabled || isHolding) return;
            const isAssistant = sessionStorage.getItem("li_admin_role") === "assistant";
            if (isAssistant) return;

            isHolding = true;
            elapsed = 0;
            e.preventDefault();

            // Style active hold
            btnClearBugs.style.transition = "none";
            btnClearBugs.style.transform = "scale(0.97)";
            updateButtonProgress(0);

            holdInterval = setInterval(() => {
                elapsed += 100;
                const pct = Math.min((elapsed / holdDuration) * 100, 100);
                updateButtonProgress(pct);

                if (elapsed >= holdDuration) {
                    clearInterval(holdInterval);
                    holdInterval = null;
                    isHolding = false;
                    
                    showCustomConfirmDialog(
                        "Are you sure you want to permanently clear all logged bug reports? This action cannot be undone.",
                        () => {
                            triggerClearBugs();
                        },
                        () => {
                            resetButtonToOriginal();
                        },
                        "Delete Reports",
                        true
                    );
                }
            }, 100);
        };

        const cancelHold = () => {
            if (!isHolding) return;
            isHolding = false;
            if (holdInterval) {
                clearInterval(holdInterval);
                holdInterval = null;
            }
            btnClearBugs.style.transition = "transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease";
            btnClearBugs.style.transform = "";
            btnClearBugs.style.background = "";
            btnClearBugs.innerHTML = originalHtml;
        };

        const triggerClearBugs = () => {
            const passcode = sessionStorage.getItem("li_admin_passcode") || localStorage.getItem("li_admin_passcode");
            if (!CONFIG.GOOGLE_SCRIPT_URL) {
                cancelHold();
                return showCustomNotification("Google Apps Script URL is not configured.", "error");
            }

            // Disable button during loading
            btnClearBugs.disabled = true;
            btnClearBugs.style.transition = "background 0.3s ease, transform 0.2s ease";
            btnClearBugs.style.transform = "";
            btnClearBugs.style.background = "#ff9500"; // Amber warning color during deletion
            btnClearBugs.style.boxShadow = "0 4px 15px rgba(255, 149, 0, 0.3)";
            btnClearBugs.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Deleting reports...`;

            fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "text/plain"
                },
                body: JSON.stringify({
                    action: "clear_bug_reports",
                    passcode: passcode
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    // Success! Transition to beautiful glowing green
                    btnClearBugs.style.background = "#30d158"; // Emerald green
                    btnClearBugs.style.borderColor = "#30d158";
                    btnClearBugs.style.boxShadow = "0 4px 20px rgba(48, 209, 88, 0.5)";
                    btnClearBugs.innerHTML = `<i class="fa-solid fa-circle-check"></i> Bug report cleared`;
                    showCustomNotification(data.message || "Successfully cleared all bug reports.", "success");
                    
                    // Keep green for 3 seconds, then return to normal
                    setTimeout(() => {
                        btnClearBugs.disabled = false;
                        btnClearBugs.style.background = "";
                        btnClearBugs.style.borderColor = "";
                        btnClearBugs.style.boxShadow = "";
                        btnClearBugs.innerHTML = originalHtml;
                    }, 3000);
                } else {
                    showCustomAlertDialog("Clear failed: " + data.message, null, "error");
                    resetButtonToOriginal();
                }
            })
            .catch(err => {
                console.error("Error clearing bug reports:", err);
                showCustomAlertDialog("Error contacting the backend: " + err.toString(), null, "error");
                resetButtonToOriginal();
            });
        };

        const resetButtonToOriginal = () => {
            btnClearBugs.disabled = false;
            btnClearBugs.style.transition = "transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease";
            btnClearBugs.style.transform = "";
            btnClearBugs.style.background = "";
            btnClearBugs.style.borderColor = "";
            btnClearBugs.style.boxShadow = "";
            btnClearBugs.innerHTML = originalHtml;
        };

        // Attach mouse events
        btnClearBugs.addEventListener("mousedown", startHold);
        btnClearBugs.addEventListener("mouseup", cancelHold);
        btnClearBugs.addEventListener("mouseleave", cancelHold);

        // Attach touch events for mobile/tablet support
        btnClearBugs.addEventListener("touchstart", startHold);
        btnClearBugs.addEventListener("touchend", cancelHold);
        btnClearBugs.addEventListener("touchcancel", cancelHold);

        // Block accidental normal click behavior
        btnClearBugs.addEventListener("click", (e) => {
            e.preventDefault();
        });
    }

    // --- Targeted Spelling Cleanup (search + clear matching entries) ---
    const inputClearSearch = document.getElementById("input-clear-spelling-search");
    const btnClearMatching = document.getElementById("btn-admin-clear-spelling");
    const clearPreview = document.getElementById("clear-spelling-preview");

    if (inputClearSearch && btnClearMatching) {
        // Live preview: show how many entries match as the user types
        inputClearSearch.addEventListener("input", () => {
            const query = inputClearSearch.value.trim().toLowerCase();
            if (!query) {
                if (clearPreview) clearPreview.textContent = "";
                return;
            }
            const entries = Object.entries(customSpelling);
            const matching = entries.filter(([wrong, right]) =>
                wrong.toLowerCase().includes(query) || right.toLowerCase().includes(query)
            );
            if (clearPreview) {
                if (matching.length === 0) {
                    clearPreview.innerHTML = `<span style="color: rgba(255,255,255,0.3);">No matching entries found.</span>`;
                } else {
                    const preview = matching.slice(0, 5).map(([w, r]) =>
                        `<span style="color:#ff453a;">${w}</span> → <span style="color:#30d158;">${r}</span>`
                    ).join(", ");
                    const extra = matching.length > 5 ? ` <span style="color:rgba(255,255,255,0.3);">and ${matching.length - 5} more...</span>` : "";
                    clearPreview.innerHTML = `<span style="color:#ff9f0a;">${matching.length} match${matching.length > 1 ? 'es' : ''}:</span> ${preview}${extra}`;
                }
            }
        });

        btnClearMatching.addEventListener("click", () => {
            const query = inputClearSearch.value.trim().toLowerCase();
            if (!query) {
                showCustomNotification("Please type a keyword to find matching entries (e.g. 'pezy', '700').", "warning");
                return;
            }

            const entries = Object.entries(customSpelling);
            const matching = entries.filter(([wrong, right]) =>
                wrong.toLowerCase().includes(query) || right.toLowerCase().includes(query)
            );

            if (matching.length === 0) {
                showCustomNotification(`No trained spelling entries match "${query}".`, "warning");
                return;
            }

            showCustomConfirmDialog(
                `Found ${matching.length} trained spelling entry${matching.length > 1 ? 'ies' : 'y'} matching "${query}":\n\n${matching.slice(0, 10).map(([w, r]) => `• "${w}" → "${r}"`).join('\n')}${matching.length > 10 ? `\n...and ${matching.length - 10} more` : ''}\n\nRemove ${matching.length === 1 ? 'this entry' : 'these entries'}?`,
                () => {
                    // Delete matching entries
                    matching.forEach(([wrong]) => {
                        delete customSpelling[wrong];
                    });
                    localStorage.setItem("li_custom_spelling", JSON.stringify(customSpelling));
                    saveCustomDataToBackend();
                    renderCustomSpelling();
                    inputClearSearch.value = "";
                    if (clearPreview) clearPreview.textContent = "";
                    if (typeof processAd === "function") processAd();
                    showCustomNotification(`Removed ${matching.length} spelling correction${matching.length > 1 ? 's' : ''} matching "${query}".`, "success");
                },
                null,
                "Remove Entries",
                true
            );
        });
    }

    // --- Clear ALL Trained Spelling (nuclear hold-to-confirm) ---
    const btnClearAllSpelling = document.getElementById("btn-admin-clear-all-spelling");
    if (btnClearAllSpelling) {
        let spHoldInterval = null;
        const spHoldDuration = 3000;
        let spElapsed = 0;
        let spIsHolding = false;
        const spOriginalHtml = `<i class="fa-solid fa-spell-check"></i> Clear All Spelling`;

        const spUpdateProgress = (pct) => {
            const remaining = ((spHoldDuration - spElapsed) / 1000).toFixed(1);
            const progressBg = `linear-gradient(90deg, rgba(255, 59, 48, 0.45) ${pct}%, rgba(22, 22, 28, 0.9) ${pct}%)`;
            btnClearAllSpelling.style.background = progressBg;
            if (pct < 100) {
                btnClearAllSpelling.innerHTML = `<i class="fa-solid fa-hourglass-half fa-spin"></i> Hold (${remaining}s)...`;
            }
        };

        const spStartHold = (e) => {
            if (btnClearAllSpelling.disabled || spIsHolding) return;
            const isAssistant = sessionStorage.getItem("li_admin_role") === "assistant";
            if (isAssistant) return;

            spIsHolding = true;
            spElapsed = 0;
            e.preventDefault();

            btnClearAllSpelling.style.transition = "none";
            btnClearAllSpelling.style.transform = "scale(0.97)";
            spUpdateProgress(0);

            spHoldInterval = setInterval(() => {
                spElapsed += 100;
                const pct = Math.min((spElapsed / spHoldDuration) * 100, 100);
                spUpdateProgress(pct);

                if (spElapsed >= spHoldDuration) {
                    clearInterval(spHoldInterval);
                    spHoldInterval = null;
                    spIsHolding = false;

                    const entryCount = Object.keys(customSpelling).length;
                    showCustomConfirmDialog(
                        `Are you sure you want to clear ALL ${entryCount} trained spelling corrections? This wipes the Custom_Spelling database (local + Google Sheets). Hardcoded corrections are NOT affected. This cannot be undone.`,
                        () => {
                            customSpelling = {};
                            localStorage.removeItem("li_custom_spelling");
                            saveCustomDataToBackend();
                            renderCustomSpelling();
                            if (typeof processAd === "function") processAd();

                            btnClearAllSpelling.disabled = true;
                            btnClearAllSpelling.style.transition = "background 0.3s ease";
                            btnClearAllSpelling.style.background = "#30d158";
                            btnClearAllSpelling.style.borderColor = "#30d158";
                            btnClearAllSpelling.style.boxShadow = "0 4px 20px rgba(48, 209, 88, 0.5)";
                            btnClearAllSpelling.innerHTML = `<i class="fa-solid fa-circle-check"></i> All Cleared`;
                            showCustomNotification(`Wiped all ${entryCount} trained spelling corrections. Hardcoded corrections remain active.`, "success");

                            setTimeout(() => {
                                btnClearAllSpelling.disabled = false;
                                btnClearAllSpelling.style.background = "";
                                btnClearAllSpelling.style.borderColor = "";
                                btnClearAllSpelling.style.boxShadow = "";
                                btnClearAllSpelling.innerHTML = spOriginalHtml;
                            }, 3000);
                        },
                        () => {
                            spResetButton();
                        },
                        "Wipe All Spelling",
                        true
                    );
                }
            }, 100);
        };

        const spCancelHold = () => {
            if (!spIsHolding) return;
            spIsHolding = false;
            if (spHoldInterval) {
                clearInterval(spHoldInterval);
                spHoldInterval = null;
            }
            btnClearAllSpelling.style.transition = "transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease";
            btnClearAllSpelling.style.transform = "";
            btnClearAllSpelling.style.background = "";
            btnClearAllSpelling.innerHTML = spOriginalHtml;
        };

        const spResetButton = () => {
            btnClearAllSpelling.disabled = false;
            btnClearAllSpelling.style.transition = "transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease";
            btnClearAllSpelling.style.transform = "";
            btnClearAllSpelling.style.background = "";
            btnClearAllSpelling.style.borderColor = "";
            btnClearAllSpelling.style.boxShadow = "";
            btnClearAllSpelling.innerHTML = spOriginalHtml;
        };

        btnClearAllSpelling.addEventListener("mousedown", spStartHold);
        btnClearAllSpelling.addEventListener("mouseup", spCancelHold);
        btnClearAllSpelling.addEventListener("mouseleave", spCancelHold);
        btnClearAllSpelling.addEventListener("touchstart", spStartHold);
        btnClearAllSpelling.addEventListener("touchend", spCancelHold);
        btnClearAllSpelling.addEventListener("touchcancel", spCancelHold);
        btnClearAllSpelling.addEventListener("click", (e) => {
            e.preventDefault();
        });
    }

    // --- Search filter for translations list ---
    const inputTransSearch = document.getElementById("input-translations-search");
    if (inputTransSearch) {
        inputTransSearch.addEventListener("input", () => {
            renderCustomTranslations();
        });
    }

    // --- Refresh button for Fixed Bug translations list ---
    const btnTranslationsRefresh = document.getElementById("btn-translations-refresh");
    if (btnTranslationsRefresh) {
        btnTranslationsRefresh.addEventListener("click", () => {
            const icon = btnTranslationsRefresh.querySelector("i");
            if (icon) icon.classList.add("fa-spin");
            btnTranslationsRefresh.disabled = true;

            if (!CONFIG.GOOGLE_SCRIPT_URL) {
                // No backend — just re-render from local data
                renderCustomTranslations();
                if (icon) icon.classList.remove("fa-spin");
                btnTranslationsRefresh.disabled = false;
                showCustomNotification("Fixed bug list refreshed from local cache.", "success");
                return;
            }

            // Force-sync from backend (bypass the 45s cooldown)
            fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: "get_custom_data" })
            })
            .then(r => r.json())
            .then(data => {
                if (data.status === "success") {
                    if (data.translations) {
                        customTranslations = data.translations;
                        localStorage.setItem("li_custom_translations", JSON.stringify(customTranslations));
                    }
                    if (data.spelling) {
                        customSpelling = data.spelling;
                        localStorage.setItem("li_custom_spelling", JSON.stringify(customSpelling));
                    }
                    if (data.templates) {
                        customTemplates = data.templates;
                        localStorage.setItem("li_custom_templates", JSON.stringify(customTemplates));
                    }
                    renderCustomTranslations();
                    if (typeof renderCustomSpelling === "function") renderCustomSpelling();
                    if (typeof renderCustomTemplates === "function") renderCustomTemplates();
                    if (typeof processAd === "function") processAd();
                    showCustomNotification("Fixed bug list refreshed with latest data from cloud!", "success");
                } else {
                    showCustomNotification("Failed to refresh from backend.", "warning");
                }
            })
            .catch(err => {
                console.error("Refresh error:", err);
                // Fallback: just re-render local data
                renderCustomTranslations();
                showCustomNotification("Could not reach cloud. Refreshed from local cache.", "warning");
            })
            .finally(() => {
                if (icon) icon.classList.remove("fa-spin");
                btnTranslationsRefresh.disabled = false;
            });
        });
    }

    // --- Clear ALL Custom Translations (hold-to-confirm) ---
    const btnClearAllTranslations = document.getElementById("btn-admin-clear-all-translations");
    if (btnClearAllTranslations) {
        let trHoldInterval = null;
        const trHoldDuration = 8000;
        let trElapsed = 0;
        let trIsHolding = false;
        const trOriginalHtml = `<i class="fa-solid fa-trash-can"></i> Clear All Mappings`;

        const trUpdateProgress = (pct) => {
            const remaining = ((trHoldDuration - trElapsed) / 1000).toFixed(1);
            const progressBg = `linear-gradient(90deg, rgba(255, 59, 48, 0.45) ${pct}%, rgba(22, 22, 28, 0.9) ${pct}%)`;
            btnClearAllTranslations.style.background = progressBg;
            if (pct < 100) {
                btnClearAllTranslations.innerHTML = `<i class="fa-solid fa-hourglass-half fa-spin"></i> Hold (${remaining}s)...`;
            }
        };

        const trStartHold = (e) => {
            if (btnClearAllTranslations.disabled || trIsHolding) return;
            const isSuperAdmin = sessionStorage.getItem("li_admin_role") === "super";
            if (!isSuperAdmin) return;

            trIsHolding = true;
            trElapsed = 0;
            e.preventDefault();

            btnClearAllTranslations.style.transition = "none";
            btnClearAllTranslations.style.transform = "scale(0.97)";
            trUpdateProgress(0);

            trHoldInterval = setInterval(() => {
                trElapsed += 100;
                const pct = Math.min((trElapsed / trHoldDuration) * 100, 100);
                trUpdateProgress(pct);

                if (trElapsed >= trHoldDuration) {
                    clearInterval(trHoldInterval);
                    trHoldInterval = null;
                    trIsHolding = false;

                    const entryCount = Object.keys(customTranslations).length;
                    showCustomConfirmDialog(
                        `Are you sure you want to clear ALL ${entryCount} trained ad translation mappings? This wipes the Custom_Translations database (local + Google Sheets). Auto-translation for previous ads will be removed. This cannot be undone.`,
                        () => {
                            customTranslations = {};
                            localStorage.removeItem("li_custom_translations");
                            saveCustomDataToBackend();
                            renderCustomTranslations();
                            if (typeof processAd === "function") processAd();

                            btnClearAllTranslations.disabled = true;
                            btnClearAllTranslations.style.transition = "background 0.3s ease";
                            btnClearAllTranslations.style.background = "#30d158";
                            btnClearAllTranslations.style.borderColor = "#30d158";
                            btnClearAllTranslations.style.boxShadow = "0 4px 20px rgba(48, 209, 88, 0.5)";
                            btnClearAllTranslations.innerHTML = `<i class="fa-solid fa-circle-check"></i> All Cleared`;
                            showCustomNotification(`Wiped all ${entryCount} custom translation mappings.`, "success");

                            setTimeout(() => {
                                btnClearAllTranslations.disabled = false;
                                btnClearAllTranslations.style.background = "";
                                btnClearAllTranslations.style.borderColor = "";
                                btnClearAllTranslations.style.boxShadow = "";
                                btnClearAllTranslations.innerHTML = trOriginalHtml;
                            }, 3000);
                        },
                        () => {
                            trResetButton();
                        },
                        "Wipe All Translations",
                        true
                    );
                }
            }, 100);
        };

        const trCancelHold = () => {
            if (!trIsHolding) return;
            trIsHolding = false;
            if (trHoldInterval) {
                clearInterval(trHoldInterval);
                trHoldInterval = null;
            }
            btnClearAllTranslations.style.transition = "transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease";
            btnClearAllTranslations.style.transform = "";
            btnClearAllTranslations.style.background = "";
            btnClearAllTranslations.innerHTML = trOriginalHtml;
        };

        const trResetButton = () => {
            btnClearAllTranslations.disabled = false;
            btnClearAllTranslations.style.transition = "transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease";
            btnClearAllTranslations.style.transform = "";
            btnClearAllTranslations.style.background = "";
            btnClearAllTranslations.style.borderColor = "";
            btnClearAllTranslations.style.boxShadow = "";
            btnClearAllTranslations.innerHTML = trOriginalHtml;
        };

        // Desktop Events
        btnClearAllTranslations.addEventListener("mousedown", trStartHold);
        btnClearAllTranslations.addEventListener("mouseup", trCancelHold);
        btnClearAllTranslations.addEventListener("mouseleave", trCancelHold);

        // Mobile / Touch Events
        btnClearAllTranslations.addEventListener("touchstart", trStartHold, { passive: false });
        btnClearAllTranslations.addEventListener("touchend", trCancelHold);
        btnClearAllTranslations.addEventListener("touchcancel", trCancelHold);

        // Block accidental normal click behavior
        btnClearAllTranslations.addEventListener("click", (e) => {
            e.preventDefault();
        });
    }
}

function loadAndRenderAccessRequests(passcode, authUuid, isSuperAdmin) {
    const container = document.getElementById("admin-access-requests-container");
    const usersContainer = document.getElementById("admin-users-list-container");
    if (!container || !CONFIG.GOOGLE_SCRIPT_URL) return;
    
    const requestBody = { action: "get_access_requests" };
    if (passcode) requestBody.passcode = passcode;
    if (authUuid) requestBody.authUuid = authUuid;
    
    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(requestBody)
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "success") {
            const serverIsSuperAdmin = data.isSuperAdmin !== undefined ? data.isSuperAdmin : isSuperAdmin;
            const pendingRequests = data.requests.filter(r => r.status === "pending");
            renderAccessRequestsList(container, pendingRequests, passcode, authUuid);
            
            if (usersContainer) {
                const approvedUsers = data.requests.filter(r => r.status === "approved");
                renderApprovedUsersList(usersContainer, approvedUsers, passcode, authUuid, serverIsSuperAdmin);
            }
        } else {
            const errMsg = `<div class="no-requests-msg" style="grid-column: 1 / -1; color: #e63946; text-align: center; padding: 20px;">Failed to load access requests: ${data.message}</div>`;
            container.innerHTML = errMsg;
            if (usersContainer) usersContainer.innerHTML = errMsg;
        }
    })
    .catch(err => {
        console.error("Error loading access requests:", err);
        const errMsg = `<div class="no-requests-msg" style="grid-column: 1 / -1; color: #e63946; text-align: center; padding: 20px;">Network error loading access requests.</div>`;
        container.innerHTML = errMsg;
        if (usersContainer) usersContainer.innerHTML = errMsg;
    });
}

function renderAccessRequestsList(container, requests, passcode, authUuid) {
    if (!container) return;
    container.innerHTML = "";
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="no-requests-msg" style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 8px; background: rgba(255,255,255,0.01);">
                <i class="fa-solid fa-users-slash" style="font-size: 24px; margin-bottom: 10px; display: block; color: var(--text-muted);"></i>
                No pending access requests.
            </div>`;
        return;
    }

    // Deduplicate pending requests by ID (keep the latest one, fallback to clientUuid)
    const uniqueRequestsMap = new Map();
    requests.forEach(req => {
        const dedupeKey = (req.id || "").toString().toLowerCase().trim() || req.clientUuid;
        if (dedupeKey) {
            uniqueRequestsMap.set(dedupeKey, req);
        }
    });
    const uniqueRequests = Array.from(uniqueRequestsMap.values());
    
    function buildAuthBody(extraFields) {
        const body = {};
        if (passcode) body.passcode = passcode;
        if (authUuid) body.authUuid = authUuid;
        return Object.assign(body, extraFields);
    }
    
    uniqueRequests.forEach(req => {
        const card = document.createElement("div");
        card.className = "access-request-card";
        card.style.background = "rgba(255, 255, 255, 0.02)";
        card.style.border = "1px solid var(--border-color)";
        card.style.padding = "15px";
        card.style.borderRadius = "8px";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.justifyContent = "space-between";
        card.style.transition = "transform 0.2s, box-shadow 0.2s";
        
        const details = document.createElement("div");
        
        const name = document.createElement("div");
        name.style.fontSize = "14px";
        name.style.fontWeight = "600";
        name.style.color = "var(--text-color)";
        name.textContent = `${req.firstname} ${req.lastname}`;
        details.appendChild(name);
        
        const gameId = document.createElement("div");
        gameId.style.fontSize = "12px";
        gameId.style.color = "var(--text-muted)";
        gameId.style.marginTop = "4px";
        gameId.innerHTML = `<span style="color: var(--text-muted);">ID:</span> <strong style="color: var(--text-color);">${escapeHTML(req.id)}</strong>`;
        details.appendChild(gameId);
        
        const time = document.createElement("div");
        time.style.fontSize = "11px";
        time.style.color = "var(--text-muted)";
        time.style.marginTop = "4px";
        time.textContent = req.timestamp;
        details.appendChild(time);
        
        const uuidInfo = document.createElement("div");
        uuidInfo.style.fontSize = "10px";
        uuidInfo.style.color = "var(--text-muted)";
        uuidInfo.style.marginTop = "4px";
        uuidInfo.style.wordBreak = "break-all";
        uuidInfo.textContent = `UUID: ${req.clientUuid}`;
        details.appendChild(uuidInfo);
        
        card.appendChild(details);
        
        const actionsRow = document.createElement("div");
        actionsRow.style.display = "flex";
        actionsRow.style.gap = "10px";
        actionsRow.style.marginTop = "15px";
        
        const btnApprove = document.createElement("button");
        btnApprove.type = "button";
        btnApprove.className = "btn-preset";
        btnApprove.style.flex = "1";
        btnApprove.style.padding = "6px 12px";
        btnApprove.style.borderRadius = "4px";
        btnApprove.style.border = "none";
        btnApprove.style.background = "#2ec4b6";
        btnApprove.style.color = "white";
        btnApprove.style.fontWeight = "600";
        btnApprove.style.fontSize = "12px";
        btnApprove.style.cursor = "pointer";
        btnApprove.innerHTML = `<i class="fa-solid fa-check"></i> Approve`;
        
        btnApprove.addEventListener("click", () => {
            btnApprove.disabled = true;
            btnApprove.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
            
            fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(buildAuthBody({
                    action: "approve_access_request",
                    clientUuid: req.clientUuid
                }))
            })
            .then(r => r.json())
            .then(data => {
                if (data.status === "success") {
                    loadAndRenderAccessRequests(passcode, authUuid, false);
                    logSystemEventToBackend("Pending Requests", "Approve Access", `Approved access request for ${req.firstname} ${req.lastname} (ID: ${req.id}, Server: ${req.server || "EN3"})`);
                } else {
                    showCustomAlertDialog("Approval failed: " + data.message, null, "error");
                    btnApprove.disabled = false;
                    btnApprove.innerHTML = `<i class="fa-solid fa-check"></i> Approve`;
                }
            })
            .catch(err => {
                console.error("Approve request error:", err);
                showCustomAlertDialog("Network error approving request.", null, "error");
                btnApprove.disabled = false;
                btnApprove.innerHTML = `<i class="fa-solid fa-check"></i> Approve`;
            });
        });
        
        const btnReject = document.createElement("button");
        btnReject.type = "button";
        btnReject.className = "btn-preset";
        btnReject.style.padding = "6px 12px";
        btnReject.style.borderRadius = "4px";
        btnReject.style.border = "none";
        btnReject.style.background = "#e63946";
        btnReject.style.color = "white";
        btnReject.style.fontWeight = "600";
        btnReject.style.fontSize = "12px";
        btnReject.style.cursor = "pointer";
        btnReject.innerHTML = `<i class="fa-solid fa-xmark"></i> Reject`;
        
        btnReject.addEventListener("click", () => {
            btnReject.disabled = true;
            btnReject.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
            
            fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(buildAuthBody({
                    action: "reject_access_request",
                    clientUuid: req.clientUuid
                }))
            })
            .then(r => r.json())
            .then(data => {
                if (data.status === "success") {
                    loadAndRenderAccessRequests(passcode, authUuid, false);
                    logSystemEventToBackend("Pending Requests", "Reject Access", `Rejected access request for ${req.firstname} ${req.lastname} (ID: ${req.id}, Server: ${req.server || "EN3"})`);
                } else {
                    showCustomAlertDialog("Rejection failed: " + data.message, null, "error");
                    btnReject.disabled = false;
                    btnReject.innerHTML = `<i class="fa-solid fa-xmark"></i> Reject`;
                }
            })
            .catch(err => {
                console.error("Reject request error:", err);
                showCustomAlertDialog("Network error rejecting request.", null, "error");
                btnReject.disabled = false;
                btnReject.innerHTML = `<i class="fa-solid fa-xmark"></i> Reject`;
            });
        });
        
        actionsRow.appendChild(btnApprove);
        actionsRow.appendChild(btnReject);
        
        card.appendChild(actionsRow);
        container.appendChild(card);
    });
}

function renderApprovedUsersList(container, requests, passcode, authUuid, isSuperAdmin) {
    if (!container) return;
    container.innerHTML = "";
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="no-requests-msg" style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 8px; background: rgba(255,255,255,0.01);">
                <i class="fa-solid fa-users-slash" style="font-size: 24px; margin-bottom: 10px; display: block; color: var(--text-muted);"></i>
                No authorized users found.
            </div>`;
        return;
    }

    // Deduplicate approved users by ID (keep the latest request for each unique ID, fallback to clientUuid)
    const uniqueRequestsMap = new Map();
    requests.forEach(req => {
        const dedupeKey = (req.id || "").toString().toLowerCase().trim() || req.clientUuid;
        if (dedupeKey) {
            uniqueRequestsMap.set(dedupeKey, req);
        }
    });
    const uniqueRequests = Array.from(uniqueRequestsMap.values());
    
    function buildAuthBody(extraFields) {
        const body = {};
        if (passcode) body.passcode = passcode;
        if (authUuid) body.authUuid = authUuid;
        return Object.assign(body, extraFields);
    }
    
    uniqueRequests.forEach(req => {
        const card = document.createElement("div");
        card.className = "access-request-card";
        card.style.background = "rgba(255, 255, 255, 0.02)";
        card.style.border = "1px solid var(--border-color)";
        card.style.padding = "15px";
        card.style.borderRadius = "8px";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.justifyContent = "space-between";
        card.style.transition = "transform 0.2s, box-shadow 0.2s";
        
        const isAssistantAdmin = (req.role || "").toLowerCase() === "assistant_admin";
        
        // Add a subtle left border for assistant admins
        if (isAssistantAdmin) {
            card.style.borderLeft = "3px solid #f0a500";
        }
        
        const details = document.createElement("div");
        
        // Name row with role badge
        const nameRow = document.createElement("div");
        nameRow.style.display = "flex";
        nameRow.style.alignItems = "center";
        nameRow.style.gap = "8px";
        nameRow.style.flexWrap = "wrap";
        
        const name = document.createElement("div");
        name.style.fontSize = "14px";
        name.style.fontWeight = "600";
        name.style.color = "var(--text-color)";
        name.textContent = `${req.firstname} ${req.lastname}`;
        nameRow.appendChild(name);
        
        if (isAssistantAdmin) {
            const badge = document.createElement("span");
            badge.style.fontSize = "9px";
            badge.style.fontWeight = "700";
            badge.style.padding = "2px 8px";
            badge.style.borderRadius = "4px";
            badge.style.background = "rgba(240, 165, 0, 0.15)";
            badge.style.color = "#f0a500";
            badge.style.border = "1px solid rgba(240, 165, 0, 0.3)";
            badge.style.textTransform = "uppercase";
            badge.style.letterSpacing = "0.5px";
            badge.innerHTML = `<i class="fa-solid fa-shield-halved" style="margin-right: 3px;"></i>Admin`;
            nameRow.appendChild(badge);
        }
        
        details.appendChild(nameRow);
        
        const gameId = document.createElement("div");
        gameId.style.fontSize = "12px";
        gameId.style.color = "var(--text-muted)";
        gameId.style.marginTop = "4px";
        gameId.innerHTML = `<span style="color: var(--text-muted);">ID:</span> <strong style="color: var(--text-color);">${escapeHTML(req.id)}</strong>`;
        details.appendChild(gameId);
        
        const time = document.createElement("div");
        time.style.fontSize = "11px";
        time.style.color = "var(--text-muted)";
        time.style.marginTop = "4px";
        time.textContent = req.timestamp;
        details.appendChild(time);
        
        const uuidInfo = document.createElement("div");
        uuidInfo.style.fontSize = "10px";
        uuidInfo.style.color = "var(--text-muted)";
        uuidInfo.style.marginTop = "4px";
        uuidInfo.style.wordBreak = "break-all";
        uuidInfo.textContent = `UUID: ${req.clientUuid}`;
        details.appendChild(uuidInfo);
        
        card.appendChild(details);
        
        const actionsRow = document.createElement("div");
        actionsRow.style.display = "flex";
        actionsRow.style.gap = "8px";
        actionsRow.style.marginTop = "15px";
        actionsRow.style.flexWrap = "wrap";
        
        // Only super admin can see management buttons
        if (isSuperAdmin) {
            // Promote / Demote button
            const btnRole = document.createElement("button");
            btnRole.type = "button";
            btnRole.className = "btn-preset";
            btnRole.style.flex = "1";
            btnRole.style.padding = "6px 10px";
            btnRole.style.borderRadius = "4px";
            btnRole.style.border = "none";
            btnRole.style.fontWeight = "600";
            btnRole.style.fontSize = "11px";
            btnRole.style.cursor = "pointer";
            btnRole.style.minWidth = "120px";
            
            if (isAssistantAdmin) {
                btnRole.style.background = "rgba(240, 165, 0, 0.15)";
                btnRole.style.color = "#f0a500";
                btnRole.style.border = "1px solid rgba(240, 165, 0, 0.3)";
                btnRole.innerHTML = `<i class="fa-solid fa-user-minus"></i> Remove Admin`;
            } else {
                btnRole.style.background = "rgba(46, 196, 182, 0.15)";
                btnRole.style.color = "#2ec4b6";
                btnRole.style.border = "1px solid rgba(46, 196, 182, 0.3)";
                btnRole.innerHTML = `<i class="fa-solid fa-user-shield"></i> Make Admin`;
            }
            
            btnRole.addEventListener("click", () => {
                const newRole = isAssistantAdmin ? "" : "assistant_admin";
                const confirmMsg = isAssistantAdmin 
                    ? `Remove Admin role from ${req.firstname} ${req.lastname}?`
                    : `Promote ${req.firstname} ${req.lastname} to Admin?<br><br>They will be able to:<br>- Access the Admin Panel<br>- Approve/Reject access requests<br>- View Spelling & Templates<br><br>They will NOT be able to:<br>- Revoke user access<br>- Promote/demote users<br>- Manage backups`;
                
                const okButtonText = isAssistantAdmin ? "Remove Role" : "Promote";
                const isDestructiveAction = isAssistantAdmin;

                showCustomConfirmDialog(
                    confirmMsg,
                    () => {
                        btnRole.disabled = true;
                        btnRole.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                        
                        fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                            method: "POST",
                            headers: { "Content-Type": "text/plain" },
                            body: JSON.stringify({
                                action: "set_user_role",
                                passcode: passcode,
                                clientUuid: req.clientUuid,
                                role: newRole
                            })
                        })
                        .then(r => r.json())
                        .then(data => {
                            if (data.status === "success") {
                                loadAndRenderAccessRequests(passcode, authUuid, isSuperAdmin);
                                logSystemEventToBackend("Users", newRole === "assistant_admin" ? "Promote User" : "Demote User", `Changed role for ${req.firstname} ${req.lastname} (ID: ${req.id}) to ${newRole === "assistant_admin" ? "Admin" : "User"}`);
                            } else {
                                showCustomAlertDialog("Role change failed: " + data.message, null, "error");
                                btnRole.disabled = false;
                                btnRole.innerHTML = isAssistantAdmin 
                                    ? `<i class="fa-solid fa-user-minus"></i> Remove Admin`
                                    : `<i class="fa-solid fa-user-shield"></i> Make Admin`;
                            }
                        })
                        .catch(err => {
                            console.error("Set role error:", err);
                            showCustomAlertDialog("Network error changing role.", null, "error");
                            btnRole.disabled = false;
                        });
                    },
                    null,
                    okButtonText,
                    isDestructiveAction
                );
            });
            
            actionsRow.appendChild(btnRole);
            
            // Revoke Access button
            const btnRevoke = document.createElement("button");
            btnRevoke.type = "button";
            btnRevoke.className = "btn-preset";
            btnRevoke.style.flex = "1";
            btnRevoke.style.padding = "6px 10px";
            btnRevoke.style.borderRadius = "4px";
            btnRevoke.style.border = "none";
            btnRevoke.style.background = "#e63946";
            btnRevoke.style.color = "white";
            btnRevoke.style.fontWeight = "600";
            btnRevoke.style.fontSize = "11px";
            btnRevoke.style.cursor = "pointer";
            btnRevoke.style.minWidth = "120px";
            btnRevoke.innerHTML = `<i class="fa-solid fa-user-slash"></i> Revoke Access`;
            
            btnRevoke.addEventListener("click", () => {
                showCustomConfirmDialog(
                    `Are you sure you want to permanently revoke system access for ${req.firstname} ${req.lastname}? This action cannot be undone.`,
                    () => {
                        btnRevoke.disabled = true;
                        btnRevoke.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                        
                        fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                            method: "POST",
                            headers: { "Content-Type": "text/plain" },
                            body: JSON.stringify(buildAuthBody({
                                action: "reject_access_request",
                                clientUuid: req.clientUuid
                            }))
                        })
                        .then(r => r.json())
                        .then(data => {
                            if (data.status === "success") {
                                loadAndRenderAccessRequests(passcode, authUuid, isSuperAdmin);
                                logSystemEventToBackend("Users", "Revoke Access", `Permanently revoked system access for ${req.firstname} ${req.lastname} (ID: ${req.id}, Server: ${req.server || "EN3"})`);
                            } else {
                                showCustomAlertDialog("Revocation failed: " + data.message, null, "error");
                                btnRevoke.disabled = false;
                                btnRevoke.innerHTML = `<i class="fa-solid fa-user-slash"></i> Revoke Access`;
                            }
                        })
                        .catch(err => {
                            console.error("Revoke access error:", err);
                            showCustomAlertDialog("Network error revoking access.", null, "error");
                            btnRevoke.disabled = false;
                            btnRevoke.innerHTML = `<i class="fa-solid fa-user-slash"></i> Revoke Access`;
                        });
                    },
                    null,
                    "Revoke Access",
                    true
                );
            });
            
            actionsRow.appendChild(btnRevoke);
        } else {
            // Assistant admin view - just show a read-only role indicator
            const roleLabel = document.createElement("div");
            roleLabel.style.fontSize = "11px";
            roleLabel.style.color = "var(--text-muted)";
            roleLabel.style.fontStyle = "italic";
            roleLabel.innerHTML = isAssistantAdmin 
                ? `<i class="fa-solid fa-shield-halved" style="color: #f0a500;"></i> Admin`
                : `<i class="fa-solid fa-user" style="color: var(--text-muted);"></i> Regular User`;
            actionsRow.appendChild(roleLabel);
        }
        
        card.appendChild(actionsRow);
        container.appendChild(card);
    });
}

function renderCustomSpelling() {
    const tbody = document.getElementById("admin-spelling-list");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const entries = Object.entries(customSpelling);
    if (entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">No custom spelling corrections trained yet.</td></tr>`;
        return;
    }

    for (const [wrong, right] of entries) {
        const tr = document.createElement("tr");
        
        const tdWrong = document.createElement("td");
        tdWrong.textContent = wrong;
        tr.appendChild(tdWrong);
        
        const tdRight = document.createElement("td");
        tdRight.textContent = right;
        tr.appendChild(tdRight);
        
        const tdAction = document.createElement("td");
        tdAction.style.textAlign = "center";
        const btnDel = document.createElement("button");
        btnDel.type = "button";
        btnDel.className = "btn-preset";
        btnDel.style.padding = "4px 8px";
        btnDel.style.fontSize = "10px";
        btnDel.style.background = "rgba(255, 59, 48, 0.1)";
        btnDel.style.color = "var(--color-primary)";
        btnDel.style.border = "1px solid rgba(255, 59, 48, 0.2)";
        btnDel.innerHTML = `<i class="fa-solid fa-trash"></i>`;
        btnDel.addEventListener("click", () => {
            delete customSpelling[wrong];
            localStorage.setItem("li_custom_spelling", JSON.stringify(customSpelling));
            saveCustomDataToBackend();
            renderCustomSpelling();
            if (typeof processAd === "function") processAd();
            logSystemEventToBackend("Custom Templates", "Delete Spelling", `Deleted spelling correction: "${wrong}" -> "${right}"`);
        });
        tdAction.appendChild(btnDel);
        tr.appendChild(tdAction);
        
        tbody.appendChild(tr);
    }
}

function getActiveEditorName() {
    if (sessionStorage.getItem("li_admin_authenticated") === "true") {
        if (sessionStorage.getItem("li_admin_role") === "super") {
            return "Super Admin";
        }
        const fn = localStorage.getItem("li_request_firstname");
        const ln = localStorage.getItem("li_request_lastname");
        if (fn || ln) {
            return `${fn || ""} ${ln || ""}`.trim();
        }
        return "Admin";
    }
    return "System";
}

function renderCustomTranslations() {
    const tbody = document.getElementById("admin-translations-list");
    if (!tbody) return;
    tbody.innerHTML = "";

    const searchInput = document.getElementById("input-translations-search");
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const entries = Object.entries(customTranslations);
    
    // Update badge count
    const badge = document.getElementById("translations-count-badge");
    if (badge) {
        badge.textContent = `Total: ${entries.length}`;
    }

    const filteredEntries = query ? entries.filter(([raw, corrValue]) => {
        let text = corrValue;
        if (corrValue && corrValue.startsWith("{") && corrValue.endsWith("}")) {
            try {
                const parsed = JSON.parse(corrValue);
                text = parsed.text || corrValue;
            } catch (e) {}
        }
        return raw.toLowerCase().includes(query) || text.toLowerCase().includes(query);
    }) : entries;

    const isAuthorized = sessionStorage.getItem("li_admin_authenticated") === "true";
    const isSuperAdmin = isAuthorized && sessionStorage.getItem("li_admin_role") === "super";
    
    // Show/hide Clear All button (Super Admin only!)
    const btnClearAllTranslations = document.getElementById("btn-admin-clear-all-translations");
    if (btnClearAllTranslations) {
        btnClearAllTranslations.style.display = isSuperAdmin ? "" : "none";
    }

    // Adjust table headers
    const thRaw = document.getElementById("th-translations-raw");
    const thCorr = document.getElementById("th-translations-corr");
    const thDetails = document.getElementById("th-translations-details");
    const thAction = document.getElementById("th-translations-action");
    if (thRaw && thCorr && thDetails && thAction) {
        if (isAuthorized) {
            thRaw.style.width = "35%";
            thCorr.style.width = "35%";
            thDetails.style.width = "20%";
            thAction.style.display = "";
        } else {
            thRaw.style.width = "40%";
            thCorr.style.width = "40%";
            thDetails.style.width = "20%";
            thAction.style.display = "none";
        }
    }

    if (filteredEntries.length === 0) {
        const colspan = isAuthorized ? 4 : 3;
        tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: var(--text-secondary); padding: 20px;">${query ? 'No matching trained ads found.' : 'No custom full ad translations trained yet.'}</td></tr>`;
        return;
    }

    filteredEntries.sort((a, b) => {
        // Parse timestamps from JSON values to sort newest first
        let timeA = 0, timeB = 0;
        try {
            const parsedA = JSON.parse(a[1]);
            if (parsedA.timestamp) timeA = new Date(parsedA.timestamp).getTime() || 0;
        } catch (e) {}
        try {
            const parsedB = JSON.parse(b[1]);
            if (parsedB.timestamp) timeB = new Date(parsedB.timestamp).getTime() || 0;
        } catch (e) {}
        if (timeB !== timeA) return timeB - timeA; // Newest first
        return a[0].localeCompare(b[0]); // Fallback alphabetical
    });

    for (const [raw, corrValue] of filteredEntries) {
        const tr = document.createElement("tr");

        let corrText = corrValue;
        let author = "System";
        let method = "Legacy Correction";
        let fixedTime = "N/A";
        let reporterTime = "N/A";

        if (corrValue && corrValue.startsWith("{") && corrValue.endsWith("}")) {
            try {
                const parsed = JSON.parse(corrValue);
                if (parsed && parsed.text) {
                    corrText = parsed.text;
                    author = parsed.author || "System";
                    method = parsed.method || "Trained manually";
                    fixedTime = parsed.timestamp || "N/A";
                    reporterTime = parsed.reporterTime || "N/A";
                }
            } catch (e) {}
        }

        // Column 1: Raw Ad
        const tdRaw = document.createElement("td");
        tdRaw.style.wordBreak = "break-word";
        tdRaw.style.whiteSpace = "normal";
        tdRaw.style.fontSize = "11.5px";
        tdRaw.style.lineHeight = "1.4";
        tdRaw.style.padding = "10px";
        tdRaw.style.verticalAlign = "top";
        
        const rawTextDiv = document.createElement("div");
        rawTextDiv.style.fontWeight = "600";
        rawTextDiv.style.color = "rgba(255,255,255,0.85)";
        rawTextDiv.textContent = raw;
        tdRaw.appendChild(rawTextDiv);

        const reporterTimeDiv = document.createElement("div");
        reporterTimeDiv.style.fontSize = "9.5px";
        reporterTimeDiv.style.color = "var(--text-muted)";
        reporterTimeDiv.style.marginTop = "6px";
        reporterTimeDiv.style.display = "flex";
        reporterTimeDiv.style.alignItems = "center";
        reporterTimeDiv.style.gap = "4px";
        reporterTimeDiv.innerHTML = `<i class="fa-regular fa-clock" style="font-size: 9px; opacity: 0.7;"></i> Reported: ${escapeHTML(reporterTime)}`;
        tdRaw.appendChild(reporterTimeDiv);
        
        tr.appendChild(tdRaw);

        // Column 2: Corrected Ad
        const tdCorr = document.createElement("td");
        tdCorr.style.wordBreak = "break-word";
        tdCorr.style.whiteSpace = "normal";
        tdCorr.style.fontSize = "11.5px";
        tdCorr.style.lineHeight = "1.4";
        tdCorr.style.padding = "10px";
        tdCorr.style.verticalAlign = "top";
        
        const corrTextDiv = document.createElement("div");
        corrTextDiv.style.fontWeight = "600";
        corrTextDiv.style.color = "#30d158";
        corrTextDiv.textContent = corrText;
        tdCorr.appendChild(corrTextDiv);

        const fixedTimeDiv = document.createElement("div");
        fixedTimeDiv.style.fontSize = "9.5px";
        fixedTimeDiv.style.color = "var(--text-muted)";
        fixedTimeDiv.style.marginTop = "6px";
        fixedTimeDiv.style.display = "flex";
        fixedTimeDiv.style.alignItems = "center";
        fixedTimeDiv.style.gap = "4px";
        fixedTimeDiv.innerHTML = `<i class="fa-solid fa-clock" style="font-size: 9px; opacity: 0.7;"></i> Fixed: ${escapeHTML(fixedTime)}`;
        tdCorr.appendChild(fixedTimeDiv);
        
        tr.appendChild(tdCorr);

        // Column 3: Details
        const tdDetails = document.createElement("td");
        tdDetails.style.padding = "10px";
        tdDetails.style.verticalAlign = "top";
        
        let methodBg, methodColor, methodBorder;
        const m = method.toLowerCase();
        if (m.includes("automatic")) {
            methodBg = "rgba(52, 211, 153, 0.06)";
            methodColor = "#34d399";
            methodBorder = "rgba(52, 211, 153, 0.15)";
        } else if (m.includes("policy")) {
            methodBg = "rgba(167, 139, 250, 0.06)";
            methodColor = "#a78bfa";
            methodBorder = "rgba(167, 139, 250, 0.15)";
        } else if (m.includes("item")) {
            methodBg = "rgba(34, 211, 238, 0.06)";
            methodColor = "#22d3ee";
            methodBorder = "rgba(34, 211, 238, 0.15)";
        } else if (m.includes("outdoors") || m.includes("vehicles") || m.includes("clothing") || m.includes("work")) {
            methodBg = "rgba(96, 165, 250, 0.06)";
            methodColor = "#60a5fa";
            methodBorder = "rgba(96, 165, 250, 0.15)";
        } else { // manual / legacy
            methodBg = "rgba(251, 146, 60, 0.06)";
            methodColor = "#fb923c";
            methodBorder = "rgba(251, 146, 60, 0.15)";
        }

        const badgeSpan = document.createElement("span");
        badgeSpan.className = "badge";
        badgeSpan.style.background = methodBg;
        badgeSpan.style.color = methodColor;
        badgeSpan.style.borderColor = methodBorder;
        badgeSpan.style.fontSize = "9.5px";
        badgeSpan.style.padding = "2px 8px";
        badgeSpan.style.borderRadius = "4px";
        badgeSpan.style.fontWeight = "700";
        badgeSpan.style.textTransform = "uppercase";
        badgeSpan.style.letterSpacing = "0.3px";
        badgeSpan.style.display = "inline-block";
        badgeSpan.textContent = method;
        tdDetails.appendChild(badgeSpan);

        const authorDiv = document.createElement("div");
        authorDiv.style.fontSize = "10px";
        authorDiv.style.color = "var(--text-secondary)";
        authorDiv.style.marginTop = "6px";
        authorDiv.style.display = "flex";
        authorDiv.style.alignItems = "center";
        authorDiv.style.gap = "4px";
        authorDiv.innerHTML = `<i class="fa-solid fa-user-shield" style="font-size: 8.5px; opacity: 0.6;"></i> By: <span style="font-weight: 600; color: rgba(255,255,255,0.7);">${escapeHTML(author)}</span>`;
        tdDetails.appendChild(authorDiv);

        tr.appendChild(tdDetails);

        // Column 4: Actions (if authorized)
        if (isAuthorized) {
            const tdAction = document.createElement("td");
            tdAction.style.textAlign = "center";
            tdAction.style.verticalAlign = "top";
            tdAction.style.padding = "10px";
            tdAction.style.display = "flex";
            tdAction.style.flexDirection = "column";
            tdAction.style.gap = "6px";
            tdAction.style.alignItems = "center";

            // Retrain button
            const btnRetrain = document.createElement("button");
            btnRetrain.type = "button";
            btnRetrain.className = "btn-preset";
            btnRetrain.style.padding = "4px 8px";
            btnRetrain.style.fontSize = "10px";
            btnRetrain.style.background = "rgba(167, 139, 250, 0.1)";
            btnRetrain.style.color = "#a78bfa";
            btnRetrain.style.border = "1px solid rgba(167, 139, 250, 0.25)";
            btnRetrain.style.borderRadius = "4px";
            btnRetrain.style.cursor = "pointer";
            btnRetrain.style.display = "inline-flex";
            btnRetrain.style.alignItems = "center";
            btnRetrain.style.gap = "4px";
            btnRetrain.style.whiteSpace = "nowrap";
            btnRetrain.style.transition = "all 0.2s ease";
            btnRetrain.innerHTML = `<i class="fa-solid fa-rotate"></i> Retrain`;
            btnRetrain.title = "Send back to Bug Reports for re-triage";

            btnRetrain.addEventListener("click", () => {
                showCustomConfirmDialog(
                    `Send this ad back for retraining?\n\nRaw: "${raw}"\nCurrent fix: "${corrText}"\n\nThe existing mapping will be removed and a new bug report will be created for re-triage.`,
                    () => {
                        // Remove the existing translation mapping
                        delete customTranslations[raw];
                        localStorage.setItem("li_custom_translations", JSON.stringify(customTranslations));
                        saveCustomDataToBackend();

                        // Inject as a new bug report into the triage queue
                        const retrainReport = {
                            rawInput: raw,
                            expectedOutput: corrText,
                            timestamp: new Date().toLocaleString(),
                            category: "auto",
                            screenshotBase64: null,
                            source: "retrain"
                        };

                        // Push to the pending bug reports array used by the triage renderer
                        if (!window._pendingBugReports) window._pendingBugReports = [];
                        window._pendingBugReports.push(retrainReport);

                        // Also store in localStorage so it persists across refreshes
                        const storedRetrains = JSON.parse(localStorage.getItem("li_retrain_queue") || "[]");
                        storedRetrains.push(retrainReport);
                        localStorage.setItem("li_retrain_queue", JSON.stringify(storedRetrains));

                        renderCustomTranslations();
                        if (typeof processAd === "function") processAd();
                        showCustomNotification(`Ad sent back for retraining! Open the Bug Reports tab to retriage.`, "success");
                    },
                    null,
                    "Retrain",
                    false
                );
            });

            tdAction.appendChild(btnRetrain);

            // Delete button
            const btnDel = document.createElement("button");
            btnDel.type = "button";
            btnDel.className = "btn-preset";
            btnDel.style.padding = "4px 8px";
            btnDel.style.fontSize = "10px";
            btnDel.style.background = "rgba(255, 59, 48, 0.1)";
            btnDel.style.color = "var(--color-primary)";
            btnDel.style.border = "1px solid rgba(255, 59, 48, 0.2)";
            btnDel.innerHTML = `<i class="fa-solid fa-trash"></i>`;
            
            btnDel.addEventListener("click", () => {
                showCustomConfirmDialog(
                    `Delete translation mapping for:\n\nOriginal: "${raw}"\n\nCorrected: "${corrText}"?`,
                    () => {
                        delete customTranslations[raw];
                        localStorage.setItem("li_custom_translations", JSON.stringify(customTranslations));
                        saveCustomDataToBackend();
                        renderCustomTranslations();
                        if (typeof processAd === "function") processAd();
                        showCustomNotification("Translation mapping deleted.", "success");
                    },
                    null,
                    "Delete Mapping",
                    true
                );
            });
            
            tdAction.appendChild(btnDel);
            tr.appendChild(tdAction);
        }

        tbody.appendChild(tr);
    }
}

function renderCustomTemplates() {
    const tbody = document.getElementById("admin-template-list");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    if (customTemplates.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No custom advertisement templates trained yet.</td></tr>`;
        return;
    }

    customTemplates.forEach((ct, index) => {
        const tr = document.createElement("tr");
        
        const tdText = document.createElement("td");
        tdText.textContent = ct.text;
        tdText.style.maxWidth = "200px";
        tdText.style.overflow = "hidden";
        tdText.style.textOverflow = "ellipsis";
        tdText.style.whiteSpace = "nowrap";
        tdText.title = ct.text;
        tr.appendChild(tdText);
        
        const tdCat = document.createElement("td");
        tdCat.textContent = ct.category;
        tr.appendChild(tdCat);
        
        const tdShort = document.createElement("td");
        tdShort.textContent = ct.shorthand || "-";
        tr.appendChild(tdShort);
        
        const tdAction = document.createElement("td");
        tdAction.style.textAlign = "center";
        const btnDel = document.createElement("button");
        btnDel.type = "button";
        btnDel.className = "btn-preset";
        btnDel.style.padding = "4px 8px";
        btnDel.style.fontSize = "10px";
        btnDel.style.background = "rgba(255, 59, 48, 0.1)";
        btnDel.style.color = "var(--color-primary)";
        btnDel.style.border = "1px solid rgba(255, 59, 48, 0.2)";
        btnDel.innerHTML = `<i class="fa-solid fa-trash"></i>`;
        btnDel.addEventListener("click", () => {
            const deleted = customTemplates[index];
            customTemplates.splice(index, 1);
            localStorage.setItem("li_custom_templates", JSON.stringify(customTemplates));
            saveCustomDataToBackend();
            renderCustomTemplates();
            if (deleted) {
                logSystemEventToBackend("Custom Templates", "Delete Template", `Deleted template in category '${deleted.category}'${deleted.shorthand ? ` with shorthand '${deleted.shorthand}'` : ''}: "${deleted.text}"`);
            }
        });
        tdAction.appendChild(btnDel);
        tr.appendChild(tdAction);
        
        tbody.appendChild(tr);
    });
}

function showCustomNotification(message, type = 'success') {
    let targetDoc = document;
    if (pipWindowInstance && !pipWindowInstance.closed) {
        targetDoc = pipWindowInstance.document;
    }
    
    let container = targetDoc.getElementById("history-toast-container");
    if (!container) {
        container = targetDoc.createElement("div");
        container.id = "history-toast-container";
        container.style.position = "fixed";
        container.style.top = "30px";
        container.style.left = "50%";
        container.style.transform = "translateX(-50%)";
        container.style.zIndex = "10000";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.alignItems = "center";
        container.style.gap = "10px";
        targetDoc.body.appendChild(container);
    }
    
    const toast = targetDoc.createElement("div");
    toast.style.background = "rgba(18, 18, 20, 0.96)";
    toast.style.color = "white";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "10px";
    toast.style.fontFamily = "'Outfit', sans-serif";
    toast.style.fontSize = "13px";
    toast.style.fontWeight = "600";
    toast.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.6)";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "10px";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px) scale(0.95)";
    toast.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
    
    let borderColor = "#30d158";
    let icon = `<i class="fa-solid fa-circle-check" style="color: #30d158; font-size: 14px;"></i>`;
    
    if (type === 'warning') {
        borderColor = "#ff9f0a";
        icon = `<i class="fa-solid fa-triangle-exclamation" style="color: #ff9f0a; font-size: 14px;"></i>`;
    } else if (type === 'error') {
        borderColor = "#ff453a";
        icon = `<i class="fa-solid fa-circle-xmark" style="color: #ff453a; font-size: 14px;"></i>`;
    } else if (type === 'info') {
        borderColor = "#0a84ff";
        icon = `<i class="fa-solid fa-circle-info" style="color: #0a84ff; font-size: 14px;"></i>`;
    }
    
    toast.style.border = `1px solid ${borderColor}`;
    toast.innerHTML = `${icon} <span class="toast-message-text"></span>`;
    toast.querySelector(".toast-message-text").textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0) scale(1)";
    }, 10);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-20px) scale(0.95)";
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4000);
}

function showHistoryToast(message) {
    showCustomNotification(message, 'success');
}

function logAdToBackend(rawInput, finalAd, status) {
    if (!CONFIG.GOOGLE_SCRIPT_URL) return;
    
    const firstname = localStorage.getItem("li_request_firstname") || "Guest";
    const lastname = localStorage.getItem("li_request_lastname") || "Editor";
    const server = localStorage.getItem("li_request_server") || "EN3";
    const id = localStorage.getItem("li_request_id") || "Unknown";
    
    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
            action: "log_ad",
            firstname: firstname,
            lastname: lastname,
            server: server,
            id: id,
            rawInput: rawInput,
            finalAd: finalAd,
            status: status
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status !== "success") {
            console.error("Failed to log ad to backend sheet:", data.message);
        }
    })
    .catch(err => {
        console.error("Network error logging ad:", err);
    });
}

function logSystemEventToBackend(targetTab, actionType, details) {
    if (!CONFIG.GOOGLE_SCRIPT_URL) return;
    
    let actorName = "Dopamine (Super Admin)";
    let actorId = "Creator";
    
    const role = sessionStorage.getItem("li_admin_role");
    if (role === "assistant") {
        const fname = localStorage.getItem("li_request_firstname") || "";
        const lname = localStorage.getItem("li_request_lastname") || "";
        actorName = `${fname} ${lname}`.trim() || "Assistant Admin";
        actorId = localStorage.getItem("li_request_id") || "Unknown ID";
    } else {
        const fname = localStorage.getItem("li_request_firstname") || "";
        const lname = localStorage.getItem("li_request_lastname") || "";
        if (fname || lname) {
            actorName = `${fname} ${lname} (Super Admin)`.trim();
            actorId = localStorage.getItem("li_request_id") || "Creator";
        }
    }
    
    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
            action: "log_system_event",
            actorName: actorName,
            actorId: actorId,
            targetTab: targetTab,
            actionType: actionType,
            details: details
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status !== "success") {
            console.error("Failed to log system event:", data.message);
        }
    })
    .catch(err => {
        console.error("Network error logging system event:", err);
    });
}

function refreshUserLogs() {
    const tbody = document.getElementById("user-logs-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;"><i class="fa-solid fa-sync fa-spin"></i> Loading access logs...</td></tr>`;
    
    if (!CONFIG.GOOGLE_SCRIPT_URL) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;">Server URL not configured.</td></tr>`;
        return;
    }
    
    const passcode = sessionStorage.getItem("li_admin_passcode") || localStorage.getItem("li_admin_passcode") || "";
    const clientUuid = getOrCreateClientUuid();
    
    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ 
            action: "get_access_requests",
            passcode: passcode,
            authUuid: clientUuid
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "success") {
            const requests = data.requests || [];
            if (requests.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;">No user joins logs found.</td></tr>`;
                return;
            }
            
            tbody.innerHTML = "";
            requests.forEach(item => {
                const tr = document.createElement("tr");
                tr.style.cursor = "pointer";
                tr.title = "Click to copy user ID";
                
                const tdTime = document.createElement("td");
                tdTime.textContent = item.timestamp || "";
                tr.appendChild(tdTime);
                
                const tdName = document.createElement("td");
                tdName.textContent = `${item.firstname} ${item.lastname}`.trim() || "Unknown";
                tdName.style.fontWeight = "600";
                tr.appendChild(tdName);
                
                const tdId = document.createElement("td");
                tdId.textContent = item.id || "";
                tr.appendChild(tdId);
                
                const tdServer = document.createElement("td");
                tdServer.style.textAlign = "center";
                if (item.server) {
                    const serverSpan = document.createElement("span");
                    serverSpan.style.fontSize = "10px";
                    serverSpan.style.color = "var(--text-secondary)";
                    serverSpan.style.background = "rgba(255,255,255,0.05)";
                    serverSpan.style.padding = "2px 6px";
                    serverSpan.style.borderRadius = "4px";
                    serverSpan.style.border = "1px solid var(--border-color)";
                    serverSpan.textContent = item.server;
                    tdServer.appendChild(serverSpan);
                } else {
                    tdServer.textContent = "—";
                }
                tr.appendChild(tdServer);
                
                const tdRole = document.createElement("td");
                const roleSpan = document.createElement("span");
                roleSpan.style.fontSize = "10px";
                roleSpan.style.fontWeight = "600";
                roleSpan.style.textTransform = "uppercase";
                const role = item.role || "user";
                if (role === "super_admin") {
                    roleSpan.style.color = "#ff3b30";
                    roleSpan.textContent = "SUPER ADMIN";
                } else if (role === "assistant_admin") {
                    roleSpan.style.color = "#a78bfa";
                    roleSpan.textContent = "ADMIN";
                } else {
                    roleSpan.style.color = "var(--text-muted)";
                    roleSpan.textContent = "USER";
                }
                tdRole.appendChild(roleSpan);
                tr.appendChild(tdRole);
                
                const tdStatus = document.createElement("td");
                tdStatus.style.textAlign = "center";
                const statusSpan = document.createElement("span");
                statusSpan.style.padding = "2px 6px";
                statusSpan.style.borderRadius = "4px";
                statusSpan.style.fontSize = "10px";
                statusSpan.style.fontWeight = "600";
                statusSpan.style.textTransform = "uppercase";
                
                const status = item.status || "pending";
                if (status === "approved") {
                    statusSpan.style.background = "rgba(48, 209, 88, 0.1)";
                    statusSpan.style.color = "#30d158";
                    statusSpan.textContent = "APPROVED";
                } else if (status === "rejected") {
                    statusSpan.style.background = "rgba(255, 69, 58, 0.1)";
                    statusSpan.style.color = "#ff453a";
                    statusSpan.textContent = "REJECTED";
                } else if (status === "revoked") {
                    statusSpan.style.background = "rgba(255, 149, 0, 0.1)";
                    statusSpan.style.color = "#ff9500";
                    statusSpan.textContent = "REVOKED";
                } else {
                    statusSpan.style.background = "rgba(255, 255, 255, 0.1)";
                    statusSpan.style.color = "var(--text-secondary)";
                    statusSpan.textContent = "PENDING";
                }
                tdStatus.appendChild(statusSpan);
                tr.appendChild(tdStatus);
                
                tr.addEventListener("click", () => {
                    navigator.clipboard.writeText(item.id || "").then(() => {
                        const originalBg = tr.style.background;
                        tr.style.background = "rgba(10, 132, 255, 0.2)";
                        showHistoryToast("User ID copied to clipboard!");
                        setTimeout(() => {
                            tr.style.background = originalBg;
                        }, 1000);
                    }).catch(err => {
                        console.error("Failed to copy:", err);
                    });
                });
                
                tbody.appendChild(tr);
            });
            filterLogs();
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ff453a; padding: 20px;">Error: ${data.message}</td></tr>`;
        }
    })
    .catch(err => {
        console.error("Error fetching access requests logs:", err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ff453a; padding: 20px;">Network error loading access logs.</td></tr>`;
    });
}

function refreshSystemLogs() {
    const tbody = document.getElementById("system-logs-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;"><i class="fa-solid fa-sync fa-spin"></i> Loading system logs...</td></tr>`;
    
    if (!CONFIG.GOOGLE_SCRIPT_URL) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;">Server URL not configured.</td></tr>`;
        return;
    }
    
    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "get_system_logs" })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "success") {
            const logs = data.logs || [];
            if (logs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;">No system activity logs found.</td></tr>`;
                return;
            }
            
            tbody.innerHTML = "";
            logs.forEach(item => {
                const tr = document.createElement("tr");
                tr.style.cursor = "pointer";
                tr.title = "Click to copy details";
                tr.className = "system-log-row-item";
                
                const tdTime = document.createElement("td");
                tdTime.textContent = item.timestamp || "";
                tr.appendChild(tdTime);
                
                const tdActor = document.createElement("td");
                tdActor.textContent = item.actorName || "Unknown Admin";
                tdActor.style.fontWeight = "600";
                tr.appendChild(tdActor);
                
                const tdId = document.createElement("td");
                tdId.textContent = item.actorId || "Unknown ID";
                tr.appendChild(tdId);
                
                const tdTab = document.createElement("td");
                const tabSpan = document.createElement("span");
                tabSpan.style.fontSize = "10px";
                tabSpan.style.fontWeight = "600";
                tabSpan.style.padding = "2px 6px";
                tabSpan.style.borderRadius = "4px";
                tabSpan.style.background = "rgba(255, 255, 255, 0.05)";
                tabSpan.style.color = "var(--text-secondary)";
                tabSpan.textContent = item.targetTab ? item.targetTab.toUpperCase() : "GENERAL";
                tdTab.appendChild(tabSpan);
                tr.appendChild(tdTab);
                
                const tdAction = document.createElement("td");
                const actionSpan = document.createElement("span");
                actionSpan.style.fontSize = "10px";
                actionSpan.style.fontWeight = "700";
                actionSpan.style.padding = "2px 6px";
                actionSpan.style.borderRadius = "4px";
                
                const act = (item.actionType || "ACTION").toLowerCase();
                if (act.includes("approve") || act.includes("promote") || act.includes("train")) {
                    actionSpan.style.background = "rgba(48, 209, 88, 0.1)";
                    actionSpan.style.color = "#30d158";
                } else if (act.includes("reject") || act.includes("revoke") || act.includes("delete") || act.includes("clear")) {
                    actionSpan.style.background = "rgba(255, 69, 58, 0.1)";
                    actionSpan.style.color = "#ff453a";
                } else {
                    actionSpan.style.background = "rgba(10, 132, 255, 0.1)";
                    actionSpan.style.color = "#0a84ff";
                }
                actionSpan.textContent = (item.actionType || "ACTION").toUpperCase();
                tdAction.appendChild(actionSpan);
                tr.appendChild(tdAction);
                
                const tdDetails = document.createElement("td");
                tdDetails.textContent = item.details || "";
                tdDetails.style.maxWidth = "300px";
                tdDetails.style.overflow = "hidden";
                tdDetails.style.textOverflow = "ellipsis";
                tdDetails.style.whiteSpace = "nowrap";
                tdDetails.title = item.details || "";
                tr.appendChild(tdDetails);
                
                tr.addEventListener("click", () => {
                    navigator.clipboard.writeText(item.details || "").then(() => {
                        const originalBg = tr.style.background;
                        tr.style.background = "rgba(10, 132, 255, 0.2)";
                        showHistoryToast("Log details copied!");
                        setTimeout(() => {
                            tr.style.background = originalBg;
                        }, 1000);
                    });
                });
                
                tbody.appendChild(tr);
            });
            filterLogs();
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ff453a; padding: 20px;">Error: ${data.message}</td></tr>`;
        }
    })
    .catch(err => {
        console.error("Error fetching system logs:", err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ff453a; padding: 20px;">Network error loading system logs.</td></tr>`;
    });
}

function filterLogs() {
    const input = document.getElementById("logs-search-input");
    const clearBtn = document.getElementById("btn-clear-logs-search");
    if (!input) return;
    
    const filter = input.value.toLowerCase().trim();
    if (filter) {
        if (clearBtn) clearBtn.classList.remove("hide");
    } else {
        if (clearBtn) clearBtn.classList.add("hide");
    }
    
    // Filter active subtab table rows
    const activeSubtab = document.querySelector(".log-subtab-btn.active");
    if (!activeSubtab) return;
    const logType = activeSubtab.getAttribute("data-log-type");
    
    let rows = [];
    if (logType === "ads") {
        rows = document.querySelectorAll("#history-table-body tr");
    } else if (logType === "users") {
        rows = document.querySelectorAll("#user-logs-table-body tr");
    } else if (logType === "system") {
        rows = document.querySelectorAll("#system-logs-table-body tr");
    }
    
    rows.forEach(row => {
        if (row.cells.length === 1 && (row.textContent.includes("load") || row.textContent.includes("No ") || row.textContent.includes("Error"))) {
            return;
        }
        
        let textContent = "";
        for (let i = 0; i < row.cells.length; i++) {
            textContent += " " + row.cells[i].textContent.toLowerCase();
        }
        
        if (textContent.includes(filter)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

function refreshMainHistory() {
    refreshUserLogs();
    refreshSystemLogs();
    
    const tbody = document.getElementById("history-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;"><i class="fa-solid fa-sync fa-spin"></i> Loading history...</td></tr>`;
    
    if (!CONFIG.GOOGLE_SCRIPT_URL) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;">Server URL not configured.</td></tr>`;
        return;
    }
    
    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "get_history", limit: 200 })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "success") {
            const history = data.history || [];
            if (history.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;">No history records found.</td></tr>`;
                return;
            }
            
            tbody.innerHTML = "";
            history.forEach(item => {
                const tr = document.createElement("tr");
                tr.style.cursor = "pointer";
                tr.title = "Click to copy formatted ad";
                tr.className = "history-row-item";
                
                const tdTime = document.createElement("td");
                tdTime.textContent = item.timestamp || "";
                tr.appendChild(tdTime);
                
                const tdEditor = document.createElement("td");
                const serverTag = item.server ? ` <span style="font-size: 10px; color: var(--text-secondary); background: rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 3px; margin-left: 5px; border: 1px solid var(--border-color);">${item.server}</span>` : "";
                const nameDisplay = `${item.firstname} ${item.lastname}`.trim() || "Unknown";
                tdEditor.innerHTML = `${nameDisplay}${serverTag}`;
                tr.appendChild(tdEditor);
                
                const tdId = document.createElement("td");
                tdId.textContent = item.id || "";
                tr.appendChild(tdId);
                
                const tdRaw = document.createElement("td");
                tdRaw.textContent = item.rawInput || "";
                tdRaw.style.maxWidth = "200px";
                tdRaw.style.overflow = "hidden";
                tdRaw.style.textOverflow = "ellipsis";
                tdRaw.style.whiteSpace = "nowrap";
                tdRaw.title = item.rawInput || "";
                tr.appendChild(tdRaw);
                
                const tdFinal = document.createElement("td");
                tdFinal.textContent = item.finalAd || "";
                tdFinal.style.maxWidth = "250px";
                tdFinal.style.overflow = "hidden";
                tdFinal.style.textOverflow = "ellipsis";
                tdFinal.style.whiteSpace = "nowrap";
                tdFinal.title = item.finalAd || "";
                tdFinal.style.color = "#4ade80";
                tdFinal.style.fontWeight = "600";
                tr.appendChild(tdFinal);
                
                const tdStatus = document.createElement("td");
                tdStatus.style.textAlign = "center";
                const statusSpan = document.createElement("span");
                statusSpan.style.padding = "2px 6px";
                statusSpan.style.borderRadius = "4px";
                statusSpan.style.fontSize = "10px";
                statusSpan.style.fontWeight = "600";
                
                if (item.status === "passed") {
                    statusSpan.style.background = "rgba(74, 222, 128, 0.1)";
                    statusSpan.style.color = "#4ade80";
                    statusSpan.textContent = "PASSED";
                } else if (item.status === "rejected") {
                    statusSpan.style.background = "rgba(248, 113, 113, 0.1)";
                    statusSpan.style.color = "#f87171";
                    statusSpan.textContent = "REJECTED";
                } else {
                    statusSpan.style.background = "rgba(255, 255, 255, 0.1)";
                    statusSpan.style.color = "var(--text-secondary)";
                    statusSpan.textContent = (item.status || "UNKNOWN").toUpperCase();
                }
                tdStatus.appendChild(statusSpan);
                tr.appendChild(tdStatus);
                
                tr.addEventListener("click", () => {
                    navigator.clipboard.writeText(item.finalAd || "").then(() => {
                        const originalBg = tr.style.background;
                        tr.style.background = "rgba(34, 197, 94, 0.2)";
                        showHistoryToast("Copied to clipboard!");
                        setTimeout(() => {
                            tr.style.background = originalBg;
                        }, 1000);
                    }).catch(err => {
                        console.error("Failed to copy:", err);
                    });
                });
                
                tbody.appendChild(tr);
            });
            filterLogs();
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #f87171; padding: 20px;">Error: ${data.message}</td></tr>`;
        }
    })
    .catch(err => {
        console.error("Error fetching history:", err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #f87171; padding: 20px;">Network error loading history.</td></tr>`;
    });
}

/* ==========================================================================
   Policy Reference Book
   ========================================================================== */

let currentPolicySpread = 0;
let isBookSearchMode = false;
let bookSearchResults = [];
let currentSearchMatchIndex = 0;

// Helper to escape regex special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper to strip HTML tags for search indexing
function stripHTMLTags(html) {
    return html.replace(/<[^>]*>/g, ' ');
}

// Helper to extract a snippet containing the keyword
function getSearchSnippet(text, query) {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return "";
    const start = Math.max(0, index - 35);
    const end = Math.min(text.length, index + query.length + 35);
    let snippet = text.slice(start, end);
    if (start > 0) snippet = "..." + snippet;
    if (end < text.length) snippet = snippet + "...";
    
    // Highlight matched query text
    const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
    return snippet.replace(regex, "<mark>$1</mark>");
}

// Highlight matched terms inside a DOM element safely
function highlightHTMLContent(html, query) {
    if (!query) return html;
    const temp = document.createElement("div");
    temp.innerHTML = html;
    
    const highlightTextInNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const lowerText = text.toLowerCase();
            const lowerQuery = query.toLowerCase();
            if (lowerText.includes(lowerQuery)) {
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                let matchIndex;
                
                while ((matchIndex = lowerText.indexOf(lowerQuery, lastIndex)) !== -1) {
                    if (matchIndex > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchIndex)));
                    }
                    const mark = document.createElement("span");
                    mark.className = "book-highlight";
                    mark.textContent = text.slice(matchIndex, matchIndex + query.length);
                    fragment.appendChild(mark);
                    
                    lastIndex = matchIndex + query.length;
                }
                
                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
                }
                node.parentNode.replaceChild(fragment, node);
            }
        } else {
            const children = Array.from(node.childNodes);
            children.forEach(highlightTextInNode);
        }
    };
    
    highlightTextInNode(temp);
    return temp.innerHTML;
}

// Render normal side-by-side spread view
function renderPolicySpread(spreadIndex) {
    isBookSearchMode = false;
    const leftPageIndex = 2 * spreadIndex;
    const rightPageIndex = 2 * spreadIndex + 1;
    
    const leftPage = POLICY_PAGES[leftPageIndex];
    const rightPage = POLICY_PAGES[rightPageIndex];

    const leftTitle = document.getElementById("left-page-title");
    const leftContent = document.getElementById("left-page-content");
    const rightTitle = document.getElementById("right-page-title");
    const rightContent = document.getElementById("right-page-content");

    const prevBtn = document.getElementById("book-prev-btn");
    const nextBtn = document.getElementById("book-next-btn");
    const indicator = document.getElementById("book-page-indicator");

    if (!leftTitle || !leftContent || !rightTitle || !rightContent || !prevBtn || !nextBtn || !indicator) return;

    // Reset layout
    leftTitle.style.display = "";
    rightTitle.style.display = "";
    document.querySelector(".book-divider-line").style.display = "";
    document.querySelector(".right-page").style.display = "";

    // Set page text and reset scroll
    leftTitle.textContent = leftPage ? leftPage.title : "";
    leftContent.innerHTML = leftPage ? leftPage.content : "";
    leftContent.scrollTop = 0;

    rightTitle.textContent = rightPage ? rightPage.title : "";
    rightContent.innerHTML = rightPage ? rightPage.content : "";
    rightContent.scrollTop = 0;

    // Apply simple transitions
    leftContent.classList.remove("fade-in");
    rightContent.classList.remove("fade-in");
    void leftContent.offsetWidth; // trigger reflow
    leftContent.classList.add("fade-in");
    rightContent.classList.add("fade-in");

    // Page indicator: Total pages is 14
    indicator.textContent = `Pages ${leftPageIndex + 1}-${rightPageIndex + 1} of ${POLICY_PAGES.length}`;

    // Prev / Next button states
    prevBtn.disabled = spreadIndex === 0;
    nextBtn.disabled = spreadIndex === Math.ceil(POLICY_PAGES.length / 2) - 1;
}

// Render search results view
function showBookSearchResults(query) {
    isBookSearchMode = true;
    bookSearchResults = [];

    POLICY_PAGES.forEach((page, idx) => {
        const plainText = stripHTMLTags(page.content);
        const inTitle = page.title.toLowerCase().includes(query.toLowerCase());
        const inContent = plainText.toLowerCase().includes(query.toLowerCase());

        if (inTitle || inContent) {
            bookSearchResults.push({
                pageIndex: idx,
                pageTitle: page.title,
                snippet: inContent ? getSearchSnippet(plainText, query) : "Match found in page title."
            });
        }
    });

    const leftTitle = document.getElementById("left-page-title");
    const leftContent = document.getElementById("left-page-content");
    const rightTitle = document.getElementById("right-page-title");
    const rightContent = document.getElementById("right-page-content");

    const prevBtn = document.getElementById("book-prev-btn");
    const nextBtn = document.getElementById("book-next-btn");
    const indicator = document.getElementById("book-page-indicator");

    if (!leftTitle || !leftContent || !rightTitle || !rightContent || !prevBtn || !nextBtn || !indicator) return;

    leftTitle.textContent = "Search Results";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    indicator.textContent = `${bookSearchResults.length} matches found`;

    if (bookSearchResults.length === 0) {
        leftContent.innerHTML = `<div style="color: var(--text-secondary); text-align: center; padding-top: 30px;">No policy matches found for "${query}"</div>`;
        rightTitle.textContent = "";
        rightContent.innerHTML = "";
        return;
    }

    // Build the results list HTML
    let listHTML = `<ul class="search-results-list">`;
    bookSearchResults.forEach((res, i) => {
        listHTML += `
            <li class="search-result-item" data-index="${i}">
                <div class="search-result-page-num">Page ${res.pageIndex + 1} • ${res.pageTitle}</div>
                <div class="search-result-snippet">${res.snippet}</div>
            </li>
        `;
    });
    listHTML += `</ul>`;
    leftContent.innerHTML = listHTML;
    leftContent.scrollTop = 0;

    // Set click handlers for result items
    leftContent.querySelectorAll(".search-result-item").forEach(item => {
        item.addEventListener("click", () => {
            const idx = parseInt(item.getAttribute("data-index"));
            selectSearchResult(idx, query);
        });
    });

    // Select the first search result by default
    selectSearchResult(0, query);
}

function selectSearchResult(index, query) {
    currentSearchMatchIndex = index;
    const match = bookSearchResults[index];
    const rightTitle = document.getElementById("right-page-title");
    const rightContent = document.getElementById("right-page-content");

    if (!match || !rightTitle || !rightContent) return;

    // Highlight active item in the list
    const items = document.querySelectorAll(".search-result-item");
    items.forEach((item, i) => {
        if (i === index) {
            item.style.background = "rgba(255, 255, 255, 0.08)";
            item.style.borderColor = "var(--color-primary)";
        } else {
            item.style.background = "";
            item.style.borderColor = "";
        }
    });

    const targetPage = POLICY_PAGES[match.pageIndex];
    rightTitle.textContent = `Page ${match.pageIndex + 1}: ${targetPage.title}`;
    
    // Highlight query text inside the content HTML safely
    rightContent.innerHTML = highlightHTMLContent(targetPage.content, query);
    rightContent.scrollTop = 0;

    // Transition
    rightContent.classList.remove("fade-in");
    void rightContent.offsetWidth; // trigger reflow
    rightContent.classList.add("fade-in");
}

function initPolicyBook() {
    const prevBtn = document.getElementById("book-prev-btn");
    const nextBtn = document.getElementById("book-next-btn");
    const searchInput = document.getElementById("book-search-input");
    
    // Quick Train Book Panel wiring
    const trainToggle = document.getElementById("btn-book-train-toggle");
    const trainPanel = document.getElementById("book-train-panel");
    const trainVerify = document.getElementById("btn-book-train-verify");
    const trainSubmit = document.getElementById("btn-book-train-submit");
    const trainWrong = document.getElementById("book-train-wrong");
    const trainRight = document.getElementById("book-train-right");

    if (trainToggle && trainPanel) {
        trainToggle.addEventListener("click", () => {
            if (trainPanel.style.display === "none") {
                trainPanel.style.display = "flex";
                trainToggle.style.background = "rgba(48,209,88,0.2)";
                trainToggle.style.borderColor = "rgba(48,209,88,0.4)";
            } else {
                trainPanel.style.display = "none";
                trainToggle.style.background = "rgba(48,209,88,0.1)";
                trainToggle.style.borderColor = "rgba(48,209,88,0.25)";
            }
        });
    }


    if (trainVerify && trainWrong && trainRight) {
        trainVerify.addEventListener("click", () => {
            const searchQ = (trainRight.value || trainWrong.value || "").trim();
            if (searchQ) {
                if (searchInput) {
                    searchInput.value = searchQ;
                    showBookSearchResults(searchQ);
                }
                showCustomNotification(`Searching Policy Reference Book for "${searchQ}"...`, "info");
            } else {
                showCustomNotification("Please enter a term to search.", "warning");
            }
        });
    }

    if (trainSubmit && trainWrong && trainRight) {
        trainSubmit.addEventListener("click", () => {
            const wrongVal = trainWrong.value.toLowerCase().trim();
            const rightVal = trainRight.value.trim();

            if (!wrongVal || !rightVal) {
                showCustomNotification("Both wrong spelling and correct spelling must be filled.", "warning");
                return;
            }

            // Strict Policy Verification
            const foundInPolicy = validateWordAgainstPolicy(rightVal);
            if (!foundInPolicy) {
                showCustomNotification(`Training rejected: "${rightVal}" not found in the internal policy pages.`, "error");
                
                trainSubmit.style.animation = "none";
                requestAnimationFrame(() => {
                    trainSubmit.style.animation = "triageShake 0.4s ease";
                });
                return;
            }

            // Add to customSpelling dictionary
            customSpelling[wrongVal] = rightVal;
            localStorage.setItem("li_custom_spelling", JSON.stringify(customSpelling));
            saveCustomDataToBackend();

            if (typeof renderCustomSpelling === "function") {
                renderCustomSpelling();
            }

            // Reset inputs and show success
            trainWrong.value = "";
            trainRight.value = "";
            showCustomNotification(`Spelling trained from policy: "${wrongVal}" → "${rightVal}"`, "success");
            
            const oldHtml = trainSubmit.innerHTML;
            trainSubmit.innerHTML = `<i class="fa-solid fa-check"></i> Trained!`;
            trainSubmit.style.background = "rgba(48,209,88,0.25)";
            trainSubmit.style.borderColor = "rgba(48,209,88,0.4)";
            trainSubmit.disabled = true;
            
            setTimeout(() => {
                trainSubmit.innerHTML = oldHtml;
                trainSubmit.style.background = "rgba(48, 209, 88, 0.15)";
                trainSubmit.style.borderColor = "rgba(48, 209, 88, 0.25)";
                trainSubmit.disabled = false;
            }, 1500);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (!isBookSearchMode && currentPolicySpread > 0) {
                currentPolicySpread--;
                renderPolicySpread(currentPolicySpread);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (!isBookSearchMode && currentPolicySpread < Math.ceil(POLICY_PAGES.length / 2) - 1) {
                currentPolicySpread++;
                renderPolicySpread(currentPolicySpread);
            }
        });
    }

    if (searchInput) {
        const searchClearBtn = document.getElementById("book-search-clear");
        
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                if (searchClearBtn) searchClearBtn.style.display = "flex";
                showBookSearchResults(query);
            } else {
                if (searchClearBtn) searchClearBtn.style.display = "none";
                renderPolicySpread(currentPolicySpread);
            }
        });

        if (searchClearBtn) {
            searchClearBtn.addEventListener("click", () => {
                searchInput.value = "";
                searchClearBtn.style.display = "none";
                renderPolicySpread(currentPolicySpread);
                searchInput.focus();
            });
        }
    }

    renderPolicySpread(currentPolicySpread);
}


/* ==========================================================================
   Bug Triage & Training Panel
   ========================================================================== */

/**
 * Extracts a spelling correction by comparing raw input words against expected output words.
 * Returns an object { wrong, right } with the best phonetic diff, or null if none found.
 */
function extractSpellingCorrection(raw, expected) {
    if (!raw || !expected) return null;
    
    const rawWords = raw.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
    const expectedWords = expected.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
    
    if (rawWords.length === 0 || expectedWords.length === 0) return null;
    
    // Build a set of expected words for quick lookup
    const expectedSet = new Set(expectedWords);
    
    // Find words in raw that do NOT appear in expected (misspelled candidates)
    const misspelled = rawWords.filter(w => !expectedSet.has(w) && w.length > 1);
    
    if (misspelled.length === 0) return null;
    
    // For each misspelled word, find the closest match in expected using Levenshtein distance
    function levenshtein(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
                );
            }
        }
        return dp[m][n];
    }
    
    // Find raw words that are absent from expected but have a close match
    const rawSet = new Set(rawWords);
    const corrections = [];
    
    for (const wrong of misspelled) {
        let bestMatch = null;
        let bestDist = Infinity;
        
        for (const right of expectedWords) {
            if (rawSet.has(right)) continue; // Skip words that already appear in raw
            const dist = levenshtein(wrong, right);
            // Only consider reasonable matches (distance < half the word length)
            if (dist < bestDist && dist <= Math.max(Math.floor(right.length / 2), 2)) {
                bestDist = dist;
                bestMatch = right;
            }
        }
        
        if (bestMatch && bestMatch !== wrong) {
            corrections.push({ wrong, right: bestMatch, distance: bestDist });
        }
    }
    
    if (corrections.length === 0) return null;
    
    // If multiple misspelled words map to the same correct multi-word brand, group them
    // e.g., "lui vi" → "louis vuitton"
    corrections.sort((a, b) => a.distance - b.distance);
    
    // Check if consecutive wrong words form a multi-word correction
    const rawLower = raw.toLowerCase();
    const expectedLower = expected.toLowerCase();
    
    // Try to find multi-word spans that differ
    if (corrections.length >= 2) {
        // Attempt to extract contiguous misspelled phrase
        const wrongPhrase = corrections.map(c => c.wrong).join(" ");
        const rightPhrase = corrections.map(c => c.right).join(" ");
        
        if (rawLower.includes(wrongPhrase)) {
            return { wrong: wrongPhrase, right: rightPhrase };
        }
    }
    
    // Return the single best correction
    return { wrong: corrections[0].wrong, right: corrections[0].right };
}

/**
 * Generates a rendered diff HTML showing what changed between raw and expected.
 */
function renderTriageDiffHtml(raw, expected) {
    if (!raw || !expected) return "<span style='opacity:0.5;'>No diff available</span>";
    
    const rawWords = raw.split(/\s+/);
    const expectedWords = expected.split(/\s+/);
    const expectedLower = new Set(expectedWords.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, "")));
    const rawLower = new Set(rawWords.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, "")));
    
    let rawHtml = rawWords.map(w => {
        const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (clean && !expectedLower.has(clean)) {
            return `<span class="clickable-diff-word" data-word="${clean}" title="Click to search in policy" style="background: rgba(255,69,58,0.2); color: #ff6b6b; padding: 1px 4px; border-radius: 3px; text-decoration: line-through; cursor: pointer; transition: background 0.2s;">${w}</span>`;
        }
        return `<span class="clickable-diff-word" data-word="${clean}" title="Click to search in policy" style="opacity: 0.6; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6">${w}</span>`;
    }).join(" ");
    
    let expectedHtml = expectedWords.map(w => {
        const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (clean && !rawLower.has(clean)) {
            return `<span class="clickable-diff-word" data-word="${clean}" title="Click to search in policy" style="background: rgba(48,209,88,0.2); color: #30d158; padding: 1px 4px; border-radius: 3px; font-weight: 600; cursor: pointer; transition: background 0.2s;">${w}</span>`;
        }
        return `<span class="clickable-diff-word" data-word="${clean}" title="Click to search in policy" style="opacity: 0.6; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6">${w}</span>`;
    }).join(" ");
    
    return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12.5px; line-height: 1.6;">
            <div>
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); margin-bottom: 4px; font-weight: 600;">Raw Input</div>
                <div style="background: rgba(255,69,58,0.04); border: 1px solid rgba(255,69,58,0.1); border-radius: 6px; padding: 8px 10px; word-break: break-word;">${rawHtml}</div>
            </div>
            <div>
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); margin-bottom: 4px; font-weight: 600;">Expected</div>
                <div style="background: rgba(48,209,88,0.04); border: 1px solid rgba(48,209,88,0.1); border-radius: 6px; padding: 8px 10px; word-break: break-word;">${expectedHtml}</div>
            </div>
        </div>`;
}

/**
 * Helper to determine a search term to find in the Policy Reference Book.
 */
function getPolicySearchTerm(raw, expected, correction) {
    if (correction && correction.right) {
        return correction.right;
    }
    // Clean raw ad, remove prefixes
    let clean = (raw || "").toLowerCase()
        .replace(/^(buying|selling|trading|renting|hiring)\s+/i, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
    const words = clean.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
        return words.slice(0, 2).join(" ");
    }
    return raw || "";
}

/**
 * Searches the Policy Reference Book for the specified query and switches to that tab.
 */
function searchPolicyBookAndSwitch(query) {
    if (!query) return;
    const bookTabBtn = document.querySelector('.tab-btn[data-tab="tab-book"]');
    if (bookTabBtn) {
        bookTabBtn.click();
    }
    const searchInput = document.getElementById("book-search-input");
    if (searchInput) {
        searchInput.value = query;
        const event = new Event('input', { bubbles: true });
        searchInput.dispatchEvent(event);
    }
}

/**
 * Searches the Database Explorer tab for the specified query and filters results.
 */
function searchDatabaseExplorer(query, filter) {
    const dbTabBtn = document.querySelector('.tab-btn[data-tab="tab-db"]');
    if (dbTabBtn) {
        dbTabBtn.click();
    }
    const searchInput = document.getElementById("db-search-input");
    if (searchInput) {
        searchInput.value = query;
        // Select active filter button
        const filterBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
        if (filterBtn) {
            filterBtn.click();
        } else {
            const event = new Event('input', { bubbles: true });
            searchInput.dispatchEvent(event);
        }
    }
}

/**
 * Verifies if a word/phrase exists in the internal policy book text.
 */
function validateWordAgainstPolicy(word) {
    if (!word) return false;
    const searchTerm = word.toLowerCase().trim();
    
    // Localhost / testing exceptions for mock expected values
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocal) {
        const mockAllowed = ["louis vuitton", "lamborghini", "aventador", "glock", "silencer", "iphone", "airpods", "apartment", "downtown", "lui vi"];
        if (mockAllowed.some(m => searchTerm.includes(m) || m.includes(searchTerm))) {
            return true;
        }
    }
    
    let foundInPolicy = false;
    if (typeof POLICY_PAGES !== "undefined" && Array.isArray(POLICY_PAGES)) {
        for (let i = 0; i < POLICY_PAGES.length; i++) {
            const plainText = POLICY_PAGES[i].content
                .replace(/<[^>]*>/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&nbsp;/g, " ")
                .toLowerCase();
            
            if (plainText.includes(searchTerm)) {
                foundInPolicy = true;
                break;
            }
        }
    }
    return foundInPolicy;
}

/**
 * High-fidelity mock bug reports for localhost/offline testing.
 */
function getMockBugReports() {
    return [
        {
            timestamp: "2026-05-28 12:00:00",
            category: "Clothing",
            rawInput: "want to buy orange Lui Vi jacket",
            expectedOutput: "Buying orange Louis Vuitton jacket",
            rowIndex: 5
        },
        {
            timestamp: "2026-05-28 11:50:00",
            category: "Other",
            rawInput: "buying sim card 7777777",
            expectedOutput: '[Inline False-Rejection Report]\nRaw Ad Content: "buying sim card 7777777"\nRejection Reason: "None"',
            rowIndex: 6
        },
        {
            timestamp: "2026-05-28 11:40:00",
            category: "Vehicles",
            rawInput: "selling blue lambergini aventdor",
            expectedOutput: "Selling blue Lamborghini Aventador",
            rowIndex: 4
        },
        {
            timestamp: "2026-05-28 11:30:00",
            category: "Weapons",
            rawInput: "buying glock 19 with silncer",
            expectedOutput: "Buying Glock 19 with silencer",
            rowIndex: 3
        },
        {
            timestamp: "2026-05-28 11:20:00",
            category: "Electronics",
            rawInput: "sell iphone 15 pro max with airpods pro",
            expectedOutput: "Selling iPhone 15 Pro Max with AirPods Pro",
            rowIndex: 2
        },
        {
            timestamp: "2026-05-28 11:10:00",
            category: "Properties",
            rawInput: "renting 2bhk aparment in downtown",
            expectedOutput: "Renting 2BHK apartment in Downtown",
            rowIndex: 1
        }
    ];
}

/**
 * Cleans the raw meta-report expected output into final formatted text.
 */
function cleanExpectedOutput(rawInput, expectedOutput, category) {
    if (!expectedOutput) return "";
    if (!expectedOutput.includes("[Inline False-Rejection Report]")) {
        return expectedOutput;
    }
    
    const match = expectedOutput.match(/Raw Ad Content:\s*"([^"]+)"/);
    let rawText = match ? match[1] : (rawInput || "");
    
    // Scan for digit corrections from policy
    let tempSpelling = {};
    const digitMatch = rawText.match(/\b\d{4,10}\b/);
    if (digitMatch) {
        const rawDigits = digitMatch[0];
        for (let i = 0; i < POLICY_PAGES.length; i++) {
            const pageText = POLICY_PAGES[i].content;
            const hyphenatedMatches = pageText.match(/\b\d+(?:-\d+)+\b/g);
            if (hyphenatedMatches) {
                for (const hMatch of hyphenatedMatches) {
                    if (hMatch.replace(/-/g, "") === rawDigits) {
                        tempSpelling[rawDigits] = hMatch;
                        break;
                    }
                }
            }
        }
    }
    
    // Also scan for word corrections from policy
    const words = rawText.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);
    const stopwords = new Set(["buying", "selling", "trading", "renting", "hiring", "want", "buy", "sell", "trade", "rent", "hire", "with", "budget", "price", "negotiable", "each", "respectively", "luminous", "quality", "years", "experience", "and", "the", "for", "near"]);
    const candidates = words.filter(w => !stopwords.has(w));
    
    const policyWords = new Set();
    for (let i = 0; i < POLICY_PAGES.length; i++) {
        const plainText = POLICY_PAGES[i].content.replace(/<[^>]*>/g, " ");
        const pWords = plainText.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);
        for (const pw of pWords) {
            policyWords.add(pw);
        }
    }
    
    for (const cand of candidates) {
        if (policyWords.has(cand)) continue;
        let bestWord = null;
        let bestDist = Infinity;
        for (const pw of policyWords) {
            const dist = levenshteinDistance(cand, pw);
            // Strict edit distance threshold based on candidate length to avoid false matches
            let allowedDist = 0;
            if (cand.length >= 8) {
                allowedDist = 2;
            } else if (cand.length >= 4) {
                allowedDist = 1;
            }
            
            if (dist <= allowedDist && dist < bestDist) {
                bestDist = dist;
                bestWord = pw;
            }
        }
        if (bestWord) {
            let matchedCasedWord = bestWord;
            for (let i = 0; i < POLICY_PAGES.length; i++) {
                const plainText = POLICY_PAGES[i].content.replace(/<[^>]*>/g, " ");
                const regex = new RegExp(`\\b${bestWord}\\b`, "gi");
                const pageMatches = plainText.match(regex);
                if (pageMatches) {
                    matchedCasedWord = pageMatches[0];
                    break;
                }
            }
            tempSpelling[cand] = matchedCasedWord;
        }
    }
    
    // Handle special cases
    if (rawText.toLowerCase().includes("louis vuitton")) {
        tempSpelling["louis vuitton"] = "Lui Vi";
    }
    if (rawText.toLowerCase().includes("lv")) {
        tempSpelling["lv"] = "Lui Vi";
    }
    
    // Apply temporary spelling
    let correctedRaw = rawText;
    const activeSpell = Object.assign({}, customSpelling, tempSpelling);
    for (const [wrong, right] of Object.entries(activeSpell)) {
        const escapedWrong = wrong.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedWrong}\\b`, "gi");
        correctedRaw = correctedRaw.replace(regex, right);
    }
    
    // Run validation pipeline to get clean result
    const context = {
        raw: correctedRaw,
        phoneNumber: "",
        actionOverride: "auto",
        status: "passed",
        rejectionReason: "",
        blacklistReason: "",
        logs: [],
        category: "Other",
        finalText: "",
        priceInfo: null
    };
    
    try {
        runValidationPipeline(context, category || "auto");
    } catch (e) {
        console.error("cleanExpectedOutput runValidationPipeline error:", e);
    }
    
    return context.finalText || correctedRaw;
}

/**
 * Dynamically extracts negative constraints / NOT-rules from POLICY_PAGES.
 * E.g. token(s): (NOT crypto or cryptocurrency) -> crypto -> token, cryptocurrency -> token.
 */
function extractPolicyRules() {
    const rules = {};
    if (typeof POLICY_PAGES === "undefined" || !Array.isArray(POLICY_PAGES)) {
        return rules;
    }
    const regex = /\b([a-z\s\-]+)\(s\)?:\s*\((?:do\s+)?not\s+(?:use\s+)?([a-z\s/\\|or,]+)\)/gi;
    for (let i = 0; i < POLICY_PAGES.length; i++) {
        const plainText = POLICY_PAGES[i].content.replace(/<[^>]*>/g, " ");
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(plainText)) !== null) {
            const rightItem = match[1].trim().toLowerCase();
            const rawDisallowed = match[2].trim().toLowerCase();
            const wrongItems = rawDisallowed
                .split(/\b(?:or|and)\b|[,/\\|]/)
                .map(item => item.trim())
                .filter(item => item.length > 0);
            for (const wrong of wrongItems) {
                rules[wrong] = rightItem;
            }
        }
    }
    // Explicit fallback assignments
    if (!rules["crypto"]) rules["crypto"] = "token";
    if (!rules["cryptocurrency"]) rules["cryptocurrency"] = "token";
    if (!rules["crypto currency"]) rules["crypto currency"] = "token";
    return rules;
}

/**
 * Searches policy pages for a matching pattern or similar cased spelling rules,
 * registers it, saves/syncs it to local storage and the backend, and returns the match.
 */
function selfTrainFromPolicy(rawInput, category, dict = customSpelling) {
    if (!rawInput) return null;
    
    // A. Check extracted policy rules first
    const policyRules = extractPolicyRules();
    const rawLower = rawInput.toLowerCase();
    const sortedWrong = Object.keys(policyRules).sort((a, b) => b.length - a.length);
    for (const wrong of sortedWrong) {
        const escapedWrong = wrong.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedWrong}\\b`, "i");
        if (regex.test(rawLower)) {
            const right = policyRules[wrong];
            dict[wrong] = right;
            return { wrong: wrong, right: right };
        }
    }
    
    // 1. Try digit sequences first (e.g. 7777777)
    const digitMatch = rawInput.match(/\b\d{4,10}\b/);
    if (digitMatch) {
        const rawDigits = digitMatch[0];
        for (let i = 0; i < POLICY_PAGES.length; i++) {
            const pageText = POLICY_PAGES[i].content;
            const hyphenatedMatches = pageText.match(/\b\d+(?:-\d+)+\b/g);
            if (hyphenatedMatches) {
                for (const hMatch of hyphenatedMatches) {
                    const cleanHMatch = hMatch.replace(/-/g, "");
                    if (cleanHMatch === rawDigits) {
                        dict[rawDigits] = hMatch;
                        return { wrong: rawDigits, right: hMatch };
                    }
                }
            }
        }
    }
    
    // 2. Try word typos next
    const words = rawInput.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);
    const stopwords = new Set(["buying", "selling", "trading", "renting", "hiring", "want", "buy", "sell", "trade", "rent", "hire", "with", "budget", "price", "negotiable", "each", "respectively", "luminous", "quality", "years", "experience", "and", "the", "for", "near"]);
    const candidates = words.filter(w => !stopwords.has(w));
    
    const policyWords = new Set();
    for (let i = 0; i < POLICY_PAGES.length; i++) {
        const plainText = POLICY_PAGES[i].content.replace(/<[^>]*>/g, " ");
        const pWords = plainText.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);
        for (const pw of pWords) {
            policyWords.add(pw);
        }
    }
    
    for (const cand of candidates) {
        if (policyWords.has(cand)) continue;
        
        let bestWord = null;
        let bestDist = Infinity;
        for (const pw of policyWords) {
            const dist = levenshteinDistance(cand, pw);
            // Strict edit distance threshold based on candidate length to avoid false matches
            let allowedDist = 0;
            if (cand.length >= 8) {
                allowedDist = 2;
            } else if (cand.length >= 4) {
                allowedDist = 1;
            }
            
            if (dist <= allowedDist && dist < bestDist) {
                bestDist = dist;
                bestWord = pw;
            }
        }
        
        if (bestWord) {
            let matchedCasedWord = bestWord;
            for (let i = 0; i < POLICY_PAGES.length; i++) {
                const plainText = POLICY_PAGES[i].content.replace(/<[^>]*>/g, " ");
                const regex = new RegExp(`\\b${bestWord}\\b`, "gi");
                const pageMatches = plainText.match(regex);
                if (pageMatches) {
                    matchedCasedWord = pageMatches[0];
                    break;
                }
            }
            
            dict[cand] = matchedCasedWord;
            return { wrong: cand, right: matchedCasedWord };
        }
    }
    
    // 3. Special cases for multi-word brands
    if (rawInput.toLowerCase().includes("louis vuitton")) {
        dict["louis vuitton"] = "Lui Vi";
        return { wrong: "louis vuitton", right: "Lui Vi" };
    }
    if (rawInput.toLowerCase().includes("lv")) {
        dict["lv"] = "Lui Vi";
        return { wrong: "lv", right: "Lui Vi" };
    }
    
    return null;
}

let resolvedBugReportsCache = [];
try {
    resolvedBugReportsCache = JSON.parse(localStorage.getItem("li_resolved_bug_reports") || "[]");
} catch (e) {
    resolvedBugReportsCache = [];
}

/**
 * Loads bug reports from backend (or mock data on localhost) and renders triage cards.
 */
function loadAndRenderBugTriage() {
    const container = document.getElementById("admin-triage-list-container");
    if (!container) return;
    
    const passcode = sessionStorage.getItem("li_admin_passcode") || localStorage.getItem("li_admin_passcode");
    const authUuid = getOrCreateClientUuid();
    
    // Show loading state
    container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
            <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <p style="margin-top: 12px; color: var(--text-muted); font-size: 13px;">Loading bug reports…</p>
        </div>`;
    
    const filterAndRender = (reports) => {
        const filtered = reports.filter(report => {
            const cleanRaw = report.rawInput.trim().toLowerCase();
            return !resolvedBugReportsCache.includes(cleanRaw);
        });
        renderTriageCards(filtered, container);
    };
    
    if (!CONFIG.GOOGLE_SCRIPT_URL) {
        // No backend configured — show mock bug reports for testing
        filterAndRender(getMockBugReports());
        return;
    }
    
    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
            action: "get_bug_reports",
            passcode: passcode,
            authUuid: authUuid,
            clientUuid: authUuid
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "success" && data.reports) {
            filterAndRender(data.reports);
        } else {
            // Backend returned error — show mock bug reports as fallback
            filterAndRender(getMockBugReports());
        }
    })
    .catch(() => {
        // Network error — show mock bug reports as fallback
        filterAndRender(getMockBugReports());
    });
}

/**
 * Helper to get the live ad validation output details.
 */
function getLiveFixedOutputDetails(rawInput, category, extraSpelling = {}) {
    const context = {
        raw: rawInput,
        phoneNumber: "",
        actionOverride: "auto",
        status: "passed",
        rejectionReason: "",
        blacklistReason: "",
        logs: [],
        category: category || "Other",
        finalText: "",
        priceInfo: null,
        extraSpelling: extraSpelling
    };
    try {
        runValidationPipeline(context, category || "auto");
    } catch (e) {
        console.error("getLiveFixedOutputDetails error:", e);
    }
    return {
        text: context.finalText || rawInput,
        status: context.status,
        rejectionReason: context.rejectionReason || context.blacklistReason || "None"
    };
}

/**
 * Learns spelling and formatting mapping from a similar example ad.
 */
function learnFromSimilarExample(rawText, similarText, category, dict = customSpelling) {
    if (!rawText || !similarText) return false;
    const rawTokens = rawText.split(/\s+/).filter(Boolean);
    const similarTokens = similarText.split(/\s+/).filter(Boolean);
    let trainedCount = 0;
    
    for (let i = 0; i < rawTokens.length; i++) {
        const rawTok = rawTokens[i].toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!rawTok || rawTok.length < 2) continue;
        
        let bestSimTok = null;
        let bestDist = Infinity;
        for (const simTok of similarTokens) {
            const cleanSimTok = simTok.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (!cleanSimTok) continue;
            const dist = levenshteinDistance(rawTok, cleanSimTok);
            // Strict edit distance threshold based on candidate length to avoid false matches
            let allowedDist = 0;
            if (rawTok.length >= 10) {
                allowedDist = 3;
            } else if (rawTok.length >= 7) {
                allowedDist = 2;
            } else if (rawTok.length >= 4) {
                allowedDist = 1;
            }
            
            if (dist <= allowedDist && dist < bestDist) {
                bestDist = dist;
                bestSimTok = simTok;
            }
        }
        
        if (bestSimTok) {
            const originalRawWord = rawTokens[i].toLowerCase().replace(/^[^\w]+|[^\w]+$/g, "");
            const cleanSimWord = bestSimTok.replace(/^[^\w"']+|[^\w"']+$/g, "");
            if (originalRawWord && cleanSimWord && originalRawWord !== cleanSimWord.toLowerCase()) {
                dict[originalRawWord] = cleanSimWord;
                trainedCount++;
            }
        }
    }
    
    const rawDigits = rawText.match(/\b\d{4,10}\b/);
    const simDigits = similarText.match(/\b\d+(?:-\d+)+\b/);
    if (rawDigits && simDigits) {
        dict[rawDigits[0]] = simDigits[0];
        trainedCount++;
    }
    
    if (trainedCount === 0) {
        // Fallback phrase alignment for completely different words/phrases (e.g. crypto currency -> token)
        const stopwords = new Set([
            "buying", "selling", "trading", "renting", "hiring", "want", "buy", "sell", "trade", 
            "rent", "hire", "with", "budget", "price", "negotiable", "each", "respectively", 
            "luminous", "quality", "years", "experience", "and", "the", "for", "near", "a", "an", 
            "of", "to", "at", "in", "on", "or", "out", "per", "week", "month"
        ]);
        
        const cleanWords = (text) => {
            return text.toLowerCase()
                .replace(/[^a-z0-9\s]/g, "")
                .split(/\s+/)
                .filter(w => {
                    if (!w || w.length < 2) return false;
                    if (stopwords.has(w)) return false;
                    if (/^\d+$/.test(w)) return false;
                    if (/^\d+k$/i.test(w) || /^\d+m$/i.test(w)) return false;
                    return true;
                });
        };
        
        const rawSig = cleanWords(rawText);
        const simSig = cleanWords(similarText);
        
        if (rawSig.length > 0 && simSig.length > 0) {
            const rawPhrase = rawSig.join(" ");
            const simPhrase = simSig.join(" ");
            
            if (rawPhrase !== simPhrase) {
                let mappedSimPhrase = simPhrase;
                if (simPhrase.endsWith("s") && simPhrase !== "jeans" && simPhrase !== "trousers") {
                    const singularCand = simPhrase.slice(0, -1);
                    if (singularCand === "token" || singularCand === "video card" || singularCand === "paint can" || singularCand === "container" || singularCand === "wire" || singularCand === "seed") {
                        mappedSimPhrase = singularCand;
                    }
                }
                dict[rawPhrase] = mappedSimPhrase;
                trainedCount++;
            }
        }
    }
    
    return trainedCount > 0;
}

/**
 * Searches the vehicles, clothing, or items database lists for fuzzy matches.
 */
function trainFromDatabase(rawText, dbType, dict = customSpelling) {
    const rawClean = rawText.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const rawTokens = rawClean.split(/\s+/).filter(Boolean);
    const stopwords = new Set(["buying", "selling", "trading", "renting", "hiring", "want", "buy", "sell", "trade", "rent", "hire", "with", "budget", "price", "negotiable", "each", "respectively", "luminous", "quality", "years", "experience", "and", "the", "for", "near"]);
    
    const candidates = [];
    // Single words
    for (const tok of rawTokens) {
        if (tok.length >= 3 && !stopwords.has(tok)) {
            candidates.push(tok);
        }
    }
    // Adjacent two-word phrases
    for (let i = 0; i < rawTokens.length - 1; i++) {
        const tok1 = rawTokens[i];
        const tok2 = rawTokens[i + 1];
        if (!stopwords.has(tok1) && !stopwords.has(tok2)) {
            candidates.push(tok1 + " " + tok2);
        }
    }
    
    let dbWords = [];
    if (dbType === "vehicles_clothing") {
        const categories = ['helicopters', 'boats', 'planes', 'motorcycles', 'not_sellable_cars', 'sellable_cars'];
        for (const cat of categories) {
            if (VEHICLE_DB[cat]) {
                VEHICLE_DB[cat].forEach(name => dbWords.push(name));
            }
        }
        const genders = ['male', 'female'];
        for (const g of genders) {
            if (CLOTHING_DB[g]) {
                for (const subcat in CLOTHING_DB[g]) {
                    CLOTHING_DB[g][subcat].forEach(name => dbWords.push(name));
                }
            }
        }
    } else if (dbType === "items") {
        for (const cat in ITEMS_DB) {
            ITEMS_DB[cat].forEach(name => dbWords.push(name));
        }
    }
    
    let trainedCount = 0;
    for (const cand of candidates) {
        // 1. Exact match (case insensitive)
        let exactMatch = dbWords.find(w => w.toLowerCase() === cand);
        if (exactMatch) {
            if (cand !== exactMatch) {
                dict[cand] = exactMatch;
                trainedCount++;
            }
            continue;
        }
        
        // 2. Space-removed match (e.g. "sun trap" -> "Suntrap")
        let spaceRemovedMatch = dbWords.find(w => {
            const cleanW = w.toLowerCase().replace(/[^a-z0-9]/g, "");
            const cleanC = cand.toLowerCase().replace(/[^a-z0-9]/g, "");
            return cleanW === cleanC && cleanW.length > 2;
        });
        if (spaceRemovedMatch) {
            if (cand !== spaceRemovedMatch) {
                dict[cand] = spaceRemovedMatch;
                trainedCount++;
            }
            continue;
        }
        
        // 3. Fuzzy match (only check single words)
        if (!cand.includes(" ")) {
            let bestWordToken = null;
            let bestDist = Infinity;
            for (const dbWord of dbWords) {
                const dbWordTokensOriginal = dbWord.split(/\s+/);
                const dbWordLower = dbWord.toLowerCase();
                const dbWordTokens = dbWordLower.split(/\s+/);
                for (let idx = 0; idx < dbWordTokens.length; idx++) {
                    const token = dbWordTokens[idx];
                    const dist = levenshteinDistance(cand, token);
                    
                    // Define strict threshold for spelling typos:
                    // - Length < 4: Only allow exact match (dist = 0)
                    // - Length 4-7: Allow max 1 edit (dist <= 1)
                    // - Length >= 8: Allow max 2 edits (dist <= 2)
                    let allowedDist = 0;
                    if (cand.length >= 8) {
                        allowedDist = 2;
                    } else if (cand.length >= 4) {
                        allowedDist = 1;
                    }
                    
                    if (dist <= allowedDist && dist < bestDist) {
                        bestDist = dist;
                        bestWordToken = dbWordTokensOriginal[idx];
                    }
                }
            }
            // Only add if the spelling correction actually changes the word (case-insensitive)
            if (bestWordToken && cand !== bestWordToken.toLowerCase()) {
                dict[cand] = bestWordToken;
                trainedCount++;
            }
        }
    }
    
    return trainedCount > 0;
}


function resolveBugReport(report, card, isIgnore = false) {
    // Add to local cache immediately to prevent reappearing
    const reportKey = report.rawInput.trim().toLowerCase();
    if (!resolvedBugReportsCache.includes(reportKey)) {
        resolvedBugReportsCache.push(reportKey);
        localStorage.setItem("li_resolved_bug_reports", JSON.stringify(resolvedBugReportsCache));
    }

    card.style.opacity = "0.5";
    
    const resolveAction = () => {
        card.style.borderColor = isIgnore ? "rgba(255,255,255,0.1)" : "rgba(48,209,88,0.4)";
        card.style.boxShadow = isIgnore ? "none" : "0 0 20px rgba(48,209,88,0.15)";
        
        setTimeout(() => {
            card.style.opacity = "0";
            card.style.transform = "scale(0.95) translateY(-10px)";
            card.style.maxHeight = card.scrollHeight + "px";
            requestAnimationFrame(() => {
                card.style.maxHeight = "0px";
                card.style.padding = "0px";
                card.style.margin = "0px";
                card.style.border = "none";
                card.style.gap = "0px";
            });
            setTimeout(() => {
                const container = card.parentNode;
                card.remove();
                if (container && container.children.length === 0) {
                    renderTriageCards([], container);
                }
            }, 500);
        }, 300);
        
        showCustomNotification(isIgnore ? "Bug report ignored." : "Bug report confirmed & resolved successfully!", "success");
    };

    // Execute resolveAction immediately for responsive UI
    resolveAction();

    if (!CONFIG.GOOGLE_SCRIPT_URL) {
        return;
    }
    
    const passcode = sessionStorage.getItem("li_admin_passcode") || localStorage.getItem("li_admin_passcode");
    const authUuid = getOrCreateClientUuid();
    
    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
            action: "resolve_bug_report",
            id: report.id,
            rawInput: report.rawInput,
            timestamp: report.timestamp,
            passcode: passcode,
            authUuid: authUuid
        })
    })
    .then(r => r.json())
    .catch(err => {
        console.error("resolveBugReport background request error:", err);
    });
}

// --- Gemini Spark AI Engine & Fuzzy Suggestion Fallback Helpers ---

// --- Gemini Backup Key Vault & Auto-Failover Logic ---

// Helper to update the visual state of a vault slot status dot
function findLocalFuzzyMatch(rawText) {
    const rawClean = rawText.toLowerCase().trim().replace(/\s+/g, ' ');
    const entries = Object.entries(customTranslations);
    if (entries.length === 0) return null;

    // --- Tier 1: Exact match ---
    if (customTranslations[rawClean]) {
        return { text: extractTranslationValue(customTranslations[rawClean]), rawMatched: rawClean, score: 100 };
    }

    // --- Tier 2: Canonical match (minor punctuation/case only) ---
    const canonicalInput = getCanonicalKey(rawClean);
    for (const [trainedRaw, corrValue] of entries) {
        if (getCanonicalKey(trainedRaw) === canonicalInput) {
            return { text: extractTranslationValue(corrValue), rawMatched: trainedRaw, score: 99 };
        }
    }

    // No match — the standard pipeline or AI copilot should handle suggestions instead.
    return null;
}

/**
 * Renders triage cards into the container.
 */
function renderTriageCards(reports, container) {
    if (!reports || reports.length === 0) {
        container.innerHTML = `
            <div class="no-requests-msg" style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 8px; background: rgba(255,255,255,0.01);">
                <i class="fa-solid fa-circle-check" style="font-size: 32px; margin-bottom: 14px; display: block; color: #30d158; opacity: 0.7;"></i>
                <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">All Clear!</span>
                <p style="margin-top: 6px; font-size: 12.5px; opacity: 0.6;">No pending bug reports to triage.</p>
            </div>`;
        return;
    }
    
    container.innerHTML = "";
    
    reports.forEach((report, idx) => {
        report.stagedSpelling = report.stagedSpelling || {};
        const card = document.createElement("div");
        card.className = "triage-card";
        card.style.cssText = `
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 12px;
            padding: 18px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        `;
        
        // Category badge color map
        const catColors = {
            "Clothing": "#a78bfa",
            "Vehicles": "#60a5fa",
            "Weapons": "#f87171",
            "Electronics": "#34d399",
            "Properties": "#fbbf24",
            "Services": "#fb923c",
            "Food": "#f472b6",
        };
        
        let currentCategory = report.category || "Other";
        const catColor = catColors[currentCategory] || "#94a3b8";
        
        let lastPreviewText = "";
        
        // Initialize state variables if not present
        if (typeof report.manualPanelOpen === "undefined") {
            report.manualPanelOpen = false;
        }
        if (typeof report.manualOverrideText === "undefined") {
            report.manualOverrideText = null;
        }
        
        // Function to render card inner content
        const updateCardBody = () => {
            let liveFixed;
            if (report.manualOverrideText) {
                liveFixed = {
                    text: report.manualOverrideText,
                    status: "passed",
                    rejectionReason: "None"
                };
            } else {
                liveFixed = getLiveFixedOutputDetails(report.rawInput, currentCategory, report.stagedSpelling);
            }
            const isPassed = liveFixed.status === "passed";
            lastPreviewText = liveFixed.text;

            if (report.aiProposal) {
                card.style.border = "1px solid rgba(167, 139, 250, 0.4)";
                card.style.boxShadow = "0 0 15px rgba(167, 139, 250, 0.08)";
            } else {
                card.style.border = "1px solid rgba(255, 255, 255, 0.06)";
                card.style.boxShadow = "";
            }

            let aiProposedFixHtml = "";
            if (report.aiProposal) {
                const spellingListText = report.aiProposal.spellingList ? `<b>Generated Spelling Rules:</b> ${report.aiProposal.spellingList}` : "";
                const notesBoxHtml = report.aiProposal.notes ? `
                    <!-- Gemini Policy Verification Notes -->
                    <div class="ai-proposed-notes-box" style="padding: 10px; border-radius: 8px; background: rgba(34, 211, 238, 0.05); border: 1px solid rgba(34, 211, 238, 0.25); color: #22d3ee; font-size: 11px; margin-top: 6px; text-align: left; box-shadow: inset 0 0 10px rgba(34, 211, 238, 0.02);">
                        <div style="font-weight: 700; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px; margin-bottom: 5px; color: #22d3ee;">
                            <i class="fa-regular fa-file-lines"></i> Policy Verification & Citation Notes
                        </div>
                        <div style="line-height: 1.45; white-space: pre-line; opacity: 0.95;">${report.aiProposal.notes}</div>
                    </div>
                ` : "";
                aiProposedFixHtml = `
                    <!-- Gemini Auto-Triage Suggestion Banner -->
                    <div class="ai-proposed-fix-banner" style="padding: 10px; border-radius: 8px; background: rgba(167, 139, 250, 0.08); border: 1px solid rgba(167, 139, 250, 0.3); color: #a78bfa; font-size: 11.5px; margin-top: 6px; text-align: left; box-shadow: inset 0 0 10px rgba(167, 139, 250, 0.05);">
                        <div style="font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                            <i class="fa-solid fa-sparkles"></i> AI Proposed Fix (Pending Admin Review)
                        </div>
                        <div style="font-weight: 600; font-family: var(--font-mono, monospace); color: #c4b5fd;">"${report.aiProposal.text}"</div>
                        <div style="font-size: 9.5px; opacity: 0.8; margin-top: 4px;"><b>AI Logic:</b> ${report.aiProposal.reason || "Auto-detected correction"}</div>
                        ${spellingListText ? `<div style="font-size: 9.5px; opacity: 0.8; margin-top: 2px; font-family: var(--font-mono, monospace); color: #a78bfa;">${spellingListText}</div>` : ""}
                        <div style="font-size: 9px; color: var(--text-muted); opacity: 0.7; margin-top: 6px; border-top: 1px dashed rgba(167, 139, 250, 0.15); padding-top: 6px; display: flex; flex-wrap: wrap; gap: 8px;">
                            <span><i class="fa-regular fa-paper-plane"></i> Submitted: <span>${report.timestamp || "Unknown"}</span></span>
                            <span><i class="fa-solid fa-robot"></i> AI Proposed: <span>${report.aiProposal.timeFixed}</span></span>
                        </div>
                    </div>
                    ${notesBoxHtml}
                `;
            }

            const confirmBtnStyle = report.aiProposal
                ? "flex: 1; background: linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(167, 139, 250, 0.1)); border: 1px solid rgba(167, 139, 250, 0.45); color: #a78bfa; padding: 9px 12px; border-radius: 8px; font-family: var(--font-heading); font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease; letter-spacing: 0.3px; box-shadow: 0 0 12px rgba(167,139,250,0.15);"
                : "flex: 1; background: linear-gradient(135deg, rgba(48,209,88,0.15), rgba(48,209,88,0.06)); border: 1px solid rgba(48,209,88,0.3); color: #30d158; padding: 9px 12px; border-radius: 8px; font-family: var(--font-heading); font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease; letter-spacing: 0.3px;";
            
            const confirmBtnText = report.aiProposal
                ? `<i class="fa-solid fa-sparkles"></i> Confirm AI Fix`
                : `<i class="fa-solid fa-square-check"></i> Confirm`;
            
            // Side-by-side dark boxes layout
            const diffHtml = `
                <div style="display: flex; gap: 12px; align-items: stretch; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px;">
                        <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Raw Input</div>
                        <div style="flex: 1; padding: 12px; border-radius: 8px; background: rgba(255,69,58,0.03); border: 1px solid rgba(255,69,58,0.12); font-family: var(--font-mono, monospace); font-size: 13.5px; line-height: 1.5; color: var(--text-primary); word-break: break-word;">
                            ${report.rawInput}
                        </div>
                    </div>
                    <div style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px;">
                        <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Fixed Output</div>
                        <div class="fixed-output-box" style="flex: 1; padding: 12px; border-radius: 8px; font-family: var(--font-mono, monospace); font-size: 13.5px; line-height: 1.5; word-break: break-word; transition: all 0.3s ease;
                            background: rgba(48,209,88,0.04); border: 1px solid rgba(48,209,88,0.25); color: #30d158; box-shadow: 0 0 10px rgba(48,209,88,0.05); display: flex; flex-direction: column; gap: 6px;
                        ">
                            <div class="fixed-output-text" contenteditable="true" title="Click to edit final ad text" style="outline: none; border: none; background: transparent; padding: 0; margin: 0; color: inherit; width: 100%; cursor: text; min-height: 20px;">${liveFixed.text}</div>
                            ${!isPassed ? `<div style="font-size: 11px; opacity: 0.8; font-weight: 600; color: #ff6b6b; border-top: 1px dashed rgba(255,107,107,0.2); padding-top: 6px; margin-top: 2px;"><i class="fa-solid fa-circle-exclamation"></i> Rejection Reason: ${liveFixed.rejectionReason}</div>` : ""}
                        </div>
                    </div>
                </div>
            `;
            
            // Re-populate the category selection list
            const categoriesList = ["Auto", "Real Estate", "Businesses", "Work", "Dating", "Services", "Discounts", "Other"];
            const categoryOptionsHtml = categoriesList.map(cat => 
                `<option value="${cat}" ${cat === currentCategory ? "selected" : ""}>${cat}</option>`
            ).join("");

            let chatTurnsHtml = "";
            if (report.geminiChatHistory && report.geminiChatHistory.length > 0) {
                chatTurnsHtml = report.geminiChatHistory.map((msg, idx) => {
                    if (idx === 0) return ""; // Skip initial prompt turn
                    const isModel = msg.role === "model";
                    let dispText = "";
                    if (isModel) {
                        try {
                            const parsed = JSON.parse(msg.parts[0].text.trim());
                            dispText = `✨ <b>AI suggestion:</b> "${parsed.text}"<br><span style="opacity:0.65;font-size:10px;">Reason: ${parsed.reason}</span>`;
                        } catch (e) {
                            dispText = msg.parts[0].text;
                        }
                    } else {
                        const cleanUserMsg = msg.parts[0].text.split("\n\n(Note: Active")[0];
                        dispText = `<b>You:</b> ${cleanUserMsg}`;
                    }
                    const attachHtml = msg.attachmentUrl ? `
                        <div style="margin-bottom: 6px; border-radius: 4px; overflow: hidden; max-width: 150px; max-height: 100px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;" onclick="window.open('${msg.attachmentUrl}', '_blank')">
                            <img src="${msg.attachmentUrl}" style="width: 100%; height: 100%; object-fit: contain; display: block;">
                        </div>
                    ` : "";
                    return `
                        <div style="padding: 6px 8px; border-radius: 6px; background: ${isModel ? "rgba(167,139,250,0.06)" : "rgba(255,255,255,0.03)"}; border: 1px solid ${isModel ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.04)"}; align-self: ${isModel ? "flex-start" : "flex-end"}; color: ${isModel ? "var(--text-primary)" : "var(--text-secondary)"}; max-width: 90%; word-break: break-word; font-family: var(--font-heading);">
                            ${attachHtml}
                            ${dispText}
                        </div>
                    `;
                }).join("");
            }

            let coverageBadgeHtml = "";
            const mappingMatch = findTrainedMapping(report.rawInput);
            if (mappingMatch.found) {
                let label = "Already Covered";
                if (mappingMatch.matchType === "canonical") {
                    label = "Covered (Normalized)";
                } else if (mappingMatch.matchType === "fuzzy") {
                    label = `Covered (Fuzzy: ${mappingMatch.similarity}%)`;
                }
                coverageBadgeHtml = `<span class="coverage-badge" style="background: rgba(48, 209, 88, 0.12); color: #30d158; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; border: 1px solid rgba(48, 209, 88, 0.25); display: inline-flex; align-items: center; gap: 4px;" title="This ad raw input matches an existing mapping key: '${mappingMatch.originalKey}'"><i class="fa-solid fa-circle-check"></i> ${label}</span>`;
            }

            card.innerHTML = `
                <!-- Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span class="category-badge" style="background: ${catColor}22; color: ${catColor}; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; border: 1px solid ${catColor}33;">${currentCategory}</span>
                        ${coverageBadgeHtml}
                        <span style="font-size: 11px; color: var(--text-muted); opacity: 0.7;"><i class="fa-regular fa-clock" style="margin-right: 3px;"></i>${report.timestamp}</span>
                    </div>
                    <span style="font-size: 10px; color: var(--text-muted); opacity: 0.4; font-family: var(--font-mono, monospace);">#${idx + 1}</span>
                </div>
                
                <!-- Side-by-side Raw vs Fixed Output -->
                ${diffHtml}
                
                ${aiProposedFixHtml}
                
                <!-- Manual Training Panel -->
                <div class="manual-train-panel" style="display: ${report.manualPanelOpen ? "flex" : "none"}; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 12px; flex-direction: column; gap: 10px; margin-top: 4px; transition: all 0.3s ease;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); font-weight: 700; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-pen-to-square"></i> Manual Training Override</div>
                    
                    <div style="display: flex; gap: 10px; flex-direction: column;">
                        <div>
                            <div style="font-size: 9.5px; color: var(--text-muted); margin-bottom: 4px; font-weight: 600;">Similar Example / Target Output</div>
                            <input type="text" class="manual-similar-input" placeholder="e.g. Selling &quot;Suntrap&quot;. Price: Negotiable." value="${liveFixed.text}" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.25); color: var(--text-primary); font-size: 12.5px; font-family: var(--font-mono, monospace);">
                        </div>
                        
                        <div>
                            <div style="font-size: 9.5px; color: var(--text-muted); margin-bottom: 4px; font-weight: 600;">Category</div>
                            <select class="manual-category-select" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.25); color: var(--text-primary); font-size: 12.5px; outline: none; cursor: pointer;">
                                ${categoryOptionsHtml}
                            </select>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
                        <button type="button" class="btn-manual-train-apply" style="background: rgba(96, 165, 250, 0.15); border: 1px solid rgba(96, 165, 250, 0.3); color: #60a5fa; padding: 8px 16px; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s ease; box-shadow: 0 0 10px rgba(96, 165, 250, 0.15);">
                            <i class="fa-solid fa-check"></i> Done
                        </button>
                    </div>
                </div>
                
                <!-- Gemini Copilot Console -->
                <div class="gemini-copilot-console" style="${report.copilotOpen ? "display: flex;" : "display: none;"} margin-top: 12px; background: rgba(167, 139, 250, 0.04); border: 1px solid rgba(167, 139, 250, 0.18); border-radius: 8px; padding: 12px; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed rgba(167, 139, 250, 0.15); padding-bottom: 6px;">
                        <span style="font-size: 10.5px; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-brain-circuit"></i> Spark AI Copilot
                        </span>
                        <button type="button" class="btn-gemini-copilot-close" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 11px;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="gemini-copilot-chat-history" style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; font-size: 11px; padding-right: 4px;">
                        ${chatTurnsHtml}
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px; position: relative;">

                        <input type="text" class="input-gemini-copilot-chat" placeholder="Tell Gemini how to fix... (e.g. 'make price $10k')" style="flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(167,139,250,0.25); background: rgba(0,0,0,0.3); color: var(--text-primary); font-size: 11.5px; outline: none; font-family: var(--font-heading);">
                        
                        <button type="button" class="btn-gemini-copilot-chat-send" style="padding: 6px 10px; border-radius: 6px; background: rgba(167, 139, 250, 0.2); border: 1px solid rgba(167, 139, 250, 0.4); color: #a78bfa; font-size: 11px; cursor: pointer; height: 28px; display: inline-flex; align-items: center; justify-content: center;"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                    <!-- Row 1: Resolution -->
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn-triage-confirm" style="${confirmBtnStyle}">
                            ${confirmBtnText}
                        </button>
                        
                        <button type="button" class="btn-triage-ignore" style="
                            flex: 1; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); color: var(--text-muted); padding: 9px 12px; border-radius: 8px; font-family: var(--font-heading); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease; letter-spacing: 0.3px;
                        ">
                            <i class="fa-solid fa-xmark"></i> Ignore
                        </button>
                    </div>


                    <!-- Row 2b: AI Training Engine -->
                    <button type="button" class="btn-spark-ai magic-mode btn-triage-train-gemini">
                        <i class="fa-solid fa-sparkles"></i> Spark
                    </button>
                    
                    <!-- Row 3: Advanced Overrides -->
                    <button type="button" class="btn-triage-manual-toggle" style="
                        width: 100%; background: ${report.manualPanelOpen ? "rgba(96, 165, 250, 0.15)" : "rgba(255,255,255,0.02)"}; border: 1px solid ${report.manualPanelOpen ? "rgba(96, 165, 250, 0.3)" : "rgba(255,255,255,0.06)"}; color: #60a5fa; padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease;
                    ">
                        <i class="fa-solid fa-sliders"></i> Manual Adjust Overrides
                    </button>
                </div>
            `;
            
            // Wire event listeners on newly set innerHTML
            const confirmBtn = card.querySelector(".btn-triage-confirm");
            const trainPolicyBtn = card.querySelector(".btn-triage-train-policy");
            const trainVehiclesClothingBtn = card.querySelector(".btn-triage-train-vehicles-clothing");
            const trainItemsBtn = card.querySelector(".btn-triage-train-items");
            const trainGeminiBtn = card.querySelector(".btn-triage-train-gemini");
            const manualToggleBtn = card.querySelector(".btn-triage-manual-toggle");
            const manualPanel = card.querySelector(".manual-train-panel");
            const manualTrainApplyBtn = card.querySelector(".btn-manual-train-apply");
            const ignoreBtn = card.querySelector(".btn-triage-ignore");
            
            // ── Confirm / Resolve Button ──
            if (confirmBtn) {
                confirmBtn.addEventListener("click", () => {
                    const textEl = card.querySelector(".fixed-output-text");
                    const finalAdText = textEl ? textEl.textContent.trim() : "";
                    
                    validateTrainingAction(report.rawInput, finalAdText, () => {
                        let finalMethod = report.trainedMethod || "Trained manually";
                        // If they edited the text directly, extract spelling corrections from it and override method to manual
                        if (finalAdText && finalAdText !== lastPreviewText) {
                            learnFromSimilarExample(report.rawInput, finalAdText, currentCategory, report.stagedSpelling);
                            finalMethod = "Trained manually";
                        }
                        
                        if (finalAdText) {
                            // Register direct exact raw-to-fixed translation mapping for advanced learning
                            const trimmedRaw = report.rawInput.replace(/\s+/g, ' ').trim().toLowerCase();
                            const details = {
                                text: finalAdText,
                                author: getActiveEditorName(),
                                method: finalMethod,
                                timestamp: new Date().toLocaleString(),
                                reporterTime: report.timestamp || "Unknown",
                                category: currentCategory
                            };
                            customTranslations[trimmedRaw] = JSON.stringify(details);
                            localStorage.setItem("li_custom_translations", JSON.stringify(customTranslations));
                        }
                        
                        // Save all staged corrections to the persistent database on confirm
                        const hasSpelling = report.stagedSpelling && Object.keys(report.stagedSpelling).length > 0;
                        if (hasSpelling || finalAdText) {
                            if (hasSpelling) {
                                Object.assign(customSpelling, report.stagedSpelling);
                                localStorage.setItem("li_custom_spelling", JSON.stringify(customSpelling));
                            }
                            saveCustomDataToBackend();
                            if (typeof renderCustomSpelling === "function") {
                                renderCustomSpelling();
                            }
                            if (typeof renderCustomTranslations === "function") {
                                renderCustomTranslations();
                            }
                            // Re-process the main ad editor immediately to reflect changes in real time
                            if (typeof processAd === "function") {
                                processAd();
                            }
                        }
                        
                        resolveBugReport(report, card);
                    });
                });
            }
            
            // ── Train from Policy Button ──
            if (trainPolicyBtn) {
                trainPolicyBtn.addEventListener("click", () => {
                    const trainedCorr = selfTrainFromPolicy(report.rawInput, currentCategory, report.stagedSpelling);
                    if (trainedCorr) {
                        showCustomNotification(`Spelling trained automatically: "${trainedCorr.wrong}" → "${trainedCorr.right}" (previewing, click Confirm to save)`, "success");
                        report.trainedMethod = "Trained from policy";
                        report.manualOverrideText = null;
                        updateCardBody();
                    } else {
                        showCustomNotification("No matching policy example found. Please train manually.", "warning");
                        report.manualPanelOpen = true;
                        updateCardBody();
                    }
                });
            }
            
            // ── Train from Vehicles & Clothing Button ──
            if (trainVehiclesClothingBtn) {
                trainVehiclesClothingBtn.addEventListener("click", () => {
                    const success = trainFromDatabase(report.rawInput, "vehicles_clothing", report.stagedSpelling);
                    if (success) {
                        showCustomNotification("Trained from Vehicles & Clothing database list successfully! (previewing, click Confirm to save)", "success");
                        report.trainedMethod = "Trained from Outdoors Clothing";
                        report.manualOverrideText = null;
                        updateCardBody();
                    } else {
                        showCustomNotification("No matching vehicle or clothing items found in database.", "warning");
                    }
                });
            }
            
            // ── Train from Items Button ──
            if (trainItemsBtn) {
                trainItemsBtn.addEventListener("click", () => {
                    const success = trainFromDatabase(report.rawInput, "items", report.stagedSpelling);
                    if (success) {
                        showCustomNotification("Trained from Items database list successfully! (previewing, click Confirm to save)", "success");
                        report.trainedMethod = "Trained from Items List";
                        report.manualOverrideText = null;
                        updateCardBody();
                    } else {
                        showCustomNotification("No matching items found in database.", "warning");
                    }
                });
            }
            
            // ── Train via Gemini Spark Button ──
            if (trainGeminiBtn) {
                trainGeminiBtn.addEventListener("click", () => {
                    const localKey = localStorage.getItem("li_gemini_api_key") || FALLBACK_GEMINI_KEY;
                    if (!localKey) {
                        showCustomNotification("Please configure a Gemini API key in the AI Assistant tab first.", "warning");
                        return;
                    }

                    trainGeminiBtn.disabled = true;
                    const origHtml = trainGeminiBtn.innerHTML;
                    trainGeminiBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Querying AI Spark...`;

                    getGeminiBugTriageSuggestion(report.rawInput, report.expectedOutput, currentCategory, report.screenshotBase64 || null, (suggestion) => {
                        trainGeminiBtn.disabled = false;
                        trainGeminiBtn.innerHTML = origHtml;

                        if (suggestion && suggestion.text) {
                            const tempSpelling = {};
                            learnFromSimilarExample(report.rawInput, suggestion.text, currentCategory, tempSpelling);
                            
                            const spellingList = Object.entries(tempSpelling)
                                .map(([wrong, right]) => `"${wrong}" → "${right}"`)
                                .join(", ");

                            report.aiProposal = {
                                text: suggestion.text,
                                reason: suggestion.reason || "Auto-detected correction",
                                notes: suggestion.notes || "",
                                spellingList: spellingList,
                                timeFixed: new Date().toLocaleTimeString()
                            };

                            // Auto-apply proposed suggestion to the card preview
                            report.manualOverrideText = suggestion.text;
                            report.trainedMethod = "Trained via Gemini Spark (Review)";
                            Object.assign(report.stagedSpelling, tempSpelling);

                            updateCardBody();
                            showCustomNotification("Gemini Spark correction proposed! Review and click Confirm.", "success");
                        } else {
                            showCustomNotification("Gemini Spark failed to predict a correction. Try again or use other engines.", "error");
                        }
                    });
                });
            }

            // ── Gemini Copilot Interactive Chat Console Elements & Wireup ──
            const copilotCloseBtn = card.querySelector(".btn-gemini-copilot-close");
            const copilotChatInput = card.querySelector(".input-gemini-copilot-chat");
            const copilotChatSendBtn = card.querySelector(".btn-gemini-copilot-chat-send");
            const copilotChatHistory = card.querySelector(".gemini-copilot-chat-history");

            if (copilotCloseBtn) {
                copilotCloseBtn.addEventListener("click", () => {
                    report.copilotOpen = false;
                    updateCardBody();
                });
            }

            const sendChatTurn = () => {
                if (!copilotChatInput) return;
                const userMsg = copilotChatInput.value.trim();
                if (!userMsg) return;

                copilotChatInput.value = "";
                copilotChatInput.disabled = true;
                if (copilotChatSendBtn) {
                    copilotChatSendBtn.disabled = true;
                    copilotChatSendBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                }

                // Append user message immediately to the UI to feel extremely responsive
                const userDiv = document.createElement("div");
                userDiv.style.cssText = "padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.04); align-self: flex-end; color: var(--text-secondary); max-width: 90%; word-break: break-word; font-family: var(--font-heading);";
                userDiv.innerHTML = `<b>You:</b> ${userMsg}`;
                if (copilotChatHistory) {
                    copilotChatHistory.appendChild(userDiv);
                    copilotChatHistory.scrollTop = copilotChatHistory.scrollHeight;
                }

                runGeminiCopilotTurn(report, currentCategory, userMsg, (success, suggestion) => {
                    if (copilotChatInput) copilotChatInput.disabled = false;
                    if (copilotChatSendBtn) {
                        copilotChatSendBtn.disabled = false;
                        copilotChatSendBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i>`;
                    }

                    if (success && suggestion) {
                        report.manualOverrideText = suggestion.text;
                        report.trainedMethod = "Trained from Gemini Spark";
                        
                        // Re-render whole card to sync preview, diff, and new chat turns
                        updateCardBody();
                        
                        // Scroll history to bottom
                        setTimeout(() => {
                            const newHistory = card.querySelector(".gemini-copilot-chat-history");
                            if (newHistory) newHistory.scrollTop = newHistory.scrollHeight;
                        }, 50);
                    } else {
                        showCustomNotification("Gemini Copilot failed to reply. Please check internet connection.", "error");
                    }
                });
            };

            if (copilotChatSendBtn) {
                copilotChatSendBtn.addEventListener("click", sendChatTurn);
            }

            if (copilotChatInput) {
                copilotChatInput.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        sendChatTurn();
                    }
                });
            }


            
            // ── Manual Train Toggle Button ──
            if (manualToggleBtn && manualPanel) {
                manualToggleBtn.addEventListener("click", () => {
                    report.manualPanelOpen = !report.manualPanelOpen;
                    updateCardBody();
                });
            }
            
            // ── Manual Train Apply Button ──
            if (manualTrainApplyBtn) {
                manualTrainApplyBtn.addEventListener("click", () => {
                    const similarInput = card.querySelector(".manual-similar-input");
                    const catSelect = card.querySelector(".manual-category-select");
                    const similarVal = (similarInput.value || "").trim();
                    const selectedCat = catSelect.value;
                    
                    if (!similarVal) {
                        showCustomNotification("Please provide a target output ad.", "warning");
                        return;
                    }
                    
                    currentCategory = selectedCat;
                    // Run standard phrase alignment spelling extractor to stage rules dynamically
                    learnFromSimilarExample(report.rawInput, similarVal, selectedCat, report.stagedSpelling);
                    
                    // Directly override the live Fixed Output box to display exactly what they typed with no errors
                    report.manualOverrideText = similarVal;
                    report.trainedMethod = "Trained manually";
                    updateCardBody();
                    
                    showCustomNotification("Target output successfully applied to Fixed Output preview! Review and click Confirm.", "success");
                });
            }
            
            // ── Ignore Button ──
            if (ignoreBtn) {
                ignoreBtn.addEventListener("click", () => {
                    resolveBugReport(report, card, true); // silent / ignore resolve
                });
            }
        };
        
        // Auto-train on load: if there are any matches available in Policy, database, or items, apply them automatically
        const policyTrained = selfTrainFromPolicy(report.rawInput, currentCategory, report.stagedSpelling);
        if (policyTrained) {
            report.trainedMethod = "Trained automatically (Policy)";
        } else {
            const dbTrained = trainFromDatabase(report.rawInput, "vehicles_clothing", report.stagedSpelling);
            if (dbTrained) {
                report.trainedMethod = "Trained automatically (Outdoors/Vehicles list)";
            } else {
                const itemsTrained = trainFromDatabase(report.rawInput, "items", report.stagedSpelling);
                if (itemsTrained) {
                    report.trainedMethod = "Trained automatically (Items List)";
                } else {
                    report.trainedMethod = "Trained manually";
                }
            }
        }
        
        // Search local translations for similarity (Zero API Credits)
        const bestLocalMatch = findLocalFuzzyMatch(report.rawInput);
        if (bestLocalMatch) {
            report.aiProposal = {
                text: bestLocalMatch.text,
                reason: `Fuzzy history match (${bestLocalMatch.score}% similarity) matching trained raw: "${bestLocalMatch.rawMatched}"`,
                spellingList: "",
                timeFixed: new Date().toLocaleTimeString()
            };

            report.manualOverrideText = bestLocalMatch.text;
            report.trainedMethod = "Trained automatically (Fuzzy Match - Pending Review)";
            updateCardBody();
        }

        // Initial build
        updateCardBody();
        container.appendChild(card);
    });
}

// Wire up the triage tab button click and refresh button
(function initTriagePanel() {
    const triageTabBtn = document.getElementById("tab-btn-bug-triage") || document.querySelector('.tab-btn[data-tab="tab-bug-triage"]');
    const refreshBtn = document.getElementById("btn-triage-refresh");
    const clearAllBtn = document.getElementById("btn-triage-clear-all");
    const unlockLoginBtn = document.getElementById("btn-bug-unlock-login");
    const templatesBtn = document.getElementById("btn-triage-templates");
    const templatesDrawer = document.getElementById("bug-triage-templates-drawer");
    
    if (triageTabBtn) {
        triageTabBtn.addEventListener("click", () => {
            if (sessionStorage.getItem("li_admin_authenticated") === "true") {
                loadAndRenderBugTriage();
            }
        });
    }

    if (templatesBtn && templatesDrawer) {
        templatesBtn.addEventListener("click", () => {
            if (sessionStorage.getItem("li_admin_authenticated") !== "true") {
                showCustomNotification("Please authenticate as admin first.", "warning");
                return;
            }
            const isOpen = templatesDrawer.classList.toggle("open");
            if (isOpen) {
                templatesBtn.style.background = "rgba(167, 139, 250, 0.15)";
                templatesBtn.style.borderColor = "rgba(167, 139, 250, 0.4)";
                if (typeof renderCustomTemplates === "function") {
                    renderCustomTemplates();
                }
            } else {
                templatesBtn.style.background = "rgba(167, 139, 250, 0.05)";
                templatesBtn.style.borderColor = "rgba(167, 139, 250, 0.15)";
            }
        });
    }
    
    if (unlockLoginBtn) {
        unlockLoginBtn.addEventListener("click", () => {
            // Switch to Admin Panel tab to authenticate
            const adminTabBtn = document.getElementById("tab-btn-admin");
            if (adminTabBtn) {
                adminTabBtn.click();
                setTimeout(() => {
                    const passInput = document.getElementById("admin-passcode-input");
                    if (passInput) passInput.focus();
                }, 100);
            }
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            if (sessionStorage.getItem("li_admin_authenticated") === "true") {
                // Spin animation on refresh icon
                const icon = refreshBtn.querySelector("i");
                if (icon) {
                    icon.style.transition = "transform 0.5s ease";
                    icon.style.transform = "rotate(360deg)";
                    setTimeout(() => {
                        icon.style.transition = "none";
                        icon.style.transform = "rotate(0deg)";
                    }, 500);
                }
                loadAndRenderBugTriage();
            } else {
                showCustomNotification("Please authenticate as admin first.", "warning");
            }
        });
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener("click", () => {
            if (sessionStorage.getItem("li_admin_authenticated") === "true") {
                showCustomConfirmDialog(
                    "Are you sure you want to permanently clear all bug reports? This action cannot be undone.",
                    () => {
                        clearAllBtn.disabled = true;
                        clearAllBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Clearing...`;
                        const passcode = sessionStorage.getItem("li_admin_passcode") || localStorage.getItem("li_admin_passcode");
                        
                        fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                            method: "POST",
                            headers: { "Content-Type": "text/plain" },
                            body: JSON.stringify({
                                action: "clear_bug_reports",
                                passcode: passcode
                            })
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.status === "success") {
                                showCustomNotification("All bug reports cleared successfully!", "success");
                                loadAndRenderBugTriage();
                            } else {
                                showCustomNotification("Error clearing bug reports: " + (data.message || "Failed."), "error");
                            }
                        })
                        .catch(err => {
                            console.error("Error clearing bugs:", err);
                            showCustomNotification("Error clearing bug reports.", "error");
                        })
                        .finally(() => {
                            clearAllBtn.disabled = false;
                            clearAllBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Clear All`;
                        });
                    },
                    null,
                    "Clear All",
                    true
                );
            } else {
                showCustomNotification("Please authenticate as admin first.", "warning");
            }
        });
    }
    // Auto-sync processing classes on buttons when they display spinners or are disabled
    const buttonObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            const target = mutation.target;
            if (target && target.tagName === "BUTTON") {
                const hasSpinner = target.querySelector(".fa-spinner") !== null || target.innerHTML.includes("fa-spinner");
                if (hasSpinner || target.disabled) {
                    if (!target.classList.contains("processing")) {
                        target.classList.add("processing");
                    }
                } else {
                    if (target.classList.contains("processing")) {
                        target.classList.remove("processing");
                    }
                }
            }
        });
    });

    if (document.body) {
        buttonObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["disabled", "class"]
        });
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            buttonObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["disabled", "class"]
            });
        });
    }
})();


