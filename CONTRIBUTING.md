# Contributing to GeMOVA

Thank you for your interest in contributing to the Generative Models Visual Atlas! This guide will help you add new models or improve existing ones.

## 🎯 What We're Looking For

- **Peer-reviewed generative models** (NeurIPS, ICML, ICLR, CVPR, etc.)
- **Influential preprints** (>500 citations or widespread adoption)
- **Production systems** (Stable Diffusion, GPT, etc.)

### Not Suitable:
- Non-generative models (discriminative, classification)
- Unpublished work without code
- Minor architectural tweaks without novel contributions

---

## 📝 How to Contribute

### Option 1: Quick Suggestion (No Coding Required)
[**Open an issue**](https://github.com/GeMOVA/gemova.github.io/issues/new?template=add-model.md) with:
- Paper title and arXiv/venue link
- Why it's significant
- Relationships to existing models

We'll add it for you!

### Option 2: Direct Contribution (Preferred)

1. **Fork** the repository
2. **Add your model** to `assets/data/nodes.json`
3. **Add relationships** to `assets/data/links.json`
4. **Test locally** (see Testing section)
5. **Submit a Pull Request**

---

## 📋 Step-by-Step: Adding a Model

### 1. Add Node to `nodes.json`

```json
{
    "id": "YourModel",
    "name": "YourModel",
    "fullName": "Your Model Full Name",
    "category": "VAE|GAN|Diffusion|Transformer|Flow|EBM",
    "year": 2024,
    "description": "One-sentence overview: what problem does it solve and how?",
    "mainIdea": "Technical explanation with key equations (use LaTeX: \\mu, \\sigma, etc.)",
    "keyContributions": [
        "Primary novel contribution (be specific)",
        "Secondary contribution",
        "Empirical achievement or metric improvement"
    ],
    "papers": [
        {
            "title": "Exact Paper Title",
            "authors": ["First Author", "Second Author", "et al."],
            "year": 2024,
            "url": "https://arxiv.org/abs/XXXX.XXXXX",
            "venue": "NeurIPS 2024"
        }
    ],
    "code": [
        {
            "language": "PyTorch",
            "url": "https://github.com/org/repo"
        }
    ],
    "metrics": {
        "citations": 1500,
        "influence": 7
    },
    "tags": ["descriptive", "keywords", "max-5"],
    "size": 20
}
```

### 2. Add Links to `links.json`

```json
{
    "source": "BaseModel",
    "target": "YourModel",
    "type": "improves-upon|variation-of|used-in|inspired-by|combines",
    "description": "Brief explanation of the relationship"
}
```

---

## 🏷️ Field Guidelines

### **Required Fields**

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Unique identifier (no spaces) | `"StyleGAN2"` |
| `name` | Display name (short) | `"StyleGAN2"` |
| `fullName` | Complete name | `"Style-Based GAN v2"` |
| `category` | Model family | `"GAN"` |
| `year` | Publication year | `2020` |
| `description` | 1-2 sentence summary | `"Improves StyleGAN by..."` |

### **Link Types**

| Type | Use When | Example |
|------|----------|---------|
| `improves-upon` | Direct successor/improvement | WGAN → WGAN-GP |
| `variation-of` | Same core idea, different setting | VAE → CVAE |
| `used-in` | Component of larger system | VAE used in Stable Diffusion |
| `inspired-by` | Conceptual influence | Score Models inspired by EBMs |
| `combines` | Merges multiple approaches | VQ-GAN combines VAE + GAN |

### **Categories**

- **VAE**: Variational autoencoders and variants
- **GAN**: Adversarial training frameworks
- **Diffusion**: Denoising and score-based models
- **Transformer**: Autoregressive and masked models
- **Flow**: Normalizing flows and invertible models
- **EBM**: Energy-based models

### **Metrics**

- **citations**: Approximate Google Scholar count
- **influence**: 1-10 scale (10 = field-defining like VAE/GAN/DDPM)
- **size**: 15-30 (controls node size in graph, 30 = most influential)

---

## ✅ Quality Checklist

Before submitting, verify:

- [ ] Model is **peer-reviewed** or widely adopted (>500 citations)
- [ ] `id` is unique (search `nodes.json` first)
- [ ] `description` is concise but informative
- [ ] `mainIdea` includes technical detail (equations if applicable)
- [ ] At least **one link** to related models (unless truly foundational)
- [ ] Paper URL is accessible (prefer arXiv or open access)
- [ ] Code repository is official (not third-party reimplementation)
- [ ] `year` matches paper publication, not arXiv preprint
- [ ] Links use correct relationship type
- [ ] JSON syntax is valid (use a validator)

---

## 🧪 Testing Your Contribution

### Local Testing

```bash
# 1. Clone your fork
git clone https://github.com/YOUR_USERNAME/gemova.github.io
cd gemova.github.io

# 2. Start local server
python3 -m http.server 8000

# 3. Open browser
# Navigate to http://localhost:8000

# 4. Verify:
# - Your model appears in the graph
# - Links are correctly displayed
# - Info panel shows all data
# - Search finds your model
# - Filter by year/category works
```

### JSON Validation

Use a JSON validator before committing:
```bash
# Option 1: Online
# Copy your JSON to https://jsonlint.com

# Option 2: Command line
python3 -m json.tool assets/data/nodes.json > /dev/null
python3 -m json.tool assets/data/links.json > /dev/null
```

---

## 📐 Complete Example: Adding a New Model

Let's add **"ConsistencyModels"** (2023):

### Step 1: Add to `nodes.json`

```json
{
    "id": "ConsistencyModel",
    "name": "Consistency Model",
    "fullName": "Consistency Models",
    "category": "Diffusion",
    "year": 2023,
    "description": "Distills diffusion models into single-step generators by enforcing self-consistency along probability flow ODEs, achieving 10-50× speedup.",
    "mainIdea": "Learns consistency function f such that f(x_t, t) maps any point on ODE trajectory to its origin x_0. Trained via consistency distillation or direct consistency training without pre-trained diffusion.",
    "keyContributions": [
        "Self-consistency property for probability flow ODEs",
        "Consistency distillation: 1-2 steps vs 1000 for DDPM",
        "Direct training without pre-trained teacher model",
        "SOTA few-step generation quality"
    ],
    "papers": [
        {
            "title": "Consistency Models",
            "authors": ["Song, Y.", "Dhariwal, P.", "Chen, M.", "Sutskever, I."],
            "year": 2023,
            "url": "https://arxiv.org/abs/2303.01469",
            "venue": "ICML 2023"
        }
    ],
    "code": [
        {
            "language": "PyTorch",
            "url": "https://github.com/openai/consistency_models"
        }
    ],
    "metrics": {
        "citations": 450,
        "influence": 8
    },
    "tags": ["acceleration", "distillation", "single-step"],
    "size": 22
}
```

### Step 2: Add to `links.json`

```json
[
    {
        "source": "DDPM",
        "target": "ConsistencyModel",
        "type": "improves-upon",
        "description": "Distills multi-step diffusion into single-step generation"
    },
    {
        "source": "ScoreModel",
        "target": "ConsistencyModel",
        "type": "inspired-by",
        "description": "Uses probability flow ODE framework from score-based models"
    },
    {
        "source": "ConsistencyModel",
        "target": "LCM",
        "type": "used-in",
        "description": "LCM applies consistency training to latent diffusion"
    }
]
```

### Step 3: Commit and Submit

```bash
git checkout -b add-consistency-models
git add assets/data/nodes.json assets/data/links.json
git commit -m "Add Consistency Models (ICML 2023)"
git push origin add-consistency-models
# Open PR on GitHub
```

---

## 🎨 Writing Good Descriptions

### ❌ Bad
```json
"description": "A new diffusion model that's faster"
```

### ✅ Good
```json
"description": "Distills diffusion models into single-step generators by enforcing self-consistency along probability flow ODEs, achieving 10-50× speedup with minimal quality loss."
```

### Tips:
- **Be specific**: What exactly is novel?
- **Quantify**: Include speedup, FID scores, etc.
- **Context**: How does it relate to prior work?
- **Technical**: Use precise terminology

---

## 🤝 Review Process

1. **Automated checks**: JSON syntax, required fields
2. **Manual review**: Scientific accuracy, relationship correctness
3. **Testing**: Visual inspection in the graph
4. **Merge**: Usually within 2-5 days

### Common Issues:
- Missing required fields → Won't render
- Invalid JSON syntax → Build fails
- Broken paper links → Reviewer will flag
- Incorrect categories → We'll suggest fixes
- Missing links → Less discoverable (we may add)

---

## 📞 Questions?

- **General**: [Open a discussion](https://github.com/GeMOVA/gemova.github.io/discussions)
- **Bug reports**: [File an issue](https://github.com/GeMOVA/gemova.github.io/issues)
- **Quick fixes**: Comment on existing PRs
- **Email**: elbahamohamed@gmail.com or oubarifouad@gmail.com

---

## 🏆 Contributors

All contributors are listed in our [README](README.md#contributors). Thank you for helping make GeMOVA comprehensive!

---

**Ready to contribute?** [Fork the repo →](https://github.com/GeMOVA/gemova.github.io/fork)
