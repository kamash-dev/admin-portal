# 🎁 Remix Gifting Marketplace – Architecture & Scalability Overview
#1. Project Overview
This project is a multi-tenant gifting marketplace built using Remix where users can redeem reward points to purchase items such as gift cards, merchandise, vouchers, and other digital/physical rewards.
The platform is designed to be:
Multi-tenant (multiple clients/brands on the same codebase)
Theme-based (UI customization per tenant)
Module-based (features enabled/disabled per tenant)
Highly scalable & future-proof
This README explains the project structure, design decisions, and scalability approach for stakeholders and future developers.

# 2. Key Requirements We Are Solving
Technical
Single codebase for all tenants
Config-driven behavior (no hardcoding per tenant)
SEO-friendly & fast (Remix SSR)
Easy onboarding of new tenants

# 3. Why Remix?
We chose Remix because:
Built-in server-side rendering (SEO-friendly)
Strong nested routing (perfect for modules)
Server actions & loaders simplify data flow
Works well with multi-tenant architectures

# 4. High-Level Architecture
Client (Browser)
   ↓
Remix Routes (SSR + Actions)
   ↓
Tenant Resolver Middleware
   ↓
Module Layer (Gift Cards / Merch / etc.)
   ↓
API Layer / Services

# 5. Multi-Tenant Strategy
## 5.1 Tenant Identification
Tenants are NOT identified using domain or subdomain mapping.
The frontend does not rely on URL structure to resolve tenants.
Tenant identification is handled entirely via backend APIs, typically based on:
Auth token / session context
Request headers injected by backend or gateway
User–tenant association resolved server-side
The frontend simply calls the tenant configuration API and receives the resolved tenant context.
GET /tenant/config

```ts
getTenantFromRequest(request)
Example Data received from API
{
  tenantId: "tenantA",
  name: "Company A Rewards",
  theme: {
    primaryColor: "#0F172A",
    logoUrl: "..."
  },
  modules: {
    giftCards: true,
    merchandise: true,
    experiences: false
  },
  rules: {
    maxPointsPerOrder: 5000,
    allowPartialRedemption: true
  }
}   
``` 
## 5.2 Tenant Context (Frontend)
Once fetched, tenant data is stored in a request-scoped Tenant Context and reused across:
Loaders
Actions
UI components
This avoids repeated API calls and ensures consistency.

# 6. Project Folder Structure
```
/app
 ├── routes/                 # Remix routes (module-based)
 │   ├── _public/             # Login, onboarding
 │   ├── gift-cards/          # Gift card module
 │   ├── merchandise/         # Merchandise module
 │
 ├── modules/                 # Business logic per module
 │   ├── giftCards/
 │   ├── merchandise/
 │   └── points/
 │
 ├── services/                # API integrations (BE owned APIs)
 │   ├── tenant.server.ts     # Fetch tenant config
 │   ├── rewards.server.ts    # Rewards & points APIs
 │   └── orders.server.ts     # Order & redemption APIs
 │
 ├── context/                 # Runtime contexts
 │   └── tenant.context.tsx   # Tenant data provider
 │
 ├── themes/                  # Theme system (API driven)
 │   ├── base/
 │   └── applyTheme.ts
 │
 ├── utils/                   # Helpers & shared logic
 │   ├── permissions.ts
 │   └── constants.ts
 │
 ├── components/              # Reusable UI components
 │   ├── ui/
 │   └── layout/
 │
 └── root.tsx                 # App shell
```

# 7. Theme System (UI Customization)
Approach
Base theme tokens (colors, fonts, spacing)
Tenant-specific overrides
{
  primaryColor: "#0F172A",
  logoUrl: "/logos/tenantA.svg"
}
Themes are applied at:
Root layout (root.tsx)
Tailwind / CSS variables

# 8. Points Redemption Flow
User logs in
Points fetched via loader
User selects product
Validation:
Enough points
Tenant rules
Points deducted
Order created
This logic lives in service & module layers, not UI.

