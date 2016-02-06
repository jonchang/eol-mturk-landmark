function check(obj) {
    acc = [];
    if ((obj.D1 && obj.D1[0]) > (obj.D4 && obj.D4[0])) acc.push("D4 is to the left of D1, are they switched around?");
    if ((obj.A1 && obj.A1[0]) > (obj.A4 && obj.A4[0])) acc.push("A4 is to the left of A1, are they switched around?");
    if ((obj.E1 && obj.E1[0]) > (obj.E2 && obj.E2[0])) acc.push("E2 is to the left of E1, are they switched around?");
    if ((obj.C5 && obj.C5[0]) > (obj.C6 && obj.C6[0])) acc.push("C6 is to the left of C5, are they switched around?");
    if ((obj.J1 && obj.J1[0]) > (obj.J2 && obj.J2[0])) acc.push("J2 is to the left of J1, are they switched around?");
    if ((obj.C1 && obj.C1[0]) > (obj.C2 && obj.C2[0])) acc.push("C2 is to the left of C1, are they switched around?");
    if ((obj.C1 && obj.C1[1]) > (obj.C4 && obj.C4[1])) acc.push("C4 is above C1, are they switched around?");
    if ((obj.C2 && obj.C2[1]) > (obj.C3 && obj.C3[1])) acc.push("C3 is above C2, are they switched around?");
    if ((obj.C5 && obj.C5[1]) > (obj.C4 && obj.C4[1])) acc.push("C4 is above C5, are they switched around?");
    if ((obj.C1 && obj.C1[1]) > (obj.C5 && obj.C5[1])) acc.push("C5 is above C1, are they switched around?");
    if ((obj.C3 && obj.C3[1]) < (obj.C6 && obj.C6[1])) acc.push("C3 is above C6, are they switched around?");
    if ((obj.C6 && obj.C6[1]) < (obj.C2 && obj.C2[1])) acc.push("C6 is above C2, are they switched around?");
    if ((obj.O5 && obj.O5[1]) < (obj.O4 && obj.O4[1])) acc.push("O5 is above O4, are they switched around?");
    if ((obj.O2 && obj.O2[1]) < (obj.O1 && obj.O1[1])) acc.push("O2 is above O1, are they switched around?");
    if (obj.V1 && obj.J1 && obj.C5) {
        var bd = Math.sqrt(Math.pow(obj.V1[0][0] - obj.V1[1][0], 2) + Math.pow(obj.V1[0][1] - obj.V1[1][1], 2))
        var sl = Math.sqrt(Math.pow(obj.J1[0] - obj.C5[0], 2) + Math.pow(obj.J1[1] - obj.C5[1], 2));
        if (bd > sl) acc.push("The body depth (V1) is greater than the body length (J1-C5), is this correct?");
    }
    return acc;
}
