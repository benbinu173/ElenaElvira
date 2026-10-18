/**
 * Photos are picked up automatically, so dropping a new file into
 * src/assets/photos is all it takes to get it onto the wall.
 *
 * There are two folders because the first batch of photographs arrived in
 * ElenaElvi/ at the project root before there was a src/. Both are read: the
 * sibling folder first, then src/assets/photos, so a file with the same name in
 * the tidier location wins. Nothing has to be moved for this to work.
 *
 * Both glob patterns are written out in full, as string literals, and the
 * options are inlined. import.meta.glob is resolved by a build-time transform
 * that reads the call statically, so a shared constant or a template literal is
 * invisible to it and the dev server dies with "Expected glob to be a string,
 * but got dynamic template literal".
 */
const fromRoot = import.meta.glob('../../ElenaElvi/*.{jpeg,jpg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const fromAssets = import.meta.glob('../assets/photos/*.{jpeg,jpg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** Captions are keyed by filename (without extension). */
const CAPTIONS = {
  pic5: 'the very beginning, in matching white',
  hi: 'four of us in one small round mirror',
  pic13: 'you two, front and centre',
  pic6: 'the lift photo nobody planned',
  pic9: 'this one is my favourite',
  pic7: 'new hair, fully committed pose',
  pic8: 'green shirt day',
  pic12: 'row K, popcorn, and one ice cream',
  pic11: 'the fitting room committee',
  pic10: 'still deciding, still undecided',
  pic15: 'looking at something better than the camera',
  pic14: 'pink walls and one very cold drink',
  pic16: 'iced coffee, taken extremely seriously',
  pic17: 'the blue room, neither of you looking at me',
};

/**
 * Alt text describes what is actually in the frame. It deliberately avoids
 * guessing which sister is which in a photo.
 */
const ALTS = {
  pic5: 'The two of them as toddlers, in matching white dresses',
  hi: 'Four people reflected in a round mirror on a floral wall',
  pic13: 'Two people smiling into a round mirror',
  pic6: 'Four people taking a photo in a lift with red doors',
  pic9: 'Two people walking away down a road, holding hands',
  pic7: 'Someone in a red shirt standing in a salon',
  pic8: 'Someone in a green shirt sitting on a blue sofa',
  pic12: 'A group in a cinema row with popcorn and ice cream',
  pic11: 'A mirrored photo taken in a clothes shop',
  pic10: 'A second mirrored photo in the same clothes shop',
  pic15: 'A portrait against a pink wall under a round lamp',
  pic14: 'Someone drinking from a cup at a marble table',
  pic16:
    'Someone in clear-framed glasses drinking from a tall iced coffee in a pink café with flowers on the wall',
  pic17:
    'Two people at a table in a blue restaurant, one in a burgundy top and one in a pale blue shirt',
};

/**
 * Narrative order rather than filename order: it opens on the two of you as
 * toddlers and walks forward to this year.
 */
const ORDER = [
  'pic5',
  'hi',
  'pic13',
  'pic6',
  'pic9',
  'pic7',
  'pic8',
  'pic12',
  'pic11',
  'pic10',
  'pic15',
  'pic14',
  'pic16',
  'pic17',
];

function basename(path) {
  return path.split('/').pop().replace(/\.[^.]+$/, '');
}

const found = new Map();
for (const source of [fromRoot, fromAssets]) {
  Object.entries(source).forEach(([path, url]) => {
    found.set(basename(path), url);
  });
}

const orderedNames = [
  ...ORDER.filter((name) => found.has(name)),
  ...[...found.keys()].filter((name) => !ORDER.includes(name)).sort(),
];

export const photos = orderedNames.map((name, index) => ({
  id: index,
  name,
  src: found.get(name),
  caption: CAPTIONS[name] || '',
  alt: ALTS[name] || CAPTIONS[name] || 'A photograph of Elena and Elvira',
}));

/** Elena reads gold, Elvira reads rose. Used for names, candles, notes, balloons.
 *
 * The two keys stay short and even with each other. `name` is the only part
 * that is ever put on screen, so it is the only part that has to spell her
 * name out in full. */
export const TWINS = {
  elena: { name: 'Elena', tone: 'gold' },
  elvi: { name: 'Elvira', tone: 'rose' },
};

/** Midnight on the twenty-second of October, in the visitor's own time zone. */
export const BIRTHDAY = '2026-10-22T00:00:00';

/**
 * The morning the two of them arrived, as YYYY-MM-DD. Used by the "days of
 * being two" counter, which adds up how long they have existed, and by the age
 * section, which works out the number they turn from it.
 *
 * It was left empty until the year was known, because a wrong number on a page
 * about two real people is worse than no number. Empty it again and both
 * sections fall back to copy that needs no figure.
 */
export const BORN = '2005-10-22';

/**
 * The age they turn on the twenty-second, derived from the two dates above
 * rather than typed in a third time, so correcting one cannot leave the other
 * lying.
 *
 * Null in two cases, both of which mean the same thing to the page: no age to
 * show. Either BORN is empty, or its month and day do not match BIRTHDAY's.
 * That second check matters, because if someone sets BORN to a different date
 * the subtraction below quietly returns a number that is off by a year, and a
 * confidently wrong age is exactly what the empty default was avoiding.
 */
export const TURNS = (() => {
  if (!BORN) return null;
  if (BORN.slice(5, 10) !== BIRTHDAY.slice(5, 10)) return null;

  const age = Number(BIRTHDAY.slice(0, 4)) - Number(BORN.slice(0, 4));
  return Number.isFinite(age) && age > 0 ? age : null;
})();

/** The pair used for the then/now slider. Falls back gracefully if missing. */
export const THEN_NOW = {
  then: photos.find((p) => p.name === 'pic5') || photos[0],
  now: photos.find((p) => p.name === 'pic13') || photos[photos.length - 1],
};

/**
 * One print on the wall arrives blank and has to be developed by hand, the way
 * an instant photograph does. Hold it down on a mouse, or press Enter on it
 * from a keyboard, and it comes up over a couple of seconds.
 *
 * Named by filename without the extension. Set it to an empty string to turn
 * the whole thing off and give every print a normal photograph.
 *
 * It is deliberately a hover-only trick: on a phone, holding is how you scroll
 * a horizontal strip, and a photograph nobody on a phone can see is not a
 * present. Touch devices get the picture.
 */
export const DEVELOP_PHOTO = 'pic9';
