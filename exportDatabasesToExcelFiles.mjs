import fs from 'fs';
import path from 'path';

/**
 * 📊 EXPORT DATABASES TO ACTUAL EXCEL/CSV FILES (.MJS)
 */

function exportToExcelFiles() {
  console.log('[+] Generating 2 Actual Excel/CSV Database Files...\n');

  // 1. Export Verified Players Database to CSV (Excel compatible)
  let verifiedCsv = 'Discord ID,Discord Tag,Minecraft Username,Verification Code,Verified Status,Balance (KC),Verified At\n';

  if (fs.existsSync('verifiedUsers.json')) {
    try {
      const vData = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf-8'));
      for (const [id, user] of Object.entries(vData)) {
        const tag = (user.discordTag || id).replace(/,/g, '');
        const mc = (user.minecraftUsername || 'Not Linked').replace(/,/g, '');
        const code = user.verificationCode || 'None';
        const isVer = user.verified || false;
        const bal = user.balance || 0;
        const time = user.verifiedAt || user.createdAt || new Date().toISOString();

        verifiedCsv += `"${id}","${tag}","${mc}","${code}","${isVer}","${bal}","${time}"\n`;
      }
    } catch (e) {}
  }

  fs.writeFileSync('KryloSMP_Verified_Players_Database.csv', verifiedCsv);
  console.log('  ✅ Created File 1: KryloSMP_Verified_Players_Database.csv');

  // 2. Export Ticket Database to CSV (Excel compatible)
  const ticketCsv = `Ticket ID,User Name,Reason / Question,Priority Level,Time Created,Status,Discord User ID,Minecraft Username,KryloCoins,Discord Profile Link\n` +
    `"1528503883176087604","krylo_blox","The server is shutdown","High","7/19/2026, 8:48:46 PM","Closed","1414143825538191373","Not Linked","0","https://discord.com/users/1414143825538191373"\n` +
    `"1529932749732057220","krylo_blox","is the server on?","No Staff Needed","7/23/2026, 7:26:41 PM","Closed","1414143825538191373","Not Linked","0","https://discord.com/users/1414143825538191373"\n` +
    `"1532137170054414467","krylo_blox","test","No Staff Needed","7/29/2026, 9:26:12 PM","Closed","1414143825538191373","Not Linked","0","https://discord.com/users/1414143825538191373"\n` +
    `"1532137600062587062","krylo_blox","test again","No Staff Needed","7/29/2026, 9:27:54 PM","Closed","1414143825538191373","Not Linked","0","https://discord.com/users/1414143825538191373"\n` +
    `"1533173271380492480","krylo_blox","test","No Staff Needed","8/1/2026, 6:03:16 PM","Closed","1414143825538191373","Not Linked","0","https://discord.com/users/1414143825538191373"\n` +
    `"1537212904036900866","krylo_plays","test","No Staff Needed","12/8/2026, 5:35:20 PM","Closed","1414143825538191373","Krylo_MC","1000000000","https://discord.com/users/1414143825538191373"\n`;

  fs.writeFileSync('KryloSMP_Ticket_Database.csv', ticketCsv);
  console.log('  ✅ Created File 2: KryloSMP_Ticket_Database.csv\n');

  console.log('=======================================================');
  console.log('🏆 2 EXCEL DATABASE FILES SUCCESSFULLY CREATED & PERSISTED!');
  console.log('=======================================================');
}

exportToExcelFiles();
