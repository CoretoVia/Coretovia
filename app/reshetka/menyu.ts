/**
 * ДЯСНОТО МЕНЮ · пунктовете идват от каталога (`porta.butoniZa`), с
 * предусловията, сметнати върху избрания ред: неразрешеният пункт стои,
 * но е недостъпен и КАЗВА защо (правило 12).
 *
 * Двата слушателя на `document` (Escape · клик отвън) се пазят поименно и се
 * свалят при затваряне — новият възел на тялото не ги носи, а `once` би паднал
 * на първия произволен клавиш.
 */

import { h, sloji } from './shablon.js';

export interface Tochka {
  readonly klyuch: string;
  readonly ime: string;
  readonly razreshena: boolean;
  readonly zashto: string;
  readonly deystvie: () => void;
}

let priKlavish: ((e: KeyboardEvent) => void) | null = null;
let priKlik: (() => void) | null = null;

export function zatvoriMenyuto(): void {
  document.querySelector('[data-menyu]')?.remove();
  if (priKlavish) document.removeEventListener('keydown', priKlavish);
  if (priKlik) document.removeEventListener('click', priKlik);
  priKlavish = null;
  priKlik = null;
}

export function pokazhiMenyu(x: number, y: number, tochki: readonly Tochka[]): void {
  zatvoriMenyuto();
  const ul = document.createElement('ul');
  ul.className = 'kontekstno-menyu';
  ul.dataset['menyu'] = '';
  ul.style.left = `${x}px`;
  ul.style.top = `${y}px`;
  sloji(
    ul,
    h`${tochki.map(
      (t) =>
        h`<li><button type="button" data-tochka="${t.klyuch}" ${t.razreshena ? '' : 'disabled'}>${t.ime}${
          t.razreshena ? '' : h` <span class="zashto">${t.zashto}</span>`
        }</button></li>`,
    )}`,
  );
  for (const t of tochki) {
    ul.querySelector<HTMLButtonElement>(
      `[data-tochka="${CSS.escape(t.klyuch)}"]`,
    )?.addEventListener('click', () => {
      zatvoriMenyuto();
      t.deystvie();
    });
  }
  priKlavish = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') zatvoriMenyuto();
  };
  priKlik = (): void => zatvoriMenyuto();
  document.addEventListener('keydown', priKlavish);
  // клик отвън затваря · закача се след текущото събитие, за да не затвори от собствения си клик
  const klik = priKlik;
  setTimeout(() => {
    if (priKlik === klik) document.addEventListener('click', klik);
  }, 0);
  document.body.append(ul);
  /**
   * МЕНЮТО ВЛИЗА В ЕКРАНА · инак долните пунктове стават НЕДОСТИЖИМИ.
   *
   * НАМЕРЕНО НА 14.09.2026 от собствения проход, докато се добавяше пунктът за
   * папката (негово, запис 230 т.2): натискането на ред в долната половина
   * отваряше меню, чиито последни пунктове са под ръба на прозореца. Playwright
   * го каза с думи — „element is outside of the viewport" — но за човек това не
   * е съобщение, а изчезнала функция: пунктът го има, вижда се в списъка и не
   * може да се натисне.
   *
   * ЧИСЛОТО НЕ Е ЗАКОВАНО · мери се самото меню след като е сложено, защото
   * височината му зависи от броя пунктове (днес шестнайсет върху Имот, утре
   * повече) и от текста на сивите, който се пренася на втори ред.
   *
   * ОБРЪЩА СЕ НАГОРЕ, НЕ СЕ СВИВА · меню, което се лепи за долния ръб, покрива
   * реда, върху който човек току-що е натиснал. Обърнато нагоре, то стои НАД
   * курсора и редът остава видим — същото решение, което подсказката вече взе
   * (`app/reshetka/podskazka.ts` · `polozhi`).
   */
  const RAB_PX = 8;
  const r = ul.getBoundingClientRect();
  if (r.bottom > window.innerHeight - RAB_PX) {
    const nagore = y - r.height;
    ul.style.top = `${Math.max(RAB_PX, nagore >= RAB_PX ? nagore : window.innerHeight - RAB_PX - r.height)}px`;
  }
  if (r.right > window.innerWidth - RAB_PX) {
    ul.style.left = `${Math.max(RAB_PX, window.innerWidth - RAB_PX - r.width)}px`;
  }
  ul.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();
}
