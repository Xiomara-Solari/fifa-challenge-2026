import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { PlayerFormComponent } from './player-form.component';
import { Player } from '../../../../shared/models';

const API_URL = 'http://localhost:3000/players';

const player: Player = {
  id: 7,
  fifaVersion: '23',
  fifaUpdate: '1',
  playerFaceUrl: 'https://cdn.sofifa.net/players/158/023/23_120.png',
  longName: 'Jugador De Prueba',
  playerPositions: 'ST, LW',
  clubName: 'FC Barcelona',
  nationalityName: 'España',
  overall: 85,
  potential: 90,
  valueEur: 1000000,
  wageEur: 50000,
  age: 25,
  heightCm: 180,
  weightKg: 75,
  preferredFoot: 'Left',
  weakFoot: 4,
  skillMoves: 4,
  pace: 80,
  shooting: 85,
  passing: 75,
  dribbling: 82,
  defending: 40,
  physic: 70
};

function createComponent(id?: string): {
  fixture: ComponentFixture<PlayerFormComponent>;
  component: PlayerFormComponent;
  http: HttpTestingController;
} {
  TestBed.configureTestingModule({
    imports: [PlayerFormComponent],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap(id === undefined ? {} : { id })
          }
        }
      }
    ]
  });

  const fixture = TestBed.createComponent(PlayerFormComponent);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, http };
}

function fillRequiredFields(component: PlayerFormComponent): void {
  component.form.patchValue({
    fifaVersion: '23',
    fifaUpdate: '1',
    playerFaceUrl: 'https://cdn.sofifa.net/players/158/023/23_120.png',
    longName: 'Jugador De Prueba',
    playerPositions: 'ST',
    overall: 85,
    potential: 90,
    age: 25
  });
}

describe('PlayerFormComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('inicializa el formulario vacío en modo creación', () => {
    const { component, http } = createComponent();

    expect(component.isEditMode()).toBe(false);
    expect(component.form.controls.longName.value).toBe('');
    expect(component.form.controls.overall.value).toBeNull();
    expect(component.form.valid).toBe(false);
    http.expectNone(() => true);
    http.verify();
  });

  it('detecta el modo edición, carga el jugador y precarga el formulario', () => {
    const { component, http } = createComponent('7');

    expect(component.isEditMode()).toBe(true);
    expect(component.isLoading()).toBe(true);

    const request = http.expectOne(`${API_URL}/7`);
    expect(request.request.method).toBe('GET');
    request.flush(player);

    expect(component.isLoading()).toBe(false);
    expect(component.form.controls.longName.value).toBe(player.longName);
    expect(component.form.controls.overall.value).toBe(player.overall);
    expect(component.form.controls.age.value).toBe(player.age);
    expect(component.form.controls.preferredFoot.value).toBe('Left');
    http.verify();
  });

  it('rechaza un identificador inválido sin consultar la API', () => {
    const { component, http } = createComponent('abc');

    expect(component.isEditMode()).toBe(true);
    expect(component.invalidId()).toBe(true);
    expect(component.playerId()).toBeNull();
    http.expectNone(() => true);
    http.verify();
  });

  it('maneja un jugador inexistente al editar', () => {
    const { component, http } = createComponent('999');

    const request = http.expectOne(`${API_URL}/999`);
    request.flush({ message: 'No encontrado' }, { status: 404, statusText: 'Not Found' });

    expect(component.isLoading()).toBe(false);
    expect(component.loadError()).toContain('no existe');
    http.verify();
  });

  it('valida campos obligatorios y espacios en blanco', () => {
    const { component } = createComponent();

    component.form.controls.longName.setValue('   ');
    component.form.controls.longName.markAsTouched();
    expect(component.errorMessage('longName')).toBe(
      'No puede estar vacío ni contener solo espacios.'
    );

    component.form.controls.longName.setValue('');
    component.form.controls.longName.markAsTouched();
    expect(component.errorMessage('longName')).toBe('Este campo es obligatorio.');

    component.form.controls.overall.setValue(null);
    component.form.controls.overall.markAsTouched();
    expect(component.errorMessage('overall')).toBe('Este campo es obligatorio.');
  });

  it('aplica los límites numéricos y rechaza decimales en campos enteros', () => {
    const { component } = createComponent();

    component.form.controls.overall.setValue(0);
    component.form.controls.overall.markAsTouched();
    expect(component.errorMessage('overall')).toBe('El valor mínimo permitido es 1.');

    component.form.controls.overall.setValue(100);
    expect(component.errorMessage('overall')).toBe('El valor máximo permitido es 99.');

    component.form.controls.overall.setValue(85.5);
    expect(component.errorMessage('overall')).toBe(
      'Debe ser un número entero, sin decimales.'
    );

    component.form.controls.age.setValue(14);
    component.form.controls.age.markAsTouched();
    expect(component.errorMessage('age')).toBe('El valor mínimo permitido es 15.');

    component.form.controls.age.setValue(61);
    expect(component.errorMessage('age')).toBe('El valor máximo permitido es 60.');
  });

  it('envía la creación con los datos del formulario', () => {
    const { fixture, component, http } = createComponent();

    fillRequiredFields(component);
    expect(component.form.valid).toBe(true);

    component.onSubmit();

    const request = http.expectOne(API_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({
      fifaVersion: '23',
      longName: 'Jugador De Prueba',
      overall: 85,
      potential: 90,
      age: 25
    });

    request.flush({ ...player, id: 42 });

    expect(component.successMessage()).toBe('Jugador creado correctamente.');
    expect(component.isSubmitting()).toBe(false);
    http.verify();
    fixture.destroy();
  });

  it('envía la actualización en modo edición', () => {
    const { fixture, component, http } = createComponent('7');

    http.expectOne(`${API_URL}/7`).flush(player);

    component.form.controls.longName.setValue('Nombre Actualizado');
    component.onSubmit();

    const request = http.expectOne(`${API_URL}/7`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toMatchObject({ longName: 'Nombre Actualizado' });

    request.flush({ ...player, longName: 'Nombre Actualizado' });

    expect(component.successMessage()).toBe('Cambios guardados correctamente.');
    http.verify();
    fixture.destroy();
  });

  it('muestra el error de validación del backend y conserva los datos', () => {
    const { component, http } = createComponent();

    fillRequiredFields(component);
    component.onSubmit();

    const request = http.expectOne(API_URL);
    request.flush(
      { message: ['La valoración general debe estar entre 1 y 99'] },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(component.submitError()).toBe('La valoración general debe estar entre 1 y 99');
    expect(component.form.controls.longName.value).toBe('Jugador De Prueba');
    expect(component.isSubmitting()).toBe(false);
    http.verify();
  });

  it('evita envíos duplicados mientras hay una solicitud en curso', () => {
    const { component, http } = createComponent();

    fillRequiredFields(component);
    component.onSubmit();
    component.onSubmit();

    const requests = http.match(API_URL);
    expect(requests.length).toBe(1);

    requests[0].flush({ ...player, id: 42 });
    http.verify();
  });
});
