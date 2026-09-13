/**
 * Т16 · ТРИ ФУНКЦИИ ВЪРХУ ОБЕКТ, ЧЕТИРИ ВЪРХУ ИМОТ · `zadanie/03` B5.
 *
 * Негово, ДОСЛОВНО: „Да може тук да се ползва десния бутон и да се дава опция за
 * Всеки Имот или Обект да се избира и добавят **тези 3 функции** за добавяне, а
 * за Имота да има **4**, но 4тия избор Голямо дело да е неактивно, а само да се
 * показва с по затъмнен текст и да се отключва за избор след като се даде
 * Състояние на Имота: Строителство."
 *
 * „Тези 3 функции" сочи B1–B3 ПОИМЕННО: Добави Дело · Добави Среща · Добави
 * Преписка. Те не са общото меню „Създаване" — то ражда нещо ново където и да си;
 * тези три раждат ЗАДАЧА КЪМ избрания ред и видът ѝ идва готов.
 *
 * ЦЕНАТА, ПЛАТЕНА ДОТУК: редът стоеше отворен от 08.09 и описанието му казваше,
 * че „ходът не е построен". Половината беше построена (десният бутон върху ред
 * работи от 12.09), но РАЗЛИКАТА 3 срещу 4 я нямаше: и върху Имот, и върху Обект
 * излизаше един и същи списък. Ред, чиято половина работи, е най-лесният за
 * подминаване.
 */

import { describe, expect, it } from 'vitest';
import { tochkiteNaRoditelya } from '../app/reshetka/sazdavaneto.js';
import type { KonteksNaEkrana } from '../app/kontekst.js';
import { MODEL, NOMENKLATURA } from '../src/model/osnova.js';

/** Колкото контекст иска `tochkiteNaRoditelya` · номенклатурата и нищо друго. */
function kontekstat(sVidove: boolean): KonteksNaEkrana {
  const stoynosti = sVidove
    ? [
        { nomer: 1, tekst: 'Дело', spryana: false },
        { nomer: 2, tekst: 'Среща', spryana: false },
        { nomer: 3, tekst: 'Преписка', spryana: false },
      ]
    : [];
  return {
    porta: {
      ogledalo: () => ({
        nomenklaturi: new Map([[NOMENKLATURA.vidNaZadacha, { stoynosti }]]),
        model: MODEL,
      }),
    },
  } as unknown as KonteksNaEkrana;
}

const IMOT = { tablitsa: 'imoti', id: 'imot:i1' };
const OBEKT = { tablitsa: 'obekti', id: 'obekt:o1' };

describe('Т16 · десният бутон върху родител', () => {
  it('ВЪРХУ ОБЕКТ · ТРИ функции · Дело · Среща · Преписка', () => {
    const t = tochkiteNaRoditelya(kontekstat(true), OBEKT, false);
    expect(t.map((x) => x.ime)).toEqual(['Добави Дело', 'Добави Среща', 'Добави Преписка']);
    expect(t.every((x) => x.razreshena)).toBe(true);
  });

  it('ВЪРХУ ИМОТ · ЧЕТИРИ · и четвъртата е Голямо дело', () => {
    const t = tochkiteNaRoditelya(kontekstat(true), IMOT, false);
    expect(t.length).toBe(4);
    expect(t[3]?.ime).toBe('Голямо дело');
  });

  it('ЧЕТВЪРТАТА е СИВА · и казва, че чака Състояние Строеж (негово B4)', () => {
    const t = tochkiteNaRoditelya(kontekstat(true), IMOT, false);
    expect(t[3]?.razreshena).toBe(false);
    expect(t[3]?.zashto).toContain('Строеж');
  });

  it('и причината СЕ МЕНИ, когато Състоянието вече е Строеж', () => {
    // две различни неща спират пункта · човек трябва да знае кое от тях
    const predi = tochkiteNaRoditelya(kontekstat(true), IMOT, false)[3];
    const sled = tochkiteNaRoditelya(kontekstat(true), IMOT, true)[3];
    expect(sled?.razreshena).toBe(false);
    expect(sled?.zashto).not.toBe(predi?.zashto);
    expect(sled?.zashto).toContain('11б');
  });

  it('БЕЗ НОМЕНКЛАТУРА трите са СИВИ · и казват защо, вместо да изчезнат', () => {
    const t = tochkiteNaRoditelya(kontekstat(false), OBEKT, false);
    expect(t.length).toBe(3);
    expect(t.every((x) => !x.razreshena)).toBe(true);
    expect(t[0]?.zashto).toContain('Вид на задача');
  });

  it('ВИДЪТ идва ГОТОВ · човек не го избира наново за всяко от трите', () => {
    const t = tochkiteNaRoditelya(kontekstat(true), OBEKT, false);
    // ключовете носят името на вида · всеки е свой пункт, не един общ „Задача"
    expect(t.map((x) => x.klyuch)).toEqual(['rod-Дело', 'rod-Среща', 'rod-Преписка']);
  });
});
