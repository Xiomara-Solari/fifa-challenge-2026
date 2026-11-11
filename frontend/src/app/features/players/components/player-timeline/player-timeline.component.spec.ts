import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PlayerHistoryEntry } from '../../../../shared/models';
import { PlayerTimelineComponent } from './player-timeline.component';

const mockHistory: PlayerHistoryEntry[] = [
  {
    id: 10,
    fifaVersion: '21',
    fifaUpdate: '1',
    longName: 'Lionel Andrés Messi',
    playerPositions: 'RW, ST, CF',
    clubName: 'FC Barcelona',
    age: 33,
    overall: 93,
    potential: 93,
    valueEur: 103500000,
    pace: 85,
    shooting: 92,
    passing: 91,
    dribbling: 95,
    defending: 38,
    physic: 65
  },
  {
    id: 11,
    fifaVersion: '22',
    fifaUpdate: '1',
    longName: 'Lionel Andrés Messi',
    playerPositions: 'RW, ST, CF',
    clubName: 'Paris Saint-Germain',
    age: 34,
    overall: 93,
    potential: 93,
    valueEur: 78000000,
    pace: 85,
    shooting: 92,
    passing: 91,
    dribbling: 95,
    defending: 34,
    physic: 65
  },
  {
    id: 12,
    fifaVersion: '23',
    fifaUpdate: '1',
    longName: 'Lionel Andrés Messi',
    playerPositions: 'RW, CF',
    clubName: 'Paris Saint-Germain',
    age: 35,
    overall: 91,
    potential: 91,
    valueEur: 54000000,
    pace: 81,
    shooting: 89,
    passing: 90,
    dribbling: 94,
    defending: 34,
    physic: 64
  }
];

describe('PlayerTimelineComponent', () => {
  let fixture: ComponentFixture<PlayerTimelineComponent>;
  let component: PlayerTimelineComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerTimelineComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerTimelineComponent);
    component = fixture.componentInstance;
  });

  it('muestra el estado de carga cuando isLoading es true', () => {
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Cargando evolución histórica...');
  });

  it('muestra el mensaje de error y emite retry al pulsar Reintentar', () => {
    const retrySpy = vi.fn();
    component.retry.subscribe(retrySpy);

    fixture.componentRef.setInput('error', 'No se pudo cargar la evolución histórica.');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.alert-error')?.textContent).toContain(
      'No se pudo cargar la evolución histórica.'
    );

    const retryBtn = el.querySelector('.btn-retry') as HTMLButtonElement;
    retryBtn.click();

    expect(retrySpy).toHaveBeenCalledTimes(1);
  });

  it('muestra estado vacío cuando no existen registros históricos', () => {
    fixture.componentRef.setInput('history', []);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No hay registros históricos disponibles para este jugador.');
  });

  it('renderiza ediciones, deltas, resumen y enlaces destacando la edición actual', () => {
    fixture.componentRef.setInput('history', mockHistory);
    fixture.componentRef.setInput('currentPlayerId', 12);
    fixture.componentRef.setInput('playerName', 'Lionel Andrés Messi');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.timeline-item');

    expect(items.length).toBe(3);
    expect(el.querySelector('.pill-peak')?.textContent).toContain('Pico: 93 OVR');
    expect(el.textContent).toContain('Progreso: -2 OVR');
    expect(items[2].classList.contains('is-current')).toBe(true);
    expect(items[2].querySelector('.current-tag')?.textContent?.trim()).toBe('Edición actual');
    expect(items[0].querySelector('a.entry-link')?.getAttribute('href')).toBe('/players/10');
    expect(component.timelineItems()[2].overallDelta).toBe(-2);
    expect(el.querySelector('canvas.history-canvas')).not.toBeNull();
  });
});
