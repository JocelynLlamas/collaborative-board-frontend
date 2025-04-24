import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel
} from '@microsoft/signalr';
import { MessagePackHubProtocol } from '@microsoft/signalr-protocol-msgpack';
import { BehaviorSubject, Observable, from, tap } from 'rxjs';
import { BoardAction } from '../models/BoardAction.interface';
import { BoardUser } from '../models/BoardUser.interface';
import { DrawPoint } from '../models/DrawPoint.interface';
import { Note } from '../models/Note.interface';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private hubConnection!: HubConnection;
  private hubUrl = 'https://localhost:7231/boardHub';
  private apiUrl = 'https://localhost:7231/api/board';

  // Subjects para datos en tiempo real
  private connectedUsersSubject = new BehaviorSubject<BoardUser[]>([]);
  private notesSubject = new BehaviorSubject<Note[]>([]);
  private actionsSubject = new BehaviorSubject<BoardAction[]>([]);
  private drawPointSubject = new BehaviorSubject<DrawPoint | null>(null);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  // Observables que los componentes pueden suscribir
  public connectedUsers$ = this.connectedUsersSubject.asObservable();
  public notes$ = this.notesSubject.asObservable();
  public actions$ = this.actionsSubject.asObservable();
  public drawPoint$ = this.drawPointSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Iniciar conexión con el hub
  public connect(username: string): Observable<void> {
    this.hubConnection = this.getConnection();

    this.addListeners();

    // Iniciar la conexión
    const promise = this.hubConnection.start()
      .then(() => {
        console.log('Conexión establecida');
        this.connectionStatusSubject.next(true);

        // Una vez conectado, unirse al tablero
        return this.hubConnection.invoke('JoinBoard', username);
      })
      .catch(err => {
        console.error('Error al conectar:', err);
        this.connectionStatusSubject.next(false);
        throw err;
      });

    return from(promise);
  }

  // Desconectar del hub
  public disconnect(): Observable<void> {
    const promise = this.hubConnection.stop()
      .then(() => {
        console.log('Desconexión exitosa');
        this.connectionStatusSubject.next(false);
      })
      .catch(err => {
        console.error('Error al desconectar:', err);
        throw err;
      });

    return from(promise);
  }

  // Enviar un punto de dibujo
  public sendDrawPoint(point: DrawPoint): Observable<void> {
    console.log('Enviando punto de dibujo:', point);
    const promise = this.hubConnection.invoke('DrawPoint', point);
    return from(promise);
  }

  // Añadir una nueva nota
  public addNote(note: Note): Observable<void> {
    console.log('Añadiendo nota:', note);
    const promise = this.hubConnection.invoke('AddNote', note);
    return from(promise);
  }

  // Actualizar una nota existente
  public updateNote(note: Note): Observable<void> {
    const promise = this.hubConnection.invoke('UpdateNote', note);
    return from(promise);
  }

  // Eliminar una nota
  public deleteNote(noteId: string): Observable<void> {
    const promise = this.hubConnection.invoke('DeleteNote', noteId);
    return from(promise);
  }

  // Limpiar el tablero (llamada a API)
  public clearBoard(): Observable<any> {
    return this.http.post(`${this.apiUrl}/clear`, {});
  }

  // Configurar la conexión SignalR
  private getConnection(): HubConnection {
    return new HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .withHubProtocol(new MessagePackHubProtocol())
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();
  }

  // Este método debe añadirse al servicio BoardService
  // Añade esta propiedad y método en el BoardService
  getCurrentConnectionId(): string {
    return this.hubConnection?.connectionId || '';
  }

  // Configurar los listeners para eventos del hub
  private addListeners(): void {
    // Estado actual del tablero
    this.hubConnection.on('CurrentBoardState', (notes: Note[], users: BoardUser[], actions: BoardAction[]) => {
      console.log('Estado actual recibido:', { notes, users, actions });
      this.notesSubject.next(notes);
      this.connectedUsersSubject.next(users);
      this.actionsSubject.next(actions);
    });

    // Usuario conectado
    this.hubConnection.on('UserJoined', (user: BoardUser) => {
      console.log('Usuario conectado:', user);
      const currentUsers = this.connectedUsersSubject.value;
      this.connectedUsersSubject.next([...currentUsers, user]);
    });

    // Usuario desconectado
    this.hubConnection.on('UserDisconnected', (user: BoardUser) => {
      console.log('Usuario desconectado:', user);
      const currentUsers = this.connectedUsersSubject.value;
      this.connectedUsersSubject.next(
        currentUsers.filter(u => u.connectionId !== user.connectionId)
      );
    });

    // Nuevo punto de dibujo
    this.hubConnection.on('NewDrawPoint', (point: DrawPoint) => {
      console.log(`[REMOTE] Recibido grosor: ${point.size}`);
      this.drawPointSubject.next(point);
    });

    // Nueva nota añadida
    this.hubConnection.on('NoteAdded', (note: Note) => {
      console.log('Nota añadida:', note);
      const currentNotes = this.notesSubject.value;
      this.notesSubject.next([...currentNotes, note]);
    });

    // Nota actualizada
    this.hubConnection.on('NoteUpdated', (note: Note) => {
      console.log('Nota actualizada:', note);
      const currentNotes = this.notesSubject.value;
      const updatedNotes = currentNotes.map(n =>
        n.id === note.id ? note : n
      );
      this.notesSubject.next(updatedNotes);
    });

    // Nota eliminada
    this.hubConnection.on('NoteDeleted', (noteId: string) => {
      console.log('Nota eliminada:', noteId);
      const currentNotes = this.notesSubject.value;
      this.notesSubject.next(
        currentNotes.filter(n => n.id !== noteId)
      );
    });

    // Tablero limpiado
    this.hubConnection.on('BoardCleared', () => {
      console.log('Tablero limpiado');
      this.notesSubject.next([]);
      // Podríamos añadir más lógica de limpieza si es necesario
    });

    // 🔥 Acción en tiempo real
    this.hubConnection.on('ActionOccurred', (action: any) => {
      if (!action.Description) return; // Evita insertar acciones vacías

      const normalized: BoardAction = {
        actionType: action.ActionType,
        username: action.Username,
        timestamp: new Date(action.Timestamp),
        description: action.Description
      };

      const current = this.actionsSubject.value;
      this.actionsSubject.next([...current, normalized]);
    });

  }
}