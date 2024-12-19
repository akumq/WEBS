class SensorManager {
    constructor() {
        this.sensors = new Map();
        this.initializeUI();
        this.selectedParams = new Set();
    }

    initializeUI() {
        this.populateSelect('patientId', 1, 10, 'Patient');
        
        // Populate activity select with specific activities
        const activities = [
            'Debout immobile', 'Assis et détendu', 'Allongé', 'Marche', 
            'Monter les escaliers', 'Penchement avant', 'Élévation des bras', 
            'Flexion des genoux', 'Vélo', 'Jogging', 'Course à pied', 
            'Saut avant/arrière'
        ];
        const activitySelect = document.getElementById('activity');
        activities.forEach((activity, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = activity;
            activitySelect.appendChild(option);
        });

        // Add listeners for all checkboxes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.selectedParams.add(checkbox.value);
                } else {
                    this.selectedParams.delete(checkbox.value);
                }
            });
        });

        document.getElementById('sensorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleStart();
        });

        document.getElementById('stopButton').addEventListener('click', () => {
            this.handleStop();
        });
    }

    populateSelect(elementId, min, max, prefix) {
        const select = document.getElementById(elementId);
        for (let i = min; i <= max; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${prefix} ${i}`;
            select.appendChild(option);
        }
    }

    async handleStart() {
        if (this.selectedParams.size === 0) {
            alert('Veuillez sélectionner au moins un paramètre à afficher');
            return;
        }

        const patientId = parseInt(document.getElementById('patientId').value);
        const activity = parseInt(document.getElementById('activity').value);
        const refreshRate = parseInt(document.getElementById('refreshRate').value);

        // Validation du taux de rafraîchissement
        if (refreshRate < 100 || refreshRate > 10000) {
            alert('La fréquence de rafraîchissement doit être entre 100 et 10000 ms');
            return;
        }

        const sensorKey = `${patientId}_${activity}`;

        try {
            // Créer un nouveau capteur
            const sensor = new Sensor(patientId, activity, Array.from(this.selectedParams), refreshRate);
            
            // Démarrer le capteur et attendre la confirmation
            const response = await sensor.startSensor();
            console.log('Réponse du serveur:', response);

            if (response.status === 'success') {
                // Ajouter le capteur à la map
                this.sensors.set(sensorKey, sensor);
                
                // Démarrer le polling et le graphique
                sensor.startDataPolling();
                await sensor.renderGraph();

                // Mettre à jour l'interface
                document.getElementById('startButton').disabled = false;
                document.getElementById('stopButton').disabled = false;
                document.getElementById('refreshRate').disabled = false;
            } else {
                throw new Error(response.error || 'Erreur inconnue lors du démarrage');
            }
        } catch (error) {
            console.error('Erreur lors du démarrage:', error);
            alert('Erreur lors du démarrage du capteur: ' + error.message);
            
            // Nettoyer en cas d'erreur
            this.sensors.delete(sensorKey);
        }
    }

    async handleStop() {
        const patientId = parseInt(document.getElementById('patientId').value);
        const activity = parseInt(document.getElementById('activity').value);
        const sensorKey = `${patientId}_${activity}`;

        const sensor = this.sensors.get(sensorKey);
        if (!sensor) return;

        try {
            await sensor.stopSensor();
            this.sensors.delete(sensorKey);

            // Ne désactiver le bouton Stop que si c'est le dernier capteur
            if (this.sensors.size === 0) {
                document.getElementById('stopButton').disabled = true;
            }
        } catch (error) {
            console.error('Erreur lors de l\'arrêt:', error);
            alert('Erreur lors de l\'arrêt du capteur');
        }
    }
}

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    const manager = new SensorManager();
});
