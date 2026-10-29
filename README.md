# VOGUÉE — Fashion Store

A responsive fashion storefront built with React, Vite, TypeScript, Tailwind CSS, React Router, Lucide, and optional Supabase authentication. Product browsing, cart, and wishlist work as a demo without a backend; cart and wishlist are saved in the browser.

## Run locally

```sh
npm install
npm run dev
```

Use `npm run build` to create the production bundle and `npm run lint` to run Oxlint.

## Supabase authentication (optional)

Copy `.env.example` to `.env.local` and set the project URL and public anon key:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Restart Vite after changing environment variables. Enable email authentication in the Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor. The schema stores orders with row-level security so a signed-in customer can only access their own orders. The app only presents a signed-in account after Supabase returns a real session. Without these values, sign-in and registration clearly stay in demo mode.

Checkout remains a demo and does not collect payment. Signed-in customers with the schema configured can save demo orders to Supabase and view recent orders in their account; guests get a local-only confirmation. Contact and newsletter forms do not send personal details to a server. Configure a payment provider and production order workflow before accepting real orders.

## Deploy

Import the repository into Vercel and use the Vite defaults (`npm run build`, output directory `dist`). Add the Supabase variables in the Vercel project settings if authentication is enabled. `vercel.json` routes client-side pages back to the app entry point.

Product photography is loaded from Unsplash. A production launch should use licensed, optimized image assets and configure the Supabase Auth redirect URLs for its deployed domain.
