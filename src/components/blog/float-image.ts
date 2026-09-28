import Image from "@tiptap/extension-image";

export const FloatImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      float: {
        default: "left",
        parseHTML: (element) =>
          element.getAttribute("data-float") ??
          (element.classList.contains("book-pic-right") ? "right" : "left"),
        renderHTML: (attributes) => {
          const side = attributes.float === "right" ? "right" : "left";
          return {
            "data-float": side,
            class: `book-pic book-pic-${side}`,
          };
        },
      },
    };
  },
});
