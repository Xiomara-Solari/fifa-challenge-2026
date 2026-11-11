import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreatePlayerPayload,
  Player,
  PlayerFilterParams,
  PlayerHistoryResponse,
  PlayerNarrativeResponse,
  PlayersResponse,
  UpdatePlayerPayload
} from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlayersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/players`;

  getPlayers(filters: PlayerFilterParams): Observable<PlayersResponse> {
    return this.http.get<PlayersResponse>(this.apiUrl, {
      params: this.buildParams(filters)
    });
  }

  getPlayer(id: number): Observable<Player> {
    return this.http.get<Player>(`${this.apiUrl}/${id}`);
  }

  createPlayer(payload: CreatePlayerPayload): Observable<Player> {
    return this.http.post<Player>(this.apiUrl, payload);
  }

  updatePlayer(id: number, payload: UpdatePlayerPayload): Observable<Player> {
    return this.http.patch<Player>(`${this.apiUrl}/${id}`, payload);
  }

  getNarrative(id: number): Observable<PlayerNarrativeResponse> {
    return this.http.get<PlayerNarrativeResponse>(`${this.apiUrl}/${id}/narrative`);
  }

  getHistory(id: number): Observable<PlayerHistoryResponse> {
    return this.http.get<PlayerHistoryResponse>(`${this.apiUrl}/${id}/history`);
  }

  exportCsv(filters: PlayerFilterParams): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/csv`, {
      params: this.buildParams(filters),
      responseType: 'blob'
    });
  }

  private buildParams(filters: PlayerFilterParams): HttpParams {
    let params = new HttpParams()
      .set('page', filters.page ?? 1)
      .set('limit', filters.limit ?? 10);

    if (filters.name) params = params.set('name', filters.name.trim());
    if (filters.club) params = params.set('club', filters.club.trim());
    if (filters.position) params = params.set('position', filters.position.trim());
    if (filters.fifaVersion) params = params.set('fifaVersion', filters.fifaVersion.trim());

    return params;
  }
}
