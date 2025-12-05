# AI Development Rules for NexusTrade

This document outlines the technical stack and coding conventions for the NexusTrade application. Following these rules is mandatory to ensure code consistency, maintainability, and quality.

## Tech Stack

The application is built on a modern, efficient stack. Here are the core technologies:

-   **Framework**: React 19, bundled and served with Vite for a fast development experience.
-   **Language**: TypeScript is used for all frontend code to ensure type safety.
-   **Styling**: Tailwind CSS is the exclusive utility-first framework for all styling. A custom theme is configured in `index.html`.
-   **Routing**: React Router (`react-router-dom`) handles all client-side routing and navigation.
-   **Backend & Auth**: Supabase (`@supabase/supabase-js`) is used for user authentication and as the primary backend service.
-   **AI Engine**: Google Gemini (`@google/genai`) powers the core chart analysis feature.
-   **Icons**: Lucide React (`lucide-react`) is the sole library for all icons used in the UI.
-   **State Management**: Global state is managed using React's built-in Context API (e.g., `AuthContext`). Local state uses `useState`.

## Library Usage Rules

To maintain a clean and predictable codebase, adhere to the following library-specific rules:

### 1. Styling & UI Components

-   **Tailwind CSS is Mandatory**: All styling must be implemented using Tailwind CSS utility classes. Do not write separate `.css` files or use inline styles.
-   **Use `shadcn/ui` Components**: For any new UI elements (buttons, inputs, modals, etc.), you **must** use the pre-built components from the `shadcn/ui` library. Do not create custom components from scratch if a suitable `shadcn/ui` alternative exists.
-   **Global Styles**: The only place for custom global CSS is within the `<style>` tag in `index.html`. This should be reserved for base styles like fonts, scrollbars, or background effects.

### 2. Icons

-   **Lucide React Only**: All icons must be imported from the `lucide-react` package. Do not add any other icon libraries or use raw SVG files.

### 3. Routing

-   **Centralized Routes**: All page routes are defined and managed within `src/App.tsx`.
-   **Internal Navigation**: Use the `<Link>` component from `react-router-dom` for navigating between pages within the app.
-   **External Links**: Use the standard `<a>` tag for links that lead to external websites.

### 4. State Management

-   **Local State**: Use the `useState` and `useEffect` hooks for state that is confined to a single component.
-   **Global State**: Use the React Context API for state that needs to be shared across the application (e.g., user session). Follow the pattern established in `AuthContext` in `App.tsx`. Do not introduce libraries like Redux or Zustand.

### 5. Backend & Services

-   **Service Layer Abstraction**: All communication with Supabase (for auth, database, etc.) must be abstracted into service files located in the `src/services/` directory (e.g., `authService.ts`, `historyService.ts`).
-   **No Direct API Calls in Components**: Components should never call Supabase or any other API directly. They must always go through the defined service functions.

### 6. File Structure

-   **Pages**: All top-level page components must be placed in `src/pages/`.
-   **Components**: All reusable, shared components must be placed in `src/components/`.
-   **Services**: All business logic and API interactions must be in `src/services/`.
-   **Types**: All shared TypeScript types and interfaces must be in `src/types.ts`.
-   **Libraries**: Third-party library initializations (like the Supabase client) go in `src/lib/`.