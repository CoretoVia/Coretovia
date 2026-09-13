/**
 * МЕНЮТО „СЪЗДАВАНЕ" · четирите неща, които се раждат отвсякъде.
 *
 * Негово, 11.09 (запис 195), точка 11: „**Създаването на Имот, Обект, Задачи,
 * Срещи да става в искачащ прозорец…**" и 11.09 (запис 193): „**Създаването е
 * отделно падащо меню навсякъде.**"
 *
 * Четирите са НЕГОВИ и са изброени от самия него в клетката на бутона:
 * „Добавяне(падащо меню за Имот, Обект, Кредит, Среща)". Срещата не е пета
 * таблица — тя е задача с вид „Среща" от неговата номенклатура; затова тук
 * видът се подава готов, вместо човекът да го избира наново всеки път.
 *
 * Кредитът стои в списъка, но е СИВ и казва защо (правило 12) — таблицата му
 * идва с ход 11б.
 */

import { NOMENKLATURA } from '../../src/model/osnova.js';
import type { Izbran } from '../../src/porta/porta.js';
import type { KonteksNaEkrana } from '../kontekst.js';
import { otvoriIzskachasht } from './izskachasht.js';
import { pokazhiMenyu, type Tochka } from './menyu.js';

/** Номерът на един вид задача по името му · `null`, ако номенклатурата го няма. */
function vidNaZadachata(k: KonteksNaEkrana, ime: string): number | null {
  const n = k.porta.ogledalo().nomenklaturi.get(NOMENKLATURA.vidNaZadacha);
  if (n === undefined) return null;
  for (const s of n.stoynosti) if (s.tekst === ime) return s.nomer;
  return null;
}

/**
 * ПУНКТОВЕТЕ на менюто · отделно от рисуването, за да се броят и проверяват.
 *
 * Списъкът е ДАННИ: кой пункт какво създава и защо е сив. Рисуването е друго
 * нещо и живее едно ниво по-нагоре.
 */
/**
 * Един пункт за задача · Срещата е същата таблица със заложен вид.
 *
 * `nomerNaVida` е номерът, който трябва да СЪЩЕСТВУВА, за да е разрешен
 * пунктът; `zalozhen` е онзи, който влиза готов в товара (при Задача — нито
 * един, човек избира сам).
 */
function zadachaIliSreshta(
  k: KonteksNaEkrana,
  klyuch: string,
  ime: string,
  zaglavie: string,
  nomerNaVida: number | null,
  zalozhen: number | null,
  /** родителят, когато точката идва от десния бутон върху ред · инак празно */
  kam = '',
): Tochka {
  const dadeni = {
    ...(kam === '' ? {} : { kam: { tekst: kam } }),
    ...(zalozhen === null ? {} : { vid: { nomer: zalozhen } }),
  };
  return {
    klyuch,
    ime,
    razreshena: nomerNaVida !== null,
    zashto: 'номенклатурата „Вид на задача" още не е заредена',
    deystvie: () =>
      otvoriIzskachasht(k, {
        tablitsa: 'zadachi',
        komanda: 'upravlenie.dobaviZadacha',
        zaglavie,
        ...(Object.keys(dadeni).length === 0 ? {} : { dadeni }),
      }),
  };
}

export function tochkiteNaSazdavaneto(k: KonteksNaEkrana): readonly Tochka[] {
  const sreshta = vidNaZadachata(k, 'Среща');
  const delo = vidNaZadachata(k, 'Дело');
  const tochki: Tochka[] = [
    {
      klyuch: 'imot',
      ime: 'Имот',
      razreshena: true,
      zashto: '',
      deystvie: () =>
        otvoriIzskachasht(k, {
          tablitsa: 'imoti',
          komanda: 'imoti.sazdayImot',
          zaglavie: 'Нов Имот',
        }),
    },
    {
      klyuch: 'obekt',
      ime: 'Обект',
      razreshena: true,
      zashto: '',
      deystvie: () =>
        otvoriIzskachasht(k, {
          tablitsa: 'obekti',
          komanda: 'imoti.dobaviObekt',
          zaglavie: 'Нов Обект',
        }),
    },
    // ЗАДАЧАТА И СРЕЩАТА СА ЕДНО И СЪЩО НЕЩО · различава ги само видът от
    // неговата номенклатура. Затова се раждат от един строител: два преписани
    // блока биха се разминали при първата промяна на полетата на задачата.
    zadachaIliSreshta(k, 'zadacha', 'Задача', 'Нова Задача', delo, null),
    zadachaIliSreshta(k, 'sreshta', 'Среща', 'Нова Среща', sreshta, sreshta),
    {
      klyuch: 'kredit',
      ime: 'Кредит',
      razreshena: false,
      zashto: 'идва с ход 11б',
      deystvie: () => {},
    },
  ];
  return tochki;
}

