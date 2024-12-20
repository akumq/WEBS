# Visualisateur de Données de Capteurs en Temps Réel

## Description
Ce projet est une application web permettant de visualiser en temps réel les données de capteurs inertiels (accéléromètres et gyroscopes) placés sur des patients lors de différentes activités physiques. L'application permet de suivre simultanément plusieurs patients et activités, avec la possibilité de sélectionner les paramètres à afficher.

## Fonctionnalités
- Visualisation en temps réel des données de capteurs
- Support de multiples patients (1-10) et activités (0-11)
- Sélection flexible des paramètres à afficher :
  - Cheville gauche : accélérations (X,Y,Z) et positions angulaires (X,Y,Z)
  - Avant-bras droit : accélérations (X,Y,Z) et positions angulaires (X,Y,Z)
- Interface utilisateur intuitive avec panneau latéral rétractable
- Gestion dynamique des graphiques par patient
- Taux de rafraîchissement configurable (100-10000ms)

## Architecture Technique
- **Frontend** : HTML5, CSS3, JavaScript
  - Chart.js pour les graphiques
  - Bootstrap pour l'interface
  - FontAwesome pour les icônes
- **Backend** : Python/Flask
- **Daemon C++** : Lecture des données des capteurs
- **Docker** : Conteneurisation de l'application

## Prérequis
- Docker et Docker Compose
- Architecture compatible (ARM64 ou x86)

## Installation
1. Cloner le repository
2. Construire l'image Docker :
3. Lancer l'application :

```bash
bash
docker-compose build
```

## Structure du Projet

.
├── app.py # Point d'entrée de l'application Flask
├── cpp/ # Code source du daemon C++
├── sensor/ # Données des capteurs
├── src/
│ ├── static/ # Ressources statiques (JS, CSS)
│ ├── templates/ # Templates HTML
│ ├── routes.py # Routes Flask
│ └── sensor_reader.py # Lecture des données
└── docker-compose.yml # Configuration Docker


## Utilisation
1. Accéder à l'application via `http://localhost:8050`
2. Sélectionner un patient et une activité
3. Choisir les paramètres à visualiser
4. Définir le taux de rafraîchissement
5. Cliquer sur "Démarrer" pour lancer la visualisation

## Activités Supportées
0. Debout immobile
1. Assis et détendu
2. Allongé
3. Marche
4. Monter les escaliers
5. Penchement avant
6. Élévation des bras
7. Flexion des genoux
8. Vélo
9. Jogging
10. Course à pied
11. Saut avant/arrière

## Paramètres des Capteurs
- **Cheville Gauche**
  - alx, aly, alz : Accélérations
  - glx, gly, glz : Positions angulaires
- **Avant-bras Droit**
  - arx, ary, arz : Accélérations
  - grx, gry, grz : Positions angulaires

## Développement
Le projet utilise une architecture modulaire permettant d'ajouter facilement de nouvelles fonctionnalités. Les données sont lues depuis des fichiers CSV par un daemon C++ et transmises au frontend via Flask.