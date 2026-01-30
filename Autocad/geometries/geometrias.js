// *** ⬛ ***
Acad.Editor.executeCommand("rectang", "7,0", "9,2");

// *** ⚪ ***
const radio = "1"; // radius
const centro = "11,1"; // center
Acad.Editor.executeCommand("circle", centro, radio);

// *** 🔺  ***
Acad.Editor.executeCommand("pline", "13,0", "14.1,2", "15.3,0", "c");

// *** ⧝ ***
// Soporte, support < ES15, :(
// 1. datos - data
var Ø = 0;
    x = [];
    y = [];
for (var i = 0; i <= 361; ++i) {
    x.push(Ø);
    y.push(Math.sin(Ø)); // sin(Ø)
    Ø = (i*Math.PI)/180; // ° -> rad
}
// 2. graficas - graphs
// 2.2 Infinito - infinity
Acad.Editor.executeCommand("pline");
// y+
for ( i = 0; i < x.length; i++) {
    Acad.Editor.executeCommand(x[i] + "," + y[i] , x[i+1] + "," + y[i+1] );
}
// y-
for ( i = x.length; i > 0; i--) {
    Acad.Editor.executeCommand(x[i] + "," + -y[i] , x[i-1] + "," + -y[i-1] );
}
Acad.Editor.executeCommand("c");
// 3. Arco -arch
Acad.Editor.executeCommand("arc", x[90] + "," + y[90] , x[180] + "," + 2, x[270] + "," + y[90] )