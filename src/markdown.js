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
      "*": ["id", "class"],
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
