/**
 * ПРОФИЛ · откриването на Книгата, Стопанинът, хранилището и четенето на Книга.
 *
 * Празен Журнал → екранът иска имейл и пише `stopanin.otkriy` (Вратата
 * отказва всичко преди това). Тук остават и трите неща от резен 0: думите за
 * хранилището, „Провери веригата" и четенето на една Книга без запис.
 */

import { DUMI_OT_KNIGATA } from '../../src/model/dumi-ot-knigata.js';
import { prozoretsPoList, SLUZHEBEN_LIST } from '../../src/model/osnova.js';
import { pomosht } from '../../src/model/pomosht.js';
import { napalniSMostra, type RedNaMostrata } from '../../src/mostra/napalni.js';
import { dostapaMi } from '../../src/smetach/pravo.js';
import { dumiZaGreshka, kolkoMyasto } from '../../src/yadro/dumi.js';
import type { KonteksNaEkrana } from '../kontekst.js';
import { kopieNaZhurnala, prochetiKopie } from '../../src/yadro/kopie.js';
import { svaliFayl } from '../reshetka/obshto.js';
import { obyasnenie, podskazka, podskazkaSDumi } from '../reshetka/podskazka.js';
import { h, sloji, type Zapechatan } from '../reshetka/shablon.js';

/**
 * РАЗПИСКАТА НА МОСТРАТА · живее ИЗВЪН тялото, защото всеки запис прерисува.
 *
 * Всяко действие през Портата вика абоната, а той рисува прозореца наново:
 * елементът, който държиш в ръка, се сменя с нов и текстът, писан в стария,
 * отива в откъснат възел. Същият урок като при износа (`deystviya.ts`).
 */
let mostraVest = '';
/** какво каза последното сваляне на Журнала · живее между рисуванията */
const kopieVest = '';
let mostraRedove: readonly RedNaMostrata[] = [];

/** Помощта на бутона · защо съществува и какво прави, с наши думи (правило 31). */
const POMOSHT_NA_MOSTRATA = pomosht(
  'Програмата тръгва празна и празен екран не показва нищо · мострата слага измислени редове във всяка таблица, за да се види как изглежда пълна.',
  'пише през Вратата · пълни само празните таблици · всеки ред влиза в Журнала',
);

export function dumiteHTML(dumi: readonly { nomer: string; tekst: string }[]): Zapechatan {
  if (dumi.length === 0) return h``;
  return h`<ol class="dumite" translate="no">${dumi.map(
    (d) => h`<li><span class="nomer">${d.nomer}</span> ${d.tekst}</li>`,
  )}</ol>`;
}

/**
 * ЛИЧНИ ДАННИ (Кой съм) · неговото B2 · и достъпът, който Длъжността дава.
 *
 * Данните НЕ се дублират: идват от реда му в „Стопани" или „Служители" (лист
 * Служители), намерен по имейла, с който пише. Личният изглед само СТЕСНЯВА
 * (правило 23) — затова тук се чете, не се редактира.
 */
function lichniteMiDanni(k: KonteksNaEkrana): Zapechatan {
  const o = k.porta.ogledalo();
  const d = dostapaMi(o, k.aktor());
  const redovete = d.osi.map(
    (x) =>
      h`<tr class="red" data-os="${x.os}"><td>${x.os}</td><td>${x.pravo}</td><td translate="no">${x.dumi === '' ? '—' : x.dumi}</td></tr>`,
  );
  return h`<section class="sektsiya" data-sektsiya="lichni">
      <h2>Лични Данни (Кой съм) и Достъп</h2>
      <p data-imeylat-mi translate="no">${k.aktor()}</p>
      <p data-dlazhnostta-mi>${
        d.dlazhnost === ''
          ? 'Нямаш ред в „Служители" · добави се там, за да ти важи Длъжност (лист Служители).'
          : `Длъжност: ${d.dlazhnost}`
      }</p>
      <table class="tablitsa" data-dostapa-mi>
        <thead><tr><th>ос</th><th>право</th><th>какво пише в Книгата</th></tr></thead>
        <tbody>${redovete}</tbody>
      </table>
      ${obyasnenie('Личният изглед само СТЕСНЯВА (правило 23): каквото Длъжността не дава, не се отваря от тук.')}
    </section>`;
}

