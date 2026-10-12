#!/usr/bin/env python3
"""
CLI Scaffolder for new Awwwards websites in the creative lab.
Usage: python3 tools/create_site.py <site-slug>
"""

import os
import sys
import shutil
import re

def main():
    if len(sys.argv) < 2:
        print("\n❌ Usage: python3 tools/create_site.py <site-slug>")
        print("   Example: python3 tools/create_site.py kinetic-monolith\n")
        sys.exit(1)

    site_name = sys.argv[1].strip()
    slug = re.sub(r'[^a-z0-9_-]', '-', site_name.lower())

    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_dir = os.path.join(root_dir, 'sites', '_template')
    target_dir = os.path.join(root_dir, 'sites', slug)

    if os.path.exists(target_dir):
        print(f"\n⚠️  Site 'sites/{slug}' already exists!")
        print(f"   Preview it at: http://localhost:8080/sites/{slug}/\n")
        sys.exit(0)

    # Copy template to target
    shutil.copytree(template_dir, target_dir)

    # Format title
    title_formatted = slug.replace('-', ' ').replace('_', ' ').title()

    index_path = os.path.join(target_dir, 'index.html')
    if os.path.isfile(index_path):
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()

        content = content.replace('Awwwards Site Template · Studio Concept', f'{title_formatted} · Awwwards Concept')
        content = content.replace('STUDIO VOID', title_formatted.upper())

        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)

    print(f"\n✨ Successfully scaffolded new Awwwards site: sites/{slug}/")
    print(f"📂 Location: {target_dir}")
    print(f"🌐 Live URL:  http://localhost:8080/sites/{slug}/")
    print(f"🚀 Focus Dev: python3 server.py --site {slug}\n")

if __name__ == '__main__':
    main()
