const { exec } = require('child_process');

const PORT = process.env.PORT || 5000;

exec(`netstat -ano | findstr :${PORT}`, (error, stdout, stderr) => {
    if (error) {
        console.log(`No processes found running on port ${PORT}.`);
        return;
    }

    const lines = stdout.split('\n');
    let killed = false;
    for (const line of lines) {
        const match = line.match(/\s+(\d+)\s*$/);
        if (match) {
            const pid = match[1];
            if (pid !== '0' && pid) {
               console.log(`Killing process ${pid} on port ${PORT}...`);
               exec(`taskkill /F /PID ${pid}`, (err) => {
                   if (err) console.error(`Failed to kill process ${pid}`, err.message);
                   else console.log(`Successfully killed process ${pid}`);
               });
               killed = true;
            }
        }
    }
    if (!killed) {
        console.log(`No processes needed to be killed on port ${PORT}.`);
    }
});
