"use server"

import * as net from 'net'
import * as tls from 'tls'
import * as dns from 'dns/promises'
import { z } from 'zod'

// --- 1. DEFAULT TARGETS ---
const DEFAULT_TARGETS = [
  { name: "Google Public DNS", host: "8.8.8.8", port: 53 },
  { name: "Google.com (External)", host: "google.com", port: 443 },
  { name: "Localhost", host: "127.0.0.1", port: 8080 },
  { name: "PGA IPs", host: "199.36.153.8", port: 80 }
]

export async function getDefaultTargets() {
  return DEFAULT_TARGETS
}

// --- 2. EGRESS IP VERIFICATION (NAT CHECK) ---
export async function checkEgressIp() {
  try {
    // httpbin or ipify are great for bouncing back the requesting IP
    const response = await fetch('https://api64.ipify.org?format=json')
    const data = await response.json()
    return { success: true, ip: data.ip }
  } catch (e: any) {
    return { success: false, ip: 'Unknown', error: e.message }
  }
}

// --- 3. DIAGNOSTIC TRACE ---
const testSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().min(1).max(65535).default(443),
  tcpCount: z.number().min(1).max(10).default(4)
})

export async function testDiagnosticTrace(data: { host: string; port: number; tcpCount: number }) {
  // Validate input parameters
  const parsedData = testSchema.parse(data);
  const { host, port, tcpCount } = parsedData;

  const trace = {
    dns: { status: 'pending', ip: '', latencyMs: 0, family: 0, error: '' },
    tcp: { status: 'pending', successes: 0, count: tcpCount, avgLatencyMs: 0, error: '' },
    tls: { status: 'pending', protocol: '', cipher: '', issuer: '', altNames: '', daysLeft: 0, error: '' },
    http: { status: 'pending', statusCode: 0, statusText: '', latencyMs: 0, error: '' }
  }

  // --- STEP 1: ADVANCED DNS RESOLUTION ---
  try {
    const dnsStart = performance.now()
    if (net.isIP(host)) {
      trace.dns = { status: 'skipped', ip: host, latencyMs: 0, family: net.isIPv6(host) ? 6 : 4, error: '' }
    } else {
      const lookup = await dns.lookup(host)
      trace.dns.latencyMs = Math.round(performance.now() - dnsStart)
      trace.dns.ip = lookup.address
      trace.dns.family = lookup.family // Identifies if it resolved to IPv4 or IPv6
      trace.dns.status = 'success'
    }
  } catch (e: any) {
    trace.dns.status = 'error'
    trace.dns.error = `Could not translate domain to IP. (${e.code})`
    return { overallStatus: 'failed', trace }
  }

  const targetIp = trace.dns.ip

  // --- STEP 2: TCP CONNECTION STABILITY LOOP ---
  const latencies: number[] = []
  let tcpError = ''

  for (let i = 0; i < tcpCount; i++) {
    try {
      const start = performance.now()
      await new Promise<void>((resolve, reject) => {
        const socket = new net.Socket()
        socket.setTimeout(2000) // 2 second timeout per ping
        
        socket.connect(port, targetIp, () => {
          latencies.push(Math.round(performance.now() - start))
          trace.tcp.successes++
          socket.destroy()
          resolve()
        })

        socket.on('timeout', () => {
          socket.destroy()
          reject(new Error('Connection timed out.'))
        })

        socket.on('error', (err: any) => {
          let msg = err.message
          if (err.code === 'ECONNREFUSED') msg = 'Connection refused (Port closed).'
          reject(new Error(msg))
        })
      })
    } catch (e: any) {
      tcpError = e.message
    }
    // Brief sleep between pings to simulate real traffic spread
    if (i < tcpCount - 1) await new Promise(r => setTimeout(r, 50))
  }

  if (trace.tcp.successes > 0) {
    trace.tcp.status = trace.tcp.successes === tcpCount ? 'success' : 'degraded'
    trace.tcp.avgLatencyMs = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    if (trace.tcp.status === 'degraded') trace.tcp.error = `Packet loss detected. ${tcpError}`
  } else {
    trace.tcp.status = 'error'
    trace.tcp.error = `All ${tcpCount} connections failed. ${tcpError}`
    return { overallStatus: 'failed', trace }
  }

  // --- STEP 3: ENHANCED TLS/SSL HANDSHAKE ---
  if (port === 443) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = tls.connect(port, targetIp, {
          servername: net.isIP(host) ? undefined : host, 
          rejectUnauthorized: true, 
          timeout: 3000
        }, () => {
          const cert = socket.getPeerCertificate()
          trace.tls.protocol = socket.getProtocol() || 'Unknown'
          trace.tls.cipher = socket.getCipher().name || 'Unknown'
          
          if (cert && cert.valid_to) {
            const expiryDate = new Date(cert.valid_to)
            trace.tls.daysLeft = Math.floor((expiryDate.getTime() - Date.now()) / 86400000)
            
            // Extract the first string if it's an array
            const getIssuerAttr = (val: string | string[] | undefined) => 
               Array.isArray(val) ? val[0] : val;

            trace.tls.issuer = getIssuerAttr(cert.issuer?.O) || getIssuerAttr(cert.issuer?.CN) || 'Unknown'
            trace.tls.altNames = cert.subjectaltname || 'None'
            trace.tls.status = 'success'
          }
          socket.end()
          resolve()
        })

        socket.on('timeout', () => reject(new Error('TLS Handshake timed out.')))
        socket.on('error', (err: any) => reject(new Error(`SSL Error: ${err.message}`)))
      })
    } catch (e: any) {
      trace.tls.status = 'error'
      trace.tls.error = e.message
      return { overallStatus: 'failed', trace }
    }
  } else {
    trace.tls.status = 'skipped'
  }

  // --- STEP 4: LAYER 7 HTTP/APPLICATION CHECK ---
  if (port === 80 || port === 443) {
    const protocol = port === 443 ? 'https' : 'http'
    const targetUrl = `${protocol}://${host}`
    try {
      const httpStart = performance.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      // Using HEAD to check headers without downloading a massive body
      const response = await fetch(targetUrl, { 
        method: 'HEAD',
        signal: controller.signal 
      })
      clearTimeout(timeoutId)

      trace.http.latencyMs = Math.round(performance.now() - httpStart)
      trace.http.statusCode = response.status
      trace.http.statusText = response.statusText
      trace.http.status = response.ok || response.status < 400 ? 'success' : 'error'
      
      if (trace.http.status === 'error') {
          trace.http.error = `Server returned HTTP ${response.status} ${response.statusText}`
      }

    } catch (e: any) {
      trace.http.status = 'error'
      trace.http.error = `HTTP Request failed: ${e.message}`
      // We don't fail the overall trace here, because the network is technically reachable, just the HTTP layer failed.
    }
  } else {
    trace.http.status = 'skipped'
  }

  // Determine overall status
  const isDegraded = trace.tcp.status === 'degraded' || trace.http.status === 'error'
  return { overallStatus: isDegraded ? 'degraded' : 'success', trace }
}
