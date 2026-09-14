/**
 * ОТМЯНАТА · кое е СЛЕДВАЩОТО за връщане назад · Ctrl+Z над Журнал, който не се трие.
 *
 * ═══ ЗАЩО СЪЩЕСТВУВА ═══
 *
 * Негово, 14.09.2026 в 18:53 (запис 232) т.4, ДОСЛОВНО: „**Върни реда не работи,
 * защото когато го скриеш вече няма къде да натиснещ десен бутон. За това нека
 * да има виняги от всяеки десен бутон на различни места ако има действия даа
 * можеш да ги вртщаш максимален брой пъти от та и да се вклюва с контрол и Z.**"
 *
 * Три неща в едно изречение, и трите верни:
 *
 *   1. „Върни реда" стоеше САМО върху реда — а изключеният ред го няма на екрана.
 *      Функция, до която не се стига, е мъртва с викащ (третият вид мъртво).
 *   2. Връщането трябва да е от ВСЯКО дясно меню, не от едно място.
 *   3. И МНОГО пъти назад, с Ctrl+Z — както във всяка програма, която той ползва.
 *
 * ═══ КАК СЕ ВРЪЩА НАЗАД БЕЗ ДА СЕ ТРИЕ ═══
 *
 * Журналът е само за добавяне (правило 1). „Назад" не е изтриване на последното
 * — то е СТОРНО: ново събитие срещу старото, с причина. Значи Ctrl+Z = „сторно
 * на последното събитие, което още не е сторнирано". Натиснат втори път, той
 * гаси предходното, и така назад — докато стигне откриването на Книгата, което
 * не се гаси.
 *
 * ТУК СЕ РЕШАВА САМО „КОЕ Е СЛЕДВАЩОТО". Записът го прави `obshto.storno` през
 * каталога, както всяко друго действие (К2). Затова и трите отказа тук са
 * ТОЧНО неговите три: не откриването · не сторно · не вече погасено. Четвърти
 * отказ тук би значел Ctrl+Z да подмине нещо, което менюто позволява — и
 * двете места да лъжат различно.
 */

import { TIP } from '../sabitiya/registar.js';
import type { PogasenZapis } from '../ogledalo/ogledalo.js';
import type { Sabitie, Sashtnost } from '../yadro/sabitie.js';

/** Какво ще се отмени · достатъчно, за да го КАЖЕ менюто преди натискането. */
export interface OtmyanaVKratse {
  readonly veriga: string;
  readonly seq: number;
  readonly type: string;
  readonly sashtnost: Sashtnost;
  /** с думи · „изключване на ред · zadachi" */
  readonly dumi: string;
}

/**
 * ДУМИТЕ ЗА ЕДИН ТИП · за човека, не за машината.
 *
 * Имената на типовете вече са български, но са ИМЕНА („РедИзключен"), а
 * менюто иска действие в родителен („изключване на ред"). Непознат тип се казва
 * с името си, не се крие (правило 12).
 */
export function dumiZaTipa(type: string): string {
  switch (type) {
    case TIP.redZapisan:
      return 'запис на ред';
    case TIP.redIzklyuchen:
      return 'изключване или връщане на ред';
    case TIP.stoynostZapisana:
      return 'запис на стойност в номенклатура';
    case TIP.stoynostSpryana:
      return 'спиране на стойност в номенклатура';
    case TIP.modelZapisan:
      return 'запазен модел на екрана';
    case TIP.knigaIznesena:
      return 'износ на Книгата';
    case TIP.knigaVnesena:
      return 'внос на Книга';
    case TIP.strukturaPromenena:
      return 'промяна на структурата';
    default:
      return type;
  }
}

/**
 * Следващото за отмяна във веригата · или `null`, когато няма какво.
 *
 * Върви от КРАЯ назад — най-новото първо, както човек очаква от Ctrl+Z.
 */
export function sledvashtotoZaOtmyana(
  sabitiya: readonly Sabitie[],
  pogaseni: readonly PogasenZapis[],
  veriga: string,
): OtmyanaVKratse | null {
  const pogaseniSeq = new Set(pogaseni.filter((p) => p.veriga === veriga).map((p) => p.seq));
  for (let i = sabitiya.length - 1; i >= 0; i -= 1) {
    const s = sabitiya[i];
    if (s === undefined) continue;
    // същите три отказа като на `obshto.storno` · и нито един повече
    if (s.type === TIP.stopaninZapisan) continue;
    if (s.type === TIP.storno) continue;
    if (pogaseniSeq.has(s.seq)) continue;
    return {
      veriga,
      seq: s.seq,
      type: s.type,
      sashtnost: s.sashtnost,
      dumi: `${dumiZaTipa(s.type)} · ${s.sashtnost.vid} ${s.sashtnost.id}`,
    };
  }
  return null;
}
