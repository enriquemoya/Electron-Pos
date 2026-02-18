function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function estimateReadingTimeMinutes(contentJson: Record<string, unknown>) {
  const words: string[] = [];

  const walk = (node: unknown) => {
    if (!isObject(node)) {
      return;
    }
    if (node.type === "text" && typeof node.text === "string") {
      words.push(...node.text.split(/\s+/).filter(Boolean));
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(walk);
    }
  };

  walk(contentJson);
  return Math.max(1, Math.ceil(words.length / 200));
}
