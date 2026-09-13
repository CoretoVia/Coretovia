import { readFileSync } from 'node:fs';
import { prochetiKniga } from '../../src/kniga/ooxml.ts';
import type { KonteksNaProhoda } from '../yadro/kontekst.ts';
import { natisniButon, tekstNa, tekstoveNa } from '../yadro/pomoshtni.ts';
import { ADRES } from '../yadro/server.ts';

const LIST = 'Служители';
const STOPANINAT = 'proba@example.bg';
const POMOSHTNIK = 'pomoshtnik@example.bg';

/** 6 · Служители · четирите му блока · достъпът на Длъжността · Профилът */
/** новият ред в текста на възел · сивият пункт носи причината си на втори ред */
const NOV_RED_S = new RegExp(String.fromCharCode(10), 'g');

export async function blok1(ctx: KonteksNaProhoda): Promise<void> {
  const { stranitsa: p, broyach } = ctx;
  let razdel = '—';
  const proveri = (kakvo: string, vidyano: unknown, ochakvano: unknown): boolean =>
    broyach.proveri(razdel, kakvo, vidyano, ochakvano);

  // ══ 6а · екранът · неговите четири блока и петте базови реда ═════════
  razdel = '6а · листът Служители';
  await p.goto(`${ADRES}#/sluzhiteli`);
  await p.waitForSelector('[data-reshetka="dostap"]');
  proveri(
    'четирите му ленти, в неговия ред',
    (await tekstoveNa(p, 'section[data-blok] h2.lenta')).join(' · '),
    'Стопани свързани с Coretovia · Служители свързани с Coretovia · Достъп на Длъжности за Служител · Програма за Задачи на Служители',
  );
  proveri(
    'неговото B14 стои НАД лентата на Достъпа',
    await tekstNa(p, '[data-blok="dostap"] .dumite'),
    'Създаване на Длъжност с достъп',
  );
  proveri(
    'петте базови реда на Достъпа се ВИЖДАТ',
    (await tekstoveNa(p, '[data-bazov]')).length,
    5,
  );
  proveri(
    'първият базов ред е неговият · Стопанин, който редактира всичко',
    await tekstNa(p, '[data-bazov="Стопанин"]'),
    'Стопанин\tРедактира всичко\tРедактира всичко\tРедактира всичко\tРедактира всичко',
  );
  proveri(
    'казва се, че записаният ред бие базовия',
    (await tekstNa(p, '[data-bazovi-vest]')).includes(
      'запише ли се ред за същата Длъжност, той бие',
    ),
    true,
  );
  proveri(
    'без ред в таблиците · това се КАЗВА (правило 12)',
    (await tekstNa(p, '[data-dlazhnostta-mi]')).startsWith('Ти още нямаш ред'),
    true,
  );

  // ══ 6б · Стопанинът и Служителят · през чернова ══════════════════════
  razdel = '6б · хората';
  await p.click('[data-buton="sluzhiteli.dobaviStopan"]');
  await p.waitForSelector('[data-chernova="stopani"] input[data-kolona="ime"]');
  await p.fill('[data-chernova="stopani"] input[data-kolona="ime"]', 'Стопанинът на Книгата');
  await p.fill('[data-chernova="stopani"] input[data-kolona="imeyl"]', STOPANINAT);
  await p.selectOption('[data-chernova="stopani"] select[data-kolona="dlazhnost"]', '1');
  await p.press('[data-chernova="stopani"] input[data-kolona="ime"]', 'Enter');
  await p.waitForSelector('tr.red[data-tablitsa="stopani"]');
  proveri(
    'Стопанинът е № 1 · с Длъжност от номенклатурата',
    await tekstNa(p, 'tr.red[data-tablitsa="stopani"] td[data-kolona="dlazhnost"]'),
    'Стопанин',
  );
  proveri(
    'имейлът вече дава Длъжност на онзи, който пише',
    await tekstNa(p, '[data-dlazhnostta-mi]'),
    'Ти си Стопанин.',
  );
  proveri(
    'кой раздава Длъжности се КАЗВА на екрана (негово, 05.09)',
    await tekstNa(p, '[data-koy-razdava]'),
    'Ти раздаваш Длъжности.',
  );

  await p.click('[data-buton="sluzhiteli.dobaviSluzhitel"]');
  await p.waitForSelector('[data-chernova="sluzhiteli"] input[data-kolona="ime"]');
  await p.fill('[data-chernova="sluzhiteli"] input[data-kolona="ime"]', 'Помощникът');
  await p.fill('[data-chernova="sluzhiteli"] input[data-kolona="imeyl"]', POMOSHTNIK);
  await p.selectOption('[data-chernova="sluzhiteli"] select[data-kolona="dlazhnost"]', '3');
  await p.press('[data-chernova="sluzhiteli"] input[data-kolona="ime"]', 'Enter');
  await p.waitForSelector('tr.red[data-tablitsa="sluzhiteli"]');
  proveri(
    'Служителят е записан с Длъжност Помощник Управител',
    await tekstNa(p, 'tr.red[data-tablitsa="sluzhiteli"] td[data-kolona="dlazhnost"]'),
    'Помощник Управител',
  );
  proveri(
    'Програмата за Задачи го носи · с нули, докато не му дадеш задача',
    `${(await tekstNa(p, '[data-reshetka="programa"] tbody tr:last-child')).includes('Помощникът')} · ${await p.$eval(
      '[data-reshetka="programa"] tbody tr:last-child',
      (e) => (e as HTMLElement).innerText.replace(/\s+/g, ' ').trim(),
    )}`,
    'true · 2 Помощникът 0 0',
  );

  // ══ 6в · Длъжност с достъп · записаният ред бие базовия ══════════════
  razdel = '6в · Достъпът';
  await p.click('[data-buton="sluzhiteli.dobaviDlazhnost"]');
  await p.waitForSelector('[data-chernova="dostap"] select[data-kolona="dlazhnost"]');
  await p.selectOption('[data-chernova="dostap"] select[data-kolona="dlazhnost"]', '3');
  await p.fill('[data-chernova="dostap"] input[data-kolona="tabove"]', 'Вижда всичко');
  await p.fill('[data-chernova="dostap"] input[data-kolona="hedari"]', 'Вижда само всичко');
  await p.fill('[data-chernova="dostap"] input[data-kolona="redove"]', 'Вижда само всичко');
  await p.fill('[data-chernova="dostap"] input[data-kolona="zhurnal"]', 'Вижда само всичко');
  await p.press('[data-chernova="dostap"] input[data-kolona="tabove"]', 'Enter');
  await p.waitForSelector('tr.red[data-tablitsa="dostap"]');
  proveri(
    'записаният ред ИЗМЕСТВА базовия · базовите падат на четири',
    (await tekstoveNa(p, '[data-bazov]')).length,
    4,
  );
  proveri(
    'и точно неговата Длъжност вече не е базова',
    await p.$('[data-bazov="Помощник Управител"]'),
    null,
  );

  // ══ 6в2 · Отговорникът на задачата · и Програмата, която го брои ═════
  razdel = '6в2 · Отговорникът';
  const bezOtgovornikPredi = await tekstNa(p, '[data-programa-vest]');
  proveri(
    'докато никой не носи задача, това се КАЗВА',
    bezOtgovornikPredi.includes('БЕЗ отговорник'),
    true,
  );
  await p.goto(`${ADRES}#/upravlenie`);
  await p.waitForSelector('tr.red.zadacha td[data-kolona="otgovornik"]');
  proveri(
    'колоната Отговорник стои в Управление · и е празна, докато не я попълниш',
    await tekstNa(p, 'tr.red.zadacha td[data-kolona="otgovornik"]'),
    '',
  );
  await p.dblclick('tr.red.zadacha td[data-kolona="otgovornik"]');
  await p.waitForSelector('tr.red.zadacha td[data-kolona="otgovornik"] select');
  const horaVMenyuto = await p.$$eval(
    'tr.red.zadacha td[data-kolona="otgovornik"] select option',
    (opts) => opts.map((o) => o.textContent?.trim() ?? '').join(' · '),
  );
  proveri(
    'падащото меню носи ХОРАТА от листа Служители, не Имоти',
    horaVMenyuto,
    '— · 1 · Стопанинът на Книгата · 1 · Помощникът',
  );
  await p.selectOption('tr.red.zadacha td[data-kolona="otgovornik"] select', {
    label: '1 · Помощникът',
  });
  await p.press('tr.red.zadacha td[data-kolona="otgovornik"] select', 'Enter');
  await p.waitForFunction(
    () =>
      (
        document.querySelector('tr.red.zadacha td[data-kolona="otgovornik"]')?.textContent ?? ''
      ).trim() === 'Помощникът',
  );
  proveri(
    'задачата вече носи отговорник',
    await tekstNa(p, 'tr.red.zadacha td[data-kolona="otgovornik"]'),
    'Помощникът',
  );

  await p.goto(`${ADRES}#/sluzhiteli`);
  await p.waitForSelector('[data-reshetka="programa"]');
  const redNaPomoshtnika = await p.$eval('[data-reshetka="programa"] tbody tr:last-child', (e) =>
    (e as HTMLElement).innerText.replace(/\s+/g, ' ').trim(),
  );
  proveri(
    'Програмата за Задачи вече БРОИ · неговите две числа, не тире',
    /^2 Помощникът \d+ \d+$/.test(redNaPomoshtnika),
    true,
  );
  proveri(
    'и броят задачи без отговорник падна с една',
    (await tekstNa(p, '[data-programa-vest]')) === bezOtgovornikPredi,
    false,
  );

  // ══ 6г · Профилът · Кой съм и какво ми дава Длъжността ═══════════════
  razdel = '6г · Лични Данни';
  await p.goto(`${ADRES}#/profil`);
  await p.waitForSelector('[data-sektsiya="lichni"]');
  proveri('имейлът, с който пиша', await tekstNa(p, '[data-imeylat-mi]'), STOPANINAT);
  proveri('Длъжността ми', await tekstNa(p, '[data-dlazhnostta-mi]'), 'Длъжност: Стопанин');
  proveri(
    'четирите оси на достъпа · с неговите глави и думата на правото',
    (await tekstoveNa(p, '[data-dostapa-mi] tbody tr')).join(' | '),
    'достъп до табове без Журнал\tРедактира\tРедактира всичко | достъп до хедъри\tРедактира\tРедактира всичко | достъп до Секци Редове\tРедактира\tРедактира всичко | Таб Журнал\tРедактира\tРедактира всичко',
  );

  // ══ 6д · правото стеснява „Вкарване" на Сметки ══════════════════════
  razdel = '6д · Вкарване';
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector('[data-vkarvane-pravo]');
  proveri(
    'Стопанинът вкарва · и екранът го КАЗВА (правило 23)',
    await tekstNa(p, '[data-vkarvane-pravo]'),
    'Имаш право да вкарваш тук.',
  );

  // ══ 6е · Книгата носи листа · и се чете обратно без предложения ══════
  razdel = '6е · Книгата';
  const [svalyane] = await Promise.all([p.waitForEvent('download'), natisniButon(p, 'svali-fayl')]);
  const pat = (await svalyane.path()) ?? '';
  await p.waitForFunction(() =>
    (document.querySelector('[data-iznos-vest]')?.textContent ?? '').startsWith(
      'Книгата е записана',
    ),
  );
  const kniga = await prochetiKniga(readFileSync(pat));
  const k = kniga.listove.find((l) => l.ime === LIST)?.kletki ?? [];
  const redNaSluzhitelya = k.find((r) => String(r[1] ?? '') === 'Помощникът');
  proveri(
    'Служителят стои в листа · с имейла и Длъжността си',
    `${redNaSluzhitelya?.[3]} · ${redNaSluzhitelya?.[5]}`,
    `${POMOSHTNIK} · Помощник Управител`,
  );
  const bazovVKnigata = k.find((r) => String(r[1] ?? '') === 'Наблюдател');
  proveri(
    'базовият ред отива в Книгата БЕЗ ключ · картина, не данни',
    `${String(bazovVKnigata?.[2] ?? '')} · ${String(bazovVKnigata?.[6] ?? '')}`,
    'Вижда всичко · ',
  );
  await p.goto(`${ADRES}#/ii`);
  await p.waitForSelector('[data-kniga-vnos]');
  await p.setInputFiles('[data-kniga-vnos]', pat);
  await p.waitForFunction(() =>
    /предложения/.test(document.querySelector('[data-otchet-vest]')?.textContent ?? ''),
  );
  proveri(
    'износ → внос = нула · базовите редове НЕ се предлагат наново',
    await tekstNa(p, '[data-otchet-vest]'),
    '0 предложения · 0 находки · 0 бележки',
  );

  // ══ 6ж · СЕДМИЧНАТА ПРОГРАМА · негово, 11.09 (запис 195), точка 7 ══════
  razdel = '6ж · седмичната програма';
  await p.goto(`${ADRES}#/sluzhiteli`);
  await p.waitForSelector('tr.red[data-tablitsa="sluzhiteli"]');
  await p.click('tr.red[data-tablitsa="sluzhiteli"]', { button: 'right' });
  await p.waitForSelector('[data-menyu]');
  proveri(
    'десният бутон върху служител дава седмицата и раздаването',
    (await tekstoveNa(p, '[data-menyu] button')).map((x) => x.replace(NOV_RED_S, ' ')).join(' · '),
    // ДЛ-Т59 · пунктът вече РАБОТИ · негово, 11.09 (запис 195) т.7: „С десен бутон
    // на служителя можеш да му РЕДАКТИРАШ ДАННИТЕ". Дотук стоеше сив и казваше
    // „клетката се отваря с натискане върху нея" — вярно, но не е неговото.
    'Седмичната програма · Дай задача · 1 без отговорник · Редактирай данните',
  );
  await p.click('[data-menyu] [data-tochka="sedmitsata"]');
  await p.waitForSelector('dialog[data-sedmitsa]');
  proveri(
    'седмицата е СЕДЕМ дни, от понеделник',
    (await tekstoveNa(p, 'dialog[data-sedmitsa] tr.red .den')).length,
    7,
  );
  proveri(
    'и казва колко се трупат от миналото',
    (await tekstNa(p, '[data-sedmitsa-sverka]')).startsWith('натрупани от минали дни'),
    true,
  );

  // ══ ДЛ-Т58 · НАЗАД И НАПРЕД ═══════════════════════════════════════════
  //
  // Негово, 11.09 (запис 195) т.7: „знаеш кой ден какво прави и **какво е
  // ПРАВИЛ**." Миналото време иска минала седмица; дотук прозорецът беше закован
  // на днешната и вторият половин от изречението му не работеше.
  const parviyatDen = async (): Promise<string> =>
    p.$eval('dialog[data-sedmitsa] tbody tr:first-child', (e) => e.getAttribute('data-den') ?? '');
  const dnesnata = await parviyatDen();
  proveri(
    'отваря се на ДНЕШНАТА седмица · и бутонът „днес" е сив, защото вече си там',
    `${await tekstNa(p, '[data-sedmitsa-koga]')} · ${await p.$eval(
      '[data-sedmitsa-dnes]',
      (e) => (e as HTMLButtonElement).disabled,
    )}`,
    'тази седмица · true',
  );
  await p.click('[data-sedmitsa-nazad]');
  await p.waitForSelector('dialog[data-sedmitsa]');
  const minalata = await parviyatDen();
  proveri(
    'ПРЕДИШНАТА седмица е точно седем дни назад · и вече не е „тази"',
    `${(Date.parse(`${dnesnata}T00:00:00Z`) - Date.parse(`${minalata}T00:00:00Z`)) / 86_400_000} · ${(
      await tekstNa(p, '[data-sedmitsa-koga]')
    ).includes(minalata)}`,
    '7 · true',
  );
  proveri(
    'и КАЗВА, че натрупаното се брои спрямо днес · инак минало би минало за просрочено',
    (await tekstNa(p, '[data-sedmitsa-sverka]')).includes('спрямо днес'),
    true,
  );
  await p.click('[data-sedmitsa-dnes]');
  await p.waitForSelector('dialog[data-sedmitsa]');
  proveri('бутонът „днес" връща на днешната', await parviyatDen(), dnesnata);
  await p.click('[data-sedmitsa-zatvori]');
  await p.waitForSelector('dialog[data-sedmitsa]', { state: 'detached' });

  // ══ ДЛ-Т59 · „РЕДАКТИРАЙ ДАННИТЕ" ПРОРАБОТВА ══════════════════════════
  //
  // Негово, 11.09 (запис 195) т.7: „С десен бутон на служителя можеш да му
  // **РЕДАКТИРАШ ДАННИТЕ** и да му дадеш задачи." Второто работеше от 12.09;
  // първото стоеше сиво и казваше „клетката се отваря с натискане върху нея" —
  // вярно, но не е неговото: той иска ЕДНО място, където се вижда всичко.
  await p.click('tr.red[data-tablitsa="sluzhiteli"]', { button: 'right' });
  await p.waitForSelector('[data-menyu]');
  await p.click('[data-menyu] [data-tochka="redaktsiya"]');
  await p.waitForSelector('dialog[data-izskachasht="sluzhiteli"]');
  proveri(
    'прозорецът казва КОГО поправя · и бутонът е „Запази", не „Създай"',
    `${await tekstNa(p, 'dialog[data-izskachasht] h2')} · ${await tekstNa(
      p,
      '[data-izskachasht-sazday]',
    )}`,
    'Поправи Помощникът · Запази',
  );
  proveri(
    'полетата тръгват ПЪЛНИ · празен прозорец над съществуващ ред е капан',
    await p.$eval(
      'dialog[data-izskachasht] .pole-v-prozoretsa',
      (e) => (e as HTMLInputElement).value,
    ),
    'Помощникът',
  );
  // и ЗАПИСЪТ минава · инак прозорецът е витрина
  await p.fill('dialog[data-izskachasht] .pole-v-prozoretsa', 'Помощникът · поправен');
  await p.click('[data-izskachasht-sazday]');
  await p.waitForSelector('dialog[data-izskachasht]', { state: 'detached' });
  await p.waitForFunction(
    (ime) =>
      (
        document.querySelector('tr.red[data-tablitsa="sluzhiteli"]') as HTMLElement | null
      )?.innerText.includes(ime) === true,
    'Помощникът · поправен',
  );
  proveri(
    'записът МИНАВА · името се смени в таблицата',
    (await tekstNa(p, 'tr.red[data-tablitsa="sluzhiteli"]')).includes('Помощникът · поправен'),
    true,
  );
}
