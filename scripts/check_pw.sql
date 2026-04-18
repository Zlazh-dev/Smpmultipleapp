SELECT username, LEFT("hashedPassword", 25) as pw_preview FROM "User" ORDER BY username;
