/**
 * ОТМЯНАТА · Ctrl+Z над Журнал, който не се трие.
 *
 * Негово, 14.09.2026 в 18:53 (запис 232) т.4, ДОСЛОВНО: „Върни реда не работи,
 * защото когато го скриеш вече няма къде да натиснещ десен бутон. За това нека
 * да има виняги от всяеки десен бутон на различни места ако има действия даа
 * можеш да ги вртщаш максимален брой пъти от та и да се вклюва с контрол и Z."
 *
 * ДВЕ ПРОВЕРКИ ЗА ДВЕ НЕЩА:
 *   · чистата функция — КОЕ е следващото за отмяна, и трите ѝ отказа са точно
 *     трите на `obshto.storno` (откриване · сторно · погасено);
 *   · изпълнителят — Ctrl+Z, натиснат три пъти подред, връща три стъпки назад и
 *     спира на откриването с ДУМИ, не с тишина.
 */

import { describe, expect, it } from 'vitest';
import { eOtkaz } from '../src/komandi/izpalnenie.js';
import { MODEL } from '../src/model/osnova.js';
import { Izpalnitel } from '../src/porta/izpalnitel.js';
import { dumiZaTipa, sledvashtotoZaOtmyana } from '../src/porta/otmyana.js';
import { TIP } from '../src/sabitiya/registar.js';
import { koyPishe } from '../src/yadro/index.js';
import type { Sabitie } from '../src/yadro/sabitie.js';
import { KNIGA, knigaZaTest, STOPANIN, USTROYSTVO, VALUTA } from './pomoshtni.js';

const PRAZEN_IMOT = { plosht: null, tsena: null, papka: null, adres: null };

async function otvori() {
  const k = knigaZaTest();
  let takt = 0;
  const nachalo = Date.parse('2026-09-14T18:53:00.000Z');
  const iz = await Izpalnitel.otvori({
    vrata: k.vrata,
    dnevnik: k.dnevnik,
    model: MODEL,
    ...koyPishe(KNIGA),
    ustroystvo: USTROYSTVO,
    valuta: VALUTA,
    aktor: () => STOPANIN,
    sega: () => {
      takt += 1;
      return new Date(nachalo + takt * 1000).toISOString();
    },
  });
  return { k, iz };
}

/** голо събитие · само полетата, които отмяната чете */
const sabitie = (seq: number, type: string, id = `x${String(seq)}`): Sabitie =>
  ({
    opId: `op-${String(seq)}`,
    ts: '2026-09-14T00:00:00.000Z',
    valuta: VALUTA,
    kniga: KNIGA,
    pisach: 'kniga',
    ustroystvo: USTROYSTVO,
    actor: STOPANIN,
    type,
    sashtnost: { vid: 'red', id },
    payload: {},
    shema: 1,
    seq,
    prevHash: '',
    hash: '',
  }) as unknown as Sabitie;

describe('отмяната · кое е следващото', () => {
  it('най-новото първо · и трите отказа на сторното, нито един повече', () => {
    const s = [
      sabitie(1, TIP.stopaninZapisan),
      sabitie(2, TIP.redZapisan, 'a'),
      sabitie(3, TIP.redZapisan, 'b'),
      sabitie(4, TIP.storno),
    ];
    // сторното (4) не се отменя · б (3) е следващото
    expect(sledvashtotoZaOtmyana(s, [], KNIGA)?.seq).toBe(3);
    // погасеното (3) се прескача · остава а (2)
    const pogaseno = [
      {
        veriga: KNIGA,
        seq: 3,
        type: '',
        sashtnost: { vid: 'red', id: 'b' },
        prichina: '',
        storniranOt: '',
      },
    ];
    expect(sledvashtotoZaOtmyana(s, pogaseno, KNIGA)?.seq).toBe(2);
    // и откриването (1) НИКОГА · когато и а е погасено, няма какво
    const vsichko = [...pogaseno, { ...pogaseno[0]!, seq: 2 }];
    expect(sledvashtotoZaOtmyana(s, vsichko, KNIGA)).toBeNull();
  });

  it('погасеното в ДРУГА верига не брои · веригите са отделни истории', () => {
    const s = [sabitie(1, TIP.stopaninZapisan), sabitie(2, TIP.redZapisan)];
    const chuzhdo = [
      {
        veriga: 'druga',
        seq: 2,
        type: '',
        sashtnost: { vid: 'red', id: 'x2' },
        prichina: '',
        storniranOt: '',
      },
    ];
    expect(sledvashtotoZaOtmyana(s, chuzhdo, KNIGA)?.seq).toBe(2);
  });

  it('думите казват ДЕЙСТВИЕТО · а непознат тип се казва с името си, не се крие', () => {
    expect(dumiZaTipa(TIP.redIzklyuchen)).toBe('изключване или връщане на ред');
    expect(dumiZaTipa('НещоНово')).toBe('НещоНово');
    const [red] = [sabitie(7, TIP.redZapisan, 'imot:k1')];
    expect(sledvashtotoZaOtmyana([red!], [], KNIGA)?.dumi).toBe('запис на ред · red imot:k1');
  });

  it('празен Журнал · няма какво', () => {
    expect(sledvashtotoZaOtmyana([], [], KNIGA)).toBeNull();
  });
});

describe('отмяната · през изпълнителя · Ctrl+Z три пъти', () => {
  it('всяко натискане връща една стъпка · и спира на откриването с думи', async () => {
    const { iz } = await otvori();
    const uspeh = <T>(r: T | { otkaz: true }) => {
      if (eOtkaz(r)) throw new Error('неочакван отказ');
      return r;
    };
    uspeh(await iz.izpalni('k0', 'stopanin.otkriy', { imeyl: STOPANIN }));
    uspeh(
      await iz.izpalni('k1', 'imoti.sazdayImot', {
        kletki: { ime: { tekst: 'Първи' }, sastoyanie: { nomer: 1 }, ...PRAZEN_IMOT },
      }),
    );
    uspeh(
      await iz.izpalni('k2', 'imoti.sazdayImot', {
        kletki: { ime: { tekst: 'Втори' }, sastoyanie: { nomer: 1 }, ...PRAZEN_IMOT },
      }),
    );
    expect(iz.ogledalo().tablitsi.get('imoti')?.broy).toBe(2);

    // ПЪРВО Ctrl+Z · маха „Втори"
    const parvo = iz.zaOtmyana();
    expect(parvo?.dumi).toContain('запис на ред');
    uspeh(
      await iz.izpalni('z1', 'obshto.storno', {
        veriga: parvo!.veriga,
        seq: parvo!.seq,
        prichina: 'Ctrl+Z',
      }),
    );
    expect(iz.ogledalo().tablitsi.get('imoti')?.broy).toBe(1);

    // ВТОРО · прескача СВОЕТО сторно и маха „Първи"
    const vtoro = iz.zaOtmyana();
    expect(vtoro?.seq).toBeLessThan(parvo!.seq);
    uspeh(
      await iz.izpalni('z2', 'obshto.storno', {
        veriga: vtoro!.veriga,
        seq: vtoro!.seq,
        prichina: 'Ctrl+Z',
      }),
    );
    expect(iz.ogledalo().tablitsi.get('imoti')?.broy).toBe(0);

    // ТРЕТО · стига до откриването · КАЗВА, че няма какво (правило 12)
    expect(iz.zaOtmyana()).toBeNull();
    // и Журналът е само за добавяне · нищо не е изтрито, две сторна са ДОБАВЕНИ
    expect(iz.ogledalo().storna).toBe(2);
    expect(iz.ogledalo().pogaseni).toHaveLength(2);
  });
});
