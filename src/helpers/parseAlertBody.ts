/**
 * Parses the raw alert body string into a structured, user-friendly object.
 *
 * Input body example:
 *   "Alert ID: 1334\nStatus: Active\nType: Motion Detection\nArea: Beta Sub Area\n
 *    Sensor: test sensor halo\nMessage: Source Type: External | Event Source: Motion | Value:590 | Threshold:200"
 */

export interface ParsedAlertBody {
    alertId?: string;
    status?: string;
    area?: string;
    sensor?: string;
    eventType?: string;   // e.g. "Motion Detection"
    sourceType?: string;  // e.g. "External"
    eventSource?: string; // e.g. "Motion"
    value?: string;
    threshold?: string;
    unit?: string;        // detected from event source e.g. "mm/100", "ug/m³"
    raw: string;          // original body, kept as fallback
}

/** Extract a named field value from a pipe-separated key:value string */
function extractPipe(str: string, key: string): string | undefined {
    const regex = new RegExp(`${key}:\\s*([^|\\n]+)`, 'i');
    const match = str.match(regex);
    return match?.[1]?.trim() || undefined;
}

/** Extract a named field value from a newline-separated key: value string */
function extractLine(str: string, key: string): string | undefined {
    const regex = new RegExp(`^${key}:\\s*(.+)$`, 'im');
    const match = str.match(regex);
    return match?.[1]?.trim() || undefined;
}

export function parseAlertBody(body: string): ParsedAlertBody {
    if (!body || typeof body !== 'string') return { raw: body ?? '' };

    const alertId = extractLine(body, 'Alert ID');
    const status = extractLine(body, 'Status');
    const eventType = extractLine(body, 'Type');
    const area = extractLine(body, 'Area');
    const sensor = extractLine(body, 'Sensor');

    // The "Message" line contains pipe-separated sub-fields
    const msgMatch = body.match(/Message:\s*([\s\S]+)/);
    const messageStr = msgMatch?.[1] ?? '';

    const sourceType = extractPipe(messageStr, 'Source Type');
    const rawEventSrc = extractPipe(messageStr, 'Event Source');

    // Event Source may include a unit in parentheses: "PM10 (10 um particles)" or "Move (mm/100)"
    let eventSource = rawEventSrc;
    let unit: string | undefined;
    if (rawEventSrc) {
        const unitMatch = rawEventSrc.match(/\(([^)]+)\)/);
        if (unitMatch) {
            unit = unitMatch[1].trim();
            eventSource = rawEventSrc.replace(unitMatch[0], '').trim();
        }
    }

    const value = extractPipe(messageStr, 'Value');
    const threshold = extractPipe(messageStr, 'Threshold');

    return {
        alertId,
        status,
        eventType,
        area,
        sensor,
        sourceType,
        eventSource,
        unit,
        value,
        threshold,
        raw: body,
    };
}
