# DROPi Backend API

Complete backend API for DROPi - Autonomous Drone Delivery Platform.

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev

# Or start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/trpc/auth.register` - Register new user
- `POST /api/trpc/auth.login` - Login user
- `GET /api/trpc/auth.me` - Get current user
- `POST /api/trpc/auth.logout` - Logout user

### Users
- `GET /api/trpc/users.list` - List all users
- `GET /api/trpc/users.get` - Get user details
- `PUT /api/trpc/users.update` - Update user
- `DELETE /api/trpc/users.delete` - Delete user

### Agents
- `GET /api/trpc/agents.list` - List all agents
- `GET /api/trpc/agents.get` - Get agent details
- `POST /api/trpc/agents.execute` - Execute agent
- `GET /api/trpc/agents.getExecutions` - Get execution history

### Issues
- `GET /api/trpc/issues.list` - List issues
- `GET /api/trpc/issues.get` - Get issue details
- `POST /api/trpc/issues.create` - Create issue
- `PUT /api/trpc/issues.update` - Update issue

### Support
- `GET /api/trpc/support.listTickets` - List support tickets
- `POST /api/trpc/support.createTicket` - Create ticket
- `PUT /api/trpc/support.updateTicket` - Update ticket
- `GET /api/trpc/support.getMetrics` - Get support metrics

### Orders
- `GET /api/trpc/orders.list` - List orders
- `POST /api/trpc/orders.create` - Create order
- `GET /api/trpc/orders.get` - Get order details
- `PUT /api/trpc/orders.update` - Update order

### Deliveries
- `GET /api/trpc/deliveries.list` - List deliveries
- `POST /api/trpc/deliveries.create` - Create delivery
- `PUT /api/trpc/deliveries.update` - Update delivery
- `GET /api/trpc/deliveries.track` - Track delivery

### Analytics
- `GET /api/trpc/analytics.getDashboard` - Get dashboard metrics
- `GET /api/trpc/analytics.getReport` - Get analytics report

## Database Schema

### Core Tables
- `users` - User accounts and roles
- `agents` - AI agent definitions
- `agent_executions` - Agent execution records
- `issues` - Issues detected by agents
- `support_tickets` - Support tickets
- `support_metrics` - Daily support metrics
- `simulation_runs` - Simulation tracking
- `orders` - Customer orders
- `deliveries` - Delivery records
- `droneports` - DronePort locations
- `audit_logs` - Complete audit trail

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Login Flow
1. Call `auth.login` with email and password
2. Receive JWT token in response
3. Include token in Authorization header: `Authorization: Bearer <token>`
4. Token expires in 7 days

### User Roles
- `admin` - System administrator
- `user` - Regular user
- `agent` - AI agent

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/routers/auth.test.js
```

## Development

### Project Structure
```
src/
├── server.js           - Express server setup
├── context.js          - tRPC context
├── trpc.js             - tRPC initialization
├── db/
│   ├── index.js        - Database connection
│   └── schema.js       - Database schema
├── routers/
│   ├── index.js        - Router aggregation
│   ├── auth.js         - Authentication
│   ├── users.js        - User management
│   ├── agents.js       - Agent management
│   ├── issues.js       - Issue tracking
│   ├── support.js      - Support system
│   ├── simulation.js    - Simulation engine
│   ├── orders.js       - Order management
│   ├── deliveries.js   - Delivery management
│   └── analytics.js    - Analytics
├── middleware/         - Custom middleware
├── utils/              - Utility functions
├── services/           - Business logic
└── types/              - TypeScript types
```

### Adding New Endpoints

1. Create router file in `src/routers/`
2. Define procedures using `publicProcedure`, `protectedProcedure`, or `adminProcedure`
3. Add input validation with Zod
4. Implement business logic
5. Add tests in `tests/`
6. Import and register in `src/routers/index.js`

### Database Migrations

```bash
# Create new migration
npm run db:create-migration -- <name>

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback
```

## Deployment

### Docker

```bash
# Build image
docker build -t dropi-backend .

# Run container
docker run -p 3000:3000 --env-file .env dropi-backend
```

### Environment Variables

See `.env.example` for all available configuration options.

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

## Performance

### Database Optimization
- Indexes on frequently queried columns
- Connection pooling (10 connections)
- Query optimization with Drizzle ORM

### Caching
- Redis for session management
- Response caching for read-heavy endpoints

### Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user

## Security

- JWT token validation
- Password hashing with bcrypt
- SQL injection prevention with Drizzle ORM
- CORS enabled for frontend
- Helmet.js for HTTP headers
- Rate limiting enabled

## Troubleshooting

### Database Connection Failed
- Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` in `.env`
- Ensure MySQL is running
- Check database exists: `CREATE DATABASE dropi;`

### JWT Token Invalid
- Check `JWT_SECRET` is set correctly
- Ensure token is in Authorization header
- Check token hasn't expired

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:3000 | xargs kill -9`

## Support

For issues or questions, refer to:
- `/DROPI_CANONICAL/12_DOCUMENTATION/API_REFERENCE.md`
- `/DROPI_CANONICAL/12_DOCUMENTATION/TROUBLESHOOTING.md`

## License

MIT
