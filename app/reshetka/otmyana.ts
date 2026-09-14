/**
 * ОТМЯНАТА НА ЕКРАНА · „Отмени последното" от всяко дясно меню · и Ctrl+Z.
 *
 * Негово, 14.09 (запис 232) т.4: „Върни реда не работи, защото когато го скриеш
 * вече няма къде да натиснеш десен бутон. За това нека да има винаги от всеки
 * десен бутон на различни места, ако има действия, да можеш да ги връщаш
 * максимален брой пъти оттам, и да се включва с Ctrl+Z."
 *
 * СВОЙ МОДУЛ, НЕ ЧАСТ ОТ `deystviya.ts` · и двете менюта (върху ред · върху
 * празно) трябва да го внасят, а `sazdavaneto.ts` не може да внася `deystviya`
 * без кръг от три модула (виж бележката там). Модул, който внася само портата и
 * менюто, няма с кого да се завърти.
 *
 * НИЩО НЕ СЕ ТРИЕ · „назад" е сторно: ново събитие срещу старото, с причина
 * (правило 1). Кое е следващото решава портата (`zaOtmyana`), за да казват едно
 * и също и менюто, и клавишът.
 */

import { tablitsaNaId, tablitsata } from '../../src/model/model.js';
import type { Ogledalo } from '../../src/ogledalo/ogledalo.js';
import { imeNaReda } from '../../src/smetach/kletki.js';
import { nomerNaRed, tekstNaNomera } from '../../src/smetach/nomeratsiya.js';
import type { KonteksNaEkrana } from '../kontekst.js';
import type { Tochka } from './menyu.js';
import { pokazhiGreshka } from './redaktsiya.js';

/** причината, с която Ctrl+Z пише сторното · човекът е решил, машината записва */
const PRICHINA = 'отмяна от човека · Ctrl+Z';

/** Най-много изключени редове в менюто · над това се казва „и още N". */
const NAY_MNOGO_ZA_VRASHTANE = 6;

/**
 * Отменя последното · и КАЗВА какво е отменил или защо не.
 *
 * Връща думите, за да ги покаже който вика (менюто ги оставя на екрана,
 * клавишът — също). Тихо Ctrl+Z, което не казва нищо, е половин функция.
 */
async function otmeniPoslednoto(k: KonteksNaEkrana): Promise<string> {
  const sledvashto = k.porta.zaOtmyana();
  if (sledvashto === null) return 'Няма какво да се отмени · стигна се до откриването на Книгата.';
  // думите се взимат ПРЕДИ записа · след сторно на „запис на ред" редът вече го няма
  // в Огледалото и името му не би могло да се намери
  const kakvo = dumiteZaChoveka(k, sledvashto.dumi, sledvashto.sashtnost.id);
  const r = await k.porta.izpalni(crypto.randomUUID(), 'obshto.storno', {
    veriga: sledvashto.veriga,
    seq: sledvashto.seq,
    prichina: PRICHINA,
  });
  if ('otkaz' in r) {
    pokazhiGreshka(k.tyalo, r.zashto.join(' '));
    return `Не се отмени: ${r.zashto.join(' ')}`;
  }
  // сторното е ново събитие · Огледалото се пресгъва и екранът показва света без отмененото
  await k.porta.prezaredi();
  return `Отменено: ${kakvo}`;
}

/**
 * ПУНКТОВЕТЕ ЗА ОТМЯНА · за всяко дясно меню, върху ред или върху празно.
 *
 * 1. „Отмени · <какво>" · казва КАКВО ще се отмени ПРЕДИ натискането, инак
 *    човек натиска на сляпо и после гадае какво е върнал.
 * 2. „Върни ред · <име>" · за всеки изключен ред, от всички таблици с
 *    родител на екрана. Точно това липсваше: изключеният ред няма къде да се
 *    натисне, тъй че връщането му стои върху ВСЯКО друго място.
 */
/**
 * ДУМИТЕ ЗА ЧОВЕКА · името на реда, не id-то му.
 *
 * Портата дава `sashtnost.id` — „obekt:60e7c2a0-…" — вярно и нечетимо. Ако
 * същността е ред в таблица на екрана, човек трябва да види „Слънчева поляна",
 * не ключа под нея. Когато няма таблица (стойност в номенклатура, модел на
 * екрана), остават думите на портата.
 */
