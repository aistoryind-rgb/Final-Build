/* ==========================================================================
   LifeInvader V2 Core Ad Processing Engine
   ========================================================================== */
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function getClosestMatch(input, list, threshold = 0.6) {
    if (!input || !list || list.length === 0) return null;
    let bestMatch = null;
    let maxSimilarity = 0;
    
    const cleanInput = input.trim().toLowerCase();
    
    for (const item of list) {
        const cleanItem = item.trim().toLowerCase();
        
        // Exact check
        if (cleanInput === cleanItem) {
            return item;
        }
        
        // Substring check
        if (cleanItem.includes(cleanInput) || cleanInput.includes(cleanItem)) {
            let similarity = Math.min(cleanInput.length, cleanItem.length) / Math.max(cleanInput.length, cleanItem.length);
            if (cleanItem.startsWith(cleanInput)) similarity += 0.2;
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                bestMatch = item;
            }
        }
        
        // Levenshtein check
        const dist = levenshteinDistance(cleanInput, cleanItem);
        const maxLength = Math.max(cleanInput.length, cleanItem.length);
        const similarity = 1 - (dist / maxLength);
        
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestMatch = item;
        }
    }
    
    return maxSimilarity >= threshold ? bestMatch : null;
}

function correctSpelling(text, ctx) {
    return text;

    // Protect price values (e.g. 5m, 5mil, 500k, $5 Million) from spelling correction
    const protectedPrices = [];
    corrected = corrected.replace(/\b(?:\d+(?:[\.,]\d+)*\s*(?:k|m|mil|ml|million|billion|b|trillion)\b|\$\s*\d+(?:[\.,]\d+)*)/gi, (match) => {
        protectedPrices.push(match);
        return `__PROTECTED_PRICE_${protectedPrices.length - 1}__`;
    });
    
    // Normalize percentage prefixes like %20 -> 20%
    const pctPrefixMatch = corrected.match(/%(\d+)\b/);
    if (pctPrefixMatch) {
        corrected = corrected.replace(/%(\d+)\b/g, "$1%");
        ctx.logs.push({ text: `Normalized percentage notation: <strong>%${pctPrefixMatch[1]}</strong> corrected to <strong>${pctPrefixMatch[1]}%</strong>`, type: 'correction' });
    }
    
    // Protect type numbers (e.g. type 5, type 13, 14 and 19) from being spell-corrected (e.g. 5 -> lvl5)
    const protectedTypes = [];
    corrected = corrected.replace(/\b(type|types|extra|extras|of\s+type)\s+(\d+(?:\s*(?:,|and|or)\s*\d+)*)\b/gi, (match) => {
        protectedTypes.push(match);
        return `__PROTECTED_TYPE_${protectedTypes.length - 1}__`;
    });
    
    // Actions / Prefixes
    const actionMatch = corrected.match(/\b(sling|sellaing|seling|selaing|slling|selign|saling|sellin|seeling|sellig|sellng|selng|sel|sale)\b/i);
    if (actionMatch) {
        corrected = corrected.replace(/\b(sling|sellaing|seling|selaing|slling|selign|saling|sellin|seeling|sellig|sellng|selng|sel|sale)\b/gi, "Selling");
        ctx.logs.push({ text: `Spelling correction: action <strong>${actionMatch[0]}</strong> corrected to <strong>Selling</strong>`, type: 'correction' });
    }
    const buyingMatch = corrected.match(/\b(buyin|bying|buing|buyg|buyen|buyiing|beying|buyng)\b/i);
    if (buyingMatch) {
        corrected = corrected.replace(/\b(buyin|bying|buing|buyg|buyen|buyiing|beying|buyng)\b/gi, "Buying");
        ctx.logs.push({ text: `Spelling correction: action <strong>${buyingMatch[0]}</strong> corrected to <strong>Buying</strong>`, type: 'correction' });
    }
    const tradingMatch = corrected.match(/\b(tradin|tradg|trding|traiding|treding)\b/i);
    if (tradingMatch) {
        corrected = corrected.replace(/\b(tradin|tradg|trding|traiding|treding)\b/gi, "Trading");
        ctx.logs.push({ text: `Spelling correction: action <strong>${tradingMatch[0]}</strong> corrected to <strong>Trading</strong>`, type: 'correction' });
    }
    const rentingMatch = corrected.match(/\b(rentin|rentg|rnting|renten|reenting)\b/i);
    if (rentingMatch) {
        corrected = corrected.replace(/\b(rentin|rentg|rnting|renten|reenting)\b/gi, "Renting");
        ctx.logs.push({ text: `Spelling correction: action <strong>${rentingMatch[0]}</strong> corrected to <strong>Renting</strong>`, type: 'correction' });
    }

    // Price correction
    const priceMatch = corrected.match(/\b(negable|negotiabl|negotiab|nego|negoitable|negotable|negotiabe|negotiate|negotiat|negtable|nogotaible|nogotable|nogotiable|negotioble|negotoable)\b/gi);
    if (priceMatch) {
        const uniqueMatches = [...new Set(priceMatch.map(m => m.toLowerCase()))];
        uniqueMatches.forEach(m => {
            if (m !== "negotiable") {
                ctx.logs.push({ text: `Spelling correction: <strong>${m}</strong> corrected to <strong>negotiable</strong>`, type: 'correction' });
            }
        });
        corrected = corrected.replace(/\b(negable|negotiabl|negotiab|nego|negoitable|negotable|negotiabe|negotiate|negotiat|negtable|nogotaible|nogotable|nogotiable|negotioble|negotoable)\b/gi, "negotiable");
    }

    // Upgrades fuzzy matches / corrections
    const partConfigMatch = corrected.match(/\b(par\s+confin|par\s+config|par\s+tuning|part\s+config|part\s+tuning|partial\s+config|partial\s+tuning|partially\s+upgraded|nearly\s+max|partially\s+config|part\s+confin|part\s+configuration|par\s+configuration|par\s+conf|part\s+conf|part\s+confin)\b/gi);
    if (partConfigMatch) {
        const uniqueMatches = [...new Set(partConfigMatch.map(m => m.toLowerCase()))];
        uniqueMatches.forEach(m => {
            if (m !== "partial configuration") {
                ctx.logs.push({ text: `Spelling correction: upgrade <strong>${m}</strong> corrected to <strong>partial configuration</strong>`, type: 'correction' });
            }
        });
        corrected = corrected.replace(/\b(par\s+confin|par\s+config|par\s+tuning|part\s+config|part\s+tuning|partial\s+config|partial\s+tuning|partially\s+upgraded|nearly\s+max|partially\s+config|part\s+confin|part\s+configuration|par\s+configuration|par\s+conf|part\s+conf|part\s+confin)\b/gi, "partial configuration");
    }

    const fullConfigMatch = corrected.match(/\b(full\s+conf|ful\s+conf|full\s+config|ful\s+config|full\s+tuning|ful\s+tuning|full\s+tune|ful\s+tune|max\s+conf|max\s+config|max\s+tuning|max\s+tune|maxed|fully\s+upgraded|ful\s+upgraded|full\s+configuration|ful\s+configuration|full\s+confin|ful\s+confin|full\s+max|ful\s+max|full\s+maxed|ful\s+maxed|pro\s+parts)\b/gi);
    if (fullConfigMatch) {
        const uniqueMatches = [...new Set(fullConfigMatch.map(m => m.toLowerCase()))];
        uniqueMatches.forEach(m => {
            if (m !== "full configuration") {
                ctx.logs.push({ text: `Spelling correction: upgrade <strong>${m}</strong> corrected to <strong>full configuration</strong>`, type: 'correction' });
            }
        });
        corrected = corrected.replace(/\b(full\s+conf|ful\s+conf|full\s+config|ful\s+config|full\s+tuning|ful\s+tuning|full\s+tune|ful\s+tune|max\s+conf|max\s+config|max\s+tuning|max\s+tune|maxed|fully\s+upgraded|ful\s+upgraded|full\s+configuration|ful\s+configuration|full\s+confin|ful\s+confin|full\s+max|ful\s+max|full\s+maxed|ful\s+maxed|pro\s+parts)\b/gi, "full configuration");
    }

    // Luminous wheels / rims
    const wheelsMatch = corrected.match(/\b(luminous\s+rims|unique\s+rims|unique\s+wheels)\b/gi);
    if (wheelsMatch) {
        const uniqueMatches = [...new Set(wheelsMatch.map(m => m.toLowerCase()))];
        uniqueMatches.forEach(m => {
            ctx.logs.push({ text: `Spelling correction: <strong>${m}</strong> corrected to <strong>luminous wheels</strong>`, type: 'correction' });
        });
        corrected = corrected.replace(/\b(luminous\s+rims|unique\s+rims|unique\s+wheels)\b/gi, "luminous wheels");
    }

    // Common item spelling errors are loaded dynamically from spelling.json into the global commonMisspellings variable.

    const activeMisspellings = Object.assign({}, commonMisspellings, customSpelling, ctx.extraSpelling || {});
    // Sort keys by length descending to match multi-word phrases first
    const sortedEntries = Object.entries(activeMisspellings).sort((a, b) => b[0].length - a[0].length);
    for (const [wrong, right] of sortedEntries) {
        // Skip number-only keys (like "700" or "5") from commonMisspellings to prevent corrupting model numbers, price digits, etc., but allow if explicitly trained
        if (/^\d+$/.test(wrong) && !customSpelling.hasOwnProperty(wrong) && (!ctx.extraSpelling || !ctx.extraSpelling.hasOwnProperty(wrong))) {
            continue;
        }
        let regex;
        if (wrong === "lui") {
            regex = /\blui\b(?!\s+vi\b)/gi;
        } else {
            const escapedWrong = wrong.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const startBoundary = /^\w/.test(wrong) ? '\\b' : '';
            const endBoundary = /\w$/.test(wrong) ? '\\b' : '';
            regex = new RegExp(`${startBoundary}${escapedWrong}${endBoundary}`, "gi");
        }
        const match = corrected.match(regex);
        if (match) {
            ctx.logs.push({ text: `Spelling correction: <strong>${wrong}</strong> corrected to <strong>${right}</strong>`, type: 'correction' });
            corrected = corrected.replace(regex, right);
        }
    }

    // Pass 2: Fuzzy fallback — catch remaining misspellings the exact regex missed
    const correctedWords = corrected.split(/\s+/);
    for (let wi = 0; wi < correctedWords.length; wi++) {
        const word = correctedWords[wi].toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!word || word.length < 3 || _smartMatcherStopwords.has(word)) continue;
        // Skip if already a known correct word in the dictionary values
        let isKnownCorrect = false;
        for (const [, right] of sortedEntries) {
            if (right.toLowerCase() === word) { isKnownCorrect = true; break; }
        }
        if (isKnownCorrect) continue;

        // Try canonical match (strip spaces/special chars)
        let fuzzyMatched = false;
        const canonWord = word.replace(/[^a-z0-9]/g, '');
        for (const [wrong, right] of sortedEntries) {
            const canonWrong = wrong.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (canonWrong.length >= 3 && canonWord === canonWrong && word !== wrong.toLowerCase()) {
                const origWord = correctedWords[wi];
                correctedWords[wi] = right;
                ctx.logs.push({ text: `Smart spelling: <strong>${origWord}</strong> corrected to <strong>${right}</strong>`, type: 'correction' });
                fuzzyMatched = true;
                break;
            }
        }
        if (fuzzyMatched) continue;

        // Try Levenshtein fuzzy (80% similarity, single words only)
        let bestMatch = null;
        let bestSim = 0;
        for (const [wrong, right] of sortedEntries) {
            if (wrong.includes(' ')) continue;
            const dist = levenshteinDistance(word, wrong.toLowerCase());
            const maxLen = Math.max(word.length, wrong.length);
            const sim = maxLen > 0 ? (1 - dist / maxLen) : 0;
            if (sim >= 0.80 && sim > bestSim) {
                bestSim = sim;
                bestMatch = { wrong, right };
            }
        }
        if (bestMatch) {
            const origWord = correctedWords[wi];
            correctedWords[wi] = bestMatch.right;
            ctx.logs.push({ text: `Fuzzy spelling (${Math.round(bestSim * 100)}%): <strong>${origWord}</strong> → <strong>${bestMatch.right}</strong>`, type: 'correction' });
        }
    }
    corrected = correctedWords.join(' ');

    // Space out adjacent digit + days (e.g. 7days -> 7 days)
    corrected = corrected.replace(/\b(\d+)\s*days?\b/gi, "$1 days");
    corrected = corrected.replace(/\b(\d+)\s*beds*\b/gi, "$1 beds");
    corrected = corrected.replace(/\bbeds*\s*(\d+)\b(?![.,]\d)/gi, "$1 beds");

    // Complex replacements with regex
    const graphicCardRegex = /\b(grapic\s+card|graphic\s+card|graphics\s+card)\b/gi;
    const graphicCardMatch = corrected.match(graphicCardRegex);
    if (graphicCardMatch) {
        ctx.logs.push({ text: `Spelling correction: <strong>${graphicCardMatch[0]}</strong> corrected to <strong>video card</strong>`, type: 'correction' });
        corrected = corrected.replace(graphicCardRegex, "video card");
    }

    const repKitRegex = /\b(rep\s+kit)\b/gi;
    const repKitMatch = corrected.match(repKitRegex);
    if (repKitMatch) {
        ctx.logs.push({ text: `Spelling correction: <strong>${repKitMatch[0]}</strong> corrected to <strong>repair kit</strong>`, type: 'correction' });
        corrected = corrected.replace(repKitRegex, "repair kit");
    }

    if (/\bcharging\b/i.test(corrected) && !/\bcharging\s+station\b/i.test(corrected)) {
        corrected = corrected.replace(/\bcharging\b/gi, "chargers");
        ctx.logs.push({ text: `Spelling correction: <strong>charging</strong> corrected to <strong>chargers</strong>`, type: 'correction' });
    }

    // Format property and shop numbers to use № symbol
    corrected = corrected.replace(/\b(house|apartment|mansion|penthouse|shop)\s*(?:no\.?|number|num\.?|#)?\s*(\d+)\b/gi, (match, prop, num) => {
        return `${prop} \u2116${num}`;
    });

    // Restore protected type numbers
    corrected = corrected.replace(/__PROTECTED_TYPE_(\d+)__/g, (match, idx) => {
        return protectedTypes[parseInt(idx)];
    });

    // Restore protected price values
    corrected = corrected.replace(/__PROTECTED_PRICE_(\d+)__/g, (match, idx) => {
        return protectedPrices[parseInt(idx)];
    });

    return corrected;
}

function detectActionFromText(text) {
    const lower = text.toLowerCase();
    
    // Check for dating category (Dating is always "Looking", i.e. Buying mode)
    const isDatingSearch = /\b(look|looking|search|searching|want|find|finding)\b/i.test(lower);
    const hasDatingTarget = /\b(wife|girlfriend|boyfriend|husband|valentine|date|spouse|soulmate)\b/i.test(lower) || 
                            (/\b(friend|friends|family|family\s+members)\b/i.test(lower) && /\b(look|looking|search|searching)\b/i.test(lower));
    if (isDatingSearch && hasDatingTarget && !lower.includes("family business")) {
        return "Buying";
    }

    // Buying keywords
    const buyPatterns = [
        /\bbuying\b/i, /\blook for\b/i, /\blooking to buy\b/i, /\blooking to purchase\b/i,
        /\bbuy\b/i, /\bwant to buy\b/i, /\bwtb\b/i
    ];
    // Selling, renting out, trading keywords
    const sellPatterns = [
        /\bselling or trading\b/i, /\bsell or trade\b/i, /\bselling\/trading\b/i, /\bwts\/wtt\b/i,
        /\brenting out\b/i, /\brent out\b/i, /\brenting\b/i, /\brent\b/i,
        /\btrading\b/i, /\btrade\b/i, /\bwtt\b/i,
        /\bselling\b/i, /\bsell\b/i, /\bwts\b/i
    ];

    // Find the first matching pattern in the text to determine the action
    let firstBuyIdx = -1;
    for (const pat of buyPatterns) {
        const match = lower.match(pat);
        if (match) {
            if (firstBuyIdx === -1 || match.index < firstBuyIdx) {
                firstBuyIdx = match.index;
            }
        }
    }

    let firstSellIdx = -1;
    for (const pat of sellPatterns) {
        const match = lower.match(pat);
        if (match) {
            if (firstSellIdx === -1 || match.index < firstSellIdx) {
                firstSellIdx = match.index;
            }
        }
    }

    if (firstBuyIdx !== -1 && firstSellIdx !== -1) {
        // Both are present, choose the one that appears first
        return firstBuyIdx < firstSellIdx ? "Buying" : "Selling";
    } else if (firstBuyIdx !== -1) {
        return "Buying";
    } else if (firstSellIdx !== -1) {
        return "Selling";
    }

    return null;
}

function mapVehicleBrands(text) {
    let result = text.toLowerCase();
    result = result.replace(/\bmercedes(?:\s*-?\s*benz)?\b/gi, "benefactor");
    result = result.replace(/\bamg\b/gi, "benefactor");
    result = result.replace(/\bbmw\b/gi, "ubermacht");
    result = result.replace(/\baudi\b/gi, "obey");
    result = result.replace(/\bporsche\b/gi, "pfister");
    result = result.replace(/\blamborghini\b/gi, "pegassi");
    result = result.replace(/\blambo\b/gi, "pegassi");
    result = result.replace(/\bbugatti\b/gi, "truffade");
    result = result.replace(/\brolls\s*-?\s*royce\b/gi, "enus");
    result = result.replace(/\brr\b/gi, "enus");
    result = result.replace(/\blexus\b/gi, "emperor");
    result = result.replace(/\btoyota\b/gi, "karin");
    result = result.replace(/\bnissan\b/gi, "annis");
    result = result.replace(/\btesla\b/gi, "coil");
    result = result.replace(/\brange\s*rover\b/gi, "gallivanter");
    result = result.replace(/\bford\b/gi, "vapid");
    result = result.replace(/\bchevrolet\b/gi, "declasse");
    result = result.replace(/\bchevy\b/gi, "declasse");
    result = result.replace(/\bferrari\b/gi, "grotti");
    result = result.replace(/\bitaly\b/gi, "italia");
    
    result = result.replace(/\bg-wagon\b/gi, "g63");
    result = result.replace(/\bhuracan\b/gi, "performante");
    result = result.replace(/\bskyline\b/gi, "skyline gt-r");
    result = result.replace(/\blvn\b/gi, "la voiture noire");
    result = result.replace(/\bgt-?r\s*(?:1|i)\b/gi, "gt-r i");
    result = result.replace(/\bgtr\b/gi, "gt-r");
    return result;
}

function mapClothingBrands(text) {
    let result = text.toLowerCase();
    result = result.replace(/\badidas\b/g, "abibas");
    result = result.replace(/\bgucci\b/g, "muci");
    result = result.replace(/\blouis vuitton\b/g, "lui vi");
    result = result.replace(/\blv\b/g, "lui vi");
    result = result.replace(/\bnike\b/g, "niki");
    result = result.replace(/\bpikachu\b/g, "mikachu");
    result = result.replace(/\brolex\b/g, "kolex");
    result = result.replace(/\bsocial hoodie\b/g, "social club hoodie");
    result = result.replace(/\btype mask\b/g, "tight mask");
    // Map scarf shortnames to their canonical clothing DB names
    result = result.replace(/\bdesert scarf\b(?!\s*mask)/g, "desert scarf mask");
    result = result.replace(/\btied scarf\b(?!\s*mask)/g, "tied scarf mask");
    result = result.replace(/\bface scarf\b(?!\s*mask)/g, "face scarf mask");
    result = result.replace(/\bneck scarf\b(?!\s*mask)/g, "neck scarf mask");
    return result;
}

