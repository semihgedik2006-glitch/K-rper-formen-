/* ══ FINDEWEGE AM RECHNER (Runde 228) ═══════════════════════════════════
   Derselbe Durchlauf wie test-findewege.js, nur bei 1440 px. Getrennt,
   weil beide Geräte zusammen über der 240-s-Grenze von tests/alle.sh
   lagen – aufgeteilt, nicht gelockert (wie test-stempelseite /
   test-zeiten-verwaltung in Runde 215).
   ══════════════════════════════════════════════════════════════════ */
process.env.GERAET = 'rechner';
require('./test-findewege.js');
