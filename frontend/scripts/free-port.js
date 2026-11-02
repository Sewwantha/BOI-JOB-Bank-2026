// Runs before `npm run dev` (predev) so the dev server can always bind its fixed port.
// Stops a leftover Vite dev server holding the port; refuses to touch any other program.
import { execSync } from 'node:child_process'

const PORT = 5173 // keep in sync with server.port in vite.config.ts
const isWindows = process.platform === 'win32'

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return ''
  }
}

function listeningPids() {
  if (isWindows) {
    const pids = run('netstat -ano -p tcp')
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/))
      .filter((cols) => cols[0] === 'TCP' && cols[1]?.endsWith(`:${PORT}`) && cols[3] === 'LISTENING')
      .map((cols) => cols[4])
    return [...new Set(pids)]
  }
  return run(`lsof -t -iTCP:${PORT} -sTCP:LISTEN`).split(/\s+/).filter(Boolean)
}

function commandLine(pid) {
  if (isWindows) {
    return run(
      `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`,
    ).trim()
  }
  return run(`ps -o command= -p ${pid}`).trim()
}

const pids = listeningPids()
let blocked = false

for (const pid of pids) {
  const cmd = commandLine(pid)
  if (/vite/i.test(cmd)) {
    console.log(`[free-port] Stopping old Vite dev server on port ${PORT} (PID ${pid}).`)
    run(isWindows ? `taskkill /PID ${pid} /T /F` : `kill ${pid}`)
  } else {
    blocked = true
    console.error(`[free-port] Port ${PORT} is used by another program (PID ${pid}): ${cmd || 'unknown'}`)
  }
}

if (blocked) {
  console.error(`[free-port] Close that program and run "npm run dev" again.`)
  process.exit(1)
}
