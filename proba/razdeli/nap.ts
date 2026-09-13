import { readFileSync } from 'node:fs';
import { prochetiKniga } from '../../src/kniga/ooxml.ts';
import type { KonteksNaProhoda } from '../yadro/kontekst.ts';
import { natisniButon, tekstNa, tekstoveNa } from '../yadro/pomoshtni.ts';
import { mesetsatNaProhoda, mesetsatPredi } from '../yadro/kalendar.ts';
import { ADRES } from '../yadro/server.ts';

const SMETKI = 'Сметки';
/**
 * Месецът е ТЕКУЩИЯТ, не закован.
 *
 * „2026-09" щеше да спре да работи след 01.11.2026: листът Сметки реже
 * колоните си от предишния месец нататък, тъй че старият месец излиза извън
 * прозореца и „■" не се пише никъде (ADR-015).
 */
const MESETS = mesetsatNaProhoda();
const MESETS_PREDI = mesetsatPredi();
/** ДДС за двата месеца · 500 + 300, разход, с минус (правило 16) */
const EVRO_MINUS_800 = '-800,00 €';
/** еврото по нормата му · тясна пауза (U+202F) */
const EVRO_500 = '500,00 €';
const EVRO_MINUS_500 = '-500,00 €';

/** 5 · подтаб НАП · ДДС по месеци · редът в Сметки · таблицата с находки */
export async function blok1(ctx: KonteksNaProhoda): Promise<void> {
  const { stranitsa: p, broyach } = ctx;
  let razdel = '—';
  const proveri = (kakvo: string, vidyano: unknown, ochakvano: unknown): boolean =>
    broyach.proveri(razdel, kakvo, vidyano, ochakvano);

  // ══ 5а · подтабът · ДДС за месеца ════════════════════════════════════
  razdel = '5а · подтаб НАП';
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector('[data-podtabove]');
  proveri(
    'петте подтаба · неговите от записи 143 · 144 · 198',
    (await tekstoveNa(p, '[data-podtab]')).join(' · '),
    'Сметки · Приходи · Разходи · Проверки · НАП',
  );
  await p.click('[data-podtab="nap"]');
  await p.waitForSelector('[data-dds-forma]');
  proveri(
    'НАП казва, че няма връзка с НАП · и че Микроинвест чака мостра',
    (await tekstNa(p, '[data-nap-obobshtenie]')).includes('Няма връзка с НАП'),
    true,
  );
  await p.fill('[data-dds-mesets]', MESETS);
  await p.fill('[data-dds-nachislen]', '900');
  await p.fill('[data-dds-kredit]', '400');
  await p.fill('[data-dds-deklarirano]', '500');
  await p.fill('[data-dds-plateno]', '500');
  await p.click('[data-dds-zapishi]');
  await p.waitForSelector('[data-reshetka="dds"] tr.red');
  proveri(
    'дължимото се СМЯТА · начислен − кредит',
    await tekstNa(p, `[data-dalzhimo="${MESETS}"]`),
    EVRO_500,
  );
  proveri(
    'остатъкът е нула · платено = дължимо',
    await tekstNa(p, `[data-ostatak="${MESETS}"]`),
    '0,00 €',
  );
  proveri('натрупването отдолу', await tekstNa(p, '[data-dds-dalzhimo]'), EVRO_500);

  // ══ 5б · находките от сверките ═══════════════════════════════════════
  razdel = '5б · находките';
  await p.fill('[data-dds-deklarirano]', '450');
  await p.click('[data-dds-zapishi]');
  // чака се САМАТА нова находка · таблицата вече я има от друга проверка, и
  // изчакване за нея би прочело старото състояние (честност · обход Е)
  await p.waitForFunction(() =>
    (document.querySelector('[data-nap-nahodki]')?.textContent ?? '').includes('dds-deklarirano'),
  );
  // ЕДИН прочит на целия ред · две четения от две колони могат да паднат между
  // тях в ново рисуване и да сверят различни състояния
  const redoveNaNahodkite = await tekstoveNa(p, '[data-nap-nahodki] tbody tr');
  const redNaDdsa = redoveNaNahodkite.find((r) => r.includes('dds-deklarirano')) ?? '';
  proveri(
    'находка на ниво ДДС · декларираното не е дължимото',
    `${redNaDdsa.startsWith('ДДС')} · ${redNaDdsa.includes('дължимо 500 ≠ декларирано 450')}`,
    'true · true',
  );
  proveri(
    'полето горе брои находките · ТОЧНО колкото са редовете в таблицата',
    Number(await tekstNa(p, '[data-tsifra="nap-nahodki"]')),
    redoveNaNahodkite.length,
  );

  // ══ 5в · редът на ДДС влиза в Сметки и в резултата ═══════════════════
  razdel = '5в · ДДС в Сметки';
  await p.click('[data-podtab="smetki"]');
  await p.waitForSelector('[data-reshetka="razhod"]');
  proveri(
    'ДДС стои в Разходи · за внасяне',
    (await tekstNa(p, '[data-reshetka="razhod"] tr.red.dds')).includes('за внасяне'),
    true,
  );
  proveri('сборът на ДДС е с минус', await tekstNa(p, '[data-sbor-dds="razhod"]'), EVRO_MINUS_500);
  // платено 500 = дължимо 500 · остатъкът е нула, и това се вижда горе
  proveri('ДДС остатък горе', await tekstNa(p, '[data-tsifra="dds-ostatak"]'), '0,00 €');

  // ══ 5г · Книгата носи блока ДДС · и се чете обратно ══════════════════
  razdel = '5г · Книгата';
  const [svalyane] = await Promise.all([p.waitForEvent('download'), natisniButon(p, 'svali-fayl')]);
  const pat = (await svalyane.path()) ?? '';
  await p.waitForFunction(() =>
    (document.querySelector('[data-iznos-vest]')?.textContent ?? '').startsWith(
      'Книгата е записана',
    ),
  );
  const kniga = await prochetiKniga(readFileSync(pat));
  const k = kniga.listove.find((l) => l.ime === SMETKI)?.kletki ?? [];
  const redVKnigata = k.find((r) => String(r[23] ?? '').startsWith('dds:'));
  proveri(
    'блокът ДДС е в листа · с месеца и числата му',
    `${redVKnigata?.[0]} · ${redVKnigata?.[1]} · ${redVKnigata?.[2]}`,
    '2026-09 · 900 · 400',
  );
  await p.goto(`${ADRES}#/ii`);
  await p.waitForSelector('[data-kniga-vnos]');
  await p.setInputFiles('[data-kniga-vnos]', pat);
  await p.waitForFunction(() =>
    /предложения/.test(document.querySelector('[data-otchet-vest]')?.textContent ?? ''),
  );
  proveri(
    'износ → внос = нула · и с ДДС',
    await tekstNa(p, '[data-otchet-vest]'),
    '0 предложения · 0 находки · 0 бележки',
  );

  // ══ ДВЕТЕ ТАБЛИЦИ · негово, 11.09 (запис 195), точка 5 ═════════════════
  razdel = '5д · двете таблици на НАП';
  // след Книгата страницата стои другаде · двете таблици живеят в подтаб НАП
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector('[data-podtabove]');
  await p.click('[data-podtab="nap"]');
  await p.waitForSelector('[data-nap-neizlyazlo]');
  proveri(
    'сумата, която НЕ излиза, е за МИНАЛИЯ месец · и го казва',
    (await tekstNa(p, '[data-nap-neizlyazlo]')).startsWith('За '),
    true,
  );
  // ВСЕКИ месец стои в ТОЧНО една от двете таблици · това е инвариантът, а не
  // конкретното число: кой месец къде пада зависи от данните, а разделянето — не
  const vDvete = await p.$$eval('[data-nap-tablitsa] tbody tr', (es) => es.length);
  proveri(
    'всеки гледан месец е в точно една от двете таблици',
    `${vDvete} от ${(await tekstNa(p, '[data-nap-neizlyazlo]')).replace(/^.*Гледани месеци /u, '')}`,
    `${vDvete} от ${String(vDvete)}.`,
  );
  proveri(
    'и двете места ги има · таблица или изречение, че няма нищо',
    `${(await p.$('[data-nap-tablitsa="tekushti"], [data-nap-prazna="tekushti"]')) !== null} · ${
      (await p.$('[data-nap-tablitsa="greshki"], [data-nap-prazna="greshki"]')) !== null
    }`,
    'true · true',
  );

  // ══ 5е · ПРИХОДИ · РАЗХОДИ · ПРОВЕРКИ · негово, 12.09 (запис 198) ══════
  razdel = '5е · трите нови подтаба';
  await p.click('[data-podtab="prihodi"]');
  await p.waitForSelector('[data-sektsiya-izbor="smetki.sektsiyataNaPrihoda"]');
  proveri(
    'Приходи · падащото меню носи имената на редовете му',
    (
      await p.$$eval('[data-sektsiya-izbor="smetki.sektsiyataNaPrihoda"] option', (es) =>
        es.map((e) => e.textContent?.trim() ?? ''),
      )
    ).join(' · '),
    'всички · Наем Банка · Наем Кеш · Бизнес · Други',
  );
  await p.selectOption('[data-sektsiya-izbor="smetki.sektsiyataNaPrihoda"]', '1');
  await p.waitForFunction(() =>
    (document.querySelector('[data-podtab-sverka="prihod"]')?.textContent ?? '').startsWith(
      'секции 1 от',
    ),
  );
  proveri(
    'избраната секция остава сама · и сборът е нейният',
    await tekstNa(p, '[data-podtab-sverka="prihod"]'),
    // ДВА записа на едно и също нещо · разделът 4к на Сметки ги прави, за да
    // докаже групирането (запис 213 т.2). Подтабът брои ЗАПИСИ, не редове на
    // екрана — и точно затова числото тук е две, а на слятата таблица е едно.
    'секции 1 от 4 · редове 2',
  );
  await p.click('[data-podtab="razhodi"]');
  await p.waitForSelector('[data-sektsiya-izbor="smetki.sektsiyataNaRazhoda"]');
  proveri(
    'Разходи · и обединеният избор за Фактури (негово, запис 143)',
    (
      await p.$$eval('[data-sektsiya-izbor="smetki.sektsiyataNaRazhoda"] option', (es) =>
        es.map((e) => e.textContent?.trim() ?? ''),
      )
    ).includes('Фактури · всички заедно'),
    true,
  );
  await p.click('[data-podtab="proverki"]');
  await p.waitForSelector('[data-pusni-proverka]');
  proveri(
    'Проверката е ДЕЙСТВИЕ · таблицата я няма, докато не се натисне',
    `${(await p.$('[data-proverka-chaka]')) !== null} · ${await tekstNa(p, '[data-proverka-vest]')}`,
    'true · проверката не е пускана',
  );
  await p.click('[data-pusni-proverka]');
  await p.waitForFunction(() =>
    (document.querySelector('[data-proverka-vest]')?.textContent ?? '').includes('разминавания'),
  );
  proveri(
    'натисната · разминаванията се появяват и се броят',
    (await tekstNa(p, '[data-proverka-vest]')).includes('разминавания от'),
    true,
  );
  proveri(
    'и казва защо има забавяне от месец без Извлечения',
    (await tekstNa(p, '[data-obyasnenie="proverka-zabavyane"]')).includes('ЕДИН МЕСЕЦ'),
    true,
  );
  // ══ 5ж · ДДС Е ЕДИН РЕД · негово, 14.09 в 00:11 (запис 224) ═════════════
  //
  // „ДДС и Задачи(Дела,( не се резпределя всеки месец на нов ред, а се дава в
  // реда си в календара."
  //
  // Правилото от запис 213 т.2 работеше за приходите и разходите, но МИНАВАШЕ
  // ПОКРАЙ ДДС: там се рисуваше по един ред НА МЕСЕЦ („ДДС 2026-08 · за
  // внасяне", „ДДС 2026-09 · за внасяне", …). Тук се вписва ВТОРИ месец —
  // предишният, защото листът реже колоните си от него нататък — и се пита
  // колко реда са станали.
  razdel = '5ж · ДДС е един ред';
  await p.click('[data-podtab="nap"]');
  await p.waitForSelector('[data-dds-forma]');
  await p.fill('[data-dds-mesets]', MESETS_PREDI);
  await p.fill('[data-dds-nachislen]', '700');
  await p.fill('[data-dds-kredit]', '400');
  await p.fill('[data-dds-deklarirano]', '300');
  await p.fill('[data-dds-plateno]', '300');
  await p.click('[data-dds-zapishi]');
  await p.waitForFunction(
    () => document.querySelectorAll('[data-reshetka="dds"] tbody tr.red').length === 2,
  );
  await p.click('[data-podtab="smetki"]');
  await p.waitForSelector('[data-reshetka="razhod"]');
  proveri(
    'ДВА месеца ДДС · ЕДИН ред на екрана · и двата в календара',
    `редове ${await p.$$eval('tr.red.dds', (es) => es.length)} · група ${await p.$eval(
      'tr.red.dds',
      (e) => e.getAttribute('data-v-grupata'),
    )} · клетки ${await p.$$eval('tr.red.dds td.takt.dvizhenie', (es) => es.length)}`,
    'редове 1 · група 2 · клетки 2',
  );
  proveri(
    'сборът на реда Е сборът на ДДС · едно число, един дом',
    `${await p.$eval('tr.red.dds td.kletka.evro', (e) => (e as HTMLElement).innerText.trim())} · ${await tekstNa(
      p,
      '[data-sbor-dds="razhod"]',
    )}`,
    `${EVRO_MINUS_800} · ${EVRO_MINUS_800}`,
  );
  proveri(
    // ДДС е СМЯТАН от таблицата (правило 20) · няма какво да се мести
    'клетките на ДДС НЕ носят белег за редакция · той е сметнат, не е движение',
    await p.$$eval('tr.red.dds td.takt[data-redakt]', (es) => es.length),
    0,
  );
  proveri(
    'и броячът КАЗВА, че един ред се чете вместо два',
    (await tekstNa(p, '[data-sverka="filtar-razhod"]')).includes(
      '1 повторения се четат в календара',
    ),
    true,
  );

  // подтабът се ПОМНИ · оставен на НАП, той чака следващия раздел на грешно място
  await p.click('[data-podtab="smetki"]');
  await p.waitForSelector('[data-vkarvane-pravo]');
}
