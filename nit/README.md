# NIT - Tiny Git Clone (Python)

### Quick Start

This is a toy hobby project where I rebuilt core Git ideas in Python.

**Install as a CLI tool:**

```bash
git clone https://github.com/nika_jamaspishvili/nit
cd nit
pip install -e .
```

Then use `nit` from anywhere:

```bash
nit init
nit add .
nit status
nit commit -m "first commit"
nit log
nit checkout <branch>
```

Or run directly without installing:

```bash
python3 nit.py init
python3 nit.py add <path>
python3 nit.py commit -m "message"
```

---

### What I Built

A mini Git-like version control system called **NIT**.

- Stores file snapshots as content-addressed objects (`blob`, `tree`, `commit`)
- Hashes objects with SHA-1 and compresses them with zlib
- Saves objects under `.nit/objects/<2-char-prefix>/<rest-of-hash>`
- Tracks staged state with a JSON index file (`.nit/index`)
- Builds nested trees for directories when committing
- Supports `.gitignore` while scanning files for `add` and `status`
- Tracks branch pointers under `.nit/refs/heads/*`
- Uses `.nit/HEAD` to track the currently active branch

---

### Commands

- `init` — creates `.nit` repository structure
- `add <path>` — stages single files or full directories recursively, skipping ignored paths from `.gitignore`
- `commit -m <message>` — creates a tree + commit object from staged state
- `status` — shows staged changes, unstaged changes, and untracked files (respecting `.gitignore`)
- `log` — walks the commit chain and prints history
- `checkout <branch>` — switches to an existing branch or creates a new one from the current commit

---

### Tech Stack

Python 3, standard library only — `argparse`, `hashlib`, `zlib`, `pathlib`, `json`
