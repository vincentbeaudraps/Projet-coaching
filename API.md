# API Documentation - Coach Running Platform

## Base URL
```
http://localhost:3001/api
```

## Authentication

All endpoints except `/auth/*` require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### Register
**POST** `/auth/register`

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "role": "coach" | "athlete"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "coach"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Login
**POST** `/auth/login`

Authenticate and get a token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "coach"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials

---

## 👥 Athletes Endpoints

### Get All Athletes
**GET** `/athletes`

Get all athletes for the authenticated coach.

**Auth:** Required (Coach only)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "coach_id": "uuid",
    "email": "athlete@example.com",
    "name": "Marie Dupont",
    "age": 25,
    "level": "advanced",
    "goals": "Run a marathon"
  }
]
```

---

### Get Athlete
**GET** `/athletes/:athleteId`

Get details of a specific athlete.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "coach_id": "uuid",
  "email": "athlete@example.com",
  "name": "Marie Dupont",
  "age": 25,
  "level": "advanced",
  "goals": "Run a marathon"
}
```

**Errors:**
- `404 Not Found` - Athlete doesn't exist

---

### Add Athlete
**POST** `/athletes`

Add a new athlete to coach's list.

**Auth:** Required (Coach only)

**Request:**
```json
{
  "userId": "uuid",
  "age": 25,
  "level": "advanced",
  "goals": "Run a marathon"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "coach_id": "uuid",
  "age": 25,
  "level": "advanced",
  "goals": "Run a marathon"
}
```

---

### Update Athlete
**PUT** `/athletes/:athleteId`

Update athlete information.

**Auth:** Required (Coach only)

**Request:**
```json
{
  "age": 26,
  "level": "expert",
  "goals": "Break marathon record"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "coach_id": "uuid",
  "age": 26,
  "level": "expert",
  "goals": "Break marathon record"
}
```

---

## 🎯 Training Sessions Endpoints

### Create Session
**POST** `/sessions`

Create a new training session.

**Auth:** Required (Coach only)

**Request:**
```json
{
  "athleteId": "uuid",
  "title": "Easy Run",
  "description": "Recovery run with steady pace",
  "type": "easy",
  "distance": 10.5,
  "duration": 60,
  "intensity": "easy",
  "startDate": "2024-02-10T10:00:00"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "coach_id": "uuid",
  "athlete_id": "uuid",
  "title": "Easy Run",
  "description": "Recovery run with steady pace",
  "type": "easy",
  "distance": 10.5,
  "duration": 60,
  "intensity": "easy",
  "start_date": "2024-02-10T10:00:00",
  "created_at": "2024-02-09T15:30:00"
}
```

---

### Get All Sessions
**GET** `/sessions`

Get all sessions for the authenticated coach.

**Auth:** Required (Coach only)

**Query Parameters:**
- `athleteId` (optional) - Filter by athlete

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "coach_id": "uuid",
    "athlete_id": "uuid",
    "title": "Easy Run",
    "description": "Recovery run",
    "type": "easy",
    "distance": 10.5,
    "duration": 60,
    "intensity": "easy",
    "start_date": "2024-02-10T10:00:00"
  }
]
```

---

### Get Athlete Sessions
**GET** `/sessions/athlete/:athleteId`

Get all sessions for a specific athlete.

**Auth:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "coach_id": "uuid",
    "athlete_id": "uuid",
    "title": "Easy Run",
    "start_date": "2024-02-10T10:00:00"
  }
]
```

---

### Update Session
**PUT** `/sessions/:sessionId`

Update a training session.

**Auth:** Required (Coach only)

**Request:**
```json
{
  "title": "Easy Run - Updated",
  "duration": 65,
  "intensity": "moderate"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Easy Run - Updated",
  "duration": 65,
  "intensity": "moderate"
}
```

---

### Delete Session
**DELETE** `/sessions/:sessionId`

Delete a training session.

**Auth:** Required (Coach only)

**Response:** `200 OK`
```json
{
  "message": "Session deleted"
}
```

---

## 📊 Performance Endpoints

### Record Performance
**POST** `/performance`

Record athlete performance data.

**Auth:** Required

**Request:**
```json
{
  "athleteId": "uuid",
  "sessionId": "uuid",
  "actualDistance": 10.2,
  "actualDuration": 62,
  "avgHeartRate": 155,
  "maxHeartRate": 180,
  "notes": "Felt good, pace was steady"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "athlete_id": "uuid",
  "session_id": "uuid",
  "actual_distance": 10.2,
  "actual_duration": 62,
  "avg_heart_rate": 155,
  "max_heart_rate": 180,
  "notes": "Felt good",
  "recorded_at": "2024-02-10T11:00:00"
}
```

---

### Get Athlete Performance History
**GET** `/performance/athlete/:athleteId`

Get all performance records for an athlete.

**Auth:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "athlete_id": "uuid",
    "session_id": "uuid",
    "actual_distance": 10.2,
    "actual_duration": 62,
    "avg_heart_rate": 155,
    "max_heart_rate": 180,
    "notes": "Felt good",
    "recorded_at": "2024-02-10T11:00:00"
  }
]
```

---

### Get Performance Analytics
**GET** `/performance/analytics/:athleteId`

Get analytics and statistics for an athlete.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "total_sessions": 24,
  "avg_distance": 10.5,
  "avg_duration": 62.5,
  "avg_heart_rate": 158,
  "max_distance": 21.1,
  "total_distance": 252
}
```

---

## 💬 Messages Endpoints

### Send Message
**POST** `/messages`

Send a message to another user.

**Auth:** Required

**Request:**
```json
{
  "receiverId": "uuid",
  "content": "Great job on yesterday's run!"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "sender_id": "uuid",
  "receiver_id": "uuid",
  "content": "Great job!",
  "read": false,
  "created_at": "2024-02-09T15:30:00"
}
```

---

### Get Conversation
**GET** `/messages/conversation/:userId`

Get all messages in a conversation with a user.

**Auth:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "sender_id": "uuid",
    "receiver_id": "uuid",
    "content": "How was your training?",
    "read": true,
    "created_at": "2024-02-09T14:00:00"
  },
  {
    "id": "uuid",
    "sender_id": "uuid",
    "receiver_id": "uuid",
    "content": "It was great!",
    "read": false,
    "created_at": "2024-02-09T15:00:00"
  }
]
```

---

### Mark Messages as Read
**PUT** `/messages/read/:userId`

Mark all messages from a user as read.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "message": "Messages marked as read"
}
```

---

## Health Check

### Get Health Status
**GET** `/health`

Check if the API is running.

**Auth:** Not required

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-02-09T15:30:00.000Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Rate Limiting

Currently not implemented. Consider adding for production.

## Pagination

Currently not implemented. Consider adding for large datasets.

## Filtering & Sorting

Currently basic implementation. Can be enhanced.

---

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"pass123","role":"coach"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Get Athletes (requires token)
curl -X GET http://localhost:3001/api/athletes \
  -H "Authorization: Bearer YOUR_TOKEN"

# Health Check
curl http://localhost:3001/api/health
```

---

**Last Updated:** February 2024
