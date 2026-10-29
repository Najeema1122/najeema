# Najeema's portfolio

A single-page Next.js portfolio with a private project manager.

## Backend configuration

Copy `.env.example` to `.env.local` and fill in the values from your own services. Never commit `.env.local` or paste the secrets into public code.

- **MongoDB Atlas:** Set `MONGODB_URI` and `MONGODB_DB`. In Atlas, create a database user and allow the IP addresses that need to connect.
- **Cloudinary:** Set the cloud name, API key, and API secret. Project images are uploaded on the server to `najeema-portfolio/projects`; the public project record stores the secure image URL and Cloudinary ID.
- **Admin login:** Set a private email and strong password. `SESSION_SECRET` must be a unique random string of at least 32 characters. The session is an HTTP-only cookie.
- **Gmail/Nodemailer:** Set `GMAIL_USER` to the Gmail account used to send mail and `GMAIL_APP_PASSWORD` to its app password. Enable Google 2-Step Verification to create an app password. `ADMIN_EMAIL` receives contact messages and meeting summaries; the visitor receives the meeting confirmation.

After changing `.env.local`, restart the Next.js development server. Run `npm run dev` to start the app. Open `/admin` to sign in and manage projects.

## Backend routes

- `GET /api/projects` lists published projects for the public page.
- `POST /api/projects` creates a project (admin session required).
- `PUT /api/projects/:id` updates a project (admin session required).
- `DELETE /api/projects/:id` deletes a project and its Cloudinary image (admin session required).
- `POST /api/admin/login`, `POST /api/admin/logout`, and `GET /api/admin/session` manage the admin session.
- `POST /api/admin/upload` uploads a project image to Cloudinary (admin session required).
- `POST /api/contact` sends the contact form to the admin email.
- `POST /api/bookings` validates a future date and sends both requested booking emails.

The app cannot connect to Atlas, Cloudinary, or Gmail until their credentials are entered in `.env.local`.


