// This file exposes database definitions loaded from extracted JSONs
const DB_PATHS = {
    vehicles: "data/vehicles.json",
    clothing: "data/clothing.json",
    items: "data/items.json",
    businesses: "data/businesses.json",
    spelling: "data/spelling.json",
    policy: "data/policy.json"
};

// Global DB structures holding the parsed configurations
let VEHICLE_DB = {};
let CLOTHING_DB = {};
let ITEMS_DB = {};
let BUSINESSES_DB = [];
let commonMisspellings = {};
let POLICY_PAGES = [];

// Function to fetch databases asynchronously
async function loadDatabases() {
    try {
        const [vehiclesRes, clothingRes, itemsRes, businessesRes, spellingRes, policyRes] = await Promise.all([
            fetch(DB_PATHS.vehicles),
            fetch(DB_PATHS.clothing),
            fetch(DB_PATHS.items),
            fetch(DB_PATHS.businesses),
            fetch(DB_PATHS.spelling),
            fetch(DB_PATHS.policy)
        ]);

        VEHICLE_DB = await vehiclesRes.json();
        CLOTHING_DB = await clothingRes.json();
        ITEMS_DB = await itemsRes.json();
        BUSINESSES_DB = await businessesRes.json();
        commonMisspellings = await spellingRes.json();
        POLICY_PAGES = await policyRes.json();

        console.log("LifeInvader-V2: Databases loaded successfully!");
        return true;
    } catch (error) {
        console.error("LifeInvader-V2: Error loading databases:", error);
        return false;
    }
}

