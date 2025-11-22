// Скрипт для тестирования API входа
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1/auth/login';

async function testLogin() {
  try {
    console.log('🧪 Тестирование API входа...\n');
    console.log(`URL: ${API_URL}`);
    console.log('Данные:', { email: 'admin@example.com', password: 'password123' });
    console.log('\n');

    const response = await axios.post(API_URL, {
      email: 'admin@example.com',
      password: 'password123',
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Успешный вход!');
    console.log('Ответ:', JSON.stringify(response.data, null, 2));
    console.log('\n📝 Токены получены:');
    console.log(`Access Token: ${response.data.data.accessToken.substring(0, 50)}...`);
    console.log(`Refresh Token: ${response.data.data.refreshToken.substring(0, 50)}...`);

  } catch (error) {
    console.error('❌ Ошибка входа:');
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Данные:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Нет ответа от сервера');
      console.error('Убедитесь, что сервер запущен: npm run dev');
    } else {
      console.error('Ошибка:', error.message);
    }
  }
}

testLogin();

