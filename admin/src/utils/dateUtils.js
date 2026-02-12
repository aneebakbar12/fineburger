export const getPKTDate = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
};

export const getPKTRange = (rangeType) => {
    // Current time in PKT
    const now = new Date();

    // Create formatter to get PKT parts
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });

    // Parse PKT date parts
    const parts = fmt.formatToParts(now);
    const part = (type) => parseInt(parts.find(p => p.type === type).value);

    const year = part('year');
    const month = part('month') - 1; // 0-indexed
    const day = part('day');

    // Create a UTC date that matches the PKT time components
    // We will use this to calculate offsets, but simpler is to just use the timestamps

    // Easier approach: Get absolute timestamps for start/end of PKT day
    // 00:00 PKT is 19:00 UTC (previous day)

    // Let's construct the "Start of Day" in PKT (e.g. 2024-02-12 00:00:00 PKT)
    // We can allow the browser to parse it with the timezone
    // "2024-02-12T00:00:00+05:00"

    const pad = (n) => n.toString().padStart(2, '0');
    const isoDate = `${year}-${pad(month + 1)}-${pad(day)}`; // YYYY-MM-DD

    let startDate, endDate;

    // Helper to get Date object for YYYY-MM-DD HH:mm:ss+05:00
    const getPKTDateObj = (dateStr, timeStr) => {
        return new Date(`${dateStr}T${timeStr}+05:00`);
    };

    switch (rangeType) {
        case 'today':
            startDate = getPKTDateObj(isoDate, '00:00:00');
            endDate = getPKTDateObj(isoDate, '23:59:59.999');
            break;

        case 'week':
            // 7 days ago
            // We need to manipulate the date components safely
            const today = getPKTDateObj(isoDate, '00:00:00');
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            endDate = getPKTDateObj(isoDate, '23:59:59.999');
            break;

        case 'month':
            const thisMonthStart = `${year}-${pad(month + 1)}-01`;
            startDate = getPKTDateObj(thisMonthStart, '00:00:00');
            endDate = getPKTDateObj(isoDate, '23:59:59.999');
            break;

        case 'year':
            const thisYearStart = `${year}-01-01`;
            startDate = getPKTDateObj(thisYearStart, '00:00:00');
            endDate = getPKTDateObj(isoDate, '23:59:59.999');
            break;

        default:
            startDate = getPKTDateObj(isoDate, '00:00:00');
            endDate = getPKTDateObj(isoDate, '23:59:59.999');
    }

    return { startDate, endDate };
};

export const formatPKT = (date) => {
    if (!date) return '-';
    // Handle Firestore Timestamp
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString("en-PK", {
        timeZone: "Asia/Karachi",
        dateStyle: "medium",
        timeStyle: "short"
    });
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0
    }).format(amount);
};
