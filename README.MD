# Visualisateur de Données de Capteurs en Temps Réel

## Description
Ce projet est une application web permettant de visualiser en temps réel les données de capteurs inertiels (accéléromètres et gyroscopes) placés sur des patients lors de différentes activités physiques. L'application permet de suivre simultanément plusieurs patients et activités, avec la possibilité de sélectionner les paramètres à afficher. Réalisé dans le cadre d'un cours de Master 1 à l'Université de Lorraine.

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
  - Bootstrap pour l'interface
  - FontAwesome pour les icônes
- **Backend** : Python/Flask
- **Daemon C++** : Lecture des données des capteurs
- **Docker** : Conteneurisation de l'application

## Prérequis
- Docker et Docker Compose
- Architecture compatible (ARM64 ou x86)

## Installation et Démarrage

### Mode Local (local_setup.sh)
```bash
# Installation locale
./local_setup.sh

# Ce script effectue les opérations suivantes :
1. Vérification des prérequis
   - Python 3
   - pip3
   - g++ (build-essential)

2. Configuration de l'environnement
   - Création venv : python3 -m venv venv
   - Activation : source venv/bin/activate
   - Installation dépendances : pip install -r requirements.txt

3. Compilation du daemon C++
   - cd cpp && make clean && make
   - Vérification des droits : chmod +x cpp/daemon

4. Création des dossiers
   - mkdir -p sensor/data
   - mkdir -p sensor/index

5. Configuration environnement
   - Export des variables depuis .env

6. Lancement application
   - python3 app.py
```

### Mode Docker (docker.sh)
```bash
# Démarrage avec Docker
./docker.sh

# Ce script effectue :
1. Construction de l'image
   - docker-compose build

2. Lancement des conteneurs
   - docker-compose up -d

3. Vérification du statut
   - docker-compose ps

# Commandes Docker utiles
# Arrêter les conteneurs
docker-compose down

# Voir les logs
docker-compose logs -f

# Reconstruire et redémarrer
docker-compose up -d --build

# Nettoyer les conteneurs et images
docker-compose down --rmi all
```

### Variables d'Environnement (.env)
```env
HOST=0.0.0.0
PORT=8050
DEBUG=TRUE
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=1
```

### Structure des Volumes Docker
```yaml
volumes:
  - ./src:/app/src        # Code source
  - ./cpp:/app/cpp        # Code C++
  - ./sensor:/app/sensor  # Données
```

## Développement

### Mode Local
```bash
# Activation environnement virtuel
source venv/bin/activate

# Lancement en mode développement
flask run --debug

# Recompilation daemon
cd cpp && make clean && make
```

### Mode Docker
```bash
# Développement avec volumes montés
docker-compose -f docker-compose.dev.yml up

# Shell dans le conteneur
docker-compose exec flask-app bash

# Rechargement des modifications
docker-compose restart
```

## Dépannage


### Logs
- **Application**: `*.log`
- **Docker**: `docker-compose logs`
- **Daemon**: `sensor/logs/`

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