in this current empty folder we are in  create a react web app, this will be fleet logistics and managament software:

Build the Frontend

Build this application as a polished React web frontend.

Scope

Focus on getting as much of the frontend working as possible in this pass.

Use:

React + TypeScript

Existing project setup/dependencies where possible

Responsive web UI

Reusable components

Mock/dummy data

Local state

Client-side routing

Do not build:

Database

Backend/API

Real authentication

OAuth

Payments

Production infrastructure

Authentication

Create a polished login page with:

Email/password fields

Normal login UI

A clearly visible Demo Login button

Demo Login should immediately authenticate a dummy user and take them into the application

Persist demo login across refreshes using localStorage

Add logout

Protect authenticated routes

The normal login can remain mocked.

Frontend

Implement as much of the actual application UI as possible, including:

App shell

Navigation/sidebar/header

All major pages and routes implied by the requirements

Dashboard

Forms

Tables/lists

Cards

Modals/dialogs

Search/filter UI

Detail views

Create/edit flows

Empty states

Loading states

Error states

Responsive layouts

Useful hover/focus/active states

Use realistic dummy data so the application feels functional rather than looking like a static mockup.

Architecture

Keep things organized and maintainable.

Use a structure similar to:

src/
  components/
  pages/
  layouts/
  data/
  services/
  hooks/
  types/
  utils/


Do not over-engineer.

Keep mock data separate from UI components.

Where data is needed, use simple service functions so they can later be replaced with real API/database calls.

For example:

UI
 ↓
service
 ↓
mock data


Later this can become:

UI
 ↓
service
 ↓
API
 ↓
database

Important

Do not stop after creating a basic skeleton.

Build the complete frontend experience that can reasonably be built without a backend.

Make interactions work with mock data.

For example:

Buttons should do something.

Forms should have validation.

Navigation should work.

Filters/search should work where applicable.

Create/edit/delete interactions can update local/mock state.

Demo login should work end-to-end.

Do not fake backend functionality unnecessarily; clearly keep it local/mock.

Design

Make the UI feel like a real production application:

Clean spacing

Consistent typography

Consistent colors

Reusable components

Good hierarchy

Responsive behavior

Accessible controls

Sensible empty states

No unnecessary visual clutter

Follow the existing design/style if the project already has one.

Scope Control

You have permission to make the frontend changes necessary to complete the experience, but:

Do not modify unrelated infrastructure.

Do not add unnecessary packages.

Do not introduce a database.

Do not create a backend.

Do not spend time on features that require real external services.

Prefer simple solutions over elaborate architecture.

Before Coding

Briefly inspect the existing project and requirements.

Then implement the frontend.

Do not spend the entire task explaining what you plan to do — actually build it.

After Coding

Run the project/build and fix obvious errors.

Then provide a concise summary of:

What was implemented

Important files created/changed

What currently uses mock data

What remains for the backend/database phase

The single most useful next step 