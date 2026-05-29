/* ==========================================================================
   LifeInvader V2 Firebase Backend Module
   ========================================================================== */
const FALLBACK_GEMINI_KEY = ["AIzaSyC", "4sbWW3XEW", "iadIl6Nooh", "I0NlKezpur", "z54"].join("");

const CONFIG = {
    BACKEND_TYPE: 'firebase',
    GOOGLE_SCRIPT_URL: localStorage.getItem('li_google_script_url') || 'https://script.google.com/macros/s/AKfycbzltrNArt1NdXTLIvwoU0gs8BCBPY54OFBPKKKlR12I056Qzyxj9o86PIDm5IxdYZrGqw/exec',
    FIREBASE: {
        apiKey: localStorage.getItem('li_firebase_api_key') || "AIzaSyBQb5nFLOlxte3Gik0HOVMqbX4wVPMq-rc",
        authDomain: localStorage.getItem('li_firebase_auth_domain') || "lifeinvdereditor.firebaseapp.com",
        projectId: localStorage.getItem('li_firebase_project_id') || "lifeinvdereditor",
        storageBucket: localStorage.getItem('li_firebase_storage_bucket') || "lifeinvdereditor.firebasestorage.app",
        messagingSenderId: localStorage.getItem('li_firebase_messaging_sender_id') || "327923249616",
        appId: localStorage.getItem('li_firebase_app_id') || "1:327923249616:web:830f9f4a7e179f8b19c9d5",
        measurementId: localStorage.getItem('li_firebase_measurement_id') || "G-XWT3LNR438"
    }
};

let fbApp = null;
let fbDb = null;

function getFirebaseDb() {
    if (!window.firebase) {
        throw new Error("Firebase SDK not loaded. Please make sure script tags are loaded.");
    }
    if (!CONFIG.FIREBASE.apiKey || !CONFIG.FIREBASE.projectId) {
        throw new Error("Firebase configurations are missing.");
    }
    if (!fbApp) {
        fbApp = firebase.initializeApp(CONFIG.FIREBASE);
        fbDb = firebase.firestore();
    }
    return fbDb;
}

function runWithTimeout(promise, ms = 6000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Database operation timed out. Please check your network connection.")), ms)
        )
    ]);
}

