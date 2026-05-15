function formatOllamaError(status, body = '') {
    const raw = typeof body === 'string' ? body : JSON.stringify(body);

    if (/CUDA|shared object initialization failed|llama runner process has terminated/i.test(raw)) {
        return (
            'Ollama no pudo usar la GPU (error CUDA).\n\n' +
            'Arreglo rápido — forzar solo CPU:\n' +
            '1. Cierra Ollama (icono bandeja → Salir)\n' +
            '2. PowerShell:\n' +
            '   $env:OLLAMA_NUM_GPU="0"\n' +
            '   ollama serve\n' +
            '3. En .env pon: OLLAMA_NUM_GPU=0\n' +
            '4. Prueba: ollama run llama3.1:8b hola\n\n' +
            'Órdenes básicas (seguir, para, madera, animales) funcionan sin Ollama.'
        );
    }

    if (status === 404 || /model.*not found/i.test(raw)) {
        return 'Modelo no encontrado en Ollama. Ejecuta: ollama pull llama3.1:8b';
    }

    const short = raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
    return `Ollama HTTP ${status}: ${short || 'error desconocido'}`;
}

module.exports = { formatOllamaError };
