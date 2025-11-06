const bcrypt = require('bcrypt');
const saltRounds = 10;

// The plain-text password you requested
const plainTextPassword = 'admin';

console.log(`Hashing password: "${plainTextPassword}"...`);

bcrypt.hash(plainTextPassword, saltRounds, (err, hash) => {
    if (err) {
        console.error("Error hashing password:", err);
        return;
    }
    console.log("\n--- COPY YOUR HASH BELOW ---");
    console.log(hash);
    console.log("------------------------------");
});