/* ==========================================================================
   LifeInvader V2 Gemini AI & Limit Tracker Module
   ========================================================================== */
function updateVaultStatusDot(slot, status) {
    const dot = document.querySelector(`.vault-status-dot[data-slot="${slot}"]`);
    if (!dot) return;
    if (status === "active") {
        dot.style.background = "#30d158";
        dot.title = "Active (Connected)";
    } else if (status === "rate-limit") {
        dot.style.background = "#ff9f0a";
        dot.title = "Rate Limited / Quota Exceeded (429)";
    } else if (status === "invalid" || status === "error") {
        dot.style.background = "#ff453a";
        dot.title = "Invalid Key / Connection Error";
    } else {
        dot.style.background = "rgba(255,255,255,0.15)";
        dot.title = "Untested";
    }
}

// Test health of a single key slot
async function testSingleKeyHealth(keyVal) {
    if (!keyVal) return { ok: false, status: "empty", msg: "Empty Slot" };
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${keyVal}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello!" }] }]
            })
        });
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            const code = errBody?.error?.code || res.status;
            const message = errBody?.error?.message || "API error";
            return { ok: false, status: code === 429 ? "rate-limit" : "invalid", msg: message };
        }
        trackGeminiAPICall();
        return { ok: true, status: "active", msg: "Connected" };
    } catch (e) {
        return { ok: false, status: "error", msg: e.message || "Network Error" };
    }
}

// Auto-failover: sequentially rotate active slot to next populated slot and return key
function failoverToNextKey() {
    const isFailoverEnabled = localStorage.getItem("li_gemini_auto_failover") === "true";
    if (!isFailoverEnabled) return null;

    const startSlot = parseInt(localStorage.getItem("li_gemini_active_slot") || "1");
    let nextSlot = startSlot;

    for (let attempts = 1; attempts <= 5; attempts++) {
        nextSlot = (nextSlot % 5) + 1; // sequentially advance: 1->2->3->4->5->1
        
        const backupKey = localStorage.getItem(`li_gemini_vault_key_${nextSlot}`);
        if (backupKey && backupKey.trim()) {
            // Found a valid key slot!
            localStorage.setItem("li_gemini_active_slot", nextSlot.toString());
            localStorage.setItem("li_gemini_api_key", backupKey.trim());
            
            // Sync with hidden main key input
            const mainInput = document.getElementById("input-ai-gemini-key");
            if (mainInput) mainInput.value = backupKey.trim();

            // Refresh UI in settings
            updateAIGeminiStatusDisplay();
            
            // Highlight row visually in Settings tab
            for (let s = 1; s <= 5; s++) {
                const r = document.querySelector(`.vault-row[data-slot="${s}"]`);
                const ba = r?.querySelector(`.btn-vault-activate`);
                if (r) {
                    if (s === nextSlot) {
                        r.classList.add("active");
                        if (ba) {
                            ba.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
                            ba.style.color = "var(--color-primary)";
                        }
                    } else {
                        r.classList.remove("active");
                        if (ba) {
                            ba.innerHTML = `<i class="fa-regular fa-circle"></i>`;
                            ba.style.color = "var(--text-muted)";
                        }
                    }
                }
            }

            if (typeof showCustomNotification === "function") {
                showCustomNotification(`Failover Triggered: Switched to Slot ${nextSlot} backup key!`, "warning");
            }
            return backupKey.trim();
        }
    }
    
    return null; // no other valid backup key found
}

// Unified API calling promise wrapper with Auto-Failover rotation
function geminiPostWithFailover(payload) {
    let activeKey = localStorage.getItem("li_gemini_api_key") || FALLBACK_GEMINI_KEY;
    const autoFailoverEnabled = localStorage.getItem("li_gemini_auto_failover") === "true";

    const attemptPost = (key, slotsTested = new Set()) => {
        return fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(async res => {
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                const code = errBody?.error?.code || res.status;
                const message = errBody?.error?.message || `HTTP ${res.status}`;
                throw { code, message };
            }
            return res.json();
        })
        .catch(async err => {
            console.warn(`Gemini Request failed with key: ...${key.slice(-6)}. Error:`, err);
            const errCode = err.code || 0;
            const isApiError = errCode === 429 || errCode === 403 || errCode === 400 || errCode === 0;

            if (isApiError && autoFailoverEnabled) {
                const currentSlot = localStorage.getItem("li_gemini_active_slot") || "1";
                slotsTested.add(currentSlot);
                updateVaultStatusDot(currentSlot, errCode === 429 ? "rate-limit" : "invalid");

                const nextKey = failoverToNextKey();
                if (nextKey && !slotsTested.has(localStorage.getItem("li_gemini_active_slot"))) {
                    console.log(`Retrying Gemini request with Backup Key from Slot ${localStorage.getItem("li_gemini_active_slot")}`);
                    return attemptPost(nextKey, slotsTested);
                }
            }
            throw err;
        });
    };

    return attemptPost(activeKey);
}

