#!/bin/bash

echo "Installation et lancement du projet de visualisation de capteurs"

echo "Vérification de l'installation de Docker..."
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé. Veuillez installer Docker avant de continuer."
    exit 1
fi

echo "Vérification de l'installation de Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose n'est pas installé. Veuillez installer Docker Compose avant de continuer."
    exit 1
fi

echo "⬇️ Téléchargement des images Docker..."
docker pull python:latest
docker pull ubuntu:latest

echo "Arrêt des conteneurs existants..."
docker-compose down

echo "Construction des images Docker..."
docker-compose build

echo "Démarrage des conteneurs..."
docker-compose up -d

echo "Vérification du statut des conteneurs..."
docker-compose ps

echo "Installation terminée!"
echo "L'application est accessible à l'adresse: http://localhost:8050"
