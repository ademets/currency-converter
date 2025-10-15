#!/usr/bin/env python3
"""Serve the repository locally for quick manual testing."""

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse
import contextlib
import os


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-p",
        "--port",
        type=int,
        default=8000,
        help="Port to bind (default: 8000)",
    )
    parser.add_argument(
        "-b",
        "--bind",
        default="127.0.0.1",
        help="Interface to bind (default: 127.0.0.1)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(__file__).parent.resolve()

    os.chdir(root)
    handler_cls = SimpleHTTPRequestHandler
    server = ThreadingHTTPServer((args.bind, args.port), handler_cls)

    print(f"Serving {root} at http://{args.bind}:{args.port} (Ctrl+C to stop)")
    with contextlib.suppress(KeyboardInterrupt):
        server.serve_forever()
    server.server_close()


if __name__ == "__main__":
    main()
