# OM Recipe Viewer

OM Recipe Viewer shows the picture settings, or "recipe", that an OM System camera used for a JPEG. Open a photo and see its Color Profile or Monochrome Profile Control, picture mode, highlight and shadow tone, and white balance.

The photo is read entirely in the browser. Nothing is uploaded.

**Try it at [omviewer.com](https://omviewer.com).**

## Features

- **Simple view.** The settings for the photo's picture mode, drawn in the style of the camera's own screens: the Color Profile hue wheel, the Monochrome filter wheel, the Color Creator ring, the tone curve, and the white balance fine-tune grid.
- **Full details.** Every decoded setting in tables, with each value's range, plus exposure, camera and lens.
- **Maker notes.** The raw values from the camera's maker-note block, as stored.
- **Supported photos.** JPEGs from OM System cameras, and from Olympus cameras that use the same maker-note format.

## Development

Requires Node.js 20.9 or later and pnpm.

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Start the development server         |
| `pnpm build`     | Build for production                 |
| `pnpm start`     | Serve the production build           |
| `pnpm lint`      | Run ESLint                           |
| `pnpm typecheck` | Check types with TypeScript          |
| `pnpm test`      | Run the tests                        |

Every pull request and push to `main` runs lint, the type check, the tests and the build on GitHub Actions. Pull requests that only change `README.md`, `LICENSE` or `AGENTS.md` skip them.

Some tests compare the parser's output with [ExifTool](https://exiftool.org) on real photos. To run them, install ExifTool and put JPEGs in a `samples/` folder at the project root. These tests are skipped otherwise. The folder is ignored by git, because photos carry camera and lens serial numbers.

## Built with

Next.js, React, TypeScript and Tailwind CSS. EXIF and maker-note parsing is written from scratch, with no image or metadata libraries.

## License

The code is released under the [MIT License](LICENSE). The license covers the code only, not these files:

- **Sample photos** in `public/samples/`. They belong to the photographers credited on the site's [About page](https://omviewer.com/about) and in `lib/sample-photos.ts`, and are included to demonstrate the viewer. Reusing them needs their owners' permission.
- **Archivo font files** in `assets/fonts/`, used to draw the social preview image. They're under the [SIL Open Font License](assets/fonts/OFL.txt).

## Disclaimer

This is an independent project, not affiliated with or endorsed by OM Digital Solutions. OM SYSTEM and PEN are trademarks of their owners.