// Initializes settings vault panel controls and event handlers
function initBackupKeyVault() {
    const vaultList = document.getElementById("api-vault-list");
    if (!vaultList) return;

    // Load active slot from localStorage (default "1")
    let activeSlot = localStorage.getItem("li_gemini_active_slot") || "1";
    
    // Load failover switch state
    const failoverToggle = document.getElementById("toggle-ai-failover");
    let autoFailover = localStorage.getItem("li_gemini_auto_failover");
    if (autoFailover === null) {
        autoFailover = "true";
        localStorage.setItem("li_gemini_auto_failover", "true");
    }
    if (failoverToggle) {
        failoverToggle.checked = autoFailover === "true";
        // Wire up change listener
        if (!failoverToggle.dataset.wired) {
            failoverToggle.dataset.wired = "true";
            failoverToggle.addEventListener("change", (e) => {
                localStorage.setItem("li_gemini_auto_failover", e.target.checked ? "true" : "false");
                showCustomNotification("Auto-Failover " + (e.target.checked ? "enabled" : "disabled") + ".", "success");
            });
        }
    }

    // Migration logic
    const globalKey = localStorage.getItem("li_gemini_api_key");
    const slot1Key = localStorage.getItem("li_gemini_vault_key_1");
    if (globalKey && !slot1Key && globalKey !== FALLBACK_GEMINI_KEY) {
        localStorage.setItem("li_gemini_vault_key_1", globalKey);
    }

    // Set up each row (1 to 5)
    for (let slot = 1; slot <= 5; slot++) {
        const row = document.querySelector(`.vault-row[data-slot="${slot}"]`);
        if (!row) continue;

        const input = row.querySelector(`.vault-key-input`);
        const btnActivate = row.querySelector(`.btn-vault-activate`);
        const btnVisibility = row.querySelector(`.btn-vault-visibility`);
        const btnCopy = row.querySelector(`.btn-vault-copy`);
        const btnPaste = row.querySelector(`.btn-vault-paste`);
        const btnTestHealth = row.querySelector(`.btn-vault-test`);

        // Load value
        const key = localStorage.getItem(`li_gemini_vault_key_${slot}`) || "";
        if (input) {
            input.value = key;
            input.placeholder = key ? "••••••••••••••••••••••••••••••••" : `Empty Slot ${slot}`;
            input.removeAttribute("readonly"); // Keep unlocked by default
        }

        // Apply active/inactive visual states
        if (slot.toString() === activeSlot) {
            row.classList.add("active");
            if (btnActivate) {
                btnActivate.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
                btnActivate.style.color = "var(--color-primary)";
            }
        } else {
            row.classList.remove("active");
            if (btnActivate) {
                btnActivate.innerHTML = `<i class="fa-regular fa-circle"></i>`;
                btnActivate.style.color = "var(--text-muted)";
            }
        }

        // Skip event wiring if already done to prevent duplicates
        if (row.dataset.wired) continue;
        row.dataset.wired = "true";

        // Activate slot event
        if (btnActivate) {
            btnActivate.addEventListener("click", () => {
                const currentKey = localStorage.getItem(`li_gemini_vault_key_${slot}`) || "";
                if (!currentKey) {
                    showCustomNotification(`Cannot activate empty slot ${slot}. Please paste a key first.`, "warning");
                    return;
                }
                
                // Set active slot
                activeSlot = slot.toString();
                localStorage.setItem("li_gemini_active_slot", activeSlot);
                
                // Update global API key for backward compatibility
                localStorage.setItem("li_gemini_api_key", currentKey);
                const mainInput = document.getElementById("input-ai-gemini-key");
                if (mainInput) {
                    mainInput.value = currentKey;
                }
                updateAIGeminiStatusDisplay();

                // Update UI rows active state
                for (let s = 1; s <= 5; s++) {
                    const r = document.querySelector(`.vault-row[data-slot="${s}"]`);
                    const ba = r?.querySelector(`.btn-vault-activate`);
                    if (r) {
                        if (s === slot) {
                            r.classList.add("active");
                            if (ba) {
                                ba.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
                                ba.style.color = "var(--color-primary)";
                            }
                        } else {
                            r.classList.remove("active");
                            if (ba) {
                                ba.innerHTML = `<i class="fa-regular fa-circle"></i>`;
                                ba.style.color = "var(--text-muted)";
                            }
                        }
                    }
                }
                showCustomNotification(`Slot ${slot} activated as primary API key!`, "success");
            });
        }

        // Show/Hide Visibility
        if (btnVisibility) {
            btnVisibility.addEventListener("click", () => {
                if (!input) return;
                const isPassword = input.type === "password";
                input.type = isPassword ? "text" : "password";
                btnVisibility.innerHTML = isPassword ? `<i class="fa-solid fa-eye-slash"></i>` : `<i class="fa-solid fa-eye"></i>`;
            });
        }

        // Copy Key
        if (btnCopy) {
            btnCopy.addEventListener("click", () => {
                const currentKey = input ? input.value.trim() : "";
                if (!currentKey) {
                    showCustomNotification(`Slot ${slot} is empty. Nothing to copy!`, "warning");
                    return;
                }
                navigator.clipboard.writeText(currentKey)
                    .then(() => showCustomNotification(`Slot ${slot} API Key copied to clipboard!`, "success"))
                    .catch(() => {
                        const tempTextarea = document.createElement("textarea");
                        tempTextarea.value = currentKey;
                        document.body.appendChild(tempTextarea);
                        tempTextarea.select();
                        document.execCommand("copy");
                        document.body.removeChild(tempTextarea);
                        showCustomNotification(`Slot ${slot} API Key copied to clipboard!`, "success");
                    });
            });
        }

        // Paste Key
        if (btnPaste) {
            btnPaste.addEventListener("click", async () => {
                try {
                    let text = "";
                    if (navigator.clipboard && navigator.clipboard.readText) {
                        text = await navigator.clipboard.readText().catch(() => "");
                    }
                    if (!text) {
                        text = prompt(`Paste Gemini API Key for Slot ${slot}:`);
                    }
                    if (text) {
                        text = text.trim();
                        if (text.startsWith("AIzaSy")) {
                            if (input) {
                                input.value = text;
                                input.placeholder = "••••••••••••••••••••••••••••••••";
                            }
                            localStorage.setItem(`li_gemini_vault_key_${slot}`, text);
                            
                            // If this slot is the active one, sync with the global key as well
                            if (slot.toString() === localStorage.getItem("li_gemini_active_slot")) {
                                localStorage.setItem("li_gemini_api_key", text);
                                const mainInput = document.getElementById("input-ai-gemini-key");
                                if (mainInput) mainInput.value = text;
                                updateAIGeminiStatusDisplay();
                            }
                            
                            showCustomNotification(`API Key pasted into Slot ${slot}! Please click "Save Details" to apply.`, "success");
                        } else {
                            showCustomNotification(`Invalid Gemini API Key format. Must start with "AIzaSy".`, "error");
                        }
                    }
                } catch (e) {
                    console.error("Paste failed:", e);
                }
            });
        }

        // Row-level Test Health Connection
        if (btnTestHealth) {
            btnTestHealth.addEventListener("click", async () => {
                const keyVal = input ? input.value.trim() : "";
                if (!keyVal) {
                    showCustomNotification(`Slot ${slot} is empty. Paste a key to test.`, "warning");
                    return;
                }
                btnTestHealth.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                btnTestHealth.style.color = "#ff9f0a";
                const dot = row.querySelector(`.vault-status-dot`);
                if (dot) {
                    dot.style.background = "#ff9f0a";
                    dot.title = "Testing...";
                }
                showCustomNotification(`Testing slot ${slot} API key connection...`, "info");
                
                const result = await testSingleKeyHealth(keyVal);
                updateVaultStatusDot(slot, result.status);
                
                btnTestHealth.innerHTML = `<i class="fa-solid fa-vial"></i>`;
                btnTestHealth.style.color = "var(--text-muted)";

                if (result.ok) {
                    showCustomConfirmDialog(`Slot ${slot} API key is healthy and active! Connection test successful.`, null, null, "OK", false);
                } else {
                    showCustomConfirmDialog(`Slot ${slot} test failed: ${result.msg || "Invalid key or rate limit exceeded."}`, null, null, "Close", true);
                }
                
                if (slot.toString() === localStorage.getItem("li_gemini_active_slot")) {
                    updateAIGeminiStatusDisplay();
                }
            });
        }
    }
}

// --- AI Assistant Tab Visibility Helper ---
function refreshAIAssistantTabVisibility() {
    // Load settings inputs
    const inputKey = document.getElementById("input-ai-gemini-key");
    const customPromptTextarea = document.getElementById("ai-custom-prompt");
    const isAssistant = sessionStorage.getItem("li_admin_role") === "assistant";
    if (inputKey) {
        if (isAssistant) {
            inputKey.value = "••••••••••••••••••••••••••••••••";
        } else {
            inputKey.value = localStorage.getItem("li_gemini_api_key") || FALLBACK_GEMINI_KEY;
        }
    }
    if (customPromptTextarea) {
        customPromptTextarea.value = localStorage.getItem("li_gemini_custom_prompt") || "";
    }
    updateAIGeminiStatusDisplay();
    initBackupKeyVault();
}

function refreshBugTriageTabVisibility() {
    const lockScreen = document.getElementById("bug-triage-lock-screen");
    const triageContent = document.getElementById("bug-triage-active-content");
    if (!lockScreen || !triageContent) return;

    const isAuth = sessionStorage.getItem("li_admin_authenticated") === "true";
    if (isAuth) {
        lockScreen.classList.add("hide");
        triageContent.classList.remove("hide");
        loadAndRenderBugTriage();
        // Render only if the templates drawer is currently open
        const templatesDrawer = document.getElementById("bug-triage-templates-drawer");
        if (templatesDrawer && templatesDrawer.classList.contains("open") && typeof renderCustomTemplates === "function") {
            renderCustomTemplates();
        }
    } else {
        lockScreen.classList.remove("hide");
        triageContent.classList.add("hide");
        // Reset the templates drawer state when locked/unauthenticated
        const templatesDrawer = document.getElementById("bug-triage-templates-drawer");
        const templatesBtn = document.getElementById("btn-triage-templates");
        if (templatesDrawer) {
            templatesDrawer.classList.remove("open");
        }
        if (templatesBtn) {
            templatesBtn.style.background = "rgba(167, 139, 250, 0.05)";
            templatesBtn.style.borderColor = "rgba(167, 139, 250, 0.15)";
        }
    }
}

