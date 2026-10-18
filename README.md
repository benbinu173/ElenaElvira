# Elena & Elvira

A birthday site for the twenty-second of October. React, GSAP ScrollTrigger, and plain CSS.

---

## Running it

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

To make a version you can send to people:

```bash
npm run build
npm run preview
```

`npm run build` puts everything in `dist/`. That folder is self-contained and can be
uploaded to Netlify, Vercel, GitHub Pages, or any static host. The paths inside it are
relative, so it also works from a subfolder.

The generated site needs to be served over http (any of the above, or `npm run preview`).
Opening `dist/index.html` straight off the disk will not work, because browsers block
module scripts on `file://`.

---

## The four things you will want to change

### 1. The photographs

Every image in `src/assets/photos/` is picked up automatically. Drop a file in and it
appears on the wall. No imports to update.

The first batch is still sitting in `ElenaElvi/` at the project root, because that is
where it arrived. Both folders are read, so nothing has to move. A file with the same
name in `src/assets/photos/` wins over one in `ElenaElvi/`.

If you would like them all in one place:

```bash
mv ElenaElvi/*.jpeg src/assets/photos/
rmdir ElenaElvi
```

**To add a caption**, open `src/data/photos.js` and add an entry to `CAPTIONS` keyed by
the filename without its extension:

```js
const CAPTIONS = {
  pic5: 'the very beginning, in matching white',
  myNewPhoto: 'the day we all got soaked',
};
```

**To add alt text** (a plain description for screen readers and for anyone whose images
fail to load), add to `ALTS` in the same file. Worth doing, and it takes ten seconds.

**To change the order**, reorder the `ORDER` array. Anything not listed still shows up,
it just goes at the end.

Photos are 1000 to 2000px wide at the moment, which is about right. If you swap in
something enormous, resize it first, because it is the heaviest thing on the page.

### 2. Notes waiting on the board

`src/data/wishes.js` has a `seededNotes` array. Anything you put in there is permanent
and appears for every visitor on every device. Use it for notes from family who are not
going to type them in themselves.

```js
export const seededNotes = [
  { id: 'amma', from: 'Amma', text: 'My two, from the very first day.' },
  { id: 'nivin', from: 'Nivin', text: 'Happy birthday, both of you.' },
];
```

Each one needs a unique `id` (any string will do).

Notes that visitors write themselves are stored in their own browser and never leave it.
That is a real limitation, not a preference: without a server there is nowhere for them
to go. The page says so, in the copy above the board.

### 3. Where a visitor's note can actually be sent

Because of the above, `src/data/wishes.js` also has a `SHARE_TO` object. Fill it in and
the note form grows a second row of buttons that hand the note to the visitor's own email
app or WhatsApp, addressed to you. That is the only route a note has to reach Elena and
Elvira, short of putting a server behind it.

```js
export const SHARE_TO = {
  email: 'you@example.com',   // leave empty to hide the email button
  whatsapp: '447700900123',   // digits only, country code, no plus or spaces
};
```

Both are filled in. Worth knowing when you change them: this address is compiled into
the page and visible in the source to anyone who looks at it, which is the reason it is
yours and not Elena's or Elvira's. The note comes to you and you pass it on.

Clear both fields and the whole row disappears, leaving the board read-only — still
readable, just not contributable.

If you would rather do it properly, a form endpoint (Formspree, Basin, a small serverless
function) is about half an hour of work and makes the notes travel on their own.

### 4. Their birthday, and one optional flourish

Both are in `src/data/photos.js`.

```js
export const BORN = '2005-10-22';   // their birthday, as YYYY-MM-DD
export const DEVELOP_PHOTO = 'pic9'; // the print that arrives blank
```

**`BORN`** is set, and it feeds two sections: the "days of being two" counter, and the age
section, which works out the number they turn from it. The age is not written down
anywhere — it is subtracted from the year in `BIRTHDAY`, so changing either date updates
it. It is a `const BORN` and a `const BIRTHDAY` and one sum, not three facts that can
drift apart.

Empty `BORN` again and both sections fall back to copy that needs no number, rather than
printing a wrong one.

One thing does not follow automatically. The number is derived, but the line of copy
about it is not: the age section says twenty-one will not divide in two, and that sentence
only makes sense for twenty-one. If `BORN` changes, `src/components/Turns.jsx` needs a new
one. There is a comment marking the spot.

