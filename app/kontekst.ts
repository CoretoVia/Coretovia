/**
 * КОНТЕКСТЪТ НА ЕКРАНА · какво получава всеки прозорец от композиционния корен.
 *
 * Портата (и само тя — K2), тялото, в което рисува, кой пише, и три неща, които
 * само коренът може да даде, защото само той държи носителя: думите за
 * хранилището, проверката на веригата, и препотвърждаването на екрана.
 */

import type { Sabitie } from '../src/yadro/sabitie.js';
import type { Porta } from '../src/porta/porta.js';

export interface KonteksNaEkrana {
  readonly porta: Porta;
  readonly tyalo: HTMLElement;
  /** веригата, в която се пише · ключът на Книгата */
  readonly veriga: string;
  aktor(): string;
  /** научава се при откриването · запомня се на устройството */
  zadayAktor(imeyl: string): void;
  /** думите за хранилището и крана · четат се при всяко рисуване, кранът се мени */
  hranilishte(): string;
  /**
   * КОТВАТА · мери се ВЕДНЪЖ при тръгване, защото Вратата я забива при всеки
   * запис: докато разделът върви, тя не може да се разсинхронизира сама.
   *
   * `nared` е ФАЛШИВО само при находка. „Котва още няма" е състояние, не
   * тревога — но пак се казва, инак находката не се различава от тишината.
   */
  kotvata(): { readonly nared: boolean; readonly dumi: string };
  /** Самоличността на устройството · или причината защо я няма (ADR-024 §1). */
  samolichnostta(): { readonly nared: boolean; readonly dumi: string };
  proveriVerigata(): Promise<string>;
  /** SHA-256 на качен файл · за отпечатъка на внесената Книга · само коренът държи хеша */
  otpechatakNaBaytove(baytove: ArrayBuffer): Promise<string>;
  /**
   * РЕЗЕРВНОТО КОПИЕ · целият Журнал навън и обратно (ДЛ-Н1).
   *
   * Негово, 14.09 (запис 229): „Мога ли да попълвам моите вече?" Може, когато
   * има път назад. Изнасянето дава СЪБИТИЯТА, не снимка на редовете.
   */
  iznesiZhurnala(): Promise<readonly Sabitie[]>;
  /** връща копие · Вратата проверява ЦЯЛАТА верига, преди да запише нещо */
  vazstanoviZhurnala(sabitiya: readonly Sabitie[]): Promise<string>;
  /** рисува текущия прозорец наново от живото Огледало */
  prerisuvay(): void;
}