// ── API Usage Tracking System (1-Min RPM & Daily RPD) ──
const GEMINI_RPM_LIMIT = 15;
const GEMINI_DAILY_QUOTA = 1500;

function initAPILimitTracker() {
    getDailyUsageData();

    // Check/initialize RPM window
    let windowEnds = parseInt(localStorage.getItem("li_gemini_window_ends") || "0");
    const now = Date.now();
    if (!windowEnds || now >= windowEnds) {
        windowEnds = now + 60000;
        localStorage.setItem("li_gemini_window_ends", windowEnds.toString());
        localStorage.setItem("li_gemini_rpm_count", "0");
    }

    // Start the timer loop (updates every second)
    setInterval(updateRPMTimer, 1000);
    updateAPIUsageBar();
}

function getDailyUsageData() {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem("li_gemini_usage");
    let data = null;
    try { data = JSON.parse(raw); } catch (e) {}
    if (!data || data.date !== today) {
        data = { date: today, count: 0 };
        localStorage.setItem("li_gemini_usage", JSON.stringify(data));
    }
    return data;
}

function trackGeminiAPICall() {
    // Increment daily count
    const dailyData = getDailyUsageData();
    dailyData.count++;
    localStorage.setItem("li_gemini_usage", JSON.stringify(dailyData));

    // Increment RPM count
    let rpmCount = parseInt(localStorage.getItem("li_gemini_rpm_count") || "0");
    rpmCount++;
    localStorage.setItem("li_gemini_rpm_count", rpmCount.toString());

    updateAPIUsageBar();
}

function updateRPMTimer() {
    const now = Date.now();
    let windowEnds = parseInt(localStorage.getItem("li_gemini_window_ends") || "0");
    
    if (now >= windowEnds) {
        // Reset window
        let oldRpmCount = parseInt(localStorage.getItem("li_gemini_rpm_count") || "0");
        windowEnds = now + 60000;
        localStorage.setItem("li_gemini_window_ends", windowEnds.toString());
        localStorage.setItem("li_gemini_rpm_count", "0");
        
        if (oldRpmCount >= GEMINI_RPM_LIMIT) {
            if (typeof showCustomNotification === "function") {
                showCustomNotification("Gemini API rate limit has reset! 15 new requests available.", "success");
            }
        }
    }
    
    updateAPIUsageBar();
}

function updateAPIUsageBar() {
    const now = Date.now();
    const windowEnds = parseInt(localStorage.getItem("li_gemini_window_ends") || "0");
    const remainingMs = Math.max(0, windowEnds - now);
    const remainingSecs = Math.ceil(remainingMs / 1000);

    const rpmCount = parseInt(localStorage.getItem("li_gemini_rpm_count") || "0");
    const dailyData = getDailyUsageData();

    const pct = Math.min(Math.round((rpmCount / GEMINI_RPM_LIMIT) * 100), 100);

    const barFill = document.getElementById("ai-usage-bar-fill");
    const countEl = document.getElementById("ai-usage-count");
    const statusEl = document.getElementById("ai-usage-status");
    const pctEl = document.getElementById("ai-usage-pct");
    const dailyEl = document.getElementById("ai-usage-daily-count");

    if (countEl) countEl.textContent = `${rpmCount} / ${GEMINI_RPM_LIMIT} requests`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (dailyEl) dailyEl.textContent = `Daily Total: ${dailyData.count} / ${GEMINI_DAILY_QUOTA}`;

    if (barFill) {
        barFill.style.width = `${pct}%`;
        if (pct < 50) {
            barFill.style.background = "linear-gradient(90deg, #30d158, #34d399)";
            barFill.style.boxShadow = "0 0 6px rgba(48, 209, 88, 0.3)";
        } else if (pct < 80) {
            barFill.style.background = "linear-gradient(90deg, #ff9f0a, #ffb340)";
            barFill.style.boxShadow = "0 0 6px rgba(255, 159, 10, 0.3)";
        } else {
            barFill.style.background = "linear-gradient(90deg, #ff453a, #ff6961)";
            barFill.style.boxShadow = "0 0 8px rgba(255, 69, 58, 0.4)";
        }
    }

    if (statusEl) {
        if (pct >= 100) {
            statusEl.textContent = `🔴 Limit reached! Resets in ${remainingSecs}s`;
            statusEl.style.color = "#ff453a";
        } else if (pct >= 80) {
            statusEl.textContent = `⚠ Running low! Resets in ${remainingSecs}s`;
            statusEl.style.color = "rgba(255, 159, 10, 0.9)";
        } else {
            statusEl.textContent = `Resets in ${remainingSecs}s`;
            statusEl.style.color = "rgba(255, 255, 255, 0.5)";
        }
    }
}

let isActiveKeyRevealed = false;

function updateAIGeminiStatusDisplay() {
    const statusIndicator = document.getElementById("ai-gemini-status-indicator");
    const statusText = document.getElementById("ai-gemini-status-text");
    if (!statusIndicator || !statusText) return;

    const savedKey = localStorage.getItem("li_gemini_api_key") || FALLBACK_GEMINI_KEY;
    if (savedKey) {
        statusIndicator.style.background = "#30d158"; // Green
        statusText.textContent = "Active (Connected)";
    } else {
        statusIndicator.style.background = "#ff453a"; // Red
        statusText.textContent = "Disconnected (No Key)";
    }
    // Also refresh usage bar on status update
    updateAPIUsageBar();

    // Active key display & toggle logic
    const activeKeyWrapper = document.getElementById("active-key-display-wrapper");
    const activeKeyMaskedText = document.getElementById("active-key-masked-text");
    const btnActiveKeyReveal = document.getElementById("btn-active-key-reveal");

    if (activeKeyWrapper && activeKeyMaskedText && btnActiveKeyReveal) {
        if (savedKey) {
            activeKeyWrapper.style.display = "flex";
            
            // Default to always hidden/masked on status updates (e.g. slot switch, load, refresh)
            isActiveKeyRevealed = false;

            const maskKey = (key) => {
                if (!key) return "";
                if (key.length <= 8) return "••••••••";
                return key.substring(0, 6) + "••••••••" + key.substring(key.length - 4);
            };

            const updateUI = () => {
                if (isActiveKeyRevealed) {
                    activeKeyMaskedText.textContent = savedKey;
                    btnActiveKeyReveal.innerHTML = `<i class="fa-solid fa-eye"></i>`;
                    btnActiveKeyReveal.style.color = "var(--text-primary)";
                } else {
                    activeKeyMaskedText.textContent = maskKey(savedKey);
                    btnActiveKeyReveal.innerHTML = `<i class="fa-solid fa-eye-slash"></i>`;
                    btnActiveKeyReveal.style.color = "var(--text-muted)";
                }
            };

            updateUI();

            // Replace old event listeners by cloning button
            const newBtn = btnActiveKeyReveal.cloneNode(true);
            btnActiveKeyReveal.parentNode.replaceChild(newBtn, btnActiveKeyReveal);
            
            newBtn.addEventListener("click", () => {
                isActiveKeyRevealed = !isActiveKeyRevealed;
                updateUI();
            });
        } else {
            activeKeyWrapper.style.display = "none";
        }
    }
}

