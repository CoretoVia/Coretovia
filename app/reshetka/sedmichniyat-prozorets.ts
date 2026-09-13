/**
 * СЕДМИЧНАТА ПРОГРАМА НА ЕДИН ЧОВЕК · в изскачащ прозорец.
 *
 * Негово, 11.09 (запис 195), точка 7: „**Да се отваря за всеки работник
 * седмичната програма, не днешната а седмичната. Ако не е изпълнена се
 * пренастройва за следващия ден и се трупа…**"
 *
 * Смятането е в `src/smetach/sedmitsata.ts`; тук е само екранът — седем дни,
 * днешният отбелязан, и натрупаното от миналото КАЗАНО с думи, не скрито.
 */

import type { KonteksNaEkrana } from '../kontekst.js';
import { sedmichnataPrograma, zadachiBezOtgovornik } from '../../src/smetach/sedmitsata.js';
import { otgovoratNaPortata } from '../prozorets/deystviya.js';
import { imeNaReda } from '../../src/smetach/kletki.js';
import { otvoriIzskachasht } from './izskachasht.js';
import { pokazhiMenyu } from './menyu.js';
import { podskazkaSDumi } from './podskazka.js';
import { h, sloji } from './shablon.js';

/**
 * @param dnes - денят, чиято СЕДМИЦА се показва · мени се със стрелките
 * @param dnesNaMashinata - истинският днешен ден · по него се съди кое е „днес"
 */
