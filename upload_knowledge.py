"""Uploads the files in knowledge/ to an OpenAI vector store so the assistant can search them.

Run it again whenever you change those files: it uploads fresh copies and removes the copies it
uploaded before. Anything else in the vector store is left alone.
"""

import sys
from pathlib import Path

from openai import OpenAI

import config

KNOWLEDGE_DIR = Path(__file__).parent / "knowledge"
SUPPORTED_EXTENSIONS = {".md", ".txt", ".pdf", ".docx", ".pptx", ".html", ".json"}
# Tags the files this script uploads, so it never deletes files that someone else put in the store.
UPLOAD_MARKER = {"uploaded_by": "upload_knowledge.py"}


def main():
    files = sorted(p for p in KNOWLEDGE_DIR.iterdir() if p.suffix.lower() in SUPPORTED_EXTENSIONS)
    if not files:
        sys.exit(f"No documents found in {KNOWLEDGE_DIR}")

    client = OpenAI()
    store_id = config.VECTOR_STORE_ID
    if store_id:
        old_file_ids = [
            f.id
            for f in client.vector_stores.files.list(vector_store_id=store_id)
            if (f.attributes or {}).get("uploaded_by") == UPLOAD_MARKER["uploaded_by"]
        ]
    else:
        store_id = client.vector_stores.create(name=f"{config.BUSINESS_NAME} knowledge base").id
        old_file_ids = []
        print(f"Created vector store {store_id}")

    for path in files:
        with path.open("rb") as f:
            uploaded = client.vector_stores.files.upload_and_poll(
                vector_store_id=store_id, file=f, attributes=UPLOAD_MARKER
            )
        if uploaded.status == "completed":
            print(f"Uploaded {path.name}")
        else:
            print(f"Failed to process {path.name}: {uploaded.last_error}")

    # Remove the previous copies only after the new ones are searchable.
    for file_id in old_file_ids:
        client.vector_stores.files.delete(file_id, vector_store_id=store_id)
        client.files.delete(file_id)
    if old_file_ids:
        print(f"Removed {len(old_file_ids)} old file(s)")

    if not config.VECTOR_STORE_ID:
        print(f"\nAdd this line to your .env file:\nVECTOR_STORE_ID={store_id}")


if __name__ == "__main__":
    main()