function setupReleaseToTriggerHoldButton(btn, originalHtml, onTriggerComplete, holdDuration = 1000, triggerText = "Release to Activate") {
    if (!btn) return;
    
    let progressInterval = null;
    let startTime = null;
    let isHolding = false;
    
    const resetState = (e) => {
        if (!isHolding) return;
        isHolding = false;
        
        if (progressInterval) clearInterval(progressInterval);
        progressInterval = null;
        
        const elapsed = startTime ? (Date.now() - startTime) : 0;
        startTime = null;
        
        btn.style.background = "";
        btn.style.boxShadow = "";
        btn.innerHTML = originalHtml;
        
        if (elapsed >= holdDuration && e.type !== "mouseleave" && e.type !== "touchcancel") {
            onTriggerComplete(e);
        }
    };
    
    const startHolding = (e) => {
        if (e.type.startsWith("mouse") && e.button !== 0) return;
        if (btn.disabled) return;
        
        e.preventDefault();
        isHolding = true;
        startTime = Date.now();
        
        btn.style.boxShadow = "0 0 15px rgba(168, 85, 247, 0.4)";
        
        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min((elapsed / holdDuration) * 100, 100);
            const remainingSecs = Math.max(((holdDuration - elapsed) / 1000), 0).toFixed(1);
            
            btn.style.background = `linear-gradient(90deg, rgba(168, 85, 247, 0.4) ${pct}%, rgba(168, 85, 247, 0.15) ${pct}%)`;
            
            if (pct >= 100) {
                btn.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #c084fc;"></i> ${triggerText}`;
            } else {
                btn.innerHTML = `<i class="fa-solid fa-hourglass-half fa-spin" style="color: #c084fc;"></i> Hold ${remainingSecs}s`;
            }
        };
        
        updateProgress();
        progressInterval = setInterval(updateProgress, 50);
    };
    
    btn.addEventListener("mousedown", startHolding);
    btn.addEventListener("touchstart", startHolding, { passive: false });
    
    btn.addEventListener("mouseup", resetState);
    btn.addEventListener("mouseleave", resetState);
    btn.addEventListener("touchend", resetState);
    btn.addEventListener("touchcancel", resetState);
}

