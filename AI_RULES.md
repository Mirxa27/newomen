# AI Development Rules & Tech Stack

This document outlines the core technologies used in the Newomen application and provides strict rules for which libraries to use for specific functionalities. Following these guidelines is essential for maintaining code consistency, performance, and maintainability.

## 🚀 Tech Stack

The application is built on a modern, type-safe, and performant stack:

-   **Framework**: React 18 with Vite for a fast development experience and optimized builds.
-   **Language**: TypeScript for robust type-safety and improved developer experience.
-   **Backend**: Supabase serves as the all-in-one backend, providing the database (PostgreSQL), authentication, storage, and serverless Edge Functions.
-   **Styling**: Tailwind CSS is used exclusively for styling, following a utility-first approach.
-   **UI Components**: We use **shadcn/ui**, a collection of beautifully designed components built on top of Radix UI for accessibility and functionality.
-   **Data Fetching & Server State**: TanStack React Query handles all server state management, including data fetching, caching, and synchronization with the Supabase backend.
-   **Forms**: React Hook Form is used for managing form state and validation, paired with Zod for schema definition.
-   **Routing**: React Router is used for all client-side navigation.
-   **Icons**: `lucide-react` provides a comprehensive and consistent set of icons.
-   **Notifications**: `sonner` is used for toast notifications.

## 📋 Library Usage Rules

To maintain consistency, please adhere to the following library choices for specific tasks. **Do not introduce new libraries for these purposes without discussion.**

### 1. UI Components
-   **Rule**: Use pre-built **shadcn/ui** components from `@/components/ui` for all standard UI elements (Buttons, Cards, Dialogs, Forms, etc.).
-   **Reasoning**: This ensures a consistent design system, accessibility, and reusability. These components are built on Radix UI, so you get headless functionality and accessibility out of the box.

### 2. Styling
-   **Rule**: All styling **must** be done using **Tailwind CSS** utility classes. Use the `cn()` utility from `@/lib/utils` to merge classes conditionally.
-   **Reasoning**: A utility-first approach keeps styling co-located with the markup, making components self-contained and easier to maintain. Custom CSS in `src/index.css` is reserved for base styles, theme variables, and complex global animations.

### 3. State Management
-   **Rule**: Use **TanStack React Query** for managing server state (fetching, caching, updating data from Supabase). For local/client-side state, use React's built-in hooks (`useState`, `useReducer`, `useContext`).
-   **Reasoning**: This separates server cache from client state, simplifying logic and eliminating the need for a global state management library like Redux or Zustand.

### 4. Forms
-   **Rule**: All forms **must** be built using **React Hook Form** for logic and **Zod** for schema validation.
-   **Reasoning**: This combination provides a powerful, performant, and type-safe way to handle forms. Integrate with shadcn/ui's `<Form />` component for seamless styling.

### 5. Backend & Database
-   **Rule**: All backend operations (authentication, database queries, storage) **must** use the **Supabase** client from `@/integrations/supabase/client`.
-   **Reasoning**: This centralizes all backend interactions and leverages Supabase's powerful features, including real-time updates and Row Level Security.

### 6. Icons
-   **Rule**: Use icons exclusively from the **`lucide-react`** package.
-   **Reasoning**: This ensures a consistent and high-quality icon set across the entire application.

### 7. Notifications (Toasts)
-   **Rule**: For toast notifications, use the `toast()` function from the **`sonner`** library.
-   **Reasoning**: Sonner is already integrated and provides a simple, elegant API for creating beautiful, non-intrusive notifications.

### 8. Routing
-   **Rule**: All client-side routing **must** be handled by **React Router**. Define all routes in `src/App.tsx`.
-   **Reasoning**: This is the standard for React applications and is already fully configured for the project, including protected and admin routes.