import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

// Render markdown to safe-ish HTML.
// We sanitize the output to prevent stored XSS via admin content.
export function renderMarkdown(md) {
  const raw = marked.parse(md || "");

  const clean = sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      // layout / semantic wrappers (for discovery boards etc.)
      "div",
      "section",
      "span",
      // interactive docs widgets (design system)
      "button",
      "label",
      "select",
      "option",
      // content
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "figure",
      "figcaption",
      "hr",
      "s",
      "del",
      "ins",
      "kbd",
    ]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "loading", "decoding"],
      button: ["type", "disabled", "aria-hidden"],
      label: ["for"],
      select: ["id"],
      option: ["value", "selected"],
      "*": [
        "id",
        "class",
        "style",
        // allow a tightly-scoped set of data-* attributes used by our design system playgrounds
        "data-ds-button-playground",
        "data-ds-variant",
        "data-ds-kind",
        "data-ds-state",
        "data-ds-size",
        "data-ds-hint",
        "data-variant",
        "data-kind",
        "data-state",
        "data-size",
      ],
    },
    allowedStyles: {
      "*": {
        // allow only safe presentation styles used by our design-system swatches + docs widgets
        "background-color": [/^#[0-9a-fA-F]{3,8}$/],
        background: [/^#[0-9a-fA-F]{3,8}$/],
        color: [/^#[0-9a-fA-F]{3,8}$/],
        // used by breakpoint ruler markers
        left: [/^[0-9]+(\.[0-9]+)?%$/],
        // used by docs widgets (opacity preview)
        "--a": [/^0(\.[0-9]+)?$|^1(\.0+)?$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    // Keep relative /uploads/... etc.
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noreferrer noopener",
        target: "_blank",
      }),
      img: (tagName, attribs) => {
        // default performance-friendly attributes
        return {
          tagName,
          attribs: {
            ...attribs,
            loading: attribs.loading || "lazy",
            decoding: attribs.decoding || "async",
          },
        };
      },
    },
  });

  return clean;
}
