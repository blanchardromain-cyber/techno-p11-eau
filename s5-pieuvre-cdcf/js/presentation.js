/* ============================================================================
   P11 · Séance 5 — Mode présentation
   ----------------------------------------------------------------------------
   Affiche un dossier en plein écran, en gros caractères, pour la mise en commun
   au vidéoprojecteur.

   Le principe de la séance est qu'on ne repasse PAS les vingt-cinq maquettes
   devant la classe. Les équipes qui souhaitent présenter cochent « Retenir pour
   la présentation » dans leur dossier ; le professeur ne fait défiler que
   celles-là, deux ou trois en fin d'heure.

   Ce qui est projeté est volontairement réduit : le nom de l'équipe, le
   problème traité, le principe, la maquette et le cahier des charges. Ni notes
   ni corrigés — on projette une proposition, pas un bulletin.
   ========================================================================== */

var PRESENTATION = (function(){
  'use strict';

  var boite = null;
  var liste = [];          // codes retenus, dans l'ordre de la liste
  var index = 0;

  function creerBoite(){
    if (boite) return;
    boite = document.createElement('div');
    boite.className = 'presentation';
    boite.setAttribute('role', 'dialog');
    boite.setAttribute('aria-modal', 'true');
    boite.setAttribute('aria-label', 'Présentation en classe');
    boite.innerHTML =
      '<div class="pres-barre">' +
        '<button class="pres-nav" data-nav="-1" type="button" aria-label="Dossier précédent">◀</button>' +
        '<span class="pres-compte" id="pres-compte"></span>' +
        '<button class="pres-nav" data-nav="1" type="button" aria-label="Dossier suivant">▶</button>' +
        '<button class="pres-nav pres-fermer" type="button" aria-label="Fermer la présentation">✕</button>' +
      '</div>' +
      '<div class="pres-corps" id="pres-corps"></div>';
    document.body.appendChild(boite);

    boite.querySelectorAll('[data-nav]').forEach(function(b){
      b.addEventListener('click', function(){ naviguer(+b.dataset.nav); });
    });
    boite.querySelector('.pres-fermer').addEventListener('click', fermer);

    // Au vidéoprojecteur, on pilote au clavier depuis le fond de la salle.
    document.addEventListener('keydown', function(e){
      if (!boite.classList.contains('show')) return;
      if (e.key === 'Escape')     { fermer(); }
      if (e.key === 'ArrowRight') { naviguer(1); }
      if (e.key === 'ArrowLeft')  { naviguer(-1); }
    });
  }

  /** Dossiers de ce poste cochés « à présenter », le plus récent d'abord. */
  function retenus(){
    return P11.listerCodes().filter(function(c){ return c.etat.m3.presentation; });
  }

  function naviguer(sens){
    if (liste.length < 2) return;
    index = (index + sens + liste.length) % liste.length;
    afficher(liste[index].etat);
    majCompte();
  }

  function majCompte(){
    var el = document.getElementById('pres-compte');
    if (!el) return;
    el.textContent = liste.length > 1
      ? (index + 1) + ' / ' + liste.length
      : '';
  }

  /**
   * Ouvre la présentation.
   * Sans argument : sur le dossier ouvert, et la navigation parcourt tous les
   * dossiers retenus du poste.
   */
  function ouvrir(etat){
    creerBoite();
    liste = retenus();
    var courant = etat || P11.state;

    // Si le dossier affiché fait partie des retenus, on se positionne dessus.
    index = 0;
    for (var i = 0; i < liste.length; i++){
      if (liste[i].code === courant.badge.code){ index = i; break; }
    }
    if (!liste.length) liste = [{ code: courant.badge.code, etat: courant }];

    afficher(liste[index] ? liste[index].etat : courant);
    majCompte();
    boite.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function fermer(){
    if (!boite) return;
    boite.classList.remove('show');
    document.body.style.overflow = '';
  }

  function afficher(s){
    var corps = document.getElementById('pres-corps');
    var ost = P11.ostParId(s.m2.ost);
    var h = '';

    h += '<div class="pres-entete">' +
         '<div class="pres-equipe">' + P11.esc(P11.nomEquipe(s)) +
           (s.badge.classe ? ' <span class="pres-classe">' + P11.esc(s.badge.classe) + '</span>' : '') +
         '</div>' +
         '<h1 class="pres-titre">' + (P11.esc(s.m3.nom) || 'Solution sans nom') + '</h1>' +
         '</div>';

    h += '<div class="pres-grille">';

    /* Colonne de gauche : ce que l'équipe a voulu résoudre. */
    h += '<div>';
    if (String(s.m3.probleme||'').trim()){
      h += '<h2 class="pres-h2">Le problème</h2><p class="pres-p">' + P11.esc(s.m3.probleme) + '</p>';
    }
    if (String(s.m3.principe||'').trim()){
      h += '<h2 class="pres-h2">Comment ça marche</h2><p class="pres-p">' + P11.esc(s.m3.principe) + '</p>';
    }
    if (s.m3.fonctions.length){
      h += '<h2 class="pres-h2">Le cahier des charges</h2><table class="pres-table"><tbody>';
      s.m3.fonctions.forEach(function(f){
        if (!String(f.texte||'').trim()) return;
        h += '<tr><td class="pres-type"><span class="pill ' + (f.type==='FP'?'fp':'fc') + '">' +
             f.type + '</span></td><td>' + P11.esc(f.texte) + '</td>' +
             '<td class="pres-niveau">' +
               (String(f.valeur||'').trim() ? P11.esc(f.valeur) + ' ' + P11.esc(f.unite||'') : '—') +
             '</td></tr>';
      });
      h += '</tbody></table>';
    }
    h += '</div>';

    /* Colonne de droite : la maquette. */
    h += '<div class="pres-maquette">';
    if (s.m3.snapshot){
      h += '<img src="' + s.m3.snapshot + '" alt="Maquette 3D de la solution présentée">';
    } else {
      h += '<div class="pres-vide">Pas de photo de maquette</div>';
    }
    if (ost){
      h += '<p class="pres-sous">Cahier des charges travaillé en mission 2 : ' +
           P11.esc(ost.nom) + '</p>';
    }
    h += '</div></div>';

    corps.innerHTML = h;
    corps.scrollTop = 0;
  }

  function init(){
    var c = document.getElementById('dossier-presentation');
    if (c){
      c.addEventListener('change', function(){
        P11.state.m3.presentation = c.checked;
        P11.sauver(true);
        if (window.CLOUD) CLOUD.envoyer('presentation');
        P11.signaler(c.checked
          ? 'Ton dossier est proposé pour la présentation en classe.'
          : 'Ton dossier n\'est plus proposé pour la présentation.');
      });
    }
    var b = document.getElementById('dossier-projeter');
    if (b) b.addEventListener('click', function(){ ouvrir(); });
  }

  return { init:init, ouvrir:ouvrir, fermer:fermer, retenus:retenus };
})();
