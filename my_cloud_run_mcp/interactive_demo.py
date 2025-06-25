#!/usr/bin/env python3
"""
Interactive Gemini MCP Demo

This script provides an interactive way to:
1. Input your own clinical text
2. Watch AI extract medical concepts
3. See knowledge graph creation in real-time
4. Get diagnostic insights
"""

import os
import sys
from gemini_mcp_client import GeminiMCPClient

def print_banner():
    """Print a nice banner"""
    print("\n" + "="*80)
    print("🏥 INTERACTIVE MEDICAL AI DIAGNOSTIC ASSISTANT")
    print("🤖 Powered by Gemini + MCP Knowledge Graph")
    print("="*80)

def get_clinical_input():
    """Get clinical text from user"""
    print("\n📝 Enter clinical case information:")
    print("(Type 'quit' to exit, 'demo' for sample cases)")
    print("-" * 50)
    
    lines = []
    while True:
        try:
            line = input(">>> ")
            if line.lower() == 'quit':
                return None
            elif line.lower() == 'demo':
                return 'demo'
            elif line.strip() == '':
                if lines:  # If we have content, finish input
                    break
                else:  # If no content yet, continue
                    continue
            else:
                lines.append(line)
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            return None
    
    return '\n'.join(lines)

def show_demo_cases():
    """Show available demo cases"""
    demo_cases = [
        {
            "id": 1,
            "title": "🫀 Acute Coronary Syndrome",
            "preview": "45-year-old male with chest pain radiating to left arm...",
            "text": "45-year-old male presents with acute chest pain radiating to left arm, associated with shortness of breath and diaphoresis. Pain started 2 hours ago while climbing stairs. Patient has history of hypertension and smoking. Vital signs show elevated heart rate and blood pressure."
        },
        {
            "id": 2,
            "title": "🫁 Pneumonia",
            "preview": "32-year-old female with productive cough and fever...",
            "text": "32-year-old female with 5-day history of productive cough with yellow sputum, fever up to 101.5°F, and pleuritic chest pain. Physical exam reveals decreased breath sounds and dullness to percussion in right lower lobe."
        },
        {
            "id": 3,
            "title": "🧠 Acute Stroke",
            "preview": "68-year-old male with sudden onset weakness...",
            "text": "68-year-old male with sudden onset of right-sided weakness, slurred speech, and facial drooping noticed by family this morning. Symptoms developed over 30 minutes. Patient has diabetes and atrial fibrillation, not on anticoagulation."
        },
        {
            "id": 4,
            "title": "🦴 Fracture Evaluation", 
            "preview": "25-year-old athlete with wrist pain after fall...",
            "text": "25-year-old basketball player presents with severe right wrist pain after falling on outstretched hand during game. Unable to bear weight on wrist, visible deformity noted. X-ray shows displaced fracture of distal radius."
        }
    ]
    
    print("\n🎭 Demo Cases Available:")
    print("-" * 40)
    
    for case in demo_cases:
        print(f"{case['id']}. {case['title']}")
        print(f"   {case['preview']}")
        print()
    
    while True:
        try:
            choice = input("Select case number (1-4) or 'back': ")
            if choice.lower() == 'back':
                return None
            
            case_num = int(choice)
            if 1 <= case_num <= len(demo_cases):
                selected_case = demo_cases[case_num - 1]
                print(f"\n✅ Selected: {selected_case['title']}")
                print(f"📄 Full text: {selected_case['text']}")
                return selected_case['text']
            else:
                print("❌ Please enter a number between 1 and 4")
        except ValueError:
            print("❌ Please enter a valid number or 'back'")
        except KeyboardInterrupt:
            return None

def display_progress(step, total, description):
    """Display progress bar"""
    progress = "█" * step + "░" * (total - step)
    print(f"\r🔄 Progress: [{progress}] {step}/{total} - {description}", end="", flush=True)

def main():
    """Main interactive loop"""
    # Check setup
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found!")
        print("Please run: python setup_gemini.py")
        return
    
    # Initialize client
    mcp_url = "https://mcp-server-371380987858.us-central1.run.app"
    client = GeminiMCPClient(mcp_url, api_key)
    
    print_banner()
    
    case_count = 0
    
    while True:
        print(f"\n📊 Cases processed this session: {case_count}")
        
        # Get input
        clinical_text = get_clinical_input()
        
        if clinical_text is None:
            print("\n👋 Thanks for using the Medical AI Assistant!")
            break
        elif clinical_text == 'demo':
            clinical_text = show_demo_cases()
            if clinical_text is None:
                continue
        
        print(f"\n🏥 Processing Clinical Case #{case_count + 1}")
        print("="*60)
        
        # Process with progress indicators
        try:
            display_progress(1, 4, "Analyzing with Gemini AI...")
            concepts = client.extract_medical_concepts(clinical_text)
            
            print()  # New line after progress
            total_concepts = sum(len(v) for v in concepts.values())
            print(f"🧠 Extracted {total_concepts} medical concepts:")
            
            for category, items in concepts.items():
                if items:
                    print(f"   • {category.replace('_', ' ').title()}: {', '.join(items)}")
            
            display_progress(2, 4, "Creating knowledge graph nodes...")
            node_results = client.create_knowledge_graph_nodes(concepts)
            
            print()  # New line after progress
            print(f"📊 Knowledge Graph Update:")
            print(f"   ✅ Created: {len(node_results['created_nodes'])} new nodes")
            if node_results['errors']:
                print(f"   ❌ Errors: {len(node_results['errors'])} nodes failed")
            
            display_progress(3, 4, "Generating diagnostic insights...")
            insights = client.generate_diagnostic_insights(clinical_text, node_results['created_nodes'])
            
            display_progress(4, 4, "Complete!")
            print()  # New line after progress
            
            print(f"\n🩺 DIAGNOSTIC INSIGHTS:")
            print("="*50)
            print(insights)
            
            # Show knowledge graph stats
            graph_result = client.call_mcp_tool('list_nodes', {'limit': 5})
            if graph_result['success']:
                print(f"\n📈 Knowledge Graph Status:")
                print(f"   Recent nodes in database:")
                print(f"   {graph_result['data']}")
            
            case_count += 1
            
            # Ask if user wants to continue
            print(f"\n🔄 Continue with another case? (y/n/demo): ", end="")
            choice = input().lower().strip()
            
            if choice in ['n', 'no', 'quit', 'exit']:
                break
            elif choice in ['demo']:
                demo_text = show_demo_cases()
                if demo_text:
                    # Process demo case immediately
                    result = client.process_clinical_case(demo_text)
                    print(f"\n📋 DIAGNOSTIC INSIGHTS:")
                    print("-" * 40)
                    print(result['diagnostic_insights'])
                    case_count += 1
        
        except KeyboardInterrupt:
            print(f"\n\n⏸️  Interrupted by user")
            break
        except Exception as e:
            print(f"\n❌ Error processing case: {e}")
            print("Please try again or check your connection.")
    
    print(f"\n📊 Session Summary:")
    print(f"   • Processed {case_count} clinical cases")
    print(f"   • Added medical concepts to knowledge graph")
    print(f"   • Generated diagnostic insights")
    print(f"\n🔗 View your knowledge graph at: {mcp_url}")
    print(f"👋 Thank you for using the Medical AI Assistant!")

if __name__ == "__main__":
    main() 