/**
 * ПОКАЗАТЕЛИТЕ · данните, от които се смятат коефициентите.
 *
 * Негово, 11.09 (запис 194): „**Събери основните данни необходими за
 * изчисляване на коефициентите от отчети. Искам под таблицата и диаграмата да
 * дадеш всички данни които може да се съберат от Приходи и Разходи за да се
 * сметнат коефициентите.**"
 *
 * Тук НЕ се измислят коефициенти. Събира се онова, което Приходи и Разходи
 * вече знаят, и се показва с формулата до него — за да се види кое е налично и
 * кое липсва, преди да се строят Отчетите.
 *
 * ТРИ ГРАНИЦИ:
 *
 *   1. **Парите са цели центове** (правило 3). Делението дава ДЯЛ, не пари, и
 *      се пази като процент с една стотна — закръгленото никога не влиза в сбор.
 *   2. **Деление на нула не се прави тихо.** Няма приход → делът го КАЗВА, а не
 *      показва нула или безкрайност.
 *   3. **Всяко число носи формулата си с думи** (правило 28 · 31): екранът
 *      обяснява откъде идва, а не само колко е.
 */

import { deliZakragleno, pishi } from '../yadro/pari.js';
import type { Smetki } from './smetki.js';

export interface Pokazatel {
  readonly klyuch: string;
  readonly ime: string;
  /** стойността, както се пише на екрана · пари, брой или процент */
  readonly stoynost: string;
  /** формулата с думи · подсказката я показва (правило 28) */
  readonly formula: string;
  /** цели центове, когато показателят е пари · инак `null` */
  readonly st: number | null;
}

/** Процент с една стотна · дял, не пари; „—" когато знаменателят е нула. */
function dyal(chislitel: number, znamenatel: number): string {
  if (znamenatel === 0) return '—';
  return `${((chislitel / znamenatel) * 100).toFixed(1).replace('.', ',')} %`;
}

/**
 * Добавките към сборовете · онова, което НЕ е ред с пари, но е пари.
 *
 * Негово, 13.09 (запис 213), точка 2, ДОСЛОВНО: „**Тези сборни за Задачи и
 * сметки Бюджето участват в сметките на Коефициентите под таблица и календар в
 * СМетки.**"
 *
 * ЗАЩО ОТДЕЛЕН ПАРАМЕТЪР. `Smetki` знае само редовете с пари; бюджетите на
 * задачите идват от Управление, а ДДС се СМЯТА от таблицата. И двете вече
 * влизат в ОБЩ РАЗХОД на екрана — ако не влезеха и тук, показателите под
 * таблицата биха казвали ДРУГО число от сбора точно над тях, и никой не би
 * разбрал кое от двете лъже.
 */
export interface DobavkiKamSborovete {
  /** цели центове, СЪС знака · добавя се към прихода */
  readonly prihod_st: number;
  /** цели центове, СЪС знака (разходът е отрицателен) */
  readonly razhod_st: number;
}

const BEZ_DOBAVKI: DobavkiKamSborovete = Object.freeze({ prihod_st: 0, razhod_st: 0 });

/**
 * Данните от Приходи и Разходи · всичко, което може да се събере днес.
 *
 * `mesetsi` е броят РАЗЛИЧНИ месеци, които календарът покрива — не броят на
 * колоните му. При такт „ден" колоните са часове, при седмица и месец са дни;
 * делението на тях даваше „среден приход на месец", който е приход на час.
 *
 * `dobavki` са бюджетите на задачите и ДДС — виж `DobavkiKamSborovete`.
 */
