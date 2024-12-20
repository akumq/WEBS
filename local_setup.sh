#!/bin/bash

echo "Installation et lancement du projet de visualisation de capteurs (mode local)"

echo "Vérification de Python..."
if ! command -v python3 &> /dev/null; then
    echo "Python 3 n'est pas installé. Veuillez installer Python 3 avant de continuer."
    exit 1
fi

echo "Vérification de pip..."
if ! command -v pip3 &> /dev/null; then
    echo "pip3 n'est pas installé. Veuillez installer pip3 avant de continuer."
    exit 1
fi

echo "Vérification du compilateur C++..."
if ! command -v g++ &> /dev/null; then
    echo "g++ n'est pas installé. Veuillez installer build-essential avant de continuer."
    exit 1
fi

echo "Création de l'environnement virtuel..."
python3 -m venv venv

echo "Activation de l'environnement virtuel..."
source venv/bin/activate

echo "Installation des dépendances Python..."
pip install -r requirements.txt

echo "Compilation du daemon C++..."
cd cpp
make clean
make
cd ..

echo "Création des dossiers nécessaires..."
mkdir -p sensor/data
mkdir -p sensor/index

# Vérification des droits d'exécution
echo "Vérification des droits d'exécution..."
chmod +x cpp/daemon
chmod +x run.sh

# Export des variables d'environnement depuis .env
echo "Configuration des variables d'environnement..."
export $(cat .env | grep -v '^#' | xargs)

# Lancement de l'application
echo "Lancement de l'application..."
python3 app.py &
APP_PID=$!
