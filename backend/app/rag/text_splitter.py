
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


# Chunk configuration
CHUNK_SIZE = 800
CHUNK_OVERLAP = 120


def split_documents(
    documents: list[Document],
) -> list[Document]:
    """
    Split loaded documents into smaller overlapping chunks.

    Chunk metadata from the original document is preserved.
    """

    if not documents:
        return []

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=[
            "\n\n",
            "\n",
            ". ",
            " ",
            "",
        ],
    )

    chunks = splitter.split_documents(documents)

    return chunks
