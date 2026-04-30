const spamTracker = new Map();

module.exports = async (message) => {
  const id = message.author.id;

  if (!spamTracker.has(id)) spamTracker.set(id, []);

  const now = Date.now();
  const msgs = spamTracker.get(id).filter(t => now - t < 5000);

  msgs.push(now);
  spamTracker.set(id, msgs);

  if (msgs.length >= 5) {
    await message.delete().catch(() => {});
    await message.member.timeout(5000).catch(() => {});
  }
};