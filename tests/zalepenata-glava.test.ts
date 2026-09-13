/**
 * Т56 · ЗАЛЕПЕНАТА ГЛАВА · инвариантът, който се чупи ТИХО.
 *
 * Негово, 08.09 (запис 64), ДОСЛОВНО: „и за таблицата, и за диаграмата
 * хоризонталния скрол. **Важно е това, скролът**" · и „**отгоре е филтърът**".
 * И отново на 13.09 в 23:45 (запис 223), със снимка на счупения екран: „Поправи
 * залепения хедър НАВСЯКЪДЕ… разшири заключените редове с еднаква ширина с
 * таблицата и календар под тях."
 *
 * ═══ ЦЕНАТА, ПЛАТЕНА НА 14.09.2026 ═══
 *
 * Този файл СЪЩЕСТВУВАШЕ и беше ЗЕЛЕН над счупения екран. Той пазеше състав,
 * който вече не даваше резултата:
 *
 *   · пазеше „блокът има таван на височината" — а точно таванът беше ВТОРИЯТ
 *     вертикален скролер, заради който главата се плъзгаше под лентите;
 *   · питаше правилото `.zalepena-glava` дали казва `position: sticky` — и то го
 *     казваше. Само че ДРУГО правило, с пет класа срещу неговите четири, го
 *     надбягваше: `thead tr th:not(.zalepena-kolona) { position: relative }`.
 *     Тоест всяка глава от `<th>` беше незалепена, а тестът мълчеше.
 *
 * ЗАТОВА ОТТУК НАТАТЪК СЕ ПАЗИ И ОТСЪСТВИЕТО. Правило, което казва вярното, не
 * стига; трябва да няма второ, което го отменя. Проходът мери РЕЗУЛТАТА в жив
 * браузър (раздел „Залепената глава · и осемте прозореца"); тук се пази съставът,
 * и то за секунди.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const STIL = readFileSync('app/stil.css', 'utf8');
const KOLONITE = readFileSync('app/reshetka/kolonite.ts', 'utf8');
const GLAVNIYAT = readFileSync('app/main.ts', 'utf8');

/**
 * Стилът БЕЗ печатния блок · на хартия правилата НАРОЧНО са други.
 *
 * Блокът се ИЗРЯЗВА, не се реже отпред: `@media print` стои по средата на листа,
 * а половината правила, които този тест пита, са след него. Първият опит
 * отряза всичко от него нататък и тестът питаше празнота — а празнотата
 * „не съдържа" каквото и да е, тоест щеше да е зелен по грешна причина.
 */
const NA_EKRANA = ((): string => {
  const a = STIL.indexOf('@media print {');
  if (a === -1) return STIL;
  const b = STIL.indexOf('\n}\n', a);
  if (b === -1) throw new Error('печатният блок няма край на нулева колона');
  return STIL.slice(0, a) + STIL.slice(b + 3);
})();

/**
 * Тялото на едно CSS правило · празно, когато селекторът го няма.
 *
 * ГЛЕДА САМО ЕКРАННАТА ЧАСТ. Няколко селектора се повтарят в `@media print` с
 * друга стойност (там тялото е `display: block`, защото на хартия няма прозорец
 * с височина). Наивното `indexOf` намираше ПЪРВОТО, тоест печатното, и тестът
 * питаше грешното правило — намерено, докато се пишеше самият тест.
 */
function praviloto(selektor: string): string {
  const i = NA_EKRANA.indexOf(`${selektor} {`);
  if (i === -1) return '';
  return NA_EKRANA.slice(i, NA_EKRANA.indexOf('}', i));
}

