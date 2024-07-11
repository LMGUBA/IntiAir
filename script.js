const apiKey = '';
let map;
let marker;
let circle;

// Objeto para almacenar los mensajes de cada chat
let chats = {};
let chatCount = 0;
let currentChatId = null;

document.addEventListener('DOMContentLoaded', (event) => {
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Iniciar con un chat
    createNewChat();
});

function createNewChat() {
    chatCount++;
    const chatId = `chat-${chatCount}`;
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.textContent = `Chat ${chatCount}`;
    chatItem.onclick = () => switchChat(chatId);
    document.getElementById('chat-list').appendChild(chatItem);
    // Inicializar el nuevo chat con un mensaje de bienvenida
    chats[chatId] = [{
        text: 'Hola! Soy tu asistente de calidad del aire. Pregúntame sobre la calidad del aire en cualquier ciudad.',
        isUser: false
    }];
    switchChat(chatId);
}

function switchChat(chatId) {
    if (currentChatId) {
        document.querySelector(`.chat-item:nth-child(${parseInt(currentChatId.split('-')[1])})`).style.backgroundColor = '';
        document.querySelector(`.chat-item:nth-child(${parseInt(currentChatId.split('-')[1])})`).style.color = '';
    }
    document.querySelector(`.chat-item:nth-child(${parseInt(chatId.split('-')[1])})`).style.backgroundColor = '#50fa7b';
    document.querySelector(`.chat-item:nth-child(${parseInt(chatId.split('-')[1])})`).style.color = '#282a36';
    currentChatId = chatId;
    // Cargar los mensajes del chat seleccionado
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    chats[chatId].forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(message.isUser ? 'user-message' : 'bot-message');
        messageElement.textContent = message.text;
        chatMessages.appendChild(messageElement);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(message, isUser = false) {
    if (!currentChatId) return;
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    // Guardar el mensaje en el chat actual
    chats[currentChatId].push({ text: message, isUser: isUser });
}

function getAirQualityColor(aqi) {
    if (aqi <= 50) return '#00e400';      // Verde
    if (aqi <= 100) return '#ffff00';     // Amarillo
    if (aqi <= 150) return '#ff7e00';     // Naranja
    if (aqi <= 200) return '#ff0000';     // Rojo
    if (aqi <= 300) return '#8f3f97';     // Púrpura
    return '#7e0023';                     // Marrón
}

function getAirQualityCategory(aqi) {
    if (aqi <= 50) return 'Buena';
    if (aqi <= 100) return 'Aceptable';
    if (aqi <= 150) return 'Dañina a la salud de grupos sensibles';
    if (aqi <= 200) return 'Dañina a la salud';
    if (aqi <= 300) return 'Muy dañina a la salud';
    return 'Peligrosa';
}

function getAirPollution(lat, lon, city) {
    addMessage(`Buscando datos de calidad del aire para ${city}...`);
    
    fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            if (data.list && data.list.length > 0) {
                const airData = data.list[0].components;
                const aqi = data.list[0].main.aqi;
                const color = getAirQualityColor(aqi * 50);
                const category = getAirQualityCategory(aqi * 50);
                
                const message = `Datos de calidad del aire para ${city}:
                    Índice de Calidad del Aire: ${aqi * 50} (${category})
                    CO: ${airData.co} µg/m³
                    NO: ${airData.no} µg/m³
                    NO2: ${airData.no2} µg/m³
                    O3: ${airData.o3} µg/m³
                    SO2: ${airData.so2} µg/m³
                    PM2.5: ${airData.pm2_5} µg/m³
                    PM10: ${airData.pm10} µg/m³
                    NH3: ${airData.nh3} µg/m³`;
                
                addMessage(message);

                if (marker) {
                    map.removeLayer(marker);
                }
                if (circle) {
                    map.removeLayer(circle);
                }
                
                marker = L.marker([lat, lon]).addTo(map)
                    .bindPopup(message.replace(/\n/g, '<br>'))
                    .openPopup();
                
                circle = L.circle([lat, lon], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.5,
                    radius: 20000 // 20km radius
                }).addTo(map);
                
            } else {
                addMessage('No se encontraron datos de contaminación del aire para esta ubicación.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            addMessage('Hubo un error al obtener los datos de calidad del aire.');
        });
}

function extraerCiudadDeFrase(frase) {
    const palabrasClave = [
        "calidad del aire en", "calidad de aire en", "aire en", "aire de",
        "calidad de aire", "calida de aire", "calid de aire", "calid del aire",
        "contaminacion en", "contaminacion de", "contaminacion",
        "polucion en", "polucion de", "polucion",
        "cual es la calidad de aire en", "cual es la calida de aire en",
        "cual es la calidad del aire en", "cual es la calida del aire en",
        "contaminacion em", "contaminacion en",
        "nivel de contaminacion en", "nivel de contaminacion de",
        "nivel de polucion en", "nivel de polucion de",
        "como esta la contaminacion en", "como esta la polucion en",
        "cual es la polucion en", "cual es la polucion de",
        "estado de la contaminacion en", "estado de la polucion en",
        "calid de aire en", "calida del aire en",
        "calidad aire en", "calida aire en", "calidad del aire",
        "aire calidad en", "aire calida en", "aire contaminacion en",
        "aire polucion en", "calidad contaminacion en",
        "calidad polucion en", "contaminacion calidad en",
        "polucion calidad en", "contaminacion del aire en",
        "polucion del aire en", "aire contaminado en",
        "calida contaminacion en", "calidad polucion del aire en",
        "contaminacion del distrito de", "polucion del distrito de",
        "contaminacion de la provincia de", "polucion de la provincia de",
        "quiero saber la contaminacion en", "quiero saber la polucion en",
        "cual es la calidad de aire en", "cual es la polucion en",
        "cual es la contaminacion en", "cual es la calidad del aire de",
        "contaminacion del pais", "polucion del pais", "calidad de aire del pais",
        "calidad del aire del pais", "cual es la calidad de aire del pais",
        "cual es la polucion del pais", "cual es la contaminacion del pais",
        "quiero saber la contaminacion del pais", "quiero saber la polucion del pais"
    ];

    // Normalizar texto a minúsculas y eliminar tildes
    const normalizarTexto = (texto) => {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const fraseNormalizada = normalizarTexto(frase);

    for (const palabraClave of palabrasClave) {
        const palabraClaveNormalizada = normalizarTexto(palabraClave);
        const indice = fraseNormalizada.indexOf(palabraClaveNormalizada);
        if (indice !== -1) {
            return frase.slice(indice + palabraClave.length).trim();
        }
    }
    return frase.trim(); // Si no encuentra palabras clave, usa la frase completa
}

function searchCity() {
    if (!currentChatId) return;
    const userInput = document.getElementById('city-input').value;
    addMessage(userInput, true);
    
    const city = extraerCiudadDeFrase(userInput);
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;
                map.setView([lat, lon], 10);
                getAirPollution(lat, lon, city);
            } else {
                addMessage(`No se encontró la ciudad "${city}". Por favor, intenta con otra.`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            addMessage('Hubo un error al buscar la ciudad.');
        });
    
    // Limpiar el campo de entrada después de procesar la consulta
    document.getElementById('city-input').value = '';
}

document.getElementById('send-button').addEventListener('click', searchCity);
document.getElementById('city-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchCity();
    }
});

document.getElementById('new-chat-btn').addEventListener('click', createNewChat);

window.addEventListener('resize', function() {
    if (map) {
        map.invalidateSize();
    }
});