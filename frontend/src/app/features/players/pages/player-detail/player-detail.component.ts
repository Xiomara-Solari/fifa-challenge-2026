import {
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { EMPTY, catchError, filter, map, merge, switchMap, tap } from 'rxjs';
import {
  Player,
  PlayerHistoryResponse,
  PlayerNarrativeResponse
} from '../../../../shared/models';
import { PlayersService } from '../../../../core/services/players.service';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';
import { PlayerTimelineComponent } from '../../components/player-timeline/player-timeline.component';

const RADAR_METRICS = ['Ritmo', 'Tiro', 'Pase', 'Regate', 'Defensa', 'Físico'];

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [MarkdownPipe, PlayerTimelineComponent, RouterLink],
  templateUrl: './player-detail.component.html',
  styleUrl: './player-detail.component.scss'
})
export class PlayerDetailComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private playersService = inject(PlayersService);
  private destroyRef = inject(DestroyRef);

  player = signal<Player | null>(null);
  narrative = signal<PlayerNarrativeResponse | null>(null);
  history = signal<PlayerHistoryResponse | null>(null);
  isLoadingPlayer = signal(false);
  isLoadingNarrative = signal(false);
  isLoadingHistory = signal(false);
  playerError = signal<string | null>(null);
  narrativeError = signal<string | null>(null);
  historyError = signal<string | null>(null);

  private chart: Chart | null = null;
  private activeRouteId: number | null = null;
  private readonly radarCanvas = viewChild<ElementRef<HTMLCanvasElement>>('radarCanvas');

  constructor() {
    effect(() => {
      const canvas = this.radarCanvas()?.nativeElement;
      const player = this.player();
      if (!canvas || !player) {
        this.destroyChart();
        return;
      }

      if (!this.chart || this.chart.canvas !== canvas) {
        this.destroyChart();
        this.createChart(canvas);
      }
      this.setChartData(player);
    });

    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        tap((id) => {
          this.activeRouteId = Number.isInteger(id) && id > 0 ? id : null;
          this.resetRouteState();
          if (this.activeRouteId === null) {
            this.playerError.set('El identificador del jugador no es válido.');
          }
        }),
        filter((id) => Number.isInteger(id) && id > 0),
        switchMap((id) => {
          this.isLoadingPlayer.set(true);
          this.isLoadingHistory.set(true);

          const player$ = this.playersService.getPlayer(id).pipe(
            tap((player) => {
              this.player.set(player);
              this.isLoadingPlayer.set(false);
            }),
            catchError(() => {
              this.playerError.set('No se pudo cargar la información del jugador.');
              this.isLoadingPlayer.set(false);
              return EMPTY;
            })
          );

          const history$ = this.playersService.getHistory(id).pipe(
            tap((history) => {
              this.history.set(history);
              this.isLoadingHistory.set(false);
            }),
            catchError(() => {
              this.historyError.set('No se pudo cargar la evolución histórica.');
              this.isLoadingHistory.set(false);
              return EMPTY;
            })
          );

          return merge(player$, history$);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  generateNarrative(): void {
    const id = this.player()?.id;
    if (!id || this.isLoadingNarrative()) return;
    this.loadNarrative(id);
  }

  retryHistory(): void {
    const id = this.player()?.id;
    if (!id || this.isLoadingHistory()) return;
    this.loadHistory(id);
  }

  formatEur(value?: number | null): string {
    if (value == null) return 'N/D';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase();
  }

  private resetRouteState(): void {
    this.player.set(null);
    this.narrative.set(null);
    this.history.set(null);
    this.isLoadingPlayer.set(false);
    this.isLoadingNarrative.set(false);
    this.isLoadingHistory.set(false);
    this.playerError.set(null);
    this.narrativeError.set(null);
    this.historyError.set(null);
  }

  private loadHistory(id: number): void {
    this.isLoadingHistory.set(true);
    this.historyError.set(null);

    this.playersService
      .getHistory(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (this.activeRouteId !== id) return;
          this.history.set(response);
          this.isLoadingHistory.set(false);
        },
        error: () => {
          if (this.activeRouteId !== id) return;
          this.historyError.set('No se pudo cargar la evolución histórica.');
          this.isLoadingHistory.set(false);
        }
      });
  }

  private loadNarrative(id: number): void {
    this.isLoadingNarrative.set(true);
    this.narrativeError.set(null);

    this.playersService
      .getNarrative(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (this.activeRouteId !== id) return;
          this.narrative.set(response);
          this.isLoadingNarrative.set(false);
        },
        error: () => {
          if (this.activeRouteId !== id) return;
          this.narrativeError.set('No se pudo generar el análisis de IA.');
          this.isLoadingNarrative.set(false);
        }
      });
  }

  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private createChart(canvas: HTMLCanvasElement): void {
    if (!canvas.getContext('2d')) return;

    this.chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: RADAR_METRICS,
        datasets: [
          {
            label: 'Métricas',
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(191, 54, 4, 0.35)',
            borderColor: '#BF3604',
            borderWidth: 2,
            pointBackgroundColor: '#F2913D',
            pointBorderColor: '#730C02',
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              backdropColor: 'transparent',
              color: '#730C02'
            },
            grid: { color: 'rgba(64, 1, 1, 0.2)' },
            angleLines: { color: 'rgba(64, 1, 1, 0.2)' },
            pointLabels: {
              color: '#2c1e16',
              font: { size: 13, weight: 'bold' }
            }
          }
        },
        plugins: {
          legend: { labels: { color: '#400101' } }
        }
      }
    });
  }

  private setChartData(player: Player): void {
    if (!this.chart) return;
    const dataset = this.chart.data.datasets[0];
    dataset.label = `${player.longName} (FIFA ${player.fifaVersion})`;
    dataset.data = [
      player.pace ?? 0,
      player.shooting ?? 0,
      player.passing ?? 0,
      player.dribbling ?? 0,
      player.defending ?? 0,
      player.physic ?? 0
    ];
    this.chart.update();
  }
}
