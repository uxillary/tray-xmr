export const MAX_LOG_BYTES = 200_000;

const DEFINITIONS = {
  cpuReady: { title: 'CPU backend ready', level: 'good', meaning: 'XMRig reports that the CPU workers started. This does not by itself confirm a pool job or accepted share.', next: 'Look for a pool job and later hashrate or share output.' },
  hugePagesFull: { title: 'Huge Pages fully allocated', level: 'good', meaning: 'The CPU backend reports 100% Huge Pages allocation for this launch.', next: 'Continue to watch for worker and pool activity.', href: '/troubleshoot/xmrig-huge-pages/' },
  hugePagesPartial: { title: 'Huge Pages partially allocated', level: 'warning', meaning: 'XMRig reports less than 100% allocation. This is an allocation result, not proof of why it happened.', next: 'Review the Windows Huge Pages guide and check its permission/allocation distinction.', href: '/troubleshoot/xmrig-huge-pages/' },
  msrApplied: { title: 'MSR preset applied', level: 'good', meaning: 'XMRig says it set the register values for a named preset.', next: 'No action is indicated by this line alone.', href: '/troubleshoot/xmrig-msr-error/' },
  msrFailed: { title: 'MSR operation reported a problem', level: 'warning', meaning: 'A recognized MSR message indicates the operation did not complete successfully. The cause is not established here.', next: 'Review the MSR guide; check the full XMRig message and system context.', href: '/troubleshoot/xmrig-msr-error/' },
  shareAccepted: { title: 'Share accepted', level: 'good', meaning: 'The pool accepted a submitted share. This is evidence of a successful submission at that point in the log.', next: 'If you are investigating inconsistent results, compare accepted and rejected counts over time.' },
  shareRejected: { title: 'Share rejected', level: 'warning', meaning: 'The pool rejected a submitted share. The decoder does not interpret the pool-specific reason.', next: 'Review the pool message in your original log and its pool documentation.' },
  poolConnected: { title: 'Pool connection established', level: 'good', meaning: 'XMRig reports a connection to its configured pool endpoint.', next: 'Look for a job and subsequent share results.' },
  poolDisconnect: { title: 'Pool connection lost', level: 'warning', meaning: 'XMRig reports a pool disconnection. The endpoint and detailed reason are kept out of this result.', next: 'Check network availability and the pool endpoint settings.' },
  poolRetry: { title: 'Pool reconnect attempt', level: 'notice', meaning: 'XMRig reports a reconnect attempt. Repeated attempts can indicate an ongoing connection issue.', next: 'Compare this event with later connection-established messages.' },
};

const RULES = [
  { key: 'cpuReady', test: (s) => /\bcpu\s+READY\b/i.test(s) },
  { key: 'hugePagesFull', test: (s) => /\bhuge pages\s+100%(?:\s|$)/i.test(s) },
  { key: 'hugePagesPartial', test: (s) => /\bhuge pages\s+(?:[0-9]{1,2}|0)%(?:\s|$)/i.test(s) },
  { key: 'msrApplied', test: (s) => /\bmsr\s+register values for .{1,40}? preset has been set successfully\b/i.test(s) },
  { key: 'msrFailed', test: (s) => /\bmsr\b.{0,100}\b(?:failed|failure|unable|could not|not supported|error)\b/i.test(s) },
  { key: 'shareAccepted', test: (s) => /\baccepted\s*\(/i.test(s) },
  { key: 'shareRejected', test: (s) => /\brejected\s*\(/i.test(s) },
  { key: 'poolConnected', test: (s) => /\buse pool\b/i.test(s) },
  { key: 'poolDisconnect', test: (s) => /\b(pool|stratum)\b.{0,80}\b(?:connection lost|disconnected|connection closed)\b/i.test(s) },
  { key: 'poolRetry', test: (s) => /\b(pool|stratum)\b.{0,80}\b(?:reconnect|retry|trying to connect)\b/i.test(s) },
];

export function analyzeXMRigLog(input) {
  if (typeof input !== 'string') return { error: 'Paste log text to analyze.' };
  const bytes = new TextEncoder().encode(input).byteLength;
  if (bytes > MAX_LOG_BYTES) return { error: `This log is over the ${Math.round(MAX_LOG_BYTES / 1000)} KB limit. Paste a shorter excerpt.` };
  if (!input.trim()) return { error: 'Paste some XMRig output first.' };

  const clean = input.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
  const lines = clean.split(/\r\n?|\n/);
  const groups = new Map();
  let unknownLines = 0;
  let lineNumber = 0;
  let recognizedLines = 0;
  for (const raw of lines) {
    lineNumber++;
    const line = raw.trim();
    if (!line) continue;
    const normalized = line.replace(/^\[[0-9:. -]+\]\s*/, '').replace(/^\d{4}-\d\d-\d\d[T ][0-9:.+-]+\s*/, '');
    const matches = RULES.filter((rule) => rule.test(normalized));
    if (!matches.length) { unknownLines++; continue; }
    recognizedLines++;
    for (const match of matches) {
      const existing = groups.get(match.key);
      if (existing) { existing.count++; existing.lastOrder = lineNumber; }
      else groups.set(match.key, { ...DEFINITIONS[match.key], count: 1, firstOrder: lineNumber, lastOrder: lineNumber });
    }
  }
  return { signals: [...groups.values()].sort((a, b) => a.firstOrder - b.firstOrder), unknownLines, recognizedLines };
}
