/**
 * МОСТРАТА · бутонът „Напълни с мостра" пълни ВСЯКА таблица, през Портата.
 *
 * Негово, 11.09 (запис 184): „Искам да ми напълниш всяка функционалност с
 * информация измислена." Тестът е машината зад това изречение: празна програма
 * плюс едно викане дава редове във всяка таблица, която човек вижда, и нито
 * едно действие не е минало извън Вратата.
 */

import { describe, expect, it } from 'vitest';
import { MODEL, TABLITSI } from '../src/model/osnova.js';
import { napalniSMostra } from '../src/mostra/napalni.js';
import { Izpalnitel } from '../src/porta/izpalnitel.js';
import { koyPishe } from '../src/yadro/index.js';
import { KNIGA, knigaZaTest, STOPANIN, USTROYSTVO, VALUTA } from './pomoshtni.js';

const DNES = '2026-09-11';

async function otvori() {
  const k = knigaZaTest();
  let takt = 0;
  return Izpalnitel.otvori({
    vrata: k.vrata,
    dnevnik: k.dnevnik,
    model: MODEL,
    ...koyPishe(KNIGA),
    ustroystvo: USTROYSTVO,
    valuta: VALUTA,
    aktor: () => STOPANIN,
    sega: () => {
      takt += 1;
      return new Date(Date.parse('2026-09-11T09:00:00.000Z') + takt * 1000).toISOString();
    },
  });
}

describe('мострата · измислените данни', () => {
  it('пълни всяка таблица на човека · и нито един отказ по пътя', async () => {
    const porta = await otvori();
    expect(porta.ogledalo().stopanin).toBe('');

    const redove = await napalniSMostra(porta, STOPANIN, DNES);

    // ПЪРВО обхватът · разписка с нула реда прави всяко твърдение под нея зелено
    expect(redove.length).toBeGreaterThan(8);
    expect(redove.filter((r) => r.otkaz !== '')).toEqual([]);

    const o = porta.ogledalo();
    expect(o.stopanin).toBe(STOPANIN);
    // всяка таблица, която НЕ е наша служебна, трябва да носи редове
    const prazni = TABLITSI.filter((t) => (o.tablitsi.get(t.klyuch)?.broy ?? 0) === 0).map(
      (t) => t.klyuch,
    );
    expect(prazni).toEqual([]);
    expect(o.broySabitiya).toBeGreaterThan(20);
  });

  it('второ пълнене не удвоява · мострата не пипа заварено', async () => {
    const porta = await otvori();
    await napalniSMostra(porta, STOPANIN, DNES);
    const predi = porta.ogledalo().broySabitiya;

    const vtoro = await napalniSMostra(porta, STOPANIN, DNES);

    expect(porta.ogledalo().broySabitiya).toBe(predi);
    expect(vtoro.every((r) => r.broy === 0)).toBe(true);
  });

  /**
   * РАЗПИСКИТЕ ЗА ВНОС · негов избор, 13.09 (запис 209), по думата му от запис
   * 184: „Искам да ми напълниш всяка функционалност с информация измислена."
   *
   * Прозорецът ИИ зееше на три места и това беше едното: „Разписки за внос —
   * още няма". С него мълчаха и двете клетки на Сверчика („още не е викан",
   * „няма прочетена Книга"), защото те се четат от ПОСЛЕДНАТА разписка.
   */
  it('пише РАЗПИСКИ ЗА ВНОС · инак прозорецът ИИ зее на три места', async () => {
    const porta = await otvori();
    expect(porta.ogledalo().vnasyaniya.length).toBe(0);
    await napalniSMostra(porta, STOPANIN, DNES);
    const v = porta.ogledalo().vnasyaniya;
    expect(v.length).toBe(3);
    // числата са СВЪРЗАНИ, не случайни · командата ги проверява
    for (const r of v) {
      expect(r.izbrani).toBeLessThanOrEqual(r.predlozheni);
      expect(r.prieti + r.otkazani).toBeLessThanOrEqual(r.izbrani);
    }
    // и ПОСЛЕДНАТА е днешната · от нея Сверчикът чете времето и отчета си
    expect(v.at(-1)?.vnesenoNa.slice(0, 10)).toBe(DNES);
  });

  it('второ пълнене не удвоява РАЗПИСКИТЕ · както не удвоява и редовете', async () => {
    const porta = await otvori();
    await napalniSMostra(porta, STOPANIN, DNES);
    await napalniSMostra(porta, STOPANIN, DNES);
    expect(porta.ogledalo().vnasyaniya.length).toBe(3);
  });
});
