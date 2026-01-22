export enum AppView {
  DASHBOARD = 'DASHBOARD',
  WORKOUT = 'WORKOUT',
  STATS = 'STATS'
}

export enum ExerciseState {
  IDLE = 'IDLE',
  GET_READY = 'GET_READY',
  CONTRACT = 'CONTRACT',
  RELAX = 'RELAX',
  PHASE_REST = 'PHASE_REST',
  FINISHED = 'FINISHED'
}

export type PhaseType = 'standard' | 'explosive' | 'endurance' | 'steps_3' | 'steps_5';

export interface ExercisePhase {
  name: string;
  type: PhaseType;
  contractDuration: number; // For steps, this is duration PER STEP
  relaxDuration: number; // seconds
  reps: number;
}

export interface DifficultyLevel {
  id: string;
  name: string;
  description: string;
  color: string;
  phases: ExercisePhase[];
}

export interface WorkoutLog {
  date: string; // ISO date string
  difficultyId: string;
  durationSeconds: number;
  completed: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
