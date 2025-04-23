# 🧑‍🎨 Collaborative Board - Frontend (Angular)

This is the frontend for a real-time collaborative board built with **Angular** and **SignalR**. It enables multiple users to interact simultaneously through drawing, sticky notes, user tracking, and action history.

> 🚀 A lightweight, educational project that demonstrates real-time communication using WebSockets via SignalR.

---

## 🌟 Features

- 🎨 **Collaborative drawing** on a shared canvas
- 📝 **Sticky notes**: movable, editable, and synchronized in real-time
- 👥 **Connected users list** shown in a side panel
- 🕘 **Action history**: tracks recent actions with timestamps
- 🔁 **Live sync** with an ASP.NET Core backend using SignalR

---

## ⚙️ Tech Stack

- [Angular 17+](https://angular.io/)
- [SignalR JavaScript Client](https://www.npmjs.com/package/@microsoft/signalr)
- RxJS with Observables
- MessagePack Protocol (optional)
- Vanilla CSS for minimal styling

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/collaborative-board.git
cd collaborative-board/frontend
```
### 2. Install Dependencies

```bash
npm install
```
### 3. Configure backend URL

In board.service.ts, update these URLs:

```bash
private hubUrl = 'https://localhost:7231/boardHub';
private apiUrl = 'https://localhost:7231/api/board';
```
### 4. Run the app

```bash
ng serve
```
Navigate to http://localhost:4200 to start using the app.

---

## 🧪 Development Notes

- User identification is handled via a username stored in localStorage.

- Sticky notes are draggable and deletable.

- Action history updates in real-time as events occur.

- MessagePack can be switched to JSON for easier debugging.
---

## 📁 Project Structure
```bash
📦 src/app
├── components/
│   └── board/            # Main board UI component
├── services/
│   └── board.service.ts  # SignalR logic and state management
```
---
## 📸 Screenshots
## 📃 License
MIT — Feel free to use, modify, and distribute this for personal or educational purposes.
## 🙌 Acknowledgments
### Building Tomorrow, One Line at a Time by Jocelyn Llamas.
