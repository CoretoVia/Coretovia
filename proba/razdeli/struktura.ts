/**
 * СТРУКТУРАТА · десетият тип събитие, натиснат в истински браузър.
 *
 * ═══ ЗАЩО СВОЙ РАЗДЕЛ, И ЗАЩО НАКРАЯ ═══
 *
 * Тук се ДОБАВЯ колона в Имоти — тоест се мени изнесената Книга. Пуснат
 * преди проверките ѝ, той ги вали с ПРАВО: те броят вчерашната форма, а тя
 * вече е друга. Това не е дефект на екрана, а ред на прохода.
 *
 * Значи стъпката стои СЛЕД всичко, което чете формата на Книгата.
 */

import type { KonteksNaProhoda } from '../yadro/kontekst.ts';
import { tekstNa } from '../yadro/pomoshtni.ts';
import { ADRES } from '../yadro/server.ts';

/** Петте пътя на структурата · нова колона · глава · затваряне · подредба · таблица */
export async function blok1(ctx: KonteksNaProhoda): Promise<void> {
  const { stranitsa: p, broyach } = ctx;
  const razdel = 'Структурата · десетият тип';
  const proveri = (kakvo: string, vidyano: unknown, ochakvano: unknown): boolean =>
    broyach.proveri(razdel, kakvo, vidyano, ochakvano);

  await p.goto(`${ADRES}#/nastroyki`);

  //
  // Негово, 10.09: „Състоянията могат да са повече от едно едновременно и се
  // натрупват." Тук втората колона „Състояние" влиза НАИСТИНА, през екрана.
  const NOVA = 'tr[data-nova-kolona="imoti"]';
  await p.waitForSelector(NOVA);

  const predi = await tekstNa(p, '[data-sverka="imoti"]');

  await p.fill(`${NOVA} [data-nov-klyuch]`, 'etapNaStroezha');
  await p.fill(`${NOVA} [data-nova-glava]`, 'Състояние Строеж');
  await p.press(`${NOVA} [data-nova-glava]`, 'Enter');
  await p.waitForSelector('tr[data-tablitsa="imoti"][data-kolona="etapNaStroezha"]');
  proveri(
    'нова колона · влиза през екрана',
    await tekstNa(p, 'tr[data-kolona="etapNaStroezha"] [data-glava]'),
    'Състояние Строеж',
  );
  proveri(
    'и сверката пораства с ЕДНО',
    await tekstNa(p, '[data-sverka="imoti"]'),
    predi
      .replace(/живи (\d+)/, (_m, n) => `живи ${Number(n) + 1}`)
      .replace(/всички (\d+)/, (_m, n) => `всички ${Number(n) + 1}`),
  );

  // преименуване · ключът ОСТАВА
  await p.dblclick('tr[data-kolona="etapNaStroezha"] [data-glava]');
  await p.waitForSelector('tr[data-kolona="etapNaStroezha"] [data-glava] input');
  await p.fill('tr[data-kolona="etapNaStroezha"] [data-glava] input', 'Състояние Етап');
  await p.press('tr[data-kolona="etapNaStroezha"] [data-glava] input', 'Enter');
  await p.waitForFunction(
    () =>
      document
        .querySelector('tr[data-kolona="etapNaStroezha"] [data-glava]')
        ?.textContent?.trim() === 'Състояние Етап',
  );
  proveri(
    'преименувана глава · ключът е същият',
    await tekstNa(p, 'tr[data-kolona="etapNaStroezha"] td:nth-child(1)'),
    'etapNaStroezha',
  );

  // затваряне · СКРИВА се, не изчезва
  await p.click('tr[data-kolona="etapNaStroezha"] [data-zatvori]');
  await p.waitForSelector('tr[data-kolona="etapNaStroezha"].spryana');
  proveri(
    'затворена колона · редът е там, но сива',
    await tekstNa(p, 'tr[data-kolona="etapNaStroezha"] td:nth-child(5)'),
    'затворена',
  );

  // колона, която държи адреса на реда, НЕ се затваря · и го КАЗВА
  // менюто сменя таблицата · и това е ЕДИНСТВЕНИЯТ начин да се стигне до Обекти
  await p.selectOption('[data-izbor-tablitsa]', 'obekti');
  await p.waitForSelector('tr[data-tablitsa="obekti"][data-kolona="imot"]');
  proveri(
    'колоната с родителя не се затваря · и казва защо',
    await tekstNa(p, 'tr[data-tablitsa="obekti"][data-kolona="imot"] td:nth-child(5)'),
    'не се затваря · държи родителя на реда',
  );
}

/**
 * ЗАЛЕПЕНАТА ГЛАВА · ВЪВ ВСИЧКИТЕ ОСЕМ ПРОЗОРЕЦА.
 *
 * Негово, 13.09 в 23:45 (запис 223): „Поправи залепения хедър НАВСЯКЪДЕ."
 *
 * Стои НАКРАЯ, защото иска пълен екран: празната Книга няма таблици, а обход над
 * празно множество е зелен и сляп (обход Й). Дотогава Имотите, Служителите,
 * Продажбите и структурата вече са напълнили всеки прозорец.
 *
 * ЦЕНАТА, ПЛАТЕНА НА 14.09: поправката тръгна от `zakachiReshetkata`, а нея я
 * викат само пет прозореца. Профил, Настройки и ИИ не я викат — техните таблици
 * (достъпът, разписката на мострата, номенклатурите, находките, агентите)
 * отплуваха, и „навсякъде" щеше да остане наполовина, без никой да го мери.
 */
export async function blok2(ctx: KonteksNaProhoda): Promise<void> {
  const { stranitsa: p, broyach } = ctx;
  const razdel = 'Залепената глава · и осемте прозореца';
  const proveri = (kakvo: string, vidyano: unknown, ochakvano: unknown): boolean =>
    broyach.proveri(razdel, kakvo, vidyano, ochakvano);

  const OSEMTE = [
    'profil',
    'imoti',
    'upravlenie',
    'smetki',
    'sluzhiteli',
    'prodazhbi',
    'ii',
    'nastroyki',
  ];
  const redove: string[] = [];
  let vsichkiGlavi = 0;
  for (const klyuch of OSEMTE) {
    await p.goto(`${ADRES}#/${klyuch}`);
    await p.waitForSelector('main.prozorets thead tr');
    const vidyano = await p.evaluate(() => {
      const glavi = [
        ...document.querySelectorAll<HTMLTableRowElement>('main.prozorets thead tr'),
      ].filter((r) => r.cells.length > 0);
      // ВСЯКА КЛЕТКА, не само първата · на 14.09 точно това скри дефекта: правилото
      // `thead tr th[data-kolona] { position: relative }` не хващаше първата глава
      // (тя няма атрибута) и обходът я обявяваше за залепена, докато всички след
      // нея отплуваха.
      const nelepi = glavi.filter((r) =>
        [...r.cells].some((c) => getComputedStyle(c).position !== 'sticky'),
      );
      return { broy: glavi.length, nelepi: nelepi.length };
    });
    vsichkiGlavi += vidyano.broy;
    redove.push(`${klyuch} ${String(vidyano.nelepi)}`);
  }
  // ПЪРВО ОБХВАТЪТ · нулата долу значи нещо само ако е видяла глави (обход Й)
  proveri('обходът е видял глави в осемте прозореца', vsichkiGlavi > 20, true);
  proveri(
    'нито една незалепена глава · в нито един прозорец',
    redove.join(' · '),
    OSEMTE.map((k) => `${k} 0`).join(' · '),
  );
}
