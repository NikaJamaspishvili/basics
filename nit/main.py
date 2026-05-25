import argparse
import json
from pathlib import Path
import hashlib
import zlib

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

    def serialize(self) -> bytes:
        header = (
            f"{self.type} {len(self.content)}\0".encode()
        )  # this turns the text to raw bytes
        return zlib.compress(header + self.content)

    @classmethod
    def deserialize(cls, data: bytes) -> "GitObject":
        data = zlib.decompress(data)
        null_idx = data.find(b"\0")
        header = data[:null_idx]
        content = data[null_idx + 1 :]

        # header also has type and length of the content encoded

        type, _ = header.split(" ")

        return cls(type, content)


class Blob(GitObject):
    def __init__(self, content):
        super().__init__("Blob", content)

    def get_content(self) -> bytes:
        return self.content


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
        self.save_index({})

        return True

    def store_object(self, obj) -> str:
        obj_hash = obj.hash()

        # as we know first we create folder with two characters of the hash
        obj_dir = self.nit_objects / obj_hash[:2]

        if not obj_dir.exists():
            obj_dir.mkdir()

        obj_file = obj_dir / obj_hash[2:]

        if not obj_file.exists():
            obj_file.write_bytes(obj.serialize())

        return obj_hash

    def load_index(self) -> dict[str, str]:
        if not self.index.exists():
            return {}

        try:
            return json.loads(self.index.read_text())
        except:
            return {}

    def save_index(self, index_file: dict[str, str]):
        self.index.write_text(json.dumps(index_file, indent=2))

    def add_file(self, path: str) -> None:
        full_path = self.cur_dir / path

        if not full_path.exists():
            return FileNotFoundError("Path Doesn't exist")

        content = full_path.read_bytes()

        blob = Blob(content)

        # save blob in the .git/objects folder
        blob_hash = self.store_object(blob)

        index_file_dict = self.load_index()

        index_file_dict[str(path)] = blob_hash

        self.save_index(index_file_dict)

        print(f"Added {path}")

    def add_directory(self):
        # now we have to handle the directory staging
        return

    def add_path(self, file_path: str) -> None:
        full_path = self.cur_dir / file_path

        if not full_path.exists():
            raise ValueError(f"Path {file_path} Not Found")

        if full_path.is_file():
            self.add_file(full_path)
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
