/**
 * ГАНТЪТ · решетката с времеви колони · ПРЕНЕСЕН от MasterBook (`domein/gant.ts`)
 * върху реда на задача от Огледалото (ADR-005).
 *
 * Негово определение, дословно *(р84·[28] · допълнено в [30] · 12.08)*:
 *
 *   „Гант = решетката с времеви колони (★ −60)"
 *
 * И моделът, който той избра *(р56·[6]·08.08)*: „**Да, направи като Сметки
 * (периодни колони)**" — ясни периодни колони, задачата = лента вътре в
 * клетките по период. ПЪРВАТА КОЛОНА Е ДНЕС · негово „Да, точно така"
 * *(р57·[134])*. ЗАЩО НЯМА ВЛАЧЕНЕ · негово *(р83·[35]·11.08)*: „**не можеш да
 * го направиш това забрана**" — срокът се мени от клетката, не с мишка върху
 * лента; всяка промяна на срок е събитие в Журнала.
 *
 * Тактът живее в `vreme.ts` (един дом на времето, правило 14); тук се СТРОИ
 * решетката от него. Гантът не знае за пари и не бива да научава: сборовете
 * по колона (негово, 05.09: „и в диаграмата на Гант до нея") идват отвън като
 * голи числа по дата.
 */

import {
  type KolonaNaTakta,
  koloniNaTakta,
  kolkoSeVizhdat,
  type SvoyPeriod,
  type Takt,
} from './vreme.js';

export type { Takt } from './vreme.js';

/** Редът, който Гантът рисува · id и двете му дати · нищо друго. */
export interface RedNaGant {
  readonly id: string;
  /** YYYY-MM-DD · празно = без начало (лента от края само) */
  readonly ot: string;
  /** YYYY-MM-DD · празно = без край */
  readonly do: string;
}

/** Лентата на един ред върху решетката. */
export interface Lenta {
  readonly id: string;
  /** индекс на първата колона, която редът покрива */
  readonly ot: number;
  /** колко колони покрива · поне 1 */
  readonly broy: number;
  /** излиза ли извън решетката наляво — стрелка, не отрязване */
  readonly izlizaNalyavo: boolean;
  readonly izlizaNadyasno: boolean;
}

export interface Reshetka {
  readonly takt: Takt;
  readonly koloni: readonly KolonaNaTakta[];
  /** колко от тях се побират на екран — останалите са зад скрола */
  readonly vidimi: number;
  readonly lenti: readonly Lenta[];
}

/**
 * ЛЕНТАТА НА ЕДИН РЕД · от коя колона до коя.
 *
 * Ред, който почва преди решетката или свършва след нея, НЕ се отрязва тихо:
 * лентата носи `izlizaNalyavo` / `izlizaNadyasno` и екранът рисува стрелка.
 * Ред изцяло извън решетката не дава лента — той не е скрит, а просто не е в
 * този прозорец от време; таблицата отляво пак го показва. Ред без нито една
 * дата не дава лента. Само начало = еднодневна лента в началото; само край =
 * еднодневна в края.
 */
export function lentaNa(d: RedNaGant, k: readonly KolonaNaTakta[]): Lenta | null {
  if (k.length === 0) return null;
  if (d.ot === '' && d.do === '') return null;
  const ot = d.ot === '' ? d.do : d.ot;
  const doo = d.do === '' ? d.ot : d.do;
  const parva = k[0]!;
  const posledna = k[k.length - 1]!;
  if (doo < parva.ot || ot > posledna.do) return null;

  let otI = k.findIndex((x) => x.do >= ot);
  if (otI < 0) otI = 0;
  // КРАЯТ се търси ОТЗАД-НАПРЕД, не отпред. При такт „ден" осем колони носят
  // ЕДИН и същ ден (осемте му работни часа): търсено отпред, еднодневната задача
  // заемаше ПЪРВИЯ час и изглеждаше като „час работа", а тя трае целия ден.
  let doI = -1;
  for (let i = k.length - 1; i >= 0; i -= 1) {
    if (k[i]!.ot <= doo) {
      doI = i;
      break;
    }
  }
  if (doI < otI) doI = otI;

  return {
    id: d.id,
    ot: otI,
    broy: Math.max(1, doI - otI + 1),
    izlizaNalyavo: ot < parva.ot,
    izlizaNadyasno: doo > posledna.do,
  };
}