function setupHoldToTriggerButton(btn, originalHtml, onTriggerComplete) {
    if (!btn) return;
    
    let holdTimer = null;
    let progressInterval = null;
    let startTime = null;
    let isTriggered = false;
    const holdDuration = 2000; // 2 seconds
    
    const resetState = () => {
        if (isTriggered) return;
        
        if (holdTimer) clearTimeout(holdTimer);
        if (progressInterval) clearInterval(progressInterval);
        holdTimer = null;
        progressInterval = null;
        startTime = null;
        
        const state = btn.dataset.state || "spark";
        if (state === "train") {
            btn.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> Train`;
            btn.style.background = "linear-gradient(135deg, rgba(48,209,88,0.15), rgba(48,209,88,0.05))";
            btn.style.border = "1px solid rgba(48,209,88,0.3)";
            btn.style.color = "#30d158";
        } else if (state === "trained") {
            btn.innerHTML = `<i class="fa-solid fa-check"></i> Trained`;
            btn.style.background = "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(45,212,191,0.05))";
            btn.style.border = "1px solid rgba(45,212,191,0.3)";
            btn.style.color = "#2dd4bf";
            btn.disabled = true;
        } else {
            btn.innerHTML = originalHtml;
            btn.style.background = ""; 
            btn.style.boxShadow = "";
            btn.style.border = "";
            btn.style.color = "";
        }
    };

    const startHolding = (e) => {
        if (e.type.startsWith("mouse") && e.button !== 0) return;
        if (btn.disabled) return;
        
        e.preventDefault();
        isTriggered = false;
        startTime = Date.now();
        
        const state = btn.dataset.state || "spark";
        if (state === "train") {
            btn.style.boxShadow = "0 0 15px rgba(48, 209, 88, 0.4)";
        } else {
            btn.style.boxShadow = "0 0 15px rgba(167, 139, 250, 0.4)";
        }
        
        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min((elapsed / holdDuration) * 100, 100);
            const remainingSecs = Math.max(((holdDuration - elapsed) / 1000), 0).toFixed(1);
            
            if (state === "train") {
                btn.style.background = `linear-gradient(90deg, rgba(48, 209, 88, 0.4) ${pct}%, rgba(48, 209, 88, 0.15) ${pct}%)`;
                btn.innerHTML = `<i class="fa-solid fa-hourglass-half fa-spin" style="color: #30d158;"></i> Train ${remainingSecs}s`;
            } else {
                btn.style.background = `linear-gradient(90deg, rgba(167, 139, 250, 0.4) ${pct}%, rgba(167, 139, 250, 0.15) ${pct}%)`;
                btn.innerHTML = `<i class="fa-solid fa-hourglass-half fa-spin" style="color: #a78bfa;"></i> Hold ${remainingSecs}s`;
            }
            
            if (pct >= 100) {
                clearInterval(progressInterval);
            }
        };
        
        updateProgress();
        progressInterval = setInterval(updateProgress, 50);
        
        holdTimer = setTimeout(() => {
            isTriggered = true;
            if (progressInterval) clearInterval(progressInterval);
            progressInterval = null;
            holdTimer = null;
            
            if (state === "train") {
                btn.innerHTML = `<i class="fa-solid fa-check"></i> Submitting...`;
                btn.style.background = "rgba(48, 209, 88, 0.2)";
                btn.style.boxShadow = "0 0 15px rgba(48, 209, 88, 0.4)";
            } else {
                btn.innerHTML = `<i class="fa-solid fa-check"></i> Triggered!`;
                btn.style.background = "rgba(167, 139, 250, 0.2)";
                btn.style.boxShadow = "0 0 15px rgba(167, 139, 250, 0.4)";
            }
            
            setTimeout(() => {
                btn.style.background = "";
                btn.style.boxShadow = "";
                onTriggerComplete();
                setTimeout(() => {
                    isTriggered = false;
                }, 1000);
            }, 300);
        }, holdDuration);
    };
    
    btn.addEventListener("mousedown", startHolding);
    btn.addEventListener("touchstart", startHolding, { passive: false });
    
    btn.addEventListener("mouseup", resetState);
    btn.addEventListener("mouseleave", resetState);
    btn.addEventListener("touchend", resetState);
    btn.addEventListener("touchcancel", resetState);
}

function updateAIAssistButtonsVisibility() {
    const isAdmin = sessionStorage.getItem("li_admin_authenticated") === "true";
    const btnGeminiAssist = document.getElementById("btn-gemini-assist");
    if (btnGeminiAssist) {
        btnGeminiAssist.style.display = isAdmin ? "inline-flex" : "none";
    }

    if (typeof pipWindowInstance !== "undefined" && pipWindowInstance && !pipWindowInstance.closed) {
        const pipBtnAiAssist = pipWindowInstance.document.getElementById("pip-btn-ai-assist");
        if (pipBtnAiAssist) {
            pipBtnAiAssist.style.display = isAdmin ? "inline-flex" : "none";
        }
    }
}


function initGeminiEngine() {
    // ── Wire Admin Password Authentication Lock Portal button ──
    const unlockBtn = document.getElementById("btn-ai-unlock-login");
    if (unlockBtn) {
        unlockBtn.addEventListener("click", () => {
            const adminTabBtn = document.getElementById("tab-btn-admin");
            if (adminTabBtn) {
                adminTabBtn.click();
                const passInput = document.getElementById("admin-passcode");
                if (passInput) passInput.focus();
            }
        });
    }

    // ── settings panel controls ──
    const inputKey = document.getElementById("input-ai-gemini-key");
    const btnToggleVisibility = document.getElementById("btn-toggle-ai-gemini-key-visibility");
    const btnSave = document.getElementById("btn-ai-gemini-save");
    const statusIndicator = document.getElementById("ai-gemini-status-indicator");
    const statusText = document.getElementById("ai-gemini-status-text");
    const customPromptTextarea = document.getElementById("ai-custom-prompt");

    if (!inputKey || !btnSave) return;

    // Toggle Visibility
    if (btnToggleVisibility) {
        btnToggleVisibility.addEventListener("click", () => {
            const isPassword = inputKey.type === "password";
            inputKey.type = isPassword ? "text" : "password";
            btnToggleVisibility.innerHTML = isPassword ? `<i class="fa-solid fa-eye-slash"></i>` : `<i class="fa-solid fa-eye"></i>`;
        });
    }

    // Update Status Display helper
    const updateStatusDisplay = (status, msg) => {
        if (!statusIndicator || !statusText) return;
        if (status === "active") {
            statusIndicator.style.background = "#30d158"; // Green
            statusText.textContent = msg || "Active (Connected)";
        } else if (status === "testing") {
            statusIndicator.style.background = "#ff9f0a"; // Amber
            statusText.textContent = msg || "Testing connection...";
        } else {
            statusIndicator.style.background = "#ff453a"; // Red
            statusText.textContent = msg || "Disconnected (No Key)";
        }
    };

    // ── Shared live API health check function ──
    const runLiveHealthCheck = (keyVal, opts = {}) => {
        const { silent = false, onResult = null } = opts;
        updateStatusDisplay("testing", "Testing connection...");
        if (btnTest) {
            btnTest.disabled = true;
            btnTest.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Testing...`;
        }

        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${keyVal}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello! Reply with a single word 'Connected!' if you can read this." }] }]
            })
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(errBody => {
                    const errMsg = errBody?.error?.message || `HTTP Error ${res.status}`;
                    const errCode = errBody?.error?.code || res.status;
                    throw { code: errCode, message: errMsg };
                }).catch(parseErr => {
                    if (parseErr.code) throw parseErr;
                    throw { code: res.status, message: `HTTP Error ${res.status}` };
                });
            }
            return res.json();
        })
        .then(data => {
            trackGeminiAPICall();
            if (btnTest) {
                btnTest.disabled = false;
                btnTest.innerHTML = `<i class="fa-solid fa-vial"></i> Test Health`;
            }
            const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (responseText) {
                updateStatusDisplay("active", "Active (Connected ✓)");
                if (!silent) {
                    showCustomConfirmDialog("Gemini connection test successful! Spark AI Engine is fully active and responding.", null, null, "OK", false);
                }
                if (onResult) onResult(true);
            } else {
                updateStatusDisplay("disconnected", "Connection Failed (Empty Response)");
                if (!silent) {
                    showCustomConfirmDialog(`Key accepted but received an empty response. The model may be temporarily unavailable.`, null, null, "Close", true);
                }
                if (onResult) onResult(false);
            }
        })
        .catch(err => {
            if (btnTest) {
                btnTest.disabled = false;
                btnTest.innerHTML = `<i class="fa-solid fa-vial"></i> Test Health`;
            }
            const code = err.code || 0;
            let diagMsg = "";
            let statusMsg = "";
            if (code === 429) {
                statusMsg = "Rate Limited (Quota Exceeded)";
                diagMsg = `Rate limit reached (HTTP 429). Your free-tier daily quota for this model has been exhausted. Wait a few minutes or switch to a different API key.\n\nDetails: ${err.message}`;
            } else if (code === 403) {
                statusMsg = "Forbidden (Invalid Key)";
                diagMsg = `The API key was rejected (HTTP 403). This key may be invalid, disabled, or does not have access to the Gemini API. Please generate a new key from Google AI Studio.`;
            } else if (code === 400) {
                statusMsg = "Bad Request (API Error)";
                diagMsg = `The API returned a Bad Request (HTTP 400). The key format may be incorrect.\n\nDetails: ${err.message}`;
            } else {
                statusMsg = "Connection Failed (Error)";
                diagMsg = `Test failed: ${err.message || err}. Please double-check your API key and internet connection.`;
            }
            updateStatusDisplay("disconnected", statusMsg);
            if (!silent) {
                showCustomConfirmDialog(diagMsg, null, null, "Close", true);
            }
            if (onResult) onResult(false);
        });
    };

    // Save button listener — saves custom prompt and all 5 vault keys dynamically
    btnSave.addEventListener("click", () => {
        const customPromptVal = customPromptTextarea ? customPromptTextarea.value.trim() : "";
        if (customPromptTextarea) {
            localStorage.setItem("li_gemini_custom_prompt", customPromptVal);
        }

        let hasInvalidKey = false;
        for (let slot = 1; slot <= 5; slot++) {
            const row = document.querySelector(`.vault-row[data-slot="${slot}"]`);
            const input = row?.querySelector(`.vault-key-input`);
            if (input) {
                const val = input.value.trim();
                if (val && !val.startsWith("AIzaSy")) {
                    hasInvalidKey = true;
                    showCustomNotification(`Slot ${slot}: Invalid Gemini API Key format. Must start with "AIzaSy".`, "error");
                    continue;
                }
                if (val) {
                    localStorage.setItem(`li_gemini_vault_key_${slot}`, val);
                    input.placeholder = "••••••••••••••••••••••••••••••••";
                } else {
                    localStorage.removeItem(`li_gemini_vault_key_${slot}`);
                    input.placeholder = `Empty Slot ${slot}`;
                }
            }
        }

        if (hasInvalidKey) return;

        const activeSlot = localStorage.getItem("li_gemini_active_slot") || "1";
        const keyVal = localStorage.getItem(`li_gemini_vault_key_${activeSlot}`);
        
        if (keyVal) {
            localStorage.setItem("li_gemini_api_key", keyVal);
            const mainInput = document.getElementById("input-ai-gemini-key");
            if (mainInput) mainInput.value = keyVal;
            
            showCustomNotification("Settings saved. Testing active key...", "success");
            updateAIGeminiStatusDisplay();
            runLiveHealthCheck(keyVal, { silent: true });
        } else {
            localStorage.removeItem("li_gemini_api_key");
            const mainInput = document.getElementById("input-ai-gemini-key");
            if (mainInput) mainInput.value = "";
            
            showCustomNotification("Settings saved. No active key in primary slot.", "warning");
            updateAIGeminiStatusDisplay();
        }
    });

    // ── Sandbox Playground controls ──
    const sandboxRaw = document.getElementById("ai-sandbox-raw");
    const sandboxCategory = document.getElementById("ai-sandbox-category");
    const sandboxOutputText = document.getElementById("ai-sandbox-output-text");
    const sandboxOutputReason = document.getElementById("ai-sandbox-output-reason");
    const btnSandboxTest = document.getElementById("btn-ai-sandbox-test");
    const btnSandboxCopy = document.getElementById("btn-ai-sandbox-copy");
    const btnSandboxTrain = document.getElementById("btn-ai-sandbox-train");

    if (btnSandboxTest && btnSandboxTrain) {
        btnSandboxTest.addEventListener("click", () => {
            const rawTextVal = sandboxRaw ? sandboxRaw.value.trim() : "";
            if (!rawTextVal) {
                showCustomNotification("Please enter raw ad text to test.", "warning");
                return;
            }

            const categoryVal = sandboxCategory ? sandboxCategory.value : "auto";
            btnSandboxTest.disabled = true;
            btnSandboxTest.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...`;
            if (sandboxOutputReason) sandboxOutputReason.style.display = "none";
            if (sandboxOutputText) sandboxOutputText.value = "";

            getGeminiSparkSuggestion(rawTextVal, categoryVal, (suggestion) => {
                btnSandboxTest.disabled = false;
                btnSandboxTest.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Test AI Output`;

                if (suggestion && suggestion.text) {
                    if (sandboxOutputText) sandboxOutputText.value = suggestion.text;
                    if (sandboxOutputReason) {
                        sandboxOutputReason.style.display = "block";
                        sandboxOutputReason.textContent = suggestion.reason || "Corrected successfully.";
                    }
                    if (btnSandboxCopy) btnSandboxCopy.disabled = false;
                    btnSandboxTrain.disabled = false;
                    showCustomNotification("AI suggestion generated!", "success");
                } else {
                    showCustomNotification("Gemini Spark failed to predict a correction. Try adding custom prompt directives.", "error");
                }
            });
        });

        if (btnSandboxCopy) {
            btnSandboxCopy.addEventListener("click", () => {
                const textToCopy = sandboxOutputText ? sandboxOutputText.value.trim() : "";
                if (!textToCopy) return;

                navigator.clipboard.writeText(textToCopy)
                    .then(() => {
                        showCustomNotification("Corrected ad copied to clipboard!", "success");
                    })
                    .catch(err => {
                        console.error("Clipboard copy failed:", err);
                        showCustomNotification("Failed to copy to clipboard.", "error");
                    });
            });
        }

        btnSandboxTrain.addEventListener("click", () => {
            const rawTextVal = sandboxRaw ? sandboxRaw.value.trim() : "";
            const fixedTextVal = sandboxOutputText ? sandboxOutputText.value.trim() : "";
            const categoryVal = sandboxCategory ? sandboxCategory.value : "auto";

            if (!rawTextVal || !fixedTextVal) return;

            validateTrainingAction(
                rawTextVal,
                fixedTextVal,
                () => {
                    const trimmedRaw = rawTextVal.replace(/\s+/g, ' ').trim().toLowerCase();
                    const details = {
                        text: fixedTextVal,
                        author: getActiveEditorName(),
                        method: "Trained via AI Sandbox",
                        timestamp: new Date().toLocaleString(),
                        reporterTime: "N/A (Sandbox)",
                        category: categoryVal
                    };
                    customTranslations[trimmedRaw] = JSON.stringify(details);
                    localStorage.setItem("li_custom_translations", JSON.stringify(customTranslations));
                    
                    if (typeof saveCustomDataToBackend === "function") {
                        saveCustomDataToBackend();
                    }
                    renderCustomTranslations();
                    
                    showCustomNotification("Translation mapping trained successfully!", "success");
                    btnSandboxTrain.disabled = true;
                }
            );
        });
    }
    refreshAIAssistantTabVisibility();
    refreshBugTriageTabVisibility();
    updateAIAssistButtonsVisibility();
    initAPILimitTracker();
}

