# Birthday card kit

Free to use, never for sale. See [License](#license).

An interactive birthday card for a little kid that opens from a link in iMessage or email. There's no app and no login.

1. Tap the heart and the envelope opens. A coloring page slides out.
2. Rub the page to color in the castle, unicorn and princess. When it's all colored, "Happy 6th birthday" pops up and the characters dance.
3. Color the unicorn by picking crayons and tapping parts.
4. Sing along with a bouncing star, then tap the candles out.
5. Read the message. The unicorn they colored is in the picture.

To try the finished sample, run `python -m http.server 8790 --bind 127.0.0.1 -d sample` and open `http://localhost:8790/`.

## Make one

You need Python 3 with Pillow, Google Chrome (it draws the art), and Node for the deploy.

1. Edit `config.json`.
2. Run `pip install -r requirements.txt`
3. Run `python build.py`
4. Run `python -m http.server 8790 --bind 127.0.0.1 -d dist` and open `http://localhost:8790/<your slug>/`

If you only changed the message, age or syllables, `python build.py --no-art` skips the drawing step. It takes a few seconds.

| Setting | What it does |
|---|---|
| `name` | On the envelope, title and link preview |
| `syllables` | The name split for the song, like `["Ri", "ley"]` |
| `age` | 1 to 12. Sets the candles and the "6th" |
| `from` | Who signs it |
| `cross` | `true` adds a gold cross to the castle and the princess's necklace |
| `hair`, `skin` | Colors for the princess |
| `message` | The ending, one entry per line. Keep it to 7 lines of about 28 characters |
| `slug` | The last part of the link |
| `siteUrl` | Where it's hosted. The preview picture needs the full address |

## Put it online

It's all static files, so any web host works. Ours is a Cloudflare Worker that only serves files.

1. Run `npx wrangler login`
2. For your own domain, edit the `routes` line in `wrangler.jsonc`. The domain has to be on your Cloudflare account. Without it you get a `workers.dev` address.
3. Set `siteUrl` in `config.json` to that address and run `python build.py` again.
4. Run `npx wrangler deploy`

A deploy replaces the whole site with what's in `dist`, so keep older cards' folders in there.

The pages tell search engines to stay away, but anyone with the link can open it. Use a first name only, and a harder to guess slug if that matters to you.

## How it works

- **Art:** `src/art.js` draws everything as SVG. `src/render.html` adds the crayon look with two SVG filters: noise that wobbles the lines, and stretched noise that knocks out little flecks so the paper shows through.
- **Why it's pre-drawn:** those filters could be slow to redraw on a phone while a kid is rubbing the screen. `build.py` takes headless Chrome screenshots of each layer with a transparent background and saves WebP files.
- **Rub to color:** the colored art sits underneath. A canvas on top holds the line art, and rubbing erases it with `destination-out`. Both were drawn with the same noise seed, so the lines match up.
- **Knowing when it's done:** on load it finds the 10 px squares that hold color, so blank sky doesn't count. It ends at 99.5% while rubbing, or at 98.5% after a short pause or when the finger lifts. "I'm done!" shows up after 40%.
- **Music:** plain Web Audio, with no sound files. The first tap unlocks audio, and `navigator.audioSession.type = 'playback'` is there so an iPhone on silent still plays it.
- **Screen sizes:** everything is laid out on a 300 by 600 stage that scales to fit. The backgrounds are 900 by 700 so phones and tablets get filled edge to edge.

Add `?go=2` through `?go=5` to the address to jump to a page while testing. The music stays quiet until you tap something.

## What we learned from testing it

- Pick the look first. We mocked up three styles, three openings, four activities and three endings, then picked from those.
- Let the kid finish. The first version filled itself in at 62% colored, or after a minute, and it was annoying.
- Don't make them hunt for a play button. The castle page moves on by itself, and the unicorn page has a button that says "I'm done!"
- Don't wait for them to lift their finger before celebrating.

## Making a different theme

Swap the drawings in `src/art.js` and keep the rest. If you use an AI coding tool, this is close to what we asked for:

> Make an interactive birthday card web page for a 6 year old that I can text as a link. They like (two or three things) and these colors: (colors). Mock up a few looks, openings and activities first and let me pick. Make it work on an iPhone with taps and rubbing, with sound made in the browser, and don't require reading to get through it.

## License

Copyright 2026 [bharvey88](https://github.com/bharvey88). Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). The full terms are in [LICENSE](LICENSE).

You can use it, change it and share it for free. You have to:

- Credit this project and link back to it.
- Say what you changed.
- Keep the same license on your version.

You can't make money from it. That means no selling cards, kits or templates made from it, and no charging people to make or host them.

This is a summary. The license text is what counts. The handwriting fonts, Cabin Sketch and Patrick Hand, come from Google Fonts under their own license.
