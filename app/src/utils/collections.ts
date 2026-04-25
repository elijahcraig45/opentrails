// Collection tagging utility
// Classifies trails into collections based on name and properties

export interface TrailCollections {
  waterfalls: boolean;
  peaks: boolean;
  lakes: boolean;
  family: boolean;
}

export function getTrailCollections(
  name: string,
  difficulty?: string,
  elevationGain?: number,
  length?: number
): TrailCollections {
  const lowerName = name.toLowerCase();

  return {
    waterfalls: lowerName.includes('fall') || lowerName.includes('cascade'),
    peaks: lowerName.includes('peak') || lowerName.includes('summit') || lowerName.includes('mount'),
    lakes: lowerName.includes('lake') || lowerName.includes('pond') || lowerName.includes('basin'),
    family: 
      (difficulty === 'Easy' || difficulty === 'easy') &&
      (length === undefined || length < 3) && // Less than 3 km
      (elevationGain === undefined || elevationGain < 300), // Less than 300m elevation
  };
}

export function getCollectionName(collection: string): string {
  const names: Record<string, string> = {
    waterfalls: 'Waterfalls',
    peaks: 'Mountain Peaks',
    lakes: 'Lakes',
    family: 'Family Hikes',
  };
  return names[collection] || collection;
}

export function getCollectionEmoji(collection: string): string {
  const emojis: Record<string, string> = {
    waterfalls: '💧',
    peaks: '⛰️',
    lakes: '🏞️',
    family: '👨‍👩‍👧‍👦',
  };
  return emojis[collection] || '🥾';
}