export function pokazatelite(
  s: Smetki,
  mesetsi: number,
  dobavki: DobavkiKamSborovete = BEZ_DOBAVKI,
): readonly Pokazatel[] {
  const prihod = s.sborPrihod + dobavki.prihod_st;
  // разходът се пази с отрицателен знак · за четене и за дялове се взима модулът
  const razhod = Math.abs(s.sborRazhod + dobavki.razhod_st);
  const rezultat = prihod - razhod;

  const nayGolyama = (spisak: Smetki['prihod']): { ime: string; sbor: number } => {
    let naygolyamata = { ime: '—', sbor: 0 };
    for (const sek of spisak)
      if (Math.abs(sek.sbor) > Math.abs(naygolyamata.sbor))
        naygolyamata = { ime: sek.tekst, sbor: sek.sbor };
    return naygolyamata;
  };
  const golyamPrihod = nayGolyama(s.prihod);
  const golyamRazhod = nayGolyama(s.razhod);

  return [
    {
      klyuch: 'prihod',
      ime: 'Приход общо',
      stoynost: pishi(prihod),
      formula: 'сборът на всички секции на Приход за показания период, с ДДС за възстановяване',
      st: prihod,
    },
    {
      klyuch: 'razhod',
      ime: 'Разход общо',
      stoynost: pishi(razhod),
      formula:
        'сборът на всички секции на Разход, плюс ДДС за внасяне и бюджетите на задачите · по модул',
      st: razhod,
    },
    {
      klyuch: 'rezultat',
      ime: 'Резултат',
      stoynost: pishi(rezultat),
      formula: 'приход минус разход · положителен е печалба, отрицателен е загуба',
      st: rezultat,
    },
    {
      klyuch: 'marzh',
      ime: 'Марж',
      stoynost: dyal(rezultat, prihod),
      formula: 'резултат ÷ приход · колко остава от всяко влязло евро',
      st: null,
    },
    {
      klyuch: 'pokritie',
      ime: 'Покритие на разхода',
      stoynost: dyal(prihod, razhod),
      formula: 'приход ÷ разход · над сто на сто значи, че приходът стига',
      st: null,
    },
    {
      klyuch: 'razhod-kam-prihod',
      ime: 'Разход към приход',
      stoynost: dyal(razhod, prihod),
      formula: 'разход ÷ приход · колко от прихода отива в разходи',
      st: null,
    },
    {
      klyuch: 'sredno-prihod',
      ime: 'Среден приход на месец',
      stoynost: mesetsi === 0 ? '—' : pishi(deliZakragleno(prihod, mesetsi)),
      formula: 'приход ÷ броя РАЗЛИЧНИ месеци в календара',
      st: mesetsi === 0 ? null : deliZakragleno(prihod, mesetsi),
    },
    {
      klyuch: 'sredno-razhod',
      ime: 'Среден разход на месец',
      stoynost: mesetsi === 0 ? '—' : pishi(deliZakragleno(razhod, mesetsi)),
      formula: 'разход ÷ броя РАЗЛИЧНИ месеци в календара',
      st: mesetsi === 0 ? null : deliZakragleno(razhod, mesetsi),
    },
    {
      klyuch: 'nay-goliam-prihod',
      ime: 'Най-голям приход',
      stoynost: `${golyamPrihod.ime} · ${dyal(Math.abs(golyamPrihod.sbor), prihod)}`,
      formula: 'секцията с най-голям сбор и делът ѝ от целия приход',
      st: null,
    },
    {
      klyuch: 'nay-goliam-razhod',
      ime: 'Най-голям разход',
      stoynost: `${golyamRazhod.ime} · ${dyal(Math.abs(golyamRazhod.sbor), razhod)}`,
      formula: 'секцията с най-голям сбор и делът ѝ от целия разход',
      st: null,
    },
    {
      klyuch: 'sektsii',
      ime: 'Секции с движения',
      stoynost: `${s.prihod.filter((x) => x.redove.length > 0).length} приход · ${s.razhod.filter((x) => x.redove.length > 0).length} разход`,
      formula: 'колко секции имат поне един ред в показания период',
      st: null,
    },
    {
      klyuch: 'dvizheniya',
      ime: 'Движения',
      stoynost: `${s.broyDvizheniya}${s.bezSektsiya.length === 0 ? '' : ` · без секция ${s.bezSektsiya.length}`}`,
      formula: 'броят редове с пари · и колко от тях са без секция',
      st: null,
    },
  ];
}

/**
 * ЕДИН КОЕФИЦИЕНТ, РАЗБИТ ПО КОЛОНИТЕ НА КАЛЕНДАРА.
 *
 * Негово, 14.09 (запис 226) т.4, ДОСЛОВНО: „…под него данните за коефициентите и
 * да има падащо меню за избор на конкретен коефициент според периода и такта да
 * избираш от падащо меню диаграма, графика или таблица(припомни си)."
 *
 * „Припомни си" сочи Заданието, и то го казва отдавна:
 *   · `zadanie/CHISTO/11` **M11-06** · „Секция Отчети има точно ДВЕ падащи менюта:
 *     (а) коефициент; (б) начин на показване."
 *   · **M11-07** · „Менюто за показване има три стойности: Диаграма · Графика · Таблица."
 *   · **M11-11** · „Тактът и периодът менят СТОЙНОСТИТЕ, не списъка."
 *   · **M11-12** · „Коефициент, който не може да се смята за избрания такт и период,
 *     се показва СИВ и казва защо. Не изчезва."
 *
 * ЗАЩО ОТ КОЛОНИТЕ, А НЕ ОТ `Smetki` НАНОВО. Сборът за всяка колона вече е сметнат
 * веднъж — от него живее самият календар. Второ смятане би било втора истина и
 * двете биха се разминали при първата промяна (правило 14). Тук се подава ГОТОВОТО
 * и се дели.
 *
 * И НЕ ВСИЧКИ СЕ СМЯТАТ ПО КОЛОНА. „Среден приход на месец" е сметка ЗА ПЕРИОДА —
 * на една колона тя е самата колона и числото не значи нищо; „Секции с движения"
 * и „Движения" са брой, не пари. Те не се крият — казват защо не се чертаят
 * (правило 12 · M11-12).
 */

