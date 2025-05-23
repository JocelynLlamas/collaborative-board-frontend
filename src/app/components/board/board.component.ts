import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BoardAction } from '../../models/BoardAction.interface';
import { BoardUser } from '../../models/BoardUser.interface';
import { DrawPoint } from '../../models/DrawPoint.interface';
import { Note } from '../../models/Note.interface';
import { BoardService } from '../../services/board.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ], // Aquí puedes importar otros módulos si es necesario
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private context!: CanvasRenderingContext2D;
  private isDrawing = false;
  private subscriptions: Subscription[] = [];

  username: string = '';
  currentColor: string = '#000000';
  currentBrushSize: number = 2;

  notes: Note[] = [];
  users: BoardUser[] = [];
  actions: BoardAction[] = [];

  noteText: string = '';
  noteColor: string = '#ffeb3b';

  constructor(
    public boardService: BoardService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.username = localStorage.getItem('boardUsername') || '';
    if (!this.username) {
      this.router.navigate(['/']);
      return;
    }

    // Inicializar canvas
    const canvas = this.canvasRef.nativeElement;
    this.context = canvas.getContext('2d')!;
    this.resizeCanvas();

    // Conectarse al hub
    this.boardService.connect(this.username).subscribe({
      next: () => console.log('Conectado exitosamente'),
      error: err => {
        console.error('Error al conectar', err);
        this.router.navigate(['/']);
      }
    });

    // Suscribirse a los eventos
    this.subscriptions.push(
      this.boardService.notes$.subscribe(notes => {
        console.log('Notas recibidas:', notes);
        this.notes = notes;
      }),
      this.boardService.connectedUsers$.subscribe(users => {
        console.log('Usuarios recibidos:', users);
        this.users = users;
      }),
      this.boardService.actions$.subscribe(actions => {
        console.log('Acciones recibidas:', actions);
        this.actions = actions
      }),
      this.boardService.drawPoint$.subscribe(point => {
        if (point) this.drawRemotePoint(point);
      })
    );

    // Event listener para resize
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  ngOnDestroy(): void {
    // Cancelar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Desconectarse del hub
    this.boardService.disconnect().subscribe();

    // Quitar event listener
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }

  // Ajustar tamaño del canvas
  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100; // Dejar espacio para la barra de herramientas
  }

  // Eventos de dibujo
  startDrawing(event: MouseEvent): void {
    this.isDrawing = true;
    const { x, y } = this.getCanvasCoordinates(event);

    // Dibujar punto inicial
    this.context.beginPath();
    this.context.moveTo(x, y);

    // Enviar punto al servidor
    const point: DrawPoint = {
      x: x,
      y: y,
      color: this.currentColor,
      size: this.currentBrushSize,
      isNewLine: true
    };

    this.boardService.sendDrawPoint(point).subscribe();
  }

  draw(event: MouseEvent): void {
    if (!this.isDrawing) return;

    const { x, y } = this.getCanvasCoordinates(event);

    // Dibujar línea
    this.context.lineTo(x, y);
    this.context.strokeStyle = this.currentColor;
    this.context.lineWidth = this.currentBrushSize;
    this.context.lineCap = 'round';
    this.context.stroke();

    // Enviar punto al servidor
    const point: DrawPoint = {
      x: x,
      y: y,
      color: this.currentColor,
      size: Number(this.currentBrushSize),
      isNewLine: false
    };

    if (typeof point.size !== 'number' || isNaN(point.size)) {
      console.warn('❌ Invalid brush size! DrawPoint not sent.', point);
      return;
    }

    this.boardService.sendDrawPoint(point).subscribe();
  }

  stopDrawing(): void {
    this.isDrawing = false;
    this.context.closePath();
  }

  // Dibujar punto recibido de otro usuario
  drawRemotePoint(point: DrawPoint): void {
    if (point.isNewLine) {
      this.context.beginPath();
      this.context.moveTo(point.x, point.y);
    } else {
      this.context.lineTo(point.x, point.y);
      this.context.strokeStyle = point.color;
      this.context.lineWidth = point.size;
      this.context.lineCap = 'round';
      this.context.stroke();
    }
  }

  // Obtener coordenadas relativas al canvas
  private getCanvasCoordinates(event: MouseEvent): { x: number, y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  // Métodos para notas
  addNote(): void {
    if (!this.noteText.trim()) return;

    const note: Note = {
      text: this.noteText,
      x: Math.random() * (window.innerWidth - 200),
      y: Math.random() * (window.innerHeight - 200),
      color: this.noteColor
    };

    this.boardService.addNote(note).subscribe(() => {
      console.log('Nota creada:', note);
      this.noteText = ''; // Limpiar después de crear
    });
  }

  updateNote(note: Note): void {
    this.boardService.updateNote(note).subscribe();
  }

  deleteNote(noteId: string): void {
    this.boardService.deleteNote(noteId).subscribe();
  }

  // Limpiar tablero
  clearBoard(): void {
    if (confirm('Are you sure you want to clear the board?')) {
      this.boardService.clearBoard().subscribe(() => {
        // The canvas will be cleared when the BoardCleared event is received
        const canvas = this.canvasRef.nativeElement;
        this.context.clearRect(0, 0, canvas.width, canvas.height);
      });
    }
  }

  // Añade este método a tu BoardComponent
  logout(): void {
    this.boardService.disconnect().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
  // Obtener username a partir de un connectionId
  getUsernameById(connectionId: string): string {
    const user = this.users.find(u => u.connectionId === connectionId);
    return user ? user.username : 'Usuario desconocido';
  }

  updateNotePosition(note: Note, event: DragEvent): void {
    const updatedNote = {
      ...note,
      x: event.clientX - 50,
      y: event.clientY - 20
    };
    this.updateNote(updatedNote);
  }

}