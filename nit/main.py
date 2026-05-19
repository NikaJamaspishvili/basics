import argparse
import json
from pathlib import Path


class Repository:
    def __init__(self, path="."):
        self.cur_dir = Path(path).resolve()
        self.nit_dir = self.cur_dir / ".nit"

        self.nit_objects = self.nit_dir / "objects"
        self.refs = self.nit_dir / "refs"
        self.refs_head = self.refs / "heads"

        self.HEAD = self.nit_dir / "HEAD"
        self.index = self.nit_dir / "index"

    def init(self) -> bool:
        if self.nit_dir.exists():
            return False

        self.nit_dir.mkdir()
        self.nit_objects.mkdir()
        self.refs.mkdir()
        self.refs_head.mkdir()

        self.HEAD.write_text("refs: refs/heads/main")
        self.index.write_text(json.dumps({}, indent=2))

        return True


def main():
    parser = argparse.ArgumentParser(prog="nit", description="Welcome To NIT")

    sub_parser = parser.add_subparsers(dest="command", help="Available Commands")

    init_parser = sub_parser.add_parser("init", help="Initialise New Repository")
    add_parser = sub_parser.add_parser("add", help="Add File To Git")

    add_parser.add_argument("filename", help="filename user wants to add")
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    try:
        repo = Repository()
        if args.command == "init":
            init_res = repo.init()

            if init_res:
                print(".nit folder created succesfully")
            else:
                print(".nit folder already exists!")

    except Exception as e:
        print("exception:", e)


main()
