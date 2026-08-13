with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

target_str = """  // Automatic Birthday Scheduler for July 24th (Cloud hosting safe timestamp: 1784865600000)
  let birthdayAnnouncedYear = 0;
  setInterval(async () => {
    const targetTimestamp = 1784865600000; // July 24th, 2026 00:00:00 EDT
    const currentYear = new Date().getFullYear();
      if (Date.now() >= targetTimestamp && birthdayAnnouncedYear !== currentYear) {
        birthdayAnnouncedYear = currentYear;"""

replacement_str = """  // Automatic Birthday Scheduler for July 24th (Only triggers on exact date: July 24th)
  let birthdayAnnouncedYear = new Date().getFullYear(); // Safe initialization to prevent retroactive triggers
  setInterval(async () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const isJuly24 = (now.getMonth() === 6 && now.getDate() === 24); // Month 6 = July (0-indexed)
    if (isJuly24 && birthdayAnnouncedYear !== currentYear) {
      birthdayAnnouncedYear = currentYear;"""

if target_str in code:
    code = code.replace(target_str, replacement_str)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: Updated birthday daemon in index.js!")
else:
    print("ERROR: Target string not found!")
