/**
 * Chooses `option` in a Vuetify select, `select` being its combobox.
 *
 * Vuetify lays its field over the combobox's input, so the click goes to the
 * field, the input's parent. A long list renders only the options in view,
 * so this scrolls the select's own menu until the option is there. Typing
 * would bring it into view too, but a select chooses every option that
 * matches on the way. As feral-authentication's drivers/select.js.
 *
 * From Vuetify 3.13 the list measures its rows after it renders them, and
 * renders again once it has: its height grows and rows are replaced. So each
 * step waits for the list to settle before reading it. A select that has a
 * value also opens scrolled to it now, so the search starts from the top.
 */
export async function chooseOption(page, select, option) {
    await select.locator('xpath=..').click();
    // The open select names its menu; a closing one may still be shown
    const menu = page.locator(`[id="${await select.getAttribute('aria-controls')}"]`);
    const list = menu.getByRole('listbox');
    const wanted = menu.getByRole('option', { name: option, exact: true });

    await settled(list);
    await list.evaluate(element => { element.scrollTop = 0; });
    await settled(list);
    while (await wanted.count() === 0) {
        const moved = await list.evaluate(element => {
            const before = element.scrollTop;
            element.scrollTop += element.clientHeight;
            return element.scrollTop !== before;
        });
        await settled(list);
        if (!moved) {
            // At the bottom: the click below fails, naming the option
            break;
        }
    }
    await wanted.click();
}

// Waits until the list's height and the options it renders have stayed the
// same for five frames, or two seconds have passed
async function settled(list) {
    await list.evaluate(element => new Promise(done => {
        const shape = () => `${element.scrollHeight}|${element.querySelectorAll('[role="option"]').length}|`
            + (element.querySelector('[role="option"]')?.textContent ?? '');
        const giveUp = performance.now() + 2000;
        let last = shape();
        let still = 0;
        const check = () => {
            const now = shape();
            still = now === last ? still + 1 : 0;
            last = now;
            if (still >= 5 || performance.now() > giveUp) {
                done();
            } else {
                requestAnimationFrame(check);
            }
        };
        requestAnimationFrame(check);
    }));
}
