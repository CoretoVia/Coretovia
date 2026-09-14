/**
 * ПАПКАТА С ДОКУМЕНТИ · портът и вратата към браузъра.
 *
 * Негово, 14.09.2026 в 17:09 (запис 230) т.2, ДОСЛОВНО: „**Всеки обект си има
 * папка с документи, която е хубаво да се прикачи за по лесна работа с
 * документите клогато няма ИИ.**"
 *
 * ДВЕ РАЗЛИЧНИ ПРОВЕРКИ ЗА ДВЕ РАЗЛИЧНИ НЕЩА:
 *
 *   · тук се пита ДОГОВОРЪТ — какво КАЗВА програмата за една папка, и какво
 *     прави, когато браузърът не умее да отваря папки;
 *   · а проходът (раздел „3б5 · папката с документи") пита ПОВЕДЕНИЕТО в жив
 *     браузър, с подставена дръжка: прикачва, чете имената, обновява, откача.
 *
 * Диалогът за папка е на самата система и няма кой да го натисне в автоматизиран
 * браузър — затова и там се подставя. Проверява се програмата, не прозорчето.
 */

import { describe, expect, it } from 'vitest';
import { obobshtenieNaPapkata, type PapkaNaReda } from '../src/yadro/papka.js';
import { papkiteVBrauzara } from '../src/nositel/papki-web.js';

const PAPKA: PapkaNaReda = {
  redId: 'imot-1',
  ime: 'Документи на Имота',
  faylove: [
    { ime: 'Договор.pdf', golyamina: 12_345, promenen: '2026-09-14T10:00:00.000Z' },
    { ime: 'Акт 16.pdf', golyamina: 2_048, promenen: '2026-09-14T10:00:00.000Z' },
  ],
  chetima: true,
  zashtoNe: '',
};

describe('папката с документи · какво КАЗВА', () => {
  it('няма папка · казва се, а не се мълчи (правило 12)', () => {
    expect(obobshtenieNaPapkata(null)).toBe('няма прикачена папка');
  });

  it('прикачена и четима · името, броят и мястото', () => {
    expect(obobshtenieNaPapkata(PAPKA)).toBe('Документи на Имота · 2 файла · 14393 Б');
  });

  it('прикачена, но НЕ четима · казва ЗАЩО, не показва нула файла', () => {
    // позволението е ОТДЕЛНО от връзката · браузърът пита наново при ново пускане
    const chaka: PapkaNaReda = {
      ...PAPKA,
      faylove: [],
      chetima: false,
      zashtoNe: 'чака потвърждение · натисни „Обнови", за да я отвориш',
    };
    expect(obobshtenieNaPapkata(chaka)).toBe(
      'Документи на Имота · чака потвърждение · натисни „Обнови", за да я отвориш',
    );
    // и НЕ казва „0 файла" · нулата тук би значела „папката е празна"
    expect(obobshtenieNaPapkata(chaka)).not.toContain('0 файла');
  });

  it('липсващ размер не се брои като нула · той е „не знам"', () => {
    const bezRazmer: PapkaNaReda = {
      ...PAPKA,
      faylove: [{ ime: 'Скенер.pdf', golyamina: -1, promenen: '' }],
    };
    expect(obobshtenieNaPapkata(bezRazmer)).toBe('Документи на Имота · 1 файла · 0 Б');
  });
});

describe('носителят · браузър без диалог за папка', () => {
  const papkite = papkiteVBrauzara();

  it('КАЗВА, че не умее · вместо да се пробва и да падне', () => {
    // в Node няма `showDirectoryPicker` · точно както в Firefox, Safari и телефон
    expect(papkite.umee()).toBe(false);
  });

  it('прикачването връща `null`, не хвърля · отказът не е повреда', async () => {
    await expect(papkite.prikachi('imot-1')).resolves.toBeNull();
  });

  it('всяко четене оцелява без база · и връща празно, не грешка', async () => {
    await expect(papkite.spisak()).resolves.toEqual([]);
    await expect(papkite.chetiPak('imot-1')).resolves.toBeNull();
    await expect(papkite.otvori('imot-1', 'Договор.pdf')).resolves.toBe(false);
    await expect(papkite.otkachi('imot-1')).resolves.toBeUndefined();
  });
});
