# Rapport de Déploiement : TaskFlow

Ce document résume l'évolution du projet entre la version initiale et la version finale mise sur GitHub.

## 🕒 État Initial (Avant)
- **Fonctionnalités** : Liste de tâches basique (Ajout/Suppression).
- **Interface** : Design simple, pas d'indicateur de temps ni de progression.
- **Organisation** : Fichiers en vrac incluant des cours et des scripts de déploiement locaux.
- **Données** : Pas de gestion fine des priorités ni des dates d'échéance.

## 🚀 État Final (Après)
- **Nouvelles Fonctionnalités** :
    - **Horloge en temps réel** pour le suivi temporel.
    - **Barre de progression** pour visualiser l'avancement global.
    - **Système de priorités** avec badges visuels.
    - **Dates d'échéance** avec indicateurs de retard.
    - **API d'images intelligente** (LoremFlickr) : les images générées sont désormais plus pertinentes par rapport au contenu de la tâche grâce à une extraction de mots-clés optimisée.
- **Optimisation** :
    - Code JavaScript réécrit pour être plus modulaire et performant.
    - CSS nettoyé avec des variables globales pour la cohérence visuelle.
- **Clean Code** :
    - Dépôt Git nettoyé : exclusion des fichiers de cours et des scripts Windows IIS pour ne garder que le code source pur de l'application web.
    - Ajout d'une documentation complète (`README.md`).

## ✅ Conclusion
L'application est passée d'un simple exercice pédagogique à un outil de productivité structuré, documenté et prêt pour un usage web standard.
