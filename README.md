# www

The language website: [wand-lang.org](https://wand-lang.org).

The site is built by a wand script from a checkout of
[wand-lang/wand](https://github.com/wand-lang/wand). Nothing on it is
copied by hand:

| page | comes from |
|---|---|
| Reference | `docs/reference.md`, one page per `##` section |
| Standard library | `wand d --json`, the manifest and opening comment of each file in `stdlib/`, and the module's section of the reference |
| Examples | the opening comment of each file in `examples/ports/` |
| Home | the copy in `lib/home.wand`; its terminal sessions are what `wand t` prints when the site is built |

`data/` holds what the sources do not say: the group and one-line
description of each module, the reference's sidebar groups, and the task
each example is filed under. A module, section or port that `data/` does
not name is still built, under "Other" or "More", and the build says so.

## Building

The `wand` on `PATH` has to be the version the checkout is, since it
answers the `wand d` questions:

```sh
./serve.wand                    # build from ../wand, serve at http://localhost:8000/
./serve.wand --src ../wand --port 9000
./serve.wand --watch            # and rebuild when a source changes
wand build.wand --src ../wand --out _site   # build only
```

`serve.wand` builds before it serves. With `--watch` it checks once a
second what a build reads -- the checkout's reference, `VERSION` and
examples, this repository's `build.wand`, `lib/`, `data/` and `assets/`,
and the `wand` binary -- and rebuilds when any of them changes. Reload the
page to see it. A rebuild that fails says why, and the last good build goes
on being served. The library pages come from `wand d`, so an edit to
`stdlib/*.wand` appears once `dune build` has made a new binary. Run it from
the top of this repository.

```sh
wand s test        # the Markdown, highlighting and section tests
wand t build.wand  # typecheck
wand f build.wand lib test
```

## Publishing

`.github/workflows/pages.yml` builds from the newest wand release and
publishes to GitHub Pages on every push to `main`, once a day, and on
"Run workflow". A pull request is built and tested, and not published.

## Layout

- `build.wand` — reads the options, checks the versions agree, and writes every page.
- `serve.wand` — builds, then serves `_site/` on this machine with `HTTP.serve!`; `--watch` polls the sources and rebuilds.
- `lib/` — `markdown`, `highlight`, `sections` and `html` are pure; `stdlib`, `reference`, `examples` and `home` each make one part of the site; `layout` is the frame every page shares.
- `assets/` — `site.css` (the design's tokens, light and dark), `site.js` (search, filters, tabs, copy), the icon.
- `test/` — `wand s` tests for the pure modules.
