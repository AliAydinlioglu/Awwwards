#!/usr/bin/env python3
"""
Root entrypoint for Awwwards Creative Lab server.
Delegates to tools/server.py.
"""
import os
import sys

tools_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tools')
sys.path.insert(0, tools_dir)

import server
if __name__ == '__main__':
    server.main()
