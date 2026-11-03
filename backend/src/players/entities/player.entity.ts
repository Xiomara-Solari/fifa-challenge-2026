import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'fifa_version', type: 'varchar', length: 255 })
  fifaVersion: string;

  @Column({ name: 'fifa_update', type: 'varchar', length: 255 })
  fifaUpdate: string;

  @Column({ name: 'player_face_url', type: 'varchar', length: 255 })
  playerFaceUrl: string;

  @Column({ name: 'long_name', type: 'varchar', length: 255 })
  longName: string;

  @Column({ name: 'player_positions', type: 'varchar', length: 255 })
  playerPositions: string;

  @Column({ name: 'club_name', type: 'varchar', length: 255, nullable: true })
  clubName: string;

  @Column({ name: 'nationality_name', type: 'varchar', length: 255, nullable: true })
  nationalityName: string;

  @Column({ type: 'int' })
  overall: number;

  @Column({ type: 'int' })
  potential: number;

  @Column({ name: 'value_eur', type: 'int', nullable: true })
  valueEur: number;

  @Column({ name: 'wage_eur', type: 'int', nullable: true })
  wageEur: number;

  @Column({ type: 'int' })
  age: number;

  @Column({ name: 'height_cm', type: 'int', nullable: true })
  heightCm: number;

  @Column({ name: 'weight_kg', type: 'int', nullable: true })
  weightKg: number;

  @Column({ name: 'preferred_foot', type: 'varchar', length: 255, nullable: true })
  preferredFoot: string;

  @Column({ name: 'weak_foot', type: 'int', nullable: true })
  weakFoot: number;

  @Column({ name: 'skill_moves', type: 'int', nullable: true })
  skillMoves: number;

  @Column({ name: 'international_reputation', type: 'int', nullable: true })
  internationalReputation: number;

  @Column({ name: 'work_rate', type: 'varchar', length: 255, nullable: true })
  workRate: string;

  @Column({ name: 'body_type', type: 'varchar', length: 255, nullable: true })
  bodyType: string;

  // Habilidades Core (Radar Chart)
  @Column({ type: 'int', nullable: true })
  pace: number;

  @Column({ type: 'int', nullable: true })
  shooting: number;

  @Column({ type: 'int', nullable: true })
  passing: number;

  @Column({ type: 'int', nullable: true })
  dribbling: number;

  @Column({ type: 'int', nullable: true })
  defending: number;

  @Column({ type: 'int', nullable: true })
  physic: number;

  // Habilidades detalladas
  @Column({ name: 'attacking_crossing', type: 'int', nullable: true })
  attackingCrossing: number;

  @Column({ name: 'attacking_finishing', type: 'int', nullable: true })
  attackingFinishing: number;

  @Column({ name: 'attacking_heading_accuracy', type: 'int', nullable: true })
  attackingHeadingAccuracy: number;

  @Column({ name: 'attacking_short_passing', type: 'int', nullable: true })
  attackingShortPassing: number;

  @Column({ name: 'attacking_volleys', type: 'int', nullable: true })
  attackingVolleys: number;

  @Column({ name: 'skill_dribbling', type: 'int', nullable: true })
  skillDribbling: number;

  @Column({ name: 'skill_curve', type: 'int', nullable: true })
  skillCurve: number;

  @Column({ name: 'skill_fk_accuracy', type: 'int', nullable: true })
  skillFkAccuracy: number;

  @Column({ name: 'skill_long_passing', type: 'int', nullable: true })
  skillLongPassing: number;

  @Column({ name: 'skill_ball_control', type: 'int', nullable: true })
  skillBallControl: number;

  @Column({ name: 'movement_acceleration', type: 'int', nullable: true })
  movementAcceleration: number;

  @Column({ name: 'movement_sprint_speed', type: 'int', nullable: true })
  movementSprintSpeed: number;

  @Column({ name: 'movement_agility', type: 'int', nullable: true })
  movementAgility: number;

  @Column({ name: 'movement_reactions', type: 'int', nullable: true })
  movementReactions: number;

  @Column({ name: 'movement_balance', type: 'int', nullable: true })
  movementBalance: number;

  @Column({ name: 'power_shot_power', type: 'int', nullable: true })
  powerShotPower: number;

  @Column({ name: 'power_jumping', type: 'int', nullable: true })
  powerJumping: number;

  @Column({ name: 'power_stamina', type: 'int', nullable: true })
  powerStamina: number;

  @Column({ name: 'power_strength', type: 'int', nullable: true })
  powerStrength: number;

  @Column({ name: 'power_long_shots', type: 'int', nullable: true })
  powerLongShots: number;

  @Column({ name: 'mentality_aggression', type: 'int', nullable: true })
  mentalityAggression: number;

  @Column({ name: 'mentality_interceptions', type: 'int', nullable: true })
  mentalityInterceptions: number;

  @Column({ name: 'mentality_positioning', type: 'int', nullable: true })
  mentalityPositioning: number;

  @Column({ name: 'mentality_vision', type: 'int', nullable: true })
  mentalityVision: number;

  @Column({ name: 'mentality_penalties', type: 'int', nullable: true })
  mentalityPenalties: number;

  @Column({ name: 'mentality_composure', type: 'int', nullable: true })
  mentalityComposure: number;

  @Column({ name: 'defending_marking', type: 'int', nullable: true })
  defendingMarking: number;

  @Column({ name: 'defending_standing_tackle', type: 'int', nullable: true })
  defendingStandingTackle: number;

  @Column({ name: 'defending_sliding_tackle', type: 'int', nullable: true })
  defendingSlidingTackle: number;

  @Column({ name: 'goalkeeping_diving', type: 'int', nullable: true })
  goalkeepingDiving: number;

  @Column({ name: 'goalkeeping_handling', type: 'int', nullable: true })
  goalkeepingHandling: number;

  @Column({ name: 'goalkeeping_kicking', type: 'int', nullable: true })
  goalkeepingKicking: number;

  @Column({ name: 'goalkeeping_positioning', type: 'int', nullable: true })
  goalkeepingPositioning: number;

  @Column({ name: 'goalkeeping_reflexes', type: 'int', nullable: true })
  goalkeepingReflexes: number;

  @Column({ name: 'goalkeeping_speed', type: 'int', nullable: true })
  goalkeepingSpeed: number;

  @Column({ name: 'player_traits', type: 'varchar', length: 255, nullable: true })
  playerTraits: string;
}