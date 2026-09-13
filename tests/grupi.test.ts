/**
 * ЕДИН РЕД НА ЕДНО НЕЩО · групирането на повторенията по месеци.
 *
 * Негово, 13.09 (запис 213), точка 2: „Редовете с една и съща Задача или ред от
 * сметки НЕ СЕ ПРЕНАСЯ В НОВ РЕД ВСЕКИ МЕСЕЦ, а това става в самия календар
 * където всеки ред минава през всеки такт."
 *
 * Тук се пази онова, което лесно се чупи тихо: групата да не сложи заедно неща,
 * които само ПРИЛИЧАТ (един и същи разход на два имота), и подредбата вътре в
 * нея да е устойчива — инак редовете си разменят местата при всяко рисуване и
 * календарът мига без причина.
 */

import { describe, expect, it } from 'vitest';
import { grupite, type RedZaGrupirane, spesteniRedove } from '../src/smetach/grupi.js';

const red = (i: number, mesets: string, suma_st: number, data = ''): RedZaGrupirane => ({
  i,
  id: `r${String(i)}`,
  suma_st,
  mesets,
  data,
});

/** „Ток и вода" три месеца подред, плюс един наем · четири реда, две неща. */
const TOK_I_NAEM: readonly RedZaGrupirane[] = Object.freeze([
  red(0, '2026-01', -12000),
  red(1, '2026-02', -13000),
  red(2, '2026-03', -11000),
  red(3, '2026-01', 90000),
]);
const belegat = (r: RedZaGrupirane): string => (r.suma_st < 0 ? 'ток' : 'наем');

describe('групите на сметките', () => {
  it('ТРИТЕ МЕСЕЦА стават ЕДИН ред · и сборът им е сборът на групата', () => {
    const g = grupite(TOK_I_NAEM, belegat);
    expect(g.length).toBe(2);
    const tok = g.find((x) => x.beleg === 'ток')!;
    expect(tok.redove.length).toBe(3);
    expect(tok.sbor_st).toBe(-36000);
  });

  it('РАЗЛИЧНИТЕ неща НЕ се събират · дори когато си приличат', () => {
    const g = grupite(TOK_I_NAEM, belegat);
    expect(g.find((x) => x.beleg === 'наем')?.redove.length).toBe(1);
    expect(g.find((x) => x.beleg === 'наем')?.sbor_st).toBe(90000);
  });

  it('ГРУПА ОТ ЕДИН е пак група · един ред не е изключение', () => {
    const g = grupite([red(0, '2026-05', 100)], () => 'едно');
    expect(g.length).toBe(1);
    expect(g[0]?.redove.length).toBe(1);
    expect(g[0]?.parviyat.id).toBe('r0');
  });

  it('ПРЕДСТАВИТЕЛЯТ е НАЙ-РАННИЯТ · не първият дошъл', () => {
    const g = grupite(
      [red(0, '2026-09', 1), red(1, '2026-03', 2), red(2, '2026-06', 3)],
      () => 'едно',
    );
    expect(g[0]?.parviyat.id).toBe('r1');
    expect(g[0]?.redove.map((r) => r.id)).toEqual(['r1', 'r2', 'r0']);
  });

  it('ДЕНЯТ БИЕ МЕСЕЦА · ред с дата пада на нея, без дата — на първо число', () => {
    const g = grupite([red(0, '2026-03', 1, '2026-03-20'), red(1, '2026-03', 2)], () => 'едно');
    // r1 няма ден → 2026-03-01, тъй че е ПРЕДИ r0 на 20-и
    expect(g[0]?.redove.map((r) => r.id)).toEqual(['r1', 'r0']);
  });

  it('ДВА РЕДА В ЕДИН ДЕН не си разменят местата · подредбата е устойчива', () => {
    const a = grupite([red(5, '2026-03', 1), red(2, '2026-03', 2)], () => 'едно');
    const b = grupite([red(2, '2026-03', 2), red(5, '2026-03', 1)], () => 'едно');
    expect(a[0]?.redove.map((r) => r.i)).toEqual([2, 5]);
    expect(b[0]?.redove.map((r) => r.i)).toEqual([2, 5]);
  });

  it('СПЕСТЕНИТЕ РЕДОВЕ се броят · човек вижда, че нищо не е изчезнало', () => {
    expect(spesteniRedove(grupite(TOK_I_NAEM, belegat))).toBe(2);
    expect(spesteniRedove(grupite([], belegat))).toBe(0);
  });

  it('ПРАЗЕН СПИСЪК дава празни групи · без хвърляне', () => {
    expect(grupite([], belegat)).toEqual([]);
  });
});
