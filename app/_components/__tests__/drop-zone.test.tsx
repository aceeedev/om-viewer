import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DropZone } from "../drop-zone";

const noop = () => {};
const render = (props: Partial<React.ComponentProps<typeof DropZone>> = {}) =>
  renderToStaticMarkup(<DropZone onFile={noop} onUrl={noop} dragging={false} {...props} />);

describe("DropZone", () => {
  for (const compact of [false, true]) {
    it(`keeps the link field outside the file picker's label${compact ? " (compact)" : ""}`, () => {
      const html = render({ compact });
      expect(html).toContain('type="file"');
      expect(html).toContain('type="url"');
      // Clicking anything inside the file label opens the file dialog, so the form must come after it.
      const fileLabelEnd = html.indexOf("</label>", html.indexOf('type="file"'));
      expect(fileLabelEnd).toBeGreaterThan(-1);
      expect(html.indexOf("<form")).toBeGreaterThan(fileLabelEnd);
    });
  }

  it("names the link field for screen readers in both sizes", () => {
    expect(render()).toContain("or paste a link to one");
    expect(render({ compact: true })).toMatch(/<label[^>]*class="sr-only"[^>]*>Image link<\/label>/);
  });

  it("shows a link that failed to open again", () => {
    expect(render({ initialUrl: "https://example.com/a.jpg" })).toContain('value="https://example.com/a.jpg"');
  });

  it("disables the link field while a photo is being read", () => {
    const html = render({ busy: true });
    expect(html).toContain("Reading…");
    expect(html).toMatch(/<input[^>]*type="url"[^>]*disabled/);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled/);
  });
});