function getDatabaseMatchesContext(rawText) {
    if (!rawText) return "";
    const rawClean = rawText.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const rawTokens = rawClean.split(/\s+/).filter(word => word.length >= 3);
    if (rawTokens.length === 0) return "";

    const stopwords = new Set(["buying", "selling", "trading", "renting", "hiring", "want", "buy", "sell", "trade", "rent", "hire", "with", "budget", "price", "negotiable", "each", "respectively", "luminous", "quality", "years", "experience", "and", "the", "for", "near"]);

    const allDbItems = [];
    
    // Vehicles
    if (typeof VEHICLE_DB !== "undefined") {
        for (const cat in VEHICLE_DB) {
            VEHICLE_DB[cat].forEach(name => {
                allDbItems.push({ name, type: `Vehicle (${cat})` });
            });
        }
    }
    // Clothing
    if (typeof CLOTHING_DB !== "undefined") {
        for (const gender in CLOTHING_DB) {
            for (const subcat in CLOTHING_DB[gender]) {
                CLOTHING_DB[gender][subcat].forEach(name => {
                    allDbItems.push({ name, type: `Clothing (${gender} ${subcat})` });
                });
            }
        }
    }
    // Items
    if (typeof ITEMS_DB !== "undefined") {
        for (const cat in ITEMS_DB) {
            ITEMS_DB[cat].forEach(name => {
                allDbItems.push({ name, type: `Item (${cat})` });
            });
        }
    }

    const matchedItems = new Set();
    const resultList = [];

    for (const token of rawTokens) {
        if (stopwords.has(token)) continue;
        
        for (const dbItem of allDbItems) {
            const itemNameLower = dbItem.name.toLowerCase();
            
            // 1. Substring Match
            if (itemNameLower.includes(token) || token.includes(itemNameLower)) {
                if (!matchedItems.has(dbItem.name)) {
                    matchedItems.add(dbItem.name);
                    resultList.push(`- "${dbItem.name}" [Type: ${dbItem.type}]`);
                }
                continue;
            }

            // 2. Fuzzy spelling match
            const dbTokens = itemNameLower.split(/\s+/);
            for (const dbTok of dbTokens) {
                if (dbTok.length >= 3) {
                    const dist = levenshteinDistance(token, dbTok);
                    if (dist <= 2 && dist < Math.max(token.length / 2, 2)) {
                        if (!matchedItems.has(dbItem.name)) {
                            matchedItems.add(dbItem.name);
                            resultList.push(`- "${dbItem.name}" [Type: ${dbItem.type}]`);
                        }
                        break;
                    }
                }
            }
        }
    }

    if (resultList.length === 0) return "";
    return `\nLOCAL SYSTEM DATABASE MATCHES FOUND:\n${resultList.slice(0, 15).join("\n")}\n(IMPORTANT: If the user refers to any matching product or item, you MUST correct it to use the exact spelling from the list of official database matches above)\n`;
}

function getPolicyMatchesContext(rawText) {
    if (typeof POLICY_PAGES === "undefined" || !Array.isArray(POLICY_PAGES)) return "";

    const rawClean = rawText.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const rawTokens = rawClean.split(/\s+/).filter(word => word.length >= 4);
    if (rawTokens.length === 0) return "";

    const stopwords = new Set(["buying", "selling", "trading", "renting", "hiring", "want", "buy", "sell", "trade", "rent", "hire", "with", "budget", "price", "negotiable", "each", "respectively", "luminous", "quality", "years", "experience", "and", "the", "for", "near"]);

    const matchedPages = [];
    const maxMatches = 6; // Keep up to 6 most relevant pages to provide deep context

    for (let i = 0; i < POLICY_PAGES.length; i++) {
        const page = POLICY_PAGES[i];
        const plainText = page.content
            .replace(/<[^>]*>/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, " ")
            .toLowerCase();

        let matchScore = 0;
        for (const token of rawTokens) {
            if (stopwords.has(token)) continue;
            if (plainText.includes(token)) {
                matchScore++;
            }
        }

        if (matchScore > 0) {
            matchedPages.push({
                index: i + 1,
                title: page.title,
                text: page.content.replace(/<[^>]*>/g, " ").trim().substring(0, 2500),
                score: matchScore
            });
        }
    }

    matchedPages.sort((a, b) => b.score - a.score);

    // If no direct matches, load Core General Rules (Page 1) and Prohibited Items (Page 3) as fallbacks
    if (matchedPages.length === 0) {
        if (POLICY_PAGES[0]) {
            matchedPages.push({ index: 1, title: POLICY_PAGES[0].title, text: POLICY_PAGES[0].content.replace(/<[^>]*>/g, " ").trim().substring(0, 2500) });
        }
        if (POLICY_PAGES[2]) {
            matchedPages.push({ index: 3, title: POLICY_PAGES[2].title, text: POLICY_PAGES[2].content.replace(/<[^>]*>/g, " ").trim().substring(0, 2500) });
        }
    }

    const result = matchedPages.slice(0, maxMatches).map(p => {
        return `--- POLICY MANUAL PAGE ${p.index}: ${p.title} ---\n${p.text}...`;
    }).join("\n\n");

    return `\nRELEVANT SECTIONS FROM THE EN3 SYSTEM POLICY MANUAL:\n${result}\n(Ensure that the suggested ad strictly complies with the policy book terms shown above)\n`;
}

