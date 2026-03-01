"use client"

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { testDiagnosticTrace, checkEgressIp } from '@/app/actions/network'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Server, Globe, Lock, Loader2, Info, FileCode2 } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  Accordion
} from "@/components/ui/accordion"
import { TraceStep, type TraceStatus } from '@/components/TraceStep'

export default function NetworkDebuggerClient({ defaultTargets }: { defaultTargets: { name: string, host: string, port: number }[] }) {
  const [host, setHost] = useState('')
  const [port, setPort] = useState<number>(443)

  const egressIpQuery = useQuery({
    queryKey: ['egressIp'],
    queryFn: () => checkEgressIp(),
    staleTime: 1000 * 60 * 5 
  })

  const scanMutation = useMutation({
    mutationFn: (variables: { host: string; port: number }) =>
      testDiagnosticTrace({ ...variables, tcpCount: 4 }), 
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!host.trim()) return
    scanMutation.mutate({ host: host.trim(), port })
  }

  const handleQuickTest = (targetHost: string, targetPort: number) => {
    setHost(targetHost)
    setPort(targetPort)
    scanMutation.mutate({ host: targetHost, port: targetPort })
  }

  const result = scanMutation.data

  return (
    <TooltipProvider delayDuration={300}>
      <div className="p-4 md:p-6 -mt-2 font-sans">
        <div className="max-w-3xl mx-auto space-y-2">

          {/* Egress IP Header */}
          <div className="flex items-center justify-between bg-card/30 border border-border/50 rounded-lg py-2 px-3">
            <div className="flex items-center gap-2 cursor-help">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">The public NAT IP address this Cloud Run instance is using to communicate outward to the internet.</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Egress IP</span>
            </div>
            <div className="text-xs font-mono font-bold bg-background px-2.5 py-1 rounded border shadow-sm">
              {egressIpQuery.isPending ? <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" /> :
                egressIpQuery.data?.success ? egressIpQuery.data.ip : 'Detection Failed'}
            </div>
          </div>

          {/* Form Card */}
          <Card className="p-4 border border-border bg-card/50 shadow-sm rounded-lg">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="target-host" className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-fit cursor-help">
                      Target Endpoint
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Enter a domain name (e.g., api.stripe.com) or an internal IP address.</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="target-host" autoFocus placeholder="e.g., google.com"
                  value={host} onChange={(e) => setHost(e.target.value)} required
                  className="h-10 text-sm bg-background/50"
                />
              </div>

              <div className="w-full sm:w-28 space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="target-port" className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-fit cursor-help">
                      Port
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">TCP port (e.g., 443 for HTTPS, 80 for HTTP).</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="target-port" type="number" value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  min={1} max={65535} required className="h-10 text-sm bg-background/50"
                />
              </div>

              <Button type="submit" disabled={scanMutation.isPending || !host} className="h-10 w-full sm:w-28 text-sm font-medium">
                {scanMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Run Test"}
              </Button>
            </form>

            <div className="pt-4 border-t border-border/40 flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs font-semibold text-muted-foreground mr-1 cursor-help">Quick Tests:</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Pre-configured destinations to verify basic outbound connectivity.</p>
                </TooltipContent>
              </Tooltip>

              {defaultTargets.map((t) => (
                <Tooltip key={t.name}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleQuickTest(t.host, t.port)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border/50"
                    >
                      {t.name}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{`Test for ${t.name} (${t.host}:${t.port})`}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </Card>

          {scanMutation.isError && (
            <Alert variant="destructive" className="py-3 px-4">
              <AlertDescription className="text-sm font-medium">
                Execution Failed: {scanMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mt-6 mb-2 px-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest cursor-help">Trace Logs</h2>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Step-by-step OSI model diagnostic breakdown for this connection.</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`text-[10px] px-2.5 py-1 rounded font-bold text-white cursor-help
                      ${result.overallStatus === 'success' ? 'bg-green-600 dark:bg-green-500' :
                        result.overallStatus === 'degraded' ? 'bg-yellow-600 dark:bg-yellow-500' : 'bg-red-600 dark:bg-red-500'}`}>
                      {result.overallStatus.toUpperCase()}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">The overall health rating of this specific endpoint test.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Accordion type="multiple" className="w-full space-y-3">
                
                {/* 1. DNS Layer (Always shown) */}
                <TraceStep
                  id="dns" icon={<Globe className="w-3.5 h-3.5" />} title="DNS Resolution" 
                  status={result.trace.dns.status as TraceStatus}
                  successText={`${result.trace.dns.ip} (IPv${result.trace.dns.family}) • ${result.trace.dns.latencyMs}ms`}
                  errorText={result.trace.dns.error}
                  tooltipText="Verifies if the domain name can be successfully translated into an IP address via Cloud DNS (Layer 3)."
                  details={{
                    "Resolved IP": result.trace.dns.ip,
                    "IP Family": `IPv${result.trace.dns.family}`,
                    "Latency": `${result.trace.dns.latencyMs}ms`,
                    ...(result.trace.dns.error && { "Error Output": result.trace.dns.error })
                  }}
                />

                {/* 2. TCP Layer (Always shown) */}
                <TraceStep
                  id="tcp" icon={<Server className="w-3.5 h-3.5" />} title={`TCP Routing (Port ${port})`} 
                  status={result.trace.tcp.status as TraceStatus}
                  successText={`${result.trace.tcp.successes}/${result.trace.tcp.count} connected • ${result.trace.tcp.avgLatencyMs}ms avg`}
                  errorText={result.trace.tcp.error}
                  tooltipText="Checks if packets can successfully traverse the VPC to reach the destination and if the target port is open (Layer 4)."
                  details={{
                    "Target Port": port,
                    "Success Rate": `${result.trace.tcp.successes} / ${result.trace.tcp.count} Connections`,
                    "Average Latency": `${result.trace.tcp.avgLatencyMs}ms`,
                    ...(result.trace.tcp.error && { "Error Output": result.trace.tcp.error })
                  }}
                />

                {/* 3. TLS Layer (Shown if port is 443, regardless of TCP success) */}
                {port === 443 && (
                  <TraceStep
                    id="tls" icon={<Lock className="w-3.5 h-3.5" />} title="TLS Security" 
                    status={(result.trace.tls?.status || 'pending') as TraceStatus}
                    successText={`${result.trace.tls?.protocol} (${result.trace.tls?.cipher}) • ${result.trace.tls?.daysLeft} days left`}
                    errorText={result.trace.tls?.error}
                    tooltipText="Verifies the SSL/TLS certificate validity, issuer, and encryption protocol (Layer 6)."
                    details={{
                      "Protocol": result.trace.tls?.protocol,
                      "Cipher Suite": result.trace.tls?.cipher,
                      "Valid Days Remaining": result.trace.tls?.daysLeft,
                      ...(result.trace.tls?.error && { "Error Output": result.trace.tls?.error })
                    }}
                  />
                )}

                {/* 4. HTTP Layer (Shown if port is 80 or 443, regardless of TLS/TCP success) */}
                {(port === 80 || port === 443) && (
                  <TraceStep
                    id="http" icon={<FileCode2 className="w-3.5 h-3.5" />} title="HTTP Layer 7" 
                    status={(result.trace.http?.status || 'pending') as TraceStatus}
                    successText={`HTTP ${result.trace.http?.statusCode} ${result.trace.http?.statusText} • ${result.trace.http?.latencyMs}ms`}
                    errorText={result.trace.http?.error}
                    tooltipText="Tests the application response code (e.g., HTTP 200) to ensure the service is not throwing a 403 WAF block or 500 error (Layer 7)."
                    details={{
                      "Status Code": result.trace.http?.statusCode,
                      "Status Message": result.trace.http?.statusText,
                      "Response Latency": `${result.trace.http?.latencyMs}ms`,
                      ...(result.trace.http?.error && { "Error Output": result.trace.http?.error })
                    }}
                  />
                )}
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
