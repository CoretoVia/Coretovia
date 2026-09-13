import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { napishiKniga, prochetiKniga } from '../../src/kniga/ooxml.ts';
import { opisOtProcheten } from '../yadro/kniga.ts';
import type { KonteksNaProhoda } from '../yadro/kontekst.ts';
import { natisniButon, tekstNa, tekstoveNa } from '../yadro/pomoshtni.ts';
import { denOtMesetsa } from '../yadro/kalendar.ts';
import { ADRES } from '../yadro/server.ts';

/** променената Книга на прохода · във временната папка, не в дървото (правило 21) */
const S_ZADACHA = join(tmpdir(), 'coretovia-proba-zadacha.xlsx');
const UPRAVLENIE = 'УправлениеДелаПреписки';
/** грешката на Управление · след залепената част, за да не е гол белег (честност Б) */
const _GRESHKA = '[data-zalepeno="upravlenie"] + [data-greshka]';
/** еврото по нормата му · тясна пауза (U+202F) между хилядите и пред знака */
const EVRO_250000 = '250\u202F000,00\u202F€';

/**
 * Датите на задачата · В ЕДИН И СЪЩ месец, винаги.
 *
 * Дотук стоеше „днес + 5" и „днес + 9". В около четири дни на месец двете падат
 * в РАЗЛИЧНИ месеца, задачата покрива две колони на Ганта, и очакването за едно
 * ■ пада — без нито един ред променен код (обход З · ADR-015).
 */

/** 3 · Управление · полетата и бутоните · задача от десния бутон · филтър · сбор · Гант · Книгата · вносът */
/** новият ред в текста на възел · сивият пункт носи причината си на втори ред */
const NOV_RED = new RegExp(String.fromCharCode(10), 'g');

