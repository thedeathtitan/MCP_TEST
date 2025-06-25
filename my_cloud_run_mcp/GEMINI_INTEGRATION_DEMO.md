# 🤖 Gemini AI + MCP Medical Assistant Demo

This document showcases the capabilities of our Gemini AI integration with the Medical Diagnostic Assistant MCP server.

## 🎬 Demo Overview

**Input**: Clinical text describing patient symptoms
**Output**: 
- Extracted medical concepts
- Knowledge graph nodes created
- AI-generated diagnostic insights

---

## 📋 Example: Chest Pain Case

### Input Clinical Text
```
45-year-old male presents with acute chest pain radiating to left arm, 
associated with shortness of breath and diaphoresis. Pain started 2 hours 
ago while climbing stairs. Patient has history of hypertension and smoking. 
Vital signs show elevated heart rate and blood pressure.
```

### 🧠 AI-Extracted Medical Concepts

```
✅ Extracted 12 medical concepts:

• Symptoms: chest pain, shortness of breath, diaphoresis, elevated heart rate, elevated blood pressure
• Diagnoses: hypertension  
• Treatments: []
• Anatomical Parts: left arm, heart
• Risk Factors: smoking, male gender, climbing stairs
```

### 📊 Knowledge Graph Creation

```
📝 Creating node: 'chest pain' (Symptom)
   ✅ Created successfully

📝 Creating node: 'shortness of breath' (Symptom)  
   ✅ Created successfully

📝 Creating node: 'diaphoresis' (Symptom)
   ✅ Created successfully

📝 Creating node: 'hypertension' (Diagnosis)
   ✅ Created successfully

📝 Creating node: 'smoking' (Risk_Factor)
   ✅ Created successfully

[... 7 more nodes created ...]

📊 Knowledge Graph Update:
   ✅ Created: 12 new nodes
   ❌ Errors: 0 nodes failed
```

### 🩺 AI-Generated Diagnostic Insights

```
## Clinical Summary
This case presents a 45-year-old male with classic symptoms of acute coronary 
syndrome (ACS). The patient exhibits the classic triad of chest pain radiating 
to the left arm, shortness of breath, and diaphoresis, which are highly 
suggestive of myocardial infarction.

## Potential Diagnoses
1. **ST-Elevation Myocardial Infarction (STEMI)** - Most likely given classic 
   presentation and symptom onset during exertion
2. **Non-ST Elevation Myocardial Infarction (NSTEMI)** - Alternative acute 
   coronary syndrome presentation
3. **Unstable Angina** - Less likely given the severity and duration of symptoms

## Recommended Tests
- **Immediate**: 12-lead ECG, cardiac enzymes (troponin), complete metabolic panel
- **Urgent**: Chest X-ray, PT/PTT, lipid panel
- **Consider**: Echocardiogram, coronary angiography if STEMI confirmed

## Red Flags
⚠️ **IMMEDIATE ATTENTION REQUIRED**
- Classic MI symptoms in high-risk patient
- Hemodynamic instability (elevated HR/BP)
- Symptom onset during exertion suggests plaque rupture

## Next Steps
1. **Immediate**: Activate cardiac catheterization lab
2. **Medications**: Aspirin, clopidogrel, heparin, beta-blocker
3. **Monitor**: Continuous cardiac monitoring, frequent vital signs
4. **Follow-up**: Cardiology consultation, risk factor modification
```

---

## 🎯 Interactive Demo Commands

### Start Interactive Session
```bash
python interactive_demo.py
```

### Sample Session Flow
```
🏥 INTERACTIVE MEDICAL AI DIAGNOSTIC ASSISTANT
🤖 Powered by Gemini + MCP Knowledge Graph
================================================================================

📝 Enter clinical case information:
(Type 'quit' to exit, 'demo' for sample cases)
--------------------------------------------------
>>> Patient with severe headache and neck stiffness
>>> Fever of 102°F, photophobia, altered mental status
>>> 

🏥 Processing Clinical Case #1
============================================================

🔄 Progress: [█░░░] 1/4 - Analyzing with Gemini AI...
🧠 Extracted 8 medical concepts:
   • Symptoms: severe headache, neck stiffness, fever, photophobia, altered mental status
   • Diagnoses: []
   • Risk Factors: []

🔄 Progress: [██░░] 2/4 - Creating knowledge graph nodes...
📊 Knowledge Graph Update:
   ✅ Created: 5 new nodes

🔄 Progress: [███░] 3/4 - Generating diagnostic insights...
🔄 Progress: [████] 4/4 - Complete!

🩺 DIAGNOSTIC INSIGHTS:
==================================================
## Clinical Summary
This presentation is highly concerning for bacterial meningitis...
[Full diagnostic assessment generated]

🔄 Continue with another case? (y/n/demo): demo
```

---

## 🚀 Getting Started

1. **Setup**:
   ```bash
   pip install -r requirements.txt
   export GEMINI_API_KEY="your-api-key"
   python setup_gemini.py
   ```

2. **Run Demo**:
   ```bash
   python interactive_demo.py
   ```

3. **Try Sample Cases**:
   - Type `demo` to see pre-built clinical scenarios
   - Choose from cardiac, respiratory, neurological, or orthopedic cases
   - Or input your own clinical text

## 📊 System Capabilities

### Medical Concept Types Supported
- **Symptoms**: Patient complaints, observable signs
- **Diagnoses**: Medical conditions, diseases  
- **Treatments**: Medications, procedures, therapies
- **Anatomical Parts**: Body parts, organs, systems
- **Risk Factors**: Lifestyle, genetic, environmental factors

### AI Processing Pipeline
1. **Text Analysis**: Gemini processes clinical narrative
2. **Concept Extraction**: Identifies and categorizes medical terms
3. **Knowledge Graph**: Creates persistent nodes in PostgreSQL
4. **Diagnostic Reasoning**: Generates insights based on extracted concepts
5. **Persistence**: All data stored for future analysis and learning

### Real-World Applications
- **Medical Education**: Teaching diagnostic reasoning
- **Clinical Decision Support**: Augmenting physician analysis
- **Research**: Building medical knowledge graphs
- **Quality Assurance**: Standardizing clinical documentation

---

## 🔗 Architecture Flow

```
Clinical Text Input
        ↓
🤖 Gemini API (Concept Extraction)
        ↓
📡 MCP Protocol (Tool Calls)
        ↓  
🏥 Medical Assistant MCP Server
        ↓
🗄️ PostgreSQL Knowledge Graph
        ↓
📊 Diagnostic Insights + Updated Graph
```

---

**🎉 Ready to explore AI-powered medical diagnostics? Run the demo and start processing clinical cases!** 