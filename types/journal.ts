export interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  location?: string;
  category: string;
  isProtected?: boolean;
  media: Array<{
    _id: string;
    type: 'image' | 'audio' | 'video';
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  moodLabel: string;
  emoji: string;
  value: number;
}

export interface MoodOption {
  emoji: string;
  label: string;
  value: number;
  color: string;
  mood: string;
}
