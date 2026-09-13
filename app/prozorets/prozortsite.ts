/**
 * ОСЕМТЕ ПРОЗОРЕЦА · кой файл рисува кой ключ · един дом (правило 14).
 * Осемте са построени; онова, което още го няма ВЪТРЕ в тях, го казват сами.
 */

import type { KlyuchNaProzorets } from '../../src/model/klyuchove.js';
import type { KonteksNaEkrana } from '../kontekst.js';
import { narisuvayII } from './ii.js';
import { narisuvayImoti } from './imoti.js';
import { narisuvayNastroyki } from './nastroyki.js';
import { narisuvayProdazhbi } from './prodazhbi.js';
import { narisuvaySluzhiteli } from './sluzhiteli.js';
import { narisuvaySmetki } from './smetki.js';
import { narisuvayProfil } from './profil.js';
import { narisuvayUpravlenie } from './upravlenie.js';

/**
 * БЕЗ `default` · ИЗЧЕРПАТЕЛНОСТТА я пази TypeScript.
 *
 * Дотук тук стоеше `default: narisuvayOstanalite(k, klyuch)` — рисувачът на
 * прозорец без свой екран. Но всичките ОСЕМ ключа имат свой `case` (К1 · осем са,
 * „само това и нищо повече или по малко"), тъй че клонът беше НЕДОСТИЖИМ, а
 * `HOD_NA_PROZORETSA` — празен обект.
 *
 * И `chistota` не го хващаше: тя брои „изнесено име без викащ", а викащ формално
 * ИМАШЕ. Оттук нататък мярката е по-строга по конструкция — щом `default` го няма,
 * нов ключ в `PROZORTSI` без свой `case` пада на `typecheck`, не мълчи с обща
 * страница „още не е построен".
 *
 * Ако някой ден пак има непостроен прозорец (ход 8.0 · единайсетте), той получава
 * свой `case` с думите си — там, където се вижда, а не в общ клон, който покрива
 * всичко и не казва нищо.
 */
export function narisuvayProzorets(klyuch: KlyuchNaProzorets, k: KonteksNaEkrana): void {
  switch (klyuch) {
    case 'profil':
      narisuvayProfil(k);
      return;
    case 'imoti':
      narisuvayImoti(k);
      return;
    case 'nastroyki':
      narisuvayNastroyki(k);
      return;
    case 'ii':
      narisuvayII(k);
      return;
    case 'upravlenie':
      narisuvayUpravlenie(k);
      return;
    case 'smetki':
      narisuvaySmetki(k);
      return;
    case 'sluzhiteli':
      narisuvaySluzhiteli(k);
      return;
    case 'prodazhbi':
      narisuvayProdazhbi(k);
      return;
  }
}
