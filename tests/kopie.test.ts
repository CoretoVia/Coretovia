/**
 * РЕЗЕРВНОТО КОПИЕ · Журналът излиза цял и се връща цял · ДЛ-Н1.
 *
 * ═══ ЦЕНАТА, ПЛАТЕНА НА 14.09.2026 ═══
 *
 * Негово, 14:51 (запис 229): „Журнала съхранява ли данните вече. Мога ли да
 * попълвам моите вече?"
 *
 * Измерено в истински браузър, преди този файл да съществува:
 *
 *   · Журналът СЪХРАНЯВА · 131 събития оцеляха пълно затваряне на браузъра;
 *   · `navigator.storage.persist()` върна „изтриваемо" — браузърът има право да
 *     ги изхвърли при недостиг на място;
 *   · свалената Книга (.xlsx) е СНИМКА на живите редове. Качена наново след
 *     триене: 1 събитие, ОБЩ ПРИХОД 0,00 €. Историята не се върна.
 *   · `vazstanovi` стоеше в `src/yadro/vrata.ts` с НУЛА викащи (ДЛ-Н1, от 08.09).
 *
 * Тоест отговорът на въпроса му беше „не": данните се пазят, докато никой не ги
 * пипне, и няма път назад.
 *
 * И ЕДНО ОТКРИТИЕ ОТ САМОТО СТРОЕНЕ. Първият опит върна копието СЛЕД влизане и
 * Вратата отказа с право: „Двете истории се разделят на seq 1." Влизането вече е
 * записало първото събитие — откриването на Книгата, с нов час и нов хеш.
 * Правилото на Вратата е вярно и не се пипа (правило 1); мястото на входа беше
 * грешно. Затова връщането живее на ЕКРАНА ЗА ВЛИЗАНЕ, преди първата дума.
 */

import { describe, expect, it } from 'vitest';
import { kopieNaZhurnala, prochetiKopie } from '../src/yadro/kopie.js';
import { proveriVerigata, Vrata } from '../src/yadro/index.js';
import { DnevnikVPametta, KNIGA, operatsiya, SHA, VsichkoRazresheno } from './pomoshtni.js';

/** Журнал с няколко събития · и байтовете му като файл. */
async function zhurnalSTri() {
  const dnevnik = new DnevnikVPametta();
  const vrata = new Vrata({ dnevnik, pravata: new VsichkoRazresheno(), sha: SHA });
  await vrata.dobavi(operatsiya({ opId: 'op-1' }));
  await vrata.dobavi(operatsiya({ opId: 'op-2' }));
  await vrata.dobavi(operatsiya({ opId: 'op-3' }));
  return { dnevnik, sabitiya: await dnevnik.chetiVsichki(KNIGA) };
}

describe('Н1 · резервното копие на Журнала', () => {
  it('Н1 · Журналът излиза цял и се ВРЪЩА цял в празна Книга', async () => {
    const { sabitiya } = await zhurnalSTri();
    expect(sabitiya, 'обходът трябва да е видял Журнал').toHaveLength(3);

    const fayl = kopieNaZhurnala(sabitiya);
    // ЕДИН РЕД НА СЪБИТИЕ · това е целият договор на формата
    expect(fayl.trimEnd().split('\n')).toHaveLength(3);

    const prochetenoto = prochetiKopie(fayl);
    expect(prochetenoto.greshka).toBe('');
    expect(prochetenoto.sabitiya).toEqual(sabitiya);

    // ПРАЗНА Книга · и връщането я пълни
    const prazen = new DnevnikVPametta();
    const vrata = new Vrata({ dnevnik: prazen, pravata: new VsichkoRazresheno(), sha: SHA });
    const r = await vrata.vazstanovi(KNIGA, sabitiya[0]!.actor, prochetenoto.sabitiya);
    expect(r.vneseni).toBe(3);
    expect(await prazen.chetiVsichki(KNIGA)).toEqual(sabitiya);
    expect((await proveriVerigata(await prazen.chetiVsichki(KNIGA), SHA)).tsyala).toBe(true);
  });

  it('Н1 · ПИПНАТ файл се ОТКАЗВА и НЕ ВЛИЗА НИЩО', async () => {
    const { sabitiya } = await zhurnalSTri();
    const redove = kopieNaZhurnala(sabitiya).trimEnd().split('\n');
    // счупва се СРЕДНОТО звено · авторът влиза в подписа (правило 4)
    redove[1] = redove[1]!.replace(/"actor":"[^"]*"/u, '"actor":"chuzhd@example.bg"');

    const prochetenoto = prochetiKopie(`${redove.join('\n')}\n`);
    expect(prochetenoto.greshka, 'счупеното е в ХЕША, не в JSON-а').toBe('');

    const prazen = new DnevnikVPametta();
    const vrata = new Vrata({ dnevnik: prazen, pravata: new VsichkoRazresheno(), sha: SHA });
    await expect(
      vrata.vazstanovi(KNIGA, sabitiya[0]!.actor, prochetenoto.sabitiya),
    ).rejects.toMatchObject({ kod: 'NESAVMESTIM' });
    // НИЩО не е влязло · сверката е ПРЕДИ записа, не след него
    expect(await prazen.chetiVsichki(KNIGA)).toHaveLength(0);
  });

  it('Н1 · нечетим файл КАЗВА къде се е спънал · и не връща половин Журнал', () => {
    const { greshka, sabitiya } = prochetiKopie('{"seq":1}\nтова не е JSON\n');
    expect(greshka).toContain('Ред 2');
    expect(sabitiya, 'половин Журнал е по-опасен от липсващ').toHaveLength(0);

    const bezSeq = prochetiKopie('{"nesto":1}\n');
    expect(bezSeq.greshka).toContain('няма поле „seq"');

    const prazen = prochetiKopie('\n\n');
    expect(prazen.greshka).toContain('нито едно събитие');
  });

  it('Н1 · празен Журнал дава празен файл · не ред от нищо', () => {
    expect(kopieNaZhurnala([])).toBe('');
  });
});
