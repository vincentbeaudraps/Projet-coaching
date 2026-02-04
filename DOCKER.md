# Coach Running Platform - Docker Setup

## Quick Start with Docker

```bash
# Build and run with Docker Compose
docker-compose up --build
```

This will:
1. Start PostgreSQL database
2. Start Node.js backend on port 3001
3. Start React frontend on port 5173

## Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Database: localhost:5432

## Docker Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild images
docker-compose up --build

# Remove everything (including volumes)
docker-compose down -v
```

## Environment Variables

Docker Compose automatically sets:
- `DB_HOST=postgres` (service name)
- `DB_PORT=5432`
- `DB_NAME=coaching_db`
- `DB_USER=postgres`
- `DB_PASSWORD=postgres`

To change, edit `docker-compose.yml`

## Database Access

```bash
# Access PostgreSQL from outside Docker
psql -h localhost -U postgres -d coaching_db

# Inside docker-compose
docker exec -it coaching_db_postgres_1 psql -U postgres
```

## Building Individual Images

```bash
# Backend only
cd backend
docker build -t coaching-backend .

# Frontend only
cd frontend
docker build -t coaching-frontend .
```

## Troubleshooting

### Port already in use
- Change port in docker-compose.yml
- Or kill the process: `lsof -i :PORT`

### Database connection failed
- Check PostgreSQL is running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`

### Rebuild needed
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## Production Deployment

For production, consider:
- Use environment files (.env)
- Change JWT_SECRET
- Use strong database passwords
- Enable SSL/TLS
- Use reverse proxy (Nginx)
- Add monitoring and logging
