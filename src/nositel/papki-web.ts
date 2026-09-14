/**
 * ПАПКИТЕ С ДОКУМЕНТИ · носителят „браузър" · File System Access.
 *
 * Негово, 14.09.2026 в 17:09 (запис 230) т.2, ДОСЛОВНО: „**Всеки обект си има
 * папка с документи, която е хубаво да се прикачи за по лесна работа с
 * документите клогато няма ИИ.**"
 *
 * ═══ КАКВО СЕ ПАЗИ И КАКВО НЕ ═══
 *
 * Пази се ДРЪЖКАТА (`FileSystemDirectoryHandle`) — не пътят, не файловете, не
 * съдържанието. Дръжката е нещото, което браузърът умее да запомни и после да
 * поиска потвърждение за него; път като низ не значи нищо за него.
 *
 * Дръжките се пишат в СВОЯ база, не в тази на Журнала. Три причини, и третата е
 * най-важната: (1) те не са събития и нямат seq; (2) версията им се мени по своя
 * график; (3) човек, който изтрие Журнала, за да върне копие, не бива да загуби
 * и връзките си с папките — те са на неговия диск и продължават да важат.
 *
 * ═══ ПОЗВОЛЕНИЕТО Е ОТДЕЛНО ОТ ВРЪЗКАТА ═══
 *
 * Браузърът помни коя папка е избрана, но при НОВО ПУСКАНЕ иска потвърждение
 * наново — и то само след жест на човека (натискане). Затова „прикачена" и
 * „четима сега" са две различни състояния и екранът ги казва поотделно
 * (правило 12): прикачена без позволение не е грешка, а чакане.
 *
 * ═══ НИЩО НЕ СЕ ЧЕТЕ ═══
 *
 * Взимат се само име, размер и дата — тоест онова, което се вижда и без да се
 * отвори файлът. Правило 21: поверителните данни живеят при клиента. Договорът
 * се ОТВАРЯ с неговата програма; програмата не го чете и не го копира никъде.
 */

import type { FaylVPapkata, PapkaNaReda, PortaKamPapkite } from '../yadro/papka.js';

const BAZA = 'coretovia-papki';
const HRANILISHTE = 'papki';
const VERSIYA = 1;

/** Толкова от API-то, колкото ползваме · типовете на браузъра още не са навсякъде. */
interface DrazhkaNaFayl {
  readonly kind: 'file';
  readonly name: string;
  getFile(): Promise<{ size: number; lastModified: number }>;
}
interface DrazhkaNaPapka {
  readonly kind: 'directory';
  readonly name: string;
  values(): AsyncIterableIterator<DrazhkaNaFayl | DrazhkaNaPapka>;
  queryPermission(opis: { mode: 'read' }): Promise<PermissionState>;
  requestPermission(opis: { mode: 'read' }): Promise<PermissionState>;
}

interface Zapisano {
  readonly redId: string;
  readonly drazhka: DrazhkaNaPapka;
  readonly prikachena: string;
}

function otvoriBazata(): Promise<IDBDatabase> {
  return new Promise((gotovo, provali) => {
    const z = indexedDB.open(BAZA, VERSIYA);
    z.onupgradeneeded = () => {
      const db = z.result;
      if (!db.objectStoreNames.contains(HRANILISHTE))
        db.createObjectStore(HRANILISHTE, { keyPath: 'redId' });
    };
    z.onsuccess = () => gotovo(z.result);
    z.onerror = () => provali(z.error ?? new Error('базата на папките не се отвори'));
  });
}