describe('Т56 · залепената глава и хоризонталният скрол', () => {
  it('ЕДИН СКРОЛЕР · тялото на таба не скролва, `.tyalo-skrol` скролва по двете оси', () => {
    // тялото на прозорец с решетка НЕ е скролер · инак стават два вложени
    expect(praviloto('.ekran > .prozorets:has(> .tyalo-s-reshetka)')).toContain('overflow: hidden');
    // и тялото е колона с височината на прозореца · инак скролерът няма докъде да расте
    const tyalo = praviloto('.prozorets-tyalo.tyalo-s-reshetka');
    expect(tyalo).toContain('display: flex');
    expect(tyalo).toContain('flex-direction: column');
    expect(tyalo).toContain('min-height: 0');
    // ЕДИНСТВЕНИЯТ скролер · и по двете оси
    const skrol = praviloto('.tyalo-skrol');
    expect(skrol).toContain('overflow: auto');
    expect(skrol).toContain('min-height: 0');
    // и блокът вътре ПРЕСТАВА да е скролер · таванът му беше вторият
    const blok = praviloto('.tyalo-s-reshetka .darvo-blok');
    expect(blok).toContain('overflow: visible');
    expect(blok).toContain('max-height: none');
  });

  it('ЛЕНТИТЕ са ИЗВЪН скролера · не се лепят, защото няма за какво', () => {
    // `position: sticky` с z-index 5 над главата беше онова, което я скриваше
    const lenti = praviloto('.tyalo-s-reshetka > .zalepeno');
    expect(lenti).toContain('position: static');
    expect(lenti).toContain('z-index: auto');
  });

  it('ГЛАВАТА се лепи · и НИЩО не я отменя', () => {
    const glava = praviloto('.ekran .darvo-blok .reshetka.darvo .zalepena-glava');
    const lyava = praviloto('.ekran .darvo-blok .reshetka.darvo .zalepena-kolona');
    expect(glava).toContain('position: sticky');
    expect(lyava).toContain('position: sticky');
    // ЪГЪЛЪТ · клетката, която е и глава, и колона · стои над ДВЕТЕ
    const nomer = (p: string): number => Number(/z-index:\s*(\d+)/.exec(p)?.[1] ?? '0');
    const agal = praviloto('.ekran .darvo-blok .reshetka.darvo .zalepena-glava.zalepena-kolona');
    expect(nomer(agal)).toBeGreaterThan(nomer(glava));
    expect(nomer(agal)).toBeGreaterThan(nomer(lyava));
    // И ОТСЪСТВИЕТО · нито едно правило не връща главата на `relative` или `static`.
    // Само на ЕКРАНА: на хартия това е нарочно, инак залепеното се надпечатва.
    expect(
      NA_EKRANA,
      'правило с по-висока специфичност пак отлепя главата · точно това беше дефектът',
    ).not.toMatch(/thead tr th[^{]*\{\s*\n\s*position: (relative|static);/);
  });

  it('НАВСЯКЪДЕ · машината минава през ВСЯКА таблица и се вика за ВСЕКИ прозорец', () => {
    // без нея `top` остава `auto` и залепването не значи нищо
    expect(KOLONITE).toContain('export function zalepiGlavata');
    expect(KOLONITE).toContain("kletka.classList.add('zalepena-glava')");
    expect(KOLONITE).toMatch(/kletka\.style\.top =/);
    // ВСЯКА таблица, не само дървото · в подтаб НАП три таблици нямаха глава
    expect(KOLONITE).toContain("querySelectorAll<HTMLTableElement>('table')");
    // и се вика от ГЛАВНИЯ файл, след рисуването на всеки прозорец · дотук стоеше
    // в `zakachiReshetkata`, а нея я викат само пет от осемте
    expect(GLAVNIYAT).toContain('zalepiGlavata(tyalo)');
    expect(GLAVNIYAT).toContain('narisuvayProzorets(klyuch, k)');
    expect(GLAVNIYAT.indexOf('zalepiGlavata(tyalo)')).toBeGreaterThan(
      GLAVNIYAT.indexOf('narisuvayProzorets(klyuch, k)'),
    );
    // и общото правило пита ТЯЛОТО НА ТАБА, не отделен блок в него
    expect(praviloto('.ekran main.prozorets table thead .zalepena-glava')).toContain(
      'position: sticky',
    );
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

  it('ОТРЯЗАНИЯТ ТЕКСТ казва себе си цял · и в двата режима на хелпа', () => {
    // негово, запис 223: „при задържане на полето да се показва целия текст…
    // но и в двата режима на Хелпа и начален и нормален"
    expect(KOLONITE).toContain('export function pokazhiOtryazanoto');
    // пита се БРАУЗЪРЪТ, не се брои на знаци
    expect(KOLONITE).toContain('scrollWidth > kletka.clientWidth');
    // и подсказката е СЪЩИЯТ механизъм · степента не се пита никъде тук
    expect(KOLONITE).toContain("kletka.dataset['podskazka'] = tsyal");
    expect(KOLONITE, 'степента на хелпа не бива да гаси отрязаното').not.toContain(
      'stepenNaPomoshtta',
    );
    // и се вика за ВСЕКИ прозорец, не само за онези с решетка
    expect(GLAVNIYAT).toContain('pokazhiOtryazanoto(tyalo)');
  });
});
