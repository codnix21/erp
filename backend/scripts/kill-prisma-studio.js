const { execSync } = require('child_process');

console.log('🔍 Looking for Prisma Studio processes...');

try {
  // Ищем процессы, использующие порты 5555 или 51212
  const ports = [5555, 51212];
  
  for (const port of ports) {
    try {
      // Находим PID процесса, использующего порт
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
      const lines = result.split('\n').filter(line => line.includes('LISTENING'));
      
      if (lines.length > 0) {
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          
          if (pid && !isNaN(pid)) {
            console.log(`🛑 Killing process ${pid} on port ${port}...`);
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
              console.log(`✅ Process ${pid} killed`);
            } catch (error) {
              console.log(`⚠️  Could not kill process ${pid}: ${error.message}`);
            }
          }
        }
      }
    } catch (error) {
      // Порт не занят, это нормально
    }
  }
  
  console.log('✅ Done!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

