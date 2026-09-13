import { readFileSync } from 'node:fs';
import { prochetiKniga } from '../../src/kniga/ooxml.ts';
import type { Page } from 'playwright-core';
import type { KonteksNaProhoda } from '../yadro/kontekst.ts';
import {
  litseNaButona,
  natisniButon,
  poletaBezIme,
  tekstNa,
  tekstoveNa,
} from '../yadro/pomoshtni.ts';
import { mesetsatNaProhoda } from '../yadro/kalendar.ts';
import { ADRES } from '../yadro/server.ts';

const SMETKI = 'Сметки';
const ZALEPENO = '[data-zalepeno="smetki"]';
/** еврото по нормата му · тясна пауза (U+202F) между хилядите и пред знака */
const EVRO_1200 = '1 200,00 €';
const EVRO_MINUS_1500 = '-1 500,00 €';
const EVRO_1500 = '1 500,00 €';
/** бюджетът на „Дело Сондаж" · тук е РАЗХОД и влиза с минус */
const EVRO_MINUS_250000 = '-250\u202F000,00\u202F€';
const EVRO_250000 = '250\u202F000,00\u202F€';
/** движението −1 500 И бюджетът на „Сондаж" −250 000 · сборът им е ОБЩ РАЗХОД */
const EVRO_MINUS_251500 = '-251\u202F500,00\u202F€';
const EVRO_MINUS_250300 = '-250\u202F300,00\u202F€';
/** нулата се пише с нейния си знак · Трезорът я показва, не я крие */
const EVRO_MINUS_300 = '-300,00\u202F€';
const EVRO_0 = '0,00 €';
/**
 * Месецът е ТЕКУЩИЯТ, не закован.
 *
 * „2026-09" щеше да спре да работи след 01.11.2026: листът Сметки реже
 * колоните си от предишния месец нататък, тъй че старият месец излиза извън
 * прозореца и „■" не се пише никъде (ADR-015).
 */
const MESETS = mesetsatNaProhoda();

/** 4 · Сметки · трите реда залепено · движение · знакът · кешът · Книгата и вносът */
/**
 * НОВ РЕД С ПАРИ · от десния бутон, не от лентата.
 *
 * Негово, 13.09 (запис 210): „Махни всичките бутони за добавяне и скриване."
 * Бутонът „Добави ред с пари" слезе заедно с останалото създаване; пунктът
 * живее в десния бутон върху празно място, до Имот · Обект · Задача · Среща.
 *
 * Кликва се върху реда със сверката — той е извън таблицата, тъй че менюто
 * излиза с пунктовете за създаване, а не с тези на избран ред.
 */
async function noviyatRedSPari(p: Page): Promise<void> {
  await p.click('[data-sverka="smetki"]', { button: 'right' });
  await p.waitForSelector('[data-menyu]');
  await p.click('[data-menyu] [data-tochka="dobavi-dvizhenie"]');
}
/**
 * ИЗМЕРЕНОТО НА ЧЕТИРИТЕ ЛЕНТИ · височина, дупка вдясно и ръбове.
 *
 * Негово, 13.09 (запис 203), точка 2: „да са с еднаква височина и **да са в
 * симетрия колоните** … **без празни пространства**."
 *
 * И ДВЕТЕ СЕ МЕРЯТ, НЕ СЕ ГЛЕДАТ. Цената, платена на 12.09: поправка, направена
 * на око, беше оборена с линийка в браузъра — пълнежът, който трябваше да
 * затвори дупката, добавяше цял празен ред отдолу. Оттогава тази лента се съди
 * само с `getBoundingClientRect`.
 *
 * И НА НЯКОЛКО ШИРИНИ · втора цена, платена на 13.09. Мерех на 1920 · 1440 ·
 * 1200 и всичко беше по 43px; проходът върви на 1280 (подразбирането на
 * Playwright) и също минаваше. В CI обаче падна с „чакано 1, видяно 2" — на
 * ubuntu шрифтовете са други и редът на кеша ставаше с ЕДИН пиксел по-висок,
 * защото полетата за въвеждане носят своя височина. Проверка на една ширина
 * пропуска точно това. Оттук се мери на три, и най-тясната е под екрана му.
 *
 * `display: contents` не е клетка · обвивката на откритите бутони е прозрачна за
 * мрежата, тъй че децата ѝ се броят на нейно място.
 */
/** Ширините, на които се съди · 1280 е подразбирането на прохода и на CI. */
const SHIRINI = [1440, 1280, 960] as const;

async function izmeriLentite(p: Page): Promise<{
  visochini: number;
  dupki: number;
  chuzhdiRabove: number;
  kletki: string;
}> {
  const vsichki: { visochini: number[]; dupki: number; chuzhdiRabove: number; kletki: string }[] =
    [];
  for (const shirina of SHIRINI) {
    await p.setViewportSize({ width: shirina, height: 900 });
    vsichki.push(await edinaSnimka(p));
  }
  // връщаме прозореца на ширината, с която тръгна разделът
  await p.setViewportSize({ width: 1280, height: 720 });
  return {
    // ЕДНА височина през ВСИЧКИ ширини · не една на всяка поотделно
    visochini: new Set(vsichki.flatMap((x) => x.visochini)).size,
    dupki: vsichki.reduce((a, x) => a + x.dupki, 0),
    chuzhdiRabove: vsichki.reduce((a, x) => a + x.chuzhdiRabove, 0),
    kletki: vsichki[0]?.kletki ?? '',
  };
}

