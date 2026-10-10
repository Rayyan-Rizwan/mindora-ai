from app.rag.embeddings import generate_embeddings
from app.rag.vector_store import search_documents


RAG_DISTANCE_THRESHOLD = 1.20


def retrieve_relevant_documents(
    query: str,
    top_k: int = 3,
) -> list[dict]:
    """
    Retrieve relevant psychology knowledge-base documents.

    Only documents within the configured distance threshold
    are considered relevant enough to be used by the AI.
    """

    if not query or not query.strip():
        return []

    query_embedding = generate_embeddings(
        [query.strip()]
    )[0]

    results = search_documents(
        query_embedding=query_embedding,
        top_k=top_k,
    )

    relevant_results = [
        result
        for result in results
        if result.get("distance") is not None
        and result["distance"] <= RAG_DISTANCE_THRESHOLD
    ]

    return relevant_results