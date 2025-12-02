"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ApiTestPanelProps {
  apiKey: string | null
  baseUrl: string
  organizationId?: string | null
}

const getAvailableEndpoints = (orgId: string | null | undefined) => [
  { 
    value: "health.check", 
    label: "Health Check", 
    method: "GET",
    description: "Check API health status",
    inputExample: "{}"
  },
  { 
    value: "auth.me", 
    label: "Get Current User", 
    method: "GET",
    description: "Get authenticated user info",
    inputExample: "{}"
  },
  { 
    value: "projects.list", 
    label: "List Projects", 
    method: "GET",
    description: "List all projects for organization",
    inputExample: JSON.stringify({ organizationId: orgId || "your-org-id", skip: 0, take: 10 }, null, 2)
  },
  { 
    value: "organizations.list", 
    label: "List Organizations", 
    method: "GET",
    description: "List user's organizations",
    inputExample: JSON.stringify({ skip: 0, take: 10 }, null, 2)
  },
]

export function ApiTestPanel({ apiKey, baseUrl, organizationId }: ApiTestPanelProps) {
  const availableEndpoints = getAvailableEndpoints(organizationId)
  const [selectedEndpoint, setSelectedEndpoint] = useState(availableEndpoints[0].value)
  const [inputData, setInputData] = useState(availableEndpoints[0].inputExample)
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusCode, setStatusCode] = useState<number | null>(null)

  const selectedEndpointInfo = availableEndpoints.find(e => e.value === selectedEndpoint)

  const handleEndpointChange = (value: string) => {
    setSelectedEndpoint(value)
    const endpoint = availableEndpoints.find(e => e.value === value)
    if (endpoint) {
      setInputData(endpoint.inputExample)
    }
    setResponse(null)
    setError(null)
    setStatusCode(null)
  }

  const runApiCall = async () => {
    if (!apiKey) {
      setError("API Key is required")
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)
    setStatusCode(null)

    try {
      const endpoint = selectedEndpointInfo
      const isQuery = endpoint?.method === "GET"
      
      let url = `${baseUrl}/${selectedEndpoint}`
      let options: RequestInit = {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }

      if (isQuery) {
        // For GET requests, add input as query parameter
        let parsedInput = {}
        try {
          parsedInput = JSON.parse(inputData || "{}")
        } catch {
          setError("Invalid JSON in input data")
          setLoading(false)
          return
        }
        
        if (Object.keys(parsedInput).length > 0) {
          url += `?input=${encodeURIComponent(JSON.stringify(parsedInput))}`
        }
        options.method = "GET"
      } else {
        // For POST requests, send input in body
        options.method = "POST"
        options.headers = {
          ...options.headers,
          "Content-Type": "application/json",
        }
        try {
          const parsedInput = JSON.parse(inputData || "{}")
          options.body = JSON.stringify(parsedInput)
        } catch {
          setError("Invalid JSON in input data")
          setLoading(false)
          return
        }
      }

      const res = await fetch(url, options)
      setStatusCode(res.status)
      
      const data = await res.json()
      
      if (!res.ok) {
        const errorMessage = data.error?.message || data.error?.data?.message || `Error: ${res.status} ${res.statusText}`
        setError(errorMessage)
      } else {
        // Handle tRPC response format: { result: { data: ... } }
        const responseData = data.result?.data !== undefined ? data.result.data : data
        setResponse(JSON.stringify(responseData, null, 2))
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute API call")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test API</CardTitle>
        <CardDescription>
          Test API endpoints directly from the browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="endpoint">Endpoint</Label>
          <Select value={selectedEndpoint} onValueChange={handleEndpointChange}>
            <SelectTrigger id="endpoint">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableEndpoints.map((endpoint) => (
                <SelectItem key={endpoint.value} value={endpoint.value}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {endpoint.method}
                    </Badge>
                    <span>{endpoint.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedEndpointInfo && (
            <p className="text-xs text-muted-foreground">
              {selectedEndpointInfo.description}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="input">Input (JSON)</Label>
          <Textarea
            id="input"
            value={inputData}
            onChange={(e) => {
              setInputData(e.target.value)
              setError(null)
            }}
            placeholder='{"key": "value"}'
            className="font-mono text-sm"
            rows={6}
          />
        </div>

        <Button 
          onClick={runApiCall} 
          disabled={loading || !apiKey}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run API Call
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">
                Error {statusCode && `(${statusCode})`}
              </div>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {response && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <Label className="text-green-600">
                Response {statusCode && `(${statusCode})`}
              </Label>
            </div>
            <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto max-h-96 overflow-y-auto">
              <code>{response}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

