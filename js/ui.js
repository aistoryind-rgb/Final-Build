// V2 Application UI and Event bindings
// Loads UI modules, setups listeners, triggers validation loop on input change.

// Global configurations and states
const CONFIG = {
    GOOGLE_SCRIPT_URL: "", // Leave empty for offline test reports fallback
    API_KEY_VAULT: [],
};

let customTranslations = {};
let customSpelling = {};
let customTemplates = [];
let resolvedBugReportsCache = [];

// Initialize configurations
function initCustomData() {
    try {
        customTranslations = JSON.parse(localStorage.getItem("li_custom_translations")) || {};
        customSpelling = JSON.parse(localStorage.getItem("li_custom_spelling")) || {};
        customTemplates = JSON.parse(localStorage.getItem("li_custom_templates")) || [];
    } catch (e) {
        console.error("V2 UI: Error loading custom data:", e);
    }
}

// Function to process the raw ad
function processAd() {
    const rawAdTextarea = document.getElementById("raw-ad");
    const processedAdText = document.getElementById("processed-ad-text");
    const statusBanner = document.getElementById("ad-status-banner");
    const auditLogsList = document.getElementById("audit-logs-list");

    if (!rawAdTextarea) return;

    const val = rawAdTextarea.value;
    if (!val || !val.trim()) {
        if (processedAdText) {
            processedAdText.textContent = "Processed ad will appear here...";
            processedAdText.classList.add("placeholder");
        }
        if (statusBanner) {
            statusBanner.setAttribute("data-status", "pending");
            statusBanner.innerHTML = `<span class="status-icon"><i class="fa-solid fa-hourglass-half"></i></span><span class="status-title">Awaiting Input...</span>`;
        }
        if (auditLogsList) {
            auditLogsList.innerHTML = `<li class="log-empty">No logs available. Enter some text to see corrections.</li>`;
        }
        return;
    }

    const context = {
        raw: val,
        phoneNumber: "",
        actionOverride: actionOverrideMode,
        status: "passed",
        rejectionReason: "",
        blacklistReason: "",
        logs: [],
        category: "Other",
        finalText: "",
        priceInfo: null
    };

    try {
        const categoryOverride = document.getElementById("category-override")?.value || "auto";
        runValidationPipeline(context, categoryOverride);
    } catch (e) {
        console.error("Pipeline crash:", e);
        context.status = "failed";
        context.rejectionReason = "Internal system execution error.";
    }

    // Update Output displays
    if (processedAdText) {
        processedAdText.textContent = context.finalText || context.raw;
        processedAdText.classList.remove("placeholder");
    }

    // Update Status Banner
    if (statusBanner) {
        if (context.status === "passed") {
            statusBanner.setAttribute("data-status", "passed");
            statusBanner.innerHTML = `<span class="status-icon"><i class="fa-solid fa-circle-check"></i></span><span class="status-title">Ad Approved</span>`;
        } else if (context.status === "blacklisted") {
            statusBanner.setAttribute("data-status", "blacklisted");
            statusBanner.innerHTML = `<span class="status-icon"><i class="fa-solid fa-hand-fist"></i></span><span class="status-title">Blacklisted: ${context.blacklistReason}</span>`;
        } else {
            statusBanner.setAttribute("data-status", "rejected");
            statusBanner.innerHTML = `<span class="status-icon"><i class="fa-solid fa-circle-xmark"></i></span><span class="status-title">Rejected: ${context.rejectionReason}</span>`;
        }
    }

    // Render Logs
    if (auditLogsList) {
        if (context.logs.length === 0) {
            auditLogsList.innerHTML = `<li>No corrections applied.</li>`;
        } else {
            auditLogsList.innerHTML = context.logs.map(log => `<li>${log.text}</li>`).join("");
        }
    }
}

// DomContentLoaded Setup
document.addEventListener("DOMContentLoaded", async () => {
    // Load extracted databases
    const dbSuccess = await loadDatabases();
    if (!dbSuccess) {
        alert("Failed to load V2 databases. Please check the console.");
        return;
    }

    // Init state
    initCustomData();

    // Bind basic editor interactions
    const rawAdTextarea = document.getElementById("raw-ad");
    if (rawAdTextarea) {
        rawAdTextarea.addEventListener("input", processAd);
    }

    const categoryOverrideSelect = document.getElementById("category-override");
    if (categoryOverrideSelect) {
        categoryOverrideSelect.addEventListener("change", processAd);
    }

    // Setup action mode buttons
    const btnSell = document.getElementById("btn-toggle-sell");
    const btnBuy = document.getElementById("btn-toggle-buy");
    if (btnSell && btnBuy) {
        btnSell.addEventListener("click", () => {
            actionOverrideMode = "Selling";
            btnSell.classList.add("active");
            btnBuy.classList.remove("active");
            processAd();
        });
        btnBuy.addEventListener("click", () => {
            actionOverrideMode = "Buying";
            btnBuy.classList.add("active");
            btnSell.classList.remove("active");
            processAd();
        });
    }

    console.log("LifeInvader-V2: UI initialized successfully!");
});
