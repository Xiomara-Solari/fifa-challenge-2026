import {
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  input,
  output,
  viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { PlayerHistoryEntry } from '../../../../shared/models';

export interface TimelineDisplayItem extends PlayerHistoryEntry {
  overallDelta: number | null;
  isCurrent: boolean;
}

@Component({
  selector: 'app-player-timeline',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './player-timeline.component.html',
  styleUrl: './player-timeline.component.scss'
})
export class PlayerTimelineComponent implements OnDestroy {
  history = input<PlayerHistoryEntry[]>([]);
  currentPlayerId = input<number | null>(null);
  playerName = input<string>('');
  isLoading = input<boolean>(false);
  error = input<string | null>(null);

  retry = output<void>();

  private chart: Chart<'line'> | null = null;
  private readonly lineCanvas = viewChild<ElementRef<HTMLCanvasElement>>('lineCanvas');

  readonly timelineItems = computed<TimelineDisplayItem[]>(() => {
    const entries = this.history();
    const activeId = this.currentPlayerId();

    return entries.map((entry, index) => ({
      ...entry,
      overallDelta: index > 0 ? entry.overall - entries[index - 1].overall : null,
      isCurrent: entry.id === activeId
    }));
  });

  readonly peakOverall = computed<number | null>(() => {
    const entries = this.history();
    if (entries.length === 0) return null;
    return Math.max(...entries.map((entry) => entry.overall));
  });

  readonly careerDelta = computed<number | null>(() => {
    const entries = this.history();
    if (entries.length < 2) return null;
    return entries[entries.length - 1].overall - entries[0].overall;
  });

  constructor() {
    effect(() => {
      const canvas = this.lineCanvas()?.nativeElement;
      const entries = this.history();
      const activeId = this.currentPlayerId();

      if (!canvas || entries.length === 0) {
        this.destroyChart();
        return;
      }

      if (!this.chart || this.chart.canvas !== canvas) {
        this.destroyChart();
        this.createChart(canvas);
      }

      this.setChartData(entries, activeId);
    });
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  requestRetry(): void {
    this.retry.emit();
  }

  formatEur(value?: number | null): string {
    if (value == null) return 'N/D';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  }

  formatDelta(delta: number | null): string {
    if (delta === null) return '';
    if (delta > 0) return `+${delta}`;
    return String(delta);
  }

  private createChart(canvas: HTMLCanvasElement): void {
    if (!canvas.getContext('2d')) return;

    this.chart = new Chart<'line'>(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Overall',
            data: [],
            borderColor: '#BF3604',
            backgroundColor: 'rgba(191, 54, 4, 0.16)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: [],
            pointBorderColor: [],
            pointBorderWidth: 2,
            pointRadius: [],
            pointHoverRadius: 7
          },
          {
            label: 'Potencial',
            data: [],
            borderColor: '#F2913D',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            pointBackgroundColor: '#F2913D',
            pointBorderColor: '#730C02',
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: '#730C02', font: { weight: 'bold' } },
            grid: { color: 'rgba(64, 1, 1, 0.08)' }
          },
          y: {
            suggestedMin: 50,
            suggestedMax: 99,
            ticks: { stepSize: 5, color: '#730C02' },
            grid: { color: 'rgba(64, 1, 1, 0.12)' }
          }
        },
        plugins: {
          legend: { labels: { color: '#400101' } }
        }
      }
    });
  }

  private setChartData(entries: PlayerHistoryEntry[], activeId: number | null): void {
    if (!this.chart) return;

    this.chart.data.labels = entries.map((entry) => `FIFA ${entry.fifaVersion}`);

    const overallDataset = this.chart.data.datasets[0];
    overallDataset.data = entries.map((entry) => entry.overall);
    overallDataset.pointBackgroundColor = entries.map((entry) =>
      entry.id === activeId ? '#400101' : '#F2913D'
    );
    overallDataset.pointBorderColor = entries.map((entry) =>
      entry.id === activeId ? '#F2913D' : '#730C02'
    );
    overallDataset.pointRadius = entries.map((entry) => (entry.id === activeId ? 7 : 4));

    const potentialDataset = this.chart.data.datasets[1];
    potentialDataset.data = entries.map((entry) => entry.potential);

    this.chart.update();
  }

  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = null;
  }
}
