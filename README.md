# AI-Chat-UI – README

## TL;DR 🚀

Next.js, FastAPI, EKS, LLM with Agentic LangGraph Text Summarizer

1. **Prerequisites**

   * Install [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/).
2. **Clone & Run**

   ```bash
   git clone https://github.com/thiago-allue/summarizer
   cd ai-chat-ui
   docker-compose up --build -d
   ```
3. **Access**
   Open your browser at [http://localhost:3000](http://localhost:3000).

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)

   1. [Prerequisites](#prerequisites)
   2. [Docker Compose Setup](#docker-compose-setup)
3. [Backend](#backend)
4. [Project Structure](#project-structure)
5. [File-by-File Breakdown](#file-by-file-breakdown)
6. [How It Works (High-Level)](#how-it-works-high-level)
7. [Deep Dive (Low-Level)](#deep-dive-low-level)
8. [Testing](#testing)
9. [Logging & Error Handling](#logging--error-handling)
10. [Contributing](#contributing)
11. [License](#license)

---

## Overview

This project implements a browser-based **Text Summarizer** UI built in Next.js and React, styled with Ant Design, that streams summaries from a backend endpoint. It allows users to adjust summary length, creativity (temperature), and output mode (paragraph or bullets). Docker and Docker Compose orchestrate the build and run steps in a containerized environment.

---

## Getting Started

### Prerequisites

* **Docker**: container runtime
* **Docker Compose**: multi-container orchestration

### Docker Compose Setup

Create a `docker-compose.yml` in the project root (see below), then run:

```bash
docker-compose up --build -d
```

This will:

* Build the Next.js app image via its `Dockerfile`
* Expose port **3000**
* Launch the container in detached mode

Access the UI at `http://localhost:3000`.

---

## Backend

The backend service exposes a single endpoint:

* **POST** `/stream_summary/`

  * **Request Body** (JSON):

    * `content` (*string*): The text to summarize.
    * `percent` (*number*): Desired summary length as a percentage of the original.
    * `bullets` (*boolean*): If `true`, returns bullet-point format; otherwise paragraph.
    * `temperature` (*number*): Controls randomness/creativity (0 to 1).
  * **Response**: A streamed HTTP response. Each chunk is a UTF-8 encoded string piece of the summary. Clients should read via `Response.body.getReader()` and `TextDecoder`.

The backend server should:

1. Validate incoming JSON and return HTTP 400 on invalid/missing fields.
2. Process summarization logic (e.g., using an AI model or algorithm).
3. Stream the resulting summary in real-time chunks.
4. Handle client aborts gracefully by terminating any ongoing processing.

Ensure the backend is running on `http://localhost:6677` before starting the frontend.

---

## Frontend Project Structure

```
ai-chat-ui/
├── docker-compose.yml
└── nextjs/
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── pages/
    │   ├── _app.js
    │   └── index.js
    ├── components/
    │   └── SummarizerPage.js
    ├── tests/
    │   └── summarizerPage.test.js
    └── patches.py
```

---

## File-by-File Breakdown

### docker-compose.yml

Defines the service orchestration:

* **nextjs** service: builds from `nextjs/Dockerfile`
* Maps port **3000**
* Mounts code for live rebuilds (optional)

```yaml
version: '3.8'
services:
  nextjs:
    build:
      context: ./nextjs
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    volumes:
      - ./nextjs:/app
    environment:
      - NODE_ENV=development
```

---

### nextjs/Dockerfile

Containerizes the Next.js app:

1. Uses **node:16** image
2. Installs dependencies
3. Builds production assets
4. Exposes port **3000**
5. Runs `npm start`

---

### nextjs/package.json

Lists all dependencies and scripts:

* **scripts**:

  * `dev`, `build`, `start`
  * added `test` for Jest
* **dependencies**: Next.js, React, AntD
* **devDependencies**: Transpiler, Jest, Testing Library

---

### nextjs/next.config.js

Configures Next.js:

* Enables **reactStrictMode**
* Uses **next-transpile-modules** to handle AntD ESM modules on SSR

---

### nextjs/pages/\_app.js

Root application wrapper:

* Imports Ant Design reset CSS
* Wraps every page in `ConfigProvider` for consistent theming

---

### nextjs/pages/index.js

Landing page loader:

* Dynamically imports `SummarizerPage` on the **client** only
* Avoids SSR ESM issues with AntD

---

### nextjs/components/SummarizerPage.js

Core UI component:

1. **State hooks** for input, summary, percent, creativity, mode, loading
2. **Refs** for scroll and abort control
3. **Word counters** for live feedback
4. `handleSummarize()`

   * Starts or aborts streaming fetch
   * Appends chunks to `summaryText`
   * Error handling and logging
5. `handleCopy()` to copy text to clipboard
6. **Layout**:

   * AntD `Layout`, `Row`, `Col`, `Slider`, `Radio`, `TextArea`, `Button`
   * Footer with evaluation credit

Comments:

* Each logical block is preceded by a concise, didactic comment
* JSDoc on component and helper functions

---

### nextjs/tests/summarizerPage.test.js

Unit tests via Jest & React Testing Library:

* Verifies rendering of heading and Summarize button
* Easily extensible for interaction testing


---

## How It Works (High-Level)

1. **User Input**: User pastes or types text.
2. **Parameter Selection**: Adjust summary length and creativity; choose bullets vs. paragraph.
3. **Stream Request**: Clicking “Summarize” sends a POST to `http://localhost:6677/stream_summary/`.
4. **Streaming Response**: Server returns chunks via SSE-like stream, appended live.
5. **Abort & Retry**: Hitting “Stop” aborts in-flight requests.
6. **Copy**: One-click copy of the final summary.

---

## Deep Dive (Low-Level)

* **State & Hooks**:

  * `useState` for all UI-controlled variables
  * `useRef` for imperative API (abort, scroll)
* **Fetch Streaming**:

  * `fetch` with `signal` from `AbortController`
  * `Response.body.getReader()` to read chunks
  * `TextDecoder` to convert bytes → string
* **Error Handling & Logging**:

  * `try/catch` around network calls
  * `console.error` for dev logging
  * User-facing `message.error` for recoverable issues
* **Styling**:

  * AntD components with inline style overrides
  * Responsive grid via `Row` and `Col`

---

## Testing

Run all unit tests:

```bash
docker-compose exec nextjs npm test
```

Or locally:

```bash
cd nextjs
npm test
```

---

## Logging & Error Handling

* **Console Logs**: Development-time logging for flow tracing
* **AntD Messages**: User-facing pop-ups for success and error states


---

Thanks for checking out AI-Chat-UI! We hope you find it useful for your text summarization needs. 
