# Utiliser une image de base avec g++
FROM gcc:latest

# Créer un répertoire de travail
WORKDIR /app

# Copier le fichier source C++ et le Makefile
COPY daemon.cpp Makefile ./

# Compiler le programme C++ en utilisant le Makefile
RUN make

# Définir la commande par défaut
CMD ["./daemon"]
