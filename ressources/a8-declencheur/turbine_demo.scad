// =====================================================================
//  P11 · A8 — Situation déclenchante « Le choix de la matière »
//  Turbines de démonstration A et B (même aspect, masses différentes)
//  R.Blanchard, professeur de Technologie
//
//  Turbine radiale à aubes courbes, moyeu creux fermé par un couvercle
//  vissé (filetage imprimé) caché sous le moyeu. B : cavité vide.
//  A : cavité lestée (écrous M6, billes d'acier ou plombs).
//  La seule différence visible est la lettre gravée sur le dessus du moyeu.
//
//  Export (moteur Manifold) :
//    openscad --backend=manifold -D 'lettre="A"' -o turbine_A.stl turbine_demo.scad
//    openscad --backend=manifold -D 'lettre="B"' -o turbine_B.stl turbine_demo.scad
//  Chaque STL contient la turbine ET son couvercle, posés côte à côte.
//  Imprimante : Bambu Lab A1, buse 0,4 mm, PLA, SANS support.
// =====================================================================

/* [Choix] */
lettre = "A";            // lettre gravée sur le moyeu : "A", "B" ou "" (aucune)
piece  = "plateau";      // "plateau" (turbine + couvercle), "turbine", "couvercle", "assemblage"

/* [Turbine] */
diametre      = 60;      // diamètre extérieur (mm)
hauteur       = 20;      // hauteur totale (mm)
nb_aubes      = 8;
ep_aube       = 1.6;     // épaisseur des aubes (>= 1,6 mm : 4 passes de 0,4)
courbure      = 35;      // angle balayé par une aube entre moyeu et bord (°)
ep_flasque    = 1.0;     // épaisseur du disque qui porte les aubes
d_moyeu       = 40;      // diamètre du moyeu
ep_paroi      = 1.0;     // paroi du moyeu au-dessus du filet (B la plus légère possible)

/* [Axe] */
diametre_axe  = 4;       // tige M4, rond de 4, brochette de 4, axe imprimé... (crayon hexagonal de 7 mm : mettre 8)
jeu_axe       = 0.6;     // jeu au diamètre : la turbine tourne librement sur l'axe

/* [Lest de la turbine A] */
masse_lest    = 37;      // masse de lest voulue (g) : sert au calcul affiché dans la console
masse_ecrou   = 2.5;     // masse d'un écrou M6 (DIN 934), à vérifier en pesant 10 écrous
masse_B       = 18;      // masse de B imprimée avec son couvercle (g) : PESER et corriger
ecrous_max    = 15;      // écrous M6 à plat qui tiennent dans la cavité (5 par compartiment), estimation

/* [Couvercle vissé] */
ep_couvercle  = 1.4;     // épaisseur de la collerette (affleure sous le moyeu)
h_jupe        = 6;       // hauteur de la jupe filetée (1 tour de filet)
pas           = 6;       // pas du filet (mm par tour)
excentre      = 0.8;     // profondeur du filet = 2 × excentre
r_filet       = 16.3;    // rayon moyen du filet
jeu_filet     = 0.35;    // jeu radial entre filets mâle et femelle
ep_jupe       = 1.2;     // paroi mini de la jupe
toit          = 1.2;     // épaisseur du dessus du moyeu
chanfrein     = 3;       // chanfreins à 45° sous le toit (évite les ponts trop longs)

$fn = 96;

// ---------- grandeurs dérivées ----------
R        = diametre / 2;
r_moyeu  = d_moyeu / 2;
r_alesage= (diametre_axe + jeu_axe) / 2;
r_noyau  = r_alesage + 1.6;                       // tube autour de l'axe
r_fem_max= r_filet + jeu_filet + excentre;        // creux maxi du filet femelle
r_fem_min= r_filet + jeu_filet - excentre;
r_cav    = r_moyeu - ep_paroi;                    // rayon de la cavité au-dessus du filet
r_jupe_in= r_filet - excentre - ep_jupe;          // intérieur de la jupe
r_colle  = r_fem_max + 0.45;                      // collerette du couvercle
z_fem    = ep_couvercle + h_jupe + 0.8;           // haut du filet femelle
z_toit   = hauteur - toit;

assert(r_moyeu - r_colle >= 1.6, "moyeu trop petit pour le couvercle");
assert(r_cav >= r_fem_max, "la cavité doit être plus large que le filet femelle (sinon surplomb)");
assert(R - r_moyeu >= 6, "aubes trop courtes");

// ---------- lest : calcul affiché ----------
vol_cavite = PI*(pow(r_cav,2)-pow(r_noyau,2))*(z_toit - z_fem)
           + PI*(pow(r_jupe_in,2)-pow(r_noyau+0.4,2))*(z_fem - ep_couvercle);   // cm3 x 1000
echo(str("Volume utile de la cavité ≈ ", round(vol_cavite/100)/10, " cm³"));
n_ecrous = ceil(masse_lest/masse_ecrou);
echo(str("Lest ", masse_lest, " g ≈ ", n_ecrous, " écrous M6 (", masse_ecrou, " g) → A ≈ ",
         masse_B + masse_lest, " g, soit ", round((masse_B + masse_lest)/masse_B*10)/10, " fois la masse de B"));
