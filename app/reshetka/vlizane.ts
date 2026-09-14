/**
 * ВЛИЗАНЕТО · един имейл и нищо повече.
 *
 * Негово, 11.09 (запис 190), ДОСЛОВНО: „**3. Да няма акаунти и настройки и
 * достъп. 4. Просто влизаш, няма роли, няма Стопанин — остават за напред.
 * 5. Влизане с имейл.**"
 *
 * Затова тук няма парола, няма акаунт, няма доставчик и няма нито един байт
 * навън. Имейлът казва КОЙ ПИШЕ в Журнала — това е целият му смисъл. Всяко
 * събитие носи `actor`, подписът го покрива (правило 4), и без него Вратата
 * отказва да пише: човек, който не се е представил, не оставя следа с чуждо име.
 *
 * ПРАЗНА КНИГА се ОТКРИВА със същия имейл. Дотук откриването стоеше в таб
 * Профил — тоест зад екран, до който човек стига, след като програмата вече е
 * поискала да пише. Първата крачка не бива да е в третата стая.
 */

import { h, sloji } from './shablon.js';

export interface OpisNaVlizaneto {
  /** има ли вече първо събитие · празната Книга се ОТКРИВА при влизане */
  readonly knigataEOtkrita: boolean;
  /** имейлът на Стопанина, когато Книгата вече е открита · за да се покаже */
  readonly stopaninat: string;
  /** записва кой пише · и открива Книгата, ако е празна · връща думи при отказ */
  vlez(imeyl: string): Promise<string>;
  /**
   * ВРЪЩА резервно копие в ПРАЗНА Книга · връща думи (успех или отказ).
   *
   * Негово, 14.09 (запис 229). Измерено: след влизане копието вече не се
   * приема — първото събитие е ново и двете истории се разделят на seq 1.
   * Затова входът е ТУК, преди първата дума да е записана.
   */
  vazstanovi(tekst: string): Promise<string>;
}

/** Толкова проверка, колкото да не се запише празно или очевидно грешно. */
function greshkataNa(imeyl: string): string {
  if (imeyl === '') return 'Напиши имейла, с който влизаш.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(imeyl)) return 'Това не прилича на имейл.';
  return '';
}

export function narisuvayVlizaneto(ekran: HTMLElement, opis: OpisNaVlizaneto): void {
  sloji(
    ekran,
    h`<div class="vlizane">
      <form class="vlizane-forma" data-vlizane novalidate>
        <h1>Coretovia</h1>
        <p class="pod-tablitsata">${
          opis.knigataEOtkrita
            ? 'Книгата е открита. Напиши имейла, с който пишеш в нея.'
            : 'Книгата е празна. Имейлът, с който влезеш пръв, я открива.'
        }</p>
        <label class="pole-red">
          <span class="ime">имейл</span>
          <input
            type="email"
            class="pole pole-v-prozoretsa"
            data-vlizane-imeyl
            value="${opis.stopaninat}"
            placeholder="ime@example.bg"
            autocomplete="email"
          >
        </label>
        <p class="greshka" data-vlizane-greshka></p>
        <button type="submit" class="malak" data-vlizane-vlez>Влез</button>
        <p class="pod-tablitsata">Няма парола и няма акаунт. Имейлът казва само кой пише в Журнала — нищо не тръгва навън.</p>
      </form>
      <!--
        ВРЪЩАНЕТО ОТ КОПИЕ Е ТУК, А НЕ САМО В ПРОФИЛ · и това не е удобство.

        Негово, 14.09 (запис 229): „Мога ли да попълвам моите вече?" Измерено
        същия ден, преди този вход да съществува: човек, който е изтрил данните
        си и влезе наново, ВЕЧЕ е записал първото събитие — откриването на
        Книгата, с нов час и нов хеш. Вратата тогава отказва с право: „Двете
        истории се разделят на seq 1. Различни журнали не се сливат."

        Тоест копието можеше да се върне САМО преди първото влизане — а дотогава
        нямаше откъде да се качи. Правилото на Вратата е вярно и не се пипа
        (правило 1: Журналът е само за добавяне); мястото на входа беше грешно.
      -->
      <details class="vlizane-kopie" data-kopie-otvori>
        <summary class="vlizane-kopie-glava">Имам резервно копие</summary>
        <p class="pod-tablitsata">Качи свалено копие на Журнала (.ndjson). Вратата проверява ЦЯЛАТА верига, преди да запише каквото и да е — разминае ли се на едно звено, НЕ ВЛИЗА НИЩО.</p>
        <p class="pod-tablitsata">Копие се връща в ПРАЗНА Книга. Влезеш ли пръв, първото събитие вече е твое и двете истории не се сливат.</p>
        <input type="file" accept=".ndjson,.jsonl,.json,.txt" data-vlizane-kopie>
        <p class="greshka" data-vlizane-kopie-vest></p>
      </details>
    </div>`,
  );

  const pole = ekran.querySelector<HTMLInputElement>('[data-vlizane-imeyl]');
  const kazhi = (dumi: string): void => {
    const myasto = ekran.querySelector<HTMLElement>('[data-vlizane-greshka]');
    if (myasto !== null) myasto.textContent = dumi;
  };
  ekran.querySelector<HTMLFormElement>('[data-vlizane]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const imeyl = pole?.value.trim() ?? '';
    const greshka = greshkataNa(imeyl);
    if (greshka !== '') {
      kazhi(greshka);
      return;
    }
    void opis.vlez(imeyl).then((dumi) => {
      if (dumi !== '') kazhi(dumi);
    });
  });
  // ВРЪЩАНЕТО · всяка стъпка казва какво е станало (правило 12): тихият отказ
  // тук е най-скъпият в програмата — човек мисли, че си е върнал годината.
  ekran.querySelector<HTMLInputElement>('[data-vlizane-kopie]')?.addEventListener('change', (e) => {
    const fayl = (e.target as HTMLInputElement).files?.[0];
    const myasto = ekran.querySelector<HTMLElement>('[data-vlizane-kopie-vest]');
    if (fayl === undefined) return;
    if (myasto !== null) myasto.textContent = 'Чета файла…';
    void (async () => {
      const dumi = await opis.vazstanovi(await fayl.text());
      if (myasto !== null) myasto.textContent = dumi;
    })();
  });
  pole?.focus();
}
