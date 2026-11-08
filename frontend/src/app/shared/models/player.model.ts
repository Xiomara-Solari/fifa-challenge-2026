
export interface Player {
  id: number;
  fifaVersion: string;
  fifaUpdate: string;
  playerFaceUrl: string;
  longName: string;
  playerPositions: string;
  clubName?: string;
  nationalityName?: string;
  overall: number;
  potential: number;
  valueEur?: number;
  wageEur?: number;
  age: number;
  heightCm?: number;
  weightKg?: number;
  preferredFoot?: string;
  weakFoot?: number;
  skillMoves?: number;
  
  
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physic?: number;
}


export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlayersResponse {
  data: Player[];
  meta: PaginationMeta;
}


export interface PlayerFilterParams {
  page?: number;
  limit?: number;
  name?: string;
  club?: string;
  position?: string;
  fifaVersion?: string;
}

export interface PlayerNarrativeResponse {
  playerId: number;
  playerName: string;
  totalEditionsTracked: number;
  narrative: string;
}


export type CreatePlayerPayload = Omit<Player, 'id'>;

export type UpdatePlayerPayload = Partial<CreatePlayerPayload>;