function getCompletePolicyContext() {
    if (typeof POLICY_PAGES === "undefined" || !Array.isArray(POLICY_PAGES)) return "";
    return POLICY_PAGES.map((page, idx) => {
        const plainText = page.content
            .replace(/<[^>]*>/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, " ")
            .trim();
        return `=== POLICY PAGE ${idx + 1}: ${page.title} ===\n${plainText}`;
    }).join("\n\n");
}

function getGeminiSparkSuggestion(rawText, category, callback) {
    const keyVal = localStorage.getItem("li_gemini_api_key") || FALLBACK_GEMINI_KEY;
    if (!keyVal) {
        callback(null);
        return;
    }

    const customDirectives = "";
    const dbContext = getDatabaseMatchesContext(rawText);
    const policyContext = getPolicyMatchesContext(rawText);
    const fullPolicyContext = getCompletePolicyContext();
    
    // Build the policy prompt context
    const prompt = `You are a strict and professional advertisement editor for LifeInvader.
Your task is to correct and format the user's raw advertisement input strictly according to the official LifeInvader internal formatting policy:

[CRITICAL GROUNDING DIRECTIVE]:
You MUST strictly correct the ad and reply based ONLY on the provided LifeInvader Internal Policy manual. Do NOT use real-life logic, external facts, standard grammatical conventions, or common sense if they conflict with the policy manual. The provided Policy Manual Reference is the absolute and only source of truth.

### Core Formatting Rules:
1. Always begin the ad with one of these exact action words: "Buying", "Selling", "Trading", "Selling or trading". The first letter must ALWAYS be capitalized.
2. Pricing & Budget Labels:
   - For Buying ads: Use the label "Budget: " (Capital B, followed by a colon). If no price is mentioned, always append "Budget: Negotiable." at the very end.
   - For Selling / Trading / Selling or trading ads: Use the label "Price: " (Capital P, followed by a colon). If no price is mentioned, always append "Price: Negotiable." at the very end.
   - If a specific price is explicitly mentioned in the raw ad, use that exact price (e.g., "$25.000") and do NOT add "Negotiable".
3. Currency & Number Formatting:
   - Always put a dollar sign ($) BEFORE the numerical value (e.g., "$5 Million", not "5 Million$").
   - Capitalize the first letter of "Price", "Budget", and "Negotiable".
   - Use a period (.) instead of a comma (,) as a thousands separator for prices (e.g., "$200.000", not "$200,000").
   - NEVER use "k" or "K" for thousands. Convert it to full numerical digits:
     - "$1k" -> "$1.000"
     - "$1.7k each" -> "$1.700 each."
     - "$1.450k" -> "$1.45 Million."
   - NEVER use lowercase "m" for Millions. Use capital "Million" or "Million.":
     - "$1m" -> "$1 Million"
     - "$38m" -> "$38 Million"
4. Punctuation Rules:
   - Use a full stop/period (.) to end the sentence if it ends with a letter (e.g., "Price: Negotiable.").
   - If the ad ends with a numerical value, do NOT add a period (.) at the very end of the ad (e.g., "Price: $200.000").
   - Capitalize the first letter of brands, official locations, and proper names (First and Last name).
5. Terminology Substitutions:
   - "max config", "max tuning", "fully upgraded" -> "with full configuration"
   - "nearly max", "part lvl3" or below -> "with partial configuration"
   - "body upgrades", "body kit" -> "with visual upgrades"
   - "turbo" -> "turbo kit"
   - "drift tuning", "drift assistance" -> "drift kit"
   - "luminous rims", "unique wheels" -> "luminous wheels"
   - "Unique 6 rims" -> "luminous wheels of type 6"
   - "level 1", "low level" -> "low quality"
   - "level 2", "medium level" -> "medium quality"
   - "level 3", "high level" -> "high quality"
   - "level 4", "max level" -> "max quality"
   - "crates", "cases" -> "containers"
   - "spray cans", "spray balloons" -> "paint cans."
   - "extras" -> "of type" (e.g. "selling mask extras 2" -> "Selling masks of type 2. Price: Negotiable.")
   - "pumpkin", "cabbage", "pineapple", "mandarin" -> combine or use "fruits, vegetables or seeds"
6. Play Dice and Play Poker Rules:
   - If no Bet is specified: Use "Bet: Negotiable."
   - The maximum allowed bet is "$10 Million". Any bet above $10 Million must be changed to "Bet: Negotiable."
7. Format phone numbers in "№ XX-XX-XXX" or "№ XX-XX-XX" format if present.

${customDirectives ? `\nADDITIONAL ADMIN DIRECTIVES:\n${customDirectives}\n` : ""}
${dbContext}
${policyContext}

=========================================
COMPLETE LIFEINVADER OFFICIAL POLICY MANUAL REFERENCE:
${fullPolicyContext}
=========================================

Translate this raw ad input: "${rawText}"
Target category: "${category}"

Response format: Return ONLY a raw JSON object with exactly two keys: "text" (the corrected ad text) and "reason" (the explanation of which rule was applied). Do NOT wrap it in markdown code blocks like \`\`\`json. Just return raw JSON.`;

    geminiPostWithFailover({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    })
    .then(data => {
        trackGeminiAPICall();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        try {
            const parsed = JSON.parse(responseText.trim());
            if (parsed && parsed.text) {
                callback(parsed);
            } else {
                callback(null);
            }
        } catch (e) {
            // Fallback if not JSON
            callback({ text: responseText.trim(), reason: "AI suggestion" });
        }
    })
    .catch(err => {
        console.error("Gemini Suggestion Error:", err);
        callback(null);
    });
}

function getGeminiBugTriageSuggestion(rawText, expectedText, category, screenshotBase64, callback) {
    const keyVal = localStorage.getItem("li_gemini_api_key") || FALLBACK_GEMINI_KEY;
    if (!keyVal) {
        callback(null);
        return;
    }

    const customDirectives = "";
    const dbContext = getDatabaseMatchesContext(rawText);
    const policyContext = getPolicyMatchesContext(rawText);
    const fullPolicyContext = getCompletePolicyContext();
    
    let imagePart = null;
    if (screenshotBase64) {
        let cleanBase64 = screenshotBase64;
        let mimeType = "image/png";
        if (screenshotBase64.includes(",")) {
            mimeType = screenshotBase64.split(",")[0].split(":")[1].split(";")[0];
            cleanBase64 = screenshotBase64.split(",")[1];
        }
        imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: cleanBase64
            }
        };
    }

    const promptText = `You are the chief automated editor and bug resolution system for LifeInvader.
We have a bug report from a user claiming that their advertisement was falsely rejected or formatted incorrectly.

Bug Report Details:
- Raw Ad Input: "${rawText}"
- Target/Correct Category: "${category}"
${expectedText ? `- Expected Output (User's desired fix/claim): "${expectedText}"` : ""}

Task:
1. Scan and analyze ALL 51 pages of the complete LifeInvader Official Policy Manual provided below to ensure absolute compliance with all spelling, terminology, and syntax rules.
2. Automatically generate the exact, fully corrected advertisement text.
3. Explain the main reason for the correction.
4. Generate additional detailed reference notes citing the specific policy manual pages, rules, or lists applied for verification.

=== COMPLETE POLICY MANUAL REFERENCE ===
${fullPolicyContext}
=========================================

${customDirectives ? `\nADDITIONAL ADMIN DIRECTIVES:\n${customDirectives}\n` : ""}

Response format: Return ONLY a raw JSON object with exactly three keys: "text" (the corrected ad text), "reason" (the explanation of which rule was applied), and "notes" (the detailed policy reference notes and page citations). Do NOT wrap it in markdown code blocks like \`\`\`json. Just return raw JSON.`;

    const parts = [{ text: promptText }];
    if (imagePart) {
        parts.push(imagePart);
    }

    geminiPostWithFailover({
        contents: [{ parts: parts }],
        generationConfig: { responseMimeType: "application/json" }
    })
    .then(data => {
        trackGeminiAPICall();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        let cleanText = responseText.trim();
        if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }
        try {
            const parsed = JSON.parse(cleanText.trim());
            if (parsed && parsed.text) {
                callback(parsed);
            } else {
                callback(null);
            }
        } catch (e) {
            callback({ text: responseText.trim(), reason: "AI bug resolution suggestion", notes: "Fallback response parsing" });
        }
    })
    .catch(err => {
        console.error("Gemini Bug Triage Suggestion Error:", err);
        callback(null);
    });
}