async function edinaSnimka(p: Page): Promise<{
  visochini: number[];
  dupki: number;
  chuzhdiRabove: number;
  kletki: string;
}> {
  return p.$$eval('[data-zalepeno="smetki"] > *', (lenti) => {
    const opis = lenti.map((l) => {
      const detsa = [...l.children].flatMap((c) =>
        getComputedStyle(c).display === 'contents' ? [...c.children] : [c],
      );
      const r = l.getBoundingClientRect();
      return {
        visochina: Math.round(r.height),
        do: Math.round(r.right),
        kray: Math.round(detsa[detsa.length - 1]?.getBoundingClientRect().right ?? 0),
        rabove: detsa.map((c) => Math.round(c.getBoundingClientRect().left)),
        broy: detsa.length,
      };
    });
    // редът на кеша е НАЙ-ФИНИЯТ (десет клетки по един трак) · върху неговите
    // ръбове трябва да лежат ръбовете на всички останали
    const nayFin = opis.reduce((a, b) => (b.broy > a.broy ? b : a), opis[0]!);
    return {
      visochini: opis.map((l) => l.visochina),
      dupki: opis.filter((l) => l.do - l.kray > 1).length,
      chuzhdiRabove: opis.reduce(
        (a, l) => a + l.rabove.filter((x) => !nayFin.rabove.includes(x)).length,
        0,
      ),
      kletki: opis.map((l) => l.broy).join(' · '),
    };
  });
}