# 9. Scalability Strategy
Backend onboard new tenant internally Tenant is resolved via backend context (auth / headers)
Frontend automatically consumes tenant config
No domain, subdomain, or routing changes required
Backend exposes new tenant via API
Domain/subdomain mapped
Frontend auto-consumes configuration
No frontend code change required
10.2 Adding New Modules
Backend enables module flag
Frontend conditionally renders routes & UI
Module logic already isolated
10.3 Performance
Tenant config fetched once per request
Cached in memory / edge cache
Remix streaming SSR

# 10. Feature Flags (API-Driven, UI-Only)
Core Principle
Feature flags are fully controlled by Backend APIs.
Frontend does not evaluate, infer, or enforce business behavior using feature flags.
Feature flags are treated as read-only configuration for UI orchestration.
```
Feature Flags in Tenant Config (Backend Contract)
{
  "featureFlags": {
    "enableWishlist": true,
    "enableNewCheckout": false,
    "showPromoBanner": true
  }
}
```
Applying Feature Flags in UI (Allowed Usage)
Example: Conditional UI Component
```
export function WishlistButton() {
  const { featureFlags } = useTenant();

  if (!featureFlags[FEATURES.WISHLIST]) {
    return null;
  }

  return <button>Add to Wishlist</button>;
}
```
Example: Route-Level UI Orchestration
```
export default function GiftCardsPage() {
  const { featureFlags } = useTenant();

  return (
    <>
      {featureFlags[FEATURES.PROMO_BANNER] && <PromoBanner />}
      <GiftCardsList />
    </>
  );
}
```
# 11. Tenant Context (Runtime Storage)
```
export type TenantContextType = {
  tenantId: string;
  name: string;
  modules: Record<string, boolean>;
  featureFlags: Record<string, boolean>;
  theme: Record<string, string>;
};
```
Tenant context is populated once per request and reused across the app.
```
Feature Flag Constants
export const FEATURES = {
  WISHLIST: "enableWishlist",
  NEW_CHECKOUT: "enableNewCheckout",
  PROMO_BANNER: "showPromoBanner",
};
```

# 12. API Integration
```
tenant.server.ts
export async function fetchTenantConfig(request: Request) {
  const response = await fetch(`${API_BASE}/tenant/config`, {
    headers: {
      Authorization: request.headers.get("Authorization") || "",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load tenant configuration");
  }

  return response.json();
}

root.tsx
import { TenantProvider } from "@/context/tenant.context";
import { applyTheme } from "@/themes/applyTheme";
import { fetchTenantConfig } from "@/utils/tenant.server";

export async function loader({ request }: { request: Request }) {
  const tenant = await fetchTenantConfig(request);
  return tenant;
}

export default function App({ loaderData }: any) {
  applyTheme(loaderData.theme);

  return (
    <TenantProvider tenant={loaderData}>
      {/* app layout */}
    </TenantProvider>
  );
}

```

# 13. Google Tag Manager
Tenant’s analytics configuration can be from backend APIs.
```
{
  "tenantId": "tenantA",
  "analytics": {
    "gtm": {
      "enabled": true,
      "containerId": "GTM-AAAA111"
    },
    "newRelic": {
      "enabled": true,
      "appId": "NR_APP_001",
      "accountId": "NR_ACCOUNT_001",
      "licenseKey": "XXXX"
    }
  }
}

export function initGTM(containerId: string) {
  if (window.dataLayer) return;

  window.dataLayer = window.dataLayer || [];
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  script.async = true;
  document.head.appendChild(script);
}
```
# 14. New Relic 
```
export function initNewRelic(config: NewRelicConfig) {
  if (window.newrelic) return;

  window.newrelic = {
    applicationID: config.appId,
    accountID: config.accountId,
    licenseKey: config.licenseKey
  };
}
```

# Example Implementation

