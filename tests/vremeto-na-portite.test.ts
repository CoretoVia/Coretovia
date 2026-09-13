/**
 * ВРЕМЕТО НА ПОРТИТЕ · вътрешният таймаут стои ПОД външния.
 *
 * ЦЕНАТА, ПЛАТЕНА НА 13.09.2026. Пълен пробег даде **6 паднали от 719** —
 * `belezi` · `dnevnik` · `koren`; същите три файла, пуснати сами, дадоха
 * **19 от 19**. Това е най-опасният вид червено: то се появява и изчезва според
 * това колко е заета машината, тоест минава при мен и пада в CI.
 *
 * ПРИЧИНАТА, ИЗМЕРЕНА: тринайсет места пускаха `spawnSync(node, машината)` с
 * `timeout: 120_000`, а vitest убива самия тест на **петата** секунда. Числото
 * 120_000 никога не е било достижимо — то беше украшение. Щом машината се
 * натовари (82 успоредни работника, всеки от които иска нов Node процес),
 * шелването минава пет секунди и vitest отрязва целия файл с „test timed out",
 * без да каже коя машина е бавила.
 *
 * ИНВАРИАНТЪТ, който този тест пази: **времето на подпроцеса е по-малко от
 * времето на теста.** Тогава при зависване `spawnSync` прекъсва ПРЪВ и грешката
 * назовава машината. Обърне ли се редът пак — тихо, при следваща промяна на
 * конфига — портата пада тук, а не през седмица в CI.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VREME_NA_MASHINATA } from '../stroezh/vreme-na-mashinata.js';

const KONFIG = 'vitest.config.ts';
const TESTOVE = 'tests';

/** Числото се ЧЕТЕ от конфига, не се преписва тук (правило 14 · един факт, един дом). */
function vremetoNaTesta(): number {
  const t = readFileSync(KONFIG, 'utf8');
  const m = /testTimeout:\s*([\d_]+)/.exec(t);
  if (m?.[1] === undefined) throw new Error(`${KONFIG} няма testTimeout`);
  return Number(m[1].replaceAll('_', ''));
}

/**
 * Всяко голо число, дадено на подпроцес · файл и стойност.
 *
 * Чете се КОД, не коментари. Първият пробег на тази порта се спъна в собствения
 * ѝ разказ: числото 120_000, цитирано в главата ѝ като пример за счупеното,
 * беше преброено като живо място. Обяснение, което вали портата, обясняваща го,
 * е шум — затова коментарните редове се прескачат.
 */
function goliteTaymauti(): readonly { fayl: string; stoynost: number }[] {
  const nameren: { fayl: string; stoynost: number }[] = [];
  for (const ime of readdirSync(TESTOVE)) {
    if (!ime.endsWith('.test.ts')) continue;
    const t = readFileSync(join(TESTOVE, ime), 'utf8');
    if (!t.includes('spawnSync') && !t.includes('execFileSync')) continue;
    for (const red of t.split('\n')) {
      const gol = red.trim();
      if (gol.startsWith('*') || gol.startsWith('//') || gol.startsWith('/*')) continue;
      for (const m of red.matchAll(/timeout:\s*([\d_]+)/g)) {
        const s = m[1];
        if (s !== undefined) nameren.push({ fayl: ime, stoynost: Number(s.replaceAll('_', '')) });
      }
    }
  }
  return nameren;
}

describe('времето на портите · петнайсетата мярка', () => {
  it('ВРЕМЕТО НА МАШИНАТА стои ПОД времето на теста · инак вътрешното число е украшение', () => {
    const vanshno = vremetoNaTesta();
    expect(VREME_NA_MASHINATA).toBeLessThan(vanshno);
    // и не толкова малко, че бавна машина да пада без да е зависнала
    expect(VREME_NA_MASHINATA).toBeGreaterThan(vanshno / 3);
  });

  it('НИТО ЕДИН тест не дава на подпроцес повече време, отколкото има сам', () => {
    const vanshno = vremetoNaTesta();
    const nad = goliteTaymauti().filter((x) => x.stoynost >= vanshno);
    expect(nad.map((x) => `${x.fayl} · ${String(x.stoynost)}ms ≥ ${String(vanshno)}ms`)).toEqual(
      [],
    );
  });

  it('подразбраните ПЕТ секунди не се връщат тихо · конфигът казва своето число', () => {
    // Без ред в конфига vitest мълчи и дава 5000 — точно това счупи трите порти.
    expect(vremetoNaTesta()).toBeGreaterThanOrEqual(15_000);
    expect(readFileSync(KONFIG, 'utf8')).toContain('hookTimeout');
  });
});
