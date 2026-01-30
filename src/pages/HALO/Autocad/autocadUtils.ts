// AutoCAD Utilities ported from legacy project

// Declare global Acad object for TypeScript
declare global {
    interface Window {
        Acad: any;
    }
}

const pipe = (...fns: any[]) => (x: any) => fns.reduce((y, f) => f(y), x);

const getcoordinates = (list: number[]) => {
    return list.reduce((coordinate: any, value: any, index: number) => {
        return (index + 1) % 2
            ? coordinate
            : `${coordinate} ${list[index - 1]},${value},0`;
    }, '');
};

const removeLastEmptyString = (string: string) =>
    string.slice(-1) === ' ' ? string.slice(0, -1) : string;

const splitCodeByCurveto = (path: string) => path.split('C ');

const removeMoveto = (array: string[]) => array.slice(1);

const removeAllLastEmptyString = (array: string[]) =>
    array.map(removeLastEmptyString);

const separateEachCoordinate = (array: string[]) =>
    array.map(string => string.split(' '));

const insertEndpoint = (array: any[][]) =>
    array.reduce((total: any, value: any, index: number, array: any[]) => {
        const initTwoNextValues =
            (array[index + 1] || array[index]).slice(0, 2);
        return [...total, [...value, ...initTwoNextValues]];
    }, []);

const drawPath = (array: any[][]) => array.map(valueSvg =>
    window.Acad.Editor
        .executeCommand(`SPL M CV ${getcoordinates(valueSvg as any)} `)
);

export const getSvgPathCode = (renderRef: React.RefObject<HTMLDivElement>) => {
    if (!renderRef.current || !renderRef.current.children[0]) return [];
    const paths = renderRef.current.children[0].getElementsByTagName('path');
    return [...paths].map(x => x.getAttribute("d") || "");
};

export const rotateDrawingAutocad = (code: string[]) => {
    if (!code || code.length === 0) return;
    // Rotar dibujo | Draw rotate
    const baseRef = code[0].split(" ").slice(1, 3);
    const x = parseFloat(baseRef[0]);
    const y = parseFloat(baseRef[1]);
    const basePointForRotation = [
        `${x},${y}`,
        `${x + 1},${y}`
    ].join(' ');
    window.Acad.Editor.executeCommand(`SELECT ALL `);
    window.Acad.Editor.executeCommand(`MIRROR ${basePointForRotation} Y `, '');
};

// ENCADENAMIENTO PRINCIPAL | PRINCIPAL PIPELINE
export const drawSetOfPath = (path: string) => pipe(
    splitCodeByCurveto,
    removeMoveto,
    removeAllLastEmptyString,
    separateEachCoordinate,
    insertEndpoint,
    drawPath
)(path);