```
/app
├── routes/
│   ├── _public/
│   │   └── login.tsx
│   ├── products/
│   │   └── _index.tsx
│   └── logout.tsx
│
├── services/
│   ├── auth.server.ts
│   ├── products.server.ts
│   ├── tenant.server.ts
│   ├── conversionRates.server.ts
│   └── session.server.ts
│
├── context/
│   └── tenant.context.tsx
│
├── themes/
│   ├── base/
│   │   └── index.css
│   └── applyTheme.ts
│
├── utils/
│   ├── apiFetch.server.ts
│   ├── permissions.ts
│   ├── constants.ts
│   └── featureFlags.ts
│
├── components/
│   ├── ui/
│   │   └── Card.tsx
│   └── layout/
│       └── AppLayout.tsx
│
└── root.tsx
```

## Auth & Session
```
services/auth.server.ts
export async function loginUser(payload: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${process.env.BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("Login failed");
  return res.json();
}
```

```
import { createCookie } from "@remix-run/node";

export const sessionCookie = createCookie("session", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/"
});

export async function createSession(data: { accessToken: string }) {
  return sessionCookie.serialize(data);
}

export async function getAccessToken(request: Request) {
  const cookie = request.headers.get("Cookie");
  const session = await sessionCookie.parse(cookie);
  return session?.accessToken;
}
```

## Global API Fetch 
```
utils/apiFetch.server.ts
import { getAccessToken } from "@/services/session.server";

export async function apiFetch(
  request: Request,
  url: string,
  options: RequestInit = {}
) {
  const token = await getAccessToken(request);

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token && { Authorization: `Bearer ${token}` }),
      "x-locale": request.headers.get("x-locale") || "en"
    }
  });
}
```

## Tenant Config
```
services/tenant.server.ts
import { apiFetch } from "@/utils/apiFetch.server";

export async function getTenantConfig(request: Request) {
  const res = await apiFetch(
    request,
    `${process.env.BASE_URL}/tenant/config`
  );
  return res.json();
}
```

## Products (Gift Cards + Merchandise, etc)
```
services/products.server.ts
import { apiFetch } from "@/utils/apiFetch.server";

export async function getProducts(
  request: Request,
  params: { type: "giftcard" | "merchandise" }
) {
  const query = new URLSearchParams(params).toString();
  const res = await apiFetch(
    request,
    `${process.env.BASE_URL}/products?${query}`
  );
  return res.json();
}
```

## Tenant Context
```
context/tenant.context.tsx
import { createContext, useContext } from "react";

export const TenantContext = createContext<any>(null);

export const useTenant = () => useContext(TenantContext);
```

## Root Loader (Single Source of Truth)
```
root.tsx
import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { getTenantConfig } from "@/services/tenant.server";
import { TenantContext } from "@/context/tenant.context";

export const loader = async ({ request }) => {
  const tenant = await getTenantConfig(request);

  return json({
    tenant,
    featureFlags: tenant.featureFlags,
    theme: tenant.theme
  });
};

export default function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <TenantContext.Provider value={data}>
      <Outlet />
    </TenantContext.Provider>
  );
}
```

## Login Route
```
routes/_public/login.tsx
import { Form } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { loginUser } from "@/services/auth.server";
import { createSession } from "@/services/session.server";

export const action = async ({ request }) => {
  const form = await request.formData();

  const auth = await loginUser({
    email: form.get("email"),
    password: form.get("password")
  });

  return redirect("/", {
    headers: {
      "Set-Cookie": await createSession(auth)
    }
  });
};

export default function Login() {
  return (
    <Form method="post">
      <input name="email" />
      <input name="password" type="password" />
      <button>Login</button>
    </Form>
  );
}
```

### Logout
```
routes/logout.tsx
import { redirect } from "@remix-run/node";
import { sessionCookie } from "@/services/session.server";

export const action = async () =>
  redirect("/login", {
    headers: {
      "Set-Cookie": await sessionCookie.serialize(null, { maxAge: 0 })
    }
  });
```

## UI Component Example
```
components/ui/Card.tsx
export function Card({ children }) {
  return <div className="rounded-xl shadow p-4">{children}</div>;
}
```

## Security Guarantees
| Threat  | Mitigation |
| ------------- | ------------- |
| XSS  | HttpOnly cookie  |
| CSRF  | SameSite=Lax  |