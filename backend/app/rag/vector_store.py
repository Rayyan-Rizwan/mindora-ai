from pathlib import Path
import hashlib

import chromadb
from langchain_core.documents import Document


CHROMA_DB_DIR = Path("chroma_db")
COLLECTION_NAME = "mindora_knowledge"


_client = chromadb.PersistentClient(
    path=str(CHROMA_DB_DIR)
)

_collection = _client.get_or_create_collection(
    name=COLLECTION_NAME,
    metadata={
        "description": "Mindora psychology knowledge base"
    },
)


def generate_document_id(document: Document) -> str:
    """
    Generate a stable ID for a document chunk.

    The same source + content will always produce
    the same ID, preventing duplicate chunks.
    """

    source = str(
        document.metadata.get("source", "")
    )

    page = str(
        document.metadata.get("page", "")
    )

    content = document.page_content.strip()

    unique_content = (
        f"{source}|{page}|{content}"
    )

    return hashlib.sha256(
        unique_content.encode("utf-8")
    ).hexdigest()


def add_documents(
    documents: list[Document],
    embeddings: list[list[float]],
) -> int:

    if not documents:
        return 0

    if len(documents) != len(embeddings):
        raise ValueError(
            "The number of documents must match "
            "the number of embeddings."
        )

    ids = [
        generate_document_id(document)
        for document in documents
    ]

    _collection.upsert(
        ids=ids,
        documents=[
            document.page_content
            for document in documents
        ],
        embeddings=embeddings,
        metadatas=[
            document.metadata
            for document in documents
        ],
    )

    return len(documents)


def search_documents(
    query_embedding: list[float],
    top_k: int = 3,
) -> list[dict]:

    if not query_embedding:
        return []

    results = _collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
    )

    documents = results.get(
        "documents",
        [[]],
    )[0]

    metadatas = results.get(
        "metadatas",
        [[]],
    )[0]

    distances = results.get(
        "distances",
        [[]],
    )[0]

    return [
        {
            "content": content,
            "metadata": metadata,
            "distance": distance,
        }
        for content, metadata, distance in zip(
            documents,
            metadatas,
            distances,
        )
    ]


def get_collection_count() -> int:
    return _collection.count()