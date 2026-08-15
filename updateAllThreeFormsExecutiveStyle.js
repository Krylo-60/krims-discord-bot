// ═══════════════════════════════════════════════════════════════════════════════
// 👑 KryloSMP Master Executive Styling Script for All 3 Google Forms
// ⚡ Designed by Krylo & Krishiv • Season 1 Re-Release
// ═══════════════════════════════════════════════════════════════════════════════

function upgradeAllThreeFormsToKryloKrishivStyle() {
  console.log("🚀 Upgrading All 3 Google Forms to Krylo & Krishiv Executive Style...");

  // Search for the 3 created forms in Google Drive
  const files = DriveApp.getFilesByType(MimeType.GOOGLE_FORMS);
  
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    
    // ═════════════════════════════════════════════════════════
    // 1. 🛡️ MODERATOR FORM UPGRADE
    // ═════════════════════════════════════════════════════════
    if (name.includes('Moderator Application') || name.includes('Mod Application')) {
      console.log('✨ Upgrading Moderator Form: ' + file.getName());
      const form = FormApp.openById(file.getId());
      form.setTitle('👑 KryloSMP — Executive Moderator Application 🛡️');
      form.setDescription(
        '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '👑 KRYLOSMP EXECUTIVE NETWORK • MODERATION RECRUITMENT PROTOCOL\n' +
        '⚡ Architecture & Systems Engineered by Krylo & Krishiv\n' +
        '🌐 Server IP: KryloSmp.play.hosting | Java: 25565 • Bedrock: 19132\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        'Welcome to the official KryloSMP Moderator Recruitment Portal. As a Moderator, you are the first line of defense ensuring our gaming community remains fair, welcoming, and toxic-free.\n\n' +
        'Please provide thorough, honest responses. Low-effort submissions are automatically filtered.'
      );
      form.setCollectEmail(true);
      console.log('   ✅ Moderator Form Upgraded: ' + form.getPublishedUrl());
    }

    // ═════════════════════════════════════════════════════════
    // 2. ⚡ ADMINISTRATOR FORM UPGRADE
    // ═════════════════════════════════════════════════════════
    if (name.includes('Administrator Application') || name.includes('Admin Application')) {
      console.log('✨ Upgrading Administrator Form: ' + file.getName());
      const form = FormApp.openById(file.getId());
      form.setTitle('👑 KryloSMP — Senior Executive Administrator Application ⚡');
      form.setDescription(
        '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '👑 KRYLOSMP EXECUTIVE NETWORK • SENIOR LEADERSHIP RECRUITMENT\n' +
        '⚡ Architecture & Systems Engineered by Krylo & Krishiv\n' +
        '🌐 Server IP: KryloSmp.play.hosting | Java: 25565 • Bedrock: 19132\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        'Welcome to the Senior Leadership Application Portal. Administrators hold elevated access to CoreProtect, Anti-Cheat diagnostics, staff escalations, and technical infrastructure.\n\n' +
        'High maturity, impeccable judgment, and deep loyalty to the server are strictly required.'
      );
      form.setCollectEmail(true);
      console.log('   ✅ Administrator Form Upgraded: ' + form.getPublishedUrl());
    }

    // ═════════════════════════════════════════════════════════
    // 3. 🤝 PARTNERSHIP FORM UPGRADE
    // ═════════════════════════════════════════════════════════
    if (name.includes('Partnership Application') || name.includes('Partner Application')) {
      console.log('✨ Upgrading Partnership Form: ' + file.getName());
      const form = FormApp.openById(file.getId());
      form.setTitle('👑 KryloSMP — Official Server Partnership & Network Application 🤝');
      form.setDescription(
        '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '👑 KRYLOSMP EXECUTIVE NETWORK • OFFICIAL PARTNERSHIP ALLIANCE\n' +
        '⚡ Architecture & Systems Engineered by Krylo & Krishiv\n' +
        '🌐 Server IP: KryloSmp.play.hosting | Java: 25565 • Bedrock: 19132\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        'Collaborate and cross-promote with the KryloSMP Network! We partner with verified Discord servers, Minecraft networks, and gaming communities to grow together.\n\n' +
        'Requirements: 50+ real members, dedicated #partnerships channel, family-friendly atmosphere.'
      );
      form.setCollectEmail(true);
      console.log('   ✅ Partnership Form Upgraded: ' + form.getPublishedUrl());
    }
  }

  console.log('\n🎉 ALL 3 GOOGLE FORMS FULLY UPGRADED TO KRYLO & KRISHIV EXECUTIVE STYLE!');
}
