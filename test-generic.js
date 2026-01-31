import { formatTextSafe } from './src/utils/formatter.js';

const dictionary = {
    "darzalex faspro": "daratumumab and hyaluronidase-fihj",
    "keytruda": "pembrolizumab",
    "opdivo": "nivolumab"
};

const tests = [
    {
        name: "Brand Match",
        input: "Start keytruda treatment.",
        expected: "Start KEYTRUDA (Pembrolizumab) treatment."
    },
    {
        name: "Generic Match",
        input: "Start pembrolizumab treatment.",
        expected: "Start KEYTRUDA (Pembrolizumab) treatment."
    },
    {
        name: "Generic Match (Different Case)",
        input: "Start Pembrolizumab treatment.",
        expected: "Start KEYTRUDA (Pembrolizumab) treatment."
    },
    {
        name: "Already Formatted Brand",
        input: "KEYTRUDA (Pembrolizumab) is good.",
        expected: "KEYTRUDA (Pembrolizumab) is good."
    },
    {
        name: "Weird Double Input (Generic + Suffix)",
        // "pembrolizumab (Pembrolizumab)" -> Should become "KEYTRUDA (Pembrolizumab)"?
        // The code logic: match="pembrolizumab", suffix=" (Pembrolizumab)". 
        // Detects suffix. Returns formattedBrand ("KEYTRUDA"). Results in "KEYTRUDA (Pembrolizumab)". Correct.
        input: "pembrolizumab (Pembrolizumab) was administered.",
        expected: "KEYTRUDA (Pembrolizumab) was administered."
    }
];

let failed = 0;

console.log("Running Generic Name Tests...\n");

tests.forEach((t, i) => {
    const result = formatTextSafe(t.input, dictionary);
    if (result !== t.expected) {
        console.error(`[FAIL] ${t.name}`);
        console.error(`  Input:    ${t.input}`);
        console.error(`  Expected: ${t.expected}`);
        console.error(`  Actual:   ${result}\n`);
        failed++;
    } else {
        console.log(`[PASS] ${t.name}`);
    }
});

if (failed === 0) {
    console.log("\nAll generic tests passed!");
} else {
    console.log(`\n${failed} tests failed.`);
    process.exit(1);
}
