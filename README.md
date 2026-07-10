# CapMinds – Appointment Scheduling App

A responsive Appointment Scheduling application built with pure HTML, CSS, and JavaScript — no frameworks or libraries.

## Live Demo

[https://anbarasu2410.github.io/Capminds-Assignment/](https://anbarasu2410.github.io/Capminds-Assignment/)

## Features

- **Calendar View** — Month and Week views with appointment chips showing patient name, doctor, and time
- **Book Appointment** — Modal form to schedule appointments with full validation
- **Edit & Delete** — Manage appointments directly from the calendar or dashboard table
- **Dashboard View** — Table listing all appointments with search and filter controls
- **Search & Filter** — Filter by patient name, doctor name, and date range (live updates)
- **LocalStorage** — All appointments persist across page refreshes
- **Responsive** — Works on mobile, tablet, and desktop

## Pages

| Page | Description |
|------|-------------|
| Calendar | Month/week calendar with appointment chips |
| Dashboard | Appointment details table with search and filters |

## Form Fields

Each appointment captures: Patient Name, Doctor Name, Hospital Name, Specialty, Date, Time, and Reason.

## Tech Stack

- HTML5
- CSS3 (Flexbox, Grid, CSS Variables)
- Vanilla JavaScript (ES6+)
- localStorage for data persistence

## Getting Started

### Run Locally

Just open `index.html` in any browser — no build step required.

### Or use a local server

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

Then open `http://localhost:8080`

## Project Structure

```
├── index.html   # App structure and markup
├── styles.css   # All styling and responsive rules
├── app.js       # All logic — calendar, CRUD, filters, modals
└── README.md
```

## Screenshots

> Figma Design Reference: CapMinds Practice Dashboard

## License

MIT
