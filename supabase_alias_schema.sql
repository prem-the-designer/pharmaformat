-- Create the drug_aliases table
CREATE TABLE drug_aliases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alias_term TEXT NOT NULL,
    language VARCHAR(10) NOT NULL, -- 'ko', 'ja', 'zh-cn', 'zh-tw'
    english_brand TEXT NOT NULL, -- Loose reference to drug_dictionary(brand) for flexibility
    generic_name TEXT, -- Captures generic name (optional or required depending on logic)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique alias per language to prevent duplicates
    UNIQUE(alias_term, language)
);

-- Enable Row Level Security
ALTER TABLE drug_aliases ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read (for formatting)
CREATE POLICY "Allow public read aliases" 
ON drug_aliases FOR SELECT 
USING (true);

-- Policy: Allow public insert (for importer MVP)
CREATE POLICY "Allow public insert aliases" 
ON drug_aliases FOR INSERT 
WITH CHECK (true);

-- Policy: Allow public update (required for upsert duplicates)
CREATE POLICY "Allow public update aliases" 
ON drug_aliases FOR UPDATE
USING (true)
WITH CHECK (true);
