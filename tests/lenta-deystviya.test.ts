/**
 * ЧЕТВЪРТИЯТ РЕД · бутоните по теми, и онези, които СЛЯЗОХА от него.
 *
 * Негово, `zadanie/12-dopalneniya-08-09.md` (О1): „**Всички бутони се разделят
 * на теми с падащи менюта, колкото са темите в таба.**" И 11.09 (запис 193):
 * „**Създаването е отделно падащо меню навсякъде. Тук се събират и такта и
 * датата.**"
 *
 * И ПО-КЪСНАТА МУ ДУМА, 13.09 (запис 210), която мени построеното: „**Махни
 * всичките бутони за добавяне и скриване за Управление и един за СМетки**" —
 * тоест остава ПО ЕДИН превключвател на прозорец, а Създаването слиза в десния
 * бутон (`zadanie/03` B5).
 *
 * Тук се пази онова, което може да изчезне ТИХО. И то е две различни неща:
 *
 *   1. Бутон, който не е нито в тема, нито открит, нито изрично свален — той
 *      просто не се рисува, и никой не разбира, докато той не го потърси.
 *   2. Бутон, който е свален от ЕКРАНА, но е изтрит и от МОДЕЛА — а те са
 *      негови адреси от листа Управление и се изписват обратно в Книгата му
 *      (`src/kniga/pisane.ts`). Изтрит оттам, той изчезва и от Книгата.
 *
 * Затова каталогът остава ЦЯЛ, а екранът рисува подмножество.
 */

import { describe, expect, it } from 'vitest';
import { lentaNaDeystviyata } from '../app/reshetka/lenta-deystviya.js';
import { h } from '../app/reshetka/shablon.js';
import {
  BUTONI_NA_UPRAVLENIE,
  butoniBezTema,
  OTKRITITE,
  SVALENI_OT_EKRANA,
  TEMI_NA_BUTONITE,
} from '../src/model/osnova.js';

describe('четвъртият ред', () => {
  it('НИТО ЕДИН бутон не пада между темите · тема, открито или изрично свален', () => {
    // първо БРОЯТ · празен каталог би направил твърдението под него зелено
    expect(BUTONI_NA_UPRAVLENIE.length).toBeGreaterThan(10);
    expect(butoniBezTema(BUTONI_NA_UPRAVLENIE)).toEqual([]);
  });

  it('КАТАЛОГЪТ ОСТАВА ЦЯЛ · свалените са в Модела, защото Книгата ги иска', () => {
    // ПИН С РЪКА · без него празен списък би направил двата цикъла отдолу зелени
    expect(SVALENI_OT_EKRANA.length).toBe(6);
    expect(BUTONI_NA_UPRAVLENIE.length).toBe(14);
    const vKataloga = new Set(BUTONI_NA_UPRAVLENIE.map((b) => b.klyuch));
    // всеки свален още СЪЩЕСТВУВА · инак Книгата му би изгубила клетка (К1)
    for (const klyuch of SVALENI_OT_EKRANA) expect(vKataloga.has(klyuch)).toBe(true);
    // и нито един свален не стои едновременно в тема или открит
    const naEkrana = new Set([...TEMI_NA_BUTONITE.flatMap((t) => t.klyuchove), ...OTKRITITE]);
    for (const klyuch of SVALENI_OT_EKRANA) expect(naEkrana.has(klyuch)).toBe(false);
  });

  it('СВАЛЕНИ СА ТОЧНО добавянето и скриването · нищо друго не се губи мълчаливо', () => {
    expect([...SVALENI_OT_EKRANA].sort()).toEqual([
      'dobavyane',
      'dobavyane-na-sastoyanie',
      'skriy-diagrama',
      'skriy-prihodi',
      'skriy-razhodi',
      'skriy-tablitsa',
    ]);
  });

  it('ЕДИНСТВЕНИЯТ превключвател стои ОТКРИТ · заедно с такта и датата', () => {
    // негово, 13.09: „с по един бутон се пуска и изклюва добавянето"
    expect(OTKRITITE[0]).toBe('skriy-dela');
    expect([...OTKRITITE].sort()).toEqual(['nachalo-sega', 'period', 'skriy-dela', 'takt']);
    expect(OTKRITITE.length).toBe(4);
    const vMenyu = new Set(TEMI_NA_BUTONITE.flatMap((t) => t.klyuchove));
    for (const klyuch of OTKRITITE) expect(vMenyu.has(klyuch)).toBe(false);
  });

  it('лентата рисува ВСЕКИ НЕСВАЛЕН бутон · по веднъж · първо темите, после откритите', () => {
    // рисувачът се подменя с брояч: тестът пита КОЙ е поискан и в какъв ред,
    // без да разчита на HTML — формата е на екрана, редът е договор.
    const poiskani: string[] = [];
    lentaNaDeystviyata(BUTONI_NA_UPRAVLENIE, (b) => {
      poiskani.push(b.klyuch);
      return h``;
    });
    const ochakvani = [...TEMI_NA_BUTONITE.flatMap((tema) => tema.klyuchove), ...OTKRITITE];
    expect(poiskani).toEqual(ochakvani);
    expect(poiskani.length).toBe(BUTONI_NA_UPRAVLENIE.length - SVALENI_OT_EKRANA.length);
    // и НИТО ЕДИН свален не е стигнал до рисувача · пинът пази цикъла от празнота
    expect(SVALENI_OT_EKRANA.length).toBe(6);
    for (const klyuch of SVALENI_OT_EKRANA) expect(poiskani).not.toContain(klyuch);
  });

  it('нито един ключ не стои в две теми', () => {
    const vsichki = TEMI_NA_BUTONITE.flatMap((t) => t.klyuchove);
    expect(vsichki.length).toBe(new Set(vsichki).size);
  });
});
