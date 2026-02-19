import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CAL_PATH = path.join(ROOT, 'shambhala_calendar.json');
const SOURCES_PATH = path.join(ROOT, 'scripts', 'teacher_bio_sources.json');

// Hand-written bios in Spanish. Keep them short (1 sentence, max 2).
const BIO_ES = {
  'Tulku Thondup Rinpoche': 'Maestro y erudito nyingma del linaje de Dodrupchen, conocido por sus enseñanzas claras y sus libros de práctica y meditación para el público moderno.',
  'Khenpo Shenga': 'Erudito clave del movimiento Rimé; renovó el estudio monástico en el este del Tíbet y estableció un currículo centrado en los grandes tratados clásicos de India.',
  'Rigdzin Kunzang Sherab': 'Primer titular del trono de Palyul y fundador de su monasterio; figura central en el establecimiento y transmisión del linaje Palyul (Nyingma).',
  'First Dodrubchen Rinpoche': 'Gran maestro nyingma del linaje de Dodrupchen, asociado a la transmisión de Dzogchen y a la consolidación de la tradición en torno a su monasterio.',
  'Milarepa': 'Yogui y poeta del linaje Kagyu, célebre por sus “cantos” de realización y por la transmisión de instrucciones de meditación como el mahamudra.',
  'Marpa': 'Traductor (lotsawa) y maestro tibetano que trajo y transmitió enseñanzas vajrayana de India (especialmente de Nāropa), fundador temprano del linaje Kagyu en el Tíbet.',
  'Jamyang Khyentse Wangpo': 'Maestro rimé del siglo XIX, gran tertön y compilador; impulsó una transmisión no sectaria reuniendo y preservando linajes y enseñanzas de múltiples escuelas.',
  'Penor Rinpoche': '11.º titular del trono de Palyul (Nyingma); maestro influyente que expandió centros y formación monástica, preservando la transmisión del linaje Palyul.',
  'Terdak Lingpa': 'Revelador de tesoros (tertön) y fundador de Mindrolling, uno de los grandes monasterios nyingma; figura decisiva para el desarrollo de ritual, liturgia y enseñanza en Nyingma.',
  'Jamyang Shepa': 'Erudito gelug y fundador/figura principal de Labrang; reconocido por sus aportes al estudio filosófico y la consolidación de instituciones monásticas en Amdo.',
  'Jetsun Drakpa Gyaltsen': 'Maestro Sakya y uno de los “Cinco Fundadores”; influyó en la consolidación doctrinal de Sakya y en la transmisión de sus ciclos de enseñanza.',
  'Gyatrul Rinpoche': 'Maestro nyingma asociado a la difusión de Dzogchen en Occidente; conocido por su enseñanza directa y por sostener linajes de práctica y retiro.',
  'Do Khyentse': 'Maestro nyingma del siglo XIX, ligado al movimiento Rimé; reconocido por su realización y su influencia como maestro itinerante y no convencional.',
  'Taranatha': 'Erudito y maestro jonang, célebre por sus historias y textos; tuvo un papel crucial en la preservación de la tradición Jonang y de enseñanzas de Kalachakra.',
  'Kalu Rinpoche': 'Maestro kagyu del linaje Shangpa/Karma Kagyu, conocido por introducir retiros de tres años y por la difusión internacional de práctica y enseñanza.',
  'Terton Mingyur Dorje': 'Tertön nyingma; reveló ciclos de práctica y transmitió linajes de tesoros que nutrieron la tradición, especialmente en Kham.',
  'Khandro Tsering Chodron': 'Practicante y referente del linaje nyingma, reconocida por su vida de práctica y por apoyar la preservación y transmisión de enseñanzas en tiempos difíciles.',
  'Fifth Dalai Lama': 'Líder religioso y político que consolidó el gobierno del Ganden Phodrang; importante autor y figura de síntesis en tradición gelug y el budismo tibetano en general.',
  'Sangye Lingpa': 'Tertön nyingma famoso por revelar el ciclo Lama Gongdü y otros tesoros; su obra marcó la transmisión de prácticas ligadas a Guru Rinpoché.',
  'Thrangu Rinpoche': 'Maestro y erudito kagyu, conocido por sus comentarios accesibles sobre mahamudra y filosofía budista, y por su labor educativa contemporánea.',
  'Patrul Rinpoche': 'Maestro nyingma y autor de “Las palabras de mi maestro perfecto”; figura central en la enseñanza de lamrim nyingma y en la transmisión de Dzogchen en la era Rimé.',
  'Virupa': 'Mahāsiddha indio asociado a la transmisión de Lamdré en Sakya; una de las figuras clave de los linajes vajrayana indios que llegaron al Tíbet.',
  'Jigten Sumgon': 'Fundador de Drikung Kagyu, conocido por su énfasis en disciplina, compasión y práctica; estableció un linaje con gran influencia en Kagyu.',
  'Mipham Rinpoche': 'Gran erudito nyingma del movimiento Rimé; autor prolífico de textos filosóficos y exegéticos que siguen siendo centrales en el estudio y la práctica.',
  'Chogyur Lingpa': 'Tertön nyingma del siglo XIX, revelador de numerosos tesoros (terma) ampliamente practicados; figura esencial para la revitalización de ciclos de Guru Rinpoché.',
  'Jamyang Khyentse Chokyi Lodro': 'Maestro rimé del siglo XX, gran sostenedor de múltiples linajes; conocido por su influencia como maestro de maestros y por preservar transmisiones clave en el exilio.',
  'Shechen Gyaltsap': 'Maestro nyingma asociado al monasterio Shechen; conocido por sostener la transmisión y formación monástica dentro de la tradición.',
  'Khenpo Ngakchung': 'Khenpo (abad/erudito) nyingma recordado por su enseñanza y transmisión de estudios y práctica en el este del Tíbet.',
  'Third Karmapa': '3.º Karmapa del linaje Karma Kagyu; figura temprana en el desarrollo institucional y la transmisión del linaje Kagyu.',
  'Gampopa': 'Discípulo principal de Milarepa y sistematizador del Kagyu; integró enseñanzas de Kadam y mahamudra, dando forma a la tradición monástica Kagyu.',
  'Pema Karpo': 'Gran maestro drukpa kagyu; reconocido por su erudición, comentarios y por consolidar la tradición Drukpa con una obra literaria extensa.',
  'Pakmodrukpa': 'Maestro kagyu del siglo XII, discípulo de Gampopa; su linaje dio origen a varias subescuelas kagyu influyentes en el Tíbet.',
  'Dilgo Khyenytse Rinpoche': 'Maestro nyingma y pilar del movimiento Rimé en el siglo XX; autor y maestro de Dzogchen, clave en la preservación y difusión moderna de linajes.',
  'Rigdzin Kumarazda': 'Maestro dzogchen (Nyingma), conocido por su influencia en discípulos como Patrul Rinpoché y por transmitir instrucciones esenciales de Dzogchen.',
  'Jigme Lingpa': 'Tertön y maestro nyingma, revelador del Longchen Nyingtik; figura fundamental para la práctica dzogchen y la continuidad de ese linaje.',
  'Khyungpo Nalkdjor': 'Yogui y fundador del linaje Shangpa Kagyu; transmitió enseñanzas recibidas en India (incl. Niguma), estableciendo una línea de práctica distintiva.',
  'Atisha': 'Maestro indio que influyó decisivamente en el budismo tibetano; su obra y enseñanza inspiraron el enfoque kadam y el desarrollo del lamrim.',
  'Tsongkhapa': 'Fundador de la escuela Gelug; gran reformador y erudito, autor de obras fundamentales sobre ética, filosofía madhyamaka y práctica gradual.',
  'Kyabje Thinley Norbu Rinpoche': 'Maestro nyingma (linaje Dudjom), autor de textos de práctica y visión; conocido por su enseñanza de Dzogchen y el mantenimiento de transmisión familiar/linaje.',
  'Sonam Tsemo': 'Maestro Sakya y uno de los “Cinco Fundadores”; contribuyó a la formación doctrinal y al establecimiento institucional temprano de Sakya.',
  'Sakya Pandita': 'Gran erudito sakya, autor y diplomático; figura clave en lógica y filosofía, y en la consolidación del prestigio intelectual de Sakya.',
  'Jigme Phuntsok Rinpoche': 'Maestro nyingma y fundador de Larung Gar; impulsó un renacimiento contemporáneo del estudio y la práctica, formando a miles de practicantes.',
  'Kyabje Dudjom Rinpoche': 'Cabeza de la escuela Nyingma en el siglo XX; gran tertön y autor de una influyente historia de la tradición Nyingma, además de textos y prácticas.',
  'Chatral Rinpoche': 'Maestro nyingma/dzogchen conocido por su vida de retiro y ética estricta; influyente transmisor de Dzogchen y prácticas de Guru Rinpoché.',
  'Chogyal Phakpa': 'Maestro Sakya del siglo XIII; figura clave en la relación Sakya–Imperio Yuan y en la difusión institucional del budismo tibetano.',
  'Fourth Dodrubchen Rinpoche': 'Maestro nyingma del linaje de Dodrupchen; reconocido por su erudición y su papel en sostener y transmitir prácticas y estudios del linaje.'
};