function dumiteZaChoveka(k: KonteksNaEkrana, dumi: string, id: string): string {
  const o = k.porta.ogledalo();
  const kakvo = dumi.split(' · ')[0] ?? dumi;
  const t = tablitsaNaId(o.model, id);
  if (t === undefined || !o.tablitsi.get(t.klyuch)?.indeks.has(id)) return kakvo;
  return `${kakvo} · ${imetoIliNomerat(o, t.klyuch, id)}`;
}

/**
 * Името · или АДРЕСЪТ, когато ред няма име. Обект и Бизнес нямат текстова
 * колона (`osnova.ts`): номерът им е името — „1.1.1.27", не „obekt:0d58…".
 * Същото прави `imeNaVrazkata` за връзките; тук е за реда сам по себе си.
 */
function imetoIliNomerat(o: Ogledalo, klyuch: string, id: string): string {
  const ime = imeNaReda(o, klyuch, id);
  if (ime !== id) return ime;
  const t = tablitsata(o.model, klyuch);
  const i = o.tablitsi.get(klyuch)?.indeks.get(id);
  if (t.nomeratsiya === undefined || i === undefined) return `${t.ime} · без име`;
  return tekstNaNomera(nomerNaRed(o, klyuch, i));
}

export function tochkiteZaOtmyana(k: KonteksNaEkrana): readonly Tochka[] {
  const tochki: Tochka[] = [];
  const sledvashto = k.porta.zaOtmyana();
  tochki.push({
    klyuch: 'otmeni-poslednoto',
    ime:
      sledvashto === null
        ? 'Отмени последното (Ctrl+Z)'
        : `Отмени · ${dumiteZaChoveka(k, sledvashto.dumi, sledvashto.sashtnost.id)} (Ctrl+Z)`,
    razreshena: sledvashto !== null,
    zashto: sledvashto === null ? 'няма какво да се отмени · стигна се до откриването' : '',
    deystvie: () => {
      void otmeniPoslednoto(k);
    },
  });

  const o = k.porta.ogledalo();
  const izklyucheni: { tablitsa: string; id: string; ime: string }[] = [];
  for (const [klyuch, t] of o.tablitsi) {
    for (let i = 0; i < t.broy; i += 1) {
      if (t.izklyuchen[i] !== 1) continue;
      const id = t.id[i] ?? '';
      izklyucheni.push({ tablitsa: klyuch, id, ime: imetoIliNomerat(o, klyuch, id) });
    }
  }
  for (const r of izklyucheni.slice(0, NAY_MNOGO_ZA_VRASHTANE)) {
    tochki.push({
      klyuch: `varni-red-${r.tablitsa}-${r.id}`,
      ime: `Върни ред · ${r.ime}`,
      razreshena: true,
      zashto: '',
      deystvie: () => {
        void (async () => {
          const rez = await k.porta.izpalni(crypto.randomUUID(), 'red.varni', {
            tablitsa: r.tablitsa,
            id: r.id,
          });
          if ('otkaz' in rez) pokazhiGreshka(k.tyalo, rez.zashto.join(' '));
        })();
      },
    });
  }
  if (izklyucheni.length > NAY_MNOGO_ZA_VRASHTANE) {
    tochki.push({
      klyuch: 'varni-oshte',
      ime: `и още ${String(izklyucheni.length - NAY_MNOGO_ZA_VRASHTANE)} изключени реда`,
      razreshena: false,
      zashto: 'върни първите и списъкът ще продължи',
      deystvie: () => {},
    });
  }
  return tochki;
}

/**
 * Ctrl+Z ВЪРХУ ЦЕЛИЯ ЕКРАН · веднъж, върху документа.
 *
 * НЕ в поле за писане: там Ctrl+Z е отмяна на написаното и браузърът я прави
 * сам. Отнеме ли му я програмата, човек губи буква и получава сторно на ред —
 * най-лошата размяна.
 */
export function zakachiCtrlZ(k: KonteksNaEkrana, kazhi: (dumi: string) => void): void {
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z' || e.shiftKey || e.altKey) return;
    const cel = e.target;
    if (
      cel instanceof HTMLInputElement ||
      cel instanceof HTMLTextAreaElement ||
      cel instanceof HTMLSelectElement ||
      (cel instanceof HTMLElement && cel.isContentEditable)
    )
      return;
    e.preventDefault();
    void otmeniPoslednoto(k).then(kazhi);
  });
}