function otvoriSedmitsata(
  k: KonteksNaEkrana,
  chovek: string,
  dnes: string,
  dnesNaMashinata: string,
): void {
  document.querySelector('dialog[data-sedmitsa]')?.remove();
  const p = sedmichnataPrograma(k.porta.ogledalo(), chovek, dnes);
  const prozorets = document.createElement('dialog');
  prozorets.className = 'izskachasht sedmitsata';
  prozorets.dataset['sedmitsa'] = chovek;
  sloji(
    prozorets,
    h`<div class="izskachasht-forma">
      <h2 class="lenta" translate="no">Седмицата на ${p.ime}</h2>
      <div class="sedmitsa-kormilo">
        <button type="button" class="malak" data-sedmitsa-nazad>◂ предишната</button>
        <span class="sedmitsa-koga" data-sedmitsa-koga translate="no">${
          dnes === dnesNaMashinata
            ? 'тази седмица'
            : `${p.dni[0]?.den ?? ''} — ${p.dni[6]?.den ?? ''}`
        }</span>
        <button type="button" class="malak" data-sedmitsa-napred>следващата ▸</button>
        <button type="button" class="malak vtorichen" data-sedmitsa-dnes ${
          dnes === dnesNaMashinata ? 'disabled' : ''
        }>днес</button>
      </div>
      <p class="pod-tablitsata" data-sedmitsa-sverka>натрупани от минали дни ${String(
        p.natrupani,
      )}${p.bezData.length === 0 ? '' : ` · без нито една дата ${String(p.bezData.length)}`}${
        // НАТРУПАНИТЕ са за ДНЕШНАТА седмица · инак минало би минало за просрочено
        dnes === dnesNaMashinata ? '' : ' · натрупаното се брои спрямо днес, не спрямо тази седмица'
      }</p>
      <table class="reshetka sedmitsata-tablitsa">
        <tbody>${p.dni.map(
          (d) =>
            h`<tr class="red${d.dnes ? ' dnes' : ''}" data-den="${d.den}">
              <td class="kletka tekst den" translate="no">${d.ime} · ${d.den.slice(8)}.${d.den.slice(5, 7)}</td>
              <td class="kletka tekst">${
                d.zadachi.length === 0
                  ? h`<span class="prazna-duma">няма</span>`
                  : h`${d.zadachi.map(
                      (z) =>
                        h`<span class="zadacha-v-denya${z.natrupana ? ' natrupana' : ''}"${
                          z.natrupana
                            ? podskazkaSDumi(
                                `Краят ѝ (${z.do === '' ? z.ot : z.do}) е минал, а тя не е потвърдена за свършена — затова стои на днешния ден и ще стои, докато не я потвърдиш с десния бутон върху реда ѝ в Управление.`,
                              )
                            : ''
                        } translate="no">${z.ime === '' ? z.id : z.ime}</span>`,
                    )}`
              }</td>
            </tr>`,
        )}</tbody>
      </table>
      ${
        p.bezData.length === 0
          ? h``
          : h`<p class="pod-tablitsata">без нито една дата: <span translate="no">${p.bezData.join(' · ')}</span> — нямат кога да са и не влизат в нито един ден.</p>`
      }
      <div class="deystviya butoni-malki">
        <button type="button" class="malak vtorichen" data-sedmitsa-zatvori>Затвори</button>
      </div>
    </div>`,
  );
  prozorets
    .querySelector<HTMLButtonElement>('[data-sedmitsa-zatvori]')
    ?.addEventListener('click', () => {
      prozorets.close();
      prozorets.remove();
    });
  /**
   * НАЗАД И НАПРЕД · негово, 11.09 (запис 195) т.7: „знаеш кой ден какво прави и
   * **какво е ПРАВИЛ**." Миналото време иска минала седмица; дотук прозорецът
   * беше закован на днешната и вторият половин от изречението му не работеше.
   *
   * Прозорецът се отваря НАНОВО с друг ден — не се пренарежда на място. Така
   * няма второ състояние, което да се разминава с първото, и „днес" се връща с
   * един бутон.
   */
  const drugaSedmitsa = (dni: number): void => {
    const d = new Date(`${dnes}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + dni);
    prozorets.close();
    prozorets.remove();
    otvoriSedmitsata(k, chovek, d.toISOString().slice(0, 10), dnesNaMashinata);
  };
  prozorets
    .querySelector<HTMLButtonElement>('[data-sedmitsa-nazad]')
    ?.addEventListener('click', () => drugaSedmitsa(-7));
  prozorets
    .querySelector<HTMLButtonElement>('[data-sedmitsa-napred]')
    ?.addEventListener('click', () => drugaSedmitsa(7));
  prozorets
    .querySelector<HTMLButtonElement>('[data-sedmitsa-dnes]')
    ?.addEventListener('click', () => {
      prozorets.close();
      prozorets.remove();
      otvoriSedmitsata(k, chovek, dnesNaMashinata, dnesNaMashinata);
    });
  prozorets.addEventListener('close', () => prozorets.remove());
  document.body.append(prozorets);
  prozorets.showModal();
}

/**
 * ДЕСНИЯТ БУТОН ВЪРХУ СЛУЖИТЕЛ · неговата конвенция от 31.08: „на всеки обект,
 * който се движи из различни таблици, да има опция **с десен бутон да го
 * управляваш**".
 *
 * Негово, 11.09 (запис 195), точка 7: „**С десен бутон на служителя можеш да му
 * редактираш данните и да му дадеш задачи от списъка който е в Управление и не
 * е сложен отговорник.**"
 *
 * Раздаването е ПОПРАВКА на клетката „Отговорник" на задачата — същата команда,
 * с която се пише и от Управление. Втори път за едно и също нещо би значел две
 * места, които утре ще се разминат.
 */
export function zakachiDesniyaButonNaHorata(k: KonteksNaEkrana, dnes: string): void {
  k.tyalo.addEventListener('contextmenu', (e) => {
    const red = (e.target as HTMLElement | null)?.closest<HTMLElement>('tr.red[data-id]');
    if (red === null || red === undefined) return;
    const tablitsa = red.dataset['tablitsa'] ?? '';
    if (tablitsa !== 'sluzhiteli' && tablitsa !== 'stopani') return;
    e.preventDefault();
    const chovek = red.dataset['id'] ?? '';
    const bez = zadachiBezOtgovornik(k.porta.ogledalo());
    pokazhiMenyu(e.clientX, e.clientY, [
      {
        klyuch: 'sedmitsata',
        ime: 'Седмичната програма',
        razreshena: true,
        zashto: '',
        deystvie: () => otvoriSedmitsata(k, chovek, dnes, dnes),
      },
      {
        klyuch: 'day-zadacha',
        ime: `Дай задача · ${String(bez.length)} без отговорник`,
        razreshena: bez.length > 0,
        zashto: 'всяка задача в Управление вече има отговорник',
        deystvie: () => pokazhiZadachite(k, chovek, bez, e.clientX, e.clientY),
      },
      {
        klyuch: 'redaktsiya',
        ime: 'Редактирай данните',
        razreshena: true,
        zashto: '',
        // ЕДНО МЯСТО за всички полета · негово, 11.09 (запис 195) т.7: „С десен
        // бутон на служителя можеш да му РЕДАКТИРАШ ДАННИТЕ". Клетката по клетка
        // работи и остава, но той иска и прозорец, в който се вижда всичко.
        deystvie: () =>
          otvoriIzskachasht(k, {
            tablitsa,
            komanda: 'red.popraviKletka',
            zaglavie: `Поправи ${imeNaReda(k.porta.ogledalo(), tablitsa, chovek)}`,
            popravyaId: chovek,
          }),
      },
    ]);
  });
}

/** Вторият слой на менюто · коя точно задача да поеме човекът. */
function pokazhiZadachite(
  k: KonteksNaEkrana,
  chovek: string,
  spisak: readonly { readonly id: string; readonly ime: string }[],
  x: number,
  y: number,
): void {
  pokazhiMenyu(
    x,
    y,
    spisak.map((z) => ({
      klyuch: z.id,
      ime: z.ime,
      razreshena: true,
      zashto: '',
      deystvie: () => {
        void k.porta
          .izpalni(crypto.randomUUID(), 'red.popraviKletka', {
            tablitsa: 'zadachi',
            id: z.id,
            kletki: { otgovornik: { tekst: chovek } },
          })
          .then((r) => otgovoratNaPortata(k, r));
      },
    })),
  );
}
