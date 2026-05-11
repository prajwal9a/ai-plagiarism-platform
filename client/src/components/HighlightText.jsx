export default function HighlightText({
  text = "",
  matches = [],
}) {
  if (!text) return null;

  let highlighted = text;

  matches.forEach((match) => {
    if (!match) return;

    highlighted = highlighted.replace(
      match,
      `<span class="highlight-danger">${match}</span>`
    );
  });

  return (
    <div
      style={{
        whiteSpace: "pre-wrap",
        lineHeight: 1.7,
      }}
      dangerouslySetInnerHTML={{
        __html: highlighted,
      }}
    />
  );
}