/** Сборовете на ЕДНА колона от календара · цели центове, със знака. */
export interface KolonaSPari {
  /** каквото пише в главата ѝ · „сб 1" · „2026-09" */
  readonly nadpis: string;
  readonly prihod_st: number;
  /** отрицателен (правило 16) */
  readonly razhod_st: number;
}

/** Стойността на един коефициент в една колона. */
export interface TochkaNaKoefitsienta {
  readonly nadpis: string;
  /** както се пише на екрана */
  readonly dumi: string;
  /** числото за чертане · `null`, когато не се смята (деление на нула) */
  readonly chislo: number | null;
}

export interface RedNaKoefitsienta {
  readonly klyuch: string;
  readonly ime: string;
  readonly formula: string;
  /** празно, когато се чертае · инак КАЗВА защо не (правило 12) */
  readonly zashtoNe: string;
  readonly tochki: readonly TochkaNaKoefitsienta[];
  /** пари ли са числата · решава дали се пишат с евро */
  readonly pari: boolean;
}

/** Кои коефициенти се смятат по колона · останалите казват защо не. */
const PO_KOLONA: readonly string[] = Object.freeze([
  'prihod',
  'razhod',
  'rezultat',
  'marzh',
  'pokritie',
  'razhod-kam-prihod',
]);

const ZASHTO_NE: Readonly<Record<string, string>> = Object.freeze({
  'sredno-prihod': 'сметка за ЦЕЛИЯ период · на една колона тя е самата колона',
  'sredno-razhod': 'сметка за ЦЕЛИЯ период · на една колона тя е самата колона',
  'nay-goliam-prihod': 'сочи СЕКЦИЯ, не число по време',
  'nay-goliam-razhod': 'сочи СЕКЦИЯ, не число по време',
  sektsii: 'брой секции, не пари · няма какво да се чертае по такта',
  dvizheniya: 'брой редове, не пари · няма какво да се чертае по такта',
});

export function koefitsientatPoKolona(
  klyuch: string,
  ime: string,
  formula: string,
  kolonite: readonly KolonaSPari[],
): RedNaKoefitsienta {
  const zashtoNe = ZASHTO_NE[klyuch] ?? (PO_KOLONA.includes(klyuch) ? '' : 'не се смята по такт');
  if (zashtoNe !== '') return { klyuch, ime, formula, zashtoNe, tochki: [], pari: false };

  const pari = klyuch === 'prihod' || klyuch === 'razhod' || klyuch === 'rezultat';
  const tochki = kolonite.map((k) => {
    const razhodPolozhitelen = -k.razhod_st;
    const [chislo, dumi] = ((): [number | null, string] => {
      if (klyuch === 'prihod') return [k.prihod_st, pishi(k.prihod_st)];
      if (klyuch === 'razhod') return [k.razhod_st, pishi(k.razhod_st)];
      if (klyuch === 'rezultat') {
        const r = k.prihod_st + k.razhod_st;
        return [r, pishi(r)];
      }
      if (klyuch === 'marzh') {
        if (k.prihod_st === 0) return [null, '—'];
        const r = k.prihod_st + k.razhod_st;
        return [(r / k.prihod_st) * 100, dyal(r, k.prihod_st)];
      }
      if (klyuch === 'pokritie') {
        if (razhodPolozhitelen === 0) return [null, '—'];
        return [(k.prihod_st / razhodPolozhitelen) * 100, dyal(k.prihod_st, razhodPolozhitelen)];
      }
      // 'razhod-kam-prihod'
      if (k.prihod_st === 0) return [null, '—'];
      return [(razhodPolozhitelen / k.prihod_st) * 100, dyal(razhodPolozhitelen, k.prihod_st)];
    })();
    return { nadpis: k.nadpis, dumi, chislo };
  });
  return { klyuch, ime, formula, zashtoNe: '', tochki, pari };
}