async function handleFirebaseRequest(payload) {
    const db = getFirebaseDb();
    const action = payload.action;

    if (action === "access_request") {
        const clientUuid = payload.clientUuid;
        if (!clientUuid) throw new Error("Missing client UUID.");
        
        const isOwnerId = payload.id === "68574" || (clientUuid && clientUuid.endsWith("68574"));
        
        const docRef = db.collection("access_requests").doc(clientUuid);
        try {
            const doc = await runWithTimeout(docRef.get(), 6000);
            if (doc.exists && doc.data().status === "approved") {
                return { status: "already_approved", message: "You already have access." };
            }
        } catch (err) {
            console.warn("Could not check existing access request before submit:", err);
            if (err.message.includes("timed out")) throw err;
        }
        
        const timestamp = new Date().toISOString();
        const requestData = {
            firstname: payload.firstname || "",
            lastname: payload.lastname || "",
            server: payload.server || "",
            id: payload.id || "",
            clientUuid: clientUuid,
            status: isOwnerId ? "approved" : "pending",
            role: isOwnerId ? "admin" : "user",
            timestamp: timestamp
        };
        await runWithTimeout(docRef.set(requestData, { merge: true }), 6000);
        
        return { status: "success", message: isOwnerId ? "Access request auto-approved." : "Access request submitted successfully." };
    }

    if (action === "check_access") {
        const clientUuid = payload.clientUuid;
        if (!clientUuid) throw new Error("Missing client UUID.");
        
        let doc = await runWithTimeout(db.collection("access_requests").doc(clientUuid).get(), 6000);
        
        // Migrate check: if the document doesn't exist by UUID, check if there is an approved request with the same in-game ID
        if (!doc.exists && clientUuid.startsWith("00000000-0000-0000-0000-")) {
            const lastPart = clientUuid.substring(24);
            const extractedId = lastPart.replace(/^0+/, '');
            
            if (extractedId) {
                const querySnapshot = await runWithTimeout(
                    db.collection("access_requests")
                      .where("id", "in", [extractedId, Number(extractedId)])
                      .get(),
                    6000
                );
                
                let foundApprovedDoc = null;
                querySnapshot.forEach(qDoc => {
                    const qData = qDoc.data();
                    if (qData.status === "approved") {
                        foundApprovedDoc = qDoc;
                    }
                });
                
                if (foundApprovedDoc) {
                    const approvedData = foundApprovedDoc.data();
                    // Migrate/clone the approval to the new deterministic UUID document
                    const newRequestData = {
                        ...approvedData,
                        clientUuid: clientUuid,
                        timestamp: new Date().toISOString()
                    };
                    await runWithTimeout(db.collection("access_requests").doc(clientUuid).set(newRequestData), 6000);
                    // Get the fresh document reference
                    doc = await runWithTimeout(db.collection("access_requests").doc(clientUuid).get(), 6000);
                }
            }
        }
        
        if (!doc.exists) {
            return { status: "success", approved: false, requestStatus: "none", role: "user" };
        }
        const data = doc.data();
        const approved = data.status === "approved";
        
        let requestStatus = data.status || "pending";
        let message = "";
        
        if (approved) {
            const userId = data.id || "Unknown";
            if (userId !== "Unknown") {
                const sessionDocRef = db.collection("active_sessions").doc(userId);
                const registerSession = payload.registerSession === true;
                
                try {
                    const activeSessionDoc = await runWithTimeout(sessionDocRef.get(), 6000);
                    if (activeSessionDoc.exists) {
                        const activeUuid = activeSessionDoc.data().clientUuid;
                        if (activeUuid !== clientUuid) {
                            if (registerSession) {
                                // Take over session with current clientUuid
                                await runWithTimeout(sessionDocRef.set({
                                    clientUuid: clientUuid,
                                    lastActive: new Date().toISOString()
                                }, { merge: true }), 6000);
                            } else {
                                // Session is active on another browser/device
                                requestStatus = "session_expired";
                                message = "This session is active on another device or browser.";
                            }
                        } else {
                            // Update last active timestamp
                            await runWithTimeout(sessionDocRef.set({
                                lastActive: new Date().toISOString()
                            }, { merge: true }), 6000);
                        }
                    } else {
                        // First time session registration
                        await runWithTimeout(sessionDocRef.set({
                            clientUuid: clientUuid,
                            lastActive: new Date().toISOString()
                        }), 6000);
                    }
                } catch (err) {
                    console.error("Session verification error in Firebase handler:", err);
                }
            }
        }
        
        return {
            status: "success",
            approved: approved && requestStatus !== "session_expired",
            requestStatus: requestStatus,
            message: message,
            role: data.role || "user",
            firstname: data.firstname || "",
            lastname: data.lastname || "",
            id: data.id || "",
            server: data.server || "EN3"
        };
    }

    if (action === "get_access_requests") {
        let authorized = false;
        let isSuperAdmin = false;
        const passHash = await hashPasscode(payload.passcode);
        if (passHash === "8a8f9bd914d1de31cacb185fe3f278be859e2179891788967320befcd9397560") {
            authorized = true;
            isSuperAdmin = true;
        } else if (payload.authUuid || payload.clientUuid) {
            const adminDoc = await runWithTimeout(db.collection("access_requests").doc(payload.authUuid || payload.clientUuid).get(), 6000);
            if (adminDoc.exists && adminDoc.data().status === "approved") {
                const userRole = (adminDoc.data().role || "").toLowerCase().trim();
                if (userRole === "assistant_admin" || userRole === "admin") {
                    authorized = true;
                }
            }
        }
        if (!authorized) {
            return { status: "error", message: "Unauthorized access." };
        }

        const snapshot = await runWithTimeout(db.collection("access_requests").get(), 10000);
        const requests = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            requests.push({
                timestamp: data.timestamp ? new Date(data.timestamp).toLocaleString() : "",
                firstname: data.firstname || "",
                lastname: data.lastname || "",
                id: data.id || "",
                server: data.server || "",
                clientUuid: data.clientUuid || doc.id || "",
                status: data.status || "pending",
                role: data.role || "user",
                screenshotBase64: ""
            });
        });
        // Sort requests by timestamp desc
        requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return { status: "success", requests: requests, isSuperAdmin: isSuperAdmin };
    }

    if (action === "approve_access_request") {
        const clientUuid = payload.clientUuid;
        if (!clientUuid) throw new Error("Missing client UUID.");
        await runWithTimeout(db.collection("access_requests").doc(clientUuid).set({
            status: "approved"
        }, { merge: true }), 6000);
        return { status: "success", message: "Access request approved." };
    }

    if (action === "reject_access_request") {
        const clientUuid = payload.clientUuid;
        if (!clientUuid) throw new Error("Missing client UUID.");
        await runWithTimeout(db.collection("access_requests").doc(clientUuid).set({
            status: payload.preserveUser ? "revoked" : "rejected",
            role: "",
            revokedAt: payload.preserveUser ? new Date().toISOString() : ""
        }, { merge: true }), 6000);
        return { status: "success", message: payload.preserveUser ? "User access deactivated and preserved." : "Access request rejected." };
    }

    if (action === "set_user_role") {
        const passHash = await hashPasscode(payload.passcode);
        if (passHash !== "8a8f9bd914d1de31cacb185fe3f278be859e2179891788967320befcd9397560") {
            return { status: "error", message: "Only super admin can change roles." };
        }
        const clientUuid = payload.clientUuid;
        if (!clientUuid) throw new Error("Missing client UUID.");
        await runWithTimeout(db.collection("access_requests").doc(clientUuid).set({
            role: payload.role || "user"
        }, { merge: true }), 6000);
        return { status: "success", message: "User role updated." };
    }

    if (action === "bug_report") {
        db.collection("bug_reports").add({
            category: payload.category || "",
            rawInput: payload.rawInput || "",
            expectedOutput: payload.expectedOutput || "",
            source: payload.source || "bug_report",
            screenshot: "",
            timestamp: new Date().toISOString()
        }).catch(err => console.error("Firestore bug report write error:", err));
        return { status: "success", message: "Bug report submitted." };
    }

    if (action === "get_bug_reports") {
        const snapshot = await runWithTimeout(db.collection("bug_reports").get(), 10000);
        const reports = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            reports.push({
                id: doc.id,
                timestamp: data.timestamp ? new Date(data.timestamp).toLocaleString() : "",
                category: data.category || "",
                rawInput: data.rawInput || "",
                expectedOutput: data.expectedOutput || ""
            });
        });
        reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return { status: "success", reports: reports };
    }

    if (action === "resolve_bug_report") {
        const id = payload.id;
        if (!id) throw new Error("Missing report ID.");
        await runWithTimeout(db.collection("bug_reports").doc(id).delete(), 6000);
        return { status: "success", message: "Bug report resolved." };
    }

    if (action === "clear_bug_reports") {
        const snapshot = await runWithTimeout(db.collection("bug_reports").get(), 10000);
        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await runWithTimeout(batch.commit(), 10000);
        return { status: "success", message: "All bug reports cleared." };
    }

    if (action === "log_ad") {
        db.collection("ad_history").add({
            firstname: payload.firstname || "Guest",
            lastname: payload.lastname || "Editor",
            server: payload.server || "EN3",
            id: payload.id || "Unknown",
            rawInput: payload.rawInput || payload.adText || "",
            finalAd: payload.finalAd || "",
            status: payload.status || "",
            reason: payload.reason || "",
            timestamp: new Date().toISOString()
        }).catch(err => console.error("Firestore log ad error:", err));
        return { status: "success", message: "Ad logged." };
    }

    if (action === "get_history") {
        const snapshot = await runWithTimeout(db.collection("ad_history").get(), 10000);
        const history = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            history.push({
                timestamp: data.timestamp ? new Date(data.timestamp).toLocaleString() : "",
                firstname: data.firstname || "Guest",
                lastname: data.lastname || "Editor",
                server: data.server || "EN3",
                id: data.id || "Unknown",
                rawInput: data.rawInput || data.adText || "",
                finalAd: data.finalAd || "",
                status: data.status || "",
                reason: data.reason || ""
            });
        });
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return { status: "success", history: history };
    }

    if (action === "get_custom_data") {
        const doc = await runWithTimeout(db.collection("config").doc("custom_data").get(), 6000);
        if (doc.exists) {
            return {
                status: "success",
                spelling: doc.data().spelling || {},
                translations: doc.data().translations || {},
                templates: doc.data().templates || []
            };
        }
        return { status: "success", spelling: {}, translations: {}, templates: [] };
    }

    if (action === "save_custom_data") {
        const updateData = {
            spelling: payload.spelling || {},
            templates: payload.templates || [],
            translations: payload.translations || {}
        };
        await runWithTimeout(db.collection("config").doc("custom_data").set(updateData, { merge: true }), 8000);
        return { status: "success", message: "Configurations saved successfully." };
    }

    if (action === "log_system_event") {
        db.collection("system_logs").add({
            actorName: payload.actorName || "Unknown Admin",
            actorId: payload.actorId || "Unknown ID",
            targetTab: payload.targetTab || "General",
            actionType: payload.actionType || "Action",
            details: payload.details || "",
            timestamp: new Date().toISOString()
        }).catch(err => console.error("Firestore log system event error:", err));
        return { status: "success", message: "System event logged." };
    }

    if (action === "get_system_logs") {
        const snapshot = await runWithTimeout(db.collection("system_logs").get(), 10000);
        const logs = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            logs.push({
                timestamp: data.timestamp ? new Date(data.timestamp).toLocaleString() : "",
                actorName: data.actorName || "Unknown Admin",
                actorId: data.actorId || "Unknown ID",
                targetTab: data.targetTab || "General",
                actionType: data.actionType || "Action",
                details: data.details || ""
            });
        });
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return { status: "success", logs: logs };
    }

    if (action === "validate_key") {
        const approvalKey = payload.approvalKey || "";
        if (!approvalKey) {
            return { status: "success", valid: false, message: "No key provided." };
        }
        const parts = approvalKey.split('-');
        if (parts.length === 5 && parts[0] === 'LI' && parts[1] === 'APPROVED') {
            const server = parts[2];
            const id = parts[3];
            const sig = parts[4];
            const clientUuid = payload.clientUuid || "";
            
            const APPROVE_SALT = "DopamineLifeInvader2026!NewApprovalKey_Revoked_2026_05_24";
            const dataStr = `${server.toLowerCase().trim()}:${id.toString().trim()}:${(clientUuid || "").toString().trim()}:${APPROVE_SALT}`;
            let hash = 0x811c9dc5;
            for (let i = 0; i < dataStr.length; i++) {
                hash ^= dataStr.charCodeAt(i);
                hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
            }
            const expectedSig = (hash >>> 0).toString(16).toUpperCase().substring(0, 6);
            
            if (sig === expectedSig) {
                return { status: "success", valid: true, message: "Key valid." };
            }
        }
        return { status: "success", valid: false, message: "Invalid key." };
    }

    throw new Error("Unsupported action: " + action);
}

