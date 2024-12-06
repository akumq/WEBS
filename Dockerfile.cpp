# Utiliser une image de base avec g++
FROM gcc:latest

# Créer un répertoire de travail
WORKDIR /app

# Copier le fichier source C++ et le Makefile
COPY sensor ./app/sensor/
COPY daemon.cpp Makefile ./
# Compiler le programme C++ en utilisant le Makefile
RUN make

# Créer le répertoire pour le volume partagé et copier le binaire
RUN mkdir -p /app/cpp && cp daemon /app/cpp/ 
COPY sensor /app/cpp/sensor
RUN chmod +x /app/cpp/ daemon
