/**
 * Shared 80mm thermal printer stylesheet for high-density, crisp thermal printing
 * Applied across Customer Bills, Kitchen (KOT) Tokens, and Shift Closing Slips
 */
export const THERMAL_80MM_BASE_CSS = `
    @page { size: 80mm auto; margin: 0; }
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    body {
        font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
        width: 72mm;
        max-width: 72mm;
        margin: 0 auto;
        padding: 3mm 1mm 6mm;
        background: #ffffff;
        font-size: 14px;
        font-weight: 800;
        line-height: 1.35;
        -webkit-text-stroke: 0.2px #000000;
        text-rendering: optimizeLegibility;
    }
    @media print { .no-print { display: none !important; } }
`;