function teacherNameFromEntry(e) {
  const t = String(e?.titleEn || e?.event?.title || '').trim();
  return t
    .replace(/^Anniversary of\s+(the\s+)?/i, '')
    .replace(/\(Lunar Calendar\)/gi, '')
    .trim();
}

function main() {
  const cal = JSON.parse(fs.readFileSync(CAL_PATH, 'utf-8'));
  const sources = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8'));

  let updated = 0;
  let missing = 0;

  for (const e of cal.entries || []) {
    if (!e?.flags?.teacherAnniversary) continue;

    const name = teacherNameFromEntry(e);
    const bioEs = BIO_ES[name];
    const rec = sources[name] || sources[`the ${name}`] || null;
    const urls = rec ? [...new Set((rec.candidates || []).map((c) => c.url).filter(Boolean))].slice(0, 2) : [];

    if (!bioEs) {
      missing++;
      continue;
    }

    e.bio = {
      es: bioEs,
      sources: urls,
    };
    updated++;
  }

  cal.source = { ...(cal.source || {}), biosOverriddenAt: new Date().toISOString() };
  fs.writeFileSync(CAL_PATH, JSON.stringify(cal, null, 2), 'utf-8');

  console.log(`Applied hand-written bios to ${updated} entries. Missing bios: ${missing}.`);
}

main();
