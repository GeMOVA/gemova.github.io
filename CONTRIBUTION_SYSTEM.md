# GeMOVA Contribution System

## 🎯 Overview

The contribution system is designed to make it **scientifically rigorous yet frictionless** for researchers to add models to GeMOVA.

## 📁 Files Created

### 1. **CONTRIBUTING.md** (Main Guide)
- Complete step-by-step instructions
- Field-by-field explanations
- Quality checklist
- Testing procedures
- Complete working examples

### 2. **GitHub Templates**

#### `.github/ISSUE_TEMPLATE/add-model.md`
- Structured form for non-technical submissions
- Captures all required information
- Pre-filled fields guide users

#### `.github/PULL_REQUEST_TEMPLATE.md`
- Checklist for contributors
- Automatic reminders
- Testing verification

#### `.github/MODEL_TEMPLATE.json`
- Copy-paste template with inline comments
- All required fields
- Proper JSON structure

#### `.github/LINK_TEMPLATE.json`
- Simple template for relationships
- Type definitions

### 3. **validate.py** (Validation Script)
Automated checks for:
- ✅ JSON syntax validity
- ✅ Required fields presence
- ✅ Duplicate ID detection
- ✅ Category validity (VAE, GAN, etc.)
- ✅ Year range validation (2000-2030)
- ✅ Link type validation
- ✅ Node reference integrity
- ✅ Paper structure completeness

### 4. **UI Enhancements**
- **"Add Model" button** in top-right corner
- Direct link to CONTRIBUTING.md
- Prominent GitHub repository link

---

## 🚀 Contribution Workflow

### For Scientists (Non-Technical)

```
1. Click "Add Model" button in UI
2. Redirected to GitHub issue form
3. Fill in paper details
4. Submit → Maintainers add it
```

**Effort**: 2-3 minutes  
**Technical skills**: None required

### For Contributors (Technical)

```
1. Fork repository
2. Copy template from .github/MODEL_TEMPLATE.json
3. Fill in your model data
4. Add to assets/data/nodes.json
5. Add links to assets/data/links.json
6. Run python3 validate.py
7. Test locally (python3 -m http.server 8000)
8. Submit PR with checklist
```

**Effort**: 10-15 minutes  
**Technical skills**: Basic JSON, git

---

## 📋 Contribution Standards

### Scientific Rigor
- **Peer-reviewed** papers (NeurIPS, ICML, ICLR, CVPR, etc.)
- **Influential preprints** (>500 citations)
- **Production systems** (widely deployed)

### Data Quality
- Accurate citations and metrics
- Precise technical descriptions
- Proper relationship classification
- Working paper/code links

### Relationship Types

| Type | Scientific Meaning | Example |
|------|-------------------|---------|
| `improves-upon` | Direct algorithmic improvement | WGAN-GP improves WGAN |
| `variation-of` | Same framework, different setting | CVAE varies VAE |
| `used-in` | Component dependency | VAE used in Stable Diffusion |
| `inspired-by` | Conceptual influence | Score models inspired by EBMs |
| `combines` | Hybrid approach | VQ-GAN combines VAE + GAN |

---

## 🔍 Validation Process

### Automated (validate.py)
1. JSON syntax check
2. Schema validation
3. Reference integrity
4. No duplicate IDs

### Manual Review
1. Scientific accuracy
2. Proper categorization
3. Relationship correctness
4. Link accessibility

### Typical Timeline
- **Automated feedback**: Instant (on PR)
- **Manual review**: 2-5 days
- **Merge**: After approval

---

## 💡 Design Principles

### 1. **Low Barrier to Entry**
- Non-technical option (issue form)
- Clear templates
- Automated validation catches errors early

### 2. **Scientific Quality**
- Clear acceptance criteria
- Peer-review requirement
- Citation tracking

### 3. **Community-Driven**
- Open contribution model
- Transparent review process
- Contributors credited

### 4. **Maintainability**
- Automated validation prevents broken data
- Templates ensure consistency
- Structured reviews scale

---

## 📊 Expected Impact

### For Contributors
- **Recognition**: Listed in repository
- **Impact**: Help thousands of researchers
- **Effort**: 10-15 minutes per model

### For GeMOVA
- **Coverage**: Stay current with new models
- **Quality**: Community review catches errors
- **Engagement**: Active scientific community

### For Users
- **Comprehensive**: All major models included
- **Current**: Regular updates from community
- **Accurate**: Peer-reviewed contributions

---

## 🎯 Next Steps

### Immediate
1. ✅ All files created and documented
2. ✅ Validation script working
3. ✅ UI button added
4. ✅ README updated

### Phase 2 (Optional)
- **GitHub Actions**: Auto-validate PRs
- **Citation API**: Auto-update citation counts
- **Community badges**: Recognize top contributors
- **Metrics dashboard**: Track coverage/growth

---

## 📝 Example Contribution

See `CONTRIBUTING.md` for complete example of adding "Consistency Models" including:
- Complete node JSON
- Multiple link relationships
- Commit message format
- Testing verification

---

## 🔗 Key Links

- **Main Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Issue Template**: [Add Model](https://github.com/GeMOVA/gemova.github.io/issues/new?template=add-model.md)
- **Model Template**: [.github/MODEL_TEMPLATE.json](.github/MODEL_TEMPLATE.json)
- **Validation**: `python3 validate.py`

---

## ✅ Success Metrics

A good contribution system has:
- ✅ Clear documentation
- ✅ Multiple entry points (issue/PR)
- ✅ Automated validation
- ✅ Fast feedback loops
- ✅ Low maintainer burden

**All achieved!** 🎉

---

## 🤝 Philosophy

> "Science advances through collaboration. GeMOVA is only as comprehensive as the community makes it."

By lowering barriers and maintaining quality, we enable researchers to build a shared knowledge resource that benefits everyone in the field.