// Specialised Vehicle match
function matchVehicle(inputText) {
    const lowerInput = inputText.toLowerCase();
    const itemWords = [
        "solar panel", "solar panels", "solar barrel", "solar barrels",
        "sim card", "sim cards", "simcard", "simcards",
        "video card", "video cards", "videocard", "videocards",
        "scrap metal", "luminous stone", "luminous stones", "stone", "stones",
        "ticket", "tickets", "juice", "juices", "pet", "pets", "cage", "cages",
        "oil well", "sawmill", "drill", "watering can", "pickaxe", "fishing rod",
        "thread", "threads", "battery", "batteries", "gasoline barrel", "kerene barrel",
        "paint can", "sponge", "sponges", "license plate", "license plates", "custom plate"
    ];
    if (itemWords.some(item => lowerInput.includes(item))) {
        return null;
    }

    const categories = ['helicopters', 'boats', 'planes', 'motorcycles', 'not_sellable_cars', 'sellable_cars'];
    const allVehicles = [];
    const nameMap = new Map();
    const categoryMap = new Map();
    
    for (const cat of categories) {
        for (const veh of VEHICLE_DB[cat]) {
            allVehicles.push(veh);
            nameMap.set(veh.toLowerCase(), veh);
            categoryMap.set(veh, cat);
        }
    }
    
    const actionPrefixes = /^(?:buying|selling or trading|selling|trading|renting out|renting|wtb|wts|wtt|buy|sell|trade|rent|looking to purchase|looking to buy|want to buy|searching for|looking for|searching|look for|looking|search|look)\s+(?:a\s+|an\s+)?/i;
    const actionSuffixes = /\s+(?:buying|selling or trading|selling|trading|renting out|renting|wtb|wts|wtt|buy|sell|trade|rent|looking to purchase|looking to buy|want to buy|searching for|looking for|searching|look for|looking|search|look)$/i;
    
    let cleanInput = mapVehicleBrands(inputText.trim().toLowerCase().replace(/['"“”]/g, ''));
    cleanInput = cleanInput.replace(actionPrefixes, "").replace(actionSuffixes, "").trim();
    
    // Shortcuts
    if (/\b(?:panamera\s+turismo)\b/i.test(cleanInput)) {
        return { name: "Pfister Panamera Turismo", category: "sellable_cars" };
    }
    if (/\bpanamera\b/i.test(cleanInput)) {
        return { name: "Pfister Panamera", category: "sellable_cars" };
    }
    if (/\b(?:skyline|r34)\b/i.test(cleanInput)) {
        return { name: "Annis Skyline GT-R (R34)", category: "sellable_cars" };
    }
    if (/\bchiron\b/i.test(cleanInput)) {
        return { name: "Truffade Chiron", category: "sellable_cars" };
    }
    if (/\bphantom\b/i.test(cleanInput)) {
        return { name: "Enus Phantom", category: "sellable_cars" };
    }
    if (/\bviper\b/i.test(cleanInput)) {
        return { name: "Bravado Viper 2008", category: "sellable_cars" };
    }
    if (/\b(?:t-20|t20)\b/i.test(cleanInput)) {
        return { name: "T-20", category: "sellable_cars" };
    }
    if (/\b(?:z-type|ztype)\b/i.test(cleanInput)) {
        return { name: "Z-Type", category: "sellable_cars" };
    }
    if (/\b(?:sc-1|sc1)\b/i.test(cleanInput)) {
        return { name: "SC-1", category: "sellable_cars" };
    }
    if (/\b(?:gp-1|gp1)\b/i.test(cleanInput)) {
        return { name: "GP-1", category: "sellable_cars" };
    }
    
    // Direct tokenized compare
    for (const veh of allVehicles) {
        const cleanVehName = veh.toLowerCase().replace(/[()]/g, '');
        if (cleanInput === cleanVehName || cleanInput === veh.toLowerCase()) {
            return { name: veh, category: categoryMap.get(veh) };
        }
    }
    
    let bestVeh = null;
    let maxScore = 0;
    const inputTokens = cleanInput.split(/[\s-]+/).map(t => t.replace(/[,.;:!?()]/g, "")).filter(Boolean);
    
    for (const veh of allVehicles) {
        const vehLower = veh.toLowerCase();
        const vehClean = vehLower.replace(/[()]/g, '');
        const vehTokens = vehClean.split(/[\s-]+/);
        
        let score = 0;
        let matchedNonNumeric = false;
        let hasExactMatch = false;
        for (const token of inputTokens) {
            if (token.length < 2) continue;
            
            // Skip price and quantity tokens to avoid false matches (e.g. 500k matching vehicle models like GT 500)
            if (/^\d+(?:\.\d+)?(?:k|m|b|g\.?s\.?|w\.?h\.?|days?|lvls?|levels?|years?|percent|each)$/i.test(token)) {
                continue;
            }
            
            let matchedToken = false;
            for (const vehToken of vehTokens) {
                if (vehToken.length < 2) continue;
                const dist = levenshteinDistance(token, vehToken);
                const maxLen = Math.max(token.length, vehToken.length);
                const sim = 1 - (dist / maxLen);
                if (sim >= 0.7) {
                    const stopWords = [
                        "and", "the", "for", "with", "out", "cayo", "type", "each", "bulk", "selling", "buying", "trading", "renting",
                        "rare", "exotic", "unique", "luminous", "luxe", "lux", "high", "low", "medium", "advanced", "max", "pro",
                        "black", "white", "red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "grey", "gray", "silver", "gold"
                    ];
                    if (stopWords.includes(token)) {
                        continue;
                    }
                    if (dist === 0) {
                        hasExactMatch = true;
                    }
                    score += 3;
                    matchedToken = true;
                    if (!/^\d+$/.test(token)) {
                        matchedNonNumeric = true;
                    }
                    break;
                }
            }
            if (!matchedToken && vehClean.includes(token)) {
                score += 1;
                if (vehTokens.includes(token)) {
                    hasExactMatch = true;
                }
                if (!/^\d+$/.test(token)) {
                    matchedNonNumeric = true;
                }
            }
        }
        
        const modelMatch = vehLower.match(/\(([^)]+)\)/);
        if (modelMatch) {
            const modelId = modelMatch[1].toLowerCase();
            for (const token of inputTokens) {
                const dist = levenshteinDistance(token, modelId);
                const maxLen = Math.max(token.length, modelId.length);
                const sim = 1 - (dist / maxLen);
                if (sim >= 0.75) {
                    if (dist === 0) {
                        hasExactMatch = true;
                    }
                    score += 5;
                    if (!/^\d+$/.test(token)) {
                        matchedNonNumeric = true;
                    }
                }
            }
        }
        
        const hasNumericTokenInVeh = vehTokens.some(vt => /^\d+$/.test(vt));
        if (hasNumericTokenInVeh && !matchedNonNumeric) {
            score = 0;
        }
        
        if (inputTokens.length > 1 && !hasExactMatch) {
            score = 0;
        }
        
        if (score > maxScore) {
            maxScore = score;
            bestVeh = veh;
        } else if (score === maxScore && score > 0 && bestVeh) {
            const bestVehClean = bestVeh.toLowerCase().replace(/[()]/g, '');
            const bestVehTokens = bestVehClean.split(/[\s-]+/).length;
            const currentVehTokens = vehClean.split(/[\s-]+/).length;
            if (currentVehTokens < bestVehTokens) {
                bestVeh = veh;
            }
        }
    }
    
    if (maxScore >= 3) {
        return { name: bestVeh, category: categoryMap.get(bestVeh) };
    }
    
    const closest = getClosestMatch(cleanInput, allVehicles, 0.7);
    if (closest) {
        return { name: closest, category: categoryMap.get(closest) };
    }
    
    return null;
}

// Specialised Clothing match
function matchClothingItem(inputText) {
    const allItems = [];
    const itemMap = new Map();
    const subcatMap = new Map();
    const genderMap = new Map();
    
    for (const subcat in CLOTHING_DB.male) {
        for (const item of CLOTHING_DB.male[subcat]) {
            const lowerItem = item.toLowerCase();
            allItems.push(item);
            itemMap.set(lowerItem, item);
            subcatMap.set(item, subcat);
            genderMap.set(item, 'male');
        }
    }
    
    for (const subcat in CLOTHING_DB.female) {
        for (const item of CLOTHING_DB.female[subcat]) {
            const lowerItem = item.toLowerCase();
            if (itemMap.has(lowerItem)) {
                genderMap.set(itemMap.get(lowerItem), 'both');
            } else {
                allItems.push(item);
                itemMap.set(lowerItem, item);
                subcatMap.set(item, subcat);
                genderMap.set(item, 'female');
            }
        }
    }
    
    const lowerInput = inputText.toLowerCase();
    const nonClothingKeywords = [
        "cage", "pet", "plate", "license", "fish", "salmon", "carp", "perch", "trout",
        "drill", "sawmill", "gpu", "graphics card", "video card", "battery", "batteries",
        "wires", "wire", "sponge", "sponges", "hookah", "poker", "dice",
        "seed", "seeds", "emerald", "ruby", "diamond", "obsidian", "magma stone", "copper",
        "driver", "lawyer", "dancer", "singer", "dj", "fuel", "canister", "tonic", "panamera"
    ];
    if (nonClothingKeywords.some(kw => lowerInput.includes(kw))) {
        return null;
    }

    const actionPrefixes = /^(?:buying|selling or trading|selling|trading|renting out|renting|wtb|wts|wtt|buy|sell|trade|rent|looking to purchase|looking to buy|want to buy|searching for|looking for|searching|look for|looking|search|look)\s+(?:a\s+|an\s+)?/i;
    const actionSuffixes = /\s+(?:buying|selling or trading|selling|trading|renting out|renting|wtb|wts|wtt|buy|sell|trade|rent|looking to purchase|looking to buy|want to buy|searching for|looking for|searching|look for|looking|search|look)$/i;

    let cleanInput = mapClothingBrands(inputText.trim().toLowerCase().replace(/__has_each__/g, ""));
    cleanInput = cleanInput.replace(actionPrefixes, "").replace(actionSuffixes, "").trim();
    
    // Detect gender specified in input
    const hasMaleGender = /\b(?:for\s+men|for\s+man|male|mens?|men's)\b/i.test(inputText);
    const hasFemaleGender = /\b(?:for\s+women|for\s+woman|female|womens?|women's)\b/i.test(inputText);
    
    let candidates = allItems;
    if (hasMaleGender && !hasFemaleGender) {
        candidates = allItems.filter(item => genderMap.get(item) === 'male' || genderMap.get(item) === 'both');
    } else if (hasFemaleGender && !hasMaleGender) {
        candidates = allItems.filter(item => genderMap.get(item) === 'female' || genderMap.get(item) === 'both');
    }
    
    // Strip color, type and gender descriptors to get the core clothing item name for matching
    const colors = ["black", "white", "red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "grey", "gray", "silver", "gold"];
    for (const c of colors) {
        cleanInput = cleanInput.replace(new RegExp(`\\b${c}\\b`, "gi"), "");
    }
    cleanInput = cleanInput.replace(/(?:type|extra|extras)\s*#?\d+\b/gi, "");
    cleanInput = cleanInput.replace(/\b(?:for\s+men|for\s+man|male|for\s+women|for\s+woman|female|mens?|men's|womens?|women's)\b/gi, "");
    cleanInput = cleanInput.replace(/\s+/g, " ").trim();
    
    // Longest substring match
    let bestMatch = null;
    let longestMatchLen = 0;
    
    for (const item of candidates) {
        const itemLower = item.toLowerCase();
        let itemMatchCheck = itemLower;
        let isWildcard = false;
        if (itemLower.includes('*')) {
            itemMatchCheck = itemLower.replace(/\s*of\s*type\s*\*/g, '').trim();
            isWildcard = true;
        }
        
        let itemMatchCheckAlt = null;
        if (isWildcard && itemMatchCheck.endsWith(" watch")) {
            itemMatchCheckAlt = itemMatchCheck.replace(/\s*watch\b/gi, '').trim();
        }
        
        const hasMatch = isWildcard 
            ? (cleanInput.includes(itemMatchCheck) || (itemMatchCheckAlt && cleanInput.includes(itemMatchCheckAlt))) 
            : cleanInput.includes(itemLower);
            
        if (hasMatch) {
            const len = isWildcard ? (cleanInput.includes(itemMatchCheck) ? itemMatchCheck.length : itemMatchCheckAlt.length) : itemLower.length;
            if (len > longestMatchLen) {
                longestMatchLen = len;
                bestMatch = item;
            }
        }
    }
    
    if (bestMatch) {
        return { name: bestMatch, subcategory: subcatMap.get(bestMatch), gender: genderMap.get(bestMatch) };
    }
    
    const closest = getClosestMatch(cleanInput, candidates, 0.55);
    if (closest) {
        return { name: closest, subcategory: subcatMap.get(closest), gender: genderMap.get(closest) };
    }
    
    return null;
}

/* ==========================================================================
   Ad Parsing & Rule Execution Engine
   ========================================================================== */

const OFFICIAL_TEMPLATES = [
    "Join Imad Wanted Family Office (\u211613724)",
    "Whether you are new or old in the city, if you need money, Office (\u211613724)",
    "Vanilla Unicorn Bar (GPS \u211643)",
    "Taxi (GPS \u21161) near the Casino",
    "Central Mall Weapon Shop (GPS \u2116269)",
    "Elites 24/7 Store No120",
    
    // Ammunition Store Templates
    "Looking to buy affordable and high quality ammunition in bulk? weapon shop (GPS \u211639) is offering huge discount. Email (lbiiigmatte)",
    "Vyce weapon shop (GPS \u211639) is offering ammunition at low price all the day, visit now to get amazing deals.Email (lbiiigmatte) or call Ph(12-12-901).",
    "Want buy guns with lowest price? Come to Holdem Ammunation Store (GPS 40) the lowest prices in the city for bulk orders contact via email (ahmad70123)",
    "Visit Holdem Ammunation Store (GPS 40) is Offering 50% discount the lowest prices in the city.",
    "Vio Gun Store (GPS \u211641) - 50% DISCOUNT We are the CHEAPEST in the city. ALWAYS LOW PRICES guaranteed. Bulk Orders? (Wietru)",
    "Vio Gun Store (GPS \u211641)  Get 50% discount today. Experience always low prices on all ammo and weapon types in the city. Bulk Orders? (Wietru)",
    "RifleClub (GPS 111) Citys main gun store, lowest ammo prices with 50% discount, bulk orders? Mail (maxdopamine) for extra deals.",
    "RifleClub (GPS 111) Legion Square gun store, lowest ammo prices with a flat 50% discount, bulk orders? Mail (maxdopamine) for extra deals.",
    "Discover Bobbys Ammunition Store (GPS \u2116147), offering quality firearms near SAHP in Paleto Bay.",
    "Visit Bobbys Ammunition Store (GPS \u2116147). Exclusive 50% Off on quality firearms near SAHP in Paleto Bay.",
    "CanikPide Gun Store (GPS No. 148) delivers high-quality firearms at affordable rates citywide. Contact (behzatamir) via mail for bulk orders anytime.",
    "CanikPide Gun Store (GPS No: 148) is always stocked and available 24/7 for bulk orders. You can contact us for bulk orders through mail (behzatamir).",
    "Wong Gun store (GPS No149) is offering highest quality and lowest prices in city! Gear up with us and save big. Mail for bulk orders (Saylex)",
    "Tired of overpaying? Visit Pew Pew GunStore (GPS No:149) for 90% OFF on everything! Bulk deals available on Emails (notsuman).",
    "Gear up at Lue Gun Shop (GPS No150). Top tier firearms and tactical equipment await. Bulk discounts available. Email: (dayzofdeath)",
    "Lock and load for less at Lue Gun Shop (GPS No150)! 50% off all firearms and gear. Dont miss out on this limited time offer. Email: (dayzofdeath)",
    "Siddhu Gun Store (GPS 151) - Locked, loaded, and unbeatable prices. Get top-quality guns at the lowest rates in town. Bulk orders? Mail sidhux123",
    "Siddhu Gun Store (GPS 151) - Limited-time 90% discount on top-quality firearms. Best deals in town. Dont miss out! Bulk orders? Mail sidhux123",
    "Looking for the lowest prices on guns? Visit Most Wanted Store (GPS \u2116152) near Beach Market for unbeatable bulk order! Reach out via email (xkouros)",
    "Dont miss out on incredible discounts up to 90% off at Most Wanted Store (GPS \u2116152)! For guns and ammo, contact us at (xkouros)!",
    "Central Mall Weapon Store (GPS \u2116269)! Premium Weapons and Ammo, Always Stocked for Bulk Orders. Contact Me on 22-20-444 OR Mails (maxuchihax).",
    "Hurry up! Up to 60% OFF on Firearms at Central Mall Weapon Shop (GPS \u2116269)! Limited stock, act fast. Ping Me on 22-20-444 OR Mails (maxuchihax).",
    
    // Office Templates
    "Need easy money $132.000 everyday? Office (\u211624) is for you, offering $10.000 bonus for every task you finish. Contact (d.arsh) via email for bonus!",
    "Do you need extra money? The Office (\u211624) is for you. Finish simple tasks and earn $132.000 Daily. Offering max bonus Contact via email (d.arsh)",
    "Earn $4.5 Million monthly! Join Al Toman Office (\u2116585) and make $12.000 bonus for every task you finish. Email \"dxdux\" for exclusive bonuses.",
    "Office (\u2116585) is currently offering a $12,000 bonus for each completed task. Interested? Contact (dxdux) via mail for more info!",
    "Struggling with Expenses? Office (\u2116677) got you covered! Get financial support for your daily needs. Reach out to us via email for your daily bonuses!",
    "Say Goodbye to financial stress! Office (\u2116677) provides quick cash for easy tasks. Connect with us through email to claim your daily bonuses.",
    "Easy Money From Me Get 9K For Each Task. We Are Not Alone But We Are The Best OFFICE (N1000) Contact (zekomyth) via email for bonus! or Call 8882288",
    "Get 54k When you complete 6 missions (N1000) Contact (zekomyth) via email for bonus! or Call 8882288",
    "Get rich with the Theo Gucci Office (\u21161017)! Claim your $5.000 bonus after each task by sending a message to us!",
    "Looking for an effortless way to earn money? Contract with the Theo Gucci Office (\u21161017) and fill your pockets with cash!",
    "Your millionaire dream begins at Office 1288! Earn 10k per task, 125k a day, 875k every week. Build your future with us. Contact on mails (leveljod)",
    "Build your future at Office 1288! Every task pays 10K. Simple work, big rewards. Dont wait, start today. Contact me on mails (leveljod)",
    "Dont have money? Earn up to $100.000 daily. Contract with Lazy Assassin Office (\u21161419) and receive $5.000 per task. Contact (imm0rtalop) for bonuses.",
    "Looking for employment opportunities? Join the Lazy Assassin Office (\u21161419) and earn $5.000 bonus for each task. Email (imm0rtalop) for details.",
    "Empty pockets? Dont worry, earn $124,000 a day with Humans Office (\u2116 1948). Contact us via email (za3im96) for bonuses!",
    "Quick Money Opportunity! Office No. 1948. Fast, easy earnings. No hard work, just smart work.  email (za3im96) for bonuses!",
    "Become a MILLIONAIRE in the easiest way with Office 2198! $10K bonus per task, $191.800 per day. For more information, contact us by mail. (Saylex)",
    "Earn $191.800 daily at Office (No-2198)! Receive $10K bonuses per task and $50,000 from the referral bonus! Email (Saylex).",
    "Contract with Outlaws Office (\u21162796). Complete 6 tasks daily and earn cash, enjoy a $30.000 bonus for completing all tasks. Email (bo330) for bonuses!",
    "Outlaws Office (\u21162796) is waiting for you. Tackle 6 tasks daily, earn money and receive $30.000 bonus for completing all tasks. Contact us at (bo33).",
    "Need quick cash? Get employed at Grand For All Office (\u21167963) and receive a bonus for each completed task.",
    "Office Grand FOR ALL \u21167963 offers a bonus of $40.000 after completing all daily tasks.",
    "Do you have dreams? If you say yes, we cant help you. But if you have goals, lets get it done. Contract with Snow Corp. Office (\u211610364).",
    "Easy tasks, the easiest money. Now with $30.000 bonus. Contract with Snow Corp. Office (\u211610364). Send email (.networkproblem) for extra bonuses.",
    "Money like Turkish Delight Office 12313! $10,000 bonus per mission, $195.000 daily. For info, mail us. (esjer)",
    "Earn $195,000 daily at Office (No12313)! Get $10,000 per task and various bonuses! mail (esjer) now for this opportunity!",
    "Join Imad Wanted Family Office (\u211613724)! Today, we are offering bonuses, easy tasks, and extra cash. Then what are you waiting for? Join us now.",
    "Whether you are new or old in the city, if you need money, Office (\u211613724) offers a 90% profit. We provide bonuses too! Contact us at (mostwanted994)!",
    "Office 14396 gives $10,000 per task! Fast money, no drama. Send email to bylkaanis and start earning today!",
    "Hello! Office 14396 pays $10,000 for each task you complete. Want easy money? Mail bylkaanis and join us now!",
    "Empty pockets? Dont worry, make $100.000 a day by contracting with SAKIB INC Office (\u211614633). Contact us via email (gamyashiqur) for bonuses!",
    "Tired of not getting paid what was promised by other offices? Dont worry, SakibInc Office (\u211614633) always offers the highest pay-outs and easy tasks.",
    "Empty pockets? Dont worry, earn $124,000 a day with Lue Office (\u211615136). Contact us via email (dayzofdeath) for bonuses!",
    "Looking for the highest paying office? Lue Office (\u211615136) is your best choice! Get a $10,000 bonus per task. Email us at (dayzofdeath).",
    "$11,111 BONUS  $11,111 BONUS  $11,111 BONUS per task Wietru Vio Office (21046) Contact: mail (Wietru)",
    "NO MORE EMPTY POCKETS Your $11.111 task bonus is waiting at Wietru Vio Office (21046) mail (Wietru)",
    "Empty pockets? Join Office 27650 and earn daily with easy tasks. Get up to $10.000 bonus per task. Start now! Contact (bako0804)",
    "Want to earn big money fast? Office 27650 offers $10.000 bonus per task and high daily income. Easy work. Contact via email (bako0804)",
    "Is your girlfriend spending all your money? You do not have to be afraid anymore! The office (\u211632125) offers money for your daily needs.",
    "Earn $10.000 per task, then blow it all at the casino. Why save when you can gamble hard earned office fortune? Swing by Office \u211633698 and cash in!",
    "Earn $10.000 per task, Then watch your wife spend it faster than you can make it. Visit Office \u211633698, At least you can try to win it back!",
    "Nexus Office \u211641760 sets the gold standard with highest bonus ever. Extra $10.200 bonus per task and $11.000 on weekends. Contact: (argha.bhai).",
    "Step into excellence with Nexus Office \u211641760. Secure extra $10.200 bonus each task and $11.000 on weekends. Mail: (argha.bhai).",
    "Want to earn easy money by doing simple tasks? Contract with Office No50367 and earn $10.500 bonus on every task. Contact (shivkumar7409) for bonuses.",
    "Office 50367 is Offering $10.500 bonus on every task. Hurry up and Grab this offer, You can earn $135.000 daily. Contact me via email (shivkumar7409).",
    "Office \u211652942 introduces big profits $64800 daily, Seize this opportunity to enhance your earnings and experience.",
    "Looking to live rich and making great earnings, $64800 daily? Visit the premier office Lex Lyls Office (\u211652942)",
    "Make riches your reality! Take tasks from Ponch Office \u211678981! Earn $64.800 daily, $1.9 Million monthly. Prestige meets pay!",
    "Are you new to the city? Want some good cash to begin your journey? Join (Office \u211678981) and earn $64,800 everyday easily.",
    "$13.000 bonus each task! Join Office 85042 for easy work and earn up to $213.000 per day. Fast rewards and simple tasks. Contact via mails (Creegaint)",
    "$13.000 bonus each task! Big earning opportunity at Office 85042. Makes up to $213.000 daily with simple tasks. Contact via mails (Creegaint)",
    "Hello everyone! Office 85235 gives you $10.000 bonus for each task you do. Hurry up and join us! Contact for bonus at emails guzm4n58.",
    "Earn $10,000 daily task bonus! Join Office (\u2116 85235) and receive $10,000 for each task, up to $120,000 per day. Email guzm4n58.",
    
    // Store 24/7 Templates
    "Hurry! Store 24/7 №1 (GPS 23) is offering 50% off on everything. Grab your favorite items now. Shop smart, save big!",
    "Why wait? 24/7 Store №1 (GPS 23) is the cheapest in the city. Visit us anytime, 80% discount on Bulk Orders! Contact (creegaint).",
    "Spankys 24/7 №2 (GPS №24) offers cheapest prices and instant delivery on big orders. All day support via mail. Call 99-84-146 or (ganguly07).",
    "Store №2 (GPS №24) Spankys 24/7 runs all day with cheapest rates. Bulk orders get instant delivery. Contact 99-84-146 or (ganguly07).",
    "Beast24/7Store №3 (GPS 25) Always open,Cheapest in city We guarantee low price on all products,open round the clock,for more queries contact-beasto001",
    "Revolutionize your shopping at 24/7 store (GPS №25) deals up to 50% off! Get pickaxes, maps, flowers, tents and more essentials for your daily tasks!",
    "24 Store №26! offers 25% off on bulk orders! For more details or to place an order, call 5111110 or email us at (17uv). Dont miss out on the savings.",
    "Bulk buyers save big at 24 Store №26! Get 25% off on bulk purchases. Reach out at 5111110 or email ( 17uv ) for details and orders.",
    "If you are out of city need groceries, Get up to 60% Discount Today: Visit Shop No. 5 (GPS No 27). Contact: 15-01-505 For Bulk deal in Cheap Price.",
    "Kingdom Grocery Shop No. 5 (GPS No 27), Offering Lowest Prices and Up to 60% Off on Bulk Deals. Contact: 15-01-505 (drakes2030)",
    "Discover amazing prices at Pearl 24/7 Store №28! Always open, always ready for Los Santos!",
    "Pearl 24/7 Store №28 offers -50% discounts in-store! Dont miss -80% bulk deals! Call us: 5550069!",
    "Need a shop near Sandy Shores? We are the cheapest 24/7 of SH side! (GPS №29) We offer 50% sale for all products",
    "Attention Solar Panel Plantation Owners! Maximize your profits with cheapest solar panels! Contact for bulk orders (azuujah)",
    "Hello Los Santos. ZO-ZO 24/7 (Shop No30) Waiting For You On Bulk Orders. 50% To 80% OFF Each Order. Keep Smile With Order Now.",
    "Enjoy a massive 50% discount on store items at 24/7 Store №8 (GPS №30), at Grand Senora Desert. Call 98-54-268 for details.",
    "Mighty Cyber  24/7 Store №.9 (GPS 78) is offering 50% discount for all products.",
    "Welcome to 24/7 Store №9 (GPS 78) is offering  discount for all products. Bulk Orders? Reach out (shodangaming) at mail and get exclusive deals!",
    "Why pay more? Evox Store No.10 (GPS N119) is open 24/7 with up to 90% off lowest prices, day or night!",
    "Evox Imrane 24/7 Store No.10 (GPS N119)  50% off today! Bulk orders? Email us at mails (evox.co)  to save more!",
    "Need something quick? Visit Conco 24/7 Store №11 (GPS №120) for fast access anytime. Always stocked for daily needs. Dial 18-09-842 (montalliago)",
    "Buying in bulk? Visit Conco 24/7 Store №11 (GPS №120) and save more with bulk discounts. Always stocked and ready. Call 18-09-842 (montalliago)",
    "Kings 24/7 Store №121 Get up to 80% off on bulk orders. Quality guaranteed. Open daily with great value on all your essential everyday items.",
    "Kings 24/7 Store №121 Day or night our shelves stay full. From groceries to daily must haves we are always stocked and ready when you walk in.",
    "Come down to BestMoney 24/7 (GPS 123) for the cheapest prices in Paleto Bay! Need bulk orders? We got you covered.",
    "Traveling through Paleto Bay? Stop by Store No13 (GPS123), open 24/7 with travel essentials at great prices. Your one-stop shop on the highway!",
    "Go Grab 24/7, Shop No125, affordable prices with 50% off on all orders! Bulk orders? Enjoy special rates! Contact mails (190uzair)",
    "Go Grab 24/7, Shop No125 always in stock, located in the ghetto, Welcome for bulk orders, Contact us on mails (190uzair)",
    "Do you need items to complete your tasks?  Head to Molotov 24/7 store in Mirror park (GPS №128) for the lowest prices in city.",
    "Lottery tickets, backpacks, solar panels, fishing rods or flowers? Molotov 24/7 (GPS №128) is always stocked and 50%! Contact us for bulk orders!",
    "The holiday season is here! Get your fireworks for New Year! Only at 24/7 Store near the beach! №129",
    "Wifey got your credit card? Her expenses making you broke! No worries The Beach 24/7 Store №129 now offers 50% discount.",
    "Get nonstop cheap rates at Joy Virellii 24/7 Store №18 (GPS №139). Bulk orders welcome. Contact  29-29-290 or masthangaming786 today.",
    "Bulk orders at guaranteed low price. Joy Virellii 24/7 Store №18 (GPS №139). Contact 29-29-290 or masthangaming786 for details now.",
    "Running low on budget? Then look no further! 24/7 Store No19 (GPS 140) is offering 24/7 the best quality goods with 50% off!",
    "Why wait? 24/7 store No19 (GPS 140) is the cheapest in the city. Visit us anytime, 50% discount on Bulk Orders! Contact (only696).",
    "Shopiva 24/7 (No.141) has 50% OFF Bulk orders. We are Open Day and Night providing premium service. Contact .proden to get your stock quickly.",
    "Shopiva 24/7 store (GPS 141) is now offering lowest price guaranteed in the whole city!! Visit now located at the core of Los Santos near Hotel!!",
    "Mall 24/7 Store №270 Save BIG on everything -50% in-store, -80% on bulk orders, LOWEST prices in the heart of the city.",
    "Mall 24/7 Store №270 is at -50% OFF! Make easy money with solar panels and mushroom seeds at the LOWEST prices in the city!",
    
    // Gas Station Templates
    "Cheapest Means Best! Come Gas Station NO 3 (GPS No4) inside city FUEL $8!",
    "Gas Station NO 3 (GPS No4) Repair kit $70 Canister $140 For bulk orders (mail devrimcicoban)",
    "We make your gas stop easier, Sahara Royal Gas Station №6 will make sure every drop counts!!",
    "Planning a trip? Need fuel cans and repair kits in case of emergency? Gas Station №6 is here with 50% discount. Every drop counts!!!",
    "Are you run out of fule? Do not worry, just come in Indian oil station №7 (On GPS) is providing high quality fuel in every drop! And visit again.",
    "New in this city? Why are you pay $20 for fuel ? Come to Indian oil gas station №7 (On GPS ). Pay only $8 per liter and save your money.",
    "Do you need high quality fuel for your car? Ron Gas station №8 will provide you excellent fuel for your cars Only $20 per liter. Make your car happy.",
    "Ron Gas station №8 offering 50% discount today. Come get your high quality fuel for your car.",
    "Visit Gas station №6 (GPS №9) will provide $10 per liter, $100 repair kit and $200 canister cheapest fuel in the city.",
    "Gas station №6 (GPS №9) provides cheapest fuel in the city. Provide only $100 repair kit and $200 canister. For bulk orders, contact (nudhory).",
    "Quality fuel and great service at Gas Station 10. Best prices and service in town. Visit Tsunami station today.",
    "Fuel your journey at Gas Station 10. Tsunami provides top-tier service and quality gas every day.",
    "Quality fuel and great service at Gas Station 11. Best prices and service in town. Visit Charon station today.",
    "Fuel your journey at Gas Station 11. Charon provides top-tier service and quality gas every day.",
    "Visit Rich Man gas station (GPS №13) will provide $20 per liter, $350 repair kit and $500 canister cheapest fuel in Rich Man.",
    "Rich Man Gas Station (GPS 13) - 50% off all fuel! Cheapest in town, do not miss out! Bulk orders, contact (badpedro6)",
    "Drive extra miles with Remix Gas station (№14). High quality fuel for a smooth ride, get your gas always for $10, $200 canisters and $100 repair kits.",
    "Remix Gas station №14 The cheapest in the city, buy fuel canister and repair kit in bulk. Contact us by email on (b0n0is)",
    "Running out of fuel on your road trip? Fill up at XR OIL GAS STATION (GPS №15)! Also offers premium fuel, gas canisters, and repair kits.",
    "Looking for the cheapest fuel? XR OIL GAS STATION (GPS №15) offers fuel for just $5 and the lowest prices on gas canisters and repair kits.",
    "Running out of fuel on your road trip? Fill up at KEK OIL GAS STATION (GPS №16)! Also offers premium fuel, gas canisters, and repair kits.",
    "Looking for the cheapest fuel? KEK OIL GAS STATION (GPS №16) offers fuel for just $10 and the lowest prices on gas canisters and repair kits.",
    "Empty tank? No panic! Liff Gas Station (№17) near Doc Highway offers best city prices fuel at $10 per liter, $300 repair kits and $500 canisters.",
    "Liff Gas Station (№17), get the best cheapest fuel in the city with a 50% discount, where superior driving meets smart savings.",
    "Driving near SAHP? Swing by the Cheapest Gas Station (GPS №18) - full stock, fast service, and everything your ride needs!",
    "Running low? Gas Station (GPS NO-18)! Fuel up fast and grab essentials. For bulk deals, Contact us via mails (raveelkhan).",
    "Brody Station $10-L deal! Brody Station №21! Open 24/7, lowest fuel price. Full stock, helipad, free delivery on bulk orders. Contact (bawan3) today!",
    "Save on Fuel! $10-L at Brody Station No21! Open 24/7, lowest price guarantee. Helipad and free delivery for bulk orders. Reach out to (bawan3) now!",
    "Need a quick fuel stop? We got you covered at just $5 per litre! Top-quality fuel, and reliable support. Bulk orders? Contact Immortals Jaadu today!",
    "Running low on fuel ? Stop by Immortals Fuel – fuel at only $5 per litre, plus repair kits $100 and canisters $200 available! DM for bulk orders now.",
    "Welcome to Ron Gas Station №18 (GPS 115). Drive in for quality fuel, special discounts, and bulk order support. Contact (5andeep).",
    "Drive smart with Ron Gas Station №18 (GPS 115). Fuel $15 per liter. Canister $350. Repair Kit $250. Discounts & bulk orders. Contact (5andeep).",
    "Mobil Gas Station No17 (GPS 116). Fuel up fast with trusted service. Bulk fuel & offers available. Contact (amulyt).",
    "Mobil Gas Station No17 (GPS 116). Quick & reliable. Fuel $15/L, Canister $350, Repair Kit $250. Bulk deals available. Contact (amulyt).",
    "Stuck in Paleto Bay? Visit Loves Gas Station №117! Fuel up at just $12/L. Great prices on all essentials!",
    "Loves Fuel №117 – Just $12/L! Save more with bulk deals. Msg (rockyfearless) now to lock in your supply!",
    "Surya Pluxury Gas Station №118 offers $5/L Fuel, $200 Canisters, $100 Repair Kits! Limited time only. Call now: 93-50-311",
    "Tired of paying too much for good quality fuel? Jordan fuel works GPS №118 provides products in cheap and fuel at only $10 per litre inside city!",
    "SHER Gas Station Your One Stop Destination for Quality Fuel and Convenient Services. Visit us at GPS 124!",
    "Gas Station No. 124 offers cheap prices in the city. For more details, contact me in email yassir001.",
    "Listen up riders! Need quality fuel? Visit Gas Station №21 (GPS №127) fuel up, grab kits, and get back in motion. PH: 22-64-883.",
    "Running low? Dont push that luck. Visit Gas station №21 (GPS №127) for high quality fuel and canisters. Contact: 22-64-883.",
    "Renegades Gas Station, in the middle of the map, GPS №136 offers the LOWEST Price Per Liter, just $7. For bulk orders, Contact HELLBRAZER or VAILLYRP.",
    "Limited time discounts at Gas Station GPS №136 $7 Per Liter, cheap Repair Kits and Canisters! Do not miss out! Contact: (HELLBRAZER or VAILLYRP)",
    "OILARC Gas Station No23 (GPS 137) Near Hospital of Sandy Shores, Providing 50% discount on Fuel and everything. For bulk orders mails (rupoj).",
    "Running low on fuel near Sandy shoes? Visit OILARC Gas station No23 (GPS 137) Providing fuel at $5 Per litre. For bulk orders mails (rupoj).",
    
    // Parking Templates
    "With our parking number 1 (GPS №51)  we are offering 1000 per place! come take your car and dont miss this opportunity.",
    "Party lovers unite! Go to Parking №2 - where events shine, parties pop and the beach view beats your dance moves.",
    "Car fans unite! Go to Parking №2 - where engines roar, lights glow and every ride turns heads at the hottest beach meet.",
    "Are you afraid of scratching your vehicles? Do not be afraid, use Ekip Parking Lot (GPS №53)",
    "Unique Comfort and Security Only Book at EKIP Parking (GPS№53), Guarantee Luxury Care for Your Vehicle!",
    "Are you afraid of scratching your vehicles? Dont be afraid, use Ekip Parking Lot (GPS №54)",
    "Unique Comfort and Security Only Book at EKIP Parking (GPS №54), Guarantee Luxury Care for Your Vehicle!",
    "Take your car from the garage, drive and park in luxury. Parking №5 (GPS №55) VIP style and security for $1.000",
    "Dont look for a parking space in the crowd! Your car is safe with Parking №5 (GPS №55). Regular spaces and pocket friendly prices await you.",
    "Tired of paying $15,000 to rent? Park 6 (GPS №56) is located under Vinewood. Only $1,000 to park your car for the whole day.",
    "Are you looking for safe, hygienic and economical parking? (No56) You are in the right place!",
    "Looking for parking lots? Parking (GPS №57) is now offering 90% off and is only $1.000 per day.",
    "Dont forget to visit us at Eileen Parking (GPS №57). Customer satisfaction is our top priority.",
    "Parking №8 (GPS №58) Near City mall in the middle of the city is offering the cheapest rates in the city. Book your space today for only $1.000!",
    "Parking №8 (GPS №58) Near City mall middle of the city is the best and safest place to park in city. Visit us today for cheap parking!",
    "Secure the cheapest Parking №10 (GPS №79) in the city Center for just $1.000 each day. Prime location near beach market, affordable rates.",
    "Looking for a parking? Limited offer, dont miss out just 1000$ at Playboys Parking! (GPS №79)",
    "Dont look for a parking space in the crowd! Your car is safe with Parking №11 (GPS №80). Regular spaces and pocket friendly prices await you.",
    "Unique Comfort and Security Only  Book at EKIP Parking (GPS №80), Guarantee Luxury Care for Your Vehicle!",
    "Are you bored of paying $15.000 for renting? Parking 12 (GPS №81) is located in the center of the city Just $1.000 to have your car parked all day.",
    "Tired of your car not being where you left it? Use Parking 12 (GPS 81) For a very cheap price!",
    "Some security can only be found at Remix Parking Lot Guarding, cleaning and security. 50% cash back when dealing with us Contact me via (zekomyth)",
    "Unique Comfort and Security Only  Book at Remix Parking (GPS №82), Guarantee Luxury Care for Your Vehicle! 50% cash back Contact me via (zekomyth)",
    "Are you afraid of scratching your vehicles? Dont be afraid, use Ekip Parking Lot (GPS №83).",
    "Unique Comfort and Security Only Book at EKIP Parking (GPS №83), Guarantee Luxury Care for Your Vehicle!",
    "Are you bored of paying $15.000 for renting? Parking 15 (GPS №84) is located in the middle of the beach. Just $5.000 to have your car parked all day.",
    "Are you bored of paying $15.000 for renting? Parking 15 (GPS №84) is located in the middle of the beach. Just $1.000 to have your car parked all day.",
    "Parking space №16 (GPS №85) attached to the Train Station Apartment, is offering the cheapest rates in the city. Book your space today for only $1.000",
    "Parking №16 (GPS №85) attached to the Train Station Apartment is the best and safest place to park in city. Visit us today for cheap parking!",
    "Secure the cheapest Parking №17 (GPS №101) in the city Center for just $1.000 each day. Prime location, affordable rates. Reserve your spot now!",
    "Homeless? Secure parking (GPS №101) for your car! Reserve now, park with ease. The citys cheapest at $1.000 a day!",
    "Tired of circling the block in search of parking? Welcome to Parking (GPS №135), your hassle solution for suitable and secure parking, at $1.000 only!",
    "Rockford Parking №18. (GPS №135). Just $1.000 per day near Hotel and LI. Offer for completing jobs task! Just contact me. (kosa.123).",
    
    // Family Templates
    "Seeking Power, Unity and Legacy? Uchiha Clan provides Great Vibes, Strong Bonds and Endless Fun. Join us at House №55 or Contact (maxuchihax).",
    "Looking for Strength, Loyalty and Family? Uchiha Clan offers Unity, Fun and True Respect. Join us at House №55 or Contact (maxuchihax).",
    "Join Kingdom family at House №258 Provides Best bonus, supercars, helis and supportive staff. To join call 77-66-888 or mail king.kaushik",
    "Kingdom family is open at House №258. Providing high bonus, best cars, helis and helpful team. Ph. 77-66-888 or mails king.kaushik",
    "The Deluca Cartel is looking for skilled individuals, A family built on trust, unity and respect. Join Deluca Cartel at house №536 today!",
    "Looking for a strong family with loyal people and skilled individuals? Join Deluca Cartel at house №536 today, become a part of something powerful!",
    
    // Clothing Shop Templates
    "Upgrade your style this week at Clothing Shop n1 (GPS 31) ! Special offers, lowest prices, and exclusive outfits. Don t miss out!",
    "Upgrade your style at Clothing Shop n1 (GPS 31) ! Special prices, exclusive outfits. For bulk orders Contact via email (topgs1)",
    "Shop the latest styles at great prices. Trendy clothes for every occasion. Visit us today and refresh your wardrobe with 50% off Clothing Shop (No.32)",
    "Clothing store 2 (No.32) is offering 50% discount and more than 50% discount for bulk order message me in email (rupoj) or contact 1181112",
    "Best style, best prices at TrendZone (Shop 3 on map). Look great for less! PH 6326759 MAILS nzoo.x.",
    "Upgrade your wardrobe at Fashion Point (Shop 3 on map). Hot styles, low prices! PH 6326759 MAILS nzoo.x.",
    "Clothing Shop №4 at (GPS №74) provides quality clothes at wholesale rates. Get 50% off and more on bulk orders. Ph. 66-60-333. Mails (abirsikder70)",
    "Clothing Shop №4 at (GPS №74) provides clothes at wholesale rates. Enjoy 50% off sales, best for bulk orders. Ph.66-60-333 or mail (abirsikder70)",
    "Come to our Store No5 (GPS 75) to dress stylishly and affordably. For bulk purchases, contact me via email at (halilbeyy45).",
    "For stylish and affordable clothes, visit No5 (GPS 75) and contact us via email (halilbeyy45)",
    "Come to our Store No7 (GPS 122) to dress stylishly and affordably. For bulk purchases, contact me via email at (halilbeyy45).",
    "For stylish and affordable clothes, visit No7 (GPS 122) and contact us via email (halilbeyy45).",
    "Are You Looking For Bulk Clothes For Families? Come Contact Clothing Store 6 ( GPS 126), At Cheapest Price You Cant Imagine!",
    "You Want Best Quality Clothes, With Cheapest Price You Cant Imagine? Come Clothing Shop 6 (GPS 126), And Get Maximum Discount And Cashback!",
    "Getting bored with old outfits? Visit Troy Collection Shop №142 for unique and branded clothing at 70% discount!",
    "If boys are not looking at you! Visit Troy Collection Shop №142 at 70% discount for all the clothing.",
    "Everyone deserves a great look! Visit to Veneta Clothing (№143) and get yourself a great outfit at a 50% discount! We are located at near Postal.",
    "Veneta Clothing Store (№143) has the lowest prices, the latest, high quality clothes and is always fully stocked! for family bulk orders contact us.",
    "Need clothes for your family at the best price? Shop at Moonlight Clothing Shop (GPS №144) for unbeatable deals! Contact (lkaan5) now!",
    "Clothing store №144 has lowest price at 50% Discount for high quality clothes and is always fully stocked! Contact (lkaan5) now!",
    "Upgrade your style at LAAALO Clothing Shop No12 (GPS 145) ! Special offers and exclusive outfits. For bulk orders, contact me via email at (xlaaalo).",
    "LIMITED TIME! Clothing Shop №12 (GPS 145) 50% OFF EVERYTHING - best deals in the city! Pull up now before its gone! For Bulk orders contact (xlaaalo)",
    "Clothing Shop GPS №146 (Shop No.13 on map). Perfect for families and daily wear. Bulk orders available. PH: 98-54-268 or email (sachin2309).",
    "Hurry up! 50% discount at Clothing Shop (№.13) best styles at great prices. Visit now before the offer ends. Contact 98-54-268 or email (sachin2309).",
    "Los Santos Clothing Store (GPS №271) is now offering 50% Off in all products! Located inside the biggest mall in the city.",
    "Dont forget once again the crazy deals of Los Santos Clothing Store (GPS №271). Now offering 50% Off in all products!",
    "Level up your style for less. Clothing Shop №2 (GPS №275) offers top looks low prices and new drops daily. Visit us today or call (26-96-969).",
    "Fresh styles low prices daily. Visit us today for best deals at Clothing Shop №2 (GPS №275) contact me via mails at (azarel.11) or call (26-96-969)."
];

function getAmmunitionTemplate(shopNum, tempIdx) {
    const map = {
        "39": [6, 7],
        "40": [8, 9],
        "41": [10, 11],
        "111": [12, 13],
        "147": [14, 15],
        "148": [16, 17],
        "149": [18, 19],
        "150": [20, 21],
        "151": [22, 23],
        "152": [24, 25],
        "269": [26, 27]
    };
    const indices = map[shopNum];
    if (indices) {
        const idx = indices[parseInt(tempIdx) - 1];
        return OFFICIAL_TEMPLATES[idx];
    }
    return null;
}

function getOfficeTemplate(officeNum, tempIdx) {
    const map = {
        "24": [28, 29],
        "585": [30, 31],
        "677": [32, 33],
        "1000": [34, 35],
        "1017": [36, 37],
        "1288": [38, 39],
        "1419": [40, 41],
        "1948": [42, 43],
        "2198": [44, 45],
        "2796": [46, 47],
        "7963": [48, 49],
        "10364": [50, 51],
        "12313": [52, 53],
        "13724": [54, 55],
        "14396": [56, 57],
        "14633": [58, 59],
        "15136": [60, 61],
        "21046": [62, 63],
        "27650": [64, 65],
        "32125": [66], // Template 1 only
        "33698": [67, 68],
        "41760": [69, 70],
        "50367": [71, 72],
        "52942": [73, 74],
        "78981": [75, 76],
        "85042": [77, 78],
        "85235": [79, 80]
    };
    const indices = map[officeNum];
    if (indices) {
        const idx = indices[parseInt(tempIdx) - 1];
        if (idx !== undefined) {
            return OFFICIAL_TEMPLATES[idx];
        }
    }
    return null;
}

function getStore247Template(shopNum, tempIdx) {
    const map = {
        "23": [81, 82],
        "24": [83, 84],
        "25": [85, 86],
        "26": [87, 88],
        "27": [89, 90],
        "28": [91, 92],
        "29": [93, 94],
        "30": [95, 96],
        "78": [97, 98],
        "119": [99, 100],
        "120": [101, 102],
        "121": [103, 104],
        "123": [105, 106],
        "125": [107, 108],
        "128": [109, 110],
        "129": [111, 112],
        "139": [113, 114],
        "140": [115, 116],
        "141": [117, 118],
        "270": [119, 120]
    };
    const indices = map[shopNum];
    if (indices) {
        const idx = indices[parseInt(tempIdx) - 1];
        if (idx !== undefined) {
            return OFFICIAL_TEMPLATES[idx];
        }
    }
    return null;
}

function getGasStationTemplate(shopNum, tempIdx) {
    const map = {
        "4": [121, 122],
        "6": [123, 124],
        "7": [125, 126],
        "8": [127, 128],
        "9": [129, 130],
        "10": [131, 132],
        "11": [133, 134],
        "13": [135, 136],
        "14": [137, 138],
        "15": [139, 140],
        "16": [141, 142],
        "17": [143, 144],
        "18": [145, 146],
        "21": [147, 148],
        "23": [149, 150],
        "115": [151, 152],
        "116": [153, 154],
        "117": [155, 156],
        "118": [157, 158],
        "124": [159, 160],
        "127": [161, 162],
        "136": [163, 164],
        "137": [165, 166]
    };
    const indices = map[shopNum];
    if (indices) {
        const idx = indices[parseInt(tempIdx) - 1];
        if (idx !== undefined) {
            return OFFICIAL_TEMPLATES[idx];
        }
    }
    return null;
}

function getParkingTemplate(shopNum, tempIdx) {
    const map = {
        "51": [167],
        "52": [168, 169],
        "53": [170, 171],
        "54": [172, 173],
        "55": [174, 175],
        "56": [176, 177],
        "57": [178, 179],
        "58": [180, 181],
        "79": [182, 183],
        "80": [184, 185],
        "81": [186, 187],
        "82": [188, 189],
        "83": [190, 191],
        "84": [192, 193],
        "85": [194, 195],
        "101": [196, 197],
        "135": [198, 199]
    };
    const indices = map[shopNum];
    if (indices) {
        const idx = indices[parseInt(tempIdx) - 1];
        if (idx !== undefined) {
            return OFFICIAL_TEMPLATES[idx];
        }
    }
    return null;
}

function getFamilyTemplate(shopNum, tempIdx) {
    const map = {
        "55": [200, 201],
        "258": [202, 203],
        "536": [204, 205]
    };
    const indices = map[shopNum];
    if (indices) {
        const idx = indices[parseInt(tempIdx) - 1];
        if (idx !== undefined) {
            return OFFICIAL_TEMPLATES[idx];
        }
    }
    return null;
}

function getClothingTemplate(shopNum, tempIdx) {
    const map = {
        "31": [206, 207],
        "32": [208, 209],
        "50": [210, 211],
        "74": [212, 213],
        "75": [214, 215],
        "122": [216, 217],
        "126": [218, 219],
        "142": [220, 221],
        "143": [222, 223],
        "144": [224, 225],
        "145": [226, 227],
        "146": [228, 229],
        "271": [230, 231],
        "275": [232, 233]
    };
    const indices = map[shopNum];
    if (indices) {
        const idx = indices[parseInt(tempIdx) - 1];
        if (idx !== undefined) {
            return OFFICIAL_TEMPLATES[idx];
        }
    }
    return null;
}

function getTemplateCategory(templateIndex) {
    const discountIndices = [
        9, 10, 11, 12, 13, 15, 19, 21, 23, 25, 27,
        81, 82, 86, 87, 88, 89, 90, 92, 93, 95, 96, 97, 99, 100, 103, 107, 112, 115, 116, 117, 119, 120,
        121, 124, 126, 128, 129, 135, 136, 140, 142, 144, 157, 164, 165,
        208, 209, 212, 213, 219, 220, 221, 222, 225, 227, 229, 230, 231
    ];
    return discountIndices.includes(templateIndex) ? "Discounts" : "Services";
}

function isTemplateAd(text) {
    if (!text) return false;
    
    // Check custom shorthand templates trained via Admin Panel (check ALL entries for best match)
    let bestCustomShortLen = 0;
    let bestCustomShortMatch = false;
    const cleanInputForCustom = text.trim().toLowerCase();
    for (const ct of customTemplates) {
        if (ct.shorthand) {
            const cleanShort = ct.shorthand.trim().toLowerCase();
            if (cleanInputForCustom === cleanShort || cleanInputForCustom.includes(cleanShort)) {
                const remaining = cleanInputForCustom.replace(cleanShort, "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
                if (remaining.length < 5 && cleanShort.length > bestCustomShortLen) {
                    bestCustomShortLen = cleanShort.length;
                    bestCustomShortMatch = true;
                }
            }
        }
    }
    if (bestCustomShortMatch) {
        return true;
    }
    
    // Check if it is a shorthand template request (Ammunition)
    const shorthandMatch = text.match(/\b(?:ammunition\s+store|ammunation\s+store|ammo\s+store|ammo|weapon\s+shop|gun\s+store|weapon\s+store|rifleclub|bobbys|canikpide|wong|pew\s+pew|lue|siddhu|most\s+wanted|central\s+mall)?\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(39|40|41|111|147|148|149|150|151|152|269)\s+\b(?:temp|template|t)\s*([12])\b/i);
    if (shorthandMatch) {
        const remaining = text.replace(shorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            return true;
        }
    }

    // Check if it is a shorthand template request (Office)
    const officeShorthandMatch = text.match(/\b(?:(?:[a-z\s]+)?office)?\s*(?:No\.?|\u2116|#|-)?\s*(24|585|677|1000|1017|1288|1419|1948|2198|2796|7963|10364|12313|13724|14396|14633|15136|21046|27650|32125|33698|41760|50367|52942|78981|85042|85235)\s+\b(?:temp|template|t)\s*([12])\b/i);
    if (officeShorthandMatch) {
        const remaining = text.replace(officeShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            return true;
        }
    }

    // Check if it is a shorthand template request (24/7 Store)
    const storeShorthandMatch = text.match(/\b(?:store\s+)?24\/7(?:\s+store)?\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(23|24|25|26|27|28|29|30|78|119|120|121|123|125|128|129|139|140|141|270)\s+\b(?:temp|template|t)\s*([12])\b/i);
    if (storeShorthandMatch) {
        const remaining = text.replace(storeShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            return true;
        }
    }

    // Check if it is a shorthand template request (Gas Station)
    const gasShorthandMatch = text.match(/\b(?:gas\s+station|gas\s+stn|gas|fuel|station|stn|ron|sahara|indian|tsunami|charon|remix|xr|kek|liff|brody|immortals|mobil|loves|surya|jordan|sher|renegades|oilarc)?\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(4|6|7|8|9|10|11|13|14|15|16|17|18|21|23|115|116|117|118|124|127|136|137)\s+\b(?:temp|template|t)\s*([12])\b/i);
    if (gasShorthandMatch) {
        const remaining = text.replace(gasShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            return true;
        }
    }

    // Check if it is a shorthand template request (Family)
    const familyShorthandMatch = text.match(/\b(?:family|fam|uchiha|kingdom|deluca)?\s*(?:gps\s*|house\s*|h\s*)?(?:No\.?|\u2116|#)?\s*(55|258|536)\s+\b(?:temp|template|t)\s*([12])\b/i);
    if (familyShorthandMatch) {
        const remaining = text.replace(familyShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            return true;
        }
    }

    // Check if it is a shorthand template request (Parking)
    let parkingShorthandMatch = text.match(/\b(?:parking\s+lot|parking|park|ekip|eileen|remix|playboys|rockford)\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(55)\s+\b(?:temp|template|t)\s*([12])\b/i);
    if (!parkingShorthandMatch) {
        parkingShorthandMatch = text.match(/\b(?:parking\s+lot|parking|park|ekip|eileen|remix|playboys|rockford)?\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(51|52|53|54|56|57|58|79|80|81|82|83|84|85|101|135)\s+\b(?:temp|template|t)\s*([12])\b/i);
    }
    if (parkingShorthandMatch) {
        const remaining = text.replace(parkingShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            return true;
        }
    }

    // Check if it is a shorthand template request (Clothing Shop)
    const clothingShorthandMatch = text.match(/\b(?:clothing\s+shop|clothing\s+store|clothing|wear|style|fashion|trendzone)?\s*(?:gps\s*|No\.?|\u2116|#)?\s*(31|32|50|74|75|122|126|142|143|144|145|146|271|275)\s+\b(?:temp|template|t)\s*([12])\b/i);
    if (clothingShorthandMatch) {
        const remaining = text.replace(clothingShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            return true;
        }
    }
    
    let cleanText = text.replace(/^(?:[a-zA-Z0-9\s\u2116#\-:()&]+)?(?:template|temp)\s+\d+[-\s]*/i, "").trim();
    let tempText = cleanText.replace(/\b(?:price|budget)?\s*(?:negotiable|negable|negoitable|nego|neg|nogotaible|nogotable|nogotiable|negotioble|negotoable)\b/gi, "")
                            .replace(/\b(?:for|at|price|budget)?\s*[\$\d\.,kKmMbB\s]+(?:each)?\b/gi, "")
                            .replace(/\b\d+\s*[%]?\s*and\s*\d+\s*[%]?\s*juices?\b/gi, "")
                            .trim();
    const combinedTemplates = OFFICIAL_TEMPLATES.concat(customTemplates.map(t => t.text));
    const match1 = getClosestMatch(tempText, combinedTemplates, 0.65);
    if (match1) return true;
    return getClosestMatch(cleanText, combinedTemplates, 0.65) !== null;
}

/* ==========================================================================
   🧠 SmartMatcher — Centralized Intelligent Matching Engine
   All dictionary lookups in the system route through these utilities.
   ========================================================================== */

function detectActionCategory(text) {
    if (!text) return "other";
    const lower = text.toLowerCase();
    
    // Check Buying
    if (/\b(buying|buy|wtb|purchase|purchasing|want to buy)\b/i.test(lower)) {
        return "buying";
    }
    // Check Selling
    if (/\b(selling|sell|wts|sale)\b/i.test(lower)) {
        return "selling";
    }
    // Check Renting
    if (/\b(renting|rent|wtr)\b/i.test(lower)) {
        return "renting";
    }
    // Check Hiring
    if (/\b(hiring|hire)\b/i.test(lower)) {
        return "hiring";
    }
    
    return "other";
}

function stripActualPrices(text) {
    if (!text) return "";
    return text
        .replace(/\$\s*[\d.,]+\s*(?:k|m|mil|million|billion|b|trillion)?/gi, "")
        .replace(/\b[\d.,]+\s*(?:k|m|mil|million|billion|b|trillion)\b/gi, "")
        .replace(/\b(?:price|budget)\s*[:.]?\s*(?:negotiable|nego)?\.?\s*/gi, "")
        .replace(/\s+/g, " ").trim();
}

function getCanonicalKey(text) {
    if (!text) return "";
    return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function stripPricesFromText(text) {
    if (!text) return "";
    return text
        .replace(/\$\s*[\d.,]+\s*(?:k|m|mil|million|billion|b|trillion)?/gi, "")
        .replace(/\b[\d.,]+\s*(?:k|m|mil|million|billion|b|trillion)\b/gi, "")
        .replace(/\b(?:price|budget)\s*[:.]?\s*(?:negotiable|nego)?\.?\s*/gi, "")
        .replace(/\b\d{2,}\b/g, "")
        .replace(/\s+/g, " ").trim();
}

function getSemanticCanonicalKey(text) {
    if (!text) return "";
    return stripPricesFromText(text).toLowerCase().replace(/[^a-z]/g, "");
}

function extractTranslationValue(val) {
    if (!val) return val;
    let res = val;
    if (val.startsWith("{") && val.endsWith("}")) {
        try {
            const parsed = JSON.parse(val);
            res = parsed.text || val;
        } catch (e) {}
    }
    if (typeof res === "string" && res.toLowerCase().includes("__has_each__")) {
        res = res.replace(/__has_each__/gi, "each").replace(/\s+/g, " ").trim();
    }
    return res;
}

/**
 * Extracts meaningful tokens from text, stripping stopwords, prices, and noise.
 * Used for token-level comparison across the brain.
 */
const _smartMatcherStopwords = new Set([
    "selling", "buying", "trading", "renting", "hiring", "sell", "buy", "trade",
    "rent", "hire", "want", "with", "budget", "price", "negotiable", "each",
    "respectively", "quality", "years", "experience", "and", "the", "for",
    "near", "a", "an", "of", "to", "at", "in", "on", "or", "out", "per",
    "week", "month", "day", "looking", "search", "searching", "find", "finding"
]);

function extractMeaningfulTokens(text) {
    if (!text) return [];
    return stripPricesFromText(text)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(t => t.length >= 2 && !_smartMatcherStopwords.has(t));
}

/**
 * Splits compound words into possible sub-tokens.
 * e.g. "gunstore" → ["gun", "store"], "carshop" → ["car", "shop"]
 */
function splitCompoundWord(word) {
    if (!word || word.length < 4) return [word];
    const results = [];
    // Try all possible splits of 2+ chars on each side
    for (let i = 2; i <= word.length - 2; i++) {
        const left = word.substring(0, i);
        const right = word.substring(i);
        if (left.length >= 2 && right.length >= 2) {
            results.push([left, right]);
        }
    }
    return results;
}

/**
 * Checks if tokenA fuzzy-matches tokenB (single tokens).
 * Returns similarity score 0-1, or 0 if no match.
 */
function tokenFuzzyMatch(tokenA, tokenB) {
    if (!tokenA || !tokenB) return 0;
    const a = tokenA.toLowerCase();
    const b = tokenB.toLowerCase();
    if (a === b) return 1.0;
    // Levenshtein similarity
    const dist = levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length);
    const sim = maxLen > 0 ? (1 - dist / maxLen) : 0;
    return sim >= 0.70 ? sim : 0;
}

/**
 * Compute token coverage score: what fraction of inputTokens are matched
 * by the keyTokens (including fuzzy matching).
 * Word-order independent. Returns 0.0 to 1.0.
 */
function computeTokenCoverage(inputTokens, keyTokens) {
    if (inputTokens.length === 0) return 0;
    if (keyTokens.length === 0) return 0;
    
    let matchedCount = 0;
    let totalScore = 0;
    
    for (const inputTok of inputTokens) {
        let bestTokScore = 0;
        // Direct fuzzy match against key tokens
        for (const keyTok of keyTokens) {
            const score = tokenFuzzyMatch(inputTok, keyTok);
            if (score > bestTokScore) bestTokScore = score;
        }
        if (bestTokScore > 0) {
            matchedCount++;
            totalScore += bestTokScore;
        }
    }
    
    // Coverage = matched/total, weighted by match quality
    const coverage = matchedCount / inputTokens.length;
    const avgQuality = matchedCount > 0 ? (totalScore / matchedCount) : 0;
    return coverage * avgQuality;
}

/**
 * Master smart lookup function. Searches a dictionary using all intelligence tiers.
 * @param {string} input - The raw input text
 * @param {Object} dictionary - Key→value dictionary to search
 * @param {Object} options - { fuzzyThreshold, stripPrices, minTokenCoverage, extractValue }
 * @returns {{ found, value, matchType, similarity, originalKey }}
 */
function smartDictLookup(input, dictionary, options = {}) {
    const {
        fuzzyThreshold = 0.75,
        stripPrices = true,
        minTokenCoverage = 0.70,
        extractValue = false
    } = options;
    
    if (!input || !dictionary) return { found: false };
    
    const trimmedInput = input.replace(/\s+/g, ' ').trim().toLowerCase();
    const getVal = extractValue ? extractTranslationValue : (v) => v;
    
    // Tier 1: Exact Match
    if (dictionary[trimmedInput]) {
        return {
            found: true, value: getVal(dictionary[trimmedInput]),
            matchType: "exact", originalKey: trimmedInput
        };
    }
    
    const entries = Object.entries(dictionary);
    if (entries.length === 0) return { found: false };
    
    // Tier 2: Canonical Match (strip spaces/punctuation, keep numbers)
    const canonicalInput = getCanonicalKey(input);
    if (canonicalInput) {
        for (const [key, val] of entries) {
            if (getCanonicalKey(key) === canonicalInput) {
                return {
                    found: true, value: getVal(val),
                    matchType: "canonical", originalKey: key
                };
            }
        }
    }
    
    // Tier 3: Semantic Canonical (strip prices + spaces)
    // IMPORTANT: Only match if the number of meaningful tokens are compatible.
    // e.g. "sell gun shop 300m" vs trained "sell gun shop" — same semantic key
    // after price stripping, but they are different ads because 300m is a real price.
    if (stripPrices) {
        const semanticInput = getSemanticCanonicalKey(input);
        const inputTokenCount = extractMeaningfulTokens(input).length;
        if (semanticInput && semanticInput.length >= 4) {
            for (const [key, val] of entries) {
                if (getSemanticCanonicalKey(key) === semanticInput) {
                    const keyTokenCount = extractMeaningfulTokens(key).length;
                    // Reject if the input has significantly more meaningful tokens
                    // (a price-bearing ad is a different ad, not the same ad)
                    if (Math.abs(inputTokenCount - keyTokenCount) <= 1) {
                        return {
                            found: true, value: getVal(val),
                            matchType: "semantic", originalKey: key
                        };
                    }
                }
            }
        }
    }
    
    // Tier 4: Token Coverage Scoring (word-order independent, compound-aware)
    const inputTokens = extractMeaningfulTokens(input);
    let bestTokenMatch = null;
    let highestTokenScore = 0;
    let bestRequiredScore = minTokenCoverage;
    
    if (inputTokens.length >= 1) {
        for (const [key, val] of entries) {
            const keyTokens = extractMeaningfulTokens(key);
            if (keyTokens.length === 0) continue;
            
            // Score: how well do input tokens cover key tokens?
            const inputCoversKey = computeTokenCoverage(inputTokens, keyTokens);
            // Also check reverse: how well do key tokens cover input tokens?
            const keyCoversInput = computeTokenCoverage(keyTokens, inputTokens);
            // Use average coverage to ensure bidirectional token relevance and prevent small keys from matching large inputs
            const score = (inputCoversKey + keyCoversInput) / 2;
            const maxTokens = Math.max(inputTokens.length, keyTokens.length);
            let requiredScore = minTokenCoverage;
            if (maxTokens <= 2) {
                requiredScore = 0.90;
            } else if (maxTokens === 3) {
                requiredScore = 0.80;
            }
            
            if (score >= requiredScore && score > highestTokenScore) {
                highestTokenScore = score;
                bestRequiredScore = requiredScore;
                bestTokenMatch = {
                    found: true, value: getVal(val),
                    matchType: "token-coverage",
                    similarity: Math.round(score * 100),
                    originalKey: key
                };
            }
        }
    }
    
    // Use the correct per-token-count requiredScore as the final guard (not the loose minTokenCoverage)
    if (bestTokenMatch && highestTokenScore >= bestRequiredScore) {
        return bestTokenMatch;
    }
    
    // Tier 5: Fuzzy String Match (Levenshtein on price-stripped forms)
    let bestFuzzy = null;
    let highestFuzzySim = 0;
    
    const strippedInput = (stripPrices ? stripPricesFromText(input) : input)
        .toLowerCase().replace(/\s+/g, ' ').trim();
    
    for (const [key, val] of entries) {
        const strippedKey = (stripPrices ? stripPricesFromText(key) : key)
            .toLowerCase().replace(/\s+/g, ' ').trim();
        
        const dist = levenshteinDistance(strippedInput, strippedKey);
        const maxLength = Math.max(strippedInput.length, strippedKey.length);
        const similarity = maxLength > 0 ? (1 - dist / maxLength) : 0;
        
        if (similarity >= fuzzyThreshold && similarity > highestFuzzySim) {
            highestFuzzySim = similarity;
            bestFuzzy = {
                found: true, value: getVal(val),
                matchType: "fuzzy",
                similarity: Math.round(similarity * 100),
                originalKey: key
            };
        }
    }
    
    if (bestFuzzy) {
        return bestFuzzy;
    }
    
    return { found: false };
}

/**
 * Check if a training entry is a duplicate of an existing one.
 * @param {string} newKey - The proposed new dictionary key
 * @param {string} newValue - The proposed new value
 * @param {Object} dictionary - The existing dictionary to check against
 * @returns {{ isDuplicate, reason, existingKey }}
 */
function isDuplicateTrainingEntry(newKey, newValue, dictionary) {
    if (!newKey || !dictionary) return { isDuplicate: false };
    
    const normKey = newKey.toLowerCase().replace(/\s+/g, ' ').trim();
    const normVal = (newValue || "").toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Check 1: Input equals output (redundant)
    if (normKey === normVal) {
        return { isDuplicate: true, reason: "Input is identical to output" };
    }
    
    // Check 2: Exact key already exists
    if (dictionary[normKey]) {
        return { isDuplicate: true, reason: "Exact key already exists", existingKey: normKey };
    }
    
    // Check 3: Canonical duplicate
    const canonKey = getCanonicalKey(newKey);
    for (const existing of Object.keys(dictionary)) {
        if (getCanonicalKey(existing) === canonKey) {
            return { isDuplicate: true, reason: "Canonical duplicate exists", existingKey: existing };
        }
    }
    
    // Check 4: Semantic duplicate (price-stripped)
    const semKey = getSemanticCanonicalKey(newKey);
    if (semKey && semKey.length >= 4) {
        for (const existing of Object.keys(dictionary)) {
            if (getSemanticCanonicalKey(existing) === semKey) {
                return { isDuplicate: true, reason: "Semantic duplicate exists", existingKey: existing };
            }
        }
    }
    
    // Check 5: Fuzzy near-duplicate (90%+)
    for (const existing of Object.keys(dictionary)) {
        const cleanExisting = existing.toLowerCase().replace(/\s+/g, ' ').trim();
        const dist = levenshteinDistance(normKey, cleanExisting);
        const maxLen = Math.max(normKey.length, cleanExisting.length);
        const sim = maxLen > 0 ? (1 - dist / maxLen) : 0;
        if (sim >= 0.90) {
            return { isDuplicate: true, reason: "Near-duplicate exists (≥90% similar)", existingKey: existing };
        }
    }
    
    return { isDuplicate: false };
}

/* ==========================================================================
   Number-Preserving Template Matching
   When a semantic/token match differs only in numbers, substitute the
   input's numbers into the output. e.g. "selling 6 charger" matched
   to "selling 10 charger" → output becomes "Selling 6 chargers."
   ========================================================================== */

function applyNumberSubstitution(inputText, matchedKey, matchedOutput) {
    // Use stripActualPrices instead of stripPricesFromText to keep naked numbers (SIM numbers, IDs, quantities)
    const cleanInput = stripActualPrices(inputText).toLowerCase().replace(/\s+/g, ' ').trim();
    const cleanKey = stripActualPrices(matchedKey).toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Extract remaining numbers in positional order
    const inputNums = cleanInput.match(/\b\d+\b/g) || [];
    const keyNums = cleanKey.match(/\b\d+\b/g) || [];
    
    // If neither has numbers, then there's nothing to substitute (trivial match success)
    if (inputNums.length === 0 && keyNums.length === 0) {
        return matchedOutput;
    }
    
    // If number counts differ, they represent different structures, so reject
    if (inputNums.length !== keyNums.length) {
        return null;
    }
    
    // Create structural templates by replacing all remaining numbers with a placeholder
    const inputTemplate = cleanInput.replace(/\b\d+\b/g, '{#}');
    const keyTemplate = cleanKey.replace(/\b\d+\b/g, '{#}');
    
    // Normalize templates (toLowerCase, strip plurals 's\b', strip non-alphanumeric)
    const canonInput = inputTemplate.toLowerCase().replace(/s\b/g, "").replace(/[^a-z0-9]/g, "");
    const canonKey = keyTemplate.toLowerCase().replace(/s\b/g, "").replace(/[^a-z0-9]/g, "");
    
    // Fuzzy compare templates structure
    const dist = levenshteinDistance(canonInput, canonKey);
    const maxLen = Math.max(canonInput.length, canonKey.length);
    const similarity = maxLen > 0 ? (1 - dist / maxLen) : 0;
    
    if (similarity < 0.80) {
        return null;
    }
    
    // Check if any numbers actually differ
    let hasDiff = false;
    for (let i = 0; i < keyNums.length; i++) {
        if (keyNums[i] !== inputNums[i]) {
            hasDiff = true;
            break;
        }
    }
    if (!hasDiff) return matchedOutput;
    
    // Substitute: replace each key number with the corresponding input number in the output
    let result = matchedOutput;
    let substitutionSuccessful = true;
    
    for (let i = 0; i < keyNums.length; i++) {
        if (keyNums[i] !== inputNums[i]) {
            const keyNum = keyNums[i];
            const inputNum = inputNums[i];
            
            // Try exact match first
            const exactRegex = new RegExp(`\\b${keyNum}\\b`);
            if (exactRegex.test(result)) {
                result = result.replace(exactRegex, inputNum);
            } else {
                // Format-aware match (handling hyphens, spaces, dots inside output)
                const digits = keyNum.split("");
                const formatRegexPattern = digits.map(d => `${d}`).join("\\D*");
                const formatRegex = new RegExp(formatRegexPattern);
                
                const match = result.match(formatRegex);
                if (match) {
                    const matchedStr = match[0];
                    let formatted = "";
                    let inputIdx = 0;
                    for (let j = 0; j < matchedStr.length; j++) {
                        const char = matchedStr[j];
                        if (/\d/.test(char)) {
                            if (inputIdx < inputNum.length) {
                                formatted += inputNum[inputIdx++];
                            }
                        } else {
                            formatted += char; // Keep formatting separators (e.g. hyphens or spaces)
                        }
                    }
                    // Append remaining digits if any
                    while (inputIdx < inputNum.length) {
                        formatted += inputNum[inputIdx++];
                    }
                    result = result.replace(matchedStr, formatted);
                } else {
                    substitutionSuccessful = false;
                }
            }
        }
    }
    
    return substitutionSuccessful ? result : null;
}

/* ==========================================================================
   findTrainedMapping — STRICT exact/canonical lookup only.
   Trained translations are specific corrections for specific raw inputs.
   They must NEVER fire on loosely similar or partially matching inputs.
   Only Tier 1 (exact) and Tier 2 (canonical — minor punctuation/case differences)
   are allowed. No price-stripping, no token coverage, no fuzzy matching.
   ========================================================================== */

function findTrainedMapping(rawText) {
    if (!rawText || !customTranslations) return { found: false };

    const trimmedInput = rawText.replace(/\s+/g, ' ').trim().toLowerCase();

    // --- Tier 1: Exact match ---
    if (customTranslations[trimmedInput]) {
        return {
            found: true,
            fixedText: extractTranslationValue(customTranslations[trimmedInput]),
            matchType: "exact",
            similarity: 100,
            originalKey: trimmedInput
        };
    }

    // --- Tier 2: Canonical match ---
    // Strips punctuation/extra spaces but KEEPS all words and numbers.
    // Allows "sell gun-shop" to match "sell gun shop" but NOT "sell gun shop 300m".
    const canonicalInput = getCanonicalKey(trimmedInput);
    for (const [key, val] of Object.entries(customTranslations)) {
        if (getCanonicalKey(key) === canonicalInput) {
            return {
                found: true,
                fixedText: extractTranslationValue(val),
                matchType: "canonical",
                similarity: 99,
                originalKey: key
            };
        }
    }

    // No match — let the standard validation pipeline handle it.
    return { found: false };
}

function validateTrainingAction(rawTextVal, fixedTextVal, onProceed) {
    if (!rawTextVal || !fixedTextVal) return;

    const trimmedRaw = rawTextVal.replace(/\s+/g, ' ').trim().toLowerCase();
    const trimmedFixed = fixedTextVal.replace(/\s+/g, ' ').trim().toLowerCase();

    // 1. Identity Prevention
    if (trimmedRaw === trimmedFixed) {
        showCustomNotification("The ad is already valid as-is. Training an identity mapping is unnecessary.", "warning");
        return;
    }

    // 2. Input Quality Check
    const alphaOnly = rawTextVal.replace(/[^a-zA-Z]/g, "");
    if (rawTextVal.trim().length < 4 || alphaOnly.length < 2) {
        showCustomNotification("This input is too short or lacks readable text, making it unsuitable for training.", "warning");
        return;
    }

    // 3. Duplicate / Near-Duplicate checks
    const match = findTrainedMapping(rawTextVal);
    if (match.found) {
        const trimmedExistingFixed = match.fixedText.replace(/\s+/g, ' ').trim().toLowerCase();
        if (trimmedExistingFixed === trimmedFixed) {
            showCustomNotification(`A similar mapping already exists: "${match.originalKey}" -> "${match.fixedText}". Duplicate training is blocked.`, "warning");
            return;
        } else {
            // Different correction - prompt to overwrite
            showCustomConfirmDialog(
                `A similar mapping already exists with a different correction:\n\nOriginal: "${match.originalKey}"\nExisting Correction: "${match.fixedText}"\n\nDo you want to overwrite it with the new correction?\nNew Correction: "${fixedTextVal}"`,
                () => {
                    // Let's delete the old key if it is different, to keep DB clean, and then proceed.
                    if (match.originalKey !== trimmedRaw) {
                        delete customTranslations[match.originalKey];
                    }
                    onProceed();
                }
            );
            return;
        }
    }

    // 4. Default Rule Coverage check
    const tempTranslations = customTranslations;
    customTranslations = {};
    let alreadyCorrect = false;
    try {
        const mockCtx = {
            raw: rawTextVal,
            logs: [],
            finalText: "",
            status: "pending",
            category: "Other"
        };
        runValidationPipeline(mockCtx, "auto");
        if (mockCtx.status === "passed" && mockCtx.finalText.replace(/\s+/g, ' ').trim().toLowerCase() === trimmedFixed) {
            alreadyCorrect = true;
        }
    } catch(e) {
        console.error("Default rule redundancy check failed:", e);
    } finally {
        customTranslations = tempTranslations;
    }

    if (alreadyCorrect) {
        showCustomConfirmDialog(
            `Warning: This ad is already correctly handled by standard policy rules. Custom training is redundant.\n\nDo you still want to proceed with custom training?`,
            onProceed
        );
        return;
    }

    // If all checks pass, show normal confirm dialog
    showCustomConfirmDialog(
        `Train translation mapping for:\n\nOriginal: "${rawTextVal}"\n\nCorrected: "${fixedTextVal}"?`,
        onProceed
    );
}

function runValidationPipeline(ctx, override) {
    // 0. Advanced direct translation mapping matching (Advanced Learning Method)
    const match = findTrainedMapping(ctx.raw);
    if (match.found) {
        let logMsg = "";
        if (match.matchType === "exact") {
            logMsg = `🧠 Matched trained translation: <strong>${match.fixedText}</strong>`;
        } else if (match.matchType === "canonical") {
            logMsg = `🧠 Matched trained translation (normalized): <strong>${match.fixedText}</strong>`;
        } else if (match.matchType === "semantic") {
            logMsg = `🧠 Matched trained translation (semantic, price-stripped): <strong>${match.fixedText}</strong>`;
        } else if (match.matchType === "token-coverage") {
            logMsg = `🧠 Matched trained translation (intelligent token match, ${match.similarity}%): <strong>${match.fixedText}</strong>`;
        } else if (match.matchType === "fuzzy") {
            logMsg = `🧠 Matched trained translation (fuzzy, ${match.similarity}%): <strong>${match.fixedText}</strong>`;
        }
        ctx.logs.push({ text: logMsg, type: 'policy' });
        ctx.finalText = match.fixedText;
        ctx.category = override === "auto" ? detectCategory(ctx.finalText) : override;
        ctx.status = "passed";
        
        // Recover phone number from raw ad if present
        const phoneMatch = ctx.raw.match(/\b\d{4,10}\b/);
        if (phoneMatch) {
            ctx.phoneNumber = phoneMatch[0];
        }
        return;
    }

    // 1. Initial sanitization of text
    let text = ctx.raw.replace(/\s+/g, ' ').trim();
    text = correctSpelling(text, ctx);
    text = normalizePricesInText(text);
    
    // 2. Safety / Prohibited items checks (Weapons, Drugs, Scanners)
    if (!isTemplateAd(text)) {
        checkProhibitedItems(text, ctx);
        if (ctx.status === "blacklisted") {
            return;
        }
    }
    
    // 3. Category Detection
    if (override === "auto") {
        ctx.category = detectCategory(text);
        ctx.logs.push({ text: `Auto-detected category: <strong>${ctx.category}</strong>`, type: 'policy' });
    } else {
        ctx.category = override;
        ctx.logs.push({ text: `Category overridden to: <strong>${ctx.category}</strong>`, type: 'policy' });
    }
    
    if (/\bowner\b/i.test(text)) {
        ctx.isOwnerSearch = true;
        ctx.actionOverride = "Looking for";
        ctx.category = "Businesses";
    }
    
    // 4. Normalize Action (Buying, Selling, Trading, Renting)
    let action = "Selling"; // default
    let lowerText = text.toLowerCase();
    
    const isEvent = /^(?:pool\s+)?party\b/i.test(lowerText) || 
                    /^(?:wedding|car\s+meet)\b/i.test(lowerText) || 
                    /\b(?:party|wedding|car\s+meet)\s+at\b/i.test(lowerText);
                    
    if (isEvent) {
        action = "";
    } else if (ctx.category === "Dating") {
        action = "Looking";
    } else if (ctx.actionOverride && ctx.actionOverride !== "auto") {
        action = ctx.actionOverride;
        ctx.logs.push({ text: `Action overridden to "${action}"`, type: 'policy' });
    } else {
        const actionPatterns = [
            {
                action: "Selling or trading",
                patterns: [/\bselling or trading\b/i, /\bsell or trade\b/i, /\bselling\/trading\b/i, /\bwts\/wtt\b/i]
            },
            {
                action: "Renting out",
                patterns: [/\brenting out\b/i, /\brent out\b/i]
            },
            {
                action: "Renting_Check",
                patterns: [/\brenting\b/i, /\brent\b/i]
            },
            {
                action: "Hiring",
                patterns: [/\bhiring\b/i, /\bhire\b/i]
            },
            {
                action: "Looking for",
                patterns: [/\blooking for\b/i, /\blook for\b/i, /\bsearching for\b/i, /\bsearch for\b/i]
            },
            {
                action: "Buying",
                patterns: [/\bbuying\b/i, /\blooking to buy\b/i, /\blooking to purchase\b/i, /\bbuy\b/i, /\bwant to buy\b/i, /\bwtb\b/i]
            },
            {
                action: "Trading",
                patterns: [/\btrading\b/i, /\btrade\b/i, /\bwtt\b/i]
            },
            {
                action: "Selling",
                patterns: [/\bselling\b/i, /\bsell\b/i, /\bwts\b/i]
            }
        ];

        let matched = false;
        // Check for matches at the beginning first (highest priority)
        for (const ap of actionPatterns) {
            for (const pat of ap.patterns) {
                const startPat = new RegExp("^" + pat.source, "i");
                if (startPat.test(lowerText)) {
                    if (ap.action === "Renting_Check") {
                        if (lowerText.includes("budget") || lowerText.includes("looking for")) {
                            action = "Renting";
                        } else {
                            action = "Renting out";
                        }
                    } else {
                        action = ap.action;
                    }
                    ctx.logs.push({ text: `Normalized starting action to "${action}"`, type: 'correction' });
                    matched = true;
                    break;
                }
            }
            if (matched) break;
        }

        // If not matched at the start, check anywhere in the text
        if (!matched) {
            for (const ap of actionPatterns) {
                for (const pat of ap.patterns) {
                    if (pat.test(lowerText)) {
                        if (ap.action === "Renting_Check") {
                            if (lowerText.includes("budget") || lowerText.includes("looking for")) {
                                action = "Renting";
                            } else {
                                action = "Renting out";
                            }
                        } else {
                            action = ap.action;
                        }
                        ctx.logs.push({ text: `Normalized action to "${action}"`, type: 'correction' });
                        matched = true;
                        break;
                    }
                }
                if (matched) break;
            }
        }
    }
    
    if (action === "Trading" && !lowerText.includes(" for ")) {
        action = "Selling or trading";
        ctx.logs.push({ text: `Normalized starting action from "Trading" to "Selling or trading" because no target was specified with "for"`, type: 'correction' });
    }
    ctx.action = action;
    
    // 5. Price / Budget / Rent Parsing
    parsePriceAndBudget(text, action, ctx);
    
    // Clean ad body by stripping price keywords
    let adBody = cleanPriceKeywords(text, ctx);
    // Strip action prefixes/suffixes
    adBody = adBody.replace(/^(buying|selling or trading|selling|trading|renting out|renting|hiring|wtb|wts|wtt|buy|sell|trade|rent|hire|looking to purchase|looking to buy|want to buy|searching for|looking for|searching|look for|looking|search|look)\s+(a\s+|an\s+)?/i, "").trim();
    adBody = adBody.replace(/\s+(buying|selling or trading|selling|trading|renting out|renting|hiring|wtb|wts|wtt|buy|sell|trade|rent|hire|looking to purchase|looking to buy|want to buy|searching for|looking for|searching|look for|looking|search|look)$/i, "").trim();
    // Strip leading/trailing punctuation again
    adBody = adBody.replace(/^[^\w"'()\s]+|[^\w"'()\s]+$/g, "").trim();
    
    // 6. Category-specific rules and fuzzy corrections
    let processedBody = "";
    
    switch (ctx.category) {
        case "Auto":
            processedBody = formatAutoAd(adBody, action, ctx);
            break;
        case "Real Estate":
            processedBody = formatRealEstateAd(adBody, action, ctx);
            break;
        case "Work":
            processedBody = formatWorkAd(adBody, action, ctx);
            break;
        case "Dating":
            processedBody = formatDatingAd(adBody, action, ctx);
            break;
        case "Businesses":
            if (ctx.isOwnerSearch) {
                processedBody = formatOwnerSearchAd(adBody, ctx);
            } else {
                processedBody = formatBusinessesAd(adBody, action, ctx);
            }
            break;
        case "Services":
        case "Discounts":
            processedBody = formatTemplateAd(adBody, ctx.category, ctx);
            break;
        case "Other":
        default:
            processedBody = formatOtherAd(adBody, action, ctx);
            break;
    }
    
    if (ctx.status !== "passed") {
        return;
    }
    
    action = ctx.action;
    
    // 7. Format Location Capitalization & Prepositions
    processedBody = formatLocationTerms(processedBody, ctx);
    
    // 8. Assemble Final Ad Text
    // Capitalize first letter of the ad
    let mainSentence = `${action} ${processedBody}`.trim();
    mainSentence = mainSentence.replace(/__has_each__/gi, "").replace(/\s+/g, ' ').trim();
    mainSentence = mainSentence.charAt(0).toUpperCase() + mainSentence.slice(1);
    
    // Insert Price details
    let pricePart = "";
    // Suppress price/budget label when category is Dating, Services, Discounts, when the raw text contains "beach market" / "beach markit", or when it is a party/wedding/car meet event.
    const lowerRaw = ctx.raw.toLowerCase();
    const isBeachMarket = (/beach\s*mar[kt]et/i.test(lowerRaw) || lowerRaw.includes("beach markit")) && 
                          !["Real Estate", "Auto", "Businesses"].includes(ctx.category);
    const isEventAd = /^(?:pool\s+)?party\b/i.test(lowerRaw) || 
                      /^(?:wedding|car\s+meet)\b/i.test(lowerRaw) || 
                      /\b(?:party|wedding|car\s+meet)\s+at\b/i.test(lowerRaw);
    const isRentSuppressed = ctx.category === "Real Estate" && (action === "Renting" || action === "Renting out");
    const suppressPriceLabel = ["Dating", "Services", "Discounts"].includes(ctx.category) || isBeachMarket || isEventAd || ctx.isOwnerSearch || action === "Trading" || action === "Looking for" || isRentSuppressed;
    
    if (ctx.priceInfo && ctx.priceInfo.value !== "Negotiable") {
        let label = ctx.priceInfo.type; // Price, Budget, Rent, Bet
        let val = ctx.priceInfo.value;
        pricePart = ` ${label}: ${val}`;
        
        // Add "per week" or "for X days" if renting
        if ((action === "Renting" || action === "Renting out") && !ctx.priceInfo.value.toLowerCase().includes("week") && !ctx.priceInfo.value.toLowerCase().includes("day") && !ctx.priceInfo.value.toLowerCase().includes("negotiable")) {
            // Renting period is required. If not found, reject
            ctx.status = "rejected";
            ctx.rejectionReason = "Please indicate rental period.";
            ctx.logs.push({ text: `Rejected: Rent duration is missing from the ad.`, type: 'danger' });
            return;
        }
    } else if (!suppressPriceLabel) {
        // Fallback pricing label
        let label = "Price";
        if (ctx.category === "Work") label = "Salary";
        else if (ctx.raw.toLowerCase().includes("dice") || ctx.raw.toLowerCase().includes("poker")) label = "Bet";
        else if (action === "Buying" || action === "Renting" || action === "Looking") label = "Budget";
        else if (action === "Renting out") label = "Rent";
        
        pricePart = ` ${label}: Negotiable.`;
    }
    
    // Combine and apply terminal period rules
    let finalAd = `${mainSentence}.${pricePart}`.replace(/\.\.+/g, '.').replace(/\s+/g, ' ').trim();
    
    // If the ad ends with a period, remove it first to check our rules
    if (finalAd.endsWith('.')) {
        finalAd = finalAd.slice(0, -1);
    }
    
    // EN3 Policy: "If the ad ends with a numerical value, then there is no need for a period (.)"
    // Only omit period if the final portion of the ad is a numerical price.
    const isNumericalPriceAtEnd = /(?:Price|Budget|Rent|Bet|Salary):\s*\$?\d+(?:[.]\d+)*$/i.test(finalAd);
    if (!isNumericalPriceAtEnd) {
        finalAd += ".";
    }

    // Clean up any double punctuation at the end (e.g. !. -> ! or ?. -> ?)
    if (finalAd.endsWith("!.")) {
        finalAd = finalAd.slice(0, -1);
    } else if (finalAd.endsWith("?.")) {
        finalAd = finalAd.slice(0, -1);
    }
    
    ctx.finalText = finalAd;
}

/* ==========================================================================
   Category Detection Rules
   ========================================================================== */

function detectCategory(text) {
    const lower = text.toLowerCase();
    
    // Check if it's the "charger" item to prevent false vehicle matching to Bravado Charger Daytona
    const isRealChargerVehicle = /\b(?:bravado|srt|daytona|1969)\b/i.test(lower);
    const hasChargerItemWord = /\b(?:charger|chargers|charging)\b/i.test(lower);
    if (hasChargerItemWord && !isRealChargerVehicle) {
        return "Other";
    }

    // Check for clothing first to prevent generic adjectives/colors from false vehicle matching (e.g. "Black gloves")
    if (matchClothingItem(text)) {
        return "Other";
    }
    
    // Check if it is a service role search (which goes to "Other" category)
    const isServiceSearch = /\b(?:looking for|searching for|look for|search for)\b/i.test(lower);
    const serviceRoles = /\b(?:lawyer|driver|dancer|singer|dj)\b/i.test(lower);
    if (isServiceSearch && serviceRoles) {
        return "Other";
    }
    
    // Check for cage pets and shoulder pets before vehicle matching to prevent false matches
    // (e.g. "cage with a rat" matching "Rat Bike", "cage with a pug" matching "Peugeot" etc.)
    if (/\b(?:cage|pet|shoulder\s+pet|on\s+shoulder)\b/i.test(lower) && !lower.includes("pet food")) {
        return "Other";
    }
    
    const vehCheck = matchVehicle(text);
    
    if (isTemplateAd(text)) {
        // Check custom trained templates shorthand first (check ALL entries for best match)
        let bestCatShortLen = 0;
        let bestCatShortCategory = null;
        const cleanInputForCat = text.trim().toLowerCase();
        for (const ct of customTemplates) {
            if (ct.shorthand) {
                const cleanShort = ct.shorthand.trim().toLowerCase();
                if (cleanInputForCat === cleanShort || cleanInputForCat.includes(cleanShort)) {
                    const remaining = cleanInputForCat.replace(cleanShort, "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
                    if (remaining.length < 5 && cleanShort.length > bestCatShortLen) {
                        bestCatShortLen = cleanShort.length;
                        bestCatShortCategory = ct.category;
                    }
                }
            }
        }
        if (bestCatShortCategory) {
            return bestCatShortCategory;
        }

        let matchedIndex = -1;
        
        // 1. Try shorthand first
        const shorthandMatch = text.match(/\b(?:ammunition\s+store|ammunation\s+store|ammo\s+store|ammo|weapon\s+shop|gun\s+store|weapon\s+store|rifleclub|bobbys|canikpide|wong|pew\s+pew|lue|siddhu|most\s+wanted|central\s+mall)?\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(39|40|41|111|147|148|149|150|151|152|269)\s+\b(?:temp|template|t)\s*([12])\b/i);
        const familyShorthandMatch = text.match(/\b(?:family|fam|uchiha|kingdom|deluca)?\s*(?:gps\s*|house\s*|h\s*)?(?:No\.?|\u2116|#)?\s*(55|258|536)\s+\b(?:temp|template|t)\s*([12])\b/i);
        const clothingShorthandMatch = text.match(/\b(?:clothing\s+shop|clothing\s+store|clothing|wear|style|fashion|trendzone)?\s*(?:gps\s*|No\.?|\u2116|#)?\s*(31|32|50|74|75|122|126|142|143|144|145|146|271|275)\s+\b(?:temp|template|t)\s*([12])\b/i);
        const officeShorthandMatch = text.match(/\b(?:(?:[a-z\s]+)?office)?\s*(?:No\.?|\u2116|#|-)?\s*(24|585|677|1000|1017|1288|1419|1948|2198|2796|7963|10364|12313|13724|14396|14633|15136|21046|27650|32125|33698|41760|50367|52942|78981|85042|85235)\s+\b(?:temp|template|t)\s*([12])\b/i);
        const storeShorthandMatch = text.match(/\b(?:store\s+)?24\/7(?:\s+store)?\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(23|24|25|26|27|28|29|30|78|119|120|121|123|125|128|129|139|140|141|270)\s+\b(?:temp|template|t)\s*([12])\b/i);
        const gasShorthandMatch = text.match(/\b(?:gas\s+station|gas\s+stn|gas|fuel|station|stn|ron|sahara|indian|tsunami|charon|remix|xr|kek|liff|brody|immortals|mobil|loves|surya|jordan|sher|renegades|oilarc)?\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(4|6|7|8|9|10|11|13|14|15|16|17|18|21|23|115|116|117|118|124|127|136|137)\s+\b(?:temp|template|t)\s*([12])\b/i);
        let parkingShorthandMatch = text.match(/\b(?:parking\s+lot|parking|park|ekip|eileen|remix|playboys|rockford)\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(55)\s+\b(?:temp|template|t)\s*([12])\b/i);
        if (!parkingShorthandMatch) {
            parkingShorthandMatch = text.match(/\b(?:parking\s+lot|parking|park|ekip|eileen|remix|playboys|rockford)?\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(51|52|53|54|56|57|58|79|80|81|82|83|84|85|101|135)\s+\b(?:temp|template|t)\s*([12])\b/i);
        }
        if (shorthandMatch) {
            const remaining = text.replace(shorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
            if (remaining.length < 5) {
                const shopNum = shorthandMatch[1];
                const tempIdx = shorthandMatch[2];
                const map = {
                    "39": [6, 7], "40": [8, 9], "41": [10, 11], "111": [12, 13],
                    "147": [14, 15], "148": [16, 17], "149": [18, 19], "150": [20, 21],
                    "151": [22, 23], "152": [24, 25], "269": [26, 27]
                };
                const indices = map[shopNum];
                if (indices) {
                    matchedIndex = indices[parseInt(tempIdx) - 1];
                }
            }
        } else if (storeShorthandMatch) {
            const remaining = text.replace(storeShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
            if (remaining.length < 5) {
                const shopNum = storeShorthandMatch[1];
                const tempIdx = storeShorthandMatch[2];
                const map = {
                    "23": [81, 82],
                    "24": [83, 84],
                    "25": [85, 86],
                    "26": [87, 88],
                    "27": [89, 90],
                    "28": [91, 92],
                    "29": [93, 94],
                    "30": [95, 96],
                    "78": [97, 98],
                    "119": [99, 100],
                    "120": [101, 102],
                    "121": [103, 104],
                    "123": [105, 106],
                    "125": [107, 108],
                    "128": [109, 110],
                    "129": [111, 112],
                    "139": [113, 114],
                    "140": [115, 116],
                    "141": [117, 118],
                    "270": [119, 120]
                };
                const indices = map[shopNum];
                if (indices) {
                    matchedIndex = indices[parseInt(tempIdx) - 1];
                }
            }
        } else if (gasShorthandMatch) {
            const remaining = text.replace(gasShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
            if (remaining.length < 5) {
                const shopNum = gasShorthandMatch[1];
                const tempIdx = gasShorthandMatch[2];
                const map = {
                    "4": [121, 122],
                    "6": [123, 124],
                    "7": [125, 126],
                    "8": [127, 128],
                    "9": [129, 130],
                    "10": [131, 132],
                    "11": [133, 134],
                    "13": [135, 136],
                    "14": [137, 138],
                    "15": [139, 140],
                    "16": [141, 142],
                    "17": [143, 144],
                    "18": [145, 146],
                    "21": [147, 148],
                    "23": [149, 150],
                    "115": [151, 152],
                    "116": [153, 154],
                    "117": [155, 156],
                    "118": [157, 158],
                    "124": [159, 160],
                    "127": [161, 162],
                    "136": [163, 164],
                    "137": [165, 166]
                };
                const indices = map[shopNum];
                if (indices) {
                    matchedIndex = indices[parseInt(tempIdx) - 1];
                }
            }
        } else if (parkingShorthandMatch) {
            const remaining = text.replace(parkingShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
            if (remaining.length < 5) {
                const shopNum = parkingShorthandMatch[1];
                const tempIdx = parkingShorthandMatch[2];
                const map = {
                    "51": [167],
                    "52": [168, 169],
                    "53": [170, 171],
                    "54": [172, 173],
                    "55": [174, 175],
                    "56": [176, 177],
                    "57": [178, 179],
                    "58": [180, 181],
                    "79": [182, 183],
                    "80": [184, 185],
                    "81": [186, 187],
                    "82": [188, 189],
                    "83": [190, 191],
                    "84": [192, 193],
                    "85": [194, 195],
                    "101": [196, 197],
                    "135": [198, 199]
                };
                const indices = map[shopNum];
                if (indices) {
                    matchedIndex = indices[parseInt(tempIdx) - 1];
                }
            }
        } else if (familyShorthandMatch) {
            const remaining = text.replace(familyShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
            if (remaining.length < 5) {
                const shopNum = familyShorthandMatch[1];
                const tempIdx = familyShorthandMatch[2];
                const map = {
                    "55": [200, 201],
                    "258": [202, 203],
                    "536": [204, 205]
                };
                const indices = map[shopNum];
                if (indices) {
                    matchedIndex = indices[parseInt(tempIdx) - 1];
                }
            }
        } else if (clothingShorthandMatch) {
            const remaining = text.replace(clothingShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
            if (remaining.length < 5) {
                const shopNum = clothingShorthandMatch[1];
                const tempIdx = clothingShorthandMatch[2];
                const map = {
                    "31": [206, 207],
                    "32": [208, 209],
                    "50": [210, 211],
                    "74": [212, 213],
                    "75": [214, 215],
                    "122": [216, 217],
                    "126": [218, 219],
                    "142": [220, 221],
                    "143": [222, 223],
                    "144": [224, 225],
                    "145": [226, 227],
                    "146": [228, 229],
                    "271": [230, 231],
                    "275": [232, 233]
                };
                const indices = map[shopNum];
                if (indices) {
                    matchedIndex = indices[parseInt(tempIdx) - 1];
                }
            }
        } else if (officeShorthandMatch) {
            const remaining = text.replace(officeShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
            if (remaining.length < 5) {
                const officeNum = officeShorthandMatch[1];
                const tempIdx = officeShorthandMatch[2];
                const map = {
                    "24": [28, 29], "585": [30, 31], "677": [32, 33], "1000": [34, 35],
                    "1017": [36, 37], "1288": [38, 39], "1419": [40, 41], "1948": [42, 43],
                    "2198": [44, 45], "2796": [46, 47], "7963": [48, 49], "10364": [50, 51],
                    "12313": [52, 53], "13724": [54, 55], "14396": [56, 57], "14633": [58, 59],
                    "15136": [60, 61], "21046": [62, 63], "27650": [64, 65], "32125": [66],
                    "33698": [67, 68], "41760": [69, 70], "50367": [71, 72], "52942": [73, 74],
                    "78981": [75, 76], "85042": [77, 78], "85235": [79, 80]
                };
                const indices = map[officeNum];
                if (indices) {
                    matchedIndex = indices[parseInt(tempIdx) - 1];
                }
            }
        } else if (storeShorthandMatch) {
            const remaining = text.replace(storeShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
            if (remaining.length < 5) {
                const shopNum = storeShorthandMatch[1];
                const tempIdx = storeShorthandMatch[2];
                const map = {
                    "23": [81, 82],
                    "24": [83, 84],
                    "25": [85, 86],
                    "26": [87, 88],
                    "27": [89, 90],
                    "28": [91, 92],
                    "29": [93, 94],
                    "30": [95, 96],
                    "78": [97, 98],
                    "119": [99, 100],
                    "120": [101, 102],
                    "121": [103, 104],
                    "123": [105, 106],
                    "125": [107, 108],
                    "128": [109, 110],
                    "129": [111, 112],
                    "139": [113, 114],
                    "140": [115, 116],
                    "141": [117, 118],
                    "270": [119, 120]
                };
                const indices = map[shopNum];
                if (indices) {
                    matchedIndex = indices[parseInt(tempIdx) - 1];
                }
            }
        }
        
        // 2. Try standard matching if shorthand didn't resolve
        if (matchedIndex === -1) {
            let cleanText = text.replace(/^(?:[a-zA-Z0-9\s\u2116#\-:()&]+)?(?:template|temp)\s+\d+[-\s]*/i, "").trim();
            let tempText = cleanText.replace(/\b(?:price|budget)?\s*(?:negotiable|negable|negoitable|nego|neg|nogotaible|nogotable|nogotiable|negotioble|negotoable)\b/gi, "")
                                    .replace(/\b(?:for|at|price|budget)?\s*[\$\d\.,kKmMbB\s]+(?:each)?\b/gi, "")
                                    .replace(/\b\d+\s*[%]?\s*and\s*\d+\s*[%]?\s*juices?\b/gi, "")
                                    .trim();
            const matchedCustom = getClosestMatch(tempText, customTemplates.map(t => t.text), 0.65) || getClosestMatch(cleanText, customTemplates.map(t => t.text), 0.65);
            if (matchedCustom) {
                const found = customTemplates.find(t => t.text === matchedCustom);
                if (found) {
                    return found.category;
                }
            }
            const matched = getClosestMatch(tempText, OFFICIAL_TEMPLATES, 0.65) || getClosestMatch(cleanText, OFFICIAL_TEMPLATES, 0.65);
            if (matched) {
                matchedIndex = OFFICIAL_TEMPLATES.indexOf(matched);
            }
        }
        
        if (matchedIndex !== -1) {
            return getTemplateCategory(matchedIndex);
        }
        
        if (lower.includes("discount") || lower.includes("%") || lower.includes("off")) {
            return "Discounts";
        }
        return "Services";
    }
    
    // Check for explicit "Other" item keywords first to prevent false auto-matching
    const otherKeywords = [
        "ticket", "tcket", "tikcet", "tckets", "tikets", "juice", "battery", "batteries", "metal", "mask", "pet", "shoulder", 
        "fox", "cat", "dog", "drill", "sawmill", "pickaxe", "hookah", "sponge", "timber",
        "copper", "emerald", "ruby", "diamond", "obsidian", "magma stone", "luminous stone", "stone", "stones", "thread", "token",
        "tonic treat", "map", "wire", "plate", "container", "containers", "fuel",
        "party", "wedding", "car meet", "prime", "platinum", "plat",
        "salmon", "carp", "perch", "trout", "megalodon", "ray", "orca", "whale",
        "tuning", "suspension", "transmission", "brakes", "tires",
        "inventory", "inventry", "inventories", "booster", "shot", "shots",
        "rod", "rods", "case", "cases", "crate", "crates",
        "sim", "sim card", "sim cards", "card", "cards", "biospark", "biosparks"
    ];
    const hasOtherKeyword = otherKeywords.some(keyword => {
        if (keyword === "juice" && lower.includes("juice shop")) return false;
        if (keyword === "pet" && lower.includes("pet shop")) return false;
        return lower.includes(keyword);
    });
    if (hasOtherKeyword) {
        // If the keyword is a tuning part keyword, but it ALSO contains a matched vehicle,
        // then it is an Auto ad, not an Other ad!
        const tuningKeywords = ["tuning", "suspension", "transmission", "brakes", "tires"];
        const hasTuningKeyword = tuningKeywords.some(kw => lower.includes(kw));
        
        if (hasTuningKeyword) {
            if (vehCheck) {
                // Do not return Other, let it fall through to Auto check!
            } else {
                return "Other";
            }
        } else {
            return "Other";
        }
    }
    
    // 1. Dating Check
    // Person search check: e.g. "looking for Max Dopamine"
    const personMatch = lower.match(/\b(?:looking for|searching for|look for|search for|looking|searching|look|search)\s+([a-z]+)\s+([a-z]+)\b/i);
    if (personMatch) {
        const pName = personMatch[1] + " " + personMatch[2];
        const isVeh = matchVehicle(pName);
        const isCloth = matchClothingItem(pName);
        const isService = /\b(?:lawyer|driver|dancer|singer|dj|worker|workers|physician|doctor|mechanic|bodyguard|employee|employees|cop|cops|police|officer|officers|admin|assistant|assistants|mediator|mediators)\b/i.test(pName);
        const otherKeywordsList = [
            "ticket", "tcket", "tikcet", "tckets", "tikets", "juice", "battery", "batteries", "metal", "mask", "pet", "shoulder", 
            "fox", "cat", "dog", "drill", "sawmill", "pickaxe", "hookah", "sponge", "timber",
            "copper", "emerald", "ruby", "diamond", "obsidian", "magma stone", "luminous stone", "stone", "stones", "thread", "token",
            "tonic treat", "map", "wire", "plate", "container", "containers", "fuel",
            "party", "wedding", "car meet", "prime", "platinum", "plat",
            "salmon", "carp", "perch", "trout", "megalodon", "ray", "orca", "whale",
            "tuning", "suspension", "transmission", "brakes", "tires",
            "inventory", "inventry", "inventories", "booster", "shot", "shots",
            "rod", "rods", "case", "cases", "crate", "crates",
            "sim", "sim card", "sim cards", "card", "cards", "biospark", "biosparks"
        ];
        const isOtherKw = otherKeywordsList.some(keyword => pName.includes(keyword));
        const isExcluded = isVeh || isCloth || isService || isOtherKw ||
            /\b(?:house|apartment|mansion|penthouse|garage|spaces|warehouse|helipad|gps|temp|template|discount|off|%|biz|business|store|shop|station|wash|sharing|tuning|club|salon|studio|company|cowshed|train|plantation|well|atm|solar|panel|work|job|hiring)\b/i.test(pName);
        
        if (!isExcluded) {
            return "Dating";
        }
    }

    const isDatingSearch = /\b(look|looking|search|searching|want|find|finding)\b/i.test(lower);
    const hasDatingTarget = /\b(wife|girlfriend|boyfriend|husband|valentine|date|spouse|soulmate|alliance)\b/i.test(lower) || 
                            (/\b(friend|friends|family|family\s+members)\b/i.test(lower) && /\b(look|looking|search|searching)\b/i.test(lower));
    if (isDatingSearch && hasDatingTarget && !lower.includes("family business")) {
        return "Dating";
    }
    
    // 2. Work Check
    if (lower.includes("hiring") || lower.includes("looking for work") || lower.includes("looking for a job") ||
        /looking\s+(?:to\s+)?work\b/i.test(lower) || /look\s+(?:to\s+)?work\b/i.test(lower) ||
        /looking\s+for\s+.*work\b/i.test(lower) || /look\s+for\s+.*work\b/i.test(lower) ||
        /looking\s+for\s+a\s+job\b/i.test(lower) || /look\s+for\s+a\s+job\b/i.test(lower) ||
        lower.includes("construction site") || lower.includes("driver") || lower.includes("electrician") ||
        lower.includes("locksmith") || lower.includes("gardener") || lower.includes("surveyor") ||
        lower.includes("trucker") || lower.includes("lawyer") || lower.includes("bodyguard")) {
        return "Work";
    }
    
    // 3. Real Estate Check
    if (lower.includes("house") || lower.includes("apartment") || lower.includes("mansion") || 
        lower.includes("penthouse") || lower.includes("mirror park") || lower.includes("vinewood") || 
        lower.includes("richman") || lower.includes("g.s.") || lower.includes("garage spaces") ||
        lower.includes("warehouse") || lower.includes("w.h.") || lower.includes("helipad")) {
        return "Real Estate";
    }
    
    // 4. Businesses Check
    if (lower.includes("biz") || lower.includes("business") || lower.includes("24/7 store") || 
        lower.includes("ammunition store") || /\batm\b/i.test(lower) || lower.includes("atm business") || lower.includes("car wash") || 
        lower.includes("car sharing") || lower.includes("chip tuning") || lower.includes("clothing shop") || 
        lower.includes("electric station") || lower.includes("fight club") || lower.includes("flower shop") || 
        lower.includes("furniture shop") || lower.includes("gas station") || lower.includes("grand elite") || 
        lower.includes("hair salon") || lower.includes("jewelry store") || lower.includes("juice shop") || 
        lower.includes("luna park") || lower.includes("parking") || lower.includes("pet shop") || 
        lower.includes("state object") || lower.includes("service station") || lower.includes("tattoo studio") || 
        lower.includes("taxi company") || lower.includes("burger shop") || lower.includes("cowshed") || 
        lower.includes("freight train") || lower.includes("plantation") || lower.includes("oil well")) {
        if (vehCheck) {
            // Do not return Businesses, let it fall through to Auto!
        } else {
            return "Businesses";
        }
    }
    
    // 5. Template check for Services / Discounts
    if (lower.includes("gps \u2116") || lower.includes("template")) {
        if (lower.includes("discount") || lower.includes("%") || lower.includes("off")) {
            return "Discounts";
        }
        return "Services";
    }
    
    // 6. Auto Check (Verify if vehicles or auto-related words are present)
    if (vehCheck || /\bcars?\b/i.test(lower) || /\btrucks?\b/i.test(lower) || lower.includes("motorcycle") || 
        lower.includes("bike") || lower.includes("boat") || lower.includes("plane") || 
        lower.includes("helicopter") || /\bheli\b/i.test(lower) || lower.includes("auto fair")) {
        return "Auto";
    }
    
    // 7. Default Category
    return "Other";
}

/* ==========================================================================
   Prohibited Items Checker
   ========================================================================== */

function checkProhibitedItems(text, ctx) {
    const lower = text.toLowerCase();
    
    // Dating Trolling Check
    const datingTargets = ["wife", "husband", "girlfriend", "boyfriend", "gf", "bf", "spouse", "soulmate", "sugar daddy", "sugar mommy", "sugar baby", "sugar babe", "valentine"];
    let matchedDatingTarget = null;
    for (const dt of datingTargets) {
        const regex = new RegExp(`\\b${dt}\\b`, "i");
        if (regex.test(lower)) {
            matchedDatingTarget = dt;
            break;
        }
    }
    
    if (matchedDatingTarget) {
        if (matchedDatingTarget.includes("sugar")) {
            ctx.status = "blacklisted";
            ctx.blacklistReason = "Troll advertisements";
            ctx.rejectionReason = "Trolling advertisements.";
            ctx.logs.push({ text: `Blacklist triggered: Dating troll target <strong>${matchedDatingTarget}</strong>`, type: 'danger' });
            return;
        }
        
        const hasCommercialAction = /\b(sell|selling|buy|buying|trade|trading|wts|wtb|wtt|rent|renting)\b/i.test(lower);
        const cleanForNumbers = lower
            .replace(new RegExp(`\\b(${datingTargets.join("|")})\\b`, "gi"), "")
            .replace(/\b(look|looking|search|searching|find|finding|for|a|an|the)\b/gi, "")
            .trim();
        const hasNumber = /\b\d+(?:\s*[kKmM])?\b/.test(cleanForNumbers);
        const hasPriceIndicator = /\b(price|budget|rent|cost|value|negotiable|nego|each)\b/i.test(lower) || lower.includes("$");
        
        if (hasCommercialAction || hasNumber || hasPriceIndicator) {
            ctx.status = "blacklisted";
            ctx.blacklistReason = "Troll advertisements";
            ctx.rejectionReason = "Trolling advertisements.";
            ctx.logs.push({ text: `Blacklist triggered: Dating troll target <strong>${matchedDatingTarget}</strong> with value/action`, type: 'danger' });
            return;
        }
    }
    
    // Immediate Blacklist Triggers
    const blacklistWeapons = ["firearm", "heavy sniper", "sniper", "pistol", "revolver", "rifle", "shotgun", "ammunition", "ammo", "bulletproof vest", "armored vest", "lui vi armored vest", "body armor"];
    const blacklistDrugs = ["weed", "cannabis", "cocaine", "drug"];
    const blacklistEMS = ["ems surgical", "ems mask", "surgical mask", "medical mask", "covid mask"];
    const blacklistScanners = ["anti-radar", "vehicle scanner", "people scanner", "radar scanner", "radars"];
    const blacklistMisc = ["balaclava", "rope", "lock pick", "hacker tool", "virus usb", "engine block", "smuggling machine", "submodule"];
    
    // Simple Rejection Triggers (No Blacklist)
    const rejectOnly = ["crowbar", "fabric", "head bag", "animal skin", "armor skin", "air horn", "earplug", "barricade", "trap", "poison dart", "army uniform", "tracking sensor", "dangerous razor", "resource scanner", "body armor plate", "ingredients for cocaine", "paper for money", "satellite dish", "tincture of forest mushrooms", "first aid kit", "medkit", "pills", "banana", "burger", "grilled steak"];
    
    // Check Blacklist items
    for (const item of [...blacklistWeapons, ...blacklistDrugs, ...blacklistEMS, ...blacklistScanners, ...blacklistMisc]) {
        const escaped = item.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, "i");
        if (regex.test(lower)) {
            // Context-aware business whitelist — don't blacklist legitimate business names
            const businessContextWords = ["store", "shop", "business", "club", "market", "company", "station", "studio", "salon"];
            const isInBusinessContext = businessContextWords.some(bw => lower.includes(bw));
            if (isInBusinessContext) {
                const knownBusinessPhrases = [
                    "ammunition store", "ammo store", "gun store", "weapon store",
                    "drug lab", "burger shop", "fight club", "rifle club",
                    "gas station", "electric station", "service station"
                ];
                const inputCanonical = lower.replace(/[^a-z0-9\s]/g, '');
                const itemInBusinessPhrase = knownBusinessPhrases.some(phrase => inputCanonical.includes(phrase));
                // Also check trained translations for business context
                let itemInTrainedMapping = false;
                if (typeof customTranslations !== 'undefined' && customTranslations) {
                    const itemClean = item.toLowerCase().replace(/[^a-z0-9]/g, '');
                    for (const trainedKey of Object.keys(customTranslations)) {
                        const trainedClean = trainedKey.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (trainedClean.includes(itemClean)) {
                            const inputSemantic = getSemanticCanonicalKey(lower);
                            const trainedSemantic = getSemanticCanonicalKey(trainedKey);
                            if (inputSemantic.includes(trainedSemantic.substring(0, 6)) ||
                                trainedSemantic.includes(inputSemantic.substring(0, 6))) {
                                itemInTrainedMapping = true;
                                break;
                            }
                        }
                    }
                }
                if (itemInBusinessPhrase || itemInTrainedMapping) {
                    ctx.logs.push({ text: `Blacklist bypassed: <strong>${item}</strong> in business context`, type: 'policy' });
                    continue;
                }
            }
            ctx.status = "blacklisted";
            ctx.blacklistReason = `The advertisement contains illegal item/term: "${item.toUpperCase()}" which triggers an immediate phone blacklist.`;
            ctx.rejectionReason = "Cannot promote illegal items.";
            ctx.logs.push({ text: `Blacklist triggered for illegal item: <strong>${item}</strong>`, type: 'danger' });
            return;
        }
    }
    
    // Check offensive license plates (must be 3-7 characters)
    const plateMatch = lower.match(/license plate\s*\(?([a-z0-9]+)\)?/i);
    if (plateMatch) {
        const plate = plateMatch[1].toLowerCase();
        if (plate.includes("sex") || plate.includes("fuck") || plate.includes("bitch") || plate.includes("cunt") || plate.includes("nigger") || plate.includes("dick")) {
            ctx.status = "blacklisted";
            ctx.blacklistReason = `License plate "${plate.toUpperCase()}" contains inappropriate or offensive language.`;
            ctx.rejectionReason = "Cannot promote illegal items.";
            ctx.logs.push({ text: `Blacklist triggered: Offensive license plate <strong>${plate}</strong>`, type: 'danger' });
            return;
        }
    }
    
    // Check Simple Rejections
    for (const item of rejectOnly) {
        // Exclude luminous head bag from rejection
        if (item === "head bag" && lower.includes("luminous head bag")) {
            continue;
        }
        if (item === "burger" && (lower.includes("burger shop") || lower.includes("burger store"))) {
            continue;
        }
        const escaped = item.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, "i");
        if (regex.test(lower)) {
            ctx.status = "rejected";
            ctx.rejectionReason = `Cannot promote restricted item: "${item.toUpperCase()}".`;
            ctx.logs.push({ text: `Rejected: Advertisement mentions restricted item <strong>${item}</strong>`, type: 'warning' });
            return;
        }
    }
    
    // State Org Parties block (mega mall, black market, government buildings, etc.)
    const restrictedPlaces = ["mega mall", "black market", "lspd", "fib", "sahp", "ems", "government building", "ghetto", "gang hq", "ballas", "vagos", "bloods", "marabunta"];
    if (lower.includes("party")) {
        for (const place of restrictedPlaces) {
            if (lower.includes(place)) {
                ctx.status = "rejected";
                ctx.rejectionReason = `We do not promote parties at restricted place: "${place.toUpperCase()}".`;
                ctx.logs.push({ text: `Rejected: Party promotion at restricted location <strong>${place}</strong>`, type: 'warning' });
                return;
            }
        }
        
        // Green Grass Beach Market Rule
        if (lower.includes("beach market")) {
            ctx.status = "rejected";
            ctx.rejectionReason = "We do not promote parties at any green grass location.";
            ctx.logs.push({ text: `Rejected: Green grass rule violation for <strong>beach market</strong>. (Must change to "the beach")`, type: 'warning' });
            return;
        }
    }
    
    // Grand Coins / Battlepass block
    if (lower.includes("grand coins") || lower.includes("battlepass") || lower.includes("battle pass")) {
        ctx.status = "rejected";
        ctx.rejectionReason = "Item not found in database. (Including Grand Coins and Battlepass)";
        ctx.logs.push({ text: `Rejected: Ad references premium currency/battlepass.`, type: 'warning' });
        return;
    }
}

/* ==========================================================================
   Price & Budget Parsing Utilities
   ========================================================================== */

function normalizePricesInText(text) {
    let result = text;
    // Resolve gaming slang kk -> m, kkk -> b
    result = result.replace(/\b(\d+(?:\.\d+)?)\s*kkk\b/gi, "$1b");
    result = result.replace(/\b(\d+(?:\.\d+)?)\s*kk\b/gi, "$1m");
    // Remove space between digits and common price suffixes (k, m, b)
    result = result.replace(/\b(\d+(?:\.\d+)?)\s*(k|m|mil|ml|b)\b/gi, "$1$2");
    // Resolve decimal commas, e.g., 1,5m -> 1.5m, 15,5 -> 15.5
    result = result.replace(/\b(\d+),(\d+)(?=\s*(?:k|m|mil|ml|b|million|thousand|billion|\b))/gi, "$1.$2");
    // Resolve thousands separators (dots or commas followed by groups of three digits)
    result = result.replace(/\b(\d{1,3})(?:[.,](\d{3}))+\b/g, (match) => {
        return match.replace(/[.,]/g, "");
    });
    return result;
}

function parsePriceAndBudget(text, action, ctx) {
    const lower = text.toLowerCase();
    ctx.priceMatches = [];
    
    // Price type determination
    let priceType = "Price";
    if (lower.includes("dice") || lower.includes("poker")) priceType = "Bet";
    else if (ctx.category === "Work") priceType = "Salary";
    else if (action === "Buying" || action === "Renting" || action === "Looking") priceType = "Budget";
    else if (action === "Renting out") priceType = "Rent";
    
    // Check if explicitly negotiable
    let isNegotiable = false;
    const negoRegex = /\b(?:negotiable|negotiab|nego|nogotaible|nogotable|nogotiable|negotioble|negotoable)\b/gi;
    const negoMatch = text.match(negoRegex);
    if (negoMatch) {
        isNegotiable = true;
        ctx.priceMatches.push(negoMatch[0]);
    }
    ctx.isNegotiable = isNegotiable;
    
    // Sequential price matches
    const regexes = [
        /(?:price|budget|rent|bet|cost|cash|salary|wage)\s*(?::|is)?\s*(?:\$)?\b(\d+(?:[\.,]\d+)*)\s*(k|m|mil|ml|million|milliom|milion|miliom|millio|thousand|thousant|b|billion|billiom|bilion|biliom|trillion)?\b/gi,
        /\$\s*(\d+(?:[\.,]\d+)*)\s*(k|m|mil|ml|million|milliom|milion|miliom|millio|thousand|thousant|b|billion|billiom|bilion|biliom|trillion)?\b/gi,
        /\b(?:for|at)\s+(\d+(?:[\.,]\d+)*)\s*(k|m|mil|ml|million|milliom|milion|miliom|millio|thousand|thousant|b|billion|billiom|bilion|biliom|trillion)\b/gi,
        /\beach\s+(\d+(?:[\.,]\d+)*)\s*(k|m|mil|ml|million|milliom|milion|miliom|millio|thousand|thousant|b|billion|billiom|bilion|biliom|trillion)?\b/gi,
        /\b(\d+(?:[\.,]\d+)*)\s*(k|m|mil|ml|million|milliom|milion|miliom|millio|thousand|thousant|b|billion|billiom|bilion|biliom|trillion)?\s*each\b/gi,
        /\b(\d+(?:[\.,]\d+)*)\s*(k|m|mil|ml|million|milliom|milion|miliom|millio|thousand|thousant|b|billion|billiom|bilion|biliom|trillion)\b/gi,
        /\b(\d{5,})\b/g
    ];
    
    const matchedValues = [];
    const matchedRanges = [];
    
    for (const regex of regexes) {
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(lower)) !== null) {
            const start = match.index;
            const end = regex.lastIndex;
            const isOverlap = matchedRanges.some(([s, e]) => {
                return (start >= s && start < e) || (end > s && end <= e) || (s >= start && s < end);
            });
            if (!isOverlap) {
                // Check if preceded by property/shop/designation/office/card keywords
                const prefixText = lower.substring(Math.max(0, start - 25), start).trim();
                // Prevent SIM card numbers (which have no suffix) from being parsed as prices
                if (/(?:card|cards|sim)(?:\s*(?:no\.?|number|num\.?|#|\u2116))?\s*$/i.test(prefixText) && !match[2]) {
                    continue;
                }
                if (/(?:house|apartment|mansion|penthouse|shop|office|card|cards|\u2116|#|no\.?)\s*$/i.test(prefixText)) {
                    let hasPriceIndication = match[2] || match[0].toLowerCase().includes("each") || match[1].length >= 5;
                    if (!hasPriceIndication) {
                        continue;
                    }
                }
                // Check if followed by unit / quantity keywords or template shorthand
                const suffixText = lower.substring(end, Math.min(lower.length, end + 25)).trim();
                if (/^(?:g\.?s\.?|w\.?h\.?|days?|lvls?|levels?|years?|batteries|juices|items|percent|seeds|fruits|rims|wheels|pieces|pcs)\b|^(?:%)/i.test(suffixText)) {
                    continue;
                }
                if (/^(?:temp|template|t)\s*\d+/i.test(suffixText)) {
                    continue;
                }

                let valStr = match[1];
                let suffix = match[2] ? match[2].toLowerCase() : "";
                if (!suffix) {
                    valStr = valStr.replace(/[\.,]/g, "");
                } else {
                    valStr = valStr.replace(/,/g, ".");
                }
                const numericVal = parseFloat(valStr);
                matchedValues.push({
                    raw: match[0],
                    numericVal: numericVal,
                    suffix: suffix,
                    start: start,
                    end: end
                });
                matchedRanges.push([start, end]);
                ctx.priceMatches.push(match[0]);
            }
        }
    }
    
    if (matchedValues.length === 0 && isNegotiable) {
        ctx.priceInfo = { type: priceType, value: "Negotiable" };
        ctx.logs.push({ text: `Detected pricing: <strong>Negotiable</strong>`, type: 'policy' });
        return;
    }
    
    if (priceType === "Bet" && matchedValues.length > 0) {
        let exceedsLimit = false;
        for (const item of matchedValues) {
            let numericVal = item.numericVal;
            let suffix = item.suffix;
            let normalizedVal = numericVal;
            if (suffix === "m" || suffix === "mil" || suffix === "ml" || suffix === "million" || suffix === "milliom" || suffix === "milion" || suffix === "miliom" || suffix === "millio") {
                normalizedVal = numericVal * 1000000;
            } else if (suffix === "k" || suffix === "thousand" || suffix === "thousant") {
                normalizedVal = numericVal * 1000;
            } else if (suffix === "b" || suffix === "billion" || suffix === "billiom" || suffix === "bilion" || suffix === "biliom") {
                normalizedVal = numericVal * 1000000000;
            }
            if (normalizedVal > 10000000) {
                exceedsLimit = true;
                break;
            }
        }
        
        if (exceedsLimit) {
            ctx.priceInfo = { type: "Bet", value: "Negotiable" };
            ctx.logs.push({ text: `Bet exceeds $10 Million limit. Defaulted to Negotiable.`, type: 'policy' });
            return;
        }
    }
    
    matchedValues.sort((a, b) => a.start - b.start);
    
    if (matchedValues.length === 0) {
        ctx.priceInfo = { type: priceType, value: "Negotiable" };
        ctx.logs.push({ text: `No specific price found. Defaulted to <strong>Negotiable</strong>`, type: 'policy' });
        return;
    }
    
    const values = matchedValues.map(item => {
        const numericVal = item.numericVal;
        const suffix = item.suffix;
        let normalizedVal = numericVal;
        let formattedString = "";
        
        if (suffix === "m" || suffix === "mil" || suffix === "ml" || suffix === "million" || suffix === "milliom" || suffix === "milion" || suffix === "miliom" || suffix === "millio") {
            normalizedVal = numericVal * 1000000;
            formattedString = `$${numericVal} Million`;
        } else if (suffix === "k" || suffix === "thousand" || suffix === "thousant") {
            normalizedVal = numericVal * 1000;
            if (numericVal >= 1000) {
                const mil = (numericVal / 1000).toFixed(2);
                formattedString = `$${parseFloat(mil)} Million`;
            } else {
                formattedString = `$${formatNumberDots(numericVal * 1000)}`;
            }
        } else if (suffix === "b" || suffix === "billion" || suffix === "billiom" || suffix === "bilion" || suffix === "biliom") {
            normalizedVal = numericVal * 1000000000;
            formattedString = `$${numericVal} Billion`;
        } else if (suffix === "trillion") {
            normalizedVal = numericVal * 1000000000000;
            formattedString = "Negotiable";
        } else {
            if (numericVal >= 1000000) {
                const mil = (numericVal / 1000000).toFixed(2);
                formattedString = `$${parseFloat(mil)} Million`;
            } else if (numericVal >= 1000) {
                formattedString = `$${formatNumberDots(numericVal)}`;
            } else {
                formattedString = `$${numericVal}`;
            }
        }
        return {
            val: normalizedVal,
            formatted: formattedString
        };
    });
    
    if (priceType === "Bet") {
        const primary = values[0];
        if (primary.val > 10000000) {
            ctx.priceInfo = { type: "Bet", value: "Negotiable" };
            ctx.logs.push({ text: `Bet exceeded $10 Million cap. Corrected to <strong>Negotiable</strong>`, type: 'correction' });
        } else {
            ctx.priceInfo = { type: "Bet", value: primary.formatted };
            ctx.logs.push({ text: `Formatted bet: <strong>${primary.formatted}</strong>`, type: 'policy' });
        }
    } else if (ctx.category === "Businesses") {
        const primary = values[0];
        if (primary.val > 500000000) {
            ctx.priceInfo = { type: "Price", value: "Negotiable" };
            ctx.logs.push({ text: `Business price exceeded $500 Million cap. Corrected to <strong>Negotiable</strong>`, type: 'correction' });
        } else {
            ctx.priceInfo = { type: priceType, value: primary.formatted };
            ctx.logs.push({ text: `Formatted Business price: <strong>${primary.formatted}</strong>`, type: 'policy' });
        }
    } else if (values.length > 1) {
        let respect = "respectively";
        const isPluralOther = ctx.category === "Other" && (function() {
            let cleanItem = lower;
            if (ctx.priceMatches) {
                for (const matchStr of ctx.priceMatches) {
                    const escaped = escapeRegExp(matchStr);
                    cleanItem = cleanItem.replace(new RegExp(escaped, "gi"), "");
                }
            }
            cleanItem = cleanItem.replace(/^(buying|selling or trading|selling|trading|renting out|renting|wtb|wts|wtt|buy|sell|trade|rent|looking to purchase|looking to buy|want to buy|searching for|looking for|searching|look for|looking|search|look)\s+(a\s+|an\s+)?/i, "").trim();
            cleanItem = cleanItem.replace(/\s+(buying|selling or trading|selling|trading|renting out|renting|wtb|wts|wtt|buy|sell|trade|rent|looking to purchase|looking to buy|want to buy|searching for|looking for|searching|look for|looking|search|look)$/i, "").trim();
            cleanItem = cleanItem.replace(/\b(?:in\s+bulk|bulk|each|each\s+respectively|respectively)\b/gi, "").trim();
            cleanItem = cleanItem.replace(/\b(?:price|budget|rent|bet|cost|cash)\b/gi, "").trim();
            cleanItem = cleanItem.replace(/^[^\w"'()\s]+|[^\w"'()\s]+$/g, "").replace(/\s+/g, " ").trim();
            
            const isExplicitPlural = lower.includes("bulk") || 
                                     lower.includes("in bulk") || 
                                     (parseQuantity(text) && parseQuantity(text) > 1);
            if (isExplicitPlural) return true;

            // Gloves, shoes, masks, etc. are conceptually singular/pairs and do not get 'each' unless explicitly pluralized
            if (matchClothingItem(cleanItem) || /\b(?:shoes|gloves|masks|glasses|pants|trousers|jeans|shorts|dress|dresses|hoodie|hoodies|boots|sneakers|caps|hats|socks)\b/i.test(cleanItem)) {
                return false;
            }

            const isPluralWord = (cleanItem.endsWith("s") && 
                                  !cleanItem.endsWith("ss") && 
                                  !cleanItem.endsWith("is") && 
                                  !cleanItem.endsWith("us") && 
                                  !cleanItem.endsWith("as") && 
                                  !cleanItem.endsWith("less") && 
                                  !cleanItem.endsWith("ness") && 
                                  !cleanItem.endsWith("mass") && 
                                  !cleanItem.endsWith("king") && 
                                  !cleanItem.endsWith("parking") &&
                                  !cleanItem.endsWith("business"));
            
            return lower.includes("bulk") || 
                   lower.includes("in bulk") || 
                   (parseQuantity(text) && parseQuantity(text) > 1) ||
                   /\b(?:seeds|timber|tickets|juices|batteries|wires|threads|tokens|canisters|barrels|materials|ores|cards|items|keys|snow)\b/i.test(cleanItem) ||
                   isPluralWord;
        })();
        if (lower.includes("each respectively") || lower.includes("each") || isPluralOther) {
            respect = "each respectively";
        }
        const priceStrs = values.map(v => v.formatted);
        let finalVal = "";
        if (priceStrs.length === 2) {
            finalVal = `${priceStrs[0]} and ${priceStrs[1]} ${respect}`;
        } else {
            const last = priceStrs.pop();
            finalVal = `${priceStrs.join(", ")} and ${last} ${respect}`;
        }
        ctx.priceInfo = { type: priceType, value: finalVal };
        ctx.logs.push({ text: `Formatted multiple prices: <strong>${finalVal}</strong>`, type: 'policy' });
    } else {
        const primary = values[0];
        let val = primary.formatted;
        const isPluralOther = ctx.category === "Other" && (function() {
            let cleanItem = lower;
            if (ctx.priceMatches) {
                for (const matchStr of ctx.priceMatches) {
                    const escaped = escapeRegExp(matchStr);
                    cleanItem = cleanItem.replace(new RegExp(escaped, "gi"), "");
                }
            }
            cleanItem = cleanItem.replace(/^(buying|selling or trading|selling|trading|renting out|renting|wtb|wts|wtt|buy|sell|trade|rent|looking to purchase|looking to buy|want to buy|searching for|looking for|searching|look for|looking|search|look)\s+(a\s+|an\s+)?/i, "").trim();
            cleanItem = cleanItem.replace(/\s+(buying|selling or trading|selling|trading|renting out|renting|wtb|wts|wtt|buy|sell|trade|rent|looking to purchase|looking to buy|want to buy|searching for|looking for|searching|look for|looking|search|look)$/i, "").trim();
            cleanItem = cleanItem.replace(/\b(?:in\s+bulk|bulk|each|each\s+respectively|respectively)\b/gi, "").trim();
            cleanItem = cleanItem.replace(/\b(?:price|budget|rent|bet|cost|cash)\b/gi, "").trim();
            cleanItem = cleanItem.replace(/^[^\w"'()\s]+|[^\w"'()\s]+$/g, "").replace(/\s+/g, " ").trim();
            
            const isExplicitPlural = lower.includes("bulk") || 
                                     lower.includes("in bulk") || 
                                     (parseQuantity(text) && parseQuantity(text) > 1);
            if (isExplicitPlural) return true;

            // Gloves, shoes, masks, etc. are conceptually singular/pairs and do not get 'each' unless explicitly pluralized
            if (matchClothingItem(cleanItem) || /\b(?:shoes|gloves|masks|glasses|pants|trousers|jeans|shorts|dress|dresses|hoodie|hoodies|boots|sneakers|caps|hats|socks)\b/i.test(cleanItem)) {
                return false;
            }

            const isPluralWord = (cleanItem.endsWith("s") && 
                                  !cleanItem.endsWith("ss") && 
                                  !cleanItem.endsWith("is") && 
                                  !cleanItem.endsWith("us") && 
                                  !cleanItem.endsWith("as") && 
                                  !cleanItem.endsWith("less") && 
                                  !cleanItem.endsWith("ness") && 
                                  !cleanItem.endsWith("mass") && 
                                  !cleanItem.endsWith("king") && 
                                  !cleanItem.endsWith("parking") &&
                                  !cleanItem.endsWith("business"));
            
            return lower.includes("bulk") || 
                   lower.includes("in bulk") || 
                   (parseQuantity(text) && parseQuantity(text) > 1) ||
                   /\b(?:seeds|timber|tickets|juices|batteries|wires|threads|tokens|canisters|barrels|materials|ores|cards|items|keys|snow)\b/i.test(cleanItem) ||
                   isPluralWord;
        })();
        if (/\beach\b/i.test(lower) || isPluralOther) {
            val += " each";
        }
        ctx.priceInfo = { type: priceType, value: val };
        ctx.logs.push({ text: `Formatted price: <strong>${val}</strong>`, type: 'policy' });
    }
}

function formatNumberDots(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function cleanPriceKeywords(text, ctx) {
    let result = text;
    if (ctx && ctx.priceMatches) {
        for (const matchStr of ctx.priceMatches) {
            const escaped = escapeRegExp(matchStr);
            const regex = new RegExp(escaped, "gi");
            const replacement = /\beach\b/i.test(matchStr) ? " __HAS_EACH__ " : "";
            result = result.replace(regex, replacement);
        }
    }
    result = result.replace(/\bfor\s+(?:my\s+)?(?:brother|sister|friend|friends|dad|mom|father|mother|family|son|daughter)\b/gi, "");
    result = result.replace(/\b(?:price|budget|rent|bet|cost|cash)\b/gi, "")
                   .replace(/\b(call me|ph:?|phone:?|call|ping me|mail)\s*[0-9-]*\b/gi, "")
                   .replace(/,\s*,/g, ",")
                   .replace(/\s+/g, " ")
                   .trim();
    // Strip leading/trailing punctuation except quotes and parens
    result = result.replace(/^[^\w"'()\s]+|[^\w"'()\s]+$/g, "").trim();
    return result;
}

/* ==========================================================================
   Category Formatters
   ========================================================================== */

function splitOnLastFor(str) {
    const lower = str.toLowerCase();
    const index = lower.lastIndexOf(" for ");
    if (index === -1) return null;
    return [
        str.substring(0, index).trim(),
        str.substring(index + 5).trim()
    ];
}

// 1. Auto Category
function formatAutoAd(adBody, action, ctx) {
    const lowerBody = adBody.toLowerCase();
    
    if ((action === "Trading" || action === "Selling or trading") && lowerBody.includes(" for ")) {
        const parts = splitOnLastFor(adBody);
        if (parts) {
            const formattedA = formatAutoAd(parts[0], action, ctx);
            const formattedB = formatAutoAd(parts[1], action, ctx);
            if (formattedA && formattedB) {
                return `${formattedA} for ${formattedB}`;
            }
        }
    }
    
    // Specific matched vehicle check has priority over generic words (e.g. "italy f458 car" -> match specific "Grotti Italia (F458)" first)
    const matched = matchVehicle(adBody);
    
    if (matched) {
        ctx.logs.push({ text: `Fuzzy matched vehicle: <strong>${matched.name}</strong> (${matched.category})`, type: 'policy' });
        
        // Check Not Sellable Constraint
        if (matched.category === "not_sellable_cars") {
            if (action === "Buying" || action === "Selling" || action === "Selling or trading") {
                ctx.status = "rejected";
                ctx.rejectionReason = "Cannot advertise this vehicle as it is non-sellable.";
                ctx.logs.push({ text: `Rejected: <strong>${matched.name}</strong> is non-sellable.`, type: 'danger' });
                return "";
            }
        }
        
        // Extract upgrades
        const upgrades = parseAutoUpgrades(adBody);
        const order = [];
        
        if (upgrades.config) {
            order.push(upgrades.config);
            ctx.logs.push({ text: `Upgrade: <strong>${upgrades.config}</strong>`, type: 'correction' });
        }
        if (upgrades.visual) {
            order.push(upgrades.visual);
            ctx.logs.push({ text: `Upgrade: <strong>${upgrades.visual}</strong>`, type: 'correction' });
        }
        if (upgrades.wheels) {
            order.push(upgrades.wheels);
            ctx.logs.push({ text: `Upgrade: <strong>${upgrades.wheels}</strong>`, type: 'correction' });
        }
        if (upgrades.insurance) {
            order.push(upgrades.insurance);
            ctx.logs.push({ text: `Upgrade: <strong>${upgrades.insurance}</strong>`, type: 'correction' });
        }
        if (upgrades.turbo) {
            order.push(upgrades.turbo);
            ctx.logs.push({ text: `Upgrade: <strong>${upgrades.turbo}</strong>`, type: 'correction' });
        }
        if (upgrades.drift) {
            order.push(upgrades.drift);
            ctx.logs.push({ text: `Upgrade: <strong>${upgrades.drift}</strong>`, type: 'correction' });
        }
        
        let upgradesText = "";
        if (order.length > 0) {
            order[0] = "with " + order[0];
            if (order.length === 1) {
                upgradesText = ` ${order[0]}`;
            } else if (order.length === 2) {
                upgradesText = ` ${order[0]} and ${order[1]}`;
            } else {
                const last = order.pop();
                upgradesText = ` ${order.join(", ")} and ${last}`;
            }
        }
        
        // Check if at Auto Fair
        let fairText = "";
        if (ctx.raw.toLowerCase().includes("auto fair") || ctx.raw.toLowerCase().includes("autofair")) {
            fairText = " at Auto Fair";
            if (ctx.priceInfo && ctx.priceInfo.value === "Negotiable") {
                ctx.priceInfo = null;
            }
        }
        
        return `"${matched.name}"${upgradesText}${fairText}`;
    }
    
    // Check for generic vehicle words
    const genericWords = ["car", "helicopter", "heli", "plane", "motorcycle", "bike", "boat", "vehicle", "truck"];
    let isGeneric = false;
    let matchedGeneric = "";
    for (const word of genericWords) {
        const regex = new RegExp(`\\b${word}s?\\b`, "i");
        if (regex.test(lowerBody)) {
            isGeneric = true;
            matchedGeneric = word;
            break;
        }
    }
    
    if (isGeneric) {
        let displayWord = matchedGeneric;
        if (displayWord === "heli") displayWord = "helicopter";
        const article = (displayWord.startsWith("a") || displayWord.startsWith("e") || displayWord.startsWith("i") || displayWord.startsWith("o") || displayWord.startsWith("u")) ? "an" : "a";
        let bodyStr = `${article} ${displayWord}`;
        
        // Extract upgrades
        const upgrades = parseAutoUpgrades(adBody);
        const order = [];
        if (upgrades.config) order.push(upgrades.config);
        if (upgrades.visual) order.push(upgrades.visual);
        if (upgrades.wheels) order.push(upgrades.wheels);
        if (upgrades.insurance) order.push(upgrades.insurance);
        if (upgrades.turbo) order.push(upgrades.turbo);
        if (upgrades.drift) order.push(upgrades.drift);
        
        let upgradesText = "";
        if (order.length > 0) {
            order[0] = "with " + order[0];
            if (order.length === 1) {
                upgradesText = ` ${order[0]}`;
            } else if (order.length === 2) {
                upgradesText = ` ${order[0]} and ${order[1]}`;
            } else {
                const last = order.pop();
                upgradesText = ` ${order.join(", ")} and ${last}`;
            }
        }
        
        let fairText = "";
        if (ctx.raw.toLowerCase().includes("auto fair") || ctx.raw.toLowerCase().includes("autofair")) {
            fairText = " at Auto Fair";
            if (ctx.priceInfo && ctx.priceInfo.value === "Negotiable") {
                ctx.priceInfo = null;
            }
        }
        
        return `${bodyStr}${upgradesText}${fairText}`;
    }
    
    ctx.status = "rejected";
    ctx.rejectionReason = "Insufficient information for the vehicle name.";
    ctx.logs.push({ text: `Rejected: Vehicle name not recognized.`, type: 'danger' });
    return "";
}

function parseAutoUpgrades(text) {
    const lower = text.toLowerCase();
    const upgrades = {};
    
    // 1. Configuration
    if (lower.includes("full configuration") || lower.includes("max config") || lower.includes("max tuning") || lower.includes("fully upgraded") || lower.includes("full tune") || lower.includes("full config") || lower.includes("maxed") || lower.includes("full max") || lower.includes("full chip tuning") || lower.includes("pro parts") || lower.includes("car full") || /\bfull\b/i.test(lower)) {
        upgrades.config = "full configuration";
    } else if (lower.includes("partial configuration") || lower.includes("nearly max") || lower.includes("lvl3") || lower.includes("lvl 3") || lower.includes("partial config") || lower.includes("partial tuning") || lower.includes("partially upgraded")) {
        upgrades.config = "partial configuration";
    }
    
    // 2. Visual Upgrades
    if (lower.includes("body upgrade") || lower.includes("body kit") || lower.includes("visual upgrade") || lower.includes("visuals") || lower.includes("visual")) {
        upgrades.visual = "visual upgrades";
    }
    
    // 3. Luminous Wheels
    // e.g. "unique 6 rims" or "luminous rims of type 6" or "unique wheels type 25" or "wheels 9"
    const rimMatch = lower.match(/\b(?:unique|luminous|wheels|rims)\s*(?:rims|wheels)?\s*(?:of\s*type|type)?\s*(\d+)\b/i);
    if (rimMatch) {
        const typeNum = rimMatch[1] || "X";
        upgrades.wheels = `luminous wheels of type ${typeNum}`;
    } else if (lower.includes("luminous wheels") || lower.includes("unique wheels") || lower.includes("luminous rims") || lower.includes("wheels") || lower.includes("rims")) {
        upgrades.wheels = "luminous wheels of type X";
    }
    
    // 4. Insurance
    if (lower.includes("insurance") || lower.includes("insured")) {
        upgrades.insurance = "insurance";
    }
    
    // 5. Turbo
    if (lower.includes("turbo") || lower.includes("turb")) {
        upgrades.turbo = "turbo kit";
    }
    
    // 6. Drift
    if (lower.includes("drift") || lower.includes("drft")) {
        upgrades.drift = "drift kit";
    }
    
    return upgrades;
}

function fuzzyFindLocation(text) {
    const lower = text.toLowerCase();
    const preps = ["in", "at", "near", "to"];
    const allPlaces = [...OFFICIAL_PLACES, ...UNOFFICIAL_PLACES];
    
    allPlaces.sort((a, b) => b.length - a.length);
    
    for (const prep of preps) {
        let index = -1;
        while ((index = lower.indexOf(prep + " ", index + 1)) !== -1) {
            let startOfPlace = index + prep.length + 1;
            let sub = text.substring(startOfPlace).trim();
            if (sub.toLowerCase().startsWith("the ")) {
                sub = sub.substring(4).trim();
                startOfPlace += 4;
            }
            
            const cleanSub = sub.split(/[,.;:#\u2116\(\)]/)[0].trim();
            if (!cleanSub) continue;
            
            const words = cleanSub.split(/\s+/);
            for (let len = Math.min(words.length, 3); len >= 1; len--) {
                const candidate = words.slice(0, len).join(" ");
                const match = getClosestMatch(candidate, allPlaces, 0.7);
                if (match) {
                    const rawMatched = text.substring(index, startOfPlace + candidate.length);
                    return {
                        place: match,
                        preposition: prep,
                        raw: rawMatched
                    };
                }
            }
        }
    }
    
    for (const place of allPlaces) {
        const words = text.split(/\s+/);
        const placeWordsCount = place.split(/\s+/).length;
        for (let i = 0; i <= words.length - placeWordsCount; i++) {
            const candidate = words.slice(i, i + placeWordsCount).join(" ");
            const cleanCandidate = candidate.replace(/[,.;:#\u2116\(\)]/g, "");
            const match = getClosestMatch(cleanCandidate, [place], 0.7);
            if (match) {
                let prep = "in";
                let rawMatched = candidate;
                if (i > 0) {
                    const prevWord = words[i - 1].toLowerCase().replace(/[^a-z]/g, "");
                    if (preps.includes(prevWord)) {
                        prep = prevWord;
                        rawMatched = words[i - 1] + " " + candidate;
                    }
                }
                return {
                    place: match,
                    preposition: prep,
                    raw: rawMatched
                };
            }
        }
    }
    
    return null;
}

function extractLocation(text) {
    const loc = fuzzyFindLocation(text);
    if (!loc) return null;
    
    let prep = loc.preposition;
    let place = loc.place;
    
    let formatted = "";
    if (UNOFFICIAL_PLACES.includes(place)) {
        formatted = `${prep} the ${place.toLowerCase()}`;
    } else {
        formatted = `${prep} ${place}`;
    }
    
    return {
        raw: loc.raw,
        formatted: formatted,
        place: place
    };
}

// 2. Real Estate Category
function formatRealEstateAd(adBody, action, ctx) {
    let lower = adBody.toLowerCase();
    
    // Extract location first
    const locInfo = extractLocation(adBody);
    let cleanAdBody = adBody;
    if (locInfo) {
        cleanAdBody = adBody.replace(locInfo.raw, "").trim();
        cleanAdBody = cleanAdBody.replace(/,\s*$/, "").replace(/\s+and\s*$/, "").trim();
    }
    
    const cleanLower = cleanAdBody.toLowerCase();
    
    let houseLabel = "house";
    if (cleanLower.includes("apartment")) houseLabel = "apartment";
    else if (cleanLower.includes("mansion")) houseLabel = "mansion";
    else if (cleanLower.includes("penthouse") || cleanLower.includes("casino apartment")) houseLabel = "Casino penthouse";

    // Quantity check (1-3 properties)
    const qtyMatch = cleanLower.match(/\b([1-3])\s*(house|apartment|mansion|penthouse|casino penthouse|casino apartment)s?\b/i);
    let mainSubject = "";
    
    if (qtyMatch) {
        const qty = qtyMatch[1];
        const type = qtyMatch[2].toLowerCase();
        const typePluralMap = {
            "house": "houses",
            "apartment": "apartments",
            "mansion": "mansions",
            "penthouse": "penthouses",
            "casino penthouse": "Casino penthouses",
            "casino apartment": "Casino penthouses"
        };
        const pluralType = typePluralMap[type] || (type + "s");
        mainSubject = `${qty} ${pluralType}`;
        ctx.logs.push({ text: `Formatted property quantity: <strong>${mainSubject}</strong>`, type: 'correction' });
    } else {
        // Check house number
        let numMatch = cleanLower.match(/(?:house|apartment|mansion|penthouse|\u2116)\s*(?:no\.?|number|num\.?|#|\u2116)?\s*(\d+)\b/i);
        
        if (!numMatch) {
            // Find all standalone numbers in cleanLower
            const allNums = [...cleanLower.matchAll(/\b(\d+)\b/g)].map(m => ({ val: parseInt(m[1]), raw: m[0], index: m.index }));
            // Filter out numbers that represent garage spaces or warehouses or quantities
            const nonFeatureNums = allNums.filter(numItem => {
                // Check if the number is part of garage spaces
                const gsMatch = cleanLower.match(new RegExp(`(\\d+)\\s*(?:gs|g\\.s\\.|garage|garages)|(?:gs|g\\.s\\.|garage|garages)\\s*(\\d+)`, "i"));
                if (gsMatch && (gsMatch[1] === numItem.raw || gsMatch[2] === numItem.raw)) {
                    return false;
                }
                // Check if the number is part of warehouse space
                const whMatch = cleanLower.match(new RegExp(`(\\d+)\\s*(?:wh|w\\.h\\.|warehouse|warehouses)|(?:wh|w\\.h\\.|warehouse|warehouses)\\s*(\\d+)`, "i"));
                if (whMatch && (whMatch[1] === numItem.raw || whMatch[2] === numItem.raw)) {
                    return false;
                }
                // Check if it represents property quantity
                const qtyRegex = new RegExp(`\\b${numItem.raw}\\s*(?:house|apartment|mansion|penthouse)s?\\b`, "i");
                if (qtyRegex.test(cleanLower)) {
                    return false;
                }
                return true;
            });
            
            if (nonFeatureNums.length > 0) {
                // Take the last standalone number (usually the house number at the end)
                const targetNum = nonFeatureNums[nonFeatureNums.length - 1];
                numMatch = [null, targetNum.raw];
            }
        }
        
        if (numMatch) {
            mainSubject = `${houseLabel} \u2116${numMatch[1]}`;
            ctx.logs.push({ text: `Formatted property designation to <strong>${mainSubject}</strong>`, type: 'correction' });
        } else {
            if (houseLabel === "Casino penthouse") {
                mainSubject = houseLabel;
            } else {
                const prefix = (houseLabel.startsWith("a") || houseLabel.startsWith("e")) ? "an" : "a";
                mainSubject = `${prefix} ${houseLabel}`;
            }
        }
    }
    
    // Extract features in ordering list
    const features = parseRealEstateFeatures(cleanAdBody, houseLabel === "apartment", ctx);
    
    let featuresText = "";
    if (features.length > 0) {
        if (features.length === 1) {
            featuresText = ` with ${features[0]}`;
        } else if (features.length === 2) {
            featuresText = ` with ${features[0]} and ${features[1]}`;
        } else {
            const last = features.pop();
            featuresText = ` with ${features.join(", ")} and ${last}`;
        }
    }
    
    let result = `${mainSubject}${featuresText}`;
    if (locInfo) {
        result += ` ${locInfo.formatted}`;
    }
    return result;
}

function parseRealEstateFeatures(text, isApartment, ctx) {
    const lower = text.toLowerCase();
    const foundFeatures = [];
    const featureMap = {};
    
    // 1. Garden
    if (lower.includes("garden")) {
        featureMap.garden = "a garden";
    }
    
    // 2. Garage spaces
    const gsMatch = lower.match(/(\d+)\s*(?:gs|g\.s\.?|garage|garages)/i) || lower.match(/(?:gs|g\.s\.?|garage|garages)\s*(\d+)/i);
    if (gsMatch) {
        const allowedGs = [2, 5, 9, 25, 30];
        const num = parseInt(gsMatch[1]);
        if (allowedGs.includes(num)) {
            featureMap["garage spaces"] = `${num} g.s.`;
        } else {
            ctx.logs.push({ text: `Garage spaces ${num} is invalid. Reverting to closest valid GRP size.`, type: 'warning' });
            // find closest
            const closest = allowedGs.reduce((prev, curr) => Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev);
            featureMap["garage spaces"] = `${closest} g.s.`;
        }
    }
    
    // 3. Warehouse
    const whMatch = lower.match(/(\d+)\s*(?:wh|w\.h\.?|warehouse|warehouses)/i) || lower.match(/(?:wh|w\.h\.?|warehouse|warehouses)\s*(\d+)/i);
    if (whMatch) {
        featureMap.warehouses = `${whMatch[1]} w.h.`;
    }
    
    // 4. Custom Interior
    if (lower.includes("furnished") || lower.includes("custom interior") || lower.includes("luxe interior") || lower.includes("lux interior")) {
        featureMap["custom interior"] = "custom interior";
    }
    
    // 5. Insurance (Only for Houses, not Apartments)
    if (lower.includes("insurance") || lower.includes("insured")) {
        if (isApartment) {
            ctx.logs.push({ text: `Removed insurance: Apartments cannot be insured.`, type: 'correction' });
        } else {
            featureMap.insurance = "insurance";
        }
    }
    
    // 6. Helipad
    if (lower.includes("helipad") || lower.includes("heli pad") || /\bheli\b/i.test(lower)) {
        featureMap.helipad = "helipad";
    }
    
    // 7. Swimming pool
    if (lower.includes("swimming pool") || lower.includes("pool")) {
        featureMap["swimming pool"] = "swimming pool";
    }
    
    // 8. Tennis court
    if (lower.includes("tennis")) {
        featureMap["tennis court"] = "tennis court";
    }
    
    // 9. Driveway
    if (lower.includes("driveway")) {
        const isLong = lower.includes("long") || lower.includes("large");
        featureMap.driveway = isLong ? "long driveway" : "driveway";
    }
    
    // 10. Backyard
    if (lower.includes("backyard") || lower.includes("back yard")) {
        featureMap.backyard = "spacious backyard";
    }
    
    // 11. Views
    if (lower.includes("view") || lower.includes("views")) {
        featureMap.views = "nice views";
    }
    
    // Extract features in the correct order
    REAL_ESTATE_ORDER.forEach(fKey => {
        if (featureMap[fKey]) {
            foundFeatures.push(featureMap[fKey]);
        }
    });
    
    return foundFeatures;
}

// 3. Work Category
function formatWorkAd(adBody, action, ctx) {
    let lower = adBody.toLowerCase();
    
    // DJ casing check
    let body = adBody.replace(/\bdj\b/gi, "DJ");
    
    // Spell corrections
    body = body.replace(/\bfore\b/gi, "for");
    
    // Solar panel plantation corrections
    if (/\bsolar\s*(?:panel\s*)?plantations?\b/i.test(body)) {
        if (body.toLowerCase().includes("workers")) {
            body = body.replace(/\bsolar\s*(?:panel\s*)?plantations?\b/gi, "solar panel plantations");
        } else {
            body = body.replace(/\bsolar\s*(?:panel\s*)?plantations?\b/gi, "solar panel plantation");
        }
        ctx.logs.push({ text: `Normalized solar panel plantation reference`, type: 'correction' });
    }
    
    // level X -> X years experience
    const lvlMatch = body.match(/level\s*(\d+)/i) || body.match(/lvl\s*(\d+)/i);
    if (lvlMatch) {
        body = body.replace(lvlMatch[0], `${lvlMatch[1]} years of experience`);
        ctx.logs.push({ text: `Changed level translation to years of experience`, type: 'correction' });
    }
    
    // Construction site addresses matching
    const siteMatch = body.match(/construction site\s*#?(\d+)/i);
    if (siteMatch) {
        const siteNum = siteMatch[1];
        let addressStr = "";
        if (siteNum === "1") addressStr = "\u21161 on Vespucci Boulevard";
        else if (siteNum === "2") addressStr = "\u21162 on Calais Avenue";
        else if (siteNum === "3") addressStr = "\u21163 in Pillbox Hill";
        else addressStr = `\u2116${siteNum}`;
        
        body = body.replace(siteMatch[0], `construction site ${addressStr}`);
        ctx.logs.push({ text: `Formatted construction site with address details`, type: 'correction' });
    }
    
    // If multiple roles mentioned -> hiring workers
    const rolesList = ["locksmith", "electrician", "gardener", "surveyor", "driver"];
    let matchedRolesCount = 0;
    rolesList.forEach(r => {
        if (lower.includes(r)) matchedRolesCount++;
    });
    
    if (matchedRolesCount > 1) {
        body = body.replace(/hiring\s+[a-z\s,and]+/i, "hiring workers ");
        ctx.logs.push({ text: `Multiple roles combined into "workers"`, type: 'correction' });
    }
    
    // Capitalize professions at start of ad, lowercase otherwise (except DJ)
    if (action === "") {
        // e.g. "Lawyer looking for work" -> Lawyer is at the start
        const firstWord = body.split(" ")[0];
        if (rolesList.includes(firstWord.toLowerCase()) || firstWord.toLowerCase() === "lawyer" || firstWord.toLowerCase() === "trucker") {
            body = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase() + body.slice(firstWord.length);
        }
    }
    
    return body;
}

// 4. Dating Category
function formatDatingAd(adBody, action, ctx) {
    const lower = adBody.toLowerCase();
    
    // Standard targets (wife, boyfriend, etc.)
    const matchesDatingTarget = ["family members", "girlfriend", "boyfriend", "valentine", "husband", "friends", "family", "friend", "date", "wife", "alliance"];
    for (const t of matchesDatingTarget) {
        const regex = new RegExp(`\\b${t}\\b`, "i");
        if (regex.test(lower)) {
            // Check for illegal price/budget on wife/husband (triggers blacklist)
            if ((t === "wife" || t === "husband") && ctx.priceInfo && ctx.priceInfo.value !== "Negotiable") {
                ctx.status = "blacklisted";
                ctx.blacklistReason = `Attempting to purchase/sell a spouse (${t}) with a price is forbidden.`;
                ctx.rejectionReason = "Improper advertisement.";
                ctx.logs.push({ text: `Blacklist triggered: Trading spouses with value!`, type: 'danger' });
                return "";
            }
            
            const displayTarget = (t === "friends") ? "friend" : t;
            const prefix = (displayTarget === "wife" || displayTarget === "husband" || displayTarget === "date" || displayTarget === "friend" || displayTarget === "boyfriend" || displayTarget === "girlfriend" || displayTarget === "valentine" || displayTarget === "family") ? "a " : (displayTarget === "alliance" ? "an " : "");
            return `for ${prefix}${displayTarget}`;
        }
    }
    
    // If not a standard target, check if it's a person search:
    // It should have FirstName LastName format
    const nameMatch = adBody.match(/^([A-Za-z]+)\s+([A-Za-z]+)$/);
    if (nameMatch) {
        const firstName = nameMatch[1];
        const lastName = nameMatch[2];
        const fullName = `${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()} ${lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()}`;
        
        ctx.logs.push({ text: `Dating search target name capitalized: <strong>${fullName}</strong>`, type: 'correction' });
        
        // Database check
        const matchCit = grpCitizens.find(c => c.name.toLowerCase() === fullName.toLowerCase());
        if (!matchCit) {
            ctx.status = "rejected";
            ctx.rejectionReason = "Person not found in database. (Person must be in the GRAND RP mail)";
            ctx.logs.push({ text: `Rejected: Citizen <strong>${fullName}</strong> not found in database.`, type: 'warning' });
            return "";
        }
        
        // Classified check
        if ((matchCit.role.includes("Leader") || matchCit.role.includes("Deputy")) && matchCit.role.includes("State") && !matchCit.isLI) {
            ctx.status = "rejected";
            ctx.rejectionReason = "You cannot search for classified person.";
            ctx.logs.push({ text: `Rejected: <strong>${fullName}</strong> is a classified state leader/deputy.`, type: 'warning' });
            return "";
        }
        
        return `for ${fullName}`;
    }
    
    // Default dating
    return adBody;
}

function formatOwnerSearchAd(adBody, ctx) {
    let clean = adBody.toLowerCase().replace(/\bowner\b/gi, "").trim();
    clean = clean.replace(/^(?:a|an|the)\s+/gi, "").trim();
    
    let matchedName = "Business";
    if (clean.includes("gun") || clean.includes("weapon") || clean.includes("ammo") || clean.includes("ammunition")) {
        matchedName = "Ammunition Store";
    } else if (clean.includes("clothing") || clean.includes("cloth")) {
        matchedName = "Clothing Shop";
    } else if (clean.includes("24/7") || clean.includes("twenty four seven")) {
        matchedName = "24/7 Store";
    } else if (clean.includes("gas") || clean.includes("fuel")) {
        matchedName = "Gas Station";
    } else if (clean.includes("car sharing") || clean.includes("carsharing")) {
        matchedName = "Car sharing";
    } else if (clean.includes("business") || clean.includes("biz")) {
        matchedName = "Business";
    } else if (clean) {
        const bizTypes = BUSINESSES_DB;
        let closest = bizTypes.find(type => new RegExp(`\\b${escapeRegExp(type)}\\b`, 'i').test(clean));
        if (!closest) {
            closest = getClosestMatch(clean, bizTypes, 0.4);
        }
        if (closest) {
            matchedName = closest.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }
    }
    
    const startsWithVowel = /^[aeiou]/i.test(matchedName);
    const article = startsWithVowel ? "an" : "a";
    return `${article} ${matchedName} owner`;
}

// 5. Businesses Category
function formatBusinessesAd(adBody, action, ctx) {
    const lowerBody = adBody.toLowerCase();
    if ((action === "Trading" || action === "Selling or trading") && lowerBody.includes(" for ")) {
        const parts = splitOnLastFor(adBody);
        if (parts) {
            const formattedA = formatBusinessesAd(parts[0], action, ctx);
            const formattedB = formatBusinessesAd(parts[1], action, ctx);
            if (formattedA && formattedB) {
                return `${formattedA} for ${formattedB}`;
            }
        }
    }
    
    let body = adBody;
    
    // Rename personal -> private
    body = body.replace(/personal business/gi, "private business");
    body = body.replace(/pbiz/gi, "private business");
    
    // Normalize ATM
    body = body.replace(/\batm\s+business\b/gi, "ATM");
    body = body.replace(/\batm\b/gi, "ATM");
    
    // Drug lab -> Burger shop
    if (body.toLowerCase().includes("drug lab")) {
        body = body.replace(/drug lab/gi, "Burger shop");
        ctx.logs.push({ text: `Replaced restricted "drug lab" with "Burger shop" and issued warning`, type: 'warning' });
    }
    
    // Rename gun store -> Ammunition Store
    body = body.replace(/gun store/gi, "Ammunition Store");
    body = body.replace(/weapon store/gi, "Ammunition Store");
    
    // Rename charging station -> Electric station
    body = body.replace(/charging station/gi, "Electric station");
    
    // Rename auto workshop -> Service station
    body = body.replace(/auto workshop/gi, "Service station");
    
    // Family business trade check
    if (body.toLowerCase().includes("family business") && action === "Trading") {
        ctx.status = "rejected";
        ctx.rejectionReason = "Family businesses cannot be traded.";
        ctx.logs.push({ text: `Rejected: Family business trade is prohibited.`, type: 'warning' });
        return "";
    }
    
    // Make sure we include "business" or "shares" keyword correctly
    const bizTypes = BUSINESSES_DB;
    
    let matchedBiz = bizTypes.find(type => new RegExp(`\\b${escapeRegExp(type)}\\b`, 'i').test(body));
    if (!matchedBiz) {
        matchedBiz = getClosestMatch(body, bizTypes, 0.4);
    }
    if (matchedBiz) {
        let isPlantation = false;
        let plantationCrop = "";
        if (matchedBiz === "Plantation") {
            isPlantation = true;
            const cropMatch = body.match(/\b(pumpkin|cabbage|mandarin|pineapple)\b/i);
            if (cropMatch) {
                plantationCrop = cropMatch[1].charAt(0).toUpperCase() + cropMatch[1].slice(1).toLowerCase();
            }
        }

        if (isPlantation && plantationCrop) {
            // Remove the crop name first to avoid duplication
            let cleanBody = body.replace(new RegExp(`\\b${plantationCrop}\\b`, 'gi'), "").replace(/\s+/g, " ").trim();
            
            // Reconstruct the business name
            let hasSharesOrControl = cleanBody.toLowerCase().includes("shares") || cleanBody.toLowerCase().includes("control") || cleanBody.toLowerCase().includes("business");
            let targetName = `${plantationCrop} plantation`;
            if (!hasSharesOrControl) {
                targetName = `${plantationCrop} plantation business`;
                ctx.logs.push({ text: `Appended "business" keyword to crop plantation`, type: 'correction' });
            }
            
            // Replace "plantation" case-insensitively with the target name
            cleanBody = cleanBody.replace(/\bplantation\b/gi, targetName);
            body = cleanBody.replace(/\s+/g, " ").trim();
        } else {
            // Strip intermediate "business" keyword if number is present (e.g. "Car sharing business no2" -> "Car sharing №2")
            const matchedBizEscaped = escapeRegExp(matchedBiz);
            const bizWithNumRegex = new RegExp(`\\b(${matchedBizEscaped})\\s+business\\s*(?:no\\.?|number|num\\.?|#|\\u2116|mp|n\\.?|\\-)?\\s*(\\d+)\\b`, 'i');
            body = body.replace(bizWithNumRegex, (match, biz, num) => {
                return `${biz} \u2116${parseInt(num)}`;
            });

            // Check if there is a number associated with the business
            const numMatch = body.match(new RegExp(`\\b(${escapeRegExp(matchedBiz)})\\s*(?:no\\.?|number|num\\.?|#|\\u2116|mp|n\\.?|\\-)?\\s*(\\d+)\\b`, 'i'));
            let isBedsSpec = false;
            if (numMatch) {
                const afterMatch = body.substring(numMatch.index + numMatch[0].length).trim().toLowerCase();
                if (/^beds?\b/i.test(afterMatch)) {
                    isBedsSpec = true;
                }
            }
            if (numMatch && !isBedsSpec) {
                // Business with number -> replace with "MatchedBiz №Num" and do NOT append "business"
                const numVal = parseInt(numMatch[2]);
                body = body.replace(numMatch[0], `${matchedBiz} \u2116${numVal}`);
                ctx.logs.push({ text: `Formatted business designation to <strong>${matchedBiz} \u2116${numVal}</strong>`, type: 'correction' });
            } else {
                // Business without number -> make sure "business" or "shares" or "control" is present
                if (!body.toLowerCase().includes("shares") && !body.toLowerCase().includes("business") && !body.toLowerCase().includes("control")) {
                    // Append business
                    body = body.replace(new RegExp(escapeRegExp(matchedBiz), "gi"), `${matchedBiz} business`);
                    ctx.logs.push({ text: `Appended "business" keyword to official category`, type: 'correction' });
                } else {
                    // Just capitalize/canonicalize matchedBiz
                    body = body.replace(new RegExp(escapeRegExp(matchedBiz), "gi"), matchedBiz);
                }
            }
        }
    }
    
    const cleanLowerBody = body.toLowerCase().trim();
    if (cleanLowerBody === "business" || cleanLowerBody === "private business" || cleanLowerBody.startsWith("business ") || cleanLowerBody.startsWith("private business ")) {
        if (!cleanLowerBody.startsWith("a ") && !cleanLowerBody.startsWith("an ")) {
            body = "a " + body;
        }
    }
    
    return body;
}

// 6. Services & Discounts Category
function formatTemplateAd(adBody, category, ctx) {
    // Check custom trained templates shorthand first (check ALL entries for best match)
    let bestFmtShortLen = 0;
    let bestFmtShortTemplate = null;
    const cleanInputForFmt = adBody.trim().toLowerCase();
    for (const ct of customTemplates) {
        if (ct.shorthand) {
            const cleanShort = ct.shorthand.trim().toLowerCase();
            if (cleanInputForFmt === cleanShort || cleanInputForFmt.includes(cleanShort)) {
                const remaining = cleanInputForFmt.replace(cleanShort, "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
                if (remaining.length < 5 && cleanShort.length > bestFmtShortLen) {
                    bestFmtShortLen = cleanShort.length;
                    bestFmtShortTemplate = ct;
                }
            }
        }
    }
    if (bestFmtShortTemplate) {
        ctx.action = "";
        ctx.priceInfo = null;
        ctx.logs.push({ text: `Expanded custom shorthand to template: <strong>${bestFmtShortTemplate.text}</strong>`, type: 'policy' });
        return bestFmtShortTemplate.text;
    }

    // Check if it's a shorthand template request
    const shorthandMatch = adBody.match(/\b(?:ammunition\s+store|ammunation\s+store|ammo\s+store|ammo|weapon\s+shop|gun\s+store|weapon\s+store|rifleclub|bobbys|canikpide|wong|pew\s+pew|lue|siddhu|most\s+wanted|central\s+mall)?\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(39|40|41|111|147|148|149|150|151|152|269)\s+\b(?:temp|template|t)\s*([12])\b/i);
    const familyShorthandMatch = adBody.match(/\b(?:family|fam|uchiha|kingdom|deluca)?\s*(?:gps\s*|house\s*|h\s*)?(?:No\.?|\u2116|#)?\s*(55|258|536)\s+\b(?:temp|template|t)\s*([12])\b/i);
    const clothingShorthandMatch = adBody.match(/\b(?:clothing\s+shop|clothing\s+store|clothing|wear|style|fashion|trendzone)?\s*(?:gps\s*|No\.?|\u2116|#)?\s*(31|32|50|74|75|122|126|142|143|144|145|146|271|275)\s+\b(?:temp|template|t)\s*([12])\b/i);
    const officeShorthandMatch = adBody.match(/\b(?:(?:[a-z\s]+)?office)?\s*(?:No\.?|\u2116|#|-)?\s*(24|585|677|1000|1017|1288|1419|1948|2198|2796|7963|10364|12313|13724|14396|14633|15136|21046|27650|32125|33698|41760|50367|52942|78981|85042|85235)\s+\b(?:temp|template|t)\s*([12])\b/i);
    const storeShorthandMatch = adBody.match(/\b(?:store\s+)?24\/7(?:\s+store)?\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(23|24|25|26|27|28|29|30|78|119|120|121|123|125|128|129|139|140|141|270)\s+\b(?:temp|template|t)\s*([12])\b/i);
    const gasShorthandMatch = adBody.match(/\b(?:gas\s+station|gas\s+stn|gas|fuel|station|stn|ron|sahara|indian|tsunami|charon|remix|xr|kek|liff|brody|immortals|mobil|loves|surya|jordan|sher|renegades|oilarc)?\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(4|6|7|8|9|10|11|13|14|15|16|17|18|21|23|115|116|117|118|124|127|136|137)\s+\b(?:temp|template|t)\s*([12])\b/i);
    let parkingShorthandMatch = adBody.match(/\b(?:parking\s+lot|parking|park|ekip|eileen|remix|playboys|rockford)\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(55)\s+\b(?:temp|template|t)\s*([12])\b/i);
    if (!parkingShorthandMatch) {
        parkingShorthandMatch = adBody.match(/\b(?:parking\s+lot|parking|park|ekip|eileen|remix|playboys|rockford)?\s*(?:gps\s*)?(?:No\.?|\u2116|#)?\s*(51|52|53|54|56|57|58|79|80|81|82|83|84|85|101|135)\s+\b(?:temp|template|t)\s*([12])\b/i);
    }
    if (shorthandMatch) {
        const remaining = adBody.replace(shorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            const shopNum = shorthandMatch[1];
            const tempIdx = shorthandMatch[2];
            const matched = getAmmunitionTemplate(shopNum, tempIdx);
            if (matched) {
                ctx.action = "";
                ctx.priceInfo = null;
                ctx.logs.push({ text: `Expanded shorthand to template: <strong>${matched}</strong>`, type: 'policy' });
                return matched;
            }
        }
    } else if (storeShorthandMatch) {
        const remaining = adBody.replace(storeShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            const shopNum = storeShorthandMatch[1];
            const tempIdx = storeShorthandMatch[2];
            const matched = getStore247Template(shopNum, tempIdx);
            if (matched) {
                ctx.action = "";
                ctx.priceInfo = null;
                ctx.logs.push({ text: `Expanded shorthand to template: <strong>${matched}</strong>`, type: 'policy' });
                return matched;
            }
        }
    } else if (gasShorthandMatch) {
        const remaining = adBody.replace(gasShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            const shopNum = gasShorthandMatch[1];
            const tempIdx = gasShorthandMatch[2];
            const matched = getGasStationTemplate(shopNum, tempIdx);
            if (matched) {
                ctx.action = "";
                ctx.priceInfo = null;
                ctx.logs.push({ text: `Expanded shorthand to template: <strong>${matched}</strong>`, type: 'policy' });
                return matched;
            }
        }
    } else if (parkingShorthandMatch) {
        const remaining = adBody.replace(parkingShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            const shopNum = parkingShorthandMatch[1];
            const tempIdx = parkingShorthandMatch[2];
            const matched = getParkingTemplate(shopNum, tempIdx);
            if (matched) {
                ctx.action = "";
                ctx.priceInfo = null;
                ctx.logs.push({ text: `Expanded shorthand to template: <strong>${matched}</strong>`, type: 'policy' });
                return matched;
            }
        }
    } else if (familyShorthandMatch) {
        const remaining = adBody.replace(familyShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            const shopNum = familyShorthandMatch[1];
            const tempIdx = familyShorthandMatch[2];
            const matched = getFamilyTemplate(shopNum, tempIdx);
            if (matched) {
                ctx.action = "";
                ctx.priceInfo = null;
                ctx.logs.push({ text: `Expanded shorthand to template: <strong>${matched}</strong>`, type: 'policy' });
                return matched;
            }
        }
    } else if (clothingShorthandMatch) {
        const remaining = adBody.replace(clothingShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            const shopNum = clothingShorthandMatch[1];
            const tempIdx = clothingShorthandMatch[2];
            const matched = getClothingTemplate(shopNum, tempIdx);
            if (matched) {
                ctx.action = "";
                ctx.priceInfo = null;
                ctx.logs.push({ text: `Expanded shorthand to template: <strong>${matched}</strong>`, type: 'policy' });
                return matched;
            }
        }
    } else if (officeShorthandMatch) {
        const remaining = adBody.replace(officeShorthandMatch[0], "").replace(/^[^\w]+|[^\w]+$/g, "").trim();
        if (remaining.length < 5) {
            const officeNum = officeShorthandMatch[1];
            const tempIdx = officeShorthandMatch[2];
            const matched = getOfficeTemplate(officeNum, tempIdx);
            if (matched) {
                ctx.action = "";
                ctx.priceInfo = null;
                ctx.logs.push({ text: `Expanded shorthand to template: <strong>${matched}</strong>`, type: 'policy' });
                return matched;
            }
        }
    }

    let cleanAdBody = adBody.replace(/^(?:[a-zA-Z0-9\s\u2116#\-:()&]+)?(?:template|temp)\s+\d+[-\s]*/i, "").trim();
    let tempAdBody = cleanAdBody.replace(/\b(?:price|budget)?\s*(?:negotiable|negable|negoitable|nego|neg|nogotaible|nogotable|nogotiable|negotioble|negotoable)\b/gi, "")
                                .replace(/\b(?:for|at|price|budget)?\s*[\$\d\.,kKmMbB\s]+(?:each)?\b/gi, "")
                                .replace(/\b\d+\s*[%]?\s*and\s*\d+\s*[%]?\s*juices?\b/gi, "")
                                .trim();
    const combinedTemplates = OFFICIAL_TEMPLATES.concat(customTemplates.map(t => t.text));
    const matched = getClosestMatch(tempAdBody, combinedTemplates, 0.65) || getClosestMatch(cleanAdBody, combinedTemplates, 0.65);
    if (!matched) {
        ctx.status = "rejected";
        ctx.rejectionReason = "Template not found in database. Contact LI to create a new template.";
        ctx.logs.push({ text: `Rejected: Template not recognized.`, type: 'warning' });
        return "";
    }
    
    ctx.action = "";
    ctx.priceInfo = null;
    ctx.logs.push({ text: `Matched template: <strong>${matched}</strong>`, type: 'policy' });
    return matched;
}

function maskPhrases(text) {
    let result = text;
    // Normalize "10 and 20% juices" -> "10% and 20% juices"
    result = result.replace(/\b(\d+)\s*(?:%|percent)?\s+and\s+(\d+)\s*(?:%|percent)?\s*juices?\b/gi, (match, p1, p2) => {
        return `${p1}% and ${p2}% juices`;
    });
    result = result.replace(/\b(\d+%\s+and\s+\d+%)(?!\w)/gi, (match) => {
        return "__PCT_AND_PCT_START__" + match.replace(/\s+/g, "_") + "__PCT_AND_PCT_END__";
    });
    result = result.replace(/\b(?:flame|fire)\s+(?:and|&)\s+waters?\b/gi, "__FLAME_AND_WATER__");
    result = result.replace(/\battack\s+and\s+protection\b/gi, "__ATTACK_AND_PROTECTION__");
    result = result.replace(/\bprotection\s+and\s+immunity\b/gi, "__PROTECTION_AND_IMMUNITY__");
    result = result.replace(/\b(prime(?:\s+platinum)?\s*(?:with\s+)?\d+\s*(?:days?)?\s*and\s*\d+\s*days?)\b/gi, (match) => {
        return "__PRIME_AND_DAYS_START__" + match.replace(/\s+/g, "_") + "__PRIME_AND_DAYS_END__";
    });
    // Protect typed clothing/resource item lists from being split by comma/and
    // e.g. "tight mask 13 ,14 and 19" or "luminous stone 1 and 2"
    result = result.replace(/\b((?:tight\s+)?masks?|trousers?|luminous\s+stones?|luminous\s+wheels?)\s+(\d+(?:\s*[,]\s*\d+)*\s*(?:,?\s*and\s+\d+)?)\b/gi, (match) => {
        return "__TYPED_LIST_START__" + match.replace(/\s+/g, "_").replace(/,/g, "__COMMA__") + "__TYPED_LIST_END__";
    });
    return result;
}

function unmaskPhrases(text) {
    let result = text;
    result = result.replace(/__PCT_AND_PCT_START__(.+?)__PCT_AND_PCT_END__/g, (match, inner) => {
        return inner.replace(/_/g, " ");
    });
    result = result.replace(/__PRIME_AND_DAYS_START__(.+?)__PRIME_AND_DAYS_END__/g, (match, inner) => {
        return inner.replace(/_/g, " ");
    });
    result = result.replace(/__TYPED_LIST_START__(.+?)__TYPED_LIST_END__/g, (match, inner) => {
        return inner.replace(/_/g, " ").replace(/__COMMA__/g, ",");
    });
    result = result.replace(/__FLAME_AND_WATER__/g, "flame and water");
    result = result.replace(/__ATTACK_AND_PROTECTION__/g, "attack and protection");
    result = result.replace(/__PROTECTION_AND_IMMUNITY__/g, "protection and immunity");
    return result;
}

function itemRequiresArticle(itemStr, isFirst, ctx) {
    if (!isFirst) return false;
    const lower = itemStr.toLowerCase();
    
    if (lower.startsWith("a ") || lower.startsWith("an ")) {
        return false;
    }
    if (lower.includes("sim card") && (lower.includes("\u2116") || /\d/.test(lower))) {
        return false;
    }
    if (lower.includes("license plate") && (lower.includes("(") || /\d/.test(lower))) {
        return false;
    }
    if (lower.includes("inventory")) {
        return false;
    }
    if (lower.includes("biospark")) {
        return false;
    }
    if (lower.includes("luminous stone") && lower.includes("of type")) {
        return false;
    }
    if (lower.includes("luminous stones")) {
        return false;
    }
    if (lower.includes("drawing")) {
        return false;
    }
    if (lower.includes("copper")) {
        return false;
    }
    if (lower.includes("letter")) {
        return false;
    }
    if (lower.includes("pickaxe") && (lower.includes("quality") || lower.includes("lvl") || lower.includes("level"))) {
        return false;
    }
    if (lower.includes("fishing rod") && (lower.includes("quality") || lower.includes("lvl") || lower.includes("level"))) {
        return false;
    }
    if (lower.includes("shoulder pet")) {
        return false;
    }
    const fishList = ["salmon", "carp", "perch", "trout", "megalodon", "ray", "orca", "humpback whale"];
    if (fishList.some(fish => lower === fish || lower.endsWith(" " + fish))) {
        return false;
    }
    if (lower.includes("tuning") || lower.includes("suspension") || lower.includes("transmission") || lower.includes("brakes") || lower.includes("tires")) {
        return false;
    }
    if (lower.includes("juice") || lower.includes("juices")) {
        return false;
    }
    if (lower.includes("prime")) {
        return false;
    }
    if (lower.includes("various items")) {
        return false;
    }
    if (/^\d+/.test(lower)) {
        return false;
    }
    if (lower.includes("timber") || lower.includes("wires")) {
        return false;
    }
    if (lower.startsWith("cage with a")) {
        return false;
    }
    if (lower.includes("wheels") || lower.includes("rims")) {
        return false;
    }
    if (lower.includes("in bulk") || lower.includes("bulk")) {
        return false;
    }
    if (ctx && ctx.raw) {
        const rawLower = ctx.raw.toLowerCase();
        if (rawLower.includes("in bulk") || rawLower.includes("bulk") || /\beach\b/i.test(rawLower)) {
            return false;
        }
    }
    const brands = ["abibas", "muci", "lui vi", "niki", "mikachu", "kolex", "off-white"];
    if (brands.some(b => lower.startsWith(b))) {
        return false;
    }
    if (lower.endsWith("s") && !lower.endsWith("ss")) {
        return false;
    }
    return true;
}

function prependArticle(itemStr) {
    const lower = itemStr.toLowerCase();
    const isVowel = /^[aeiou]/i.test(lower);
    const article = isVowel ? "an" : "a";
    return `${article} ${itemStr}`;
}

// 7. Other Category (Clothing & items)
function formatOtherAd(adBody, action, ctx) {
    let normalizedAdBody = adBody;
    // Automatically insert commas/separators between clothing type specs and adjacent items
    normalizedAdBody = normalizedAdBody.replace(/(\btype\s+[a-zA-Z0-9]+)\s+(?=(?:high|medium|low|max|advanced)\s+quality|lvl\s*\d+|level\s*\d+|\d+\s*lvl|\d+\s*level|rare|regular|secret|grand|cayo|car|resource|diamonds?|salmons?|carps?|perch|trout|megalodon|ray|orca|whale|timber|wires|hookah|sponge)/gi, "$1, ");
    
    const lower = normalizedAdBody.toLowerCase();
    
    if ((action === "Trading" || action === "Selling or trading") && lower.includes(" for ")) {
        const parts = splitOnLastFor(normalizedAdBody);
        if (parts) {
            const formattedA = formatOtherAd(parts[0], action, ctx);
            const formattedB = formatOtherAd(parts[1], action, ctx);
            if (formattedA && formattedB) {
                return `${formattedA} for ${formattedB}`;
            }
        }
    }
    
    // Check if event (party, wedding, car meet)
    const isEvent = /^(?:pool\s+)?party\b/i.test(lower) || 
                    /^(?:wedding|car\s+meet)\b/i.test(lower) || 
                    /\b(?:party|wedding|car\s+meet)\s+at\b/i.test(lower);
    if (isEvent) {
        ctx.action = "";
        ctx.priceInfo = null;
        return normalizedAdBody;
    }
    
    // Play dice or poker
    if (lower.includes("dice") || lower.includes("poker")) {
        ctx.action = "Looking";
        const game = lower.includes("dice") ? "dice" : "poker";
        return `to play ${game}`;
    }
    
    // Mask phrases with 'and' to avoid splitting them incorrectly
    let maskedBody = maskPhrases(normalizedAdBody);
    
    // Split combined clothing/items if multiple exist
    let items = maskedBody.split(/\s+and\s+|\s+plus\s+|,/gi)
        .map(s => {
            let clean = s.trim();
            // Strip leading/trailing punctuation except quotes/parens
            clean = clean.replace(/^[^\w"'()\s]+|[^\w"'()\s]+$/g, "").trim();
            return clean;
        })
        .filter(s => {
            if (!s) return false;
            const lowerS = s.toLowerCase();
            if (lowerS === "each" || lowerS === "respectively" || lowerS === "each respectively" || lowerS === "price" || lowerS === "budget" || lowerS === "cost" || lowerS.includes("__has_each__")) {
                return false;
            }
            return true;
        });
    let formattedItems = [];
    
    // Check for multiple tuning parts list sharing the same quality level
    const tuningPartKeywords = ["transmission", "engine", "suspension", "brakes", "tires"];
    let allTuning = items.length > 1;
    if (allTuning) {
        for (const item of items) {
            const unmasked = unmaskPhrases(item).toLowerCase();
            const isTuning = tuningPartKeywords.some(part => unmasked.includes(part));
            if (!isTuning) {
                allTuning = false;
                break;
            }
        }
    }
    
    if (allTuning) {
        const qualityPatterns = [
            { name: "low quality ", regex: /\b(?:low|lvl\s*1|level\s*1|1\s*lvl)\b/i },
            { name: "medium quality ", regex: /\b(?:medium|med|lvl\s*2|level\s*2|2\s*lvl)\b/i },
            { name: "high quality ", regex: /\b(?:high|lvl\s*3|level\s*3|3\s*lvl)\b/i },
            { name: "max quality ", regex: /\b(?:max|lvl\s*4|level\s*4|4\s*lvl)\b/i },
            { name: "advanced quality ", regex: /\badvanced\b/i }
        ];
        const matchedQualities = qualityPatterns.filter(p => p.regex.test(lower));
        
        if (matchedQualities.length <= 1) {
            const matchedTuningParts = [];
            for (const part of tuningPartKeywords) {
                const regex = new RegExp(`\\b${part}s?\\b`, "i");
                if (regex.test(lower)) {
                    matchedTuningParts.push(part);
                }
            }
            
            if (matchedTuningParts.length > 1) {
                // Sort by order of appearance in original input
                matchedTuningParts.sort((a, b) => lower.indexOf(a) - lower.indexOf(b));
                
                let partsListText = "";
                if (matchedTuningParts.length === 2) {
                    partsListText = `${matchedTuningParts[0]} and ${matchedTuningParts[1]}`;
                } else {
                    const lastPart = matchedTuningParts.pop();
                    partsListText = `${matchedTuningParts.join(", ")} and ${lastPart}`;
                }
                
                const isPlural = lower.includes("tunings") || lower.includes("parts");
                const suffix = isPlural ? " tunings" : " tuning";
                
                let qty = parseQuantity(adBody);
                let qtyText = qty ? `${qty} ` : "";
                let qualityText = matchedQualities.length === 1 ? matchedQualities[0].name : "";
                
                const groupedTuningText = `${qtyText}${qualityText}${partsListText}${suffix}`;
                formattedItems.push(groupedTuningText);
                ctx.logs.push({ text: `Formatted multiple tuning parts: <strong>${groupedTuningText}</strong>`, type: 'correction' });
                
                // Skip the standard loop by setting items to empty
                items = [];
            }
        }
    }
    
    for (let i = 0; i < items.length; i++) {
        // Unmask the item first so matching works
        let rawItem = unmaskPhrases(items[i]);
        let isFirst = (i === 0);
        
        // Look for luminous unique wheels/rims in other
        if (/\b(?:rims?|wheels?)\b/i.test(rawItem)) {
            const numbers = rawItem.match(/\b\d+\b/g);
            let typeNum = "X";
            if (numbers && numbers.length > 0) {
                if (numbers.length === 1) {
                    typeNum = numbers[0];
                } else if (numbers.length === 2) {
                    typeNum = `${numbers[0]} and ${numbers[1]}`;
                } else {
                    const lastNum = numbers.pop();
                    typeNum = `${numbers.join(", ")} and ${lastNum}`;
                }
            }
            formattedItems.push(`luminous wheels of type ${typeNum}`);
            ctx.logs.push({ text: `Formatted rims to: <strong>luminous wheels of type ${typeNum}</strong>`, type: 'correction' });
            continue;
        }
        
        // Check other items first to avoid false-positive clothing matching
        let formattedOther = formatGeneralItem(rawItem, ctx);
        if (formattedOther) {
            if (itemRequiresArticle(formattedOther, isFirst, ctx)) {
                formattedOther = prependArticle(formattedOther);
            }
            formattedItems.push(formattedOther);
        } else {
            const matchedClothing = matchClothingItem(rawItem);
            if (matchedClothing) {
                // Reorder clothing: color (lowercase) | item name | type | gender
                const color = parseColor(rawItem);
                let typeVal = parseMultipleTypes(rawItem);
                const genderVal = parseGender(rawItem);
                
                if (matchedClothing.name.includes('*') && !typeVal) {
                    typeVal = extractTypeFromWildcard(rawItem);
                }

                // Filter out any numbers that are part of the clothing database name itself (e.g. 700 in "Abibas Pezy Boost 700 V3 Alvah shoes")
                if (typeVal && matchedClothing.name) {
                    const dbNumbers = (matchedClothing.name.match(/\b\d+\b/g) || []).map(n => n.toString());
                    if (dbNumbers.length > 0) {
                        const rawNumbers = typeVal.split(/,\s*|and\s+/).map(s => s.trim());
                        const filteredNumbers = rawNumbers.filter(num => !dbNumbers.includes(num));
                        if (filteredNumbers.length > 1) {
                            const last = filteredNumbers.pop();
                            typeVal = `${filteredNumbers.join(", ")} and ${last}`;
                        } else if (filteredNumbers.length === 1) {
                            typeVal = filteredNumbers[0];
                        } else {
                            typeVal = null;
                        }
                    }
                }
                
                let finalClothing = "";
                if (color) finalClothing += `${color} `;
                
                let namePart = matchedClothing.name;
                
                if (typeVal && typeVal.includes("and")) {
                    namePart = pluralizeClothingName(namePart);
                }
                
                if (namePart.includes('*')) {
                    namePart = namePart.replace('*', typeVal || 'X');
                }
                
                finalClothing += namePart;
                if (typeVal && !matchedClothing.name.includes('*')) {
                    finalClothing += ` of type ${typeVal}`;
                }
                if (genderVal) finalClothing += ` ${genderVal}`;
                
                formattedItems.push(finalClothing.trim());
                ctx.logs.push({ text: `Formatted clothing: <strong>${finalClothing.trim()}</strong>`, type: 'policy' });
            } else {
                // Not recognized. Reject
                ctx.status = "rejected";
                const actWord = action === "Buying" ? "buying" : "selling";
                ctx.rejectionReason = `Please, provide the correct name of the item you are ${actWord}.`;
                ctx.logs.push({ text: `Rejected: Item <strong>${rawItem}</strong> not recognized.`, type: 'warning' });
                return "";
            }
        }
    }
    
    if (formattedItems.length === 0) {
        return adBody;
    }
    
    // Max 3 items in other category
    if (formattedItems.length > 3) {
        ctx.status = "rejected";
        ctx.rejectionReason = "Cannot advertise more than 3 items at a time.";
        ctx.logs.push({ text: `Rejected: Exceeded max limit of 3 items in Other.`, type: 'warning' });
        return "";
    }
    
    if (formattedItems.length === 1) {
        return formattedItems[0];
    } else if (formattedItems.length === 2) {
        return `${formattedItems[0]} and ${formattedItems[1]}`;
    } else {
        const last = formattedItems.pop();
        return `${formattedItems.join(", ")} and ${last}`;
    }
}

function parseColor(text) {
    const colors = ["black", "white", "red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "grey", "gray", "silver", "gold"];
    for (const c of colors) {
        if (text.toLowerCase().includes(c)) return c.toLowerCase();
    }
    return null;
}

function extractTypeFromWildcard(text) {
    const numbers = text.match(/\b\d+\b/g);
    if (numbers) {
        const qty = parseQuantity(text);
        for (const num of numbers) {
            // If it's a quantity at the start, skip it
            if (qty && num === qty.toString()) {
                if (new RegExp(`^\\s*${num}\\b`, "i").test(text)) {
                    continue;
                }
            }
            return num;
        }
    }
    return null;
}

function parseMultipleTypes(text) {
    const lower = text.toLowerCase();
    const numbers = [];
    const regex = /\b(\d+)\b/g;
    let match;
    const qty = parseQuantity(text);
    
    while ((match = regex.exec(lower)) !== null) {
        const numStr = match[1];
        const numIndex = match.index;
        
        // If this number is the quantity at the start of the text, skip it
        if (qty && parseInt(numStr) === qty) {
            const before = lower.substring(0, numIndex).trim();
            if (before === "" || before === "selling" || before === "buying" || before === "trading" || before === "renting" || before === "wts" || before === "wtb") {
                continue;
            }
        }
        numbers.push(numStr);
    }
    
    if (numbers.length > 1) {
        const last = numbers.pop();
        return `${numbers.join(", ")} and ${last}`;
    } else if (numbers.length === 1) {
        return numbers[0];
    }
    return null;
}

function parseType(text) {
    const typeMatch = text.toLowerCase().match(/(?:type|extra|extras)\s*#?(\d+)\b/i);
    return typeMatch ? typeMatch[1] : null;
}

function parseGender(text) {
    const lower = text.toLowerCase();
    if (lower.includes("for men") || lower.includes("for man") || lower.includes("male") || /\bmens?\b/i.test(lower) || /\bmen's\b/i.test(lower)) return "for men";
    if (lower.includes("for women") || lower.includes("for woman") || lower.includes("female") || /\bwomens?\b/i.test(lower) || /\bwomen's\b/i.test(lower)) return "for women";
    return null;
}

function cleanItemForFuzzy(text) {
    let clean = text.toLowerCase().trim().replace(/__has_each__/gi, "");
    
    // Strip quantity/numbers at start or end
    clean = clean.replace(/^\d+%\s+and\s+\d+%\s*/g, "");
    clean = clean.replace(/^\d+%\s*/g, "");
    clean = clean.replace(/^\d+\s+/g, "");
    clean = clean.replace(/\b(?:lvl|level)\s*\d+\b/gi, "");
    clean = clean.replace(/\b\d+\s*(?:lvl|level)\b/gi, "");
    clean = clean.replace(/\b\d+\b/g, "");
    
    // Strip qualities/descriptors
    clean = clean.replace(/\b(?:top quality|scrap|luminous|unique|rare|exotic|regular|luxe|lux|furnished|high quality|low quality|medium quality|advanced|max)\b/gi, "");
    
    // Strip articles
    clean = clean.replace(/\b(?:a|an|the|in\s+bulk|bulk)\b/gi, "");
    
    // Normalize whitespace
    clean = clean.replace(/\s+/g, " ").trim();
    
    // Singularize common plurals
    if (clean.endsWith("ies")) {
        clean = clean.slice(0, -3) + "y"; // batteries -> battery, rubies -> ruby
    } else if (clean.endsWith("es") && !clean.endsWith("one") && !clean.endsWith("use") && !clean.endsWith("ate")) {
        clean = clean.slice(0, -2);
    } else if (clean.endsWith("s") && !clean.endsWith("ss") && !clean.endsWith("us") && !clean.endsWith("ex")) {
        clean = clean.slice(0, -1);
    }
    
    return clean;
}

function pluralizeClothingName(name) {
    const lower = name.toLowerCase();
    // If it already ends with s and is not dress, it's plural or doesn't change
    if (lower.endsWith("s") && !lower.endsWith("dress")) {
        return name;
    }
    
    // Check if it has "of type *"
    if (name.includes("of type *")) {
        // e.g. "Volex watch of type *" -> pluralize "watch" -> "Volex watches of type *"
        return name.replace(/watch/i, "watches");
    }
    
    // Check common clothing suffixes/words
    if (lower.endsWith("accessory")) {
        return name.slice(0, -9) + "accessories";
    }
    if (lower.endsWith("mask")) {
        return name.slice(0, -4) + "masks";
    }
    if (lower.endsWith("watch")) {
        return name.slice(0, -5) + "watches";
    }
    if (lower.endsWith("dress")) {
        return name + "es";
    }
    if (lower.endsWith("t-shirt") || lower.endsWith("shirt")) {
        return name + "s";
    }
    if (lower.endsWith("pullover")) {
        return name + "s";
    }
    if (lower.endsWith("sweater")) {
        return name + "s";
    }
    if (lower.endsWith("bra")) {
        return name + "s";
    }
    if (lower.endsWith("jacket")) {
        return name + "s";
    }
    if (lower.endsWith("hoodie")) {
        return name + "s";
    }
    if (lower.endsWith("coat")) {
        return name + "s";
    }
    if (lower.endsWith("suit")) {
        return name + "s";
    }
    if (lower.endsWith("chain")) {
        return name + "s";
    }
    if (lower.endsWith("necklace")) {
        return name + "s";
    }
    if (lower.endsWith("band")) {
        return name + "s";
    }
    if (lower.endsWith("ring")) {
        return name + "s";
    }
    if (lower.endsWith("charge")) {
        return name + "s";
    }
    if (lower.endsWith("cape")) {
        return name + "s";
    }
    if (lower.endsWith("rune") || lower.endsWith("runes")) {
        return name;
    }
    if (lower.endsWith("chick")) {
        return name + "s";
    }
    
    // Fallback using the standard pluralizeItemName
    return pluralizeItemName(name);
}

function pluralizeItemName(name) {
    const lower = name.toLowerCase();
    if (lower.endsWith("y") && !lower.endsWith("day") && !lower.endsWith("play") && !lower.endsWith("key")) {
        return name.slice(0, -1) + "ies"; // battery -> batteries
    }
    if (lower.endsWith("s")) {
        return name; // already plural or ends with s
    }
    if (lower.endsWith("ch") || lower.endsWith("sh") || lower.endsWith("x")) {
        return name + "es";
    }
    // Specific compound words pluralization
    if (lower.includes("ticket")) {
        return name.replace(/ticket/i, "tickets");
    }
    if (lower.includes("container")) {
        return name.replace(/container/i, "containers");
    }
    if (lower.includes("rod")) {
        return name.replace(/rod/i, "rods");
    }
    if (lower.includes("card")) {
        return name.replace(/card/i, "cards");
    }
    if (lower.includes("kit")) {
        return name.replace(/kit/i, "kits");
    }
    if (lower.includes("can")) {
        return name.replace(/can/i, "cans");
    }
    return name + "s";
}

function fuzzyCorrectItemName(rawItem, ctx) {
    const cleanLower = rawItem.toLowerCase().trim();
    const cleaned = cleanItemForFuzzy(rawItem);
    const hasEach = /\beach\b/i.test(cleanLower) || cleanLower.includes("__has_each__");
    
    // License plate check
    if (cleanLower.includes("plate") && !cleanLower.includes("armor")) {
        
        const plateMatch = rawItem.match(/(?:license|licence|liesence|liesance)?\s*plate\s*(?:no\.?|#|\u2116|number|num\.?)?\s*\(?([a-z0-9]+)\)?/i) || 
                           rawItem.match(/plate\s*(?:no\.?|#|\u2116|number|num\.?)?\s*\(?([a-z0-9]+)\)?/i);
                           
        let plateVal = null;
        if (plateMatch) {
            const tempVal = plateMatch[1].toLowerCase();
            if (tempVal !== "no" && tempVal !== "number" && tempVal !== "num" && tempVal !== "plate") {
                plateVal = plateMatch[1].toUpperCase();
            }
        }
        
        if (plateVal) {
            if (plateVal.length >= 3 && plateVal.length <= 7) {
                if (plateVal.includes("SEX") || plateVal.includes("FUCK") || plateVal.includes("BITCH") || plateVal.includes("CUNT") || plateVal.includes("NIGGER") || plateVal.includes("DICK")) {
                    ctx.status = "blacklisted";
                    ctx.blacklistReason = `License plate "${plateVal}" contains inappropriate or offensive language.`;
                    ctx.rejectionReason = "Cannot promote illegal items.";
                    ctx.logs.push({ text: `Blacklist triggered: Offensive license plate <strong>${plateVal}</strong>`, type: 'danger' });
                    return "";
                }
                
                let rawItemWithoutPlate = rawItem.replace(plateMatch[0], "");
                let qty = parseQuantity(rawItemWithoutPlate);
                let qtyText = qty && qty > 1 ? `${qty} ` : "";
                if (qty && qty > 1) {
                    return `${qtyText}license plates (${plateVal})`;
                } else {
                    return `license plate (${plateVal})`;
                }
            } else {
                ctx.status = "rejected";
                ctx.rejectionReason = "license plate: Must be 3-7 characters in length.";
                ctx.logs.push({ text: `Rejected: License plate "${plateVal}" is not 3-7 characters in length.`, type: 'warning' });
                return "";
            }
        } else {
            let qty = parseQuantity(rawItem);
            let qtyText = qty && qty > 1 ? `${qty} ` : "";
            const isCustom = cleanLower.includes("custom");
            const isPlural = cleanLower.includes("plates") || (qty && qty > 1) || hasEach;
            
            if (isCustom) {
                if (isPlural) {
                    return `${qtyText}custom license plates`;
                } else {
                    return `custom license plate`;
                }
            } else {
                if (isPlural) {
                    return `${qtyText}license plates`;
                } else {
                    return `license plate`;
                }
            }
        }
    }

    // 1. Ticket check
    if (cleanLower.includes("ticket") || cleanLower.includes("tcket") || cleanLower.includes("tikcet") || cleanLower.includes("tick") || cleaned.includes("ticket") || cleanLower.includes("cayo") || cleanLower.includes("perico")) {
        let canonical = "";
        if (cleanLower.includes("cayo") || cleanLower.includes("perico")) canonical = "Cayo Perico ticket";
        else if (cleanLower.includes("car")) canonical = "Car ticket";
        else if (cleanLower.includes("resource")) canonical = "Resource Miners ticket";
        else if (cleanLower.includes("grand") || cleanLower.includes("rp")) canonical = "Grand ticket";
        else if (cleanLower.includes("secret")) {
            if (cleanLower.includes("fragment") || cleanLower.includes("fragmnet")) {
                canonical = "Secret ticket fragment";
            } else {
                canonical = "Secret ticket";
            }
        }
        else if (cleanLower.includes("flame") || cleanLower.includes("water") || cleanLower.includes("fire")) canonical = "flame and water lottery ticket";
        else if (cleanLower.includes("royal") || cleanLower.includes("artifact")) canonical = "Royal Artifacts lottery ticket";
        else if (cleanLower.includes("rare")) canonical = "rare lottery ticket";
        else if (cleanLower.includes("regular") || (cleanLower.includes("lottery") && !cleanLower.includes("rare") && !cleanLower.includes("flame") && !cleanLower.includes("water") && !cleanLower.includes("fire") && !cleanLower.includes("royal") && !cleanLower.includes("artifact"))) canonical = "regular lottery ticket";
        else canonical = "lottery ticket";

        let qty = parseQuantity(rawItem);
        const isPlural = cleanLower.includes("tickets") || cleanLower.includes("tckets") || cleanLower.includes("tikcets") || cleanLower.includes("fragments") || cleanLower.includes("fragmnets") || hasEach;
        
        if (qty && qty > 1) {
            if (canonical.includes("fragment")) {
                canonical = canonical.replace(/fragment/i, "fragments");
            } else {
                canonical = canonical.replace(/ticket/i, "tickets");
            }
            if ((cleanLower.includes("in bulk") || cleanLower.includes("bulk")) && !canonical.toLowerCase().includes("in bulk")) {
                canonical = `${qty} ${canonical} in bulk`;
            } else {
                canonical = `${qty} ${canonical}`;
            }
        } else if (cleanLower.includes("in bulk") || cleanLower.includes("bulk") || isPlural) {
            if (canonical.includes("fragment")) {
                canonical = canonical.replace(/fragment/i, "fragments");
            } else {
                canonical = canonical.replace(/ticket/i, "tickets");
            }
            if (cleanLower.includes("in bulk") || cleanLower.includes("bulk")) {
                canonical += " in bulk";
            }
        }
        return canonical;
    }
    
    // 1.5. Fish check
    const fishList = ["salmon", "carp", "perch", "trout", "megalodon", "ray", "orca", "humpback whale"];
    let matchedFish = null;
    let isBulk = cleanLower.includes("in bulk") || cleanLower.includes("bulk");
    let qty = parseQuantity(rawItem);
    
    if (cleanLower.includes("humpback") || cleanLower.includes("whale")) {
        matchedFish = "humpback whale";
    } else {
        for (const fish of fishList) {
            if (fish === "humpback whale") continue;
            const regex = new RegExp(`\\b${fish}s?\\b|\\bperches\\b`, "i");
            if (regex.test(cleanLower) || cleanLower.includes(fish) || cleaned.includes(fish)) {
                matchedFish = fish;
                break;
            }
        }
    }
    
    if (matchedFish) {
        let qtyText = qty ? `${qty} ` : "";
        let suffix = isBulk ? " in bulk" : "";
        return `${qtyText}${matchedFish}${suffix}`;
    }
    
    // 1.6. Tuning parts check
    const tuningParts = ["engine", "transmission", "suspension", "brakes", "tires", "tuning part", "tuning parts"];
    let matchedPart = null;
    let quality = "";
    
    for (const part of tuningParts) {
        if (cleanLower.includes(part)) {
            matchedPart = part;
            break;
        }
    }
    
    if (matchedPart) {
        if (cleanLower.includes("low") || cleanLower.includes("lvl 1") || cleanLower.includes("lvl1") || cleanLower.includes("level 1") || cleanLower.includes("1lvl") || cleanLower.includes("1 lvl")) {
            quality = "low quality ";
        } else if (cleanLower.includes("medium") || cleanLower.includes("med") || cleanLower.includes("lvl 2") || cleanLower.includes("lvl2") || cleanLower.includes("level 2") || cleanLower.includes("2lvl") || cleanLower.includes("2 lvl")) {
            quality = "medium quality ";
        } else if (cleanLower.includes("high") || cleanLower.includes("lvl 3") || cleanLower.includes("lvl3") || cleanLower.includes("level 3") || cleanLower.includes("3lvl") || cleanLower.includes("3 lvl")) {
            quality = "high quality ";
        } else if (cleanLower.includes("max") || cleanLower.includes("lvl 4") || cleanLower.includes("lvl4") || cleanLower.includes("level 4") || cleanLower.includes("4lvl") || cleanLower.includes("4 lvl")) {
            quality = "max quality ";
        } else {
            quality = "";
        }
        
        let qty = parseQuantity(rawItem);
        let qtyText = qty ? `${qty} ` : "";
        let isPlural = cleanLower.includes("parts") || cleanLower.includes("tunings") || (qty && qty > 1) || cleanLower.endsWith("s");
        
        let canonicalName = matchedPart;
        if (canonicalName === "tuning part" || canonicalName === "tuning parts") {
            canonicalName = isPlural ? "tuning parts" : "tuning part";
        } else {
            canonicalName = isPlural ? `${canonicalName} tunings` : `${canonicalName} tuning`;
        }
        
        return `${qtyText}${quality}${canonicalName}`;
    }
    
    // 1.7. Pickaxe check
    if (cleanLower.includes("pickaxe") || cleanLower.includes("pick axe") || cleaned.includes("pickaxe")) {
        let quality = "";
        if (cleanLower.includes("low") || cleanLower.includes("lvl 1") || cleanLower.includes("lvl1") || cleanLower.includes("level 1") || cleanLower.includes("1lvl") || cleanLower.includes("1 lvl")) {
            quality = "low quality ";
        } else if (cleanLower.includes("medium") || cleanLower.includes("med") || cleanLower.includes("lvl 2") || cleanLower.includes("lvl2") || cleanLower.includes("level 2") || cleanLower.includes("2lvl") || cleanLower.includes("2 lvl")) {
            quality = "medium quality ";
        } else if (cleanLower.includes("high") || cleanLower.includes("lvl 3") || cleanLower.includes("lvl3") || cleanLower.includes("level 3") || cleanLower.includes("3lvl") || cleanLower.includes("3 lvl")) {
            quality = "high quality ";
        } else if (cleanLower.includes("max") || cleanLower.includes("lvl 4") || cleanLower.includes("lvl4") || cleanLower.includes("level 4") || cleanLower.includes("4lvl") || cleanLower.includes("4 lvl")) {
            quality = "max quality ";
        } else if (cleanLower.includes("advanced") || cleanLower.includes("lvl 5") || cleanLower.includes("lvl5") || cleanLower.includes("level 5") || cleanLower.includes("5lvl") || cleanLower.includes("5 lvl")) {
            quality = "advanced quality ";
        }
        
        let qty = parseQuantity(rawItem);
        let qtyText = qty ? `${qty} ` : "";
        let isPlural = cleanLower.includes("pickaxes") || (qty && qty > 1) || cleanLower.endsWith("s") || hasEach;
        let name = isPlural ? "pickaxes" : "pickaxe";
        
        return `${qtyText}${quality}${name}`;
    }
    
    // 1.8. Inventory check
    if (cleanLower.includes("inventory") || cleanLower.includes("inventry") || cleanLower.includes("inventories")) {
        let quality = "";
        if (cleanLower.includes("low") || cleanLower.includes("lvl 1") || cleanLower.includes("lvl1") || cleanLower.includes("level 1") || cleanLower.includes("1lvl") || cleanLower.includes("1 lvl")) {
            quality = "low quality ";
        } else if (cleanLower.includes("medium") || cleanLower.includes("med") || cleanLower.includes("lvl 2") || cleanLower.includes("lvl2") || cleanLower.includes("level 2") || cleanLower.includes("2lvl") || cleanLower.includes("2 lvl")) {
            quality = "medium quality ";
        } else if (cleanLower.includes("high") || cleanLower.includes("lvl 3") || cleanLower.includes("lvl3") || cleanLower.includes("level 3") || cleanLower.includes("3lvl") || cleanLower.includes("3 lvl")) {
            quality = "high quality ";
        } else if (cleanLower.includes("max") || cleanLower.includes("lvl 4") || cleanLower.includes("lvl4") || cleanLower.includes("level 4") || cleanLower.includes("4lvl") || cleanLower.includes("4 lvl")) {
            quality = "max quality ";
        }
        
        let qty = parseQuantity(rawItem);
        let qtyText = qty ? `${qty} ` : "";
        let isPlural = cleanLower.includes("inventories") || (qty && qty > 1) || hasEach;
        let name = isPlural ? "inventories" : "inventory";
        
        return `${qtyText}${quality}${name}`;
    }
    
    // Luminous stone check (resource item with type support)
    if (cleanLower.includes("luminous stone") || cleaned.includes("luminous stone")) {
        // Check for type numbers (e.g. "luminous stone 1 and 2") FIRST, before parseQuantity
        const stoneTypeNums = parseMultipleTypes(rawItem.replace(/^\d+\s+/, ""));
        if (stoneTypeNums) {
            // When type is detected, no qty prefix — just return the typed name
            let isPlural = stoneTypeNums.includes("and") || stoneTypeNums.includes(",");
            let name = "luminous stones";
            return `${name} of type ${stoneTypeNums}`;
        }
        let qty = parseQuantity(rawItem);
        let qtyText = qty ? `${qty} ` : "";
        let isPlural = cleanLower.includes("stones") || (qty && qty > 1) || hasEach;
        let name = isPlural ? "luminous stones" : "luminous stone";
        return `${qtyText}${name}`;
    }
    
    // Biospark check
    if (cleanLower.includes("biospark") || cleaned.includes("biospark")) {
        let qty = parseQuantity(rawItem);
        let qtyText = qty ? `${qty} ` : "";
        // Check for type numbers (e.g. "biosparks 2" or "biosparks 1 and 3")
        const biosTypeNums = parseMultipleTypes(rawItem.replace(/^\d+\s+/, ""));
        if (biosTypeNums) {
            let isPlural = biosTypeNums.includes("and") || biosTypeNums.includes(",");
            let name = isPlural ? "Biosparks" : "Biosparks";
            return `${qtyText}${name} of type ${biosTypeNums}`;
        }
        let isPlural = cleanLower.includes("biosparks") || (qty && qty > 1) || hasEach;
        let name = isPlural ? "Biosparks" : "Biospark";
        return `${qtyText}${name}`;
    }

    // Token check
    if (cleanLower.includes("token") || cleaned.includes("token")) {
        let qty = parseQuantity(rawItem);
        let qtyText = qty ? `${qty} ` : "";
        let isPlural = cleanLower.includes("tokens") || (qty && qty > 1) || hasEach;
        let name = isPlural ? "tokens" : "token";
        return `${qtyText}${name}`;
    }

    // 1.9. Power booster shot check
    if (cleanLower.includes("booster") || cleanLower.includes("boost shot") || cleanLower.includes("booster shot")) {
        let qty = parseQuantity(rawItem);
        let qtyText = qty ? `${qty} ` : "";
        let isPlural = cleanLower.includes("shots") || (qty && qty > 1) || cleanLower.endsWith("s") || hasEach;
        let name = isPlural ? "power booster shots" : "power booster shot";
        return `${qtyText}${name}`;
    }
    
    // 1.10. Fishing rod check
    if (cleanLower.includes("fishing rod") || cleanLower.includes("fishingrod") || cleanLower.includes("rod") || cleaned.includes("fishing rod")) {
        let quality = "";
        if (cleanLower.includes("low") || cleanLower.includes("lvl 1") || cleanLower.includes("lvl1") || cleanLower.includes("level 1") || cleanLower.includes("1lvl") || cleanLower.includes("1 lvl")) {
            quality = "low quality ";
        } else if (cleanLower.includes("medium") || cleanLower.includes("med") || cleanLower.includes("lvl 2") || cleanLower.includes("lvl2") || cleanLower.includes("level 2") || cleanLower.includes("2lvl") || cleanLower.includes("2 lvl")) {
            quality = "medium quality ";
        } else if (cleanLower.includes("high") || cleanLower.includes("lvl 3") || cleanLower.includes("lvl3") || cleanLower.includes("level 3") || cleanLower.includes("3lvl") || cleanLower.includes("3 lvl")) {
            quality = "high quality ";
        } else if (cleanLower.includes("max") || cleanLower.includes("lvl 4") || cleanLower.includes("lvl4") || cleanLower.includes("level 4") || cleanLower.includes("4lvl") || cleanLower.includes("4 lvl")) {
            quality = "max quality ";
        } else if (cleanLower.includes("advanced") || cleanLower.includes("lvl 5") || cleanLower.includes("lvl5") || cleanLower.includes("level 5") || cleanLower.includes("5lvl") || cleanLower.includes("5 lvl")) {
            quality = "advanced quality ";
        }
        
        let qty = parseQuantity(rawItem);
        let qtyText = qty ? `${qty} ` : "";
        let isPlural = cleanLower.includes("rods") || (qty && qty > 1) || cleanLower.endsWith("s") || hasEach;
        let name = isPlural ? "fishing rods" : "fishing rod";
        
        return `${qtyText}${quality}${name}`;
    }
    
    // 1.11. SIM card check
    if (cleanLower.includes("sim card") || cleanLower.includes("simcard") || cleanLower.includes("sim card no") || cleanLower.includes("sim card \u2116")) {
        const numMatch = rawItem.match(/\b\d+[-0-9]*\b/);
        let numStr = numMatch ? numMatch[0] : "";
        let qty = parseQuantity(rawItem);
        let isPlural = cleanLower.includes("cards") || (!numStr && qty > 1);
        
        if (isPlural) {
            let qtyText = qty ? `${qty} ` : "";
            return `${qtyText}SIM cards`;
        } else {
            if (numStr) {
                let formattedNum = numStr;
                if (!numStr.includes("-")) {
                    const cleanNum = numStr.replace(/\D/g, "");
                    // Bypass hyphenation for repeating digit numbers (e.g. 1111111)
                    const isRepeatingDigits = /^(\d)\1+$/.test(cleanNum);
                    if (!isRepeatingDigits) {
                        if (cleanNum.length === 7 || cleanNum.length === 6 || cleanNum.length === 5) {
                            formattedNum = `${cleanNum.slice(0, 2)}-${cleanNum.slice(2, 4)}-${cleanNum.slice(4)}`;
                        } else if (cleanNum.length === 4) {
                            formattedNum = `${cleanNum.slice(0, 2)}-${cleanNum.slice(2)}`;
                        }
                    }
                }
                return `SIM card \u2116 ${formattedNum}`;
            } else {
                return `SIM card`;
            }
        }
    }
    
    // 2. Fruits check
    const fruitsList = ["pineapple", "mandarin", "strawberry", "pumpkin", "cabbage", "mushroom"];
    for (const fruit of fruitsList) {
        if (cleanLower.includes(fruit) || cleaned.includes(fruit) || getClosestMatch(cleaned, [fruit], 0.7)) {
            let type = (fruit === "cabbage") ? "vegetables" : "fruits";
            if (cleanLower.includes("seed") || cleaned.includes("seed")) type = "seeds";
            
            let qty = parseQuantity(rawItem);
            let qtyText = qty ? `${qty} ` : "";
            let suffix = isBulk ? " in bulk" : "";
            return `${qtyText}${fruit} ${type}${suffix}`;
        }
    }
    
    // 3. Shoulder pets
    if (cleanLower.includes("shoulder") || cleanLower.includes("sholder") || cleanLower.includes("pet") || cleanLower.includes("fox") || cleanLower.includes("cat") ||
        cleaned.includes("shoulder") || cleaned.includes("sholder") || cleaned.includes("pet") || cleaned.includes("fox") || cleaned.includes("cat")) {
        
        const petNames = ["six tailed fox", "white cat", "brown dog", "dog", "fox", "cat"];
        const cleanedStr = cleanLower.replace(/on shoulder pet|shoulder pet|on shoulder|shoulder|sholder|pet/gi, "").trim();
        const cleanedStrFuzzy = cleanItemForFuzzy(cleanedStr);
        
        const matchedPet = getClosestMatch(cleanedStrFuzzy, petNames, 0.6) || getClosestMatch(cleanedStr, petNames, 0.6);
        if (matchedPet) {
            let canonicalPet = matchedPet;
            if (matchedPet === "six tail fox" || matchedPet === "6 tailed fox" || matchedPet === "6 tail fox" || matchedPet === "fox") {
                canonicalPet = "six tailed fox";
            }
            return `${canonicalPet} on shoulder pet`;
        }
    }
    
    // 4. Cage pets
    const hasCage = cleanLower.includes("cage") || cleaned.includes("cage");
    const hasPet = cleanLower.includes("pet") || cleaned.includes("pet");
    const hasPetFood = cleanLower.includes("pet food") || cleaned.includes("pet food");
    if ((hasCage && hasPet) || (hasPet && !hasPetFood)) {
        const hasSpecificPet = ["panda", "duckling", "fancy bear", "kitty bunny", "cute hippo", "mini robot", "cyberdog", "robobeast", "mr candy cane", "futuristic friend", "husky", "new years husky", "border collie", "cougar", "poodle", "pug", "retriever", "rooster", "puma", "rottweiler", "cosmodog", "easter bunny", "santa claus", "christmas elf", "rabbit", "rat", "pig", "lion cub", "westie", "dog", "cat"].some(p => cleanLower.includes(p));
        if (!hasSpecificPet) {
            return "cage with a pet";
        }
    }

    const petsList = ["panda", "duckling", "fancy bear", "kitty bunny", "cute hippo", "mini robot", "cyberdog", "robobeast", "mr candy cane", "futuristic friend", "husky", "new years husky", "border collie", "cougar", "poodle", "pug", "retriever", "rooster", "puma", "rottweiler", "cosmodog", "easter bunny", "santa claus", "christmas elf", "rabbit", "rat", "pig", "lion cub", "westie", "dog", "cat"];
    for (const pet of petsList) {
        if (cleanLower.includes(pet) || cleaned.includes(pet) || getClosestMatch(cleaned, [pet], 0.7)) {
            const pCap = pet.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
            return `cage with a ${pCap}`;
        }
    }
    
    // 5. Resources check
    const resourcesList = ["copper", "emerald", "ruby", "diamond", "obsidian", "magma stone", "metal"];
    for (const res of resourcesList) {
        if (cleanLower.includes(res) || cleaned.includes(res) || getClosestMatch(cleaned, [res], 0.7)) {
            let qty = parseQuantity(rawItem);
            let qtyText = qty ? `${qty} ` : "";
            let pName = res;
            
            const isBulk = cleanLower.includes("in bulk") || cleanLower.includes("bulk");
            
            const isEach = /\beach\b/i.test(cleanLower);
            if (res === "emerald") pName = (qty > 1 || isBulk || cleanLower.endsWith("s") || isEach) ? "emeralds" : "an emerald";
            else if (res === "ruby") pName = (qty > 1 || isBulk || cleanLower.endsWith("s") || cleanLower.endsWith("ies") || isEach) ? "rubies" : "a ruby";
            else if (res === "diamond") pName = (qty > 1 || isBulk || cleanLower.endsWith("s") || isEach) ? "diamonds" : "a diamond";
            else if (res === "magma stone") pName = (qty > 1 || isBulk || cleanLower.endsWith("s") || isEach) ? "magma stones" : "a magma stone";
            else if (res === "metal") {
                if (/\b(?:top|top\s+quality|high\s+quality)\b/i.test(cleanLower) || /\b(?:top|top\s+quality|high\s+quality)\b/i.test(cleaned)) {
                    pName = "top quality metal";
                } else if (cleanLower.includes("scrap") || cleaned.includes("scrap")) {
                    pName = "scrap metal";
                } else {
                    pName = "scrap metal"; // fallback
                }
            }
            
            let resultName = `${qtyText}${pName}`;
            if (isBulk && !resultName.toLowerCase().includes("in bulk")) {
                resultName += " in bulk";
            }
            return resultName;
        }
    }
    
    // 6. General mappings
    const mappings = {
        "automatic drill": ["automatic drill", "auto drill", "drill", "dril"],
        "automatic sawmill": ["automatic sawmill", "sawmill", "saw mill"],
        "video card": ["video card", "videocard", "graphic card", "graphics card", "gpu"],
        "repair kit": ["repair kit", "rep kit"],
        "hookah": ["hookah", "hoka"],
        "paint can": ["paint can", "spray can"],
        "battery": ["battery", "batteries", "battries", "batry", "battres", "battre", "batteys", "battey"],
        "scrap metal": ["scrap metal", "scrapmetal"],
        "top quality metal": ["top quality metal", "top quality metel"],
        "thread": ["thread", "threads"],
        "timber": ["timber"],
        "token": ["token", "tokens"],
        "seeds": ["seeds", "seed"],
        "tonic treat": ["tonic treat", "tonic", "treat"],
        "Treasure Map": ["treasure map", "treasuremap"],
        "wires": ["wires", "wire"],
        "sponge": ["sponge", "sponges"],
        "license plate": ["license plate", "licence plate"],
        "premium fuel canister": ["premium fuel canister", "premium fuel canisters", "premium fuel", "premium fuel can", "premium fuel cans", "canister of premium fuel", "canisters of premium fuel"],
        "fuel canister": ["fuel canister", "fuel canisters", "fuel can", "fuel cans", "canister of fuel", "canisters of fuel", "canister", "canisters"],
        "fuel for resource extraction": ["fuel for resource extraction", "fuel", "resource extraction fuel", "extraction fuel"],
        "Progen container": ["progen container", "progen containers", "progen contaner", "progen contaners", "container", "containers", "p1 container", "p1 containers", "p1 contaner", "p1 contaners", "porgen p1", "porgen p1 container", "progen p1", "progen p1 container", "porgen container", "porgen containers", "porgen contaner", "porgen contaners"],
        "valuable container": ["valuable container", "valuable containers", "valuable contaner", "valuable contaners"],
        "Delivered caravans container": ["delivered caravans container", "delivered caravans containers", "caravans container", "caravans containers", "delivered caravan container", "delivered caravan containers"],
        "bandit container": ["bandit container", "bandit containers", "bandit contaner", "bandit contaners"],
        "biker container": ["biker container", "biker containers", "biker contaner", "biker contaners"],
        "trucker container": ["trucker container", "trucker containers", "trucker contaner", "trucker contaners"],
        "Ingrand container": ["ingrand container", "ingrand containers", "ingrand contaner", "ingrand contaners"],
        "desert scarf mask container": ["desert scarf mask container", "desert scarf mask containers", "desert scarf mask contaner", "desert scarf mask contaners"],
        "resources container": ["resources container", "resources containers", "resources contaner", "resources contaners", "resource container", "resource containers", "resource contaner", "resource contaners", "resources case", "resources cases", "cases of resources", "case of resources"],
        "gardener container": ["gardener container", "gardener containers", "gardener contaner", "gardener contaners", "gardeners container", "gardeners containers", "gardeners contaner", "gardeners contaners", "gardens case", "gardens cases", "gardens container", "gardens containers", "gardner container", "gardner containers"],
        "charger": ["charger", "chargers", "electric charger", "electric chargers", "electric charging", "charging"],
        "personal driver": ["personal driver", "personal drivers", "professional driver", "professional drivers", "driver", "drivers"],
        "lawyer": ["lawyer", "lawyers"],
        "professional dancer": ["professional dancer", "professional dancers"],
        "professional singer": ["professional singer", "professional singers"],
        "DJ": ["dj", "djs"],
        "solar panel": ["solar panel", "solar panels"],
        "solar barrel": ["solar barrel", "solar barrels"],
        "gasoline barrel": ["gasoline barrel", "gasoline barrels", "petrol barrel", "petrol barrels"],
        "kerene barrel": ["kerene barrel", "kerene barrels", "kerosene barrel", "kerosene barrels"],
        "GrandPro BodyCam": ["grandpro bodycam", "grandpro bodycams", "bodycam", "bodycams", "body cam", "body cams", "grand pro bodycam", "grand pro bodycams"],
        "Leash": ["leash", "leashes"],
        "Dirty Statue": ["dirty statue", "dirty statues"],
        "Purified Statue": ["purified statue", "purified statues"],
        "Drawing": ["drawing", "drawings"],
        "Christmas key": ["christmas key", "christmas keys"],
        "Christmas copper": ["christmas copper"],
        "Christmas timber": ["christmas timber"],
        "Christmas perch": ["christmas perch", "christmas perches"],
        "Christmas seed": ["christmas seed", "christmas seeds"],
        "Christmas lollipop": ["christmas lollipop", "christmas lollipops"],
        "New years gift": ["new years gift", "new years gifts", "new year gift", "new year gifts"],
        "Little gift": ["a little gift", "a little gifts", "little gift", "little gifts"],
        "Big gift": ["a big gift", "a big gifts", "big gift", "big gifts"],
        "Opened gift": ["an opened gift", "an opened gifts", "opened gift", "opened gifts"],
        "letter \"G\"": ["letter g", "g letter"],
        "letter \"R\"": ["letter r", "r letter"],
        "letter \"A\"": ["letter a", "a letter"],
        "letter \"N\"": ["letter n", "n letter"],
        "letter \"D\"": ["letter d", "d letter"],
        "letters": ["letters"]
    };
    
    for (const canonical in mappings) {
        const aliases = mappings[canonical];
        
        // Prevent fuzzy matching non-containers to containers
        if (canonical.toLowerCase().includes("container")) {
            const hasContainerWord = /\b(?:container|containers|contaner|contaners|continres|continre|cases?|crates?)\b/i.test(cleanLower) || cleanLower.includes("p1") || cleanLower.includes("porgen") || cleanLower.includes("progen");
            if (!hasContainerWord) {
                continue;
            }
        }
        
        // Check match against cleanLower, cleaned, and each alias cleaned
        let matchedAlias = getClosestMatch(cleaned, aliases.map(cleanItemForFuzzy), 0.7) || getClosestMatch(cleanLower, aliases, 0.7);
        if (matchedAlias) {
            let qty = parseQuantity(rawItem);
            let qtyText = qty ? `${qty} ` : "";
            
            let quality = "";
            if (canonical !== "video card") {
                if (cleanLower.includes("low") || cleaned.includes("low") || /\b(?:lvl|level)\s*1\b/i.test(cleanLower) || /\b1\s*(?:lvl|level)\b/i.test(cleanLower)) quality = "low quality ";
                else if (cleanLower.includes("medium") || cleanLower.includes("med") || cleaned.includes("medium") || cleaned.includes("med") || /\b(?:lvl|level)\s*2\b/i.test(cleanLower) || /\b2\s*(?:lvl|level)\b/i.test(cleanLower)) quality = "medium quality ";
                else if (cleanLower.includes("high") || cleanLower.includes("high") || /\b(?:lvl|level)\s*3\b/i.test(cleanLower) || /\b3\s*(?:lvl|level)\b/i.test(cleanLower)) quality = "high quality ";
                else if (cleanLower.includes("max") || cleanLower.includes("max") || /\b(?:lvl|level)\s*4\b/i.test(cleanLower) || /\b4\s*(?:lvl|level)\b/i.test(cleanLower)) quality = "max quality ";
                else if (cleanLower.includes("advanced") || cleanLower.includes("advanced") || /\b(?:lvl|level)\s*5\b/i.test(cleanLower) || /\b5\s*(?:lvl|level)\b/i.test(cleanLower)) quality = "advanced quality ";
            }
            
            let finalName = canonical;
            if (finalName === "license plate") {
                const plateMatch = rawItem.match(/license plate\s*\(?([a-z0-9]+)\)?/i) || rawItem.match(/plate\s*\(?([a-z0-9]+)\)?/i);
                if (plateMatch) {
                    return `license plate (${plateMatch[1].toUpperCase()})`;
                }
            }
            
            if (qty > 1 || cleanLower.endsWith("s") || cleanLower.includes("in bulk") || cleanLower.includes("bulk") || hasEach) {
                finalName = pluralizeItemName(finalName);
            }
            
            let resultName = `${qtyText}${quality}${finalName}`;
            if ((cleanLower.includes("in bulk") || cleanLower.includes("bulk")) && !resultName.toLowerCase().includes("in bulk")) {
                resultName += " in bulk";
            }
            return resultName;
        }
    }

    // 7. Fallback: Automatically match against all official database items from ITEMS_DB, BUSINESSES_DB, CLOTHING_DB, and VEHICLE_DB
    const allOfficialItems = [];
    if (typeof ITEMS_DB !== "undefined") {
        for (const cat in ITEMS_DB) {
            ITEMS_DB[cat].forEach(item => {
                if (item && !allOfficialItems.includes(item)) {
                    allOfficialItems.push(item);
                }
            });
        }
    }
    if (typeof BUSINESSES_DB !== "undefined") {
        BUSINESSES_DB.forEach(item => {
            if (item && !allOfficialItems.includes(item)) {
                allOfficialItems.push(item);
            }
        });
    }
    if (typeof CLOTHING_DB !== "undefined") {
        for (const gender in CLOTHING_DB) {
            for (const cat in CLOTHING_DB[gender]) {
                if (Array.isArray(CLOTHING_DB[gender][cat])) {
                    CLOTHING_DB[gender][cat].forEach(item => {
                        if (item && !allOfficialItems.includes(item)) {
                            allOfficialItems.push(item);
                        }
                    });
                }
            }
        }
    }
    if (typeof VEHICLE_DB !== "undefined") {
        for (const cat in VEHICLE_DB) {
            if (Array.isArray(VEHICLE_DB[cat])) {
                VEHICLE_DB[cat].forEach(item => {
                    if (item && !allOfficialItems.includes(item)) {
                        allOfficialItems.push(item);
                    }
                });
            }
        }
    }
    const cleanAliases = allOfficialItems.map(cleanItemForFuzzy);
    let matchedIdx = -1;
    
    // Exact or close match on cleaned name
    let matchedItem = getClosestMatch(cleaned, cleanAliases, 0.8);
    if (matchedItem) {
        matchedIdx = cleanAliases.indexOf(matchedItem);
    } else {
        // Fallback to matching raw cleanLower
        let matchedRaw = getClosestMatch(cleanLower, allOfficialItems, 0.8);
        if (matchedRaw) {
            matchedIdx = allOfficialItems.indexOf(matchedRaw);
        }
    }
    
    if (matchedIdx !== -1) {
        const canonical = allOfficialItems[matchedIdx];
        let qty = parseQuantity(rawItem);
        let qtyText = qty ? `${qty} ` : "";
        let finalName = canonical;
        
        let quality = "";
        if (cleanLower.includes("low") || cleaned.includes("low") || /\b(?:lvl|level)\s*1\b/i.test(cleanLower) || /\b1\s*(?:lvl|level)\b/i.test(cleanLower)) quality = "low quality ";
        else if (cleanLower.includes("medium") || cleanLower.includes("med") || cleaned.includes("medium") || cleaned.includes("med") || /\b(?:lvl|level)\s*2\b/i.test(cleanLower) || /\b2\s*(?:lvl|level)\b/i.test(cleanLower)) quality = "medium quality ";
        else if (cleanLower.includes("high") || cleanLower.includes("high") || /\b(?:lvl|level)\s*3\b/i.test(cleanLower) || /\b3\s*(?:lvl|level)\b/i.test(cleanLower)) quality = "high quality ";
        else if (cleanLower.includes("max") || cleanLower.includes("max") || /\b(?:lvl|level)\s*4\b/i.test(cleanLower) || /\b4\s*(?:lvl|level)\b/i.test(cleanLower)) quality = "max quality ";
        else if (cleanLower.includes("advanced") || cleanLower.includes("advanced") || /\b(?:lvl|level)\s*5\b/i.test(cleanLower) || /\b5\s*(?:lvl|level)\b/i.test(cleanLower)) quality = "advanced quality ";

        if (qty > 1 || cleanLower.endsWith("s") || cleanLower.includes("in bulk") || cleanLower.includes("bulk") || hasEach) {
            finalName = pluralizeItemName(finalName);
        }
        
        let resultName = `${qtyText}${quality}${finalName}`;
        if ((cleanLower.includes("in bulk") || cleanLower.includes("bulk")) && !resultName.toLowerCase().includes("in bulk")) {
            resultName += " in bulk";
        }
        return resultName;
    }
    
    return null;
}

function formatGeneralItem(text, ctx) {
    const lower = text.toLowerCase();
    
    const hasBeachMarket = lower.includes("beach market") || lower.includes("beach markit");
    const hasVariousIndicator = lower.includes("various") || 
                                lower.includes("things") || 
                                lower.includes("goods") || 
                                lower.includes("items") || 
                                lower.includes("everything") || 
                                lower.includes("anything") ||
                                lower.includes("all items") ||
                                lower.includes("all things") ||
                                lower.includes("low price") ||
                                lower.includes("cheap");
    if (hasBeachMarket && hasVariousIndicator) {
        const shopMatch = text.match(/(?:shop|\u2116|#|no\.?|number|num\.?)\s*(?:no\.?|number|num\.?|#|\u2116)?\s*(\d+)/i);
        let shopStr = shopMatch ? ` shop \u2116${shopMatch[1]}` : "";
        return `various items at the beach market${shopStr}`;
    }
    
    if (lower.includes("juice") || lower.includes("juise") || lower.includes("juse")) {
        let juiceName = "";
        let qty = parseQuantity(text);
        let qtyText = qty ? `${qty} ` : "";
        let isPlural = lower.includes("juices") || lower.includes("juises") || lower.includes("juses") || (qty && qty > 1);
        
        let adjectives = [];
        let postnominal = "";
        
        if (lower.includes("becoming an animal") || lower.includes("becoming animal") || lower.includes("become animal") || lower.includes("becomng animal") || lower.includes("animal")) {
            postnominal = "on becoming an animal";
        } else if (lower.includes("double the payment") || lower.includes("double payment") || lower.includes("double pay") || lower.includes("paycheck") || lower.includes("pay check")) {
            postnominal = "for double the payment";
        } else {
            if (lower.includes("fast running") || lower.includes("fastrun") || lower.includes("running") || /\brun\b/i.test(lower)) {
                adjectives.push("fast running");
            }
            if (lower.includes("attack")) {
                adjectives.push("attack");
            }
            if (lower.includes("protection")) {
                adjectives.push("protection");
            }
            if (lower.includes("endurance")) {
                adjectives.push("endurance");
            }
            if (lower.includes("riding")) {
                adjectives.push("riding");
            }
            if (lower.includes("power")) {
                adjectives.push("power");
            }
            if (lower.includes("immunity")) {
                adjectives.push("immunity");
            }
        }
        
        if (postnominal) {
            juiceName = isPlural ? `juices ${postnominal}` : `juice ${postnominal}`;
        } else if (adjectives.length > 0) {
            let adjText = "";
            if (adjectives.length === 1) {
                adjText = adjectives[0];
            } else if (adjectives.length === 2) {
                adjText = `${adjectives[0]} and ${adjectives[1]}`;
            } else {
                const lastAdj = adjectives.pop();
                adjText = `${adjectives.join(", ")} and ${lastAdj}`;
            }
            const plural = isPlural || adjectives.length > 1;
            juiceName = plural ? `${adjText} juices` : `${adjText} juice`;
        }
        
        if (juiceName) {
            const pctMatch = text.match(/\b(\d+)%/);
            if (pctMatch) {
                const pct = pctMatch[1] + "%";
                juiceName = `${pct} ${juiceName}`;
            }
            return `${qtyText}${juiceName}`;
        }
        
        const pctMatches = text.match(/\b\d+%(?!\w)/g);
        if (pctMatches && pctMatches.length >= 2) {
            return `${pctMatches[0]} and ${pctMatches[1]} juices in bulk`;
        } else if (pctMatches && pctMatches.length === 1) {
            return `${pctMatches[0]} juices in bulk`;
        } else {
            return `juices in bulk`;
        }
    }
    
    if (lower.includes("prime") || lower.includes("platnum") || lower.includes("platinum")) {
        let type = "Prime";
        if (lower.includes("platinum") || lower.includes("platnum")) type = "Prime Platinum";
        
        const numberMatches = [...text.matchAll(/\b(\d+)\b/g)].map(m => parseInt(m[1]));
        if (numberMatches.length >= 2) {
            return `${type} with ${numberMatches[0]} and ${numberMatches[1]} days`;
        } else if (numberMatches.length === 1) {
            return `${type} with ${numberMatches[0]} days`;
        }
        return type;
    }
    
    const fuzzyCorrected = fuzzyCorrectItemName(text, ctx);
    if (fuzzyCorrected) {
        return fuzzyCorrected;
    }
    
    return null;
}

function parseQuantity(text) {
    const lower = text.toLowerCase();
    const regex = /\b(\d+)\b/g;
    let match;
    
    // Find if there is any matched clothing item in the text to avoid matching its model numbers as quantity
    const matchedClothing = matchClothingItem(text);
    const clothingNumbers = matchedClothing ? (matchedClothing.name.match(/\b\d+\b/g) || []).map(n => parseInt(n)) : [];

    while ((match = regex.exec(lower)) !== null) {
        const val = parseInt(match[1]);
        
        // Skip numbers that are part of the clothing model name (e.g. 700 in "Abibas Pezy Boost 700 V3 Alvah shoes")
        if (clothingNumbers.includes(val)) {
            continue;
        }

        const start = match.index;
        const end = regex.lastIndex;
        
        // Check prefix
        const prefixText = lower.substring(Math.max(0, start - 15), start).trim();
        
        // Skip if preceded by price keywords or currency symbols
        if (/(?:price|budget|rent|bet|cost|cash|salary|wage|\$)\s*$/i.test(prefixText)) {
            continue;
        }
        
        if (/(?:\bhouse|\bapartment|\bmansion|\bpenthouse|\bshop|\bcard|\bcards|\bsim|\u2116|#|\bno\.?|\blevel|\blvl|\btype|\bt\.?|\bvolex|\bkolex|\btrousers?|\bmasks?|\bshoes?|\bt-shirts?|\bsweatshirts?|\bjackets?|\bhoodies?|\bdress|\bwatch(?:es)?|\bglasses|\bcaps?|\bhats?|\bshorts?|\bleggings?|\bsuits?|\baccessory|\baccessories|\bskirts?|\bvests?|\bpants|\bpiercings?|\bhorns?|\bearphones?|\bheadphones?|\bears?|\bcapes?|\bcrowns?|\bgloves?|\bstones?|\bbiosparks?)$/i.test(prefixText.replace(/[:#\s\u2116]+$/g, "").trim())) {
            continue;
        }
        
        // Check suffix
        const suffixText = lower.substring(end, Math.min(lower.length, end + 15)).trim();
        
        // Skip if followed by price suffixes
        if (/^(?:m|mil|ml|million|k|thousand|b|billion|trillion)\b/i.test(suffixText)) {
            continue;
        }
        
        if (/^(?:%|percent|g\.?s\.?|w\.?h\.?|days?|lvls?|levels?|years?)/i.test(suffixText)) {
            continue;
        }
        
        return val;
    }
    return null;
}

/* ==========================================================================
   Location Prepositions & Capitalization Formatter
   ========================================================================== */

function formatLocationTerms(bodyText, ctx) {
    let lower = bodyText.toLowerCase();
    let result = bodyText;
    
    // 1. Check Official Places
    OFFICIAL_PLACES.forEach(place => {
        const pLower = place.toLowerCase();
        // Case-insensitive replace with proper casing
        const regex = new RegExp(`\\b${escapeRegExp(pLower)}\\b`, "gi");
        if (regex.test(result)) {
            result = result.replace(regex, place);
            ctx.logs.push({ text: `Capitalized official place: <strong>${place}</strong>`, type: 'correction' });
        }
    });
    
    // 2. Check Unofficial Places (Must prepend "the" if prepositions like in, near, at are present)
    UNOFFICIAL_PLACES.forEach(place => {
        // Find prepositions followed by the place
        // e.g. "near beach market" or "in ghetto" or "at airport"
        const prepRegex = new RegExp(`\\b(in|near|at|to)\\s+(${escapeRegExp(place)})\\b`, "gi");
        if (prepRegex.test(result)) {
            result = result.replace(prepRegex, `$1 the $2`);
            ctx.logs.push({ text: `Inserted "the" preposition modifier for unofficial place: <strong>${place}</strong>`, type: 'correction' });
        }
        
        // Ensure unofficial places are fully lowercase
        const placeRegex = new RegExp(`\\b${escapeRegExp(place)}\\b`, "gi");
        if (placeRegex.test(result)) {
            result = result.replace(placeRegex, place.toLowerCase());
        }
    });
    
    return result;
}

/* ==========================================================================
   UI Update & Rendering
   ========================================================================== */

function updateUI(ctx) {
    const textDisplay = document.getElementById("processed-ad-text");
    textDisplay.setAttribute("data-active-category", ctx.category);
    const banner = document.getElementById("ad-status-banner");
    const rejectionBox = document.getElementById("rejection-container");
    const blacklistBox = document.getElementById("blacklist-container");
    const logsList = document.getElementById("audit-logs-list");
    const btnCopy = document.getElementById("btn-copy-ad");
    const btnCopyRej = document.getElementById("btn-copy-rejection");
    const btnSubmitBugInline = document.getElementById("btn-submit-bug-inline");
    if (btnSubmitBugInline) {
        btnSubmitBugInline.classList.remove("hide");
    }

    const btnGeminiAssist = document.getElementById("btn-gemini-assist");
    if (btnGeminiAssist) {
        btnGeminiAssist.disabled = !ctx.raw || !ctx.raw.trim();
    }
    
    // Clear logs
    logsList.innerHTML = "";
    
    // Render logs
    if (ctx.logs.length === 0) {
        logsList.innerHTML = `<li class="log-empty">No corrections made.</li>`;
    } else {
        ctx.logs.forEach(log => {
            const li = document.createElement("li");
            let icon = `<i class="fa-solid fa-circle-info log-correction"></i>`;
            if (log.type === 'policy') icon = `<i class="fa-solid fa-square-check log-policy"></i>`;
            else if (log.type === 'warning') icon = `<i class="fa-solid fa-triangle-exclamation log-warning"></i>`;
            else if (log.type === 'danger') icon = `<i class="fa-solid fa-circle-xmark log-danger"></i>`;
            
            li.innerHTML = `${icon} <span>${log.text.replace(/<(?!\/?(?:strong|em|code)\b)[^>]*>/gi, '')}</span>`;
            logsList.appendChild(li);
        });
    }
    
    // Policy Helper Cards variables
    const blacklistHelper = document.getElementById("blacklist-policy-helper");
    const blacklistHelperDesc = document.getElementById("blacklist-policy-helper-desc");
    const rejectionHelper = document.getElementById("rejection-policy-helper");
    const rejectionHelperDesc = document.getElementById("rejection-policy-helper-desc");

    // Render status
    if (ctx.status === "passed") {
        textDisplay.textContent = ctx.finalText;
        textDisplay.classList.remove("placeholder");
        
        banner.setAttribute("data-status", "passed");
        banner.querySelector(".status-title").textContent = "Policy Check Passed";
        banner.querySelector(".status-icon").innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
        
        rejectionBox.classList.add("hide");
        document.getElementById("rejection-reason-text").textContent = "None";
        blacklistBox.classList.add("hide");
        btnCopy.disabled = false;
        
        if (blacklistHelper) blacklistHelper.classList.add("hide");
        if (rejectionHelper) rejectionHelper.classList.add("hide");

        if (btnCopyRej) btnCopyRej.classList.add("hide");
        const btnSubmitBugInline = document.getElementById("btn-submit-bug-inline");
        if (btnSubmitBugInline && updateUI._lastText !== ctx.raw) {
            btnSubmitBugInline.classList.remove("btn-sent");
            btnSubmitBugInline.classList.add("glow-red");
            btnSubmitBugInline.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Bug`;
        }
        
        // Stats increment check (only once per ad text)
        if (updateUI._lastText !== ctx.raw) {
            stats.processed++;
            const el = document.getElementById("stat-processed");
            if (el) el.querySelector(".stat-value").textContent = stats.processed;
            updateUI._lastText = ctx.raw;
        }
    } else if (ctx.status === "rejected") {
        textDisplay.textContent = "Advertisement Rejected.";
        textDisplay.classList.add("placeholder");
        
        banner.setAttribute("data-status", "rejected");
        banner.querySelector(".status-title").textContent = "Ad Rejected";
        banner.querySelector(".status-icon").innerHTML = `<i class="fa-solid fa-circle-xmark"></i>`;
        
        document.getElementById("rejection-reason-text").textContent = ctx.rejectionReason;
        rejectionBox.classList.remove("hide");
        blacklistBox.classList.add("hide");
        btnCopy.disabled = true;
        
        if (blacklistHelper) blacklistHelper.classList.add("hide");
        if (rejectionHelper) {
            rejectionHelper.classList.remove("hide");
            let helperText = "According to the official Handbook guidelines, this ad format cannot be processed. Check spelling, spacing, or pricing formats.";
            if (ctx.rejectionReason.toLowerCase().includes("sentence")) {
                helperText = "Policy Handbook Rule: The first letter must be capitalized, and the ad must end with a period (.) unless ending in numbers/digits.";
            } else if (ctx.rejectionReason.toLowerCase().includes("price") || ctx.rejectionReason.toLowerCase().includes("budget")) {
                helperText = "Policy Handbook Rule: Prices must use a dollar sign ($) before values and use periods (.) instead of commas. No abbreviations (k/m) allowed.";
            }
            rejectionHelperDesc.textContent = helperText;
        }

        if (btnCopyRej) {
            btnCopyRej.classList.remove("hide");
        }
        const btnSubmitBugInline = document.getElementById("btn-submit-bug-inline");
        if (btnSubmitBugInline && updateUI._lastText !== ctx.raw) {
            btnSubmitBugInline.classList.remove("btn-sent");
            btnSubmitBugInline.classList.add("glow-red");
            btnSubmitBugInline.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Bug`;
        }
        
        if (updateUI._lastText !== ctx.raw) {
            stats.rejections++;
            const el = document.getElementById("stat-rejections");
            if (el) el.querySelector(".stat-value").textContent = stats.rejections;
            updateUI._lastText = ctx.raw;
        }
    } else if (ctx.status === "blacklisted") {
        textDisplay.textContent = "Advertisement Rejected. Phone Blacklisted.";
        textDisplay.classList.add("placeholder");
        
        banner.setAttribute("data-status", "blacklisted");
        banner.querySelector(".status-title").textContent = "Blacklist Triggered";
        banner.querySelector(".status-icon").innerHTML = `<i class="fa-solid fa-hand-fist"></i>`;
        
        document.getElementById("rejection-reason-text").textContent = ctx.rejectionReason;
        document.getElementById("blacklist-reason-text").textContent = ctx.blacklistReason;
        
        rejectionBox.classList.remove("hide");
        blacklistBox.classList.add("hide");
        btnCopy.disabled = true;

        if (rejectionHelper) rejectionHelper.classList.add("hide");
        if (blacklistHelper) {
            blacklistHelper.classList.remove("hide");
            let helperText = "Policy Handbook Rule: Advertising illegal items, weapons, ammunition, or drugs is strictly prohibited.";
            if (ctx.blacklistReason.toLowerCase().includes("number") || ctx.blacklistReason.toLowerCase().includes("phone")) {
                helperText = "Policy Handbook Rule: The phone number specified triggers a system spam or blacklisted number violation.";
            }
            blacklistHelperDesc.textContent = helperText;
        }
        
        if (btnCopyRej) {
            btnCopyRej.classList.remove("hide");
        }
        const btnSubmitBugInline = document.getElementById("btn-submit-bug-inline");
        if (btnSubmitBugInline && updateUI._lastText !== ctx.raw) {
            btnSubmitBugInline.classList.remove("btn-sent");
            btnSubmitBugInline.classList.add("glow-red");
            btnSubmitBugInline.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Bug`;
        }
        
        if (updateUI._lastText !== ctx.raw) {
            stats.blacklists++;
            const el = document.getElementById("stat-blacklists");
            if (el) el.querySelector(".stat-value").textContent = stats.blacklists;
            updateUI._lastText = ctx.raw;
        }
    }

    // Highlight main page category guide buttons
    const activeCat = ctx.category;
    const mainCatBtns = document.querySelectorAll(".main-category-btn");
    mainCatBtns.forEach(btn => {
        if (activeCat && btn.getAttribute("data-category") === activeCat) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Update Logs analytics dashboard widgets dynamically
    if (typeof updateLogsAnalytics === "function") {
        updateLogsAnalytics();
    }
}



/* ==========================================================================
   Helper Routines
   ========================================================================== */

function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function hashPasscode(passcode) {
    if (!passcode) return "";
    try {
        const msgBuffer = new TextEncoder().encode(passcode);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        console.error("SHA-256 hashing failed:", e);
        return "";
    }
}

/* ==========================================================================
   Document Picture-in-Picture (Always-on-top Floating Clipboard)
   ========================================================================== */

let pipWindowInstance = null;

