# NIT - Tiny Git Clone (Python)

### Quick Start

This is a toy hobby project where I rebuilt core Git ideas in Python.

Run commands from inside the `nit/` folder:

- Initialize repo: `python3 main.py init`
- Stage files/folders: `python3 main.py add <path>`
- Check status: `python3 main.py status`
- Commit staged changes: `python3 main.py commit -m "message"`
- Create/switch branch: `python3 main.py checkout <branch>`

Example flow:
`python3 main.py init && python3 main.py add . && python3 main.py status && python3 main.py commit -m "first commit"`

---

### What I Built

This project recreates a mini Git-like version control system called **NIT**.

- Stores file snapshots as content-addressed objects (`blob`, `tree`, `commit`)
- Hashes objects with SHA-1 and compresses them with zlib
- Saves objects under `.nit/objects/<2-char-prefix>/<rest-of-hash>`
- Tracks staged state with a JSON index file (`.nit/index`)
- Builds nested trees for directories when committing
- Tracks branch pointers under `.nit/refs/heads/*`
- Uses `.nit/HEAD` to know the currently active branch

---

### Features

- `init`: creates `.nit` repository structure
- `add`: stages single files or full directories recursively
- `status`: shows:
  - changes to be committed
  - changes not staged for commit
  - untracked files
- `commit`: creates a tree + commit object from staged state
- `checkout <branch>`:
  - switches to existing branch, or
  - creates a new branch from current commit

---

### Tech Stack

- Python 3
- Standard library only:
  - `argparse` (CLI)
  - `hashlib` (SHA-1)
  - `zlib` (object compression)
  - `pathlib` (file system paths)
  - `json` (index storage)
