/**
 * ОБЩОТО НА ЕКРАНИТЕ · пренесено от MasterBook (`app/obshto.ts`) · само трите
 * помощника, които резен 1 ползва: екраниране, сваляне на файл, безопасно име.
 *
 * Тук няма нито един ред за домейн и нито едно състояние. Този файл не знае
 * за екрани, екраните знаят за него.
 *
 * ЕКРАНИРАНЕТО СИ ОТИДЕ ОТТУК (резен 6м). То живееше като функция, викана на
 * 185 места — тоест като НАВИК. Днес домът му е `shablon.ts`, където се вика
 * САМО, и няма как да се забрави.
 */

/**
 * СВАЛЯНЕ НА ФАЙЛ · и ТОЙ избира къде.
 *
 * Негово, 14.09 в 17:09 (запис 230) т.1, ДОСЛОВНО: „**Когато свалиш файл а
 * избираш мястото.**"
 *
 * Дотук всеки файл — Книгата и копието на Журнала — падаше в папката „Изтеглени"
 * без въпрос. За копие на Журнала това е дребно неудобство; за човек, който го
 * иска на Драйва си, е разликата между „готово" и „а сега го намери и го
 * премести".
 *
 * ДВА ПЪТЯ, И ВТОРИЯТ НЕ Е ОТСТЪПЛЕНИЕ:
 *
 *   1. `showSaveFilePicker` · диалогът на самата система. Човек избира папка и
 *      име, файлът се пише направо там. Има го в Chrome и Edge на десктоп.
 *   2. Старата връзка с `download` · навсякъде другаде (Firefox, Safari, всеки
 *      телефон). Файлът пада в папката по подразбиране, както досега.
 *
 * ОТКАЗЪТ НЕ Е ГРЕШКА · натисне ли „Отказ" в диалога, браузърът хвърля
 * `AbortError`. Това е негово решение, не повреда: връща се `false` и екранът
 * казва „не е свалено", вместо да мига с червена грешка (правило 12).
 *
 * ЗАЩО НЕ САМО НОВИЯТ ПЪТ · правило 9 не пуска библиотека срещу решен проблем, а
 * тук проблемът е РЕШЕН нееднакво: `showSaveFilePicker` го няма в половината
 * браузъри. Единият път би значел „на телефона не се сваля", а програмата е
 * негова и на двете места.
 */

/** Има ли системен диалог за запис · пита се СВОЙСТВОТО, не името на браузъра. */
function imaDialogZaZapis(): boolean {
  return typeof (globalThis as { showSaveFilePicker?: unknown }).showSaveFilePicker === 'function';
}

interface DrazhkaNaFayl {
  createWritable(): Promise<{ write(danni: Blob): Promise<void>; close(): Promise<void> }>;
}

/**
 * Сваля файл · връща КАКВО СТАНА, с думи за човека.
 *
 * `''` значи „свалено без въпрос" (старият път). Инак — какво да се покаже.
 */
export async function svaliFayl(fayl: Blob, ime: string, vid = ''): Promise<string> {
  if (imaDialogZaZapis()) {
    try {
      const pitay = (
        globalThis as unknown as {
          showSaveFilePicker(n: unknown): Promise<DrazhkaNaFayl>;
        }
      ).showSaveFilePicker;
      const drazhka = await pitay({
        suggestedName: ime,
        types:
          vid === ''
            ? undefined
            : [
                {
                  description: vid,
                  accept: {
                    [fayl.type || 'application/octet-stream']: [
                      `.${ime.split('.').pop() ?? 'bin'}`,
                    ],
                  },
                },
              ],
      });
      const pisach = await drazhka.createWritable();
      await pisach.write(fayl);
      await pisach.close();
      return `Записано като „${ime}" на мястото, което избра.`;
    } catch (e) {
      // ОТКАЗЪТ Е НЕГОВ · не е повреда и не се показва като грешка
      if (e instanceof Error && e.name === 'AbortError') return 'Не е свалено · ти отказа.';
      // всичко друго пада на стария път · по-добре в „Изтеглени", отколкото никъде
    }
  }
  const adres = URL.createObjectURL(fayl);
  const vruzka = document.createElement('a');
  vruzka.href = adres;
  vruzka.download = ime;
  vruzka.click();
  URL.revokeObjectURL(adres);
  return '';
}
