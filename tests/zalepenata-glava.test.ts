/**
 * Т56 · ЗАЛЕПЕНАТА ГЛАВА И ХОРИЗОНТАЛНИЯТ СКРОЛ · инвариантът, който се чупи тихо.
 *
 * Негово, 08.09 (запис 64), ДОСЛОВНО: „и за таблицата, и за диаграмата
 * хоризонталния скрол. **Важно е това, скролът**" · и „**отгоре е филтърът**",
 * тоест горните редове трябва да СТОЯТ, докато таблицата тече под тях.
 *
 * ЦЕНАТА, КОЯТО ДЪЛГЪТ ПОМНИ. Блокът носи `overflow-x: auto` заради хоризонталния
 * скрол, а CSS не позволява едната ос да е `auto`, а другата `visible` — щом
 * едната не е `visible`, другата става `auto`. Значи блокът Е скролер и по
 * вертикала, само че мълчаливо и без таван: страницата скролваше отгоре, а
 * `position: sticky` вътре нямаше за какво да се хване. Резултатът беше главата
 * да е `position: static` и просто да избягва нагоре.
 *
 * ЗАЩО ТЕСТ, СЛЕД КАТО ПРОХОДЪТ ГО МЕРИ В БРАУЗЪР. Проходът мери РЕЗУЛТАТА и е
 * бавен; тук се пази СЪСТАВЪТ, който го дава, и то за секунди. Трите части са
 * свързани и падне ли една, другите две мълчат:
 *
 *   1. Блокът има таван на височината — инак няма какво да скролва вътре и
 *      скролът пак пада на прозореца отгоре.
 *   2. Клетките на главата са залепени — инак стоят статични, както бяха.
 *   3. Машината, която мери отместванията, се ВИКА — инак `top` остава `auto`
 *      и залепването не значи нищо.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const STIL = readFileSync('app/stil.css', 'utf8');
const KOLONITE = readFileSync('app/reshetka/kolonite.ts', 'utf8');
const RESHETKATA = readFileSync('app/reshetka/reshetka.ts', 'utf8');

/** Тялото на едно CSS правило · празно, когато селекторът го няма. */
function praviloto(selektor: string): string {
  const i = STIL.indexOf(`${selektor} {`);
  if (i === -1) return '';
  return STIL.slice(i, STIL.indexOf('}', i));
}

describe('Т56 · залепената глава и хоризонталният скрол', () => {
  it('БЛОКЪТ е скролерът · и по двете оси, с таван на височината', () => {
    const p = praviloto('.darvo-blok');
    expect(p, 'няма правило за `.darvo-blok`').not.toBe('');
    expect(p).toContain('overflow: auto');
    expect(p).toMatch(/max-height:\s*\d/);
  });

  it('ГЛАВАТА се лепи · и стои НАД залепената лява колона', () => {
    const glava = praviloto('.ekran .darvo-blok .reshetka.darvo .zalepena-glava');
    const lyava = praviloto('.ekran .darvo-blok .reshetka.darvo .zalepena-kolona');
    expect(glava).toContain('position: sticky');
    expect(lyava).toContain('position: sticky');
    // ъгълът — клетката, която е и в главата, и в лявата част — е на главата
    const nomer = (p: string): number => Number(/z-index:\s*(\d+)/.exec(p)?.[1] ?? '0');
    expect(nomer(glava)).toBeGreaterThan(nomer(lyava));
  });

  it('МАШИНАТА мери отместванията · и се ВИКА след всяко рисуване', () => {
    // без нея `top` остава `auto` и залепването не значи нищо
    expect(KOLONITE).toContain('export function zalepiGlavata');
    expect(KOLONITE).toContain("kletka.classList.add('zalepena-glava')");
    expect(KOLONITE).toMatch(/kletka\.style\.top =/);
    expect(RESHETKATA).toContain('zalepiGlavata(k.tyalo)');
  });

  it('ОТМЕСТВАНЕТО се МЕРИ, не се пише в стила · три реда с променлива височина', () => {
    // сгрешено число тук лепи втория ред ВЪРХУ първия и се вижда чак при скрол
    expect(KOLONITE).toContain('getBoundingClientRect().height');
    expect(praviloto('.ekran .darvo-blok .reshetka.darvo .zalepena-glava')).not.toMatch(
      /top:\s*\d/,
    );
  });

  it('ПОСЛЕДНИЯТ ред на главата носи чертата · под нея почват данните', () => {
    expect(KOLONITE).toContain("classList.add('posledna-zalepena-glava')");
    expect(
      praviloto('.ekran .darvo-blok .reshetka.darvo .zalepena-glava.posledna-zalepena-glava'),
    ).toContain('border-bottom');
  });
});
