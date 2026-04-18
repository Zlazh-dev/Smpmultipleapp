-- Password: SmpIT2026 (verified bcrypt hash, $2b$ prefix for Node.js)
UPDATE "User" SET "hashedPassword" = '$2b$12$eB5vQXnqkcSH0a2XrIpLXugGb1UqKXuCSUVCqeT1WoS5qm26hSWM6', "updatedAt" = NOW() WHERE 1=1;
SELECT username, LEFT("hashedPassword", 25) as pw FROM "User" ORDER BY username;