export async function blok1(ctx: KonteksNaProhoda): Promise<void> {
  const { stranitsa: p, broyach } = ctx;
  let razdel = '—';
  const proveri = (kakvo: string, vidyano: unknown, ochakvano: unknown): boolean =>
    broyach.proveri(razdel, kakvo, vidyano, ochakvano);

  // ══ 3а · залепената част · осем полета с цифри · четиринайсетте му бутона · дървото ═
  razdel = '3а · залепената част';
  await p.goto(`${ADRES}#/upravlenie`);
  await p.waitForSelector('[data-zalepeno="upravlenie"]');
  proveri(
    'осемте полета с цифри · от ляво надясно',
    (await tekstoveNa(p, '[data-pole] .ime')).join(' · '),
    'Спешно и Важно · просрочени · тази седмица · отворени задачи · Бюджет Дела · Имоти · Обекти · Бизнеси',
  );
  proveri(
    'Имоти 3 · Обекти 0 · Бизнеси 0',
    (await tekstoveNa(p, '[data-tsifra]')).slice(5).join(' · '),
    '3 · 0 · 0',
  );
  // ОСЕМ, НЕ ЧЕТИРИНАЙСЕТ · негово, 13.09 (запис 210): „Махни всичките бутони за
  // добавяне и скриване." Шест слязоха от ЕКРАНА; в каталога и в Книгата му са
  // и четиринайсетте (`SVALENI_OT_EKRANA` в `osnova.ts`).
  proveri(
    'осем бутона на екрана · шестте за добавяне и скриване слязоха',
    await p.$$eval('[data-zalepeno="upravlenie"] [data-buton-ekran].malak', (es) => es.length),
    8,
  );
  proveri(
    'нито един бутон за добавяне или скриване не е останал горе',
    await p.$$eval(
      '[data-zalepeno="upravlenie"] [data-buton-ekran]',
      (es) =>
        es
          .map((e) => e.getAttribute('data-buton-ekran') ?? '')
          .filter(
            (x) => x.startsWith('dobavyane') || (x.startsWith('skriy-') && x !== 'skriy-dela'),
          ).length,
    ),
    0,
  );
  proveri(
    'Отвори и Запази вече РАБОТЯТ · не казват „идва с резен" (резен 6б)',
    await p.$eval('[data-buton-ekran="otvori"]', (e) => (e as HTMLButtonElement).disabled),
    false,
  );
  proveri(
    'дървото · трите Имота · сверката затваря',
    await tekstNa(p, '[data-sverka="darvo"]'),
    'видими 3 от 3 · родители 3 · задачи 0 · сираци 0',
  );
  proveri(
    'Гантът е до таблицата · без ленти',
    (await tekstNa(p, '[data-sverka="gant"]')).startsWith('ленти 0 ·'),
    true,
  );
  proveri(
    'редът „филтър" под двете глави · и редът СБОР отдолу',
    `${await p.$$eval('[data-filtar]', (es) => es.length)} · ${await tekstNa(p, '[data-sbor-red] td:first-child')}`,
    // ДЕВЕТ, не десет: колоната с датата излезе от таблицата · времето е в
    // календара (негово, 13.09 · запис 204)
    '9 · сбор',
  );
  // негово, 11.09 (запис 195), точка 2: „Ганта обхваща всички редове изцяло и се
  // сливат двете" · сляти са, а лявата част СТОИ, докато тактовете се движат
  proveri(
    'номерът и името са ЗАЛЕПЕНИ вляво · и второто се лепи, където свършва първото',
    await p.evaluate(() => {
      const glavi = [
        ...document.querySelectorAll('table.reshetka.darvo thead tr:first-child th'),
      ].slice(0, 2);
      const kak = glavi.map((th) => getComputedStyle(th).position).join(' · ');
      const otmestvane = (glavi[1] as HTMLElement | undefined)?.style.left ?? '';
      const shirinaNaParvoto = Math.round(glavi[0]?.getBoundingClientRect().width ?? 0);
      return `${kak} · ${otmestvane === `${shirinaNaParvoto}px` ? 'лепнато точно' : otmestvane}`;
    }),
    'sticky · sticky · лепнато точно',
  );
  // негово, 12.09 (запис 201): „Когато има едновременно и бюджет и текст на

  // ══ 3б · десен бутон върху Имот → Дело „Сондаж" под него · Гантът · полетата ═
  razdel = '3б · задача от десния бутон';
  const garaYana = 'tr.red.roditel:has-text("Гара Яна")';
  await p.click(garaYana, { button: 'right' });
  await p.waitForSelector('[data-menyu]');
  proveri(
    // СЪЗДАВАНЕТО СЛЕЗЕ ТУК · негово, 13.09 (запис 210), и `zadanie/03` B5:
    // „Да може тук да се ползва десния бутон и да се дава опция … за добавяне."
    'менюто · действията върху реда, после СЪЗДАВАНЕТО',
    (await tekstoveNa(p, '[data-tochka]')).map((t) => t.split('\n')[0]).join(' · '),
    // негово, 13.09 (запис 206): „Задачата се потвърждава през приложението от
    // десния бутон." Оттам са двата нови пункта.
    // ДЛ-Т16 · `zadanie/03` B5: върху РОДИТЕЛ идват трите му поименни функции
    // (Дело · Среща · Преписка), а върху ИМОТ и четвъртата (Голямо дело, сиво).
    // Дотук и върху Имот, и върху Обект излизаше един и същи списък.
    'Добави Задача · Изключи реда · Върни реда · Свършена · Върни в работа · Сторно на последната промяна · Добави Дело · Добави Среща · Добави Преписка · Голямо дело · Имот · Обект · Задача · Среща · Кредит',
  );
  proveri(
    'Голямото дело казва кога идва · видимо в самия пункт',
    await p.$eval('[data-tochka="golyamo-delo"] .zashto', (e) => e.textContent?.trim()),
    // причината СЕ МЕНИ според Състоянието · две различни неща спират пункта
    'отключва се, когато Състоянието на Имота стане Строеж (негово B4)',
  );
  await p.click('[data-tochka="upravlenie.dobaviZadacha"]');
  await p.waitForSelector('tr.chernova[data-chernova="zadachi"]');
  proveri(
    'черновата е под Гара Яна',
    await p.$eval(`${garaYana} + tr`, (e) => e.className),
    'chernova zadacha nivo-2',
  );
  const ch = 'tr.chernova[data-chernova="zadachi"]';
  await p.selectOption(`${ch} select[data-kolona="vid"]`, '1');
  await p.fill(`${ch} input[data-kolona="ime"]`, 'Сондаж');
  await p.fill(`${ch} input[data-kolona="ot"]`, denOtMesetsa(10));
  await p.fill(`${ch} input[data-kolona="do"]`, denOtMesetsa(14));
  await p.selectOption(`${ch} select[data-kolona="otsenka"]`, '1');
  await p.fill(`${ch} input[data-kolona="byudzhet"]`, '250 000');
  await p.press(`${ch} input[data-kolona="byudzhet"]`, 'Enter');
  await p.waitForSelector('tr.red.zadacha[data-tablitsa="zadachi"]');
  proveri(
    'задачата стои под Гара Яна · слятата клетка е две клетки · Дело · Сондаж',
    await p.$eval(`${garaYana} + tr.red.zadacha`, (e) =>
      [...e.querySelectorAll('td[data-kolona="vid"], td[data-kolona="ime"]')]
        .map((td) => td.textContent?.trim())
        .join(' / '),
    ),
    'Дело / Сондаж',
  );
  proveri(
    'бюджетът е цели центове · по нормата на еврото',
    await p.$eval(
      'tr.red.zadacha td[data-kolona="byudzhet"]',
      (e) => `${(e as HTMLElement).dataset['st']} · ${e.textContent?.trim()}`,
    ),
    `25000000 · ${EVRO_250000}`,
  );
  proveri(
    `Дело Сондаж · ${EVRO_250000}`,
    `${await tekstNa(p, '[data-tsifra="speshni"]')} · ${await tekstNa(p, '[data-tsifra="otvoreni"]')} · ${await tekstNa(p, '[data-tsifra="byudzhet"]')}`,
    `1 · 1 · ${EVRO_250000}`,
  );
  proveri(
    'дървото · четири реда · една задача',
    await tekstNa(p, '[data-sverka="darvo"]'),
    'видими 4 от 4 · родители 3 · задачи 1 · сираци 0',
  );
  // ЛЕНТАТА НА ЗАДАЧАТА · вече не е първата на екрана. Негово, 13.09 (запис
  // 210): „календара да обхваща ВСИЧКИ редове" — и Имотът, и Обектът носят своя
  // ОБОБЩАВАЩА лента над задачите си, тъй че селекторът трябва да ги отличи.
  proveri(
    'Гантът · лентата на задачата е червена, защото е Спешно и Важно',
    await p.$eval('td.takt.lenta:not(.obobshtavashta)', (e) => e.classList.contains('speshno')),
    true,
  );
  // ══ И РОДИТЕЛИТЕ ВЛЯЗОХА В КАЛЕНДАРА · негово, 13.09 (запис 210) ═══
  proveri(
    'колко РЕДА носят обобщаваща лента · родителите с работа под себе си',
    await p.$$eval(
      'tr.red.roditel',
      (es) => es.filter((r) => r.querySelector('td.takt.lenta.obobshtavashta') !== null).length,
    ),
    // ЕДИН · трите родителя са Имот · Обект · Бизнес, а задачата е под ЕДИН от
    // тях. Само той има какво да обобщава; другите двама нямат работа под себе си
    // и НЕ получават лента — родител без деца не се преструва, че има обхват.
    1,
  );
  proveri(
    'обобщаващата е ПРАЗНА · името вече стои в таблицата отляво',
    (
      await p.$$eval('td.takt.lenta.obobshtavashta', (es) =>
        es.map((e) => e.textContent?.trim() ?? '').join(''),
      )
    ).length,
    0,
  );
  // И ОБХВАЩА РАБОТАТА ПОД СЕБЕ СИ. Мери се най-широкото: обобщаващите ленти
  // заедно трябва да покриват всяка лента на задача — инак родител би „свършил"
  // преди детето си и календарът пак би лъгал, само по-тихо.
  proveri(
    'обобщаващите покриват всяка лента на задача · от най-ранната до най-късната',
    await p.$$eval('tr.red', (redove) => {
      const granitsi = (izbor: string): [number, number] | null => {
        let parva = -1;
        let posledna = -1;
        for (const r of redove) {
          if (!r.matches(izbor)) continue;
          const takt = [...r.querySelectorAll('td.takt')];
          for (let i = 0; i < takt.length; i += 1) {
            if (takt[i]?.classList.contains('lenta') !== true) continue;
            if (parva === -1 || i < parva) parva = i;
            if (i > posledna) posledna = i;
          }
        }
        return parva === -1 ? null : [parva, posledna];
      };
      const r = granitsi('tr.red.roditel');
      const z = granitsi('tr.red.zadacha');
      if (r === null || z === null) return false;
      return r[0] <= z[0] && r[1] >= z[1];
    }),
    true,
  );
  // негово, 12.09 (запис 201): затова клетката носи и името, и числото
  proveri(
    'лентата носи И името, И бюджета · в едно и също поле',
    await p.$eval('tr.red.zadacha td.takt.lenta', (e) => (e as HTMLElement).innerText.trim()),
    `Дело Сондаж · ${EVRO_250000}`,
  );
  proveri(
    'сверката на Ганта',
    (await tekstNa(p, '[data-sverka="gant"]')).startsWith(
      'ленти 1 · без дати или извън обхвата 0 · задачи 1 · такт месец',
    ),
    true,
  );
  proveri(
    'СБОР под Бюджет Дела · 250 000,00 €',
    await tekstNa(p, '[data-sbor-stoynost="8"]'),
    EVRO_250000,
  );

  // ══ 3б2 · ПОТВЪРЖДАВАНЕТО ОТ ДЕСНИЯ БУТОН · негово, 13.09 (запис 206) ═══
  // „Задачата се потвърждава през приложението от десния бутон." Клетката е
  // ЗАТВОРЕНА и НЕ Е колона в реда (запис 204: „Редовете не показват време") —
  // потвърдената задача носи БЕЛЕГ на реда си.
  razdel = '3б2 · Свършена от десния бутон';
  const zadachata = `${garaYana} + tr.red.zadacha`;
  await p.click(zadachata, { button: 'right' });
  await p.waitForSelector('[data-menyu]');
  proveri(
    'върху ЗАДАЧА „Свършена" е разрешена, а „Върни в работа" е сива и КАЗВА защо',
    (await tekstoveNa(p, '[data-tochka="red.svarshena"], [data-tochka="red.nesvarshena"]')).join(
      ' · ',
    ),
    `Свършена · Върни в работа
Задачата не е потвърдена за свършена.`,
  );
  await p.click('[data-tochka="red.svarshena"]');
  await p.waitForSelector('tr.red.zadacha.svarshena');
  proveri(
    'потвърдената задача носи БЕЛЕГ на реда · време в клетка НЯМА (запис 204)',
    `${await p.$$eval(
      '[data-reshetka="zadachi"] tr.red.zadacha.svarshena',
      (es) => es.length,
    )} · ${await p.$$eval('tr.red.zadacha td[data-kolona="svarshena"]', (es) => es.length)}`,
    '1 · 0',
  );
  // ══ АРХИВНАТА ТАБЛИЦА · `zadanie/CHISTO/07` И23 ═══════════════════════
  // „редът излиза от дневния ред и отива в архивна таблица, която се показва
  // само ако зареденият период я включва" · и оценката му става празна.
  proveri(
    'завършената влиза и в АРХИВНАТА таблица · с деня на потвърждаването',
    `${await p.$$eval('[data-reshetka="arhiv"] tbody tr', (es) => es.length)} · ${(await p.$eval('[data-reshetka="arhiv"] tbody tr td', (e) => e.textContent ?? '')).length}`,
    '1 · 10',
  );
  proveri(
    'и ОЦЕНКАТА ѝ е изпразнена · свършена работа няма спешност',
    await p.$eval('[data-reshetka="zadachi"] tr.red.zadacha.svarshena', (e) => {
      const kletki = [...e.querySelectorAll('td.kletka')];
      return kletki.some((c) => (c.textContent ?? '').includes('Спешно'));
    }),
    false,
  );
  // и обратно · Журналът пази и двете
  await p.click(zadachata, { button: 'right' });
  await p.waitForSelector('[data-menyu]');
  await p.click('[data-tochka="red.nesvarshena"]');
  await p.waitForFunction(() => document.querySelectorAll('tr.red.zadacha.svarshena').length === 0);
  proveri(
    'върнатата в работа задача изважда и архивната таблица · празна не се рисува',
    await p.$$eval('[data-reshetka="arhiv"]', (es) => es.length),
    0,
  );
  proveri(
    'върнатата в работа задача си сваля белега',
    await p.$$eval('tr.red.zadacha.svarshena', (es) => es.length),
    0,
  );

  // ══ 3в · филтърът · сметката · тактът · скриването ═══════════════════
  // ══ 3б3 · ЕДИН СКРОЛЕР · главата стои НАВСЯКЪДЕ ═════════════════════════
  //
  // Негово, 08.09 (запис 64): „и за таблицата, и за диаграмата хоризонталния
  // скрол. **Важно е това, скролът**" · и „**отгоре е филтърът**".
  //
  // Негово, 13.09 (запис 223) — със снимка на счупеното: „Поправи залепения
  // хедър навсякъде… и разшири заключените редове с еднаква ширина с таблицата
  // и календар под тях… скрол по хоризонтала на таблицата и календара, но да
  // има лента отляво и отдясно зона, в която скролът по вертикала работи винаги."
  //
  // ЦЕНАТА, ПЛАТЕНА СЪЩИЯ ДЕН · тази проверка ВЕЧЕ БЕШЕ ЗЕЛЕНА над счупен екран.
  // Тя питаше блока (`overflow != visible`, `max-height != none`) и първата
  // клетка на главата — а първата клетка е и залепена КОЛОНА, тъй че беше
  // `sticky` по друга причина. Останалите глави бяха `position: relative` и
  // отплуваха; на снимката му се виждаше само редът с филтъра, увиснал между
  // данните. Проверка, която пита ЕДНА клетка, не проверява ГЛАВА.
  //
  // Оттук се мери ПОВЕДЕНИЕТО и се мери ВСЯКА глава.
  razdel = '3б3 · един скролер · главата стои';
  const zalepenoto = await p.evaluate(() => {
    const skrol = document.querySelector<HTMLElement>('[data-skrol]');
    const zalepeno = document.querySelector<HTMLElement>('.zalepeno');
    const tabl = document.querySelector<HTMLTableElement>('[data-reshetka="zadachi"]');
    if (skrol === null || zalepeno === null || tabl === null) return 'липсва възел';
    const glavi = [...tabl.querySelectorAll<HTMLTableRowElement>('thead tr')];
    const lyava = tabl.querySelector<HTMLElement>('tbody .zalepena-kolona');
    if (glavi.length !== 3 || lyava === null)
      return `глави ${glavi.length} · лява ${lyava !== null}`;

    // ЕДИН вертикален скролер в целия прозорец · това е цялата поправка
    // СТРУКТУРНО, не по текущото препълване: при малко данни блокът не се е
    // препълнил и „скролери 0" би било вярно и над счупен екран. Пита се КОЙ
    // МОЖЕ да скролва по вертикала, не кой го прави в този миг.
    const skroleri = [...document.querySelectorAll<HTMLElement>('main.prozorets *')]
      .filter((e) => {
        const c = getComputedStyle(e);
        return c.overflowY === 'auto' || c.overflowY === 'scroll';
      })
      .map((e) => e.className.split(' ')[0] ?? e.tagName);

    const gorno = (r: HTMLTableRowElement): number =>
      Math.round((r.cells[2] ?? r.cells[0])!.getBoundingClientRect().top);
    const nalyavo = (): number => Math.round(lyava.getBoundingClientRect().left);

    let stoiPriSkrol = true;
    if (skrol.scrollHeight > skrol.clientHeight) {
      skrol.scrollTop = 300;
      const a = glavi.map(gorno).join();
      skrol.scrollTop = 900;
      stoiPriSkrol = a === glavi.map(gorno).join();
      skrol.scrollTop = 0;
    }
    let stoiNastrani = true;
    if (skrol.scrollWidth > skrol.clientWidth) {
      skrol.scrollLeft = 400;
      const a = nalyavo();
      skrol.scrollLeft = 800;
      stoiNastrani = a === nalyavo();
      skrol.scrollLeft = 0;
    }

    // ВСЯКА глава в прозореца, не само тази · негово: „навсякъде"
    const vsichkiGlavi = [...skrol.querySelectorAll<HTMLTableRowElement>('thead tr')].filter(
      (r) => r.cells.length > 0,
    );
    const nezalepeni = vsichkiGlavi.filter(
      (r) => getComputedStyle(r.cells[0]!).position !== 'sticky',
    ).length;

    // ЪГЪЛЪТ · клетката, която е и глава, и колона, стои НАД данните
    const agal = tabl.querySelector<HTMLElement>('thead .zalepena-glava.zalepena-kolona');
    const dolu = tabl.querySelector<HTMLElement>('tbody .zalepena-kolona');

    return [
      `скролери ${skroleri.join(' + ') || 'няма'}`,
      `лентите извън скролера ${!skrol.contains(zalepeno)}`,
      // „еднаква ширина с таблицата и календар под тях" · до пиксел
      `еднаква ширина ${Math.round(zalepeno.getBoundingClientRect().width) === Math.round(skrol.getBoundingClientRect().width)}`,
      `хоризонтален скрол ${skrol.scrollWidth > skrol.clientWidth}`,
      `трите глави лепят ${glavi.every((r) => [...r.cells].every((c) => getComputedStyle(c).position === 'sticky'))}`,
      `подредени ${glavi.map((r) => Number.parseFloat(getComputedStyle(r.cells[0]!).top)).every((v, i, a) => i === 0 || v > a[i - 1]!)}`,
      `стои при скрол ${stoiPriSkrol}`,
      `стои настрани ${stoiNastrani}`,
      `незалепени глави ${nezalepeni}`,
      `ъгълът е над данните ${Number(getComputedStyle(agal!).zIndex) > Number(getComputedStyle(dolu!).zIndex)}`,
    ].join(' · ');
  });
  proveri(
    'Т56 · един скролер · лентите са извън него и са със СЪЩАТА ширина · всяка глава лепи',
    zalepenoto,
    [
      'скролери tyalo-skrol',
      'лентите извън скролера true',
      'еднаква ширина true',
      'хоризонтален скрол true',
      'трите глави лепят true',
      'подредени true',
      'стои при скрол true',
      'стои настрани true',
      'незалепени глави 0',
      'ъгълът е над данните true',
    ].join(' · '),
  );

  razdel = '3в · филтър · сбор · такт';
  // негово, 12.09 (запис 199): филтърът е падащо меню от ВЪВЕДЕНОТО в колоната —
  // избира се готова стойност, вместо да се познава как е изписана
  proveri(
    'менюто под „Задачи" носи онова, което наистина стои в колоната',
    (
      await p.$$eval('[data-filtar="4"] option', (es) => es.map((e) => e.textContent?.trim() ?? ''))
    ).join(' · '),
    'всички · Дело / Сондаж',
  );
  await p.selectOption('[data-filtar="4"]', 'Дело / Сондаж');
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="darvo"]')?.textContent?.startsWith('видими 2 от 4'),
  );
  proveri(
    'избрана „Дело / Сондаж" · остават задачата и Имотът ѝ · филтърът се казва',
    await tekstNa(p, '[data-sverka="darvo"]'),
    'видими 2 от 4 · родители 3 · задачи 1 · сираци 0 · филтърът е включен',
  );
  proveri(
    'календарът следва филтъра · редовете са едни и същи в двете половини',
    (await p.$$('[data-reshetka="zadachi"] tbody tr.red')).length,
    2,
  );
  await p.selectOption('[data-filtar="4"]', '');
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="darvo"]')?.textContent?.startsWith('видими 4 от 4'),
  );
  await p.selectOption('[data-smetka="8"]', 'broy');
  await p.waitForFunction(
    () => document.querySelector('[data-sbor-stoynost="8"]')?.textContent?.trim() === '1',
  );
  proveri('сметката „брой" под Бюджет Дела · 1', await tekstNa(p, '[data-sbor-stoynost="8"]'), '1');
  await p.selectOption('[data-smetka="8"]', 'sbor');
  await p.waitForFunction(
    (evro) => document.querySelector('[data-sbor-stoynost="8"]')?.textContent?.trim() === evro,
    EVRO_250000,
  );
  await p.selectOption('[data-takt]', 'godina');
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="gant"]')?.textContent?.includes('такт година'),
  );
  proveri(
    'такт година · дванайсет видими месеца, пет пъти повече колони · лентата остава',
    (await tekstNa(p, '[data-sverka="gant"]')).replace(
      /^ленти 1 .* такт година · колони (\d+)$/,
      '$1',
    ),
    '72',
  );
  // ТАБЛИЦАТА И КАЛЕНДАРЪТ СА ЕДНО · негово, 11.09 (запис 194): „да се сливат
  // редовете на таблицата и на календара… Направи ги едно." Затова двата бутона,
  // които криеха всяка половина поотделно, слязоха с останалите (запис 210) —
  // едно нещо няма две половини за криене.
  proveri(
    'таблицата и календарът вече не се крият поотделно',
    await p.$$eval('[data-buton-ekran^="skriy-"]', (es) => es.length),
    1,
  );
  proveri(
    'и останалият е ЕДИНСТВЕНИЯТ превключвател',
    await p.$eval('[data-buton-ekran^="skriy-"]', (e) => e.getAttribute('data-buton-ekran')),
    'skriy-dela',
  );

  // ══ 3г · „Свалифайл" = Книгата · листът Управление ═══════════════════
  // ══ 3в2 · неговите Отвори и Запази · моделът е ИМЕНУВАН поглед ══════
  razdel = '3в2 · моделът';
  // погледът се мени · тактът става година
  await p.selectOption('[data-takt]', 'godina');
  await p.waitForFunction(
    () => (document.querySelector('[data-sverka="gant"]')?.textContent ?? '').length > 0,
  );
  await p.evaluate(() => {
    // името на модела идва през prompt · тук се отговаря вместо човека
    (globalThis as unknown as { prompt: (a?: string, b?: string) => string }).prompt = () =>
      'Годишен преглед';
  });
  await natisniButon(p, 'zapazi');
  await p.waitForFunction(() =>
    (document.querySelector('[data-greshka]')?.textContent ?? '').includes('е записан'),
  );
  proveri(
    'Запази · моделът се записва с името си (негово B14)',
    await tekstNa(p, '[data-greshka]'),
    'Моделът „Годишен преглед" е записан.',
  );
  // погледът се разваля · после моделът го връща
  await p.selectOption('[data-takt]', 'den');
  await natisniButon(p, 'otvori');
  await p.waitForSelector('[data-menyu]');
  const punktove = await tekstoveNa(p, '[data-menyu] button');
  proveri(
    'Отвори · менюто носи празната таблица и запазения модел (негово A14)',
    punktove.join(' · '),
    'Празна таблица (изчисти погледа) · Годишен преглед',
  );
  await p.click('[data-menyu] [data-tochka="Годишен преглед"]');
  await p.waitForFunction(() =>
    (document.querySelector('[data-greshka]')?.textContent ?? '').includes('е отворен'),
  );
  proveri(
    'погледът се ВРЪЩА · тактът пак е година',
    await p.$eval('[data-takt]', (e) => (e as HTMLSelectElement).value),
    'godina',
  );
  await natisniButon(p, 'otvori');
  await p.waitForSelector('[data-menyu]');
  await p.click('[data-menyu] [data-tochka=""]');
  await p.waitForFunction(() =>
    (document.querySelector('[data-greshka]')?.textContent ?? '').includes('изчистен'),
  );
  proveri(
    'празната таблица изчиства погледа до подразбраното',
    await p.$eval('[data-takt]', (e) => (e as HTMLSelectElement).value),
    'mesets',
  );

  razdel = '3г · Книгата';
  const [svalyane] = await Promise.all([p.waitForEvent('download'), natisniButon(p, 'svali-fayl')]);
  const pat = (await svalyane.path()) ?? '';
  await p.waitForFunction(() =>
    (document.querySelector('[data-iznos-vest]')?.textContent ?? '').startsWith(
      'Книгата е записана',
    ),
  );
  const kniga = await prochetiKniga(readFileSync(pat));
  const list = kniga.listove.find((l) => l.ime === UPRAVLENIE);
  const k = list?.kletki ?? [];
  proveri(
    'две глави · НАШИЯТ Отговорник · „такт" ×8 · Ключ в T',
    `${k[16]?.[10]} · ${k[16]?.slice(11, 19).join(',')} · ${k[16]?.[19]}`,
    'Отговорник · такт,такт,такт,такт,такт,такт,такт,такт · Ключ',
  );
  proveri('редът „филтър"', k[18]?.[1], 'филтър');
  const grupa = k.find((r) => String(r[19] ?? '').startsWith('grupa:imot:') && r[1] === 'Гара Яна');
  const zadacha = k.find((r) => String(r[19] ?? '').startsWith('zadacha:'));
  proveri('Гара Яна е групов ред с ключ', grupa?.[0], '2');
  proveri(
    'задачата · слятата клетка · ■ в такта',
    `${zadacha?.[4]} · ${zadacha?.slice(11, 19).filter((v) => v === '■').length}`,
    'Дело / Сондаж · 1',
  );
  proveri(
    'редът СБОР · 1 задача · 250 000',
    `${k.find((r) => r[0] === 'сбор')?.[1]} · ${k.find((r) => r[0] === 'сбор')?.[9]}`,
    '1 · 250000',
  );
  proveri('„Ключ" (T) е скрита', list?.skritiKoloni.join(','), '20');

  // ══ 3д · вносът · същата Книга = нула · дописана задача под Гара Яна = нов ред ═
  razdel = '3д · вносът';
  const prochetiVII = async (fayl: string): Promise<string> => {
    await p.goto(`${ADRES}#/ii`);
    await p.waitForSelector('[data-kniga-vnos]');
    await p.setInputFiles('[data-kniga-vnos]', fayl);
    await p.waitForFunction(() =>
      /предложения/.test(document.querySelector('[data-otchet-vest]')?.textContent ?? ''),
    );
    return tekstNa(p, '[data-otchet-vest]');
  };
  proveri(
    'същата Книга · нула предложения',
    await prochetiVII(pat),
    '0 предложения · 0 находки · 0 бележки',
  );
  const listove = kniga.listove.map(opisOtProcheten);
  const upr = listove.find((l) => l.ime === UPRAVLENIE)!;
  const redove = upr.redove as (string | number | null)[][];
  const rg = redove.findIndex(
    (r) => String(r[19] ?? '').startsWith('grupa:imot:') && r[1] === 'Гара Яна',
  );
  const nov: (string | number | null)[] = [];
  nov[4] = 'Среща / Брокер';
  redove.splice(rg + 1, 0, nov);
  writeFileSync(S_ZADACHA, await napishiKniga(listove));
  proveri(
    'дописана задача без ключ под Гара Яна · едно предложение',
    await prochetiVII(S_ZADACHA),
    '1 предложения · 0 находки · 0 бележки',
  );
  proveri(
    'нов ред · Нова задача: към Гара Яна · Вид Среща · име Брокер',
    (
      await tekstoveNa(
        p,
        '[data-predlozheniya] tr.red td:nth-child(5), [data-predlozheniya] tr.red td:nth-child(6)',
      )
    ).join(' · '),
    'нов ред · Нова задача: към Гара Яна · Вид Среща · име Брокер.',
  );
  await p.click('[data-priemi]');
  await p.waitForFunction(() =>
    /разписката е (записана|отказана)/.test(
      document.querySelector('[data-vnos-vest]')?.textContent ?? '',
    ),
  );
  proveri(
    'приета',
    (await tekstNa(p, '[data-vnos-vest]')).startsWith('приети 1 от 1 избрани'),
    true,
  );
  await p.goto(`${ADRES}#/upravlenie`);
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="darvo"]')?.textContent?.startsWith('видими 5 от 5'),
  );
  proveri(
    'Управление · две задачи под Гара Яна · отворени 2',
    `${await tekstNa(p, '[data-sverka="darvo"]')} · ${await tekstNa(p, '[data-tsifra="otvoreni"]')}`,
    'видими 5 от 5 · родители 3 · задачи 2 · сираци 0 · 2',
  );
  // ══ 3е · ИЗСКАЧАЩИЯТ ПРОЗОРЕЦ ЗА СЪЗДАВАНЕ · негово, запис 195 т.11 ════
  razdel = '3е · изскачащият прозорец';
  // ОТ ДЕСНИЯ БУТОН ВЪРХУ ПРАЗНО · бутонът „Добавяне" слезе от лентата (запис
  // 210), а `zadanie/03` B5 иска създаването точно тук. Празното място е
  // важната половина: с празна книга няма ред, върху който да се натисне.
  await p.click('[data-sverka="darvo"]', { button: 'right' });
  await p.waitForSelector('[data-menyu]');
  proveri(
    'менюто дава петте му неща · Кредитът е сив',
    // сивият пункт носи причината си на втори ред · тук се чете като едно
    (await tekstoveNa(p, '[data-menyu] button')).map((x) => x.replace(NOV_RED, ' ')).join(' · '),
    'Имот · Обект · Задача · Среща · Кредит идва с ход 11б',
  );
  await p.click('[data-menyu] [data-tochka="imot"]');
  await p.waitForSelector('dialog[data-izskachasht="imoti"]');
  proveri(
    'прозорецът е МОДАЛЕН · и няма поле за № (номерът се дава)',
    `${await p.$eval(
      'dialog[data-izskachasht="imoti"]',
      (e) => (e as HTMLDialogElement).open,
    )} · ${(await p.$('dialog[data-izskachasht="imoti"] input[data-kolona="nomer"]')) === null}`,
    'true · true',
  );
  await p.fill('dialog[data-izskachasht="imoti"] input[data-kolona="ime"]', 'Панчарево');
  await p.selectOption('dialog[data-izskachasht="imoti"] select[data-kolona="sastoyanie"]', '1');
  await p.click('[data-izskachasht-sazday]');
  await p.waitForSelector('dialog[data-izskachasht="imoti"]', { state: 'detached' });
  proveri(
    'Имотът е създаден ОТ ПРОЗОРЕЦА · дървото го показва',
    (await tekstoveNa(p, 'tr.red.roditel td[data-kolona="ime"]')).includes('Панчарево'),
    true,
  );
}
