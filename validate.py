#!/usr/bin/env python3
"""
Validate GeMOVA JSON data files before committing.
Usage: python3 validate.py
"""

import json
import sys
from pathlib import Path

def validate_json_syntax(filepath):
    """Check if JSON is valid"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            json.load(f)
        return True, None
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON: {e}"
    except Exception as e:
        return False, f"Error reading file: {e}"

def validate_nodes(nodes):
    """Validate nodes data structure"""
    errors = []
    required_fields = ['id', 'name', 'fullName', 'category', 'year', 'description']
    valid_categories = ['VAE', 'GAN', 'Diffusion', 'Transformer', 'Flow', 'EBM']
    ids_seen = set()
    
    for i, node in enumerate(nodes):
        # Check required fields
        for field in required_fields:
            if field not in node:
                errors.append(f"Node {i}: Missing required field '{field}'")
        
        # Check for duplicate IDs
        if 'id' in node:
            if node['id'] in ids_seen:
                errors.append(f"Node {i}: Duplicate ID '{node['id']}'")
            ids_seen.add(node['id'])
        
        # Validate category
        if 'category' in node and node['category'] not in valid_categories:
            errors.append(f"Node {i} ({node.get('id', 'unknown')}): Invalid category '{node['category']}'. Must be one of {valid_categories}")
        
        # Validate year
        if 'year' in node:
            if not isinstance(node['year'], int) or node['year'] < 2000 or node['year'] > 2030:
                errors.append(f"Node {i} ({node.get('id', 'unknown')}): Invalid year {node['year']}")
        
        # Validate papers
        if 'papers' in node and node['papers']:
            for j, paper in enumerate(node['papers']):
                if 'title' not in paper or 'url' not in paper:
                    errors.append(f"Node {i} ({node.get('id', 'unknown')}): Paper {j} missing title or url")
    
    return ids_seen, errors

def validate_links(links, valid_node_ids):
    """Validate links data structure"""
    errors = []
    valid_types = ['improves-upon', 'variation-of', 'used-in', 'inspired-by', 'combines']
    
    for i, link in enumerate(links):
        # Check required fields
        if 'source' not in link:
            errors.append(f"Link {i}: Missing 'source' field")
        if 'target' not in link:
            errors.append(f"Link {i}: Missing 'target' field")
        if 'type' not in link:
            errors.append(f"Link {i}: Missing 'type' field")
        
        # Validate node references
        if 'source' in link and link['source'] not in valid_node_ids:
            errors.append(f"Link {i}: Source node '{link['source']}' not found in nodes.json")
        if 'target' in link and link['target'] not in valid_node_ids:
            errors.append(f"Link {i}: Target node '{link['target']}' not found in nodes.json")
        
        # Validate link type
        if 'type' in link and link['type'] not in valid_types:
            errors.append(f"Link {i}: Invalid type '{link['type']}'. Must be one of {valid_types}")
    
    return errors

def validate_metadata(metadata):
    """Validate metadata structure"""
    errors = []
    
    if 'categories' not in metadata:
        errors.append("Metadata: Missing 'categories' field")
    if 'linkTypes' not in metadata:
        errors.append("Metadata: Missing 'linkTypes' field")
    
    return errors

def main():
    print("🔍 Validating GeMOVA data files...\n")
    
    base_path = Path(__file__).parent / 'assets' / 'data'
    all_valid = True
    
    # Validate nodes.json
    print("📄 Validating nodes.json...")
    nodes_path = base_path / 'nodes.json'
    is_valid, error = validate_json_syntax(nodes_path)
    if not is_valid:
        print(f"  ❌ {error}")
        all_valid = False
    else:
        with open(nodes_path, 'r', encoding='utf-8') as f:
            nodes = json.load(f)
        valid_ids, errors = validate_nodes(nodes)
        if errors:
            print(f"  ❌ Found {len(errors)} error(s):")
            for error in errors[:10]:  # Show first 10 errors
                print(f"     - {error}")
            if len(errors) > 10:
                print(f"     ... and {len(errors) - 10} more")
            all_valid = False
        else:
            print(f"  ✅ Valid ({len(nodes)} nodes)")
    
    # Validate links.json
    print("\n📄 Validating links.json...")
    links_path = base_path / 'links.json'
    is_valid, error = validate_json_syntax(links_path)
    if not is_valid:
        print(f"  ❌ {error}")
        all_valid = False
    else:
        with open(links_path, 'r', encoding='utf-8') as f:
            links = json.load(f)
        errors = validate_links(links, valid_ids)
        if errors:
            print(f"  ❌ Found {len(errors)} error(s):")
            for error in errors[:10]:
                print(f"     - {error}")
            if len(errors) > 10:
                print(f"     ... and {len(errors) - 10} more")
            all_valid = False
        else:
            print(f"  ✅ Valid ({len(links)} links)")
    
    # Validate metadata.json
    print("\n📄 Validating metadata.json...")
    metadata_path = base_path / 'metadata.json'
    is_valid, error = validate_json_syntax(metadata_path)
    if not is_valid:
        print(f"  ❌ {error}")
        all_valid = False
    else:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        errors = validate_metadata(metadata)
        if errors:
            print(f"  ❌ Found {len(errors)} error(s):")
            for error in errors:
                print(f"     - {error}")
            all_valid = False
        else:
            print(f"  ✅ Valid")
    
    # Summary
    print("\n" + "="*50)
    if all_valid:
        print("✅ All validations passed! Ready to commit.")
        return 0
    else:
        print("❌ Validation failed. Please fix the errors above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