function runGeminiCopilotTurn(report, category, userMessageText, callback) {
    const keyVal = localStorage.getItem("li_gemini_api_key") || FALLBACK_GEMINI_KEY;
    if (!keyVal) {
        callback(false, null);
        return;
    }

    if (!report.geminiChatHistory) {
        report.geminiChatHistory = [];
    }

    // If user message is provided, push it to history
    if (userMessageText) {
        const dbContext = getDatabaseMatchesContext(report.rawInput + " " + userMessageText);
        const policyContext = getPolicyMatchesContext(report.rawInput + " " + userMessageText);
        let noteContext = "";
        if (dbContext || policyContext) {
            noteContext = `\n\n(Note: Active system database matches matching current context:\n${dbContext}\n${policyContext})`;
        }
        const textWithContext = userMessageText + noteContext;
        
        const parts = [{ text: textWithContext }];
        let attachmentUrl = null;
        if (report.pendingAttachment) {
            parts.push({
                inlineData: {
                    mimeType: report.pendingAttachment.mimeType,
                    data: report.pendingAttachment.data
                }
            });
            attachmentUrl = report.pendingAttachment.dataUrl;
            report.pendingAttachment = null; // Clear pending attachment
        }

        const msgObj = {
            role: "user",
            parts: parts
        };
        if (attachmentUrl) {
            msgObj.attachmentUrl = attachmentUrl;
        }
        report.geminiChatHistory.push(msgObj);
    } else {
        // First turn - push initial prompt
        report.geminiChatHistory = [];
        const dbContext = getDatabaseMatchesContext(report.rawInput);
        const policyContext = getPolicyMatchesContext(report.rawInput);
        report.geminiChatHistory.push({
            role: "user",
            parts: [{ text: `Raw Ad Input: "${report.rawInput}"\nCategoryContext: "${category}"\n${dbContext}\n${policyContext}` }]
        });
    }

    const customDirectives = "";
    const fullPolicyContext = getCompletePolicyContext();
    const systemPrompt = `You are a strict and professional advertisement editor for LifeInvader.
Your task is to correct and format the user's raw advertisement input strictly according to the official LifeInvader internal formatting policy:

[CRITICAL GROUNDING DIRECTIVE]:
You MUST strictly correct the ad and reply based ONLY on the provided LifeInvader Internal Policy manual. Do NOT use real-life logic, external facts, standard grammatical conventions, or common sense if they conflict with the policy manual. The provided Policy Manual Reference is the absolute and only source of truth.

### Core Formatting Rules:
1. Always begin the ad with one of these exact action words: "Buying", "Selling", "Trading", "Selling or trading". The first letter must ALWAYS be capitalized.
2. Pricing & Budget Labels:
   - For Buying ads: Use the label "Budget: " (Capital B, followed by a colon). If no price is mentioned, always append "Budget: Negotiable." at the very end.
   - For Selling / Trading / Selling or trading ads: Use the label "Price: " (Capital P, followed by a colon). If no price is mentioned, always append "Price: Negotiable." at the very end.
   - If a specific price is explicitly mentioned in the raw ad, use that exact price (e.g., "$25.000") and do NOT add "Negotiable".
3. Currency & Number Formatting:
   - Always put a dollar sign ($) BEFORE the numerical value (e.g., "$5 Million", not "5 Million$").
   - Capitalize the first letter of "Price", "Budget", and "Negotiable".
   - Use a period (.) instead of a comma (,) as a thousands separator for prices (e.g., "$200.000", not "$200,000").
   - NEVER use "k" or "K" for thousands. Convert it to full numerical digits:
     - "$1k" -> "$1.000"
     - "$1.7k each" -> "$1.700 each."
     - "$1.450k" -> "$1.45 Million."
   - NEVER use lowercase "m" for Millions. Use capital "Million" or "Million.":
     - "$1m" -> "$1 Million"
     - "$38m" -> "$38 Million"
4. Punctuation Rules:
   - Use a full stop/period (.) to end the sentence if it ends with a letter (e.g., "Price: Negotiable.").
   - If the ad ends with a numerical value, do NOT add a period (.) at the very end of the ad (e.g., "Price: $200.000").
   - Capitalize the first letter of brands, official locations, and proper names (First and Last name).
5. Terminology Substitutions:
   - "max config", "max tuning", "fully upgraded" -> "with full configuration"
   - "nearly max", "part lvl3" or below -> "with partial configuration"
   - "body upgrades", "body kit" -> "with visual upgrades"
   - "turbo" -> "turbo kit"
   - "drift tuning", "drift assistance" -> "drift kit"
   - "luminous rims", "unique wheels" -> "luminous wheels"
   - "Unique 6 rims" -> "luminous wheels of type 6"
   - "level 1", "low level" -> "low quality"
   - "level 2", "medium level" -> "medium quality"
   - "level 3", "high level" -> "high quality"
   - "level 4", "max level" -> "max quality"
   - "crates", "cases" -> "containers"
   - "spray cans", "spray balloons" -> "paint cans."
   - "extras" -> "of type" (e.g. "selling mask extras 2" -> "Selling masks of type 2. Price: Negotiable.")
   - "pumpkin", "cabbage", "pineapple", "mandarin" -> combine or use "fruits, vegetables or seeds"
6. Play Dice and Play Poker Rules:
   - If no Bet is specified: Use "Bet: Negotiable."
   - The maximum allowed bet is "$10 Million". Any bet above $10 Million must be changed to "Bet: Negotiable."
7. Format phone numbers in "№ XX-XX-XXX" or "№ XX-XX-XX" format if present.

=========================================
COMPLETE LIFEINVADER OFFICIAL POLICY MANUAL REFERENCE:
${fullPolicyContext}
=========================================

${customDirectives ? `\nADDITIONAL ADMIN DIRECTIVES:\n${customDirectives}\n` : ""}

Response format: Return ONLY a raw JSON object with exactly two keys: "text" (the corrected ad text) and "reason" (the explanation of which rule was applied or how the suggestion was updated). Do NOT wrap it in markdown code blocks like \`\`\`json. Just return raw JSON.`;

    geminiPostWithFailover({
        contents: report.geminiChatHistory,
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: { responseMimeType: "application/json" }
    })
    .then(data => {
        trackGeminiAPICall();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        try {
            const parsed = JSON.parse(responseText.trim());
            if (parsed && parsed.text) {
                // Save model response to history
                report.geminiChatHistory.push({
                    role: "model",
                    parts: [{ text: responseText.trim() }]
                });
                callback(true, parsed);
            } else {
                callback(false, null);
            }
        } catch (e) {
            // Fallback
            report.geminiChatHistory.push({
                role: "model",
                parts: [{ text: JSON.stringify({ text: responseText.trim(), reason: "Refined suggestion" }) }]
            });
            callback(true, { text: responseText.trim(), reason: "Refined suggestion" });
        }
    })
    .catch(err => {
        console.error("Gemini Copilot Error:", err);
        callback(false, null);
    });
}

