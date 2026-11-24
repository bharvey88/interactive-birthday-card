# Interactive Birthday Card

Free to use, never for sale. See [License](#license).

An interactive birthday card for a little kid that opens from a link in iMessage or email. There's no app and no login.

1. Tap the heart and the envelope opens. A coloring page slides out.
2. Rub the page to color in the castle, unicorn and princess. When it's all colored, "Happy 6th birthday" pops up and the characters dance.
3. Color the unicorn by picking crayons and tapping parts.
4. Sing along with a bouncing star, then tap the candles out.
5. Read the message. The unicorn they colored is in the picture.

**[Make a card](https://bharvey88.github.io/interactive-birthday-card/)** or play the sample: [a card for Riley](https://bharvey88.github.io/interactive-birthday-card/riley-birthday-card/)

## Make one with the form

Fill in [the form](https://bharvey88.github.io/interactive-birthday-card/), copy the link and text it. There's nothing to install and no account.

- The name and everything else is in the link, after the `#`. Browsers don't send that part to the website, so it isn't stored there. Anyone with the link can see the card.
- The endings are prewritten, so nobody can put their own message on the page.
- The link preview in a text says "A birthday card for you", since the website never sees the name.
- You can also write a link by hand: `https://bharvey88.github.io/interactive-birthday-card/card/#name=Riley&age=6&from=Grandma`

The form and card are the static files in `site`. After changing the art, run `python tools/render_site.py` to redraw its pictures.

## Other ways

For your own message, your own domain or a different look, make your own copy:

- [With only GitHub](#make-one-with-only-github): free, in your browser, nothing to install.
- [On your computer](#make-one-on-your-computer): for changing the art, or hosting it on Cloudflare or anywhere else.

## Make one with only GitHub

GitHub builds the card and hosts it for free with GitHub Pages. You need a GitHub account.

1. Click **Use this template** at the top of this page, then **Create a new repository**. Name it, choose **Public**, and create it. The name shows up in the link.
2. In your new repository, go to **Settings**, then **Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Go to **Settings**, then **Secrets and variables**, then **Actions**. Click **New repository secret** and name it `CARD_CONFIG`.
4. Copy everything in [config.json](config.json), paste it as the secret, change it to your [settings](#settings), and save. You can skip `siteUrl`, GitHub fills that in.
5. Go to the **Actions** tab, click **Publish card**, then **Run workflow**. It takes a couple of minutes.

Your card is at `https://USERNAME.github.io/REPOSITORY/SLUG/`. Text yourself that link first to try it.

To change the card later, update the secret and run the workflow again. GitHub won't show you a saved secret, so keep a copy of yours. Each repository holds one card, so make another repository for the next one.

### Keep the name private

A public repository can be read by anyone, so the steps above use a secret instead of editing `config.json`. The card itself is still public to anyone with the link. GitHub also keeps the built card in the Actions tab for a day, where someone looking at your repository may be able to download it. Use a first name only.

If you have GitHub Pro, you can use a private repository instead. The card's link still works for everyone.

### Use your own domain

This works with a subdomain you own, like `cards.example.com`.

1. Where you manage your domain's DNS, add a `CNAME` record for `cards` that points to `USERNAME.github.io`. Leave the repository name off. On Cloudflare, set it to **DNS only**.
2. In your repository, go to **Settings**, then **Pages**. Type `cards.example.com` under **Custom domain** and click **Save**.
3. Once the DNS check passes, turn on **Enforce HTTPS**. The certificate can take a while.
4. Run the **Publish card** workflow again so the link preview uses the new address.

Your card is now at `https://cards.example.com/SLUG/`.

## Settings

| Setting | What it does |
|---|---|
| `name` | On the envelope, title and link preview |
| `syllables` | The name split for the song, like `["Ri", "ley"]` |
| `age` | 1 to 12. Sets the candles and the "6th" |
| `from` | Who signs it |
| `cross` | `true` adds a gold cross to the castle and the princess's necklace |
| `hair`, `skin` | Colors for the princess |
| `message` | The ending, one entry per line. Keep it to 7 lines of about 28 characters |
| `slug` | The last part of the link. Lowercase letters, numbers and dashes |
| `siteUrl` | Where it's hosted. The preview picture needs the full address |

## Make one on your computer

You need Python 3 and Google Chrome, which draws the art.

1. Edit `config.json`.
2. Run `pip install -r requirements.txt`
3. Run `python build.py`
4. Run `python -m http.server 8790 --bind 127.0.0.1 -d dist` and open `http://localhost:8790/<your slug>/`

If you only changed the message, age or syllables, `python build.py --no-art` skips the drawing step. It takes a few seconds.

### Host it on Cloudflare

The card is all static files, so any web host works. For a Cloudflare Worker that only serves files, you need Node.

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