echo(str("Capacité indicative : ", ecrous_max, " écrous M6 (", ecrous_max*masse_ecrou,
         " g) ; billes d'acier seules ≈ ", round(vol_cavite/1000*4.7), " g"));
if (n_ecrous > ecrous_max)
    echo(str("ATTENTION : ", n_ecrous, " écrous ne tiennent pas ; compléter avec des billes d'acier entre les écrous"));
if (masse_lest > vol_cavite/1000*4.7)
    echo("ATTENTION : lest supérieur à ce que la cavité peut contenir en acier");

// =====================================================================
module filet(r, e, h) {        // hélice à un lobe excentré : filet rond imprimable sans support
    linear_extrude(height = h, twist = -360*h/pas, slices = ceil(h/pas*96), convexity = 4)
        translate([e, 0]) circle(r = r);
}

module aube() {
    n = 24;
    r0 = r_moyeu - 0.6;
    pts = [for (i = [0:n]) let(t = i/n, r = r0 + t*(R - ep_aube/2 - r0), a = courbure*t) [r*cos(a), r*sin(a)]];
    linear_extrude(height = hauteur)
        for (i = [0:n-1]) hull() { translate(pts[i]) circle(d = ep_aube, $fn = 24);
                                   translate(pts[i+1]) circle(d = ep_aube, $fn = 24); }
}

module profil_cavite() {       // demi-section (r, z) de la cavité, tournée autour de l'axe
    polygon([
        [r_noyau - 0.3,           ep_couvercle - 0.01],
        [r_fem_min - 0.05,    ep_couvercle - 0.01],
        [r_fem_min - 0.05,    z_fem],
        [r_cav,               z_fem],
        [r_cav,               z_toit - chanfrein],
        [r_cav - chanfrein,   z_toit],
        [r_noyau + chanfrein, z_toit],
        [r_noyau - 0.3,       z_toit - chanfrein - 0.3]
    ]);
}

module nervures() {            // 3 cloisons : compartiments de lest équilibrés (au-dessus de la jupe)
    z0 = z_fem + 0.01;
    for (k = [0:2]) rotate(k*120 + 30)
        translate([r_noyau - 0.3, -0.4, z0]) cube([r_cav - r_noyau + 0.6, 0.8, z_toit - chanfrein - 0.3 - z0]);
}

module turbine() {
    difference() {
        union() {
            cylinder(r = R, h = ep_flasque);                       // flasque
            cylinder(r = r_moyeu, h = hauteur);                    // moyeu
            for (k = [0:nb_aubes-1]) rotate(k*360/nb_aubes) aube();
        }
        translate([0, 0, -1]) cylinder(r = r_alesage, h = hauteur + 2, $fn = 48);     // alésage
        difference() {                                             // cavité de lest
            union() {
                rotate_extrude($fn = 128) profil_cavite();
                translate([0, 0, ep_couvercle - 0.01]) filet(r_filet + jeu_filet, excentre, z_fem - ep_couvercle + 0.4);
                translate([0, 0, -1]) cylinder(r = r_colle, h = ep_couvercle + 1);    // logement de la collerette
                translate([0, 0, ep_couvercle - 0.01])                                // chanfrein : pas de surplomb
                    cylinder(r1 = r_colle, r2 = r_fem_min - 0.3, h = r_colle - r_fem_min + 0.3);
            }
            translate([0, 0, -2]) cylinder(r = r_noyau, h = hauteur + 4, $fn = 128);   // tube autour de l'axe
            nervures();
        }
        if (lettre != "")                                          // lettre gravée sur le dessus
            translate([0, 11.5, hauteur - 0.5])
                linear_extrude(height = 1)
                    text(lettre, size = 9, font = "Liberation Sans:style=Bold", halign = "center", valign = "center");
    }
}

module couvercle() {           // imprimé collerette à plat, jupe vers le haut
    difference() {
        union() {
            cylinder(r = r_colle - 0.2, h = ep_couvercle);
            translate([0, 0, ep_couvercle - 0.01]) filet(r_filet, excentre, h_jupe + 0.01);
        }
        translate([0, 0, -1]) cylinder(r = r_noyau + 0.4, h = ep_couvercle + h_jupe + 2, $fn = 48);
        translate([0, 0, ep_couvercle]) cylinder(r = r_jupe_in, h = h_jupe + 1);
        for (a = [0, 90]) rotate(a)                                // fentes pour une pièce de monnaie
            translate([-(r_jupe_in - 1), -0.8, -0.01]) cube([2*(r_jupe_in - 1), 1.6, 0.7]);
    }
}

// =====================================================================
if (piece == "plateau") {
    turbine();
    translate([R + r_colle + 6, 0, 0]) couvercle();
} else if (piece == "turbine") {
    turbine();
} else if (piece == "couvercle") {
    couvercle();
} else if (piece == "assemblage") {    // vue de contrôle : couvercle vissé en place
    turbine();
    color("orange") couvercle();
}
