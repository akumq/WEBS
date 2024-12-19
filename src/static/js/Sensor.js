class Sensor {
    constructor(patientId, activity, selectedParams, refreshRate) {
        this.patientId = patientId;
        this.activity = activity;
        this.selectedParams = selectedParams;
        this.refreshRate = refreshRate;
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
        const graphsContainer = document.getElementById('graphsContainer');
        
        // Créer un conteneur pour ce graphique
        const graphDiv = document.createElement('div');
        graphDiv.className = 'col-md-6 mb-4';
        graphDiv.id = `graph_${this.patientId}_${this.activity}`;
        
        // Ajouter un titre
        const title = document.createElement('h4');
        title.textContent = `Patient ${this.patientId} - ${this.getActivityName(this.activity)}`;
        graphDiv.appendChild(title);

        // Créer le canvas
        const canvas = document.createElement('canvas');
        graphDiv.appendChild(canvas);
        
        // Ajouter au conteneur principal
        graphsContainer.appendChild(graphDiv);
        
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
            try {
                const data = await this.getLatestData();
                this.updateData(data);
            } catch (error) {
                console.error('Erreur lors de la récupération des données:', error);
            }
        }, this.refreshRate);
    }

    async getLatestData() {
        const params = new URLSearchParams({
            patient_id: this.patientId,
            activity: this.activity
        });

        const response = await fetch(`/get_latest_data?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données');
        }
        const data = await response.json();
        console.log('Données reçues:', data);  // Debug
        return data;
    }

    updateData(sensorData) {
        // Vérifier que sensorData.data existe
        if (!sensorData || !sensorData.data) {
            console.error('Données invalides:', sensorData);
            return;
        }

        const timestamp = new Date().toISOString();
        this.data.timestamps.push(timestamp);

        // Mettre à jour uniquement les paramètres sélectionnés
        const dataArray = sensorData.data;
        const paramMapping = {
            alx: 0, aly: 1, alz: 2,
            glx: 3, gly: 4, glz: 5,
            arx: 6, ary: 7, arz: 8,
            grx: 9, gry: 10, grz: 11
        };

        this.selectedParams.forEach(param => {
            const index = paramMapping[param];
            if (index !== undefined && dataArray[index] !== undefined) {
                this.data.values[param].push(dataArray[index]);
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

        // Debug
        console.log('Données mises à jour:', {
            timestamps: this.data.timestamps.length,
            values: Object.fromEntries(
                Object.entries(this.data.values).map(([k, v]) => [k, v.length])
            )
        });

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
                    fill: false  // Empêcher le remplissage
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
                            unit: 'second'
                        },
                        display: true,
                        title: {
                            display: true,
                            text: 'Temps'
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

        try {
            const response = await fetch('/stop_reader', {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'arrêt du capteur');
            }

            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }

            this.isRunning = false;
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }

            // Supprimer le conteneur du graphique
            const graphDiv = document.getElementById(`graph_${this.patientId}_${this.activity}`);
            if (graphDiv) {
                graphDiv.remove();
            }
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    }
}