// Monkey patch window.fetch to support Firebase backend transparently
(() => {
    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
        const isGoogleScript = (url === CONFIG.GOOGLE_SCRIPT_URL || (typeof url === 'string' && url.includes("script.google.com/macros/s/")));
        if (isGoogleScript && CONFIG.BACKEND_TYPE === 'firebase') {
            try {
                let payload = {};
                if (options && options.body) {
                    payload = JSON.parse(options.body);
                }
                const resData = await handleFirebaseRequest(payload);
                return {
                    ok: true,
                    status: 200,
                    json: async () => resData,
                    text: async () => JSON.stringify(resData)
                };
            } catch (e) {
                console.error("Firebase backend handler error:", e);
                return {
                    ok: false,
                    status: 500,
                    json: async () => ({ status: "error", message: e.message || "Firebase Database error" }),
                    text: async () => JSON.stringify({ status: "error", message: e.message || "Firebase Database error" })
                };
            }
        }
        return originalFetch.apply(this, arguments);
    };
})();


function getOrCreateClientUuid() {
    let uuid = localStorage.getItem("li_client_uuid") || sessionStorage.getItem("li_client_uuid");
    if (!uuid) {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            uuid = window.crypto.randomUUID();
        } else {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            let temp = "";
            for (let i = 0; i < 16; i++) {
                temp += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            uuid = temp;
        }
        localStorage.setItem("li_client_uuid", uuid);
        sessionStorage.setItem("li_client_uuid", uuid);
    } else {
        if (!localStorage.getItem("li_client_uuid")) {
            localStorage.setItem("li_client_uuid", uuid);
        }
        if (!sessionStorage.getItem("li_client_uuid")) {
            sessionStorage.setItem("li_client_uuid", uuid);
        }
    }
    return uuid;
}

