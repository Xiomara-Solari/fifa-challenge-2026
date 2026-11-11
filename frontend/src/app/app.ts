import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // 1. Importación base

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // 2. IMPORTACIÓN CRÍTICA EN EL DECORADOR
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
