import argparse
import json
import os
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

        type, _ = header.split(b" ")

        return cls(type, content)


class Blob(GitObject):
    def __init__(self, content):
        super().__init__("Blob", content)

    def get_content(self) -> bytes:
        return self.content


class Tree(GitObject):
    def __init__(self, content):
        super().__init__("Tree", content)

    @staticmethod
    def current_tree_hash():
        HEAD_file = Path(".nit/HEAD")
        branch_path = Path(HEAD_file.read_text())
        commit_hash = branch_path.read_text()

        if commit_hash:
            commit_file = Path(f".nit/objects/{commit_hash[:2]}/{commit_hash[2:]}")
            commit_file_bytes = commit_file.read_bytes()

            commit_content = GitObject.deserialize(commit_file_bytes).content.decode()

            # saving tree information
            tree_hash = commit_content.split(" ")[1]

            return tree_hash
        else:
            return None


class Commit(GitObject):
    def __init__(self, content):
        super().__init__("Commit", content)


class Repository:
    def __init__(self, path="."):
        self.cur_dir = Path(path).resolve()
        self.nit_dir = self.cur_dir / ".nit"

        self.nit_objects = self.nit_dir / "objects"
        self.refs = self.nit_dir / "refs"
        self.refs_head = self.refs / "heads"

        self.HEAD = self.nit_dir / "HEAD"
        self.index = self.nit_dir / "index"
        self.main_branch = self.refs_head / "main"

    def init(self) -> bool:
        if self.nit_dir.exists():
            return False

        self.nit_dir.mkdir()
        self.nit_objects.mkdir()
        self.refs.mkdir()
        self.refs_head.mkdir()

        self.HEAD.write_text(".nit/refs/heads/main")
        self.main_branch.touch()
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

    def build_tree(self, child_dict):
        tree_content = ""

        for key, value in child_dict.items():
            if not isinstance(value, dict):
                tree_content += f"blob {key} {value}\n"
            else:
                hash = self.build_tree(value)
                tree_content += f"tree {key} {hash}\n"

        tree_obj = Tree(tree_content.encode())
        return self.store_object(tree_obj)

    def active_branch(self):
        return Path(".nit/HEAD").read_text()

    def build_commit(self, message, root_hash):
        # first of all check which branch user is on
        active_branch = Path(self.active_branch())
        active_commit = active_branch.read_text()

        commit_text = "" f"tree {root_hash}\n {active_commit}\n {message}"

        commit_obj = Commit(commit_text.encode())

        commit_hash = self.store_object(commit_obj)

        active_branch.write_text(commit_hash)

        return commit_hash

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
            raise FileNotFoundError("Path Doesn't exist")

        content = full_path.read_bytes()

        blob = Blob(content)

        # save blob in the .git/objects folder
        blob_hash = self.store_object(blob)

        index_file_dict = self.load_index()

        relative_path = full_path.relative_to(self.cur_dir)

        directories = list(relative_path.parts[:-1])

        if len(directories) == 0:
            index_file_dict[str(relative_path)] = blob_hash
        else:
            dict = index_file_dict

            for dir_path in directories:
                if dir_path not in dict:
                    dict[dir_path] = {}
                dict = dict[dir_path]

            dict[relative_path.parts[-1]] = blob_hash

        self.save_index(index_file_dict)

    def _tracked_paths_for_add(self, path: str) -> list[Path]:
        full_path = (self.cur_dir / path).resolve()

        if not full_path.exists():
            raise ValueError(f"Path {path} Not Found")

        if full_path.is_file():
            relative = full_path.relative_to(self.cur_dir)
            flattened_workdir = self.flatten_working_dir()
            if str(relative) in flattened_workdir:
                return [relative]
            return []

        relative_root = full_path.relative_to(self.cur_dir)
        flattened_workdir = self.flatten_working_dir()
        return [
            Path(file_path)
            for file_path in flattened_workdir
            if Path(file_path) == relative_root
            or relative_root in Path(file_path).parents
        ]

    def add_directory(self, path: str):
        # take directory path and recursively traverse it in order to add every file in
        for file_path in self._tracked_paths_for_add(path):
            self.add_file(str(file_path))

    def add_path(self, file_path: str) -> None:
        full_path = (self.cur_dir / file_path).resolve()

        if full_path.is_file():
            tracked_files = self._tracked_paths_for_add(file_path)
            if tracked_files:
                self.add_file(str(tracked_files[0]))
        elif full_path.is_dir():
            self.add_directory(file_path)
            # search directory for all its nested files and add them
        else:
            raise ValueError(f"Path {file_path} Not Found")

    def check_index_commit_diff(
        self,
        flattened_index,
    ) -> None:
        result = {"new file": [], "modified": [], "deleted": []}

        tree_hash = Tree.current_tree_hash()
        if not tree_hash:

            for key in flattened_index.keys():
                result["new file"].append(key)
        else:
            tree_obj = self.read_tree(tree_hash)
            flattened_tree = self.flatten_dictionary(tree_obj)

            for key, value in flattened_index.items():
                if key not in flattened_tree:
                    result["new file"].append(key)
                else:
                    if value != flattened_tree[key]:
                        result["modified"].append(key)

            for key in flattened_tree:
                if key not in flattened_index:
                    result["deleted"].append(key)
        return result

    def check_index_workdir_diff(self, flattened_index, flattened_workdir) -> None:
        result = {"modified": [], "deleted": []}

        for key, value in flattened_index.items():
            if key not in flattened_workdir:
                result["deleted"].append(key)
            else:
                if value != flattened_workdir[key]:
                    result["modified"].append(key)
        return result

    def check_untracked_files(self, flattened_index, flattened_workdir) -> None:
        result = []
        for key in flattened_workdir:
            if key not in flattened_index:
                result.append(key)
        return result

    def status(self) -> None:
        flattened_index = self.flatten_dictionary(self.load_index())
        flattened_workdir = self.flatten_working_dir()
        # three sections of status check:
        # 1. Changes to be committed (diff from current commit tree to index file)
        index_commit_dif = self.check_index_commit_diff(flattened_index)
        # 2. Changes not staged for commit (diff from index file to workdir file)
        index_workdir_diff = self.check_index_workdir_diff(
            flattened_index, flattened_workdir
        )
        # 3. untracked files (diff from workdir files and index files)
        untracked_files = self.check_untracked_files(flattened_index, flattened_workdir)

        if any(index_commit_dif.values()):
            print("Changes to be committed: ")

            for filename in index_commit_dif["new file"]:
                print(f"new file: {filename}")
            for filename in index_commit_dif["modified"]:
                print(f"modified: {filename}")
            for filename in index_commit_dif["deleted"]:
                print(f"deleted: {filename}")

        if any(index_workdir_diff.values()):

            print("Changes not staged for commit")

            for filename in index_workdir_diff["modified"]:
                print(f"modified: {filename}")
            for filename in index_workdir_diff["deleted"]:
                print(f"deleted: {filename}")

        if len(untracked_files) > 0:

            print("Untracked files")

            for filename in untracked_files:
                print(f"new file: {filename}")

        if not (
            any(index_commit_dif.values())
            or any(index_workdir_diff.values())
            or len(untracked_files) > 0
        ):
            print("working space is clean, no changes detected!")

    def commit(self, message: str) -> str:
        index_file_dict = self.load_index()

        if not index_file_dict:
            print("Nothing to commit!")
            return

        # find commit latest tree and index file blob hashes differences.
        index_commit_diff = self.check_index_commit_diff(
            self.flatten_dictionary(self.load_index())
        )

        count = (
            len(index_commit_diff["new file"])
            + len(index_commit_diff["modified"])
            + len(index_commit_diff["deleted"])
        )

        if count == 0:
            print("working space is clean, Nothing to commit")
            return

        print(f"{count} files changed!")

        if index_commit_diff["new file"]:
            print("new files: ")
            for filename in index_commit_diff["new file"]:
                print(filename)
        if index_commit_diff["modified"]:
            print("modified: ")
            for filename in index_commit_diff["modified"]:
                print(filename)
        if index_commit_diff["deleted"]:
            print("deleted: ")
            for filename in index_commit_diff["deleted"]:
                print(filename)

        tree_hash = self.build_tree(child_dict=index_file_dict)
        commit_hash = self.build_commit(message, tree_hash)
        return commit_hash

    def flatten_dictionary(self, d, prefix=""):
        paths = {}
        for key, value in d.items():
            full_path = f"{prefix}/{key}" if prefix else key
            if isinstance(value, dict):
                paths.update(self.flatten_dictionary(value, full_path))
            else:
                paths[full_path] = value
        return paths

    def load_ignored_paths(self):
        dict = {}
        common_ignorable_directories = ["node_modules", "venv", ".nit", "__pycache__"]
        # find every .gitignore files present
        for dirpath, dirnames, filenames in os.walk(self.cur_dir):
            dirnames[:] = [
                dirname
                for dirname in dirnames
                if dirname not in common_ignorable_directories
            ]

            if ".gitignore" not in filenames:
                continue
            else:
                gitignore_path = Path(f"{dirpath}/.gitignore").relative_to(self.cur_dir)

                ignored_files_list = gitignore_path.read_text().splitlines()
                if ignored_files_list:
                    dict[gitignore_path.parent] = []
                    for path in ignored_files_list:
                        dict[gitignore_path.parent].append(path)
        return dict

    def is_subarray(self, arr1, arr2):
        n1, n2 = len(arr1), len(arr2)
        if n1 == 0:
            return True

        return any(arr2[i : i + n1] == arr1 for i in range(n2 - n1 + 1))

    def flatten_working_dir(self, dir: Path = None):
        result_dict = {}
        result_list = []
        ignored_paths_dict = self.load_ignored_paths()
        blocked_dirnames = [".nit"]
        for dir_path, dirnames, filenames in os.walk(dir or self.cur_dir):
            dirnames[:] = [
                dirname for dirname in dirnames if dirname not in blocked_dirnames
            ]
            current_folder_path = Path(f"{dir_path}").relative_to(self.cur_dir)

            ignored_dirnames = []  # default is nit folder
            ignored_filenames = []

            for path, list in ignored_paths_dict.items():
                if current_folder_path.is_relative_to(path):
                    # filter dirnames
                    for dirname in dirnames:
                        current_dir_path = Path(f"{current_folder_path}/{dirname}")

                        for list_path in list:
                            splitted_list_path = Path(list_path).parts
                            if self.is_subarray(
                                splitted_list_path, current_dir_path.parts
                            ):
                                ignored_dirnames.append(current_dir_path)

                    # filter filenames
                    for filename in filenames:
                        current_file_path = Path(f"{current_folder_path}/{filename}")

                        for list_path in list:
                            splitted_list_path = Path(list_path).parts
                            if self.is_subarray(
                                splitted_list_path, current_file_path.parts
                            ):
                                ignored_filenames.append(current_file_path)

            filenames[:] = [
                filename
                for filename in filenames
                if Path(f"{current_folder_path}/{filename}") not in ignored_filenames
            ]

            dirnames[:] = [
                dirname
                for dirname in dirnames
                if Path(f"{current_folder_path}/{dirname}") not in ignored_dirnames
            ]

            for filename in filenames:
                file_path = Path(f"{dir_path}/{filename}")
                if file_path.is_file():
                    relative = file_path.relative_to(self.cur_dir)
                    if not dir:
                        content = file_path.read_bytes()
                        blob_hash = Blob(content).hash()
                        result_dict[str(relative)] = blob_hash
                    else:
                        result_list.append(relative)

        if not dir:
            return result_dict

        return result_list

    def read_tree(self, tree_hash: str):
        tree_file = Path(
            f".nit/objects/{tree_hash.strip()[:2]}/{tree_hash.strip()[2:]}"
        )
        tree_content = GitObject.deserialize(tree_file.read_bytes()).content.decode()
        result = {}
        for line in tree_content.splitlines():
            type, filename, hash = line.split(" ")

            if type == "blob":
                result[filename] = hash
            elif type == "tree":
                result[filename] = self.read_tree(hash)

        return result

    def checkout_branch(self, branch_name: str) -> str:
        HEAD_file = Path(".nit/HEAD")
        old_branch_path = Path(HEAD_file.read_text())
        new_branch_path = Path(f".nit/refs/heads/{branch_name}")

        if new_branch_path.exists():
            tree_hash = Tree.current_tree_hash()
            if tree_hash:
                branch_index_file = self.read_tree(tree_hash)
                self.save_index(branch_index_file)
        else:
            new_branch_path.write_text(old_branch_path.read_text())

        HEAD_file.write_text(f".nit/refs/heads/{branch_name}")

        print(f"working branch: {branch_name}")

    def log(self) -> None:
        branch_path = Path(self.active_branch())
        commit_hash = branch_path.read_text().strip()

        if not commit_hash:
            print("No commits yet")
            return

        while commit_hash:
            commit_file = Path(f".nit/objects/{commit_hash[:2]}/{commit_hash[2:]}")

            if not commit_file.exists():
                break

            commit_data = GitObject.deserialize(
                commit_file.read_bytes()
            ).content.decode()
            commit_lines = commit_data.splitlines()

            tree_line = commit_lines[0].strip() if len(commit_lines) > 0 else ""
            parent_hash = commit_lines[1].strip() if len(commit_lines) > 1 else ""
            message = commit_lines[2].strip() if len(commit_lines) > 2 else ""

            print(f"commit {commit_hash}")
            if tree_line:
                print(tree_line)
            print(f"    {message}")
            print("")

            commit_hash = parent_hash


def main():
    parser = argparse.ArgumentParser(prog="nit", description="Welcome To NIT")

    sub_parser = parser.add_subparsers(dest="command", help="Available Commands")

    sub_parser.add_parser("init", help="Initialise New Repository")

    add_parser = sub_parser.add_parser("add", help="Add Files To Git")
    add_parser.add_argument("filename", nargs="+", help="Files To Add In Staging Area")

    commit_parser = sub_parser.add_parser("commit", description="Add commit changes")
    commit_parser.add_argument("-m", required=True, help="Commit message")

    checkout_branch_parser = sub_parser.add_parser(
        "checkout", description="Checkout branch"
    )

    checkout_branch_parser.add_argument("branch", help="Branch name for checkout")

    sub_parser.add_parser("status", description="Check workspace status")
    sub_parser.add_parser("branch", description="Check current working branch")
    sub_parser.add_parser("log", description="Show commit logs")
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
            case "commit":
                repo.commit(args.m)
            case "checkout":
                repo.checkout_branch(args.branch)
            case "status":
                repo.status()
            case "branch":
                branch = repo.active_branch().split("/")
                print(f"Working branch: {branch[-1]}")
            case "log":
                repo.log()

    except Exception as e:
        print("exception:", e)