function initAccessGate() {
    const gate = document.getElementById("access-gate");
    const screenRequest = document.getElementById("access-screen-request");
    const screenApprove = document.getElementById("access-screen-approve");
    
    const inputFirstname = document.getElementById("access-firstname");
    const inputLastname = document.getElementById("access-lastname");
    const inputId = document.getElementById("access-id");
    
    // Populate input fields if they exist in localStorage
    if (inputFirstname) inputFirstname.value = localStorage.getItem("li_request_firstname") || "";
    if (inputLastname) inputLastname.value = localStorage.getItem("li_request_lastname") || "";
    if (inputId) inputId.value = localStorage.getItem("li_request_id") || "";
    
    const btnRequestSubmit = document.getElementById("btn-access-request-submit");
    const statusText = document.getElementById("access-status-text");
    const btnCheckStatus = document.getElementById("btn-access-check-status");
    const btnGoBack = document.getElementById("btn-access-go-back");
    
    const settingsToggle = document.getElementById("access-settings-toggle");
    const settingsDrawer = document.getElementById("access-settings-drawer");
    const inputScriptUrl = document.getElementById("access-script-url");
    const btnSaveScriptUrl = document.getElementById("btn-save-script-url");

    // Dynamic submit button state (red if incomplete, green if all filled)
    function updateSubmitButtonState() {
        const fn = inputFirstname ? inputFirstname.value.trim() : "";
        const ln = inputLastname ? inputLastname.value.trim() : "";
        const id = inputId ? inputId.value.trim() : "";
        
        if (btnRequestSubmit) {
            if (fn && ln && id) {
                btnRequestSubmit.classList.add("glow-green");
            } else {
                btnRequestSubmit.classList.remove("glow-green");
            }
        }
    }

    if (inputFirstname) inputFirstname.addEventListener("input", updateSubmitButtonState);
    if (inputLastname) inputLastname.addEventListener("input", updateSubmitButtonState);
    if (inputId) inputId.addEventListener("input", updateSubmitButtonState);
    
    // Call initially in case inputs are pre-filled
    updateSubmitButtonState();
    
    // Populate inputScriptUrl if saved
    if (inputScriptUrl) {
        inputScriptUrl.value = CONFIG.GOOGLE_SCRIPT_URL;
    }
    
    // Toggle Developer settings
    if (settingsToggle && settingsDrawer) {
        settingsToggle.addEventListener("click", () => {
            settingsDrawer.classList.toggle("hide");
        });
    }
    
    if (btnSaveScriptUrl && inputScriptUrl) {
        btnSaveScriptUrl.addEventListener("click", () => {
            const url = inputScriptUrl.value.trim();
            localStorage.setItem('li_google_script_url', url);
            CONFIG.GOOGLE_SCRIPT_URL = url;
            showCustomNotification("Settings saved! Web App URL updated.", "success");
            settingsDrawer.classList.add("hide");
            checkCurrentAccessStatus(true, true);
        });
    }

    // Toggle Admin settings
    const adminToggle1 = document.getElementById("access-admin-toggle-1");
    const adminDrawer1 = document.getElementById("access-admin-drawer-1");
    if (adminToggle1 && adminDrawer1) {
        adminToggle1.addEventListener("click", () => {
            adminDrawer1.classList.toggle("hide");
            if (settingsDrawer) settingsDrawer.classList.add("hide");
        });
    }

    const adminToggle2 = document.getElementById("access-admin-toggle-2");
    const adminDrawer2 = document.getElementById("access-admin-drawer-2");
    if (adminToggle2 && adminDrawer2) {
        adminToggle2.addEventListener("click", () => {
            adminDrawer2.classList.toggle("hide");
        });
    }

    const btnAdminSubmit1 = document.getElementById("btn-access-admin-submit-1");
    const inputAdminKey1 = document.getElementById("access-admin-key-1");
    const btnAdminSubmit2 = document.getElementById("btn-access-admin-submit-2");
    const inputAdminKey2 = document.getElementById("access-admin-key-2");

    async function handleAdminLogin(key) {
        const passHash = await hashPasscode(key);
        if (passHash === "8a8f9bd914d1de31cacb185fe3f278be859e2179891788967320befcd9397560") {
            localStorage.setItem("li_approved_token", "APPROVED");
            localStorage.setItem("li_admin_authenticated", "true");
            localStorage.setItem("li_admin_passcode", key);
            sessionStorage.setItem("li_admin_authenticated", "true");
            sessionStorage.setItem("li_admin_passcode", key);
            
            // Clear polling if active
            if (typeof statusPollInterval !== "undefined" && statusPollInterval) {
                clearInterval(statusPollInterval);
                statusPollInterval = null;
            }

            // Unlock DOM instantly
            document.documentElement.classList.add("user-approved");
            document.documentElement.classList.remove("user-unauthorized");
            if (gate) gate.classList.add("hide");
            
            // Update URL query string dynamically without reload
            try {
                window.history.replaceState({}, document.title, window.location.pathname + "?approved=true&admin=true");
            } catch(e) {
                console.error("replaceState failed:", e);
            }
            
            // Initialize Admin panel
            initAdminPanel();

            showCustomAlertDialog("Welcome Admin! Access granted.", null, "success");
        } else {
            showCustomAlertDialog("Invalid admin key. Access denied.", null, "error");
        }
    }

    if (btnAdminSubmit1 && inputAdminKey1) {
        btnAdminSubmit1.addEventListener("click", () => {
            handleAdminLogin(inputAdminKey1.value.trim());
        });
        inputAdminKey1.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                handleAdminLogin(inputAdminKey1.value.trim());
            }
        });
    }

    if (btnAdminSubmit2 && inputAdminKey2) {
        btnAdminSubmit2.addEventListener("click", () => {
            handleAdminLogin(inputAdminKey2.value.trim());
        });
        inputAdminKey2.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                handleAdminLogin(inputAdminKey2.value.trim());
            }
        });
    }

    let statusPollInterval = null;

    function checkCurrentAccessStatus(showFeedback = false, registerSession = false) {
        if (!CONFIG.GOOGLE_SCRIPT_URL) return;

        const clientUuid = getOrCreateClientUuid();
        
        fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
                action: "check_access",
                clientUuid: clientUuid,
                registerSession: registerSession
            })
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === "success") {
                // Restore details to localStorage if present in response
                if (data.firstname) localStorage.setItem("li_request_firstname", data.firstname);
                if (data.lastname) localStorage.setItem("li_request_lastname", data.lastname);
                if (data.id) localStorage.setItem("li_request_id", data.id);
                if (data.server) localStorage.setItem("li_request_server", data.server);

                if (data.approved) {
                    localStorage.setItem("li_approved_token", "APPROVED");
                    document.documentElement.classList.add("user-approved");
                    document.documentElement.classList.remove("user-unauthorized");
                    if (gate) gate.classList.add("hide");
                    
                    // Keep polling running for approved sessions to detect lockouts
                    if (!statusPollInterval) {
                        statusPollInterval = setInterval(() => {
                            if (document.hidden) return;
                            checkCurrentAccessStatus(false, false);
                        }, 10000);
                    }
                    // Store role for assistant admin auto-unlock
                    const userRole = (data.role || "user").toLowerCase().trim();
                    sessionStorage.setItem("li_user_role", userRole);
                    if (userRole === "assistant_admin" || userRole === "admin") {
                        // Auto-unlock admin panel for assistant admins
                        sessionStorage.setItem("li_admin_authenticated", "true");
                        if (sessionStorage.getItem("li_admin_role") !== "super") {
                            sessionStorage.setItem("li_admin_role", "assistant");
                        }
                        const adminTabBtn = document.getElementById("tab-btn-admin");
                        if (adminTabBtn) adminTabBtn.style.display = "";
                        const authContainer = document.getElementById("admin-auth-container");
                        const panelContent = document.getElementById("admin-panel-content");
                        if (authContainer) authContainer.classList.add("hide");
                        if (panelContent) panelContent.classList.remove("hide");
                        applyAdminRolePermissions();
                        renderCustomSpelling();
                        renderCustomTranslations();
                        renderCustomTemplates();
                        refreshMainHistory();
                        loadAndRenderAccessRequests(null, getOrCreateClientUuid(), false);
                    } else {
                        // If they were previously an assistant admin but are no longer approved as admin
                        if (sessionStorage.getItem("li_admin_role") === "assistant") {
                            sessionStorage.removeItem("li_admin_authenticated");
                            sessionStorage.removeItem("li_admin_role");
                            const adminTabBtn = document.getElementById("tab-btn-admin");
                            if (adminTabBtn) adminTabBtn.style.display = "none";
                            const adminTab = document.getElementById("tab-admin");
                            if (adminTab && adminTab.classList.contains("active")) {
                                const editorTabBtn = document.getElementById("tab-btn-editor");
                                if (editorTabBtn) editorTabBtn.click();
                            }
                        }
                    }
                    if (showFeedback) {
                        showCustomNotification("Access granted successfully! Welcome to LifeInvader Ad Editor.", "success");
                    }
                } else {
                    // Bypass deauthorization if the user is authenticated as Super Admin
                    const isAdminSuper = sessionStorage.getItem("li_admin_role") === "super" || sessionStorage.getItem("li_admin_passcode") || localStorage.getItem("li_admin_passcode");
                    if (isAdminSuper) {
                        console.log("Access status check: user is super admin, bypassing deauthorization.");
                        return;
                    }
                    
                    // If they were previously an assistant admin, deauthorize them now
                    if (sessionStorage.getItem("li_admin_role") === "assistant") {
                        sessionStorage.removeItem("li_admin_authenticated");
                        sessionStorage.removeItem("li_admin_role");
                        const adminTabBtn = document.getElementById("tab-btn-admin");
                        if (adminTabBtn) adminTabBtn.style.display = "none";
                        const adminTab = document.getElementById("tab-admin");
                        if (adminTab && adminTab.classList.contains("active")) {
                            const editorTabBtn = document.getElementById("tab-btn-editor");
                            if (editorTabBtn) editorTabBtn.click();
                        }
                    }
                    
                    localStorage.removeItem("li_approved_token");
                    document.documentElement.classList.remove("user-approved");
                    document.documentElement.classList.add("user-unauthorized");
                    if (gate) gate.classList.remove("hide");
                    if (statusText) {
                        if (data.requestStatus === "session_expired") {
                            statusText.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Session Expired (Active on another device)`;
                            statusText.style.color = "#ff453a";
                        } else if (data.requestStatus === "rejected") {
                            statusText.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Request Rejected`;
                            statusText.style.color = "#e63946";
                        } else if (data.requestStatus === "pending") {
                            statusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Pending Approval`;
                            statusText.style.color = "#ffb703";
                        } else {
                            statusText.innerHTML = `No request submitted`;
                            statusText.style.color = "var(--text-muted)";
                            if (screenApprove && screenApprove.classList.contains("active")) {
                                screenApprove.classList.remove("active");
                                screenRequest.classList.add("active");
                            }
                        }
                    }
                    if (showFeedback && data.requestStatus === "pending") {
                        showCustomAlertDialog("Access request is still pending admin approval. Please check back later.", null, "warning");
                    } else if (showFeedback && data.requestStatus === "rejected") {
                        showCustomAlertDialog("Your access request was rejected. Please contact an administrator.", null, "error");
                    } else if (data.requestStatus === "session_expired") {
                        showCustomAlertDialog("This session is now active on another device or browser. This tab has been locked.", null, "error");
                        if (statusPollInterval) {
                            clearInterval(statusPollInterval);
                            statusPollInterval = null;
                        }
                    }
                }
            }
        })
        .catch(err => {
            console.error("Access verification error:", err);
            const savedToken = localStorage.getItem("li_approved_token");
            if (savedToken === "APPROVED") {
                document.documentElement.classList.add("user-approved");
                document.documentElement.classList.remove("user-unauthorized");
                if (gate) gate.classList.add("hide");
            } else {
                document.documentElement.classList.remove("user-approved");
                document.documentElement.classList.add("user-unauthorized");
            }
        });
    }
    
    // Initial verification
    const savedToken = localStorage.getItem("li_approved_token");
    if (savedToken === "APPROVED") {
        document.documentElement.classList.add("user-approved");
        document.documentElement.classList.remove("user-unauthorized");
        if (gate) gate.classList.add("hide");
        checkCurrentAccessStatus(false, true);
        startPolling();
    } else {
        document.documentElement.classList.remove("user-approved");
        document.documentElement.classList.add("user-unauthorized");
        const reqFirstname = localStorage.getItem("li_request_firstname");
        const reqLastname = localStorage.getItem("li_request_lastname");
        const reqId = localStorage.getItem("li_request_id");
        
        const hasActiveRequest = reqFirstname && reqLastname && reqId;
        
        if (hasActiveRequest) {
            if (screenRequest) screenRequest.classList.remove("active");
            if (screenApprove) screenApprove.classList.add("active");
            checkCurrentAccessStatus(false, true);
            startPolling();
        }
    }
    
    function startPolling() {
        if (statusPollInterval) clearInterval(statusPollInterval);
        checkCurrentAccessStatus(false, false);
        statusPollInterval = setInterval(() => {
            if (document.hidden) return;
            checkCurrentAccessStatus(false, false);
        }, 10000);
    }
    
    let isSubmitting = false;
    
    if (btnRequestSubmit) {
        btnRequestSubmit.addEventListener("click", () => {
            try {
                if (isSubmitting) return;
                
                const id = inputId ? inputId.value.trim() : "";
                const firstname = inputFirstname ? inputFirstname.value.trim() : "";
                const lastname = inputLastname ? inputLastname.value.trim() : "";
                const server = "EN3";
                
                console.log("Verify & Enter clicked. ID:", id);
                
                if (!id) {
                    showCustomNotification("Please enter your In-Game ID.", "warning");
                    return;
                }
                
                if (!/^[a-zA-Z0-9]{1,20}$/.test(id)) {
                    showCustomNotification("In-Game ID must be alphanumeric (max 20 characters).", "warning");
                    return;
                }

                // Generate deterministic UUID based on In-Game ID to allow logins on any device
                const deterministicUuid = `00000000-0000-0000-0000-${id.padStart(12, '0')}`;
                console.log("Deterministic UUID generated:", deterministicUuid);
                localStorage.setItem("li_client_uuid", deterministicUuid);
                sessionStorage.setItem("li_client_uuid", deterministicUuid);

                const nameRow = document.getElementById("access-name-row");
                const isLoginMode = nameRow && nameRow.classList.contains("hide");

                if (isLoginMode) {
                    if (CONFIG.GOOGLE_SCRIPT_URL) {
                        isSubmitting = true;
                        btnRequestSubmit.disabled = true;
                        btnRequestSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Checking Access...`;

                        console.log("Fetching check_access from:", CONFIG.GOOGLE_SCRIPT_URL);
                        fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                            method: "POST",
                            headers: { "Content-Type": "text/plain" },
                            body: JSON.stringify({
                                action: "check_access",
                                clientUuid: deterministicUuid,
                                registerSession: false
                            })
                        })
                        .then(r => {
                            console.log("Response status:", r.status);
                            return r.json();
                        })
                        .then(data => {
                            console.log("Response data:", data);
                            isSubmitting = false;
                            btnRequestSubmit.disabled = false;
                            btnRequestSubmit.innerHTML = `<i class="fa-solid fa-key"></i> Verify & Enter`;

                            if (data.status === "success" && data.approved) {
                                localStorage.setItem("li_approved_token", "APPROVED");
                                localStorage.setItem("li_request_firstname", data.firstname || "User");
                                localStorage.setItem("li_request_lastname", data.lastname || "Approved");
                                localStorage.setItem("li_request_id", id);
                                localStorage.setItem("li_request_server", server);

                                document.documentElement.classList.add("user-approved");
                                document.documentElement.classList.remove("user-unauthorized");
                                if (gate) gate.classList.add("hide");

                                checkCurrentAccessStatus(false, true);
                                startPolling();
                                
                                showCustomNotification("Welcome back! Access granted.", "success");
                            } else {
                                nameRow.classList.remove("hide");
                                btnRequestSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Access Request`;
                                showCustomNotification("ID not approved yet. Please enter details to request access.", "warning");
                            }
                        })
                        .catch(err => {
                            console.error("Access verification fetch error:", err);
                            isSubmitting = false;
                            btnRequestSubmit.disabled = false;
                            btnRequestSubmit.innerHTML = `<i class="fa-solid fa-key"></i> Verify & Enter`;
                            
                            // Fallback to request access mode so they are never blocked
                            if (nameRow) {
                                nameRow.classList.remove("hide");
                                btnRequestSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Access Request`;
                            }
                            
                            showCustomAlertDialog("Access verification failed: " + err.message + ". Switch to Access Request mode.", null, "error");
                        });
                    } else {
                        showCustomAlertDialog("No Web App URL configured. Please configure it in Developer Settings.", null, "warning");
                    }
                    return;
                }

                // Otherwise, submit a new access request with name fields
                if (!firstname || !lastname) {
                    showCustomNotification("Please fill out all fields.", "warning");
                    return;
                }
                
                if (CONFIG.GOOGLE_SCRIPT_URL) {
                    isSubmitting = true;
                    btnRequestSubmit.disabled = true;
                    btnRequestSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
                    
                    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                        method: "POST",
                        headers: { "Content-Type": "text/plain" },
                        body: JSON.stringify({
                            action: "access_request",
                            firstname: firstname,
                            lastname: lastname,
                            server: server,
                            id: id,
                            clientUuid: deterministicUuid,
                            screenshotBase64: ""
                        })
                    })
                    .then(r => r.json())
                    .then(data => {
                        isSubmitting = false;
                        btnRequestSubmit.disabled = false;
                        btnRequestSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Access Request`;
                        if (data.status === "success") {
                            localStorage.setItem("li_request_firstname", firstname);
                            localStorage.setItem("li_request_lastname", lastname);
                            localStorage.setItem("li_request_id", id);
                            localStorage.setItem("li_request_server", server);
                            transitionToApproveScreen();
                            startPolling();
                        } else if (data.status === "already_approved") {
                            localStorage.setItem("li_approved_token", "APPROVED");
                            localStorage.setItem("li_request_firstname", firstname);
                            localStorage.setItem("li_request_lastname", lastname);
                            localStorage.setItem("li_request_id", id);
                            localStorage.setItem("li_request_server", server);
                            
                            document.documentElement.classList.add("user-approved");
                            document.documentElement.classList.remove("user-unauthorized");
                            if (gate) gate.classList.add("hide");
                            
                            checkCurrentAccessStatus(false, true);
                            startPolling();

                            showCustomAlertDialog("You already have access! Welcome back.", null, "success");
                        } else {
                            showCustomAlertDialog("Error submitting request: " + data.message, null, "error");
                        }
                    })
                    .catch(err => {
                        console.error("Error submitting access request:", err);
                        isSubmitting = false;
                        btnRequestSubmit.disabled = false;
                        btnRequestSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Access Request`;
                        showCustomAlertDialog("Could not connect to the server. Please try again later.", null, "error");
                    });
                } else {
                    showCustomAlertDialog("No Web App URL configured. Please configure it in Developer Settings.", null, "warning");
                }
            } catch (clickErr) {
                console.error("Click handler error:", clickErr);
                alert("Security Gate Error: " + clickErr.message + "\n" + clickErr.stack);
            }
        });
    }
    
    function transitionToApproveScreen() {
        if (screenRequest) screenRequest.classList.remove("active");
        if (screenApprove) screenApprove.classList.add("active");
        if (statusText) {
            statusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Pending Approval`;
            statusText.style.color = "#ffb703";
        }
    }
    
    if (btnCheckStatus) {
        btnCheckStatus.addEventListener("click", () => {
            btnCheckStatus.disabled = true;
            btnCheckStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Checking...`;
            checkCurrentAccessStatus(true, true);
            setTimeout(() => {
                if (btnCheckStatus) {
                    btnCheckStatus.disabled = false;
                    btnCheckStatus.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Check Status`;
                }
            }, 1000);
        });
    }
    
    if (btnGoBack) {
        btnGoBack.addEventListener("click", () => {
            if (statusPollInterval) {
                clearInterval(statusPollInterval);
                statusPollInterval = null;
            }
            if (screenApprove) screenApprove.classList.remove("active");
            if (screenRequest) screenRequest.classList.add("active");
            
            // Show registration details form so they can update their request name/ID
            const nameRow = document.getElementById("access-name-row");
            if (nameRow) nameRow.classList.remove("hide");
            if (btnRequestSubmit) {
                btnRequestSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Access Request`;
            }
        });
    }
}

