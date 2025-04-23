import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ], // Aquí puedes importar otros módulos si es necesario
  template: `
    <div class="login-container">
      <h2>Únete al Tablero Colaborativo</h2>
      <div class="login-form">
        <input 
          type="text" 
          [(ngModel)]="username" 
          placeholder="Tu nombre"
          (keyup.enter)="join()">
        <button (click)="join()" [disabled]="!username.trim()">
          Entrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: #f5f5f5;
    }
    
    h2 {
      margin-bottom: 20px;
      color: #333;
    }
    
    .login-form {
      display: flex;
      flex-direction: column;
      width: 300px;
      gap: 10px;
    }
    
    input {
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #ddd;
      font-size: 16px;
    }
    
    button {
      padding: 10px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  `]
})
export class LoginComponent {
  username: string = '';

  constructor(private router: Router) { }

  join() {
    if (this.username.trim()) {
      // Guardamos el nombre de usuario en localStorage
      localStorage.setItem('boardUsername', this.username);
      // Navegamos al tablero
      this.router.navigate(['/board']);
    }
  }
}