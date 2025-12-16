export interface PromptResult {
  text: string;
  timestamp: number;
}

export interface AppState {
  file: File | null;
  isLoading: boolean;
  result: PromptResult | null;
  error: string | null;
}