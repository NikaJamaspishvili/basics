import argparse
import json
from pathlib import Path
import hashlib

# commit


class GitObject:
    def __init__(self, obj_type: str, content: bytes):
        self.type = obj_type
        self.content = content

    def hash(self) -> str:
        header = (
            f"{self.type} {len(self.content)}\0".encode()
        )  # this turns the text to raw bytes

        return hashlib.sha1(
            header + self.content
        ).hexdigest()  # this hashes the raw header bytes + content bytes and returns readable hex string, example: "a34fwdw23dg3"


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

    def add_file(self, path: str) -> None:
        full_path = self.cur_dir / path

        if not full_path.exists():
            return FileNotFoundError("Path Doesn't exist")

        content = full_path.read_bytes()

    def add_path(self, file_path: str) -> None:
        full_path = self.cur_dir / file_path

        if not full_path.exists():
            raise ValueError(f"Path {file_path} Not Found")

        if full_path.is_file():
            self.add_file()
        elif full_path.is_dir():
            return
            # search directory for all its nested files and add them


def main():
    parser = argparse.ArgumentParser(prog="nit", description="Welcome To NIT")

    sub_parser = parser.add_subparsers(dest="command", help="Available Commands")

    sub_parser.add_parser("init", help="Initialise New Repository")
    add_parser = sub_parser.add_parser("add", help="Add Files To Git")

    add_parser.add_argument("filename", nargs="+", help="Files To Add In Staging Area")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    try:
        repo = Repository()
        match args.command:
            case "init":
                init_res = repo.init()

                if init_res:
                    print(".nit folder created succesfully")
                else:
                    print(".nit folder already exists!")
            case "add":
                for filename in args.filename:
                    repo.add_path(file_path=filename)

    except Exception as e:
        print("exception:", e)


main()
