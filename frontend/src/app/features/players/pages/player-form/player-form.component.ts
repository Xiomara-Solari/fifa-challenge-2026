import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreatePlayerPayload, Player } from '../../../../shared/models';
import { PlayersService } from '../../../../core/services/players.service';
import {
  httpUrl,
  integerRange,
  notBlank,
  optionalNotBlank
} from '../../../../shared/validators/player-form.validators';

const TEXT_MAX_LENGTH = 255;
const INT_COLUMN_MAX = 2147483647;
const REDIRECT_DELAY_MS = 1000;

type PlayerFormControls = {
  fifaVersion: FormControl<string>;
  fifaUpdate: FormControl<string>;
  playerFaceUrl: FormControl<string>;
  longName: FormControl<string>;
  playerPositions: FormControl<string>;
  clubName: FormControl<string>;
  nationalityName: FormControl<string>;
  overall: FormControl<number | null>;
  potential: FormControl<number | null>;
  valueEur: FormControl<number | null>;
  wageEur: FormControl<number | null>;
  age: FormControl<number | null>;
  heightCm: FormControl<number | null>;
  weightKg: FormControl<number | null>;
  preferredFoot: FormControl<string>;
  weakFoot: FormControl<number | null>;
  skillMoves: FormControl<number | null>;
  pace: FormControl<number | null>;
  shooting: FormControl<number | null>;
  passing: FormControl<number | null>;
  dribbling: FormControl<number | null>;
  defending: FormControl<number | null>;
  physic: FormControl<number | null>;
};

type PlayerFormGroup = FormGroup<PlayerFormControls>;

type PlayerFormValue = {
  [K in keyof PlayerFormControls]: PlayerFormControls[K] extends FormControl<infer V>
    ? V
    : never;
};

