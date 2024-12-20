class SensorManager {
    constructor() {
        this.sensors = new Map();
        this.initializeUI();
        this.selectedParams = new Set();
        
        window.addEventListener('beforeunload', async (e) => {
            e.preventDefault();
            await this.stopAllSensors();
            console.log('Tous les capteurs ont été arrêtés');
        });
    }

    async stopAllSensors() {
        const stopPromises = Array.from(this.sensors.values()).map(sensor => {
            return sensor.stopSensor().catch(error => {
                console.error('Erreur lors de l\'arrêt d\'un capteur:', error);
            });
        });

        try {
            await Promise.all(stopPromises);
            this.sensors.clear();
        } catch (error) {
            console.error('Erreur lors de l\'arrêt des capteurs:', error);
        }
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

        // Gestion du panneau latéral
        const toggleButton = document.getElementById('toggleForm');
        const sidePanel = document.getElementById('sidePanel');
        const contentArea = document.querySelector('.content-area');
        
        toggleButton.addEventListener('click', () => {
            sidePanel.classList.toggle('collapsed');
            toggleButton.classList.toggle('collapsed');
            contentArea.classList.toggle('expanded');
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

        // Vérifier si un sensor existe déjà pour cette combinaison patient/activité
        const existingSensor = this.sensors.get(sensorKey);
        if (existingSensor) {
            // Mettre à jour le taux de rafraîchissement si nécessaire
            if (existingSensor.refreshRate !== refreshRate) {
                existingSensor.updateRefreshRate(refreshRate);
            }

            // Convertir les Sets en Arrays pour faciliter la comparaison
            const currentParams = Array.from(existingSensor.selectedParams);
            const newParams = Array.from(this.selectedParams);

            // Trouver les paramètres à ajouter et à supprimer
            const paramsToAdd = newParams.filter(param => !currentParams.includes(param));
            const paramsToRemove = currentParams.filter(param => !newParams.includes(param));

            // Mettre à jour les paramètres du sensor existant
            if (paramsToAdd.length > 0) {
                existingSensor.addParameters(paramsToAdd);
            }
            if (paramsToRemove.length > 0) {
                paramsToRemove.forEach(param => existingSensor.removeParameter(param));
            }

            return;
        }

        // Si aucun sensor n'existe, créer un nouveau
        try {
            const sensor = new Sensor(
                patientId, 
                activity, 
                Array.from(this.selectedParams), 
                refreshRate,
                this
            );
            
            const response = await sensor.startSensor();
            if (response.status === 'success') {
                this.sensors.set(sensorKey, sensor);
                sensor.startDataPolling();
                await sensor.renderGraph();
            } else {
                throw new Error(response.error || 'Erreur inconnue lors du démarrage');
            }
        } catch (error) {
            console.error('Erreur lors du démarrage:', error);
            alert('Erreur lors du démarrage du capteur: ' + error.message);
            this.sensors.delete(sensorKey);
        }
    }

    async stopSensor(patientId, activity) {
        const sensorKey = `${patientId}_${activity}`;
        const sensor = this.sensors.get(sensorKey);
        if (!sensor) return;

        try {
            // Vérifier si c'est la dernière vue
            const shouldStop = this.removeView(patientId, activity, sensor);

            if (shouldStop) {
                // Arrêter le sensor côté serveur
                const response = await fetch('/stop_reader', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        patient_id: patientId,
                        activity: activity
                    })
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de l\'arrêt du capteur');
                }

                // Marquer comme arrêté et supprimer de la map
                sensor.isRunning = false;
                this.sensors.delete(sensorKey);
            }

            // Nettoyer la vue
            sensor.cleanup();

        } catch (error) {
            console.error('Erreur lors de l\'arrêt:', error);
            alert('Erreur lors de l\'arrêt du capteur');
        }
    }

    addView(patientId, activity, view) {
        const sensorKey = `${patientId}_${activity}`;
        if (!this.views.has(sensorKey)) {
            this.views.set(sensorKey, new Set());
        }
        this.views.get(sensorKey).add(view);
    }

    removeView(patientId, activity, view) {
        const sensorKey = `${patientId}_${activity}`;
        const views = this.views.get(sensorKey);
        if (views) {
            views.delete(view);
            // Si c'était la dernière vue, supprimer le sensor
            if (views.size === 0) {
                this.views.delete(sensorKey);
                return true; // Indiquer qu'il faut arrêter le sensor
            }
        }
        return false; // Indiquer qu'il ne faut pas arrêter le sensor
    }
}

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    const manager = new SensorManager();
});
