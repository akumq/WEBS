class Sensor {
    constructor(patientId, activity, selectedParams, refreshRate, manager) {
        this.patientId = patientId;
        this.activity = activity;
        this.selectedParams = selectedParams;
        this.refreshRate = refreshRate;
        this.manager = manager;
        this.isRunning = false;
        this.updateInterval = null;
        this.data = {
            timestamps: [],
            values: {}
        };
        
        // Initialiser les tableaux de données pour chaque paramètre sélectionné
        this.selectedParams.forEach(param => {
            this.data.values[param] = [];
        });

        // Configuration des couleurs pour chaque paramètre
        this.colors = {
            // Cheville gauche
            alx: 'rgb(255, 99, 132)',   // Rouge
            aly: 'rgb(255, 159, 64)',   // Orange
            alz: 'rgb(255, 205, 86)',   // Jaune
            glx: 'rgb(75, 192, 192)',   // Turquoise
            gly: 'rgb(54, 162, 235)',   // Bleu
            glz: 'rgb(153, 102, 255)',  // Violet
            // Avant-bras droit
            arx: 'rgb(255, 99, 132, 0.5)',   // Rouge transparent
            ary: 'rgb(255, 159, 64, 0.5)',   // Orange transparent
            arz: 'rgb(255, 205, 86, 0.5)',   // Jaune transparent
            grx: 'rgb(75, 192, 192, 0.5)',   // Turquoise transparent
            gry: 'rgb(54, 162, 235, 0.5)',   // Bleu transparent
            grz: 'rgb(153, 102, 255, 0.5)'   // Violet transparent
        };

        // Créer un conteneur et un canvas pour ce capteur
        this.createGraph();
    }

    createGraph() {
        // Trouver ou créer la ligne pour ce patient
        let patientRow = document.getElementById(`patient_${this.patientId}`);
        if (!patientRow) {
            patientRow = document.createElement('div');
            patientRow.id = `patient_${this.patientId}`;
            patientRow.className = 'patient-row';
            
            const title = document.createElement('h3');
            title.textContent = `Patient ${this.patientId}`;
            patientRow.appendChild(title);

            const scrollContainer = document.createElement('div');
            scrollContainer.className = 'graphs-scroll';
            patientRow.appendChild(scrollContainer);

            // Insérer dans l'ordre des IDs de patient
            const container = document.getElementById('graphsContainer');
            const rows = container.getElementsByClassName('patient-row');
            let inserted = false;
            
            for (let row of rows) {
                const rowId = parseInt(row.id.split('_')[1]);
                if (rowId > this.patientId) {
                    container.insertBefore(patientRow, row);
                    inserted = true;
                    break;
                }
            }
            
            if (!inserted) {
                container.appendChild(patientRow);
            }
        }

        // Créer la carte pour ce graphique
        const graphCard = document.createElement('div');
        graphCard.className = 'graph-card';
        graphCard.id = `graph_${this.patientId}_${this.activity}`;

        // Créer l'en-tête du graphique avec titre et bouton de suppression
        const header = document.createElement('div');
        header.className = 'graph-header';

        const title = document.createElement('h4');
        title.textContent = this.getActivityName(this.activity);

        // Créer le bouton de suppression
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-graph-btn';
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteButton.onclick = () => this.stopSensor();

        header.appendChild(title);
        header.appendChild(deleteButton);
        graphCard.appendChild(header);

        const canvas = document.createElement('canvas');
        graphCard.appendChild(canvas);

        patientRow.querySelector('.graphs-scroll').appendChild(graphCard);
        this.canvas = canvas;
    }

    getActivityName(activity) {
        const activities = [
            'Debout immobile', 'Assis et détendu', 'Allongé', 'Marche',
            'Monter les escaliers', 'Penchement avant', 'Élévation des bras',
            'Flexion des genoux', 'Vélo', 'Jogging', 'Course à pied',
            'Saut avant/arrière'
        ];
        return activities[activity] || `Activité ${activity}`;
    }

    async startSensor() {
        if (this.isRunning) return;

        try {
            const options = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    patient_id: this.patientId,
                    activity: this.activity
                })
            };

            const response = await fetch('/start_reader', options);
            
            if (!response.ok) throw new Error('Erreur lors du démarrage du sensor.js');
            
            this.isRunning = true;
            return await response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    }

    startDataPolling() {
        this.updateInterval = setInterval(async () => {
            // Vérifier si le capteur est toujours en cours d'exécution
            if (!this.isRunning) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
                return;
            }

            try {
                const data = await this.getLatestData();
                if (data === null) {
                    // Si getLatestData retourne null, c'est qu'il y a eu une erreur 400
                    // et le sensor a déjà été arrêté
                    clearInterval(this.updateInterval);
                    this.updateInterval = null;
                    return;
                }
                this.updateData(data);
            } catch (error) {
                console.error('Erreur lors de la récupération des données:', error);
            }
        }, this.refreshRate);
    }

    async getLatestData() {
        // Vérifier si le capteur est toujours en cours d'exécution
        if (!this.isRunning) {
            throw new Error('Le capteur n\'est plus actif');
        }

        const params = new URLSearchParams({
            patient_id: this.patientId,
            activity: this.activity
        });

        try {
            const response = await fetch(`/get_latest_data?${params.toString()}`);
            
            if (response.status === 400) {
                // Si on reçoit une erreur 400, on arrête le sensor
                console.warn('Erreur 400 reçue, arrêt du sensor');
                await this.stopSensor();
                throw new Error('Le sensor a été arrêté suite à une erreur 400');
            }
            
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des données');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erreur dans getLatestData:', error);
            if (error.message.includes('400')) {
                // Si l'erreur est liée au 400, on ne la propage pas plus loin
                // car le sensor a déjà été arrêté
                return null;
            }
            throw error;
        }
    }

    updateData(sensorData) {
        if (!sensorData || !sensorData.data) {
            console.error('Données invalides:', sensorData);
            return;
        }

        const timestamp = new Date().toISOString();
        this.data.timestamps.push(timestamp);

        const dataArray = sensorData.data;
        const paramMapping = {
            alx: 0, aly: 1, alz: 2,
            glx: 3, gly: 4, glz: 5,
            arx: 6, ary: 7, arz: 8,
            grx: 9, gry: 10, grz: 11
        };

        // Mettre à jour les données pour chaque paramètre
        this.selectedParams.forEach(param => {
            const index = paramMapping[param];
            if (index !== undefined) {
                // Garder la dernière valeur si la nouvelle est undefined
                const newValue = dataArray[index];
                const lastValue = this.data.values[param].length > 0 ? 
                    this.data.values[param][this.data.values[param].length - 1] : 
                    null;
                    
                this.data.values[param].push(newValue !== undefined ? newValue : lastValue);
            }
        });

        // Limiter la taille des données (garder les 100 derniers points)
        const maxDataPoints = 100;
        if (this.data.timestamps.length > maxDataPoints) {
            this.data.timestamps = this.data.timestamps.slice(-maxDataPoints);
            this.selectedParams.forEach(param => {
                this.data.values[param] = this.data.values[param].slice(-maxDataPoints);
            });
        }

        this.updateGraph();
    }

    async renderGraph() {
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.canvas, {
            type: 'line',
            data: {
                labels: this.data.timestamps,
                datasets: this.selectedParams.map(param => ({
                    label: this.getParameterLabel(param),
                    data: this.data.values[param],
                    borderColor: this.colors[param],
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'second',
                            displayFormats: {
                                second: 'HH:mm:ss'
                            }
                        },
                        display: true,
                        title: {
                            display: true,
                            text: 'Temps'
                        },
                        ticks: {
                            maxRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        display: true,
                        title: {
                            display: true,
                            text: 'Valeur'
                        }
                    }
                }
            }
        });
    }

    getParameterLabel(param) {
        const labels = {
            alx: 'Accélération X (cheville)',
            aly: 'Accélération Y (cheville)',
            alz: 'Accélération Z (cheville)',
            glx: 'Gyroscope X (cheville)',
            gly: 'Gyroscope Y (cheville)',
            glz: 'Gyroscope Z (cheville)',
            arx: 'Accélération X (bras)',
            ary: 'Accélération Y (bras)',
            arz: 'Accélération Z (bras)',
            grx: 'Gyroscope X (bras)',
            gry: 'Gyroscope Y (bras)',
            grz: 'Gyroscope Z (bras)'
        };
        return labels[param] || param;
    }

    updateGraph() {
        if (!this.chart) {
            console.warn('Pas de graphique à mettre à jour');
            return;
        }

        console.log('Mise à jour du graphique avec:', {
            timestamps: this.data.timestamps.length,
            datasets: this.chart.data.datasets.map(d => ({
                label: d.label,
                dataLength: d.data.length
            }))
        });

        this.chart.data.labels = this.data.timestamps;
        this.chart.data.datasets.forEach((dataset, index) => {
            const param = this.selectedParams[index];
            if (this.data.values[param]) {
                dataset.data = this.data.values[param];
            } else {
                console.warn(`Pas de données pour le paramètre ${param}`);
            }
        });

        try {
            this.chart.update('none');
        } catch (error) {
            console.error('Erreur lors de la mise à jour du graphique:', error);
        }
    }

    async stopSensor() {
        if (!this.isRunning) return;

        this.isRunning = false;

        try {
            const response = await fetch('/stop_reader', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patient_id: this.patientId,
                    activity: this.activity
                })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'arrêt du capteur');
            }

            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }

            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }

            // Supprimer le conteneur du graphique
            const graphDiv = document.getElementById(`graph_${this.patientId}_${this.activity}`);
            if (graphDiv) {
                graphDiv.remove();
            }

            // Vérifier si la ligne du patient est vide et la supprimer si c'est le cas
            const patientRow = document.getElementById(`patient_${this.patientId}`);
            if (patientRow && !patientRow.querySelector('.graph-card')) {
                patientRow.remove();
            }

            // Supprimer le sensor de la map du manager
            this.manager.sensors.delete(`${this.patientId}_${this.activity}`);

        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    }

    cleanup() {
        // Méthode pour nettoyer les ressources sans arrêter le sensor
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        // Supprimer le conteneur du graphique
        const graphDiv = document.getElementById(`graph_${this.patientId}_${this.activity}`);
        if (graphDiv) {
            graphDiv.remove();
        }

        // Vérifier si la ligne du patient est vide
        const patientRow = document.getElementById(`patient_${this.patientId}`);
        if (patientRow && !patientRow.querySelector('.graph-card')) {
            patientRow.remove();
        }
    }

    addParameters(newParams) {
        // Ajouter les nouveaux paramètres à la liste
        newParams.forEach(param => {
            if (!this.selectedParams.includes(param)) {
                this.selectedParams.push(param);
                this.data.values[param] = [];
            }
        });

        // Remplir les données historiques pour les nouveaux paramètres
        const dataLength = this.data.timestamps.length;
        newParams.forEach(param => {
            // Remplir avec des valeurs nulles pour aligner avec les données existantes
            this.data.values[param] = new Array(dataLength).fill(null);
        });

        // Mettre à jour le graphique avec les nouveaux paramètres
        this.updateGraphDatasets();
    }

    updateGraphDatasets() {
        if (!this.chart) return;

        // Mettre à jour les datasets du graphique
        this.chart.data.datasets = this.selectedParams.map(param => ({
            label: this.getParameterLabel(param),
            data: this.data.values[param],
            borderColor: this.colors[param],
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            fill: false
        }));

        this.chart.update();
    }

    removeParameter(param) {
        const index = this.selectedParams.indexOf(param);
        if (index > -1) {
            this.selectedParams.splice(index, 1);
            delete this.data.values[param];
            this.updateGraphDatasets();
        }
    }
}
