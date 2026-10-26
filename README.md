# The Midnight Curse — Eureka LIVE

A real-time four-team B1 Halloween escape room. Students use one phone per team; teacher projects the live leaderboard.

## Host it
1. Upload this folder to a Node.js hosting provider (for example Render or Railway) as a web service.
2. Install/build command: `npm install`.
3. Start command: `npm start`.
4. Set environment variable `TEACHER_PIN` to a private code you choose. Do not share this PIN with students.
5. Use the provider's HTTPS URL. Teacher opens `/teacher.html` on their computer. Students open the root URL on their phones. You can turn the URL into a QR code using a QR generator.
6. Each team enters a unique name, teacher starts all teams, and progress updates live.

## Competition
- Four teams maximum; one phone per team.
- Eight puzzles can be solved in any order; all eight required to escape.
- Wrong answer: +30 seconds. First use of hint per puzzle: +2 minutes.
- Leader is the finished team with lowest (elapsed + penalties) time.
- The leaderboard announces a **current leader** until the competition ends. If a team finishes later with a better adjusted time, it becomes leader.

## Limitations
- This version is a starter project, not yet a hardened production deployment.
- State is held in server memory and resets if the hosting service restarts; use persistent storage for a robust classroom event.
- No cross-device automatic start for devices that are offline at the moment of start.
- All teams must have internet access. If the hosting service sleeps, it may take time to wake up.
- The teacher PIN is server-side and should be set as a secret environment variable.
- Test with four phones before class.

## Teacher answer key
1. 1200
2. RED
3. UNDER
4. DAN
5. 2136
6. HADNT
7. 127
8. LISTEN
