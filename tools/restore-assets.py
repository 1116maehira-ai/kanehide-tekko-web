from pathlib import Path
import hashlib
root = Path(__file__).resolve().parent.parent
parts = sorted((root / "asset-parts").glob("interview-long.mp4.part*"))
data = b"".join(p.read_bytes() for p in parts)
assert hashlib.sha256(data).hexdigest() == "473b8c610f3d86df0f4a451da15827c0dcea80c9a439d2d75751d0caf349bb68", "Video checksum mismatch"
for relative in ("publish/assets/interview-long.mp4", "source-original/public/assets/interview-long.mp4"):
    target = root / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
print("Restored interview video; checksum verified.")
