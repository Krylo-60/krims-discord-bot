// ═══════════════════════════════════════════════════════════════════════════════
// 👑 KryloSMP 1-Click Google Forms Generator (Google Apps Script)
// ═══════════════════════════════════════════════════════════════════════════════
// HOW TO RUN IN 30 SECONDS:
// 1. Go to https://script.google.com/home/start (or https://script.new)
// 2. Click "New project"
// 3. Paste this ENTIRE code into the editor (replace everything)
// 4. Click "Run" (top toolbar)
// 5. It will automatically create all 3 Google Forms in your Google Drive and print the links!
// ═══════════════════════════════════════════════════════════════════════════════

function createAllKryloSMPForms() {
  console.log("🚀 Starting KryloSMP Google Forms Automated Creation...");

  // 1. 🛡️ STAFF APPLICATION FORM
  const staffForm = FormApp.create('KryloSMP — Staff Application Form');
  staffForm.setDescription('Official KryloSMP Staff Application Form. Please answer all questions honestly and with detail. Low-effort or troll applications will be denied.');
  staffForm.setCollectEmail(true);

  // Basic Information
  staffForm.addTextItem().setTitle('Discord Username & Tag (e.g. krylo_official)').setRequired(true);
  staffForm.addTextItem().setTitle('Minecraft In-Game Name (IGN)').setRequired(true);
  staffForm.addTextItem().setTitle('Your Age (Must be 13+)').setRequired(true);
  staffForm.addTextItem().setTitle('Timezone / Region (e.g. EST / UTC-5 or IST / UTC+5:30)').setRequired(true);

  // Position
  const positionItem = staffForm.addMultipleChoiceItem();
  positionItem.setTitle('Position Applying For')
    .setChoices([
      positionItem.createChoice('🛡️ Moderator'),
      positionItem.createChoice('⚡ Admin'),
      positionItem.createChoice('🤝 Community Helper'),
      positionItem.createChoice('🏗️ Builder / Developer')
    ])
    .setRequired(true);

  // Availability
  const availItem = staffForm.addMultipleChoiceItem();
  availItem.setTitle('Weekly Availability (Hours per week)')
    .setChoices([
      availItem.createChoice('5 - 10 hours per week'),
      availItem.createChoice('10 - 20 hours per week'),
      availItem.createChoice('20+ hours per week (Highly Active)')
    ])
    .setRequired(true);

  // Experience & Scenarios
  staffForm.addParagraphTextItem().setTitle('Previous Staff & Moderation Experience (Servers, player counts, roles, reasons for leaving)').setRequired(true);
  staffForm.addParagraphTextItem().setTitle('Scenario 1: A player accuses someone of using X-ray or KillAura, but there is no staff online with video evidence. How do you handle it?').setRequired(true);
  staffForm.addParagraphTextItem().setTitle('Scenario 2: Two players are arguing aggressively in #general-chat using toxic language. What steps do you take?').setRequired(true);
  staffForm.addParagraphTextItem().setTitle('Scenario 3: A close friend of yours violates server rules (e.g. griefing). How do you treat them?').setRequired(true);
  staffForm.addParagraphTextItem().setTitle('Why should we choose YOU over other applicants?').setRequired(true);

  console.log('✅ Staff Application Form Created: ' + staffForm.getPublishedUrl());
  console.log('✏️ Staff Edit URL: ' + staffForm.getEditUrl());

  // 2. 🤝 PARTNERSHIP APPLICATION FORM
  const partnerForm = FormApp.create('KryloSMP — Partnership Application Form');
  partnerForm.setDescription('Official KryloSMP Partnership Application. We partner with active Minecraft networks, gaming communities, and content creators.');
  partnerForm.setCollectEmail(true);

  partnerForm.addTextItem().setTitle('Your Discord Username & Server Role (e.g. Owner / Co-Owner)').setRequired(true);
  partnerForm.addTextItem().setTitle('Server / Community Name').setRequired(true);
  partnerForm.addTextItem().setTitle('Permanent Discord Server Invite Link').setRequired(true);
  partnerForm.addTextItem().setTitle('Total Member Count (Excluding bots - Min 50+)').setRequired(true);

  const typeItem = partnerForm.addMultipleChoiceItem();
  typeItem.setTitle('Partnership Type Requested')
    .setChoices([
      typeItem.createChoice('Standard Cross-Promotion (Ad Swap)'),
      typeItem.createChoice('Joint Event / Tournament Collaboration'),
      typeItem.createChoice('Content Creator Spotlight')
    ])
    .setRequired(true);

  partnerForm.addParagraphTextItem().setTitle('Server Promotional Advertisement Text (Will be posted in our #partnerships channel)').setRequired(true);

  console.log('✅ Partnership Form Created: ' + partnerForm.getPublishedUrl());
  console.log('✏️ Partnership Edit URL: ' + partnerForm.getEditUrl());

  // 3. 🎬 CREATOR APPLICATION FORM
  const creatorForm = FormApp.create('KryloSMP — Content Creator & Media Application');
  creatorForm.setDescription('Apply for the Content Creator rank on KryloSMP! Get custom prefixes, shop rewards, and server promotion.');
  creatorForm.setCollectEmail(true);

  creatorForm.addTextItem().setTitle('Discord Username & In-Game Name').setRequired(true);
  
  const platItem = staffForm.addCheckboxItem();
  platItem.setTitle('Content Creation Platform(s)')
    .setChoices([
      platItem.createChoice('YouTube'),
      platItem.createChoice('TikTok'),
      platItem.createChoice('Twitch'),
      platItem.createChoice('Kick')
    ]);

  creatorForm.addTextItem().setTitle('Channel / Profile URL').setRequired(true);
  creatorForm.addTextItem().setTitle('Current Follower / Subscriber Count').setRequired(true);
  creatorForm.addTextItem().setTitle('Link to at least 1 video/stream showcasing KryloSMP (IP: KryloSmp.play.hosting)').setRequired(true);

  console.log('✅ Creator Form Created: ' + creatorForm.getPublishedUrl());
  console.log('✏️ Creator Edit URL: ' + creatorForm.getEditUrl());

  console.log('\n🎉 ALL 3 GOOGLE FORMS AUTOMATICALLY CREATED IN YOUR GOOGLE DRIVE!');
}
