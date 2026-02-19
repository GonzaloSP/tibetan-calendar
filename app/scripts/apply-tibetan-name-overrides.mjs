import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CAL_PATH = path.join(ROOT, 'shambhala_calendar.json');

const OVERRIDES = {
  'First Dodrubchen Rinpoche': 'འཇིགས་མེད་ཕྲིན་ལས་འོད་ཟེར་',
  'Jamyang Shepa': 'འཇམ་དབྱངས་ཞེ་པའི་རྡོ་རྗེ་',
  'Jetsun Drakpa Gyaltsen': 'རྗེ་བཙུན་གྲགས་པ་རྒྱལ་མཚན་',
  'Terton Mingyur Dorje': 'གནམ་ཆོས་མི་འགྱུར་རྡོ་རྗེ་',
  'Jamyang Khyentse Chokyi Lodro': 'འཇམ་དབྱངས་མཁྱེན་བརྩེ་ཆོས་ཀྱི་བློ་གྲོས་',
  'Third Karmapa': 'རང་བྱུང་རྡོ་རྗེ་',
  'Pakmodrukpa': 'ཕག་མོ་གྲུ་པ་',
  'Rigdzin Kumarazda': 'རིག་འཛིན་ཀུ་མཱ་རཱ་ཛ་',
  'Kyabje Thinley Norbu Rinpoche': 'གདུང་སྲས་ཕྲིན་ལས་ནོར་བུ་',
  'Jigme Phuntsok Rinpoche': 'མཁན་ཆེན་འཇིགས་མེད་ཕུན་ཚོགས་འབྱུང་གནས་',
  'Kyabje Dudjom Rinpoche': 'བདུད་འཇོམས་འཇིགས་བྲལ་ཡེ་ཤེས་རྡོ་རྗེ་',
  'Chogyal Phakpa': 'ཆོས་རྒྱལ་འཕགས་པ་',
  'Fourth Dodrubchen Rinpoche': 'རྡོ་གྲུབ་ཆེན་རིན་པོ་ཆེ།'
};

function teacherNameFromEntry(e) {
  const t = String(e?.titleEn || e?.event?.title || '').trim();
  return t
    .replace(/^Anniversary of\s+(the\s+)?/i, '')
    .replace(/^Anniversay of\s+/i, '')
    .replace(/^The Birth of\s+/i, '')
    .replace(/\(Lunar Calendar\)/gi, '')
    .trim();
}

function main() {
  const cal = JSON.parse(fs.readFileSync(CAL_PATH, 'utf-8'));
  let updated = 0;

  for (const e of cal.entries || []) {
    if (!e?.flags?.teacherAnniversary) continue;
    if (e.tibetanName) continue;

    const name = teacherNameFromEntry(e);
    const tib = OVERRIDES[name];
    if (!tib) continue;

    e.tibetanName = tib;
    e.tibetanNameSource = 'manual_override';
    updated++;
  }

  cal.source = { ...(cal.source || {}), tibetanNamesOverridesAt: new Date().toISOString() };
  fs.writeFileSync(CAL_PATH, JSON.stringify(cal, null, 2), 'utf-8');
  console.log(`Applied tibetanName overrides to ${updated} entries.`);
}

main();