/** Цялата решетка за едно множество редове. */
export function reshetka(
  redove: readonly RedNaGant[],
  takt: Takt,
  dnes: string,
  svoy?: SvoyPeriod,
): Reshetka {
  const k = koloniNaTakta(takt, dnes, svoy);
  const lenti: Lenta[] = [];
  for (const d of redove) {
    const l = lentaNa(d, k);
    if (l) lenti.push(l);
  }
  return { takt, koloni: k, vidimi: kolkoSeVizhdat(takt, dnes, svoy), lenti };
}

/**
 * СБОРОВЕТЕ ПО КОЛОНА · негово искане *(р52·[303]·08.08)*: „добави в всяка
 * таблица един обобщен ред на сумите за месеци в Гант, в зависимост от
 * времевия такт." — и от 05.09: „Филтър на цидрите отфолу на колоните и в
 * таблицата и в диаграмата на Гант до нея."
 *
 * „в зависимост от времевия такт" е половината, която лесно се губи: числото се
 * събира по КОЛОНА на решетката, каквато и да е тя — не по календарен месец,
 * когато тактът е седмица. Числата идват отвън като (дата · число): Гантът
 * не знае дали са центове или бройки. При такт „ден" осемте колони са часове от
 * ЕДИН ден: числото стои ВЕДНЪЖ, разпънато над осемте (`obhvat`), вместо да се
 * повтори осем пъти или да се размаже по часове.
 */
export interface ChisloPoData {
  readonly data: string;
  readonly chislo: number;
}

export interface SborVKolona {
  readonly sbor: number;
  /** колко колони покрива клетката · нула значи „тук няма клетка" */
  readonly obhvat: number;
}

export function sboroveVKolonite(
  k: readonly KolonaNaTakta[],
  chisla: readonly ChisloPoData[],
): SborVKolona[] {
  return k.map((kol, i) => {
    const predishna = k[i - 1];
    if (kol.chas !== undefined && predishna?.ot === kol.ot) return { sbor: 0, obhvat: 0 };
    let obhvat = 1;
    if (kol.chas !== undefined) {
      while (k[i + obhvat]?.ot === kol.ot) obhvat += 1;
    }
    let sbor = 0;
    for (const c of chisla) if (c.data >= kol.ot && c.data <= kol.do) sbor += c.chislo;
    return { sbor, obhvat };
  });
}

/** Колко ленти покриват всяка колона · броят на задачите в такта. */
export function broyPokrivashti(k: readonly KolonaNaTakta[], lenti: readonly Lenta[]): number[] {
  const broy = new Array<number>(k.length).fill(0);
  for (const l of lenti) {
    for (let i = l.ot; i < l.ot + l.broy && i < k.length; i += 1) broy[i] = (broy[i] ?? 0) + 1;
  }
  return broy;
}

/**
 * КОЛКО ДНИ ОСТАВАТ до един срок · отрицателно значи просрочено. Броят се цели
 * дни по календара, не часове: задачата няма час.
 */
export function dniDoSroka(srok: string, dnes: string): number {
  const kray = Date.parse(`${srok}T00:00:00Z`);
  const sega = Date.parse(`${dnes}T00:00:00Z`);
  return Math.round((kray - sega) / 86_400_000);
}

/**
 * СВЕТОФАРЪТ на срока · неговите думи *(р59·[71] · повторено в р74·[12])*:
 * „цвета на датата или сумата се променя спрямо наближаването на времето" —
 * нормално · жълто седмица преди · червено два дни преди · просрочено.
 *
 * Празната дата НЕ свети: подразбран срок би оцветил в червено работа, за която
 * никой не е бързал. НЕЧЕТИМАТА ДАТА КРЕЩИ, не минава за „нормално": `Date.parse`
 * дава NaN, трите сравнения са лъжливи и без пазача сгрешена дата изглеждаше
 * като спокоен срок — за светофар това е най-тихата възможна повреда.
 */
export type Svetofar = 'normalno' | 'zhalto' | 'cherveno' | 'prosrocheno';