export function narisuvayProfil(k: KonteksNaEkrana): void {
  const o = k.porta.ogledalo();
  const otkrita = o.stopanin !== '';
  sloji(
    k.tyalo,
    h`
    <!--
      ОТКРИВАНЕТО СИ ОТИДЕ ОТТУК · то е на ВРАТАТА · app/reshetka/vlizane.ts

      Негово, 11.09 (запис 190): „Просто влизаш… Влизане с имейл." Оттам нататък
      Книгата се открива с имейла, с който човек влиза, и този екран вече няма
      как да се покаже на празна Книга — до него се стига само отвътре. Форма,
      която не може да се появи, е по-лоша от липсваща: тя обещава втори път
      нещо, което вече е станало (правило 12 · правило 13).
    -->
    <section class="sektsiya" data-sektsiya="stopanin"><h2>Стопанин</h2><p data-stopanin translate="no">${o.stopanin}</p></section>
    ${otkrita ? lichniteMiDanni(k) : ''}
    ${dumiteHTML(DUMI_OT_KNIGATA.profil)}
    <section class="sektsiya" data-sektsiya="hranilishte">
      <h2>Хранилището</h2>
      <p data-hranilishte>${k.hranilishte()}</p>
      <p class="${k.kotvata().nared ? 'vest' : 'greshka'}" data-kotva>${k.kotvata().dumi}</p>
      <p class="${k.samolichnostta().nared ? 'vest' : 'greshka'}" data-samolichnost translate="no">${k.samolichnostta().dumi}</p>
      <button type="button" class="vtorichen" data-proveri>Провери веригата</button>
      <p data-veriga></p>
    </section>
    <!--
      РЕЗЕРВНОТО КОПИЕ · негово, 14.09 (запис 229): „Журнала съхранява ли данните
      вече. Мога ли да попълвам моите вече?"

      Стои ВЕДНАГА след „Провери веригата", защото двете са едно и също умение:
      първото казва цяла ли е историята, второто я изнася и я връща. И двете
      четат Дневника пряко — възстановяването не е действие върху Огледалото, а
      пренасяне на самия Журнал (вж. app/main.ts).
    -->
    <section class="sektsiya" data-sektsiya="kopie">
      <h2>Резервно копие на Журнала</h2>
      <p>Сваля <strong>целия Журнал</strong> като NDJSON — ред на събитие, с подписите и хешовете. Това НЕ е Книгата: Книгата е снимка на днешните редове, а тук е цялата история, от която тя се пресмята наново.</p>
      <p>Дръж копието на Драйва си. Данните живеят в този браузър и <em>изтриваеми</em> хранилища браузърът има право да изхвърли при недостиг на място — горе пише кое от двете е при теб.</p>
      <button type="button" data-svali-zhurnal${podskazkaSDumi(
        'Сваля всяко събитие от Журнала, ред по ред (NDJSON). Файлът носи подписите и хеш-веригата, тъй че при връщане се проверява, че никой не го е пипал. Нищо не тръгва навън — файлът се пише при теб.',
      )}>Свали Журнала</button>
      <p data-kopie-vest>${kopieVest}</p>
      <p class="pod-tablitsata">Връщане: качи свалено копие. Вратата проверява ЦЯЛАТА верига, преди да запише каквото и да е — разминае ли се на едно звено, НЕ ВЛИЗА НИЩО.</p>
      <input type="file" accept=".ndjson,.jsonl,.json,.txt" data-vazstanovi>
      <p data-vazstanovi-vest></p>
    </section>
    <section class="sektsiya" data-sektsiya="mostra">
      <h2>Мострата</h2>
      <p>Напълва празните таблици с ИЗМИСЛЕНИ данни — имоти, обекти, задачи с бюджети, движения по Сметки, кеш, ДДС, служители и продажби — за да се види цялата програма, преди да е въведен истински ред. Пише се през Вратата, като всяко друго действие: всеки ред влиза в Журнала и се сторнира оттам. Таблица, която вече има редове, не се пипа.</p>
      <button type="button" data-mostra${podskazka(POMOSHT_NA_MOSTRATA)}>Напълни с мостра</button>
      <p data-mostra-vest>${mostraVest}</p>
      ${
        mostraRedove.length === 0
          ? ''
          : h`<table class="tablitsa" data-mostra-razpiska>
        <thead><tr><th>какво</th><th>редове</th><th>бележка</th></tr></thead>
        <tbody>${mostraRedove.map(
          (r) =>
            h`<tr class="red"><td>${r.kakvo}</td><td translate="no">${String(r.broy)}</td><td>${r.otkaz}</td></tr>`,
        )}</tbody>
      </table>`
      }
    </section>
    <section class="sektsiya" data-sektsiya="kniga">
      <h2>Погледни Книгата</h2>
      <p>Показва какво има в една Книга (.xlsx) — листове, редове, колони. Нищо не се сверява и нищо не се записва; вносът е в <a href="#/ii">ИИ · Сверчикът</a>.</p>
      <input type="file" accept=".xlsx" data-kniga>
      <p data-kniga-vest></p>
      <table class="tablitsa" data-listove hidden>
        <thead><tr><th>лист</th><th>прозорец</th><th>редове</th><th>колони</th><th>слети</th></tr></thead>
        <tbody></tbody>
      </table>
    </section>`,
  );

  k.tyalo
    .querySelector<HTMLButtonElement>('[data-mostra]')
    ?.addEventListener('click', async (e) => {
      (e.currentTarget as HTMLButtonElement).disabled = true;
      const imeyl = k.aktor().trim() === '' ? 'stopanin@example.bg' : k.aktor();
      k.zadayAktor(imeyl);
      try {
        mostraRedove = await napalniSMostra(k.porta, imeyl, new Date().toISOString().slice(0, 10));
        const sbor = mostraRedove.reduce((a, r) => a + r.broy, 0);
        mostraVest =
          sbor === 0
            ? 'Нищо ново · таблиците вече имат редове.'
            : `Готово · ${sbor} записа. Виж Имоти, Управление, Сметки, Служители и Продажби.`;
      } catch (greshka) {
        mostraVest = dumiZaGreshka(greshka);
      }
      k.prerisuvay();
    });

  /**
   * СВАЛЯНЕ НА ЖУРНАЛА · целият, ред по ред.
   *
   * Името носи ДАТА и БРОЙ: копие без дата е копие, за което не се знае от кога
   * е, а човек с три файла в папката трябва да различи кой е последният, без да
   * ги отваря.
   */
  k.tyalo
    .querySelector<HTMLButtonElement>('[data-svali-zhurnal]')
    ?.addEventListener('click', () => {
      void (async () => {
        const p = k.tyalo.querySelector('[data-kopie-vest]');
        try {
          const sabitiya = await k.iznesiZhurnala();
          const tekst = kopieNaZhurnala(sabitiya);
          const den = new Date().toISOString().slice(0, 10);
          // ТОЙ ИЗБИРА МЯСТОТО · негово, 14.09 (запис 230) т.1
          const kade = await svaliFayl(
            new Blob([tekst], { type: 'application/x-ndjson' }),
            `Coretovia-zhurnal-${den}-${String(sabitiya.length)}.ndjson`,
            'Резервно копие на Журнала',
          );
          // ОТКАЗЪТ НЕ СЕ ЗАЛЕПЯ ЗА УСПЕХА · първият опит казваше „Свалени 50 събития
          // · 57,8 КБ · Не е свалено · ти отказа." и това е ЛЪЖА в първата си половина.
          // Хванато от собствената проверка на прохода, преди да стигне до него.
          if (p)
            p.textContent = kade.startsWith('Не е свалено')
              ? kade
              : `Свалени ${String(sabitiya.length)} събития · ${kolkoMyasto(new Blob([tekst]).size)}${kade === '' ? '' : ` · ${kade}`}`;
        } catch (e) {
          if (p)
            p.textContent = `Свалянето не стана: ${e instanceof Error ? e.message : String(e)}`;
        }
      })();
    });

  /**
   * ВРЪЩАНЕ ОТ КОПИЕ · и ВСЯКА стъпка казва какво е станало.
   *
   * Тихият отказ тук е най-скъпият отказ в програмата: човек мисли, че си е
   * върнал годината, а не си е върнал нищо (правило 12). Затова се съобщава и
   * когато файлът е нечетим, и когато веригата се къса, и когато всичко е минало.
   */
  k.tyalo.querySelector<HTMLInputElement>('[data-vazstanovi]')?.addEventListener('change', (e) => {
    const vhod = e.target as HTMLInputElement;
    const fayl = vhod.files?.[0];
    const p = k.tyalo.querySelector('[data-vazstanovi-vest]');
    if (fayl === undefined) return;
    void (async () => {
      if (p) p.textContent = 'Чета файла…';
      try {
        const prochetenoto = prochetiKopie(await fayl.text());
        if (prochetenoto.greshka !== '') {
          if (p)
            p.textContent = `Файлът не е прието копие: ${prochetenoto.greshka} Нищо не е внесено.`;
          return;
        }
        const dumi = await k.vazstanoviZhurnala(prochetenoto.sabitiya);
        if (p) p.textContent = dumi;
        k.prerisuvay();
      } catch (greshka) {
        if (p)
          p.textContent = `Връщането е ОТКАЗАНО: ${greshka instanceof Error ? greshka.message : String(greshka)}`;
      }
    })();
  });
  k.tyalo
    .querySelector<HTMLButtonElement>('[data-proveri]')
    ?.addEventListener('click', async () => {
      const p = k.tyalo.querySelector('[data-veriga]');
      if (p) p.textContent = await k.proveriVerigata();
    });

  k.tyalo.querySelector<HTMLInputElement>('[data-kniga]')?.addEventListener('change', async (e) => {
    const fayl = (e.target as HTMLInputElement).files?.[0];
    const vest = k.tyalo.querySelector('[data-kniga-vest]');
    const tablitsa = k.tyalo.querySelector<HTMLTableElement>('[data-listove]');
    if (!fayl || !vest || !tablitsa) return;
    vest.textContent = 'чета…';
    try {
      // Библиотеката за Книгата се тегли ПРИ НАТИСКАНЕ, не при тръгване: тя е
      // най-тежкото парче в пакета, а страницата трябва да се отвори веднага.
      const { prochetiKniga } = await import('../../src/kniga/ooxml.js');
      const kniga = await prochetiKniga(await fayl.arrayBuffer());
      const poznati = kniga.listove.filter((l) => prozoretsPoList(l.ime) !== undefined).length;
      const sluzhebni = kniga.listove.filter((l) => l.ime === SLUZHEBEN_LIST).length;
      const tbody = tablitsa.querySelector('tbody');
      if (tbody) {
        sloji(
          tbody,
          h`${kniga.listove.map((l) => {
            const p = prozoretsPoList(l.ime);
            return h`<tr data-list="${l.ime}"><td translate="no">${l.ime}</td><td>${
              p ? p.klyuch : l.ime === SLUZHEBEN_LIST ? 'служебен' : '— непознат'
            }</td><td>${l.broyRedove}</td><td>${l.broyKoloni}</td><td>${l.slivaniya.length}</td></tr>`;
          })}`,
        );
      }
      tablitsa.hidden = false;
      const nepoznati = kniga.listove.length - poznati - sluzhebni;
      vest.textContent =
        `${kniga.listove.length} листа · ${poznati} познати · ${sluzhebni} служебни · ${nepoznati} непознати · ` +
        `сверка: ${kniga.listove.length} = ${poznati} + ${sluzhebni} + ${nepoznati} · разлика ${
          kniga.listove.length - poznati - sluzhebni - nepoznati
        }`;
    } catch (g) {
      vest.textContent = `Книгата не се чете: ${dumiZaGreshka(g)}`;
    }
  });
}
