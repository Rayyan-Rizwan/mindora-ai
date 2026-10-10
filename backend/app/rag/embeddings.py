
from sentence_transformers import SentenceTransformer


# Free local embedding model.
# The model is downloaded once and then reused locally.
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


_embedding_model = SentenceTransformer(MODEL_NAME)


def generate_embeddings(
    texts: list[str],
) -> list[list[float]]:
    """
    Convert text into semantic vector embeddings.
    """

    if not texts:
        return []

    embeddings = _embedding_model.encode(
        texts,
        normalize_embeddings=True,
    )

    return embeddings.tolist()


def get_embedding_dimension() -> int:
    """
    Return the size of the generated embedding vectors.
    """

    return _embedding_model.get_sentence_embedding_dimension()