export function svetofarNaSroka(srok: string, dnes: string): Svetofar {
  if (srok === '') return 'normalno';
  const dni = dniDoSroka(srok, dnes);
  if (Number.isNaN(dni)) {
    throw new Error(
      `Нечетима дата за светофара: „${srok}". Очаква се ГГГГ-ММ-ДД или празно. ` +
        'Празното значи „без срок"; сгрешеното не значи нищо и не бива да минава за спокойно.',
    );
  }
  if (dni < 0) return 'prosrocheno';
  if (dni <= 2) return 'cherveno';
  if (dni <= 7) return 'zhalto';
  return 'normalno';
}

/**
 * ОБОБЩАВАЩАТА ЛЕНТА · родителят носи обхвата на децата си.
 *
 * Негово, 13.09 (запис 210), ДОСЛОВНО: „Обърни внимание да направиш **календара
 * да обхваща всички редове** и в Управлени и в Сметки." И преди това, 11.09
 * (запис 195 т.2): „**Ганта обхваща всички редове изцяло** и се сливат двете."
 *
 * ДОТУК ИМОТЪТ, ОБЕКТЪТ И БИЗНЕСЪТ НЯМАХА НИТО ЕДНА КЛЕТКА в календара — не
 * защото е решено така, а защото лентата се смяташе само за задача, а родителят
 * няма свои дати. И кодът дори не го БРОЕШЕ: празният ред просто мълчеше.
 *
 * Сега родителят получава лентата, която му се полага в MS Project, откъдето той
 * сам взе образеца (запис 194: „както изглежда в МС Проджект"): **от най-ранното
 * начало до най-късния край на потомците си**. Тя не е негова дата — тя е
 * ОБХВАТЪТ на работата под него, и точно това човек търси, когато свие дървото.
 *
 * НИВОТО РЕШАВА КОЙ В КОГО СЕ ВЛИВА. Задачата (ниво 2) влиза в Обекта над себе
 * си (ниво 1) И в Имота над него (ниво 0) — затова стекът, а не проста карта
 * „родител → деца": обхватът се качва през всички отворени нива наведнъж.
 *
 * Ред без дати не разширява нищо. Родител без нито едно дете с дата не получава
 * лента и не се преструва, че има.
 */
export interface RedZaObobshtavane {
  /** 0 = Имот · 1 = Обект или Бизнес · 2 = задача · по-голямото се влива в по-малкото */
  readonly nivo: number;
  readonly ot: string;
  readonly do: string;
}

export interface Obhvat {
  readonly ot: string;
  readonly do: string;
}

/**
 * Обхватите на родителите · КЛЮЧЪТ Е ИНДЕКСЪТ на реда в подадения списък.
 *
 * Индекс, а не `id`: един и същи имот не се повтаря в дървото, но индексът е
 * това, което викащият вече има под ръка, и не иска втора карта, за да го върже.
 */
export function obobshtenite(redove: readonly RedZaObobshtavane[]): ReadonlyMap<number, Obhvat> {
  const izlaz = new Map<number, Obhvat>();
  /** отворените родители · индексът и нивото им, най-външният отпред */
  const stek: { i: number; nivo: number }[] = [];

  for (const [i, r] of redove.entries()) {
    // затваряме всеки родител, който е на СЪЩОТО или по-дълбоко ниво: той вече
    // не може да получи нови деца, защото този ред не е под него
    while (stek.length > 0 && stek[stek.length - 1]!.nivo >= r.nivo) stek.pop();

    const imaDati = r.ot !== '' || r.do !== '';
    if (imaDati) {
      const ot = r.ot === '' ? r.do : r.ot;
      const doo = r.do === '' ? r.ot : r.do;
      for (const otvoren of stek) {
        const sega = izlaz.get(otvoren.i);
        izlaz.set(otvoren.i, {
          ot: sega === undefined || ot < sega.ot ? ot : sega.ot,
          do: sega === undefined || doo > sega.do ? doo : sega.do,
        });
      }
    }

    // самият ред става родител за следващите по-дълбоки
    stek.push({ i, nivo: r.nivo });
  }
  return izlaz;
}
