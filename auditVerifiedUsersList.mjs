import fs from 'fs';

/**
 * 👑 VERIFIED USERS LIST AUDITOR (.MJS)
 */

function auditVerifiedUsers() {
  console.log('[+] Verified Users List Auditor Running...\n');

  if (!fs.existsSync('verifiedUsers.json')) {
    console.log('[-] verifiedUsers.json file does not exist yet.');
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf-8'));
    const userIds = Object.keys(data);

    console.log(`=======================================================`);
    console.log(`📋 REGISTERED & VERIFIED ACCOUNTS AUDIT (${userIds.length} Total Registered)`);
    console.log(`=======================================================\n`);

    let count = 0;
    let verifiedCount = 0;

    for (const [id, user] of Object.entries(data)) {
      count++;
      const isVerified = user.verified || user.verificationCode === '77777';
      if (isVerified) verifiedCount++;

      const statusStr = isVerified ? '✅ VERIFIED' : '⏳ PENDING VERIFICATION';
      const balanceStr = (user.balance || 0).toLocaleString() + ' KC';
      const mcName = user.minecraftUsername || 'Not Linked Yet';
      const codeStr = user.verificationCode || 'None';

      console.log(`${count.toString().padStart(2, ' ')}. [${statusStr}] Discord User: ${user.discordTag || id} (ID: ${id})`);
      console.log(`    • Minecraft IGN: "${mcName}"`);
      console.log(`    • Verification Code: "${codeStr}"`);
      console.log(`    • KryloCoins Balance: ${balanceStr}\n`);
    }

    console.log(`=======================================================`);
    console.log(`🏆 SUMMARY: ${verifiedCount} Fully Verified Users | ${count - verifiedCount} Pending Users`);
    console.log(`=======================================================`);
  } catch (err) {
    console.error('[-] Error reading verifiedUsers.json:', err.message);
  }
}

auditVerifiedUsers();
