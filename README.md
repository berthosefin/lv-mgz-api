# Store management backend

Store Management is a backend application built with [NestJS](https://nestjs.com/) for comprehensive store management. It allows you to manage products, orders, customers, invoices, and more.

This project is a backend part of [Store Management](https://github.com/berthosefin/lv-mgz).

**Features**:

<ul>
	<li>- [x] User Management</li>
	<li>- [x] Article management</li>
	<li>- [x] Order management</li>
	<li>- [x] Customer management</li>
	<li>- [x] Invoice management</li>
	<li>- [x] Cash desk summary and transaction list</li>
</ul>

## Installation and setup

Create a `.env` file with the following properties:

```
# PORT
PORT=3001

# FRONTEND URL
FRONTEND_URL="http://localhost:3000"

# DATABASE URL
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="sectret"
JWT_REFRESH_SECRET="secret"
JWT_EXPIRATION_TIME='1h'
JWT_REFRESH_EXPIRATION_TIME='30d'
```

Installing dependencies

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start:dev
```
