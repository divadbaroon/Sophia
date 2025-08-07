// Helper function to extract method ID from title
export const extractMethodIdFromTitle = (title: string): string | null => {
  const match = title.match(/(?:\d+\.\)\s+)?([a-zA-Z_]+)\(\)/);
  return match ? match[1] : null;
};
