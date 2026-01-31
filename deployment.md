# Deployment & Architecture Guide

## 1. Deployment (Client-Side Static Build)

Since **PharmaFormat** is a React Single Page Application (SPA), it can be deployed to any static hosting provider.

### Build Steps
1.  Open your terminal in the project folder.
2.  Run the build command:
    ```bash
    npm run build
    ```
3.  This creates a `dist/` folder containing your optimized website (HTML, CSS, JS).

### Hosting Options

#### Option A: Vercel / Netlify (Recommended for Subdomains)
These platforms are easiest for setting up subdomains (e.g., `app.yourdomain.com`).

**Steps (Vercel):**
1.  Push your code to a GitHub repository.
2.  Log in to [Vercel](https://vercel.com/) and click "Add New Project".
3.  Import your GitHub repository.
4.  Vercel detects Vite automatically. Click **Deploy**.
5.  **Domain Setup**: Go to Settings > Domains and add your subdomain (e.g., `pharma.example.com`). Follow the DNS instructions (usually adding a CNAME record).

#### Option B: Traditional Web Server (cPanel/Apache/Nginx)
1.  Upload the **contents** of the `dist/` folder to your server's public html folder (e.g., `public_html/subdomain`).
2.  **Important**: For SPAs, you must configure the server to redirect 404s to `index.html` so that refreshing the page works.
    -   **Apache**: Create a `.htaccess` file in the folder:
        ```apache
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
        ```

---

## 2. Database vs. File Storage

You asked about storing the dictionary "inside the coding files" vs "inside the database".

| Feature | Coding Files (JSON) | Database (Supabase/Firebase) |
| :--- | :--- | :--- |
| **Setup Difficulty** | Very Easy | Moderate |
| **Sharing** | No (Updates require redeploy) | **Yes** (Real-time sync for all users) |
| **Persistence** | Codebase + LocalStorage | Cloud Database |
| **Ideal For** | Personal / Solo Admin | **Teams / Collaborative** |

### **Recommendation**
If this app is for a **team** of medical writers, you **MUST** use a Database.
*Why?* If User A adds "NewDrug", User B will not see it if you only use LocalStorage/Files. A database ensures everyone shares the same dictionary "Source of Truth".

### **Steps to Integrate a Database (Supabase Example)**

I recommend **Supabase** (free tier is excellent, uses PostgreSQL).

#### Phase 1: Setup Supabase
1.  Create project at [supabase.com](https://supabase.com).
2.  Create a table `dictionary`:
    -   `id`: uuid (primary key)
    -   `brand`: text (unique)
    -   `generic`: text
    -   `created_at`: timestamp
3.  Get your **API URL** and **ANON KEY**.

#### Phase 2: Connect in Code
1.  Install SDK: `npm install @supabase/supabase-js`
2.  Create `src/supabaseClient.js`:
    ```javascript
    import { createClient } from '@supabase/supabase-js'
    const supabaseUrl = 'YOUR_SUPABASE_URL'
    const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
    export const supabase = createClient(supabaseUrl, supabaseKey)
    ```

#### Phase 3: Update `DictionaryContext.jsx`
Replace the `localStorage` logic with Supabase calls.

**Example `useEffect` for loading:**
```javascript
useEffect(() => {
    async function load() {
        // Fetch from DB
        const { data, error } = await supabase.from('dictionary').select('*');
        if (data) {
            // Convert array to our Object format
            const dict = {};
            data.forEach(row => { 
                dict[row.brand.toLowerCase()] = { brand: row.brand, generic: row.generic } 
            });
            setDictionary(dict);
        }
    }
    load();
}, []);
```

**Example `addEntry`:**
```javascript
const addEntry = async (brand, generic) => {
    // 1. Optimistic Update (update UI immediately)
    // ... code to update state ...

    // 2. Persist to DB
    const { error } = await supabase
        .from('dictionary')
        .upsert({ brand, generic }, { onConflict: 'brand' });
};
```

### Summary
1.  **Deploy** the current version to Vercel/Netlify to test the UI immediately.
2.  **Plan** the Database migration if you need multi-user sharing. I can implement the Supabase integration code for you if you provide the credentials or ask me to mock it.
