import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-code-chatbot/api/chat.js';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `      } catch (err) {
        console.error("Failed to confirm code in DB:", err);
      }
    }
  }`;

const replaceStr = `      } catch (err) {
        console.error("Failed to confirm code in DB:", err);
        res.status(200).json({ ok: false, error: 'Failed to access verification database' });
        return;
      }
    }
    res.status(200).json({ ok: false, error: 'Invalid verification code' });
    return;
  }`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 API/CHAT.JS VERIFICATION FIX APPLIED!]');
