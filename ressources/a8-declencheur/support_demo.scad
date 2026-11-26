// =====================================================================
//  P11 · A8 — Situation déclenchante : support à main en fourche
//  R.Blanchard, professeur de Technologie
//
//  La fourche tient l'axe de la turbine sous le jet du robinet.
//  Encoches ouvertes vers le haut et fermées côté extérieur : l'axe se pose,
//  ne glisse pas sur le côté, et l'on échange A et B (chacune sur son axe)
//  en 5 secondes. Paliers lisses : la turbine tourne sur son axe.
//  Le même support sert pour A et B.
//
//  Export : openscad --backend=manifold -o support_demo.stl support_demo.scad
//  Impression à plat, telle qu'elle est utilisée, SANS support.
// =====================================================================

/* [Accord avec turbine_demo.scad] */
diametre_turbine = 60;
hauteur_turbine  = 20;
diametre_axe     = 4;      // même valeur que dans turbine_demo.scad
jeu_encoche      = 0.5;    // jeu de l'axe dans l'encoche

/* [Fourche] */
jeu_lateral      = 3;      // jeu de chaque côté de la turbine, entre les bras
largeur_bras     = 9;      // épaisseur d'un bras (direction de l'axe)
paroi_ext        = 2;      // fond de l'encoche, côté extérieur : bloque l'axe
hauteur          = 14;     // hauteur de la fourche (épaisseur d'impression)
z_axe            = 7;      // hauteur du centre de l'axe
garde            = 8;      // distance entre le bord de la turbine et la traverse
traverse         = 10;

/* [Poignée] */
long_poignee     = 110;
larg_poignee     = 24;
trou_accroche    = 6;      // trou pour suspendre le support (0 = aucun)

/* [Axes imprimés (facultatif)] */
imprimer_axes    = true;   // deux axes en PLA, un par turbine (sinon : tige M4, rond de 4...)

$fn = 64;

// ---------- grandeurs dérivées ----------
ecart   = hauteur_turbine + 2*jeu_lateral;           // écart intérieur entre les bras
Y_tot   = ecart + 2*largeur_bras;
x_axe   = traverse + diametre_turbine/2 + garde;     // position de l'axe depuis le dos de la traverse
L_bras  = x_axe + 8;                                 // le bras dépasse l'axe de 8 mm
l_encoche = diametre_axe + jeu_encoche;
L_axe   = ecart + 2*(largeur_bras - paroi_ext) - 1;  // longueur d'axe à couper ou à imprimer

echo(str("Longueur d'axe à prévoir : ", L_axe, " mm (diamètre ", diametre_axe, " mm), une par turbine"));
assert(z_axe + diametre_axe/2 < hauteur, "axe trop haut");

module arrondi2d(l, w, r) { offset(r) offset(-r) square([l, w]); }

module poignee() {
    // chanfrein de 1,5 mm sur les arêtes : enveloppe de deux plaques
    hull() {
        translate([0, 0, 1.5]) linear_extrude(hauteur - 3) arrondi2d(long_poignee, larg_poignee, larg_poignee/2 - 0.01);
        translate([1.5, 1.5, 0]) linear_extrude(hauteur) arrondi2d(long_poignee - 3, larg_poignee - 3, larg_poignee/2 - 1.51);
    }
}

module fourche() {
    difference() {
        union() {
            // traverse + deux bras (U)
            translate([0, -Y_tot/2, 0]) cube([traverse, Y_tot, hauteur]);
            for (s = [-1, 1])
                translate([0, s > 0 ? ecart/2 : -ecart/2 - largeur_bras, 0])
                    linear_extrude(hauteur) arrondi2d(L_bras, largeur_bras, largeur_bras/2 - 0.01);
            // poignée, dans l'axe, derrière la traverse
            translate([-long_poignee + 4, -larg_poignee/2, 0]) poignee();
        }
        // encoches : ouvertes vers le haut, fermées côté extérieur
        for (s = [-1, 1]) {
            y0 = s > 0 ? ecart/2 - 1 : -ecart/2 - largeur_bras + paroi_ext;
            translate([x_axe, y0, z_axe]) {
                rotate([-90, 0, 0]) cylinder(d = l_encoche, h = largeur_bras - paroi_ext + 1);
                translate([-l_encoche/2, 0, 0]) cube([l_encoche, largeur_bras - paroi_ext + 1, hauteur]);
                // entrée évasée pour poser l'axe à l'aveugle
                translate([0, 0, hauteur - z_axe - 2])
                    hull() {
                        translate([-l_encoche/2, 0, 0]) cube([l_encoche, largeur_bras - paroi_ext + 1, 0.01]);
                        translate([-l_encoche/2 - 2.5, 0, 2.5]) cube([l_encoche + 5, largeur_bras - paroi_ext + 1, 0.01]);
                    }
            }
        }
        // trou d'accroche au bout de la poignée
        if (trou_accroche > 0)
            translate([-long_poignee + 4 + larg_poignee/2, 0, -1]) cylinder(d = trou_accroche, h = hauteur + 2);
    }
}

module axe_imprime() {   // couché, avec un méplat de 0,4 mm pour tenir sur le plateau
    difference() {
        translate([0, 0, diametre_axe/2 - 0.4]) rotate([0, 90, 0]) cylinder(d = diametre_axe, h = L_axe);
        translate([-1, -diametre_axe, -diametre_axe]) cube([L_axe + 2, 2*diametre_axe, diametre_axe]);
    }
}

fourche();
if (imprimer_axes)
    for (k = [0, 1]) translate([-long_poignee + 10, Y_tot/2 + 8 + k*(diametre_axe + 6), 0]) axe_imprime();
