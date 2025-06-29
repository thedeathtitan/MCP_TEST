#!/usr/bin/env python3
"""
Setup script for Gemini API integration

This script helps you:
1. Set up your Gemini API key
2. Test basic connectivity
3. Verify MCP server access
4. Run a simple end-to-end test
"""

import os
import sys
import requests
import json

def check_gemini_api_key():
    """Check if Gemini API key is configured"""
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment variables")
        print("\n🔧 Setup Instructions:")
        print("1. Go to https://aistudio.google.com/app/apikey")
        print("2. Create a new API key")
        print("3. Set it as an environment variable:")
        print("   export GEMINI_API_KEY='your-api-key-here'")
        print("4. Or create a .env file with: GEMINI_API_KEY=your-api-key-here")
        return False
    
    print(f"✅ GEMINI_API_KEY found: {api_key[:10]}...{api_key[-5:]}")
    return True

def test_gemini_api():
    """Test basic Gemini API connectivity"""
    try:
        import google.generativeai as genai
        
        api_key = os.getenv('GEMINI_API_KEY')
        genai.configure(api_key=api_key)
        
        model = genai.GenerativeModel('gemini-2.5-pro')
        response = model.generate_content("Hello! Please respond with 'Gemini API is working!'")
        
        print(f"✅ Gemini API test successful")
        print(f"   Response: {response.text[:100]}...")
        return True
        
    except Exception as e:
        print(f"❌ Gemini API test failed: {e}")
        return False

def test_mcp_server():
    """Test MCP server connectivity"""
    mcp_url = "https://mcp-server-371380987858.us-central1.run.app"
    
    try:
        # Test basic connectivity
        response = requests.get(f"{mcp_url}/health", timeout=10)
        if response.status_code == 200:
            print(f"✅ MCP server is accessible at {mcp_url}")
        else:
            print(f"⚠️  MCP server responded with status {response.status_code}")
        
        # Test MCP tools list
        response = requests.post(
            f"{mcp_url}/mcp",
            json={
                'jsonrpc': '2.0',
                'method': 'tools/list',
                'params': {},
                'id': 1
            },
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream'
            },
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ MCP tools endpoint is working")
            return True
        else:
            print(f"❌ MCP tools endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ MCP server test failed: {e}")
        return False

def run_simple_test():
    """Run a simple end-to-end test"""
    print("\n🧪 Running simple end-to-end test...")
    
    try:
        from gemini_mcp_client import GeminiMCPClient
        
        api_key = os.getenv('GEMINI_API_KEY')
        mcp_url = "https://mcp-server-371380987858.us-central1.run.app"
        
        client = GeminiMCPClient(mcp_url, api_key)
        
        # Test MCP connection
        result = client.call_mcp_tool('test_db_connection', {})
        if result['success']:
            print("✅ Database connection test passed")
        else:
            print(f"❌ Database connection test failed: {result['error']}")
            return False
        
        # Test concept extraction
        test_text = "Patient presents with chest pain and shortness of breath."
        concepts = client.extract_medical_concepts(test_text)
        
        if concepts and any(concepts.values()):
            print(f"✅ Concept extraction test passed")
            print(f"   Extracted: {sum(len(v) for v in concepts.values())} concepts")
        else:
            print("❌ Concept extraction test failed")
            return False
            
        print("🎉 All tests passed! System is ready.")
        return True
        
    except Exception as e:
        print(f"❌ End-to-end test failed: {e}")
        return False

def install_dependencies():
    """Install required Python packages"""
    print("📦 Installing dependencies...")
    
    try:
        import subprocess
        import sys
        
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ Dependencies installed successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to install dependencies: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def main():
    """Main setup function"""
    print("🤖 Gemini + MCP Medical Assistant Setup")
    print("="*50)
    
    # Check if dependencies are installed
    try:
        import google.generativeai
    except ImportError:
        print("📦 Installing dependencies...")
        if not install_dependencies():
            return
    
    # Step 1: Check API key
    print("\n1️⃣ Checking Gemini API Key...")
    if not check_gemini_api_key():
        return
    
    # Step 2: Test Gemini API
    print("\n2️⃣ Testing Gemini API...")
    if not test_gemini_api():
        return
    
    # Step 3: Test MCP server
    print("\n3️⃣ Testing MCP Server...")
    if not test_mcp_server():
        return
    
    # Step 4: Run end-to-end test
    print("\n4️⃣ Running End-to-End Test...")
    if not run_simple_test():
        return
    
    print("\n🎉 Setup Complete!")
    print("\n🚀 Next Steps:")
    print("1. Run the full demo: python gemini_mcp_client.py")
    print("2. Or integrate into your own workflow")
    print("3. Check your knowledge graph for new medical concepts")

if __name__ == "__main__":
    main() 