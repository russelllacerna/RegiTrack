# RegiTrack — Role-Based Dashboard Prototype

Web-based prototype for the PCU Registrar's Office academic document request workflow.

## Run locally (XAMPP: Apache + PHP 8.1+ + MySQL)

The system now has a PHP + MySQL backend, so it must run through Apache. **Live Server will no longer work** because it cannot run PHP.

1. Install [XAMPP](https://www.apachefriends.org/) and start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Copy this whole project folder into `C:\xampp\htdocs\` and name the folder `regitrack`.
3. Open `http://localhost/phpmyadmin`, click **Import**, choose `database/regitrack.sql`, and click **Go**. This creates the `regitrack` database with demo data. Re-importing resets the database.
4. Open `http://localhost/regitrack/` and sign in with a demo account below.

If your MySQL password is not empty, create `api/config.local.php` (not tracked by Git):

```php
<?php
$DB_DSN  = 'mysql:host=127.0.0.1;dbname=regitrack;charset=utf8mb4';
$DB_USER = 'root';
$DB_PASS = 'your-password';
```

### Project structure

| Path | Purpose |
| --- | --- |
| `index.html`, `*-dashboard.html`, `css/`, `js/` | Front end (HTML, CSS, JavaScript) |
| `api/config.php` | Database connection, session settings, shared helpers, role checks |
| `api/login.php`, `api/logout.php`, `api/me.php` | Sign in / sign out / current user (FR1) |
| `api/requests.php` | GET: students see only their own requests, staff see all (FR5, FR7, FR14). POST: student submits a request and gets a reference number (FR2, FR4) |
| `api/request_update.php` | Registrar Staff update status, release date and notes (FR8, FR9) |
| `api/request_approve.php` | Final approval, only for staff with approval permission (FR10) |
| `api/document_types.php` | List of requestable documents |
| `database/regitrack.sql` | Schema (Chapter 2 data dictionary) and fictional demo data |

Every status change is saved in `status_history` with the user and time (FR11).

## Demo accounts (fictional)

| Role                                    | Username    | Password       |
| --------------------------------------- | ----------- | -------------- |
| Admin                                   | `admin`     | `admin123`     |
| Registrar Staff                         | `registrar` | `registrar123` |
| Authorized Registrar (approval allowed) | `approver`  | `approver123`  |
| Student                                 | `student`   | `student123`   |
| Second student (to show data isolation) | `student2`  | `student123`   |

Passwords are stored as bcrypt hashes in the database. Change them before any real deployment.

## Role capabilities

- **Admin:** overview, account records, role/status management, document-type configuration, activity log.
- **Registrar Staff:** review requests, update processing status, set a proposed release date, view approval queue.
- **Authorized Registrar:** same Registrar workspace plus a simulated final-approval action.
- **Student:** submit requests, receive a reference number, view request history and status.

## Current progress and limitations

Working on the backend: login with hashed passwords and server sessions, server-side role checks, request submission with reference numbers, student status view, staff status updates, final approval permission, and the status-history audit trail.

Still planned:

- Secure file upload for valid IDs and authorization letters (FR3); the file field is disabled for now.
- In-system notifications (FR6), recording of release (FR9), reports (FR12).
- The **Admin dashboard still uses browser `localStorage`** demo data; account management through the database is planned (FR13).
- Login rate limiting, HTTPS deployment, password reset.
- No PRISSMS integration or official document generation (out of scope).
- Use fictional data only until the system is approved and deployed securely.
