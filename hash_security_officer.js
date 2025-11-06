const bcrypt = require('bcrypt');
const saltRounds = 10;

const plainTextPassword = 'security123';

console.log(`Hashing password: "${plainTextPassword}"...`);

bcrypt.hash(plainTextPassword, saltRounds, (err, hash) => {
    if (err) {
        console.error("Error hashing password:", err);
        return;
    }
    console.log("\n--- SECURITY OFFICER PASSWORD HASH ---");
    console.log(hash);
    console.log("---------------------------------------");
    process.exit(0);
});