@Component({
  selector: 'app-player-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './player-form.component.html',
  styleUrl: './player-form.component.scss'
})
export class PlayerFormComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private playersService = inject(PlayersService);
  private destroyRef = inject(DestroyRef);

  readonly isEditMode = signal(false);
  readonly playerId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly invalidId = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly submitted = signal(false);

  readonly title = computed(() => (this.isEditMode() ? 'Editar jugador' : 'Crear jugador'));
  readonly submitLabel = computed(() =>
    this.isSubmitting()
      ? 'Guardando...'
      : this.isEditMode()
        ? 'Guardar cambios'
        : 'Crear jugador'
  );

  readonly form: PlayerFormGroup = this.fb.group({
    fifaVersion: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(TEXT_MAX_LENGTH),
      notBlank()
    ]),
    fifaUpdate: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(TEXT_MAX_LENGTH),
      notBlank()
    ]),
    playerFaceUrl: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(TEXT_MAX_LENGTH),
      httpUrl()
    ]),
    longName: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(TEXT_MAX_LENGTH),
      notBlank()
    ]),
    playerPositions: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(TEXT_MAX_LENGTH),
      notBlank()
    ]),
    clubName: this.fb.nonNullable.control('', [
      Validators.maxLength(TEXT_MAX_LENGTH),
      optionalNotBlank()
    ]),
    nationalityName: this.fb.nonNullable.control('', [
      Validators.maxLength(TEXT_MAX_LENGTH),
      optionalNotBlank()
    ]),
    overall: this.fb.control<number | null>(null, [Validators.required, integerRange(1, 99)]),
    potential: this.fb.control<number | null>(null, [Validators.required, integerRange(1, 99)]),
    valueEur: this.fb.control<number | null>(null, [integerRange(0, INT_COLUMN_MAX)]),
    wageEur: this.fb.control<number | null>(null, [integerRange(0, INT_COLUMN_MAX)]),
    age: this.fb.control<number | null>(null, [Validators.required, integerRange(15, 60)]),
    heightCm: this.fb.control<number | null>(null, [integerRange(100, 250)]),
    weightKg: this.fb.control<number | null>(null, [integerRange(30, 150)]),
    preferredFoot: this.fb.nonNullable.control(''),
    weakFoot: this.fb.control<number | null>(null, [integerRange(1, 5)]),
    skillMoves: this.fb.control<number | null>(null, [integerRange(1, 5)]),
    pace: this.fb.control<number | null>(null, [integerRange(0, 99)]),
    shooting: this.fb.control<number | null>(null, [integerRange(0, 99)]),
    passing: this.fb.control<number | null>(null, [integerRange(0, 99)]),
    dribbling: this.fb.control<number | null>(null, [integerRange(0, 99)]),
    defending: this.fb.control<number | null>(null, [integerRange(0, 99)]),
    physic: this.fb.control<number | null>(null, [integerRange(0, 99)])
  });

  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.redirectTimer !== null) {
        clearTimeout(this.redirectTimer);
        this.redirectTimer = null;
      }
    });

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam === null) {
      return;
    }

    this.isEditMode.set(true);
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      this.invalidId.set(true);
      return;
    }

    this.playerId.set(id);
    this.loadPlayer(id);
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.submitError.set(null);
    this.successMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isSubmitting() || this.successMessage() !== null) {
      return;
    }

    this.isSubmitting.set(true);

    const payload = this.buildPayload();
    const id = this.playerId();
    const request$ =
      id !== null
        ? this.playersService.updatePlayer(id, payload)
        : this.playersService.createPlayer(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (player) => {
        this.isSubmitting.set(false);
        this.successMessage.set(
          id !== null
            ? 'Cambios guardados correctamente.'
            : 'Jugador creado correctamente.'
        );
        this.scheduleRedirect(player.id);
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.submitError.set(this.resolveSubmitError(error));
      }
    });
  }

  onCancel(): void {
    const id = this.playerId();

    if (id !== null) {
      void this.router.navigate(['/players', id]);
      return;
    }

    void this.router.navigate(['/players']);
  }

  reload(): void {
    const id = this.playerId();

    if (id === null) {
      return;
    }

    this.loadPlayer(id);
  }

  hasError(controlName: string): boolean {
    const control = this.form.get(controlName);

    if (!control) {
      return false;
    }

    return control.invalid && (control.touched || this.submitted());
  }

  errorMessage(controlName: string): string | null {
    const control = this.form.get(controlName);

    if (!control || !control.errors || !(control.touched || this.submitted())) {
      return null;
    }

    const errors = control.errors;

    if (errors['required']) {
      return 'Este campo es obligatorio.';
    }

    if (errors['notBlank']) {
      return 'No puede estar vacío ni contener solo espacios.';
    }

    if (errors['maxlength']) {
      const maxLengthError = errors['maxlength'] as { requiredLength?: number };
      return `No puede superar los ${maxLengthError.requiredLength ?? TEXT_MAX_LENGTH} caracteres.`;
    }

    if (errors['url']) {
      return 'Introduce una URL válida que empiece por http:// o https://.';
    }

    if (errors['notANumber']) {
      return 'Introduce un número válido.';
    }

    if (errors['integer']) {
      return 'Debe ser un número entero, sin decimales.';
    }

    if (errors['min']) {
      const minError = errors['min'] as { min?: number };
      return `El valor mínimo permitido es ${minError.min}.`;
    }

    if (errors['max']) {
      const maxError = errors['max'] as { max?: number };
      return `El valor máximo permitido es ${maxError.max}.`;
    }

    return 'Valor no válido.';
  }

  private loadPlayer(id: number): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.playersService
      .getPlayer(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (player) => {
          this.form.patchValue(this.toFormValue(player));
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.loadError.set(this.resolveLoadError(error));
        }
      });
  }

  private toFormValue(player: Player): PlayerFormValue {
    return {
      fifaVersion: player.fifaVersion ?? '',
      fifaUpdate: player.fifaUpdate ?? '',
      playerFaceUrl: player.playerFaceUrl ?? '',
      longName: player.longName ?? '',
      playerPositions: player.playerPositions ?? '',
      clubName: player.clubName ?? '',
      nationalityName: player.nationalityName ?? '',
      overall: player.overall ?? null,
      potential: player.potential ?? null,
      valueEur: player.valueEur ?? null,
      wageEur: player.wageEur ?? null,
      age: player.age ?? null,
      heightCm: player.heightCm ?? null,
      weightKg: player.weightKg ?? null,
      preferredFoot: player.preferredFoot ?? '',
      weakFoot: player.weakFoot ?? null,
      skillMoves: player.skillMoves ?? null,
      pace: player.pace ?? null,
      shooting: player.shooting ?? null,
      passing: player.passing ?? null,
      dribbling: player.dribbling ?? null,
      defending: player.defending ?? null,
      physic: player.physic ?? null
    };
  }

  private buildPayload(): CreatePlayerPayload {
    const raw = this.form.getRawValue();
    const payload: CreatePlayerPayload = {
      fifaVersion: raw.fifaVersion.trim(),
      fifaUpdate: raw.fifaUpdate.trim(),
      playerFaceUrl: raw.playerFaceUrl.trim(),
      longName: raw.longName.trim(),
      playerPositions: raw.playerPositions.trim(),
      overall: this.requiredNumber(raw.overall),
      potential: this.requiredNumber(raw.potential),
      age: this.requiredNumber(raw.age)
    };

    const clubName = raw.clubName.trim();
    if (clubName.length > 0) {
      payload.clubName = clubName;
    }

    const nationalityName = raw.nationalityName.trim();
    if (nationalityName.length > 0) {
      payload.nationalityName = nationalityName;
    }

    if (raw.valueEur !== null) {
      payload.valueEur = raw.valueEur;
    }

    if (raw.wageEur !== null) {
      payload.wageEur = raw.wageEur;
    }

    if (raw.heightCm !== null) {
      payload.heightCm = raw.heightCm;
    }

    if (raw.weightKg !== null) {
      payload.weightKg = raw.weightKg;
    }

    if (raw.preferredFoot.length > 0) {
      payload.preferredFoot = raw.preferredFoot;
    }

    if (raw.weakFoot !== null) {
      payload.weakFoot = raw.weakFoot;
    }

    if (raw.skillMoves !== null) {
      payload.skillMoves = raw.skillMoves;
    }

    if (raw.pace !== null) {
      payload.pace = raw.pace;
    }

    if (raw.shooting !== null) {
      payload.shooting = raw.shooting;
    }

    if (raw.passing !== null) {
      payload.passing = raw.passing;
    }

    if (raw.dribbling !== null) {
      payload.dribbling = raw.dribbling;
    }

    if (raw.defending !== null) {
      payload.defending = raw.defending;
    }

    if (raw.physic !== null) {
      payload.physic = raw.physic;
    }

    return payload;
  }

  private requiredNumber(value: number | null): number {
    if (value === null) {
      throw new Error('Se esperaba un valor numérico obligatorio');
    }

    return value;
  }

  private scheduleRedirect(playerId: number): void {
    const target = playerId > 0 ? ['/players', playerId] : ['/players'];

    this.redirectTimer = setTimeout(() => {
      this.redirectTimer = null;
      void this.router.navigate(target);
    }, REDIRECT_DELAY_MS);
  }

  private resolveLoadError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        return 'El jugador solicitado no existe o fue eliminado.';
      }

      if (error.status === 0) {
        return 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
      }
    }

    return 'No se pudo cargar la información del jugador.';
  }

  private resolveSubmitError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
      }

      if (error.status === 404) {
        return 'El jugador que intentas editar no existe o fue eliminado.';
      }

      if (error.status === 401 || error.status === 403) {
        return 'No tienes permisos para realizar esta operación.';
      }

      if (error.status === 400) {
        return this.extractValidationMessage(error);
      }
    }

    return 'No se pudo guardar el jugador. Inténtalo de nuevo.';
  }

  private extractValidationMessage(error: HttpErrorResponse): string {
    const body: unknown = error.error;

    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = (body as { message?: unknown }).message;

      if (Array.isArray(message)) {
        const messages = message.filter((item): item is string => typeof item === 'string');

        if (messages.length > 0) {
          return messages.join(' ');
        }
      }

      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }

    return 'Los datos enviados no son válidos. Revisa el formulario.';
  }
}
