class Sensor {
    constructor(patientId, activity) {
        this.patientId = patientId;
        this.activity = activity;
        this.isRunning = false;
        this.chart = null;
        this.maxPoints = 50;
        this.updateInterval = null;
    }

    async startSensor() {
        try {
            const response = await fetch('/start_reader', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patient_id: this.patientId,
                    activity: this.activity
                })
            });

            if (!response.ok) throw new Error('Erreur lors du démarrage du capteur');
            
            this.isRunning = true;
            return await response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    }

    async stopSensor() {
        if (!this.isRunning) return;

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

            if (!response.ok) throw new Error('Erreur lors de l\'arrêt du capteur');
            
            this.isRunning = false;
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    }

    async getLatestData() {
        try {
            const params = new URLSearchParams({
                patient_id: this.patientId,
                activity: this.activity
            });

            const response = await fetch(`/get_latest_data?${params.toString()}`);
            if (!response.ok) throw new Error('Erreur lors de la récupération des données');
            
            return await response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    }

    async renderGraph() {
        const ctx = document.getElementById('sensorGraph').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(this.maxPoints).fill(''),
                datasets: [
                    {
                        label: 'X',
                        data: Array(this.maxPoints).fill(0),
                        borderColor: 'red',
                        tension: 0.4
                    },
                    {
                        label: 'Y',
                        data: Array(this.maxPoints).fill(0),
                        borderColor: 'green',
                        tension: 0.4
                    },
                    {
                        label: 'Z',
                        data: Array(this.maxPoints).fill(0),
                        borderColor: 'blue',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                animation: false,
                scales: {
                    y: {
                        min: -10,
                        max: 10
                    }
                }
            }
        });

        this.startGraphUpdate();
    }

    startGraphUpdate() {
        this.updateInterval = setInterval(async () => {
            if (!this.isRunning) return;

            try {
                const response = await this.getLatestData();
                if (response.data) {
                    this.updateGraphData(response.data);
                }
            } catch (error) {
                console.error('Erreur de mise à jour du graphique:', error);
            }
        }, 100);
    }

    updateGraphData(newData) {
        if (!this.chart) return;

        // Mise à jour des données pour chaque axe
        this.chart.data.datasets.forEach((dataset, index) => {
            dataset.data.shift();
            dataset.data.push(newData[index]);
        });

        this.chart.update();
    }
}