export async function blok1(ctx: KonteksNaProhoda): Promise<void> {
  const { stranitsa: p, broyach } = ctx;
  let razdel = '—';
  const proveri = (kakvo: string, vidyano: unknown, ochakvano: unknown): boolean =>
    broyach.proveri(razdel, kakvo, vidyano, ochakvano);

  // ══ 4а · залепената част · ТРИ реда (негово, 05.09 т.2) ══════════════
  razdel = '4а · трите реда';
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector(ZALEPENO);
  // ОСЕМ, НЕ ЕДИНАЙСЕТ · негово, 13.09 (запис 203) т.3: „Тази секция да стане на
  // ЕДИН ред." Трите кеш полета оттук повтаряха реда на кеша под себе си и
  // слязоха; те бяха и причината колоните да не се подреждат (т.2).
  proveri(
    'осемте полета с цифри · и БАЛАНСЪТ е първото (негово, 13.09 т.5)',
    (await tekstoveNa(p, `${ZALEPENO} [data-poleta] [data-pole] .ime`)).join(' · '),
    'Баланс · Приход · Разходи · Резултат · движения · несверени · ДДС остатък · находки НАП',
  );
  proveri(
    'и нито едно кеш число не стои на два реда',
    (await tekstoveNa(p, `${ZALEPENO} [data-poleta] [data-pole] .ime`)).filter((x) =>
      x.startsWith('Кеш'),
    ).length,
    0,
  );
  // негово, 13.09 (запис 203), точка 1: „Реда на подтабовете в Сметки да се
  // качи на 2ро място." Първо КОЛКО, после КЪДЕ, после КАКВО ВЪВЕЖДАМ, накрая
  // КАКВО МОГА.
  proveri(
    'ЧЕТИРИТЕ ЛЕНТИ в реда му · числа · подтабове · кеш · бутони',
    (
      await p.$$eval(`${ZALEPENO} > *`, (es) =>
        es.map((e) =>
          e.getAttribute('data-poleta') === null ? e.className.split(' ')[0] : 'poleta',
        ),
      )
    ).join(' · '),
    'poleta · podtabove · lenta-red · deystviya',
  );
  // негово, 13.09 (запис 203), точка 3: редът на кеша е ЕДИН ред, и в него се
  // пишат само две неща — месецът и изтегленото по извлечение.
  proveri(
    'в реда на кеша се ПИШАТ само две неща · останалото се смята',
    await p.$$eval('[data-kesh-forma] input.pole', (es) => es.length),
    2,
  );
  // ОСЕМ · негово, 13.09 (запис 210): „Махни всичките бутони за добавяне и
  // скриване." Шестте слязоха от екрана, а „Добави ред с пари" отиде в десния
  // бутон заедно с останалото създаване.
  proveri(
    'третият ред са осемте останали бутона',
    await p.$$eval(`${ZALEPENO} [data-buton-ekran].malak`, (es) => es.length),
    8,
  );
  proveri(
    'старият бутон „Добави ред с пари" вече го няма в лентата',
    await p.$$eval('[data-dobavi-dvizhenie]', (es) => es.length),
    0,
  );

  // ══ ЧЕТИРИТЕ ЛЕНТИ СА ЕДНА МРЕЖА · негово, 13.09 (запис 203) т.2 ═══
  const lentite = await izmeriLentite(p);
  proveri(
    'клетките по лента · осем полета · пет подтаба · десет на кеша · шест действия',
    lentite.kletki,
    '8 · 5 · 10 · 6',
  );
  proveri(
    'ЕДНА височина за четирите, на ТРИ ширини · колко различни има ОБЩО',
    lentite.visochini,
    1,
  );
  proveri('БЕЗ ПРАЗНИ ПРОСТРАНСТВА · колко ленти не стигат десния си край', lentite.dupki, 0);
  proveri('СИМЕТРИЯ · колко ръба падат ИЗВЪН подложката на кеш-реда', lentite.chuzhdiRabove, 0);
  proveri(
    'двете му ленти стоят една под друга',
    (await tekstoveNa(p, '[data-blok="prihod"] .lenta, [data-blok="razhod"] .lenta')).join(' · '),
    'ПРИХОД · Разходи',
  );
  // ── ДВЕТЕ СТРАНИ ВЕЧЕ НЕ СЕ КРИЯТ ПООТДЕЛНО ─────────────────────────
  //
  // Негово, 13.09 (запис 210): „Махни всичките бутони за добавяне и скриване."
  // Двата бутона „Скрий Приходи/Разходи" слязоха; работата им я върши филтърът в
  // главата на колоната (запис 192: „Филтър значи да ги СОРТИРАШ"), без да яде
  // половин екран.
  proveri(
    'Приходът и Разходът стоят и двата · няма бутон, който да ги крие',
    await p.$$eval('[data-blok="prihod"], [data-blok="razhod"]', (es) => es.length),
    2,
  );
  proveri(
    'на лентата е останал ЕДИН превключвател · и той е неговият',
    await p.$$eval(`${ZALEPENO} [data-buton-ekran^="skriy-"]`, (es) =>
      es.map((e) => e.getAttribute('data-buton-ekran')).join(' · '),
    ),
    'skriy-dela',
  );

  proveri(
    'секциите му са в реда на номенклатурата',
    (await tekstoveNa(p, '[data-reshetka="prihod"] tr.sektsiya td:first-child')).join(' · '),
    'Наем Банка · Наем Кеш · Бизнес · Други',
  );
  proveri('нула движения', await tekstNa(p, '[data-tsifra="dvizheniya"]'), '0');

  // ══ 4б · движение · знакът решава страната ═══════════════════════════
  razdel = '4б · движение';
  await noviyatRedSPari(p);
  await p.waitForSelector('tr.chernova[data-chernova="dvizheniya"]');
  const ch = 'tr.chernova[data-chernova="dvizheniya"]';
  // родителят · първият Имот в списъка · оттук редът се вижда и в Управление (запис 193)
  await p.selectOption(`${ch} select[data-kolona="kam"]`, { index: 1 });
  await p.selectOption(`${ch} select[data-kolona="sektsiya"]`, '1');
  await p.selectOption(`${ch} select[data-kolona="funktsiya"]`, '3');
  await p.fill(`${ch} input[data-kolona="mesets"]`, MESETS);
  await p.fill(`${ch} input[data-kolona="suma"]`, '1200');
  await p.press(`${ch} input[data-kolona="suma"]`, 'Enter');
  await p.waitForSelector('[data-reshetka="prihod"] tr.red[data-tablitsa="dvizheniya"]');
  proveri(
    'редът застава под „Наем Банка" · сборът на секцията е сумата му',
    await tekstNa(p, '[data-sbor-sektsiya="prihod·1"]'),
    EVRO_1200,
  );
  proveri('ОБЩ ПРИХОД', await tekstNa(p, '[data-sbor="prihod"]'), EVRO_1200);
  proveri('полето горе го брои', await tekstNa(p, '[data-tsifra="prihod"]'), EVRO_1200);
  proveri('движенията станаха едно', await tekstNa(p, '[data-tsifra="dvizheniya"]'), '1');
  proveri(
    'сверката на секциите затваря',
    await tekstNa(p, '[data-sverka="smetki"]'),
    'движения 1 · без секция 0 · сверката затваря · Задачите с бюджет са вътре',
  );

  // разход в ПРИХОДНА секция · отказът е с думи (правило 20)
  await noviyatRedSPari(p);
  await p.waitForSelector(ch);
  await p.selectOption(`${ch} select[data-kolona="sektsiya"]`, '1');
  await p.selectOption(`${ch} select[data-kolona="funktsiya"]`, '3');
  await p.fill(`${ch} input[data-kolona="mesets"]`, MESETS);
  await p.fill(`${ch} input[data-kolona="suma"]`, '-1500');
  await p.press(`${ch} input[data-kolona="suma"]`, 'Enter');
  await p.waitForFunction(
    () => (document.querySelector('[data-greshka]')?.textContent ?? '') !== '',
  );
  proveri(
    'знакът не отговаря на секцията · и то се КАЗВА',
    (await tekstNa(p, '[data-greshka]')).includes('Знакът не отговаря на секцията'),
    true,
  );
  // същият ред, но в разходна секция · минава
  await p.selectOption(`${ch} select[data-kolona="sektsiya"]`, '');
  await p.selectOption(`${ch} select[data-kolona="sektsiyaR"]`, '1');
  await p.press(`${ch} input[data-kolona="suma"]`, 'Enter');
  await p.waitForSelector('[data-reshetka="razhod"] tr.red[data-tablitsa="dvizheniya"]');
  // ══ БЮДЖЕТИТЕ НА ЗАДАЧИТЕ СА ЧАСТ ОТ РАЗХОДА · негово, запис 163 ══════
  //
  // „Скриването на Задачите с Бюджет … от Управление в Сметки ще ги ИЗКЛЮЧВА от
  // изчисленията." Дотук те изобщо не бяха включени: рисуваха се като редове със
  // свой междинен сбор, а ОБЩ РАЗХОД ги подминаваше — тоест бутонът „изключваше"
  // нещо, което никога не е било вътре, и числото не мърдаше.
  //
  // Тук: движението е −1 500, а задачата „Сондаж" носи бюджет −250 000.
  proveri(
    'ОБЩ Разходи · движението И бюджетът на задачата',
    await tekstNa(p, '[data-sbor="razhod"]'),
    EVRO_MINUS_251500,
  );
  proveri(
    'Резултатът е приход + разход',
    await tekstNa(p, '[data-tsifra="rezultat"]'),
    EVRO_MINUS_250300,
  );
  // И БУТОНЪТ ГИ ВАЖДА · сборът пада ТОЧНО с бюджета им, не с друго число
  await natisniButon(p, 'skriy-dela');
  await p.waitForFunction(
    (evro) => document.querySelector('[data-sbor="razhod"]')?.textContent?.trim() === evro,
    EVRO_MINUS_1500,
  );
  proveri(
    'ИЗВАДЕНИТЕ задачи излизат и от сметката · сборът пада с бюджета им',
    `${await tekstNa(p, '[data-sbor="razhod"]')} · ${await tekstNa(p, '[data-tsifra="rezultat"]')}`,
    `${EVRO_MINUS_1500} · -300,00 €`,
  );
  // и се връщат · ЕДИН бутон, две посоки
  await natisniButon(p, 'skriy-dela');
  await p.waitForFunction(
    (evro) => document.querySelector('[data-sbor="razhod"]')?.textContent?.trim() === evro,
    EVRO_MINUS_251500,
  );
  proveri(
    'секцията „Вкарване" събира трите му секции',
    (await tekstoveNa(p, '[data-reshetka="vkarvane"] tr.sektsiya td:first-child')).join(' · '),
    'Заплати Кеш · Фактури Кеш · Фактури Карта',
  );
  proveri(
    'и редът за заплати е вътре',
    await p.$$eval('[data-reshetka="vkarvane"] tr.red', (es) => es.length),
    1,
  );

  // ══ 4в · кешът за месеца · сверката в края на месеца ═════════════════
  razdel = '4в · кешът';
  // „дадени за Заплати Кеш" вече НЕ се пише · то идва сметнато от секцията,
  // където горният раздел вкара реда за заплати (негово, 13.09, точка 3)
  proveri(
    'дадените пари са ЗАТВОРЕНА клетка · няма поле за писане',
    await p.$$eval('[data-kesh-forma] [data-pole="kesh-zaplati"] input', (es) => es.length),
    0,
  );
  await p.fill('[data-kesh-mesets]', MESETS);
  await p.fill('[data-kesh-izvlechenie]', '1500');
  await p.click('[data-kesh-zapishi]');
  // ЧАКА СЕ ИЗТЕГЛЕНОТО, не даденото: даденото вече Е 1 500 преди записа, защото
  // се смята от секцията, и чакане по него би минало, преди Портата да е върнала.
  await p.waitForFunction(
    (evro) =>
      document.querySelector('[data-tsifra="trezor-iztegleno"]')?.textContent?.trim() === evro,
    EVRO_1500,
  );
  // ЧИСЛАТА ЖИВЕЯТ НА ЕДИН РЕД · негово, 13.09 (запис 203) т.3. Дотук ги имаше и
  // горе, и тук; горните слязоха, и проверката гледа там, където те са.
  proveri(
    'дадени Заплати Кеш · сметнати от секцията, не писани',
    await tekstNa(p, '[data-tsifra="kesh-zaplati"]'),
    EVRO_1500,
  );
  proveri('Изтеглено · Карта', await tekstNa(p, '[data-tsifra="trezor-iztegleno"]'), EVRO_1500);
  proveri('полетата на двете форми имат име', await poletaBezIme(p), 0);
  const sverki = await tekstNa(p, '[data-kesh-sverki]');
  // ЕДНА сверка · другата стана тъждество, когато дадените пари почнаха да се
  // смятат от същите редове, срещу които се сверяваха (негово, 13.09 т.3)
  proveri(
    // ДВЕТЕ, които той изброи (запис 203 т.3). Втората е тъждество и винаги
    // затваря — но денят, в който спре, значи, че даденото и редовете са се
    // разминали. Изброено от него не изчезва мълчаливо (правило 12).
    'двете сверки на кеша стоят на реда · и втората винаги затваря',
    `${sverki.split('затваря').length - 1} · ${sverki.includes('разлика')}`,
    '2 · false',
  );

  // ══ 4в2 · БАЛАНСЪТ и записът по месеци · негово, 13.09 (запис 203) т.5 ═
  razdel = '4в2 · Балансът';
  // приход 1 200 · разход −1 500 · кешът е нула → балансът е под нулата, и това е
  // ЧЕРВЕНО веднага, без да се пита за колко месеца стигат парите
  proveri(
    'Балансът носи СВЕТОФАР · и той се решава от ЧИСЛАТА, не от стила',
    `${await p.$eval('[data-pole="balans"]', (e) => e.getAttribute('data-svetofar'))} · ${await tekstNa(
      p,
      '[data-tsifra="balans"]',
    )}`,
    `cherveno · ${EVRO_MINUS_300}`,
  );
  proveri(
    'подсказката му КАЗВА формулата · и че извлечения още не се четат',
    (await p.$eval('[data-pole="balans"]', (e) => e.getAttribute('data-podskazka') ?? '')).includes(
      'Извлечения от банка още не се четат',
    ),
    true,
  );
  proveri(
    'записът по месеци стои под двете страни · един ред на месец',
    await p.$$eval('[data-reshetka="razliki"] tbody tr.red', (es) => es.length),
    1,
  );
  proveri(
    'и разликата за месеца е приход + разход',
    await tekstNa(p, `[data-razlika-suma="${MESETS}"]`),
    EVRO_MINUS_300,
  );

  // ══ 4в3 · ПЕРИОДЪТ УПРАВЛЯВА СМЕТКИТЕ · негово, 13.09 (запис 205) ═════
  // „Да има и според вкарания период, а ако е сега периода да е за периода на
  // такта. Това така да влиае на останалите изчисления и да се съобраазява
  // изцяло в сметките с календара."
  razdel = '4в3 · периодът на календара';
  proveri(
    'подсказката на Баланса КАЗВА двата обхвата · числото е натрупано, цветът е за периода',
    (await p.$eval('[data-pole="balans"]', (e) => e.getAttribute('data-podskazka') ?? '')).includes(
      'ЧИСЛОТО е натрупано',
    ) &&
      (
        await p.$eval('[data-pole="balans"]', (e) => e.getAttribute('data-podskazka') ?? '')
      ).includes('ЦВЕТЪТ е за периода'),
    true,
  );
  // ВКАРАН ПЕРИОД далеч от данните · сметките се свиват до него, балансът остава
  await p.fill('[data-period-ot]', '2020-01-01');
  await p.fill('[data-period-do]', '2020-03-31');
  await p.waitForFunction(
    (evro) => document.querySelector('[data-tsifra="prihod"]')?.textContent?.trim() === evro,
    EVRO_0,
  );
  proveri(
    'вкараният период свива ПРИХОДА и РАЗХОДА · парите извън него не се броят',
    `${await tekstNa(p, '[data-tsifra="prihod"]')} · ${await tekstNa(p, '[data-tsifra="razhod"]')}`,
    `${EVRO_0} · ${EVRO_0}`,
  );
  proveri(
    'но БАЛАНСЪТ не мърда · той е състояние, не отчет за период',
    await tekstNa(p, '[data-tsifra="balans"]'),
    EVRO_MINUS_300,
  );
  proveri(
    'и записът по месеци се свива с периода · няма месец в него',
    await p.$$eval('[data-reshetka="razliki"] tbody tr.red', (es) => es.length),
    0,
  );
  // обратно на година · всичко се връща
  await p.selectOption('[data-takt]', 'godina');
  await p.waitForFunction(
    (evro) => document.querySelector('[data-tsifra="prihod"]')?.textContent?.trim() === evro,
    EVRO_1200,
  );
  proveri(
    'такт година връща периода около днес · и приходът се вижда пак',
    `${await tekstNa(p, '[data-tsifra="prihod"]')} · ${await p.$$eval(
      '[data-reshetka="razliki"] tbody tr.red',
      (es) => es.length,
    )}`,
    `${EVRO_1200} · 1`,
  );

  // ══ 4г · Книгата · листът Сметки ═════════════════════════════════════
  razdel = '4г · Книгата';
  const [svalyane] = await Promise.all([p.waitForEvent('download'), natisniButon(p, 'svali-fayl')]);
  const pat = (await svalyane.path()) ?? '';
  await p.waitForFunction(() =>
    (document.querySelector('[data-iznos-vest]')?.textContent ?? '').startsWith(
      'Книгата е записана',
    ),
  );
  const kniga = await prochetiKniga(readFileSync(pat));
  const list = kniga.listove.find((l) => l.ime === SMETKI);
  const k = list?.kletki ?? [];
  const red = (duma: string): number => k.findIndex((r) => String(r[0] ?? '') === duma);
  proveri('лентата ПРИХОД я има', red('ПРИХОД') > 0, true);
  proveri('лентата Разходи я има', red('Разходи') > red('ПРИХОД'), true);
  proveri(
    'секцията „Наем Банка" е групов ред с ключ',
    k[red('Наем Банка')]?.[23],
    'grupa:sektsiya:prihod·1',
  );
  const dvizhenie = k.find((r) => String(r[23] ?? '').startsWith('dvizhenie:'));
  proveri(
    'движението носи месеца и сумата си',
    `${dvizhenie?.[5]} · ${dvizhenie?.[10]}`,
    '2026-09 · 1200',
  );
  proveri(
    'и „■" в такта на месеца си',
    (dvizhenie ?? []).slice(11, 23).filter((c) => c === '■').length,
    1,
  );
  proveri('блокът „Кеш" е накрая', red('Кеш') > red('Разходи'), true);
  const kesh = k.find((r) => String(r[23] ?? '').startsWith('kesh:'));
  proveri(
    'кешът за месеца е в Книгата',
    `${kesh?.[0]} · ${kesh?.[1]} · ${kesh?.[3]}`,
    '2026-09 · 1500 · 1500',
  );

  // ══ 4д · вносът · същата Книга = нула предложения ════════════════════
  razdel = '4д · вносът';
  await p.goto(`${ADRES}#/ii`);
  await p.waitForSelector('[data-kniga-vnos]');
  await p.setInputFiles('[data-kniga-vnos]', pat);
  await p.waitForFunction(() =>
    /предложения/.test(document.querySelector('[data-otchet-vest]')?.textContent ?? ''),
  );
  proveri(
    'износ → внос = нула · и със Сметки',
    await tekstNa(p, '[data-otchet-vest]'),
    '0 предложения · 0 находки · 0 бележки',
  );

  // ══ 4з · ТРЕЗОРЪТ · Заданието M06-10 · негово, запис 195 т.5 ══════════
  razdel = '4з · Трезорът';
  // след вноса страницата стои на ИИ · Трезорът живее в Сметки
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector('[data-zalepeno="smetki"]');
  // ЧИСЛО, не праг: редът носи ТОЧНО толкова такт-клетки, колкото са главите
  proveri(
    'Гантът е ЕДНО ЦЯЛО с таблицата · всеки ред носи всички колони на такта',
    await p.$eval(
      '[data-reshetka="prihod"] tbody tr.red',
      (e) => e.querySelectorAll('td.takt').length,
    ),
    await p.$$eval('[data-reshetka="prihod"] thead th.takt', (es) => es.length),
  );
  proveri(
    'и отделна таблица за календара вече НЯМА',
    (await p.$('[data-gant-skrol]')) === null,
    true,
  );

  // негово, 13.09 (запис 203), точка 4: „Трезора се пълни главно от вноски СМР…
  // второ поле показва Изтеглено… и се дава в обща цифра и полето с име Общ Трезор."
  proveri(
    'ТРЕЗОРЪТ е три числа · вноски в брой · изтеглено · и общото, което държим',
    `${await tekstNa(p, '[data-tsifra="trezor"]')} · ${await tekstNa(
      p,
      '[data-tsifra="trezor-iztegleno"]',
    )} · ${await tekstNa(p, '[data-tsifra="trezor-obshto"]')}`,
    `${EVRO_0} · ${EVRO_1500} · ${EVRO_0}`,
  );
  proveri(
    // „Изтеглено · Карта", не „Изтеглено общо" · негово, 13.09 (запис 203) т.4:
    // „изтеглено по извлечение от Карта САМО". Кешът в ръка идва от банкомат,
    // тоест с картата, и се вижда в НЕЙНОТО извлечение (`zadanie/CHISTO/06`
    // M06-12 · M06-19). Числото още се въвежда на ръка и подсказката го казва.
    'и трите имена стоят под числата · и второто казва ОТКЪДЕ идва',
    (
      await tekstoveNa(
        p,
        '[data-pole="trezor"] .ime, [data-pole="trezor-iztegleno"] .ime, [data-pole="trezor-obshto"] .ime',
      )
    ).join(' · '),
    'Трезор · Изтеглено · Карта · Общ Трезор',
  );

  // ══ 4ж · ТАКТЪТ И В СМЕТКИ · негово, 11.09 (запис 195), точка 4 ═══════
  razdel = '4ж · тактът в Сметки';
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector('[data-zalepeno="smetki"]');
  proveri(
    'Сметки също има избор на такт · и той започва от година',
    await p.$eval('[data-takt]', (e) => (e as HTMLSelectElement).value),
    'godina',
  );
  const koloniteNaKalendara = async (): Promise<number> =>
    p.$$eval('[data-reshetka="prihod"] thead th.takt', (es) => es.length);
  const priGodina = await koloniteNaKalendara();
  await p.selectOption('[data-takt]', 'mesets');
  await p.waitForFunction(
    (broy: number) =>
      document.querySelectorAll('[data-reshetka="prihod"] thead th.takt').length !== broy,
    priGodina,
  );
  proveri(
    'такт месец · календарът В ТАБЛИЦАТА се мени от дванайсет колони на дни',
    (await koloniteNaKalendara()) > priGodina,
    true,
  );
  await p.selectOption('[data-takt]', 'godina');
  await p.waitForFunction(
    (broy: number) =>
      document.querySelectorAll('[data-reshetka="prihod"] thead th.takt').length === broy,
    priGodina,
  );

  // ══ 4е · СМЕТКИТЕ В УПРАВЛЕНИЕ · и ЕДИН бутон, който ги крие ══════════
  // Негово, 11.09 (запис 193): „В Управление има същия бутон който обаче крие
  // само редовете на сметки /скрий Сметки/."
  razdel = '4е · сметките в Управление';
  await p.goto(`${ADRES}#/upravlenie`);
  await p.waitForSelector('[data-zalepeno="upravlenie"]');
  proveri(
    'движението стои в дървото · под своя Имот',
    (await tekstoveNa(p, 'tr.red.dvizhenie td[data-kolona="suma"]')).join(' · '),
    EVRO_1200,
  );
  proveri(
    'сверката го брои и казва колко са без родител',
    await tekstNa(p, '[data-sverka="smetki"]'),
    'сметки 1 от 2 · без родител 1 · Сметки са вътре',
  );
  proveri(
    // ВКАРАЙ ↔ ИЗВАДИ, не „Скрий/Покажи" · негово, 13.09 (запис 210): „с по един
    // бутон се пуска и изклюва ДОБАВЯНЕТО". Скриването е поглед; добавянето решава
    // дали чуждите редове изобщо влизат — и в Сметки изваденото излиза и от
    // сметката (запис 163).
    'бутонът казва „Извади Сметки", защото пуска и спира ДОБАВЯНЕТО',
    await litseNaButona(p, 'skriy-dela'),
    'Извади Сметки',
  );
  await natisniButon(p, 'skriy-dela');
  await p.waitForFunction(() => document.querySelectorAll('tr.red.dvizhenie').length === 0);
  proveri(
    'натиснат · редовете ги няма и сверката го КАЗВА',
    `${await tekstNa(p, '[data-sverka="smetki"]')} · ${await litseNaButona(p, 'skriy-dela')}`,
    'сметки 0 от 2 · без родител 1 · Сметки са извадени · Вкарай Сметки',
  );
  await natisniButon(p, 'skriy-dela');
  await p.waitForSelector('tr.red.dvizhenie');

  // ══ 4ж · ЕДИН РЕЖИМ ЗА ДВАТА ПРОЗОРЕЦА ═══════════════════════════════
  // Негово, 12.09 (запис 202): „Календара има две нива за които говорихме. В
  // едното състочние включват редовете с бюджет и редовете от Сметки, а
  // другото включва само Задачите без да се вкарва в календара бюджета на
  // всяко от тях което има… Двата бутона сменят и двата режима в Управление
  // и в Сметки."
  razdel = '4ж · двата режима на календара';
  proveri(
    'режим ПАРИ по подразбиране · лентата носи и името, и бюджета',
    await p.$eval('tr.red.zadacha td.takt.lenta', (e) => (e as HTMLElement).innerText.trim()),
    `Дело Сондаж · ${EVRO_250000}`,
  );
  await natisniButon(p, 'skriy-dela');
  await p.waitForFunction(
    () =>
      document.querySelector('tr.red.zadacha td.takt.lenta')?.textContent?.trim() === 'Дело Сондаж',
  );
  proveri(
    'режим ЗАДАЧИ · в календара остава САМО текстът · бюджетът не влиза',
    `${await p.$eval('tr.red.zadacha td.takt.lenta', (e) => (e as HTMLElement).innerText.trim())} · сметки ${await p.$$eval('tr.red.dvizhenie', (es) => es.length)}`,
    'Дело Сондаж · сметки 0',
  );
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector(ZALEPENO);
  proveri(
    'СЪЩИЯТ режим е стигнал и до Сметки · секцията на задачите я няма',
    `${await litseNaButona(p, 'skriy-dela')} · секции ${await p.$$eval('[data-sbor-zadachi]', (es) => es.length)}`,
    'Вкарай Задачи · секции 0',
  );
  await natisniButon(p, 'skriy-dela');
  await p.waitForSelector('[data-sbor-zadachi]');
  proveri(
    // И ИМЕТО, И ЧИСЛОТО · негово, 12.09 (запис 201): „Когато има едновременно и
    // бюджет и текст на задачата да се показват и двете в едно и също поле."
    // Коментарът в кода го обещаваше от същия ден, а извикването не подаваше името
    // — поправено на 13.09 заедно с останалите редове без календар.
    'върнат в ПАРИ от бутона на Сметки · клетката носи И името, И бюджета',
    await p.$eval('tr.red.zadacha td.takt.evro', (e) => (e as HTMLElement).innerText.trim()),
    `Сондаж · ${EVRO_MINUS_250000}`,
  );
  await p.goto(`${ADRES}#/upravlenie`);
  await p.waitForSelector('tr.red.dvizhenie');
  proveri(
    'и бутонът в Управление се е върнал заедно с него · един режим, два бутона',
    await litseNaButona(p, 'skriy-dela'),
    'Извади Сметки',
  );

  // ══ 4и · ВРЕМЕТО НЕ Е КОЛОНА · то е позиция в календара ══════════════
  // Негово, 13.09 (запис 204): „Редовете не показват време, това става в
  // календара на един ред на всяка колона която е такт. Когато се сменя такта
  // на календара се събират сумите от дните на такта."
  razdel = '4и · времето е в календара';
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector(ZALEPENO);
  proveri(
    'в реда НЯМА клетка с време · нито месец, нито дата',
    await p.$$eval(
      '[data-reshetka="prihod"] td.kletka[data-kolona="mesets"], [data-reshetka="prihod"] td.kletka[data-kolona="data"]',
      (es) => es.length,
    ),
    0,
  );
  proveri(
    'а времето се РЕДАКТИРА в календара · клетката с числото отваря месеца',
    await p.$$eval('[data-reshetka="prihod"] td.takt[data-redakt$="·mesets"]', (es) => es.length),
    1,
  );
  // при по-едър такт сумите на дните ВЪТРЕ в колоната се събират в нея
  await p.selectOption('[data-takt]', 'den');
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="gant"]')?.textContent?.includes('такт ден'),
  );
  const priDen = await p.$$eval('[data-reshetka="prihod"] tfoot td.takt', (es) =>
    es.map((e) => e.textContent?.trim() ?? '').filter((x) => x !== ''),
  );
  await p.selectOption('[data-takt]', 'godina');
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="gant"]')?.textContent?.includes('такт година'),
  );
  const priGodinata = await p.$$eval('[data-reshetka="prihod"] tfoot td.takt', (es) =>
    es.map((e) => e.textContent?.trim() ?? '').filter((x) => x !== ''),
  );
  proveri(
    'СЪЩАТА сума, събрана в по-малко колони · тактът мени колоните, не парите',
    `${priDen.join(' ')} · ${priGodinata.join(' ')}`,
    `${EVRO_1200} · ${EVRO_1200}`,
  );

  // ══ 4з · ФИЛТЪРЪТ В СМЕТКИ · падащо меню, както в Управление ═════════
  // Негово, 12.09 (запис 199), точка 5: „В сметки да е същото."
  razdel = '4з · филтърът в Сметки';
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector(ZALEPENO);
  proveri(
    'редът „филтър" стои под главите и в двете таблици · по едно меню на колона',
    `${await p.$$eval('tr.filtar[data-filtar-red]', (es) => es.length)} · ${await p.$$eval('[data-reshetka="prihod"] tr.filtar td select', (es) => es.length)}`,
    // ПЕТ колони, не шест: колоната с месеца излезе от таблицата · времето е в
    // календара (негово, 13.09 · запис 204)
    '2 · 5',
  );
  proveri(
    'първото меню започва с „всички" · после въведеното',
    (
      await p.$$eval('[data-reshetka="prihod"] tr.filtar [data-filtar-smetki="0"] option', (es) =>
        es.map((e) => e.textContent),
      )
    )[0],
    'всички',
  );
  const vsichkiPrihod = await tekstNa(p, '[data-sverka="filtar-prihod"]');
  proveri('без филтър сверката не се оплаква', vsichkiPrihod.includes('филтърът е включен'), false);
  // Избира се СУМАТА на реда в Приход · тя я няма в нито един ред на Разходи,
  // тъй че се вижда и че филтърът пипа ДВЕТЕ таблици с един избор.
  await p.selectOption('[data-reshetka="prihod"] [data-filtar-smetki="4"]', EVRO_1200);
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="filtar-razhod"]')?.textContent?.startsWith('видими 0'),
  );
  proveri(
    'един избор пипа ДВЕТЕ таблици · Приход остава, Разходи се изпразва',
    `${await tekstNa(p, '[data-sverka="filtar-prihod"]')} · ${(
      await tekstNa(p, '[data-sverka="filtar-razhod"]')
    ).startsWith('видими 0')}`,
    'видими 1 от 1 · филтърът е включен · true',
  );
  proveri(
    'Приход си остава със сбора на видимия ред · само видимото се смята (запис 163)',
    await tekstNa(p, '[data-sbor="prihod"]'),
    EVRO_1200,
  );
  await p.selectOption('[data-reshetka="prihod"] [data-filtar-smetki="4"]', '');
  await p.waitForFunction(() => {
    const d = document.querySelector('[data-sverka="filtar-razhod"]');
    return d !== null && !d.textContent?.startsWith('видими 0');
  });
  proveri(
    'върнат на „всички" · Разходи се връща цял и сверката спира да се оплаква',
    `${await tekstNa(p, '[data-sverka="filtar-prihod"]')} · ${await tekstNa(p, '[data-sbor="prihod"]')}`,
    `${vsichkiPrihod} · ${EVRO_1200}`,
  );

  // ══ 4к · ЕДИН РЕД НА ЕДНО НЕЩО · негово, 13.09 (запис 213) т.2 ══════════
  //
  // „Редовете с една и съща Задача или ред от сметки НЕ СЕ ПРЕНАСЯ В НОВ РЕД
  // всеки месец, а това става в самия календар където всеки ред минава през
  // всеки такт, ако етапа е по голям събира всички за периода от реда в
  // календара и го покзава в колона бюджет на всеки ред."
  //
  // Разделът стои НАКРАЯ нарочно: той добавя втори запис на едно и също нещо, а
  // всяка проверка след него, която брои движения, би отчела едно в повече.
  razdel = '4к · един ред на едно нещо';
  await noviyatRedSPari(p);
  await p.waitForSelector(ch);
  await p.selectOption(`${ch} select[data-kolona="kam"]`, { index: 1 });
  await p.selectOption(`${ch} select[data-kolona="sektsiya"]`, '1');
  await p.selectOption(`${ch} select[data-kolona="funktsiya"]`, '3');
  await p.fill(`${ch} input[data-kolona="mesets"]`, MESETS);
  await p.fill(`${ch} input[data-kolona="suma"]`, '1200');
  await p.press(`${ch} input[data-kolona="suma"]`, 'Enter');
  await p.waitForFunction(
    () =>
      document.querySelectorAll('[data-reshetka="prihod"] tbody tr.red[data-v-grupata]').length ===
      1,
  );
  proveri(
    'ДВА записа · ЕДИН ред на екрана',
    `${await p.$$eval('[data-reshetka="prihod"] tbody tr.red', (es) => es.length)} · ${await p.$eval(
      '[data-reshetka="prihod"] tbody tr.red[data-v-grupata]',
      (e) => e.getAttribute('data-v-grupata'),
    )}`,
    '1 · 2',
  );
  proveri(
    'СБОРЪТ за периода стои в колоната · не сумата на едното плащане',
    await p.$eval('[data-reshetka="prihod"] tbody tr.red td[data-kolona="suma"]', (e) =>
      (e as HTMLElement).innerText.trim(),
    ),
    '2 400,00 €',
  );
  proveri(
    'и НЕ СЕ РЕДАКТИРА · сборът на две плащания не е число за пренаписване',
    await p.$eval('[data-reshetka="prihod"] tbody tr.red td[data-kolona="suma"]', (e) =>
      e.hasAttribute('data-redakt'),
    ),
    false,
  );
  proveri(
    'клетката на календара носи ДВЕТЕ · и казва, че са две',
    `${await p.$eval(
      '[data-reshetka="prihod"] tbody tr.red td.takt.dvizhenie',
      // само първият текстов възел · броячът е свой елемент до числото
      (e) => e.firstChild?.textContent?.trim() ?? '',
    )} · ${await p.$eval(
      '[data-reshetka="prihod"] tbody tr.red td.takt.dvizhenie .pokrivashti',
      (e) => e.textContent,
    )}`,
    '2 400,00 € · 2',
  );
  proveri(
    'но СЕ ПИПА · белегът за редакция сочи едно от двете',
    await p.$$eval('[data-reshetka="prihod"] tbody tr.red td.takt[data-redakt]', (es) => es.length),
    1,
  );
  proveri(
    'и броячът КАЗВА, че нищо не е изчезнало',
    (await tekstNa(p, '[data-sverka="filtar-prihod"]')).includes(
      '1 повторения се четат в календара',
    ),
    true,
  );
  // ══ 4л · ПОКАЗАТЕЛИТЕ КАЗВАТ СЪЩОТО · негово, запис 213 т.2 ═════════════
  //
  // „Тези сборни за Задачи и сметки Бюджето УЧАСТВАТ в сметките на Коефициентите
  // под таблица и календар в СМетки."
  //
  // Показателите се смятат от `Smetki`, който знае само редовете с пари; ДДС се
  // СМЯТА от таблицата, а бюджетите идват от Управление. Не влизаха ли и в трите
  // места, числото под таблицата би се разминало със сбора точно над нея — и
  // никой не би разбрал кое от двете лъже. Тук се пита дали СЪВПАДАТ.
  razdel = '4л · показателите казват същото';
  const chislo = async (izbor: string): Promise<string> =>
    (await tekstNa(p, izbor)).replace(/^-/, '');
  proveri(
    'ОБЩ ПРИХОД горе и „Приход общо" отдолу са ЕДНО число',
    `${await chislo('[data-sbor="prihod"]')} · ${await chislo(
      '[data-pokazatel="prihod"] .tsifra',
    )}`,
    `${await chislo('[data-sbor="prihod"]')} · ${await chislo('[data-sbor="prihod"]')}`,
  );
  proveri(
    'ОБЩ РАЗХОД горе и „Разход общо" отдолу също · по модул, защото разходът е с минус',
    `${await chislo('[data-sbor="razhod"]')} · ${await chislo(
      '[data-pokazatel="razhod"] .tsifra',
    )}`,
    `${await chislo('[data-sbor="razhod"]')} · ${await chislo('[data-sbor="razhod"]')}`,
  );
  proveri(
    'и РЕЗУЛТАТЪТ в лентата горе е резултатът на показателите',
    `${await tekstNa(p, '[data-tsifra="rezultat"]')} · ${await tekstNa(
      p,
      '[data-pokazatel="rezultat"] .tsifra',
    )}`,
    `${await tekstNa(p, '[data-tsifra="rezultat"]')} · ${await tekstNa(p, '[data-tsifra="rezultat"]')}`,
  );
  proveri(
    'и формулата им КАЗВА, че бюджетите и ДДС са вътре',
    (
      await p.$eval('[data-pokazatel="razhod"]', (e) => e.getAttribute('data-podskazka') ?? '')
    ).includes('бюджетите на задачите'),
    true,
  );
}