**`DEVELOP_PHOTO`** names one print on the wall that arrives as blank paper and has to be
held down before the photograph comes up, the way an instant photo does. Keyboard users
press Enter on it instead. Set it to `''` to turn the trick off. It only runs on devices
with a mouse: on a phone, holding is how you scroll a horizontal strip, and a photograph
nobody on a phone can see is not a present.

---

## What is on the page

| Section | What it does |
| --- | --- |
| Invitation | The opening gate. Also genuinely preloads every photograph. |
| Hero | `Elena` and `Elvira` split by a seam of light, each with a reflection under it. |
| Countdown | Live to the second, counting to midnight on 22 October. |
| Twenty-one | The age, in the two of them's colours, and a garland of one light per year. |
| Together | Counts the other way, from the morning they arrived. |
| Ribbon | The one marquee on the page. |
| The wall | Every print, pinned and panned horizontally as you scroll. One arrives blank. |
| Then and now | A drag line between the toddler photo and a recent one. |
| Candles | One each. Blow them both out and the tune plays. |
| The board | Notes, and a way to send them to you. |
| Finale | Poppable letters and one more round of confetti. |

Two things happen without a section of their own. The glow behind everything follows the
visitor's clock, and the candles play Happy Birthday once both are out.

---

## How it is built

```
src/
  components/     one .jsx and one .css per section
  lib/
    gsap.js       plugin registration, shared easings, refresh queue
    anim.js       the shared reveal-on-scroll helper
    confetti.js   a small canvas confetti engine, no dependency
    audio.js      synthesised chimes, pops, and the tune, no audio files
    motion.js     reduced-motion detection and scroll locking
    daylight.js   which hour it is where the visitor is
  data/
    photos.js     photo order, captions, alt text
    wishes.js     notes that are permanent
  styles/
    index.css     design tokens, base, shared primitives
```

A few decisions worth knowing about, because they look like omissions otherwise:

**No Tailwind.** The brief called for plain CSS, and the design is a handful of
authored sections rather than a component library, so tokens plus colocated CSS is the
right size for it.

**Elena is gold, Elvira is rose.** That pair is the only accent colour on the page. It
carries through the hero, the candles, the letters at the end, and the footer, which is
what makes it read as a system rather than as decoration.

**Sound is synthesised, not loaded.** The chimes, the pops, and the tune at the candles
all come out of the Web Audio API, so there are no audio files to ship and nothing
autoplays. There is a switch in the bottom right corner, and its state is remembered.

That tune is the actual Happy Birthday, not something written to sound like it. The
melody has been public domain in the United States since a 2016 court ruling, and the
recognisable version is the one that lands.

**The room follows the clock.** The glow behind the page shifts through four phases
across the day, decided by the visitor's own time. It is the one piece of the design that
is not fixed, and it means the page looks different at two in the morning than at noon,
which suits a countdown to midnight.

**Motion is honest about `prefers-reduced-motion`.** If someone has that set, the
horizontal pan becomes a normal swipeable strip, the confetti does not fire, entrances
resolve instantly, and everything still works. Worth checking once with the setting on.

**It is built for a phone.** The likeliest way this gets opened is from a group chat on a
handset, so that is the case the layout is checked against. Below 768px the two names
stack and the seam between them turns horizontal; the countdown wraps to two columns; the
photo wall stops being a scroll-pinned pan and becomes an ordinary swipeable strip; the
notes board drops to a single column.

`index.html` sets `viewport-fit=cover` so the page can use the whole screen, which means
anything pinned to an edge has to keep itself clear of the notch and the home indicator.
The `--safe-*` tokens at the top of `index.css` do that, and they resolve to `0px` on
anything that has no inset to report.

Where a control needs to be easier to hit on a touch screen, the rule is keyed to
`@media (hover: none)` rather than to a width. A tablet is wide enough to skip every phone
breakpoint and still has no mouse, and the one control that deletes a note was invisible
on exactly that device until it was keyed to the pointer instead.

**The scroll is native.** No smooth-scroll library. Scrolling is left exactly as the
browser does it, and GSAP only reads from it.

---

## Fonts

Playfair Display, Outfit, and Caveat are loaded from Google Fonts with a `<link>` in
`index.html`. That is the one shortcut in the project and it is worth replacing before
you put this on a public URL: download the three families, drop the `.woff2` files into
`src/assets/fonts/`, and add `@font-face` rules to `src/styles/index.css`. The tokens at
the top of that file are the only place the family names appear, so nothing else has to
change.

---

## Credits

Made for Elena and Elvira.
