import { readFileSync } from 'node:fs';
import { prochetiKniga } from '../../src/kniga/ooxml.ts';
import type { KonteksNaProhoda } from '../yadro/kontekst.ts';
import { tekstNa, tekstoveNa } from '../yadro/pomoshtni.ts';
import { ADRES } from '../yadro/server.ts';

const STOYNOST = 'tr.red[data-nomenklatura="sastoyanie-na-imot"]';

/** 1 · откриване · Настройки с писане · Имоти с номерация · Запази книгата · двоен Enter */
export async function blok1(ctx: KonteksNaProhoda): Promise<void> {
  const { stranitsa: p, broyach } = ctx;
  let razdel = '—';
  const proveri = (kakvo: string, vidyano: unknown, ochakvano: unknown): boolean =>
    broyach.proveri(razdel, kakvo, vidyano, ochakvano);

  // ══ 1а · Книгата е открита ОТ ВРАТАТА · негово, запис 190 ════════════
  razdel = '1а · откриване';
  await p.goto(`${ADRES}#/profil`);
  await p.waitForSelector('[data-sektsiya="stopanin"]');
  proveri('осемте прозореца са в лентата', (await tekstoveNa(p, '[data-prozorets]')).length, 8);
  proveri(
    'Стопанинът е този, който е влязъл пръв',
    await tekstNa(p, '[data-stopanin]'),
    'proba@example.bg',
  );
  await p.goto(`${ADRES}#/imoti`);
  await p.waitForSelector('[data-buton="imoti.sazdayImot"]');
  proveri(
    'Книгата е открита още от вратата',
    await tekstNa(p, '[data-vest]'),
    '1 събития в Журнала · proba@example.bg',
  );
  proveri(
    'трите му бутона',
    (await tekstoveNa(p, '[data-buton]')).join(' · '),
    'Създай имот · Добави Обект · Добави Бизнес',
  );

  // ══ 1б · Настройки · номенклатурите с писане ═══════════════════════
  razdel = '1б · Настройки';
  await p.goto(`${ADRES}#/nastroyki`);
  const nov = '[data-nov="sastoyanie-na-imot"] input';
  await p.waitForSelector(nov);
  proveri(
    'следващият номер е 4',
    await tekstNa(p, '[data-nov="sastoyanie-na-imot"] [data-sledvasht]'),
    '4',
  );
  await p.fill(nov, 'Продаден');
  await p.press(nov, 'Enter');
  await p.waitForSelector(`${STOYNOST}[data-nomer="4"]`);
  proveri(
    'пише „Продаден" + Enter → стойност № 4',
    await tekstNa(p, `${STOYNOST}[data-nomer="4"] [data-stoynost]`),
    'Продаден',
  );
  proveri(
    'сверката · живи 4',
    await tekstNa(p, '[data-sverka="sastoyanie-na-imot"]'),
    'живи 4 · спрени 0 · всички 4',
  );

  await p.dblclick(`${STOYNOST}[data-nomer="4"] [data-stoynost]`);
  await p.fill(`${STOYNOST}[data-nomer="4"] [data-stoynost] input`, 'Продаден имот');
  await p.press(`${STOYNOST}[data-nomer="4"] [data-stoynost] input`, 'Enter');
  await p.waitForFunction(
    (s) =>
      document.querySelector(`${s}[data-nomer="4"] [data-stoynost]`)?.textContent?.trim() ===
      'Продаден имот',
    STOYNOST,
  );
  proveri(
    'преименуване · същият номер',
    await tekstNa(p, `${STOYNOST}[data-nomer="4"] [data-stoynost]`),
    'Продаден имот',
  );

  await p.dblclick(`${STOYNOST}[data-nomer="3"] [data-stoynost]`);
  await p.fill(`${STOYNOST}[data-nomer="3"] [data-stoynost] input`, '');
  await p.press(`${STOYNOST}[data-nomer="3"] [data-stoynost] input`, 'Enter');
  await p.waitForSelector(`${STOYNOST}[data-nomer="3"].spryana`);
  proveri(
    'изтрит текст + Enter → спряна, с номера си',
    await tekstNa(p, `${STOYNOST}[data-nomer="3"] td:last-child`),
    'спряна',
  );
  proveri(
    'сверката · живи 3 · спрени 1',
    await tekstNa(p, '[data-sverka="sastoyanie-na-imot"]'),
    'живи 3 · спрени 1 · всички 4',
  );

  await p.dblclick(`${STOYNOST}[data-nomer="3"] [data-stoynost]`);
  await p.fill(`${STOYNOST}[data-nomer="3"] [data-stoynost] input`, 'Строеж');
  await p.press(`${STOYNOST}[data-nomer="3"] [data-stoynost] input`, 'Enter');
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="sastoyanie-na-imot"]')?.textContent?.startsWith('живи 4'),
  );
  proveri(
    'пише пак → върната',
    await tekstNa(p, '[data-sverka="sastoyanie-na-imot"]'),
    'живи 4 · спрени 0 · всички 4',
  );
  proveri(
    'дубъл се отказва с думи',
    await (async () => {
      await p.fill(nov, 'УПИ');
      await p.press(nov, 'Enter');
      await p.waitForFunction(
        () => (document.querySelector('[data-greshka]')?.textContent ?? '') !== '',
      );
      return tekstNa(p, '[data-greshka]');
    })(),
    '„УПИ" вече е в „Състояние на Имот" (№ 2).',
  );

  // ══ 1в · Имоти · Обект · Бизнес · номерацията се смята ═══════════════
  razdel = '1в · Имоти';
  await p.goto(`${ADRES}#/imoti`);
  await p.waitForSelector('[data-buton="imoti.sazdayImot"]');
  await p.click('[data-buton="imoti.sazdayImot"]');
  await p.waitForSelector('[data-chernova="imoti"] input[data-kolona="ime"]');
  // ЕДНО Escape затваря черновата · подсказката не го изяжда (ход Х, скептик Е)
  await p.hover('[data-chernova="imoti"] input[data-kolona="ime"]');
  await p.keyboard.press('Escape');
  await p.waitForSelector('[data-chernova="imoti"]', { state: 'detached' });
  proveri('едно Escape затваря черновата', await p.$('[data-chernova="imoti"]'), null);
  await p.click('[data-buton="imoti.sazdayImot"]');
  await p.waitForSelector('[data-chernova="imoti"] input[data-kolona="ime"]');
  // негово, 11.09 (запис 195), точка 10: „Номер на Имот не се пише а се дава,
  // а номер на обект е задължение да се въведе."
  proveri(
    'черновата на ИМОТ няма ПОЛЕ за № · клетката стои, но не приема писане',
    await p.$('[data-chernova="imoti"] input[data-kolona="nomer"]'),
    null,
  );
  await p.fill('[data-chernova="imoti"] input[data-kolona="ime"]', 'Студентски Град');
  await p.selectOption('[data-chernova="imoti"] select[data-kolona="sastoyanie"]', '2');
  await p.press('[data-chernova="imoti"] input[data-kolona="ime"]', 'Enter');
  await p.waitForSelector('tr.red[data-tablitsa="imoti"]');
  proveri(
    'Имотът е № 1',
    await tekstNa(p, 'tr.red[data-tablitsa="imoti"] td[data-kolona="nomeratsiya"]'),
    '1',
  );
  proveri(
    'със Състояние УПИ',
    await tekstNa(p, 'tr.red[data-tablitsa="imoti"] td[data-kolona="sastoyanie"]'),
    'УПИ',
  );
  const imotId = await p.$eval(
    'tr.red[data-tablitsa="imoti"]',
    (e) => (e as HTMLElement).dataset['id'] ?? '',
  );

  await p.click('[data-buton="imoti.dobaviObekt"]');
  await p.waitForSelector('[data-chernova="obekti"] select[data-kolona="imot"]');
  await p.selectOption('[data-chernova="obekti"] select[data-kolona="imot"]', imotId);
  await p.selectOption('[data-chernova="obekti"] select[data-kolona="kategoriya"]', '1');
  await p.selectOption('[data-chernova="obekti"] select[data-kolona="vid"]', '1');
  await p.fill('[data-chernova="obekti"] input[data-kolona="nomer"]', '27');
  await p.press('[data-chernova="obekti"] input[data-kolona="nomer"]', 'Enter');
  await p.waitForSelector('tr.red[data-tablitsa="obekti"]');
  proveri(
    'Обектът е 1.1.1.27',
    await tekstNa(p, 'tr.red[data-tablitsa="obekti"] td[data-kolona="nomeratsiya"]'),
    '1.1.1.27',
  );
  proveri(
    'групата · 1.1 · Студентски Град · Сграда',
    await tekstNa(p, '[data-reshetka="obekti"] tr.grupata'),
    '1.1 · Студентски Град · Сграда',
  );

  await p.click('[data-buton="imoti.dobaviBiznes"]');
  await p.waitForSelector('[data-chernova="biznesi"] select[data-kolona="imot"]');
  await p.selectOption('[data-chernova="biznesi"] select[data-kolona="imot"]', imotId);
  await p.selectOption('[data-chernova="biznesi"] select[data-kolona="sastoyanie"]', '1');
  await p.fill('[data-chernova="biznesi"] input[data-kolona="nomer"]', '1');
  await p.press('[data-chernova="biznesi"] input[data-kolona="nomer"]', 'Enter');
  await p.waitForSelector('tr.red[data-tablitsa="biznesi"]');
  proveri(
    'Бизнесът е 1.3.1',
    await tekstNa(p, 'tr.red[data-tablitsa="biznesi"] td[data-kolona="nomeratsiya"]'),
    '1.3.1',
  );

  await p.dblclick('tr.red[data-tablitsa="obekti"] td[data-kolona="tsena"]');
  await p.fill('tr.red[data-tablitsa="obekti"] td[data-kolona="tsena"] input', '250 000');
  await p.press('tr.red[data-tablitsa="obekti"] td[data-kolona="tsena"] input', 'Enter');
  await p.waitForSelector(
    'tr.red[data-tablitsa="obekti"] td[data-kolona="tsena"][data-st="25000000"]',
  );
  proveri(
    'цената е цели центове · data-st',
    await p.$eval(
      'tr.red[data-tablitsa="obekti"] td[data-kolona="tsena"]',
      (e) => (e as HTMLElement).dataset['st'],
    ),
    '25000000',
  );
  proveri(
    'и се пише по нормата на еврото',
    (await tekstNa(p, 'tr.red[data-tablitsa="obekti"] td[data-kolona="tsena"]')).endsWith('€'),
    true,
  );

  await p.click('tr.red[data-tablitsa="obekti"]', { button: 'right' });
  await p.waitForSelector('[data-menyu]');
  // ОТМЯНАТА Е ЧЕТВЪРТА · негово, 14.09 (запис 232) т.4: „от всеки десен бутон".
  // Пинът е за първите три; четвъртият носи ИМЕТО на реда, който ще се отмени,
  // а то е от данните на прохода — затова се пита началото му, не целият текст.
  const punktoveNaReda = (await tekstoveNa(p, '[data-tochka]')).map((t) => t.split('\n')[0] ?? '');
  proveri(
    'дясното меню · Изключи · Върни (недостъпен) · Сторно · и Отмени (Ctrl+Z) накрая',
    `${punktoveNaReda.slice(0, 3).join(' · ')} · ${punktoveNaReda[3]?.startsWith('Отмени · запис на ред · ') === true && punktoveNaReda[3].endsWith('(Ctrl+Z)')}`,
    'Изключи реда · Върни реда · Сторно на последната промяна · true',
  );
  await p.click('[data-tochka="red.izklyuchi"]');
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="obekti"]')?.textContent?.startsWith('живи 0'),
  );
  proveri(
    'изключеният ред не се показва · Журналът го пази',
    await tekstNa(p, '[data-sverka="obekti"]'),
    'живи 0 · изключени 1 · всички 1',
  );

  // ══ 1в2 · ВРЪЩАНЕТО И Ctrl+Z · негово, 14.09 (запис 232) т.4 ═══════════
  //
  // „Върни реда не работи, защото когато го скриеш вече няма къде да натиснеш
  // десен бутон. За това нека да има винаги от всеки десен бутон на различни
  // места, ако има действия, да можеш да ги връщаш максимален брой пъти оттам,
  // и да се включва с Ctrl+Z."
  //
  // Точно състоянието отгоре: редът е изключен и го НЯМА на екрана. Дотук пътят
  // свършваше тук. Сега десният бутон върху ПРАЗНОТО носи „Върни ред · <име>" и
  // „Отмени · …", а Ctrl+Z работи отвсякъде — без нищо да се трие (сторно).
  razdel = '1в2 · връщането и Ctrl+Z';
  const sabitiyaPredi = Number((await tekstNa(p, '[data-vest]')).split(' ')[0]);
  await p.click('[data-sverka="obekti"]', { button: 'right' });
  await p.waitForSelector('[data-menyu]');
  const punktove = (await tekstoveNa(p, '[data-tochka]')).map((t) => t.split('\n')[0] ?? '');
  proveri(
    'върху ПРАЗНОТО менюто носи връщането на изключения ред · и отмяната с Ctrl+Z',
    `${punktove.some((x) => x.startsWith('Върни ред · '))} · ${punktove.some((x) => x.startsWith('Отмени · изключване или връщане на ред'))}`,
    'true · true',
  );
  await p.click('[data-tochka^="varni-red-obekti-"]');
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="obekti"]')?.textContent?.startsWith('живи 1'),
  );
  proveri(
    'изключеният ред се ВЪРНА от празното · без да е натискан самият той',
    await tekstNa(p, '[data-sverka="obekti"]'),
    'живи 1 · изключени 0 · всички 1',
  );
  // и пак изключен · този път се връща с КЛАВИША
  await p.click('tr.red[data-tablitsa="obekti"]', { button: 'right' });
  await p.waitForSelector('[data-tochka="red.izklyuchi"]');
  await p.click('[data-tochka="red.izklyuchi"]');
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="obekti"]')?.textContent?.startsWith('живи 0'),
  );
  await p.keyboard.press('Control+z');
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="obekti"]')?.textContent?.startsWith('живи 1'),
  );
  proveri(
    'Ctrl+Z връща реда · и КАЗВА какво е отменил',
    `${await tekstNa(p, '[data-sverka="obekti"]')} · ${(await tekstNa(p, '[data-otmyana]')).startsWith('Отменено: изключване или връщане на ред')}`,
    'живи 1 · изключени 0 · всички 1 · true',
  );
  // Журналът е само за добавяне · отмяната е ДОБАВЕНО сторно, не изтрит ред:
  // връщане + изключване + сторно = три събития ОТГОРЕ, нула отдолу
  proveri(
    'нищо не е изтрито · отмяната стои в Журнала като сторно',
    Number((await tekstNa(p, '[data-vest]')).split(' ')[0]) - sabitiyaPredi,
    3,
  );
  // и пак изключен · следващите раздели (Книгата · 1д) го чакат ИЗКЛЮЧЕН
  await p.click('tr.red[data-tablitsa="obekti"]', { button: 'right' });
  await p.waitForSelector('[data-tochka="red.izklyuchi"]');
  await p.click('[data-tochka="red.izklyuchi"]');
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="obekti"]')?.textContent?.startsWith('живи 0'),
  );

  // ══ 1г · Запази книгата · файлът се чете в прохода ═══════════════════
  await p.click('[data-buton="imoti.dobaviObekt"]');
  await p.waitForSelector('[data-chernova="obekti"] input[data-kolona="nomer"]');
  proveri(
    'черновата на ОБЕКТ иска № · и то е задължително',
    await p.$eval(
      '[data-chernova="obekti"] input[data-kolona="nomer"]',
      (e) => (e as HTMLInputElement).required,
    ),
    true,
  );
  await p.keyboard.press('Escape');
  await p.waitForSelector('[data-chernova="obekti"]', { state: 'detached' });

  razdel = '1г · Запази книгата';
  const [svalyane] = await Promise.all([
    p.waitForEvent('download'),
    p.click('[data-zapazi-kniga]'),
  ]);
  const pat = await svalyane.path();
  await p.waitForFunction(() =>
    (document.querySelector('[data-iznos-vest]')?.textContent ?? '').startsWith(
      'Книгата е записана',
    ),
  );
  proveri(
    'разписката е записана',
    (await tekstNa(p, '[data-iznos-vest]')).startsWith(
      'Книгата е записана · 2 живи реда · сверки: 9 от 9 затварят',
    ),
    true,
  );
  const kniga = await prochetiKniga(readFileSync(pat ?? ''));
  proveri('девет листа · осем + служебен', kniga.listove.length, 9);
  const imoti = kniga.listove.find((l) => l.ime === 'ИмотиОбектиБизнеси');
  proveri(
    'номерацията е текст · 1.3.1',
    imoti?.kletki.some((r) => r[0] === '1.3.1'),
    true,
  );
  proveri(
    'изключеният обект го няма',
    imoti?.kletki.some((r) => r[0] === '1.1.1.27'),
    false,
  );
  proveri(
    'валидацията сочи Настройки',
    imoti?.validatsii.some((v) => v.formula.startsWith("'Настройки(Стопанин)'!")),
    true,
  );
  proveri('„Ключ" е скрита', imoti?.skritiKoloni.join(','), '10');
  proveri(
    'служебният лист е скрит',
    kniga.listove.find((l) => l.ime === '_coretovia')?.skrit,
    true,
  );

  // ══ 1д · двоен Enter в черновата → един ред ═══════════════════════════
  razdel = '1д · двоен Enter';
  await p.click('[data-buton="imoti.sazdayImot"]');
  await p.waitForSelector('[data-chernova="imoti"] input[data-kolona="ime"]');
  await p.fill('[data-chernova="imoti"] input[data-kolona="ime"]', 'Гара Яна');
  await p.selectOption('[data-chernova="imoti"] select[data-kolona="sastoyanie"]', '2');
  await p.focus('[data-chernova="imoti"] input[data-kolona="ime"]');
  await p.keyboard.press('Enter');
  await p.keyboard.press('Enter');
  // Дневникът е източникът: 15 събития преди §1д (11 + четирите на 1в2) + 1 = 16 ·
  // нито три реда, нито две събития
  await p.waitForFunction(() =>
    (document.querySelector('[data-vest]')?.textContent ?? '').startsWith('16 събития'),
  );
  proveri(
    'два Имота, не три',
    await p.$$eval('tr.red[data-tablitsa="imoti"]', (es) => es.length),
    2,
  );
  proveri(
    'Гара Яна е № 2',
    await tekstNa(p, 'tr.red[data-tablitsa="imoti"]:nth-of-type(2) td[data-kolona="nomeratsiya"]'),
    '2',
  );
}
