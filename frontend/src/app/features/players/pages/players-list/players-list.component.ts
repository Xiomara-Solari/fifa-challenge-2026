import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PaginationMeta, Player, PlayerFilterParams } from '../../../../shared/models';
import { PlayersService } from '../../../../core/services/players.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-players-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './players-list.component.html',
  styleUrl: './players-list.component.scss'
})
export class PlayersListComponent {
  private fb = inject(FormBuilder);
  private playersService = inject(PlayersService);
  private destroyRef = inject(DestroyRef);

  players = signal<Player[]>([]);
  meta = signal<PaginationMeta | null>(null);
  currentPage = signal(1);
  isLoading = signal(false);
  isExporting = signal(false);
  errorMessage = signal<string | null>(null);

  readonly hasPrevious = computed(() => (this.meta()?.page ?? 1) > 1);
  readonly hasNext = computed(() => (this.meta()?.page ?? 1) < (this.meta()?.totalPages ?? 1));

  filterForm = this.fb.nonNullable.group({
    name: [''],
    club: [''],
    position: [''],
    fifaVersion: ['']
  });

  constructor() {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadPlayers();
      });

    this.loadPlayers();
  }

  onFilterSubmit(): void {
    this.currentPage.set(1);
    this.loadPlayers();
  }

  goToPreviousPage(): void {
    if (!this.hasPrevious()) return;
    this.currentPage.update((page) => page - 1);
    this.loadPlayers();
  }

  goToNextPage(): void {
    if (!this.hasNext()) return;
    this.currentPage.update((page) => page + 1);
    this.loadPlayers();
  }

  exportCsv(): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);

    this.playersService.exportCsv(this.currentFilters()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'players.csv';
        link.click();
        URL.revokeObjectURL(url);
        this.isExporting.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo exportar el archivo CSV.');
        this.isExporting.set(false);
      }
    });
  }

  private currentFilters(): PlayerFilterParams {
    const { name, club, position, fifaVersion } = this.filterForm.getRawValue();
    return {
      page: this.currentPage(),
      limit: PAGE_SIZE,
      name: name || undefined,
      club: club || undefined,
      position: position || undefined,
      fifaVersion: fifaVersion || undefined
    };
  }

  private loadPlayers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.playersService.getPlayers(this.currentFilters()).subscribe({
      next: (response) => {
        this.players.set(response.data);
        this.meta.set(response.meta);
        this.isLoading.set(false);
      },
      error: () => {
        this.players.set([]);
        this.meta.set(null);
        this.errorMessage.set('No se pudo cargar el listado de jugadores.');
        this.isLoading.set(false);
      }
    });
  }
}
