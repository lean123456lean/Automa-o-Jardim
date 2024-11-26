const five = require("johnny-five");
const board = new five.Board();

// Configurações iniciais
const MIN_MOISTURE = 300;       // Nível mínimo de umidade para acionar a irrigação
const MAX_WATERING_TIME = 30000; // Tempo máximo para manter a irrigação ligada (em milissegundos)
const DEBOUNCE_TIME = 1000;      // Tempo de debounce para evitar leituras excessivas

board.on("ready", () => {
    console.log("Placa conectada e pronta!");

    // Sensor de umidade (ex: pino A0)
    const moistureSensor = new five.Sensor("A0");

    // Relé ou válvula (pino 7)
    const valve = new five.Relay(7);

    // Variável para controlar o estado da irrigação
    let isWatering = false;
    let wateringTimeout = null;
    let lastMoistureReading = 0;
    let lastWateringTime = 0;

    // Função para iniciar a irrigação
    function startWatering() {
        if (!isWatering) {
            isWatering = true;
            valve.on();
            console.log(`[${new Date().toLocaleString()}] Iniciando irrigação.`);

            // Configura um temporizador para interromper a irrigação após o tempo máximo
            wateringTimeout = setTimeout(stopWatering, MAX_WATERING_TIME);
        }
    }

    // Função para parar a irrigação
    function stopWatering() {
        if (isWatering) {
            isWatering = false;
            valve.off();
            if (wateringTimeout) clearTimeout(wateringTimeout);
            console.log(`[${new Date().toLocaleString()}] Irrigação interrompida.`);
        }
    }

    // Monitoramento do sensor de umidade com debounce
    moistureSensor.on("data", () => {
        const moisture = moistureSensor.value;
        const currentTime = Date.now();

        // Evita leituras excessivas em pouco tempo
        if (currentTime - lastMoistureReading < DEBOUNCE_TIME) {
            return;
        }
        lastMoistureReading = currentTime;

        console.log(`[${new Date().toLocaleString()}] Umidade do solo: ${moisture}`);

        // Aciona a irrigação somente se a umidade estiver abaixo do mínimo e a irrigação não estiver ligada
        if (moisture < MIN_MOISTURE && !isWatering) {
            console.log(`[${new Date().toLocaleString()}] Umidade abaixo do mínimo (${MIN_MOISTURE}). Iniciando irrigação...`);
            startWatering();
        } 
        // Interrompe a irrigação se a umidade estiver suficiente e a irrigação estiver em andamento
        else if (moisture >= MIN_MOISTURE && isWatering) {
            console.log(`[${new Date().toLocaleString()}] Umidade suficiente. Interrompendo irrigação.`);
            stopWatering();
        }
    });
});
