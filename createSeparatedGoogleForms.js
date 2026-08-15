// ═══════════════════════════════════════════════════════════════════════════════
// 👑 KryloSMP 3 SEPARATE Google Forms & Linked Spreadsheets Generator
// ═══════════════════════════════════════════════════════════════════════════════

function createThreeSeparateKryloForms() {
  console.log("🚀 Creating 3 SEPARATE Google Forms & Spreadsheets for KryloSMP...");

  // ═════════════════════════════════════════════════════════════
  // 1. 🛡️ SEPARATE MODERATOR APPLICATION
  // ═════════════════════════════════════════════════════════════
  const modForm = FormApp.create('🛡️ KryloSMP — Moderator Application');
  modForm.setDescription('━━━━━━━━━━━━━━━━━━━━━━━━━\n👑 KRYLOSMP EXECUTIVE NETWORK • MODERATOR RECRUITMENT\n⚡ Designed by Krylo & Krishiv • Season 1 Re-Release\n🌐 Server IP: KryloSmp.play.hosting\n━━━━━━━━━━━━━━━━━━━━━━━━━\nApply specifically for the Moderator role on KryloSMP. Responsible for in-game chat monitoring, mute/warn enforcement, player dispute resolution, and grief reporting.');
  modForm.setCollectEmail(true);

  modForm.addTextItem().setTitle('Discord Username & Tag (e.g. krylo_official)').setRequired(true);
  modForm.addTextItem().setTitle('Minecraft In-Game Name (IGN) [Java / Bedrock]').setRequired(true);
  modForm.addTextItem().setTitle('Your Age (Must be 13+)').setRequired(true);
  modForm.addTextItem().setTitle('Timezone / Region (e.g. EST, GMT, IST)').setRequired(true);

  const modAvail = modForm.addMultipleChoiceItem();
  modAvail.setTitle('Weekly Active Moderation Hours')
    .setChoices([
      modAvail.createChoice('5 - 10 hours per week'),
      modAvail.createChoice('10 - 20 hours per week'),
      modAvail.createChoice('20+ hours per week')
    ]).setRequired(true);

  modForm.addParagraphTextItem().setTitle('Previous Chat & In-Game Moderation Experience').setRequired(true);
  modForm.addParagraphTextItem().setTitle('Scenario: A player is using toxic slurs in #general-chat and refusing to stop. Outline your exact warning & mute procedure.').setRequired(true);
  modForm.addParagraphTextItem().setTitle('Why do you want to be a MODERATOR specifically on KryloSMP?').setRequired(true);

  // Link to dedicated Mod Sheet
  const modSheet = SpreadsheetApp.create('🛡️ KryloSMP — Moderator Applications (Responses)');
  modForm.setDestination(FormApp.DestinationType.SPREADSHEET, modSheet.getId());
  console.log('✅ 1. MOD FORM: ' + modForm.getPublishedUrl());
  console.log('📊 1. MOD SHEET: ' + modSheet.getUrl());


  // ═════════════════════════════════════════════════════════════
  // 2. ⚡ SEPARATE ADMIN APPLICATION
  // ═════════════════════════════════════════════════════════════
  const adminForm = FormApp.create('⚡ KryloSMP — Administrator Application');
  adminForm.setDescription('━━━━━━━━━━━━━━━━━━━━━━━━━\n👑 KRYLOSMP EXECUTIVE NETWORK • ADMIN RECRUITMENT\n⚡ Designed by Krylo & Krishiv • Season 1 Re-Release\n🌐 Server IP: KryloSmp.play.hosting\n━━━━━━━━━━━━━━━━━━━━━━━━━\nApply specifically for the Administrator role on KryloSMP. High-level leadership role managing staff escalations, CoreProtect rollbacks, plugin testing, economy balance, and anti-cheat investigations.');
  adminForm.setCollectEmail(true);

  adminForm.addTextItem().setTitle('Discord Username & Tag').setRequired(true);
  adminForm.addTextItem().setTitle('Minecraft In-Game Name (IGN)').setRequired(true);
  adminForm.addTextItem().setTitle('Your Age (Must be 15+ for Admin)').setRequired(true);
  adminForm.addTextItem().setTitle('Timezone / Region').setRequired(true);

  const adminAvail = adminForm.addMultipleChoiceItem();
  adminAvail.setTitle('Weekly Active Commitment')
    .setChoices([
      adminAvail.createChoice('10 - 20 hours per week'),
      adminAvail.createChoice('20 - 30 hours per week'),
      adminAvail.createChoice('30+ hours per week (Executive Admin)')
    ]).setRequired(true);

  adminForm.addParagraphTextItem().setTitle('Past Leadership / Senior Staff / Admin Experience (Servers, teams managed, duties performed)').setRequired(true);
  adminForm.addParagraphTextItem().setTitle('Technical Competency: Detail your familiarity with CoreProtect (/co i, /co rollback), EssentialsX, Discord AutoMod, and Permissions.').setRequired(true);
  adminForm.addParagraphTextItem().setTitle('High-Stakes Scenario: An influential player accuses another player of X-ray or duplication glitch. Detail your step-by-step investigation and rollback procedure.').setRequired(true);
  adminForm.addParagraphTextItem().setTitle('Why should Krishiv & Krylo trust YOU with Administrator permissions?').setRequired(true);

  // Link to dedicated Admin Sheet
  const adminSheet = SpreadsheetApp.create('⚡ KryloSMP — Admin Applications (Responses)');
  adminForm.setDestination(FormApp.DestinationType.SPREADSHEET, adminSheet.getId());
  console.log('✅ 2. ADMIN FORM: ' + adminForm.getPublishedUrl());
  console.log('📊 2. ADMIN SHEET: ' + adminSheet.getUrl());


  // ═════════════════════════════════════════════════════════════
  // 3. 🤝 SEPARATE PARTNERSHIP APPLICATION
  // ═════════════════════════════════════════════════════════════
  const partnerForm = FormApp.create('🤝 KryloSMP — Server Partnership Application');
  partnerForm.setDescription('━━━━━━━━━━━━━━━━━━━━━━━━━\n👑 KRYLOSMP EXECUTIVE NETWORK • OFFICIAL PARTNERSHIP PROGRAM\n⚡ Designed by Krylo & Krishiv • Season 1 Re-Release\n🌐 Server IP: KryloSmp.play.hosting\n━━━━━━━━━━━━━━━━━━━━━━━━━\nApply for official server partnership with KryloSMP. Requirements: 50+ members, active community, family-friendly.');
  partnerForm.setCollectEmail(true);

  partnerForm.addTextItem().setTitle('Your Discord Username & Server Owner Status').setRequired(true);
  partnerForm.addTextItem().setTitle('Partner Server / Community Name').setRequired(true);
  partnerForm.addTextItem().setTitle('Permanent Discord Server Invite Link').setRequired(true);
  partnerForm.addTextItem().setTitle('Total Member Count (Excluding bots - Min 50+)').setRequired(true);

  const partnerTier = partnerForm.addMultipleChoiceItem();
  partnerTier.setTitle('Partnership Type')
    .setChoices([
      partnerTier.createChoice('Standard Cross-Promotion (Ad Swap in #partnerships)'),
      partnerTier.createChoice('Co-Hosted Tournament / SMP Event Collaboration'),
      partnerTier.createChoice('Content Creator / Network Spotlight')
    ]).setRequired(true);

  partnerForm.addParagraphTextItem().setTitle('Your Server Promotional Advertisement Markdown (Will be posted in #🤝┃partnerships)').setRequired(true);

  // Link to dedicated Partner Sheet
  const partnerSheet = SpreadsheetApp.create('🤝 KryloSMP — Partnership Applications (Responses)');
  partnerForm.setDestination(FormApp.DestinationType.SPREADSHEET, partnerSheet.getId());
  console.log('✅ 3. PARTNER FORM: ' + partnerForm.getPublishedUrl());
  console.log('📊 3. PARTNER SHEET: ' + partnerSheet.getUrl());

  console.log('\n🎉 ALL 3 SEPARATE FORMS & 3 SEPARATE SPREADSHEETS CREATED SUCCESSFULLY!');
}
