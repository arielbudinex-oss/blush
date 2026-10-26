import appleMap from "@/lib/emoji/apple-emoji-map.json";

const LOOKUP = appleMap as unknown as Record<string, [number, number]>;

export const APPLE_SHEET = "/emoji/apple-sheet.webp";
/** 62 columns of 33px cells in the generated sheet. */
export const APPLE_SHEET_COLS = 62;

function toKey(sequence: string) {
  let out = "";
  for (const char of sequence) {
    const code = char.codePointAt(0);
    if (code) out += code.toString(16);
  }
  return out;
}

/** Returns the sprite cell for an emoji sequence, or null when Apple has no artwork. */
export function emojiCell(sequence: string): [number, number] | null {
  const key = toKey(sequence);
  const hit = LOOKUP[key] ?? LOOKUP[key.replace(/fe0f/g, "")];
  return hit ?? null;
}

export function isEmoji(sequence: string) {
  return /\p{Extended_Pictographic}/u.test(sequence) && emojiCell(sequence) !== null;
}

/**
 * Renders one cell of the Apple sheet at an arbitrary size.
 * Sizing is expressed in `em` so it always tracks the surrounding text.
 */
export function EmojiSprite({
  x,
  y,
  label,
  scale = 1.18,
  className = "",
}: {
  x: number;
  y: number;
  label?: string;
  scale?: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label ?? "emoji"}
      className={`inline-block shrink-0 bg-no-repeat align-[-0.2em] ${className}`}
      style={{
        width: `${scale}em`,
        height: `${scale}em`,
        backgroundImage: `url(${APPLE_SHEET})`,
        backgroundSize: `${APPLE_SHEET_COLS * scale}em ${APPLE_SHEET_COLS * scale}em`,
        backgroundPosition: `${-x * scale}em ${-y * scale}em`,
      }}
    />
  );
}

/**
 * Renders a single emoji with Apple artwork, independent of the viewer's OS.
 */
export function AppleEmoji({
  sequence,
  label,
  scale = 1.18,
  className = "",
}: {
  sequence: string;
  label?: string;
  scale?: number;
  className?: string;
}) {
  const cell = emojiCell(sequence);
  if (!cell) return <span>{sequence}</span>;
  return <EmojiSprite x={cell[0]} y={cell[1]} label={label ?? sequence} scale={scale} className={className} />;
}

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("id", { granularity: "grapheme" })
    : null;

function splitGraphemes(text: string) {
  if (segmenter) return Array.from(segmenter.segment(text), (part) => part.segment);
  return Array.from(text);
}

/**
 * Renders user text with iOS emoji artwork in place of system glyphs.
 * Plain text is passed through untouched, so copy/paste keeps the real characters.
 */
export default function EmojiText({
  text,
  className = "",
  emojiScale,
}: {
  text: string;
  className?: string;
  emojiScale?: number;
}) {
  const parts = splitGraphemes(text);
  const hasEmoji = parts.some((part) => isEmoji(part));
  if (!hasEmoji) return <span className={className}>{text}</span>;

  return (
    <span className={className}>
      {parts.map((part, index) =>
        isEmoji(part) ? (
          <AppleEmoji key={index} sequence={part} label={part} scale={emojiScale} />
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}