/**
 * СЪЗДАВАНЕТО ОТ ДЕСНИЯ БУТОН · и точно затова — върху ПРАЗНОТО.
 *
 * Негово, 13.09 (запис 210): „Махни всичките бутони за добавяне и скриване."
 * `zadanie/03` B5 казва къде отива махнатото: „Да може тук да се ползва десния
 * бутон и да се дава опция за Всеки Имот или Обект да се избира и добавят тези
 * 3 функции за добавяне."
 *
 * ВЪРХУ РЕД го закача менюто на реда. Тук се закача другата половина, без
 * която първата е капан: **десен бутон върху празно място**. Инак човек с
 * празна книга няма нито един ред, върху който да натисне — и няма как да
 * създаде първия си имот. Двата слушателя не се бият: този мълчи, когато под
 * курсора има ред, а онзи — когато няма.
 *
 * `dopalnitelni` са пунктовете, които са СВОИ на прозореца (в Сметки — „Добави
 * ред с пари"). Те слизат тук от лентата заедно с останалите, вместо да
 * изчезнат тихо с темата, в която живееха.
 */
/**
 * B5 · ТРИ ФУНКЦИИ ВЪРХУ ОБЕКТ, ЧЕТИРИ ВЪРХУ ИМОТ.
 *
 * `zadanie/03` B5, ДОСЛОВНО: „Да може тук да се ползва десния бутон и да се дава
 * опция за Всеки Имот или Обект да се избира и добавят **тези 3 функции** за
 * добавяне, а за Имота да има **4**, но 4тия избор Голямо дело да е неактивно, а
 * само да се показва с по затъмнен текст и да се отключва за избор след като се
 * даде Състояние на Имота: Строителство."
 *
 * „Тези 3 функции" сочи B1–B3 поименно: Добави Дело · Добави Среща · Добави
 * Преписка. Те НЕ са общото меню „Създаване" (Имот · Обект · Задача · Среща ·
 * Кредит) — то ражда нещо ново където и да си. Тези три раждат ЗАДАЧА КЪМ
 * избрания ред, и затова видът ѝ идва готов, вместо човек да го избира наново.
 *
 * ЧЕТВЪРТИЯТ е само на Имота и е сив, докато Състоянието му не стане Строеж.
 * Причината се КАЗВА (правило 12) и се мени според реда: „още няма Състояние
 * Строеж" е друго от „идва с ход 11б", и човек трябва да знае кое от двете го
 * спира.
 */
export function tochkiteNaRoditelya(
  k: KonteksNaEkrana,
  izbran: Izbran,
  sastoyanieToStroezh: boolean,
): readonly Tochka[] {
  // СЪЩИЯТ строител като на общото меню · два биха се разминали при първата
  // промяна на полетата на задачата
  const zadacha = (ime: string, zaglavie: string): Tochka => {
    const nomer = vidNaZadachata(k, ime);
    return zadachaIliSreshta(k, `rod-${ime}`, `Добави ${ime}`, zaglavie, nomer, nomer, izbran.id);
  };
  return [
    zadacha('Дело', 'Ново Дело'),
    zadacha('Среща', 'Нова Среща'),
    zadacha('Преписка', 'Нова Преписка'),
    // ЧЕТВЪРТИЯТ · само върху Имот (негово B4: „Само към Имот се добавя Голямо дело")
    ...(izbran.tablitsa === 'imoti'
      ? [
          {
            klyuch: 'golyamo-delo',
            ime: 'Голямо дело',
            razreshena: false,
            zashto: sastoyanieToStroezh
              ? 'идва с ход 11б · Състоянието вече е Строеж, остава таблицата'
              : 'отключва се, когато Състоянието на Имота стане Строеж (негово B4)',
            deystvie: () => {},
          },
        ]
      : []),
  ];
}

export function zakachiSazdavanetoOtDesniyaButon(
  k: KonteksNaEkrana,
  dopalnitelni: (() => readonly Tochka[]) | undefined = undefined,
): void {
  k.tyalo.addEventListener('contextmenu', (e) => {
    if ((e.target as HTMLElement).closest('tr.red[data-id]')) return;
    e.preventDefault();
    pokazhiMenyu(e.clientX, e.clientY, [
      ...tochkiteNaSazdavaneto(k),
      ...(dopalnitelni === undefined ? [] : dopalnitelni()),
    ]);
  });
}
