#!/usr/bin/env python3
"""
Test script to diagnose QuickBooks MCP server issues.
This will help identify why Azure AI Foundry is getting 405 errors.
"""

import json
import requests
import sys

MCP_SERVER_URL = "https://mcp-quickbooks.ambitioussky-6c709152.westus2.azurecontainerapps.io/sse"

def test_health_endpoint():
    """Test the health endpoint."""
    print("=" * 80)
    print("TEST 1: Health Endpoint")
    print("=" * 80)
    try:
        health_url = MCP_SERVER_URL.replace("/sse", "/health")
        response = requests.get(health_url, timeout=10)
        print(f"✓ Status Code: {response.status_code}")
        print(f"✓ Response: {response.text}")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False

def test_initialize():
    """Test the MCP initialize handshake."""
    print("\n" + "=" * 80)
    print("TEST 2: MCP Initialize (JSON-RPC)")
    print("=" * 80)
    
    initialize_request = {
        "jsonrpc": "2.0",
        "method": "initialize",
        "id": 1,
        "params": {
            "protocolVersion": "2025-03-26",
            "capabilities": {},
            "clientInfo": {
                "name": "test-client",
                "version": "1.0.0"
            }
        }
    }
    
    print(f"Sending to: {MCP_SERVER_URL}")
    print(f"Request: {json.dumps(initialize_request, indent=2)}")
    
    try:
        response = requests.post(
            MCP_SERVER_URL,
            json=initialize_request,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=10
        )
        print(f"\n✓ Status Code: {response.status_code}")
        print(f"✓ Headers: {dict(response.headers)}")
        print(f"✓ Response: {response.text[:500]}")  # First 500 chars
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✓ JSON Response: {json.dumps(data, indent=2)}")
                return True
            except:
                print("✓ Response is not JSON (might be SSE)")
                return True
        else:
            print(f"✗ Unexpected status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Initialize failed: {e}")
        return False

def test_tools_list():
    """Test the tools/list method."""
    print("\n" + "=" * 80)
    print("TEST 3: Tools List (JSON-RPC)")
    print("=" * 80)
    
    tools_request = {
        "jsonrpc": "2.0",
        "method": "tools/list",
        "id": 2,
        "params": {}
    }
    
    print(f"Sending to: {MCP_SERVER_URL}")
    print(f"Request: {json.dumps(tools_request, indent=2)}")
    
    try:
        response = requests.post(
            MCP_SERVER_URL,
            json=tools_request,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=10
        )
        print(f"\n✓ Status Code: {response.status_code}")
        print(f"✓ Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✓ JSON Response: {json.dumps(data, indent=2)[:1000]}")  # First 1000 chars
                
                if "result" in data and "tools" in data["result"]:
                    tools = data["result"]["tools"]
                    print(f"\n✓ Found {len(tools)} tools:")
                    for tool in tools[:5]:  # Show first 5
                        print(f"  - {tool.get('name', 'unknown')}: {tool.get('description', 'no description')[:60]}")
                    return True
                else:
                    print("✗ Response missing 'result.tools'")
                    return False
            except Exception as e:
                print(f"✗ Failed to parse JSON: {e}")
                print(f"Response text: {response.text[:500]}")
                return False
        else:
            print(f"✗ Unexpected status code: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False
            
    except Exception as e:
        print(f"✗ Tools list failed: {e}")
        return False

def test_get_request():
    """Test what happens with a GET request (Azure might be doing this)."""
    print("\n" + "=" * 80)
    print("TEST 4: GET Request to /sse (What Azure AI Foundry might be doing)")
    print("=" * 80)
    
    try:
        response = requests.get(MCP_SERVER_URL, timeout=10)
        print(f"✓ Status Code: {response.status_code}")
        print(f"✓ Response: {response.text[:500]}")
        
        if response.status_code == 405:
            print("\n⚠️  SERVER RETURNS 405 (Method Not Allowed) FOR GET REQUESTS")
            print("⚠️  This is likely why Azure AI Foundry is failing!")
            print("⚠️  The server needs to handle GET requests or Azure needs to use POST")
            return False
        return True
    except Exception as e:
        print(f"✗ GET request failed: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint."""
    print("\n" + "=" * 80)
    print("TEST 5: Root Endpoint (GET /)")
    print("=" * 80)
    
    try:
        root_url = MCP_SERVER_URL.replace("/sse", "/")
        response = requests.get(root_url, timeout=10)
        print(f"✓ Status Code: {response.status_code}")
        print(f"✓ Response: {response.text[:500]}")
        
        if response.status_code == 405:
            print("\n⚠️  ROOT ENDPOINT ALSO RETURNS 405")
            return False
        return True
    except Exception as e:
        print(f"✗ Root endpoint test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🔍 QuickBooks MCP Server Diagnostic Tool")
    print("=" * 80)
    
    results = []
    
    # Run tests
    results.append(("Health Endpoint", test_health_endpoint()))
    results.append(("Initialize", test_initialize()))
    results.append(("Tools List", test_tools_list()))
    results.append(("GET Request", test_get_request()))
    results.append(("Root Endpoint", test_root_endpoint()))
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {name}")
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    print(f"\nPassed: {passed_count}/{total_count}")
    
    if passed_count < total_count:
        print("\n⚠️  ISSUES DETECTED")
        print("\nLikely Problems:")
        print("1. MCP server is not handling GET requests (returns 405)")
        print("2. Azure AI Foundry may be using GET instead of POST for tool discovery")
        print("3. MCP protocol implementation may be incomplete")
        print("\nRecommended Actions:")
        print("1. Check the MCP server logs for incoming requests")
        print("2. Verify the server implements all required MCP protocol methods")
        print("3. Consider adding GET request support or ensure Azure uses POST")
        sys.exit(1)
    else:
        print("\n✅ All tests passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()
