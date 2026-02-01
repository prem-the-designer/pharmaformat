# Product Release Notes - PharmaFormat

PharmaFormat is a powerful, agentic AI-driven solution designed to streamline the formatting of drug names and manage pharmaceutical terminology with precision. This release introduces a comprehensive suite of features for finding, managing, and formatting drug information.

## Key Features

### 1. Intelligent Drug Name Formatting
*   **Automatic Capitalization**: Instantly detects known brand names (from the user-managed dictionary) and converts them to the correct casing (e.g., "keytruda" -> "Keytruda").
*   **Generic Name Recognition**: Identifies generic names (e.g., "pembrolizumab") and automatically suggests or formats them according to the dictionary rules (e.g., "Keytruda (pembrolizumab)").
*   **Flexible Casing Support**: Respects the exact casing input by the user for brand names, ensuring the dictionary reflects preferred styles (e.g., "Tagrisso" vs "TAGRISSO").
*   **Text Tokenization**: Parses input text to identify known drugs, unknowns, and standard text, applying distinct visual styling to each.

### 2. Suggestion & Detection System
*   **Unknown Drug Detection**: Highlights potential drug names that are not yet in the dictionary (Visualized with yellow/orange underscores).
*   **Smart Suggestions ("Did you mean?")**: Uses fuzzy matching (Levenshtein distance) to detect typos and suggest likely matches from the existing dictionary.
*   **Effectively Handles Formatted Text**: Smartly detects if a drug is already formatted (e.g., "Stelara (Ustekinumab)") to prevent redundant alerts.
*   **Dynamic Status Panel**:
    *   **"Drug Detected"**: Confirms when highlighted text is a known entity.
    *   **"Unknown Drug"**: Prompts action for unrecognized terms.
*   **Google Search Integration**: One-click Google search directly from the panel to verify unknown drug names.
*   **Manual Highlight**: Allows users to manually select any text to check against the dictionary or add it as a new entry.

### 3. Advanced Dictionary Management
*   **Add, Edit, & Delete**: Full CRUD (Create, Read, Update, Delete) capabilities for managing the drug database.
*   **Bulk Import (JSON)**:
    *   Drag-and-drop or select a JSON file to bulk upload drug entries.
    *   **Smart Analysis**: Pre-scans the file to detect new vs. duplicate entries before importing.
    *   **Import Preview Modal**: definitive confirmation step showing a summary of the import action.
*   **Pagination**: Efficiently handles large lists with 10, 20, 30, or 50 items per page.
*   **Sticky Search & Add**: The add/search header remains visible while scrolling the list.
*   **Safe Deletion**: "Are you sure?" confirmation modals to prevent accidental data loss.

### 4. Optimized User Interface (UI/UX)
*   **Modern Aesthetics**: Clean, glassmorphism-inspired design with a professional blue/indigo palette using Tailwind CSS.
*   **Fixed Overlay Panels**: The suggestion panel is engineered as a `fixed` overlay (using React Portals) to prevent layout shifts or scrolling issues in the output window.
*   **Toast Notifications**:
    *   **Global Timeout**: All notifications auto-dismiss after **5 seconds**.
    *   **Rich Styling**: "Green" for success, "Orange" for warnings, and **"Red"** for critical actions (Deletion).
    *   **Undo Capability**: One-click "Undo" to restore accidentally deleted items.
*   **Custom Branding**:
    *   **"PHARMAT" Logo**: Distinctive text logo using the **Montserrat** font family.
    *   **Responsive Header**: Adjusts to fit logo sizing without layout breakage.

### 5. Robust Architecture
*   **Supabase Database**: Integrated with Supabase for scalable, persistent storage of dictionary data.
*   **Row Level Security (RLS)**: Configured database policies to ensure secure data access.
*   **React + Vite**: Built on a modern, high-performance frontend stack for instant feedback.

## Usage Guide
1.  **Formatter Tab**: Paste medical text to see instant formatting and detection. Click highlighted terms to Accept, Ignore, or Add them.
2.  **Dictionary Tab**: Curated list of drugs. Use the top form to add single entries or the "Bulk Import" button for large datasets.

---
*Built with React, Tailwind CSS, and Supabase.*
