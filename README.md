# Real-Time Group Cycling Tracker

A production-grade, mobile-first coordination system designed for cycling group leaders to track participants in real time. This project implements a high-frequency location broadcasting engine using WebSockets, optimized for low-latency updates and battery-efficient GPS polling.

![React Native](https://img.shields.io/badge/React_Native-Expo-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-black.svg)
![Leaflet](https://img.shields.io/badge/Leaflet-OpenStreetMap-brightgreen.svg)

---

## Key Features

- **High-Precision Live Tracking** - Real-time GPS broadcasting with 5-second interval updates.
- **Intelligent Stationary Detection** - Automatic detection and "cyclistStopped" alerts if movement is < 0.5 m/s for more than 2 minutes.
- **Live Leader Dashboard** - Interactive Leaflet map with dynamic markers representing cyclist status: moving (green), slow (yellow), stationary (red), or disconnected (gray).
- **Robust Connection Handling** - Singleton socket services with auto-reconnection and optimized state persistence.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile App** | React Native (Expo), `expo-location`, `react-native-maps` |
| **Real-time** | Socket.IO (WebSockets) for bidirectional event streaming |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose) |
| **Dashboard** | React.js, Leaflet.js, Tailwind CSS |

## Architecture

```
┌─────────────────────────────────────────────────┐
│             Cyclist Mobile App                  │
│  ┌──────────────┬──────────────┬──────────────┐ │
│  │ Expo         │  useLocation │  Socket      │ │
│  │ Location     │  Tracking    │  Service     │ │
│  │ (GPS Poll)   │  Hook        │  (Emitter)   │ │
│  └──────────────┴──────────────┴──────────────┘ │
└────────────┬────────────────────┬────────────────┘
│                    │
Location Payload      Socket Connection
│                    │
┌────────────┴──────┐      ┌──────┴──────────────┐
│  Node.js Backend  │      │ Leader Dashboard    │
│  (Stationary      │◄────►│ (Real-time Marker   │
│   Logic, Cache,   │      │  Updates, Status    │
│   DB Persistence) │      │  Legend, Map UI)    │
└───────────────────┘      └─────────────────────┘
│                    │
┌──────┴──────┐      ┌──────┴──────┐
│  MongoDB    │      │  Leaflet    │
│ (History,   │      │ (OpenStreet │
│  Metadata)  │      │  Map Layer) │
└─────────────┘      └─────────────┘
```

## Key Challenges Solved

- **Stationary Detection Logic:** Developed a server-side tracking mechanism using a `cyclistStateCache` to monitor speed thresholds over time, triggering alerts when movement ceases for 120 seconds.
- **Battery-Efficient Polling:** Optimized `watchPositionAsync` parameters to balance high-accuracy GPS data with device battery longevity by using a 5000ms interval.
- **Real-Time Data Integrity:** Implemented checks to skip redundant updates if coordinates and speed remain identical to the last known state.

## Performance Optimizations

- **Throttled Broadcasting:** The server filters incoming location pings to broadcast only significant state changes, reducing network overhead.
- **Asynchronous Persistence:** Utilized "fire-and-forget" patterns for database writes to ensure location history storage never blocks the real-time event loop.
- **Marker Batching:** Leveraged Leaflet's marker update capabilities to refresh specific cyclists without triggering full map re-renders.

## Project Structure

```
cyclotrack/
├── backend/              # Node.js Server & Socket logic
│   ├── config/           # Database & Middleware config
│   ├── controllers/      # API business logic
│   ├── models/           # Mongoose schemas (User, Ride, Location)
│   ├── routes/           # Express API endpoints
│   └── sockets/          # Socket.IO event handlers
├── mobile/               # React Native (Expo) Application
│   ├── src/hooks/        # Location tracking & GPS logic
│   ├── src/screens/      # Mobile UI & Map views
│   └── src/services/     # Socket connection singleton
└── dashboard/            # React Web Application
├── src/components/   # Leaflet Map & Sidebar
└── src/services/     # Web Socket orchestration
```

## Quick Start

### 1. Backend
```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 2. Dashboard
```bash
cd dashboard
npm install
npm run dev
# Dashboard available at http://localhost:3000
```

### 3. Mobile
```bash
cd mobile
npm install
npx expo start
# Scan QR code with Expo Go app
```

## Future System Design Improvements

- **Redis Integration:** Move the cyclistStateCache to Redis for distributed state management across multiple server instances.
- **Geofencing Alerts:** Add triggers to notify leaders if a cyclist drifts too far from the group's planned route.
- **Historical Playback:** Build a visualization tool to replay entire rides and analyze pace across different segments.

## License

MIT License

---

<p>Built as part of my engg course poject. </p>