async function vBazata<T>(
  rezhim: IDBTransactionMode,
  rabota: (h: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await otvoriBazata();
  try {
    return await new Promise<T>((gotovo, provali) => {
      const t = db.transaction(HRANILISHTE, rezhim);
      const z = rabota(t.objectStore(HRANILISHTE));
      z.onsuccess = () => gotovo(z.result as T);
      z.onerror = () => provali(z.error ?? new Error('заявката към папките падна'));
    });
  } finally {
    db.close();
  }
}

/**
 * ЖИВАТА ПАМЕТ · и защо записът в базата е „по възможност".
 *
 * НАМЕРЕНО НА 14.09.2026 от собствения проход: `IDBObjectStore.put` хвърли
 * „could not be cloned" върху дръжка, която не е истинска. Истинската
 * `FileSystemDirectoryHandle` СЕ клонира — но това е обещание на браузъра, не
 * закон, и вече има браузъри, в които го няма.
 *
 * Отказът да се ЗАПОМНИ не бива да е отказ да се РАБОТИ. Тук дръжките живеят в
 * паметта на раздела (там се ползват), а базата е второто копие — за да ги има и
 * утре. Падне ли записът, човекът работи днес и го КАЗВА: „папката ще трябва да
 * се прикачи пак след затваряне" (правило 12), вместо приложението да се счупи
 * с грешка, която не значи нищо за него.
 */
const vPametta = new Map<string, Zapisano>();

/** Пише в базата · и НЕ пада, когато дръжката не се клонира. */
async function zapomni(z: Zapisano): Promise<string> {
  vPametta.set(z.redId, z);
  try {
    await vBazata('readwrite', (h) => h.put(z));
    return '';
  } catch {
    return 'папката работи сега, но няма да се помни след затваряне на браузъра';
  }
}

/** Чете от паметта, после от базата · паметта е по-новата. */
async function vzemi(redId: string): Promise<Zapisano | undefined> {
  const zhiv = vPametta.get(redId);
  if (zhiv !== undefined) return zhiv;
  try {
    return await vBazata<Zapisano | undefined>('readonly', (h) => h.get(redId));
  } catch {
    return undefined;
  }
}

/** Има ли изобщо диалог за папка · пита се СВОЙСТВОТО, не името на браузъра. */
function imaPapki(): boolean {
  return (
    typeof (globalThis as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function'
  );
}

/**
 * Чете имената · и НИЩО ПОВЕЧЕ.
 *
 * Подпапките се броят, но не се влиза в тях: един Обект има папка с документи,
 * не дърво за обхождане. Влизането навътре би значело бавно четене на чужд диск
 * при всяко отваряне на екрана.
 */
async function faylovete(d: DrazhkaNaPapka): Promise<readonly FaylVPapkata[]> {
  const izlaz: FaylVPapkata[] = [];
  for await (const v of d.values()) {
    if (v.kind !== 'file') continue;
    try {
      const f = await v.getFile();
      izlaz.push({
        ime: v.name,
        golyamina: f.size,
        promenen: new Date(f.lastModified).toISOString(),
      });
    } catch {
      // файл, който изчезва между изброяването и четенето · казва се, че го има
      izlaz.push({ ime: v.name, golyamina: -1, promenen: '' });
    }
  }
  return izlaz.sort((a, b) => a.ime.localeCompare(b.ime, 'bg'));
}

async function opisha(z: Zapisano, pitay: boolean): Promise<PapkaNaReda> {
  let sastoyanie: PermissionState = 'denied';
  try {
    sastoyanie = await z.drazhka.queryPermission({ mode: 'read' });
    if (sastoyanie !== 'granted' && pitay)
      sastoyanie = await z.drazhka.requestPermission({ mode: 'read' });
  } catch {
    sastoyanie = 'denied';
  }
  if (sastoyanie !== 'granted')
    return {
      redId: z.redId,
      ime: z.drazhka.name,
      faylove: [],
      chetima: false,
      zashtoNe:
        sastoyanie === 'prompt'
          ? 'чака потвърждение · натисни „Обнови", за да я отвориш'
          : 'браузърът не дава достъп до тази папка',
    };
  try {
    return {
      redId: z.redId,
      ime: z.drazhka.name,
      faylove: await faylovete(z.drazhka),
      chetima: true,
      zashtoNe: '',
    };
  } catch (e) {
    return {
      redId: z.redId,
      ime: z.drazhka.name,
      faylove: [],
      chetima: false,
      zashtoNe: `папката не се чете: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

export function papkiteVBrauzara(): PortaKamPapkite {
  return {
    umee: imaPapki,
    async prikachi(redId) {
      if (!imaPapki()) return null;
      let drazhka: DrazhkaNaPapka;
      try {
        drazhka = await (
          globalThis as unknown as { showDirectoryPicker(o: unknown): Promise<DrazhkaNaPapka> }
        ).showDirectoryPicker({ id: 'coretovia-dokumenti', mode: 'read' });
      } catch {
        // ОТКАЗЪТ Е НЕГОВ · не е повреда (правило 12)
        return null;
      }
      const zapisano: Zapisano = { redId, drazhka, prikachena: new Date().toISOString() };
      const nezapomneno = await zapomni(zapisano);
      const opisano = await opisha(zapisano, true);
      return nezapomneno === '' ? opisano : { ...opisano, zashtoNe: nezapomneno };
    },

    async chetiPak(redId) {
      const z = await vzemi(redId);
      if (z === undefined) return null;
      return opisha(z, true);
    },

    async spisak() {
      // ПАМЕТТА Е ПО-НОВАТА · базата може да не е успяла да запише дръжката
      const po = new Map<string, Zapisano>();
      try {
        for (const z of await vBazata<Zapisano[]>('readonly', (h) => h.getAll()))
          po.set(z.redId, z);
      } catch {
        // няма база · остава паметта на раздела
      }
      for (const [id, z] of vPametta) po.set(id, z);
      // БЕЗ да пита · списъкът се рисува при всяко отваряне, а въпросът иска жест
      return Promise.all([...po.values()].map((z) => opisha(z, false)));
    },

    async otkachi(redId) {
      vPametta.delete(redId);
      try {
        await vBazata('readwrite', (h) => h.delete(redId));
      } catch {
        // базата може и да я няма · връзката вече е махната от паметта
      }
    },

    async otvori(redId, ime) {
      const z = await vzemi(redId);
      if (z === undefined) return false;
      try {
        for await (const v of z.drazhka.values()) {
          if (v.kind !== 'file' || v.name !== ime) continue;
          const f = (await (v as DrazhkaNaFayl).getFile()) as unknown as Blob;
          // ОТВАРЯ СЕ В НОВ РАЗДЕЛ · файлът не напуска устройството: адресът е
          // `blob:` и живее само в този браузър (правило 21)
          const adres = URL.createObjectURL(f);
          globalThis.open(adres, '_blank');
          // адресът се пуска след малко · пуснат веднага, разделът не сварява
          setTimeout(() => URL.revokeObjectURL(adres), 60_000);
          return true;
        }
      } catch {
        return false;
      }
      return false;
    },
  };
}