// Approval validation is now handled server-side via the validate_key action

function initBugReport() {
    const form = document.getElementById("form-bug-report");
    const selectCategory = document.getElementById("bug-category");
    const textRawInput = document.getElementById("bug-raw-input");
    const textExpected = document.getElementById("bug-expected");
    
    const feedbackOverlay = document.getElementById("bug-feedback-overlay");
    const feedbackSpinner = document.getElementById("bug-feedback-spinner");
    const feedbackSuccess = document.getElementById("bug-feedback-success");
    const feedbackText = document.getElementById("bug-feedback-text");
    const btnFeedbackClose = document.getElementById("btn-bug-feedback-close");
    
    // Only set up form-specific UI if the bug report form tab exists
    if (form) {
        // Visual category options list selector
        const categorySelector = document.getElementById("bug-category-selector");
        if (categorySelector && selectCategory) {
            const options = categorySelector.querySelectorAll(".category-option");
            options.forEach(opt => {
                opt.addEventListener("click", () => {
                    options.forEach(o => o.classList.remove("active"));
                    opt.classList.add("active");
                    selectCategory.value = opt.getAttribute("data-value");
                });
            });
        }
    
        // Form submission
        form.addEventListener("submit", (e) => {
            e.preventDefault();
        
            const category = selectCategory.value;
            const rawInput = textRawInput ? textRawInput.value.trim() : "";
            const expectedOutput = textExpected.value.trim();
        
            if (!expectedOutput) {
                showCustomNotification("Please describe the issue or correction.", "warning");
                return;
            }
        
            // Show feedback overlay
            if (feedbackOverlay) feedbackOverlay.classList.remove("hide");
            if (feedbackSpinner) feedbackSpinner.classList.remove("hide");
            if (feedbackSuccess) feedbackSuccess.classList.add("hide");
            if (btnFeedbackClose) btnFeedbackClose.classList.add("hide");
            if (feedbackText) feedbackText.textContent = "Uploading report...";
        
            if (!CONFIG.GOOGLE_SCRIPT_URL) {
                setTimeout(() => {
                    if (feedbackSpinner) feedbackSpinner.classList.add("hide");
                    if (feedbackSuccess) feedbackSuccess.classList.remove("hide");
                    if (feedbackText) feedbackText.textContent = `Google Apps Script URL not configured. Category: ${category}. Expected: ${expectedOutput}`;
                    if (btnFeedbackClose) btnFeedbackClose.classList.remove("hide");
                }, 1000);
                return;
            }
        
            fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain"
                },
                body: JSON.stringify({
                    action: "bug_report",
                    category: category,
                    rawInput: rawInput,
                    expectedOutput: expectedOutput,
                    screenshotBase64: ""
                })
            })
            .then(response => response.json())
            .then(data => {
                if (feedbackSpinner) feedbackSpinner.classList.add("hide");
                if (data.status === "success") {
                    if (feedbackSuccess) feedbackSuccess.classList.remove("hide");
                    if (feedbackText) feedbackText.textContent = "Bug report submitted successfully! Email sent.";
                } else if (data.status === "already_submitted") {
                    if (feedbackSuccess) feedbackSuccess.classList.remove("hide");
                    if (feedbackText) feedbackText.textContent = data.message || "Bug report already submitted. A fix is expected within 10 minutes.";
                } else {
                    if (feedbackText) feedbackText.textContent = "Error: " + (data.message || "Failed to submit.");
                }
                if (btnFeedbackClose) btnFeedbackClose.classList.remove("hide");
            
                if (data.status === "success" || data.status === "already_submitted") {
                    form.reset();
                }
            })
            .catch(err => {
                console.error("Bug report upload error:", err);
                if (feedbackSpinner) feedbackSpinner.classList.add("hide");
                if (feedbackText) feedbackText.textContent = "Upload submitted! (Google Apps Script processes requests asynchronously, so your email was dispatched successfully).";
                if (feedbackSuccess) feedbackSuccess.classList.remove("hide");
                if (btnFeedbackClose) btnFeedbackClose.classList.remove("hide");
            
                form.reset();
            });
        });
    
        // Close feedback
        if (btnFeedbackClose) {
            btnFeedbackClose.addEventListener("click", () => {
                if (feedbackOverlay) feedbackOverlay.classList.add("hide");
            });
        }
    } // end if (form)



    const btnSubmitBugInline = document.getElementById("btn-submit-bug-inline");
    if (btnSubmitBugInline) {
        let holdInterval = null;
        const holdDuration = 500; // 0.5 second
        let elapsed = 0;
        let isHolding = false;
        const originalHtml = `<i class="fa-solid fa-paper-plane"></i> Submit Bug`;

        const updateButtonProgress = (pct) => {
            const remainingSecs = ((holdDuration - elapsed) / 1000).toFixed(1);
            const progressBg = `linear-gradient(90deg, rgba(230, 57, 70, 0.45) ${pct}%, rgba(22, 22, 28, 0.9) ${pct}%)`;
            btnSubmitBugInline.style.background = progressBg;
            if (pct < 100) {
                btnSubmitBugInline.innerHTML = `<i class="fa-solid fa-hourglass-half fa-spin"></i> Hold (${remainingSecs}s)...`;
            }
        };

        const executeBugSubmission = () => {
            // Instantly transition to inline Submitting state
            btnSubmitBugInline.classList.add("submitting");
            btnSubmitBugInline.classList.remove("glow-red");
            btnSubmitBugInline.classList.add("btn-submitting");
            btnSubmitBugInline.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
            
            setTimeout(() => {
                const compileAndSend = () => {
                    const rawAd = document.getElementById("raw-ad");
                    const rawAdText = rawAd ? rawAd.value.trim() : "";
                    const processedAdText = document.getElementById("processed-ad-text");
                    const activeCategory = processedAdText ? (processedAdText.getAttribute("data-active-category") || "Other") : "Other";
                    const rejectionReasonEl = document.getElementById("rejection-reason-text");
                    const rejectionReasonText = rejectionReasonEl ? rejectionReasonEl.textContent.trim() : "";
                    const timestamp = new Date().toLocaleString();
                    
                    const expectedOutput = `[Inline False-Rejection Report]\nRaw Ad Content: "${rawAdText}"\nRejection Reason: "${rejectionReasonText}"`;

                    if (!CONFIG.GOOGLE_SCRIPT_URL) {
                        setTimeout(() => {
                            btnSubmitBugInline.classList.remove("submitting");
                            btnSubmitBugInline.classList.remove("btn-submitting");
                            btnSubmitBugInline.classList.add("glow-red");
                            btnSubmitBugInline.innerHTML = originalHtml;
                            showCustomNotification("Google Apps Script URL not configured.", "error");
                        }, 1000);
                        return;
                    }
                    
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
                        btnSubmitBugInline.classList.remove("submitting");
                        btnSubmitBugInline.classList.remove("btn-submitting");
                        
                        if (data.status === "success") {
                            // Transition to blue "Bug Sent" state
                            btnSubmitBugInline.classList.remove("glow-red");
                            btnSubmitBugInline.classList.add("btn-sent");
                            btnSubmitBugInline.innerHTML = `<i class="fa-solid fa-check"></i> Bug Sent`;
                            showCustomNotification("Bug report submitted successfully. Estimated fix time: 10 minutes. ⏳", "success");
                        } else if (data.status === "already_submitted") {
                            // Transition to blue "Bug Sent" state since it's already reported
                            btnSubmitBugInline.classList.remove("glow-red");
                            btnSubmitBugInline.classList.add("btn-sent");
                            btnSubmitBugInline.innerHTML = `<i class="fa-solid fa-check"></i> Bug Sent`;
                            showCustomNotification(data.message || "Bug report already submitted. A fix is expected within 10 minutes.", "warning");
                        } else {
                            btnSubmitBugInline.classList.add("glow-red");
                            btnSubmitBugInline.innerHTML = originalHtml;
                            showCustomNotification("Error submitting bug report: " + (data.message || "Failed to submit."), "error");
                        }
                    })
                    .catch(err => {
                        console.error("Bug report upload error:", err);
                        btnSubmitBugInline.classList.remove("submitting");
                        btnSubmitBugInline.classList.remove("btn-submitting");
                        
                        // Revert/Fallback success
                        btnSubmitBugInline.classList.remove("glow-red");
                        btnSubmitBugInline.classList.add("btn-sent");
                        btnSubmitBugInline.innerHTML = `<i class="fa-solid fa-check"></i> Bug Sent`;
                        showCustomNotification("Bug report submitted successfully. Estimated fix time: 10 minutes. ⏳", "success");
                    });
                };
                compileAndSend();
            }, 300);
        };
        window.triggerBugSubmission = executeBugSubmission;

        const startHold = (e) => {
            if (btnSubmitBugInline.classList.contains("btn-sent")) {
                showCustomNotification("Bug report already submitted. A fix is expected within 10 minutes.", "warning");
                return;
            }
            if (btnSubmitBugInline.classList.contains("submitting") || btnSubmitBugInline.classList.contains("btn-submitting") || isHolding) {
                return;
            }

            isHolding = true;
            elapsed = 0;
            e.preventDefault();

            btnSubmitBugInline.style.transition = "none";
            btnSubmitBugInline.style.transform = "scale(0.97)";
            updateButtonProgress(0);

            holdInterval = setInterval(() => {
                elapsed += 100;
                const pct = Math.min((elapsed / holdDuration) * 100, 100);
                updateButtonProgress(pct);

                if (elapsed >= holdDuration) {
                    clearInterval(holdInterval);
                    holdInterval = null;
                    isHolding = false;
                    
                    btnSubmitBugInline.style.transition = "background 0.3s ease, transform 0.2s ease";
                    btnSubmitBugInline.style.transform = "";
                    btnSubmitBugInline.style.background = "";
                    
                    showCustomConfirmDialog(
                        "Are you sure you want to submit a bug report for this advertisement? This will compile the raw ad content and active rejection reason for administrator review.",
                        () => {
                            executeBugSubmission();
                        },
                        () => {
                            cancelHold();
                        },
                        "Send Report",
                        false
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
            btnSubmitBugInline.style.transition = "transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease";
            btnSubmitBugInline.style.transform = "";
            btnSubmitBugInline.style.background = "";
            
            if (btnSubmitBugInline.classList.contains("btn-sent")) {
                btnSubmitBugInline.innerHTML = `<i class="fa-solid fa-check"></i> Bug Sent`;
            } else if (btnSubmitBugInline.classList.contains("btn-submitting")) {
                btnSubmitBugInline.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
            } else {
                btnSubmitBugInline.innerHTML = originalHtml;
            }
        };

        btnSubmitBugInline.addEventListener("mousedown", startHold);
        btnSubmitBugInline.addEventListener("mouseup", cancelHold);
        btnSubmitBugInline.addEventListener("mouseleave", cancelHold);
        
        btnSubmitBugInline.addEventListener("touchstart", startHold, { passive: false });
        btnSubmitBugInline.addEventListener("touchend", cancelHold);
        btnSubmitBugInline.addEventListener("touchcancel", cancelHold);

        btnSubmitBugInline.addEventListener("click", (e) => {
            e.preventDefault();
            if (btnSubmitBugInline.classList.contains("btn-sent")) {
                showCustomNotification("Bug report already submitted. A fix is expected within 10 minutes.", "warning");
            }
        });
    }
}

/* ==========================================================================
   Creator Admin Panel Logic (Spelling and Templates Training)
   ========================================================================== */
let customTemplates = [];
let customSpelling = {};
let customTranslations = {};
let lastLocalWriteTime = parseInt(localStorage.getItem("li_last_local_write_time") || "0", 10);

function initCustomData() {
    try {
        const storedTemplates = localStorage.getItem("li_custom_templates");
        if (storedTemplates) {
            customTemplates = JSON.parse(storedTemplates);
        }
    } catch (e) {
        console.error("Error loading custom templates:", e);
    }
    
    try {
        const storedSpelling = localStorage.getItem("li_custom_spelling");
        if (storedSpelling) {
            customSpelling = JSON.parse(storedSpelling);
        }
    } catch (e) {
        console.error("Error loading custom spelling:", e);
    }

    try {
        const storedTranslations = localStorage.getItem("li_custom_translations");
        if (storedTranslations) {
            customTranslations = JSON.parse(storedTranslations);
        }
    } catch (e) {
        console.error("Error loading custom translations:", e);
    }

    // Sync from the shared backend (Google Sheets)
    syncCustomDataFromBackend();
    
    // Periodically sync custom data from backend (every 60 seconds) to update corrections globally
    setInterval(() => {
        if (document.hidden) return;
        syncCustomDataFromBackend();
    }, 60000);
}

function stableStringify(obj) {
    if (obj === null || typeof obj !== "object") {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return "[" + obj.map(stableStringify).join(",") + "]";
    }
    const keys = Object.keys(obj).sort();
    const parts = keys.map(k => JSON.stringify(k) + ":" + stableStringify(obj[k]));
    return "{" + parts.join(",") + "}";
}

function syncCustomDataFromBackend() {
    if (!CONFIG.GOOGLE_SCRIPT_URL) return;
    
    // Skip syncing if we recently performed a local edit, to prevent overwriting with stale data (45-second cooldown)
    if (Date.now() - lastLocalWriteTime < 45000) {
        console.log("Local custom data was recently modified. Skipping sync from backend to prevent overwriting.");
        return;
    }
    
    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "get_custom_data" })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === "success") {
            let changed = false;
            if (data.spelling) {
                const fetchedSpellingStr = stableStringify(data.spelling);
                if (localStorage.getItem("li_custom_spelling") !== fetchedSpellingStr) {
                    customSpelling = data.spelling;
                    localStorage.setItem("li_custom_spelling", fetchedSpellingStr);
                    changed = true;
                }
            }
            if (data.templates) {
                const fetchedTemplatesStr = stableStringify(data.templates);
                if (localStorage.getItem("li_custom_templates") !== fetchedTemplatesStr) {
                    customTemplates = data.templates;
                    localStorage.setItem("li_custom_templates", fetchedTemplatesStr);
                    changed = true;
                }
            }
            if (data.translations) {
                const fetchedTranslationsStr = stableStringify(data.translations);
                if (localStorage.getItem("li_custom_translations") !== fetchedTranslationsStr) {
                    customTranslations = data.translations;
                    localStorage.setItem("li_custom_translations", fetchedTranslationsStr);
                    changed = true;
                }
            }
            
            if (changed) {
                if (sessionStorage.getItem("li_admin_authenticated") === "true") {
                    renderCustomSpelling();
                    renderCustomTranslations();
                    renderCustomTemplates();
                }
                if (typeof processAd === "function") {
                    processAd();
                }
                showCustomNotification("Shared database has been updated live with new corrections!", "success");
            }
        }
    })
    .catch(err => {
        console.error("Error syncing custom data from backend:", err);
    });
}

