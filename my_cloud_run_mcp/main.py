#!/usr/bin/env python3
"""
MCP Server Test Client

This script tests the deployed MCP server at https://mcp-server-371380987858.us-central1.run.app
by calling various tools and validating responses.
"""

import json
import requests
import time
from typing import Dict, Any, List, Optional

class MCPClient:
    """A simple MCP client for testing the deployed server."""
    
    def __init__(self, server_url: str):
        self.server_url = server_url
        self.request_id = 1
        self.session = requests.Session()
        
        # Set required headers for MCP Streamable HTTP transport
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        })
    
    def _make_request(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a JSON-RPC request to the MCP server."""
        
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "id": self.request_id
        }
        
        if params:
            payload["params"] = params
            
        self.request_id += 1
        
        print(f"\n🔄 Calling {method}...")
        print(f"📤 Request: {json.dumps(payload, indent=2)}")
        
        try:
            response = self.session.post(self.server_url, json=payload, timeout=30)
            print(f"📊 Status Code: {response.status_code}")
            print(f"📥 Headers: {dict(response.headers)}")
            
            # Handle SSE response
            if response.headers.get('content-type', '').startswith('text/event-stream'):
                return self._parse_sse_response(response.text)
            else:
                return response.json()
                
        except requests.exceptions.RequestException as e:
            return {"error": f"Request failed: {str(e)}"}
    
    def _parse_sse_response(self, sse_text: str) -> Dict[str, Any]:
        """Parse Server-Sent Events response."""
        lines = sse_text.strip().split('\n')
        for line in lines:
            if line.startswith('data: '):
                try:
                    return json.loads(line[6:])  # Remove 'data: ' prefix
                except json.JSONDecodeError:
                    continue
        return {"error": "Could not parse SSE response"}
    
    def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call a specific tool on the MCP server."""
        return self._make_request("tools/call", {
            "name": tool_name,
            "arguments": arguments
        })
    
    def list_tools(self) -> Dict[str, Any]:
        """List available tools."""
        return self._make_request("tools/list")
    
    def initialize(self) -> Dict[str, Any]:
        """Initialize the MCP session."""
        return self._make_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "roots": {
                    "listChanged": True
                },
                "sampling": {}
            },
            "clientInfo": {
                "name": "test-client",
                "version": "1.0.0"
            }
        })


def test_mcp_server():
    """Run comprehensive tests on the MCP server."""
    
    server_url = "https://mcp-server-371380987858.us-central1.run.app/mcp"
    client = MCPClient(server_url)
    
    print("🚀 Starting MCP Server Tests")
    print(f"🎯 Target Server: {server_url}")
    print("=" * 60)
    
    # Test 1: Initialize
    print("\n📋 TEST 1: Initialize MCP Session")
    init_response = client.initialize()
    print(f"📥 Response: {json.dumps(init_response, indent=2)}")
    
    if "error" in init_response:
        print("❌ Initialization failed!")
        return
    else:
        print("✅ Initialization successful!")
    
    # Test 2: List Tools
    print("\n📋 TEST 2: List Available Tools")
    tools_response = client.list_tools()
    print(f"📥 Response: {json.dumps(tools_response, indent=2)}")
    
    # Test 3: List Projects
    print("\n📋 TEST 3: List GCP Projects")
    projects_response = client.call_tool("list_projects", {})
    print(f"📥 Response: {json.dumps(projects_response, indent=2)}")
    
    # Test 4: List Services (using the project from our deployed server)
    print("\n📋 TEST 4: List Cloud Run Services")
    services_response = client.call_tool("list_services", {
        "project": "luminous-lodge-463714-d9",  # The project ID we saw in deployment
        "region": "us-central1"
    })
    print(f"📥 Response: {json.dumps(services_response, indent=2)}")
    
    # Test 5: Get Service Details
    print("\n📋 TEST 5: Get MCP Server Service Details")
    service_response = client.call_tool("get_service", {
        "project": "luminous-lodge-463714-d9",
        "region": "us-central1", 
        "service": "mcp-server"
    })
    print(f"📥 Response: {json.dumps(service_response, indent=2)}")
    
    # Test 6: Get Service Logs
    print("\n📋 TEST 6: Get MCP Server Logs")
    logs_response = client.call_tool("get_service_log", {
        "project": "luminous-lodge-463714-d9",
        "region": "us-central1",
        "service": "mcp-server"
    })
    print(f"📥 Response: {json.dumps(logs_response, indent=2)}")
    
    # Test 7: Deploy Example Application
    print("\n📋 TEST 7: Deploy Example Go Application")
    
    # Read the example files
    try:
        with open("example-sources-to-deploy/main.go", "r") as f:
            main_go_content = f.read()
        
        with open("example-sources-to-deploy/go.mod", "r") as f:
            go_mod_content = f.read()
            
        with open("example-sources-to-deploy/Dockerfile", "r") as f:
            dockerfile_content = f.read()
        
        deploy_response = client.call_tool("deploy_file_contents", {
            "project": "luminous-lodge-463714-d9",
            "region": "us-central1",
            "service": "test-go-app",
            "files": [
                {
                    "filename": "main.go",
                    "content": main_go_content
                },
                {
                    "filename": "go.mod", 
                    "content": go_mod_content
                },
                {
                    "filename": "Dockerfile",
                    "content": dockerfile_content
                }
            ]
        })
        print(f"📥 Response: {json.dumps(deploy_response, indent=2)}")
        
    except FileNotFoundError as e:
        print(f"❌ Could not read example files: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 MCP Server Tests Completed!")


if __name__ == "__main__":
    test_mcp_server() 