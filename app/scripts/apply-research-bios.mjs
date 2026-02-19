import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CAL_PATH = path.join(ROOT, 'shambhala_calendar.json');

// Paste of curated bios (Spanish LATAM) + sources (non-Shambhala).
const BIOS = {
  "Tulku Thondup Rinpoche": {
    "bioEs": "Maestro y erudito nyingma (1939–2023), reconocido como tulku y conocido por su labor de investigación y traducción, además de acercar enseñanzas como Dzogchen y la tradición terma a practicantes en Occidente.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Tulku_Thondup_Rinpoche"]
  },
  "Khenpo Shenga": {
    "bioEs": "Erudito clave del movimiento Rimé (1871–1927) que revitalizó el estudio monástico en el este del Tíbet: fundó shedras y reformó el currículo con énfasis en los tratados clásicos de India.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Khenpo_Shenga"]
  },
  "Rigdzin Kunzang Sherab": {
    "bioEs": "Maestro nyingma (1636–1699) y primer titular del trono de Palyul; figura fundacional de la tradición Palyul en Kham.",
    "urls": [
      "https://www.rigpawiki.org/index.php?title=Rigdzin_Kunzang_Sherab",
      "https://rywiki.tsadra.org/index.php/Rigdzin_Kunzang_Sherab"
    ]
  },
  "First Dodrubchen Rinpoche": {
    "bioEs": "Dodrupchen Jikmé Trinlé Özer (1745–1821), gran maestro nyingma y tertön; principal discípulo y portador de linaje de Jikmé Lingpa, y difusor del Nyingtik (Longchen Nyingtik) en Amdo y más allá.",
    "urls": ["https://www.rigpawiki.org/index.php?title=First_Dodrupchen_Rinpoche"]
  },
  "Milarepa": {
    "bioEs": "Yogui y poeta realizado del linaje kagyü (c. 1040–1123), célebre por su vida de ascetismo y sus cantos de realización; discípulo principal de Marpa e inspiración central del Kagyü.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Milarepa"]
  },
  "Marpa": {
    "bioEs": "Marpa Lotsawa (1012–1097), gran traductor tibetano que trajo y tradujo tantras desde India; maestro de Milarepa y pilar temprano del linaje Kagyü.",
    "urls": [
      "https://www.rigpawiki.org/index.php?title=Marpa",
      "https://treasuryoflives.org/biographies/view/Marpa/TBRC_p2636"
    ]
  },
  "Jamyang Khyentse Wangpo": {
    "bioEs": "Jamyang Khyentsé Wangpo (1820–1892), gran tertön y motor del movimiento Rimé; maestro enciclopédico que transmitió y sintetizó linajes de todas las escuelas tibetanas.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Jamyang_Khyentse_Wangpo"]
  },
  "Penor Rinpoche": {
    "bioEs": "H. H. Penor Rinpoche (1932–2009), 11.º titular del trono de Palyul (Nyingma) y líder supremo nyingma (1993–2001); impulsó la educación monástica y fundó/expandió Namdroling.",
    "urls": [
      "https://www.rigpawiki.org/index.php?title=Penor_Rinpoche",
      "https://en.wikipedia.org/wiki/Penor_Rinpoche"
    ]
  },
  "Terdak Lingpa": {
    "bioEs": "Terdak Lingpa (1646–1714), gran tertön nyingma y fundador de Mindroling; pieza clave en la transmisión del Nyingma Kama y en grandes compilaciones de terma.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Terdak_Lingpa"]
  },
  "Jamyang Shepa": {
    "bioEs": "Jamyang Zhepai Dorje (primer Jamyang Zhepa, 1648–1721), destacado erudito gelug y autor de obras curriculares; figura central en Labrang y en la tradición de debate filosófico gelug.",
    "urls": ["https://treasuryoflives.org/biographies/view/Jamyang-Zhepai-Dorje/6646"]
  },
  "Jetsun Drakpa Gyaltsen": {
    "bioEs": "Jetsün Drakpa Gyeltsen (1147–1216), tercer patriarca Sakya; maestro y autor influyente en la consolidación doctrinal temprana de la escuela Sakya.",
    "urls": [
      "https://treasuryoflives.org/biographies/view/Drakpa-Gyeltsen/TBRC_P1614",
      "https://en.wikipedia.org/wiki/Jetsun_Dragpa_Gyaltsen"
    ]
  },
  "Gyatrul Rinpoche": {
    "bioEs": "Lama nyingma de Palyul (1925–2023) que, tras el exilio, enseñó extensamente en Norteamérica y fundó centros; conocido por transmitir prácticas y comentarios (por ejemplo, sobre bardos y etapa de generación).",
    "urls": ["https://www.rigpawiki.org/index.php?title=Gyatrul_Rinpoche"]
  },
  "Do Khyentse": {
    "bioEs": "Do Khyentse Yeshe Dorje (1800–1866), emanación vinculada a Jikmé Lingpa; maestro tántrico no convencional célebre por instrucciones directas sobre la naturaleza de la mente (incluida su influencia en Patrul Rinpoche).",
    "urls": ["https://www.rigpawiki.org/index.php?title=Do_Khyentse"]
  },
  "Taranatha": {
    "bioEs": "Jetsün Tāranātha (1575–1634), maestro jonang (también ligado a Shangpa Kagyü) y autor prolífico; muy conocido por su Historia del budismo en India y por obras tántricas.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Taranatha"]
  },
  "Kalu Rinpoche": {
    "bioEs": "Kalu Rinpoche (1905–1989), gran maestro karma kagyü y shangpa kagyü; difundió ampliamente el Dharma en Occidente y promovió grandes proyectos de traducción (por ejemplo, Treasury of Knowledge).",
    "urls": ["https://www.rigpawiki.org/index.php?title=Kalu_Rinpoche"]
  },
  "Terton Mingyur Dorje": {
    "bioEs": "Tertön Mingyur Dorjé (1645–1667), revelador del ciclo de termas Namchö, fundamental en la tradición Palyul (Nyingma).",
    "urls": ["https://www.rigpawiki.org/index.php?title=Tert%C3%B6n_Mingyur_Dorje"]
  },
  "Khandro Tsering Chodron": {
    "bioEs": "Khandro Tsering Chödrön (1929–2011), practicante destacada y consorte espiritual de Jamyang Khyentse Chökyi Lodrö; considerada una de las grandes yoguinis tibetanas contemporáneas.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Khandro_Tsering_Chodron"]
  },
  "Fifth Dalai Lama": {
    "bioEs": "Ngawang Lobsang Gyatso (1617–1682), el 5.º Dalái Lama: líder crucial en la historia tibetana (consolidación política y religiosa), constructor del Potala y autor prolífico con fuerte vínculo con linajes nyingma/terma.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Fifth_Dalai_Lama"]
  },
  "Sangye Lingpa": {
    "bioEs": "Sangye Lingpa (1340–1396), tertön nyingma que reveló el ciclo Lama Gongdü y textos históricos como el Kathang Sertreng (Crónicas de la Guirnalda Dorada).",
    "urls": ["https://www.rigpawiki.org/index.php?title=Sangye_Lingpa"]
  },
  "Thrangu Rinpoche": {
    "bioEs": "Khenchen Thrangu Rinpoche (1933–2023), gran maestro karma kagyü, erudito y maestro de meditación (mahamudra); enseñó extensamente y fue tutor de alto nivel (incluido el 17.º Karmapa).",
    "urls": ["https://www.rigpawiki.org/index.php?title=Thrangu_Rinpoche"]
  },
  "Patrul Rinpoche": {
    "bioEs": "Dza Patrul Rinpoche (1808–1887), maestro nyingma/dzogchen y autor de enorme influencia; su obra Las palabras de mi maestro perfecto es un clásico del ngöndro del Longchen Nyingtik.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Patrul_Rinpoche"]
  },
  "Virupa": {
    "bioEs": "Mahasiddha indio Virūpa, figura clave para la tradición Sakya: fuente principal del Lamdré y referente de realización tántrica en India.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Virupa"]
  },
  "Jigten Sumgon": {
    "bioEs": "Jigten Sumgön (1143–1217), fundador del Drikung Kagyu; conocido por sistematizar enseñanzas de mahamudra y por compendios como el Gongchig (dichos/una sola intención).",
    "urls": ["https://en.wikipedia.org/wiki/Jigten_Sumg%C3%B6n"]
  },
  "Mipham Rinpoche": {
    "bioEs": "Ju Mipham (1846–1912), gran erudito y maestro nyingma del Rimé; autor monumental (decenas de volúmenes) que revitalizó el estudio y la práctica de Dzogchen y filosofía.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Mipham_Rinpoche"]
  },
  "Chogyur Lingpa": {
    "bioEs": "Chokgyur Dechen Lingpa (1829–1870), uno de los grandes tertön del siglo XIX; sus revelaciones (Chokling Tersar) incluyen ciclos muy practicados como Tukdrup Barché Kunsel.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Chokgyur_Lingpa"]
  },
  "Jamyang Khyentse Chokyi Lodro": {
    "bioEs": "Jamyang Khyentse Chökyi Lodrö (1893–1959), figura mayor del Rimé del siglo XX; maestro de múltiples linajes y formador de grandes lamas contemporáneos.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Jamyang_Khyentse_Ch%C3%B6kyi_Lodr%C3%B6"]
  },
  "Shechen Gyaltsap": {
    "bioEs": "Shechen Gyaltsab Gyurme Pema Namgyal (1871–1926), regente (gyaltsab) de Shechen y maestro raíz de Dilgo Khyentse; referente de transmisión kama/terma y de formación monástica nyingma.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Shechen_Gyaltsap_Gyurme_Pema_Namgyal"]
  },
  "Khenpo Ngakchung": {
    "bioEs": "Khenpo Ngawang Palzang (1879–1941), influyente maestro dzogchen; conocido por su guía oral y comentarios a Las palabras de mi maestro perfecto (linaje Patrul–Nyoshul).",
    "urls": ["https://www.rigpawiki.org/index.php?title=Khenpo_Ngakchung"]
  },
  "Third Karmapa": {
    "bioEs": "Rangjung Dorje (1284–1339), 3.º Karmapa: maestro clave del Karma Kagyu, asociado a enseñanzas de buda-naturaleza y a desarrollos de calendario/astrología en la tradición de Tsurphu.",
    "urls": ["https://en.wikipedia.org/wiki/Rangjung_Dorje,_3rd_Karmapa_Lama"]
  },
  "Gampopa": {
    "bioEs": "Gampopa Sönam Rinchen (1079–1153/1159), principal discípulo de Milarepa; integró Kadam y mahamudra, y su Ornamento de la liberación es un clásico fundacional del Kagyü.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Gampopa"]
  },
  "Pema Karpo": {
    "bioEs": "Künkhyen Pema Karpo (1527–1592), 4.º Gyalwang Drukpa; gran erudito y sistematizador del Drukpa Kagyu, autor de extensas obras sobre historia, sutra y mahamudra.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Pema_Karpo"]
  },
  "Pakmodrukpa": {
    "bioEs": "Pakmodrupa (Phagmo Drupa) Dorje Gyelpo (1110–1170), discípulo de Gampopa; su monasterio Densatil fue semillero de muchas subtradiciones kagyü (incluida Drikung).",
    "urls": ["https://treasuryoflives.org/biographies/view/Pakmodrupa/TBRC_p127"]
  },
  "Dilgo Khyenytse Rinpoche": {
    "bioEs": "Dilgo Khyentse Rinpoche (1910–1991), uno de los grandes maestros dzogchen del siglo XX y figura rimé; transmitió linajes de todas las escuelas y fue maestro de numerosos lamas actuales.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Dilgo_Khyentse_Rinpoche"]
  },
  "Rigdzin Kumarazda": {
    "bioEs": "Rigdzin Kumaradza (1266–1343), maestro nyingma y principal maestro de Longchenpa; figura crucial en la transmisión de enseñanzas de Dzogchen/nyingtik.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Rigdzin_Kumaradza"]
  },
  "Jigme Lingpa": {
    "bioEs": "Jikmé Lingpa (1730–1798), gran tertön nyingma y revelador del Longchen Nyingtik; impulsó la edición del Nyingma Gyübum y dejó un vasto legado textual.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Jigme_Lingpa"]
  },
  "Khyungpo Nalkdjor": {
    "bioEs": "Khyungpo Naljor (c. siglo XI–XII), fundador del Shangpa Kagyü; viajó repetidamente a India y trajo linajes de Niguma y otros mahasiddhas.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Khyungpo_Naljor"]
  },
  "Atisha": {
    "bioEs": "Atiśa Dīpaṃkara Śrījñāna (982–1054), gran maestro indio; su Lámpara para el camino es fundacional del lamrim y su actividad en Tíbet impulsó la escuela kadampa.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Atisha"]
  },
  "Tsongkhapa": {
    "bioEs": "Je Tsongkhapa (1357–1419), fundador de la escuela Gelug; reformador monástico y gran autor filosófico y tántrico, con énfasis en disciplina y estudio sistemático.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Tsongkhapa"]
  },
  "Kyabje Thinley Norbu Rinpoche": {
    "bioEs": "Thinley Norbu Rinpoche (1931–2011), importante maestro nyingma y portador principal del linaje Dudjom Tersar; autor de varios libros en inglés y maestro activo en Occidente.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Thinley_Norbu_Rinpoche"]
  },
  "Sonam Tsemo": {
    "bioEs": "Sönam Tsemo (1142–1182), uno de los cinco patriarcas Sakya; autor influyente (incluido un comentario al Bodhicharyāvatāra) en la consolidación doctrinal temprana de Sakya.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Sonam_Tsemo"]
  },
  "Sakya Pandita": {
    "bioEs": "Sakya Paṇḍita Künga Gyeltsen (1182–1251), gran erudito sakya (uno de los Tres Mañjughoṣas); autor de obras clásicas sobre votos, lógica y ética (por ejemplo, Sakya Legshé).",
    "urls": ["https://www.rigpawiki.org/index.php?title=Sakya_Pandita"]
  },
  "Jigme Phuntsok Rinpoche": {
    "bioEs": "Khenchen Jigme Phuntsok (1933–2004), maestro nyingma y figura central de Larung Gar; conocido por revitalizar el estudio y la práctica (incluido Dzogchen) y por su enorme impacto contemporáneo.",
    "urls": ["https://rywiki.tsadra.org/index.php/Khenchen_Jigme_Phuntsok_Jungne"]
  },
  "Kyabje Dudjom Rinpoche": {
    "bioEs": "Dudjom Jikdral Yeshe Dorje (1904–1987), uno de los grandes maestros nyingma modernos y tertön; autor de una historia clásica de la escuela Nyingma y difusor clave del Dudjom Tersar en Oriente y Occidente.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Dudjom_Rinpoche"]
  },
  "Chatral Rinpoche": {
    "bioEs": "Kyabjé Chatral Sangye Dorje (1913–2015), yogui dzogchen muy respetado; importante portador del Longchen Nyingtik (y también del Dudjom Tersar), conocido por su disciplina estricta y vida retirada.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Chatral_Rinpoche"]
  },
  "Chogyal Phakpa": {
    "bioEs": "Chögyal Pakpa (1235–1280), jerarca sakya reconocido por Kublai Khan; diseñó la escritura 'phags-pa y fue figura clave en la relación Sakya–Yuan.",
    "urls": ["https://www.rigpawiki.org/index.php?title=Ch%C3%B6gyal_Phakpa"]
  },
  "Fourth Dodrubchen Rinpoche": {
    "bioEs": "Dodrupchen Tubten Trinlé Pal Zangpo / Jikmé Trinlé Palbar (1927–2022), gran maestro nyingma-dzogchen y principal portador del Longchen Nyingtik en los siglos XX–XXI.",
    "urls": ["https://commons.tsadra.org/index.php/Dodrupchen,_4th"]
  }
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

  let updated = 0;
  const missing = [];

  for (const e of cal.entries || []) {
    if (!e?.flags?.teacherAnniversary) continue;

    const name = teacherNameFromEntry(e);
    const record = BIOS[name];

    if (!record) {
      missing.push(name);
      continue;
    }

    e.bio = {
      es: record.bioEs,
      sources: record.urls || [],
    };
    updated++;
  }

  cal.source = {
    ...(cal.source || {}),
    biosIntegratedAt: new Date().toISOString(),
    biosLanguage: 'es-419',
  };

  fs.writeFileSync(CAL_PATH, JSON.stringify(cal, null, 2), 'utf-8');

  console.log(`Integrated bios for ${updated} teacher entries.`);
  if (missing.length) {
    console.log(`Missing bios for: ${missing.join(', ')}`);
    process.exitCode = 2;
  }
}

main();
