/**
 * Notes that should be waiting on the board for everyone who opens this.
 *
 * Add real ones here before you share the link. Anything you write in this
 * array is permanent and shows up for every visitor, on every device.
 * Anything visitors add themselves is stored in their own browser under
 * "ee-notes-v1" and never leaves it.
 *
 * Shape: { id, from, text }
 */
export const seededNotes = [];

/**
 * Where a note goes when someone presses "send it to them".
 *
 * This exists because of an awkward truth: a note written on the page is saved
 * in the visitor's own browser and reaches nobody. Elena and Elvira would open
 * the site and see an empty board. These two fields give the visitor a way to
 * get the note to you, which is the only way it can get to them.
 *
 * Fill in either or both. Digits only for the number, including the country
 * code, no plus sign and no spaces: '447700900123'.
 *
 *   export const SHARE_TO = { email: 'you@example.com', whatsapp: '447700900123' };
 *
 * Leave a field empty and that button is not rendered at all. Leave both empty
 * and the whole row disappears, which is the honest thing to do rather than
 * offering a send button that goes nowhere.
 */
export const SHARE_TO = {
  email: 'benbinu173@gmail.com',
  whatsapp: '917994757246',
};

/** Shown on the board while it is still empty. */
export const EMPTY_NOTE = {
  title: 'The board is empty',
  body: 'Add the first note and it stays here, waiting for them to read on the twenty-second.',
};
