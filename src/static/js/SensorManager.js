class SensorManager {
    constructor() {
        this.currentSensor = null;
        this.initializeUI();
    }

    initializeUI() {
        this.populateSelect('patientId', 1, 10, 'Patient');
        this.populateSelect('activity', 0, 11, 'Activité');

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
        const patientId = parseInt(document.getElementById('patientId').value);
        const activity = parseInt(document.getElementById('activity').value);

        this.currentSensor = new Sensor(patientId, activity);

        if (this.currentSensor) {
            await this.handleStop();
        }

        try {
            this.currentSensor = new Sensor(patientId, activity);
            await this.currentSensor.startSensor();
            await this.currentSensor.renderGraph();

            document.getElementById('startButton').disabled = true;
            document.getElementById('stopButton').disabled = false;
        } catch (error) {
            console.error('Erreur lors du démarrage:', error);
            alert('Erreur lors du démarrage du capteur');
        }
    }

    async handleStop() {
        if (!this.currentSensor) return;

        try {
            await this.currentSensor.stopSensor();
            this.currentSensor = null;

            document.getElementById('startButton').disabled = false;
            document.getElementById('stopButton').disabled = true;
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
