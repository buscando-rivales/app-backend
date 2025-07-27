# 📘 MatchFútbol – MVP 📘

## 1. Resumen ejecutivo 📌

**Problema:** Novedades de última hora se caen los partidos, se complica completar equipos de fútbol 5/7.
**Solución:** Plataforma que conecta automáticamente partidos armados con jugadores libres en las cercanías. Similar a "Tinder" para fútbol.

## 2. Objetivos & Métricas

**Objetivo:**
Permitir que organizadores creen partidos y que jugadores libres se unan para completar los cupos rápidamente.

**Métricas clave (desde el día 1):**

- ⚽ Número de partidos creados.
- ✅ Tasa de completitud de los partidos.
- ⏱️ Tiempo promedio que tarda en completarse un partido.
- 👥 Usuarios activos por zona.
- 🔁 Repetición de uso por usuario (DAU/MAU).

## 3. Alcance del MVP

### Incluye:

- Registro e inicio de sesión
- Creación de partidos
- Búsqueda y filtros de partidos
- Unión a un partido
- Sala de chat para los jugadores del partido
- Envío de notificaciones (push/email)
- Tracking de métricas

## 4. Casos de uso (User Stories)

1. **Organizador**:

   - Como organizador, quiero crear un partido indicando cancha, fecha/hora, tipo (5 o 7), nivel y cupos faltantes.
   - Como organizador, quiero que se me notifique cuando alguien se una.

2. **Jugador libre**:

   - Como jugador, quiero ver partidos cercanos disponibles.
   - Como jugador, quiero unirme fácilmente a un partido y recibir confirmación.
   - Una vez unido el cupo completo, acceder a una sala de chat para contacto directo.

## 6. Arquitectura técnica

**Servicios desacoplados:**

- `UserService`: registro, autenticación, perfil.
- `GameService`: creación, modificación, listados de partidos.
- `MatchService`: lógica para conectar proyectos con jugadores.
- `ChatService`: gestión de salas y mensajes.
- `NotificationService`: correos/mensajes push.
- `MetricsService`: envío de eventos a analítica.

**Stack:**

## Frontend

Framework: React Native

Librería de navegación: React Navigation

Autenticación: Clerk (con integración al backend)

Manejo de estado: Zustand

Push Notifications: Firebase Cloud Messaging (FCM)

## Backend

Framework: NestJS

Lenguaje: TypeScript

API: REST (con posibilidad de agregar WebSocket en el futuro)

Autenticación: Clerk (validación del token en middleware NestJS)

ORM: Prisma

Base de datos: PostgreSQL (provisionada por Supabase)

Realtime: Supabase Realtime (solo si es necesario para notificaciones de partidos o cambios de estado)

Mensajería push: Firebase Cloud Messaging (desde el backend o usando un servidor externo)


## 7. Service Implementation Status

- ✅ UserService
- ✅ GameService
- ⬜ MatchService
- ⬜ ChatService
- ⬜ NotificationService
- ⬜ MetricsService