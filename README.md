# RegiTrack — Role-Based Dashboard Prototype

Web-based prototype for the PCU Registrar's Office academic document request workflow.

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a modern browser, or use VS Code Live Server.
3. Use one of the demo accounts below.

## Demo accounts
| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Registrar Staff | `registrar` | `registrar123` |
| Authorized Registrar (demo approver) | `approver` | `approver123` |
| Student | `student` | `student123` |

These credentials and all data are for demonstration only. This is **not production authentication**. Login credentials are hard-coded in client-side JavaScript and can be inspected. Account creation is a prototype record only; it does not create working credentials.

## Role capabilities
- **Admin:** overview, account records, role/status management, document-type configuration, activity log.
- **Registrar Staff:** review requests, update processing status, set a proposed release date, view approval queue.
- **Authorized Registrar:** same Registrar workspace plus a simulated final-approval action.
- **Student:** submit requests, receive a reference number, view request history and status.

## Important prototype limitations
- Data is stored in browser `localStorage`; it is not a shared database and can be edited by the user.
- Session role checks and approval flags are client-side demonstrations, not security controls.
- File input only records the selected filename; it does not upload or securely store the file.
- No real email notifications, password reset, PRISSMS integration, or official document generation.
- Use fictional data only. Never upload real student IDs or academic records.
- Final approval before release belongs to the University Registrar or an authorized delegate, as stated in the team's interview notes. Confirm the exact workflow and statuses with PCU.

## Suggested next implementation
Add a backend API and shared database; implement server-side authentication, password hashing, role-based authorization, validated file upload, audit logs, and secure deployment before any real student information is processed.
