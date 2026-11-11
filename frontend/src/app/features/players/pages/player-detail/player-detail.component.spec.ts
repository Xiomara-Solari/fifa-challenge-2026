import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  Player,
  PlayerHistoryResponse,
  PlayerNarrativeResponse
} from '../../../../shared/models';
import { PlayerDetailComponent } from './player-detail.component';

const API_URL = 'http://localhost:3000/players';

const mockPlayer: Player = {
  id: 1,
  fifaVersion: '23',
  fifaUpdate: '1',
  playerFaceUrl: 'https://cdn.sofifa.net/players/158/023/23_120.png',
  longName: 'Lionel Andrés Messi',
  playerPositions: 'RW, CF',
  clubName: 'Paris Saint-Germain',
  nationalityName: 'Argentina',
  overall: 91,
  potential: 91,
  valueEur: 54000000,
  wageEur: 195000,
  age: 35,
  heightCm: 169,
  weightKg: 67,
  preferredFoot: 'Left',
  weakFoot: 4,
  skillMoves: 4,
  pace: 81,
  shooting: 89,
  passing: 90,
  dribbling: 94,
  defending: 34,
  physic: 64
};

const mockSecondPlayer: Player = {
  ...mockPlayer,
  id: 2,
  fifaVersion: '21',
  clubName: 'FC Barcelona',
  overall: 93,
  potential: 93,
  age: 33
};

function createHistoryResponse(player: Player): PlayerHistoryResponse {
  return {
    playerId: player.id,
    playerName: player.longName,
    totalEditionsTracked: 2,
    history: [
      {
        id: 2,
        fifaVersion: '21',
        fifaUpdate: '1',
        longName: player.longName,
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
        id: 1,
        fifaVersion: '23',
        fifaUpdate: '1',
        longName: player.longName,
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
    ]
  };
}

function createComponent(id = '1'): {
  fixture: ComponentFixture<PlayerDetailComponent>;
  component: PlayerDetailComponent;
  http: HttpTestingController;
  paramMap$: BehaviorSubject<ParamMap>;
} {
  const paramMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({ id }));

  TestBed.configureTestingModule({
    imports: [PlayerDetailComponent],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: paramMap$.asObservable()
        }
      }
    ]
  });

  const fixture = TestBed.createComponent(PlayerDetailComponent);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, http, paramMap$ };
}

describe('PlayerDetailComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('carga ficha e historial al inicio sin invocar la IA automáticamente', () => {
    const { fixture, component, http } = createComponent('1');

    const playerReq = http.expectOne(`${API_URL}/1`);
    expect(playerReq.request.method).toBe('GET');
    playerReq.flush(mockPlayer);

    const historyReq = http.expectOne(`${API_URL}/1/history`);
    expect(historyReq.request.method).toBe('GET');
    historyReq.flush(createHistoryResponse(mockPlayer));

    http.expectNone(`${API_URL}/1/narrative`);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('.narrative-card .btn-narrative') as HTMLButtonElement | null;

    expect(component.player()?.longName).toBe(mockPlayer.longName);
    expect(component.narrative()).toBeNull();
    expect(button?.textContent?.trim()).toBe('Generar análisis con IA');
    expect(el.querySelectorAll('app-player-timeline .timeline-item').length).toBe(2);
    http.verify();
  });

  it('solicita y renderiza el análisis Markdown al pulsar el botón bajo demanda', () => {
    const { fixture, component, http } = createComponent('1');

    http.expectOne(`${API_URL}/1`).flush(mockPlayer);
    http.expectOne(`${API_URL}/1/history`).flush(createHistoryResponse(mockPlayer));
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '.narrative-card .btn-narrative'
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(component.isLoadingNarrative()).toBe(true);

    const narrativeReq = http.expectOne(`${API_URL}/1/narrative`);
    expect(narrativeReq.request.method).toBe('GET');

    const response: PlayerNarrativeResponse = {
      playerId: 1,
      playerName: mockPlayer.longName,
      totalEditionsTracked: 9,
      narrative:
        '### Etapa de consagración\n\nDestacó con **94 en regate**.<script>alert(1)</script>\n\n- Visión de élite\n- Precisión clínica'
    };
    narrativeReq.flush(response);
    fixture.detectChanges();

    const contentEl = (fixture.nativeElement as HTMLElement).querySelector('.narrative-content');

    expect(component.isLoadingNarrative()).toBe(false);
    expect(contentEl?.querySelector('h3')?.textContent).toBe('Etapa de consagración');
    expect(contentEl?.querySelector('strong')?.textContent).toBe('94 en regate');
    expect(contentEl?.querySelectorAll('li').length).toBe(2);
    expect(contentEl?.innerHTML).not.toContain('<script');
    http.verify();
  });

  it('muestra error y permite reintentar si falla la generación de IA', () => {
    const { fixture, component, http } = createComponent('1');

    http.expectOne(`${API_URL}/1`).flush(mockPlayer);
    http.expectOne(`${API_URL}/1/history`).flush(createHistoryResponse(mockPlayer));
    fixture.detectChanges();

    component.generateNarrative();
    http
      .expectOne(`${API_URL}/1/narrative`)
      .flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.narrativeError()).toBe('No se pudo generar el análisis de IA.');
    const retryBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.narrative-card .btn-narrative'
    ) as HTMLButtonElement | null;
    expect(retryBtn?.textContent?.trim()).toBe('Reintentar');
    http.verify();
  });

  it('permite reintentar el historial si falla sin afectar la ficha del jugador', () => {
    const { fixture, component, http } = createComponent('1');

    http.expectOne(`${API_URL}/1`).flush(mockPlayer);
    http
      .expectOne(`${API_URL}/1/history`)
      .flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.player()?.id).toBe(1);
    expect(component.historyError()).toBe('No se pudo cargar la evolución histórica.');

    const retryBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'app-player-timeline .btn-retry'
    ) as HTMLButtonElement;
    retryBtn.click();
    fixture.detectChanges();

    http.expectOne(`${API_URL}/1/history`).flush(createHistoryResponse(mockPlayer));
    fixture.detectChanges();

    expect(component.historyError()).toBeNull();
    expect(component.history()?.totalEditionsTracked).toBe(2);
    http.verify();
  });

  it('recarga ficha e historial al navegar a otra edición desde paramMap', () => {
    const { fixture, component, http, paramMap$ } = createComponent('1');

    http.expectOne(`${API_URL}/1`).flush(mockPlayer);
    http.expectOne(`${API_URL}/1/history`).flush(createHistoryResponse(mockPlayer));
    fixture.detectChanges();

    paramMap$.next(convertToParamMap({ id: '2' }));
    fixture.detectChanges();

    http.expectOne(`${API_URL}/2`).flush(mockSecondPlayer);
    http.expectOne(`${API_URL}/2/history`).flush(createHistoryResponse(mockSecondPlayer));
    fixture.detectChanges();

    expect(component.player()?.id).toBe(2);
    expect(component.player()?.fifaVersion).toBe('21');
    expect(component.narrative()).toBeNull();
    http.verify();
  });

  it('rechaza un identificador inválido sin consultar la API', () => {
    const { component, http } = createComponent('abc');

    expect(component.playerError()).toBe('El identificador del jugador no es válido.');
    http.expectNone(() => true);
    http.verify();
  });
});
