
from app.rag.document_loader import load_text_documents
from app.rag.text_splitter import split_documents
from app.rag.embeddings import generate_embeddings
from app.rag.vector_store import add_documents, get_collection_count


def ingest_knowledge_base() -> None:
    print("Loading knowledge documents...")

    documents = load_text_documents()
    print(f"Loaded documents: {len(documents)}")

    print("Splitting documents into chunks...")

    chunks = split_documents(documents)
    print(f"Created chunks: {len(chunks)}")

    if not chunks:
        print("No chunks found. Nothing to ingest.")
        return

    print("Generating embeddings...")

    texts = [chunk.page_content for chunk in chunks]
    embeddings = generate_embeddings(texts)

    print(f"Generated embeddings: {len(embeddings)}")

    print("Adding chunks to ChromaDB...")

    added = add_documents(
        documents=chunks,
        embeddings=embeddings,
    )

    print(f"Processed chunks: {added}")
    print(f"Total chunks in ChromaDB: {get_collection_count()}")


if __name__ == "__main__":
    ingest_knowledge_base()
