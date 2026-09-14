/**
 * ПОДТАБОВЕТЕ на един прозорец · екранни, с памет, нула събития.
 *
 * Негово (05.09 т.2): „В таба НАП се намира ДДС…" — „таб" при него е и ПОДТАБ,
 * както Главни Настройки има подтаб Номенклатури. Осемте прозореца си остават
 * осем (K1): подтабът е изглед на един и същи лист, не девети прозорец.
 */

import { chetiEkranno, zapomniEkranno } from './pamet-ekran.js';
import { h, type Zapechatan } from './shablon.js';

/**
 * ДЕСЕТТЕ ТРАКА НА ЛЕНТАТА · същото число, което стилът дава на `--trakove`.
 *
 * Живее ТУК, защото тук се смятат спановете; стилът го чете от своята страна.
 * Разминат ли се, лентата на подтабовете свършва по-рано или се пренася на
 * втори ред — и двете се виждат веднага, тъй че проходът ги хваща.
 */
const TRAKOVE_NA_LENTATA = 10;

export interface Podtab {
  readonly klyuch: string;
  readonly ime: string;
}

/** Кой подтаб е отворен · помни се на устройството, не в Журнала. */
export function tekushtPodtab(pamet: string, tabove: readonly Podtab[]): string {
  const zapomnen = chetiEkranno<string>(pamet, tabove[0]?.klyuch ?? '');
  return tabove.some((t) => t.klyuch === zapomnen) ? zapomnen : (tabove[0]?.klyuch ?? '');
}

/**
 * КОЛКО ТРАКА ЗАЕМА ВСЕКИ ПОДТАБ · за да запълни лентата ТОЧНО.
 *
 * Подложката на таблото е десет трака и всяка лента трябва да ги покрие точно
 * (`app/stil.css` · „ЧЕТИРИТЕ ЛЕНТИ НА СМЕТКИ · ЕДНА МРЕЖА"). Дотук това стоеше
 * в стила като `grid-column: span 2` — вярно за ПЕТТЕ подтаба на Сметки и
 * невярно за всеки друг брой. Управление получи ТРИ (негово, 14.09 · записи
 * 226 · 227) и с по два трака лентата щеше да свърши на шест от десет.
 *
 * Тук числото се СМЯТА: цялата част на всеки, а остатъкът отива в първите.
 * Пет подтаба → 2·5. Три → 4 + 3 + 3. Седем → 2 + 2 + 2 + 1 + 1 + 1 + 1.
 * Сумата е винаги точно `trakove` — това е инвариантът, не съвпадението.
 */
function trakoveNaPodtabovete(broy: number, trakove: number): readonly number[] {
  if (broy <= 0) return [];
  const tsyalo = Math.floor(trakove / broy);
  const ostatak = trakove % broy;
  return Array.from({ length: broy }, (_x, i) => tsyalo + (i < ostatak ? 1 : 0));
}

export function podtaboveHTML(tabove: readonly Podtab[], tekusht: string): Zapechatan {
  const trakove = trakoveNaPodtabovete(tabove.length, TRAKOVE_NA_LENTATA);
  return h`<nav class="podtabove" data-podtabove>${tabove.map(
    (t, i) =>
      h`<button type="button" class="podtab${t.klyuch === tekusht ? ' tekusht' : ''}" data-podtab="${t.klyuch}" data-traka="${String(trakove[i] ?? 1)}">${t.ime}</button>`,
  )}</nav>`;
}

/** Закача превключването · след всяко рисуване, както всичко останало на екрана. */
export function zakachiPodtabove(koren: HTMLElement, pamet: string, prerisuvay: () => void): void {
  for (const b of koren.querySelectorAll<HTMLButtonElement>('[data-podtab]')) {
    b.addEventListener('click', () => {
      zapomniEkranno(pamet, b.dataset['podtab'] ?? '');
      prerisuvay();
    });
  }
}
