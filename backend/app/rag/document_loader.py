from pathlib import Path

from langchain_core.documents import Document
from pypdf import PdfReader


KNOWLEDGE_BASE_DIR = Path("knowledge_base")


def load_text_documents() -> list[Document]:
    documents: list[Document] = []

    if not KNOWLEDGE_BASE_DIR.exists():
        raise FileNotFoundError(
            f"Knowledge base directory not found: {KNOWLEDGE_BASE_DIR}"
        )

    # Load TXT files
    for file_path in KNOWLEDGE_BASE_DIR.rglob("*.txt"):
        try:
            content = file_path.read_text(
                encoding="utf-8"
            ).strip()

            if not content:
                continue

            document = Document(
                page_content=content,
                metadata={
                    "source": str(file_path),
                    "file_name": file_path.name,
                    "category": file_path.parent.name,
                    "file_type": "txt",
                },
            )

            documents.append(document)

        except OSError as error:
            print(
                f"Could not read TXT file {file_path}: {error}"
            )

    # Load PDF files
    for file_path in KNOWLEDGE_BASE_DIR.rglob("*.pdf"):
        try:
            reader = PdfReader(str(file_path))

            for page_number, page in enumerate(
                reader.pages,
                start=1,
            ):
                content = page.extract_text()

                if not content or not content.strip():
                    continue

                document = Document(
                    page_content=content.strip(),
                    metadata={
                        "source": str(file_path),
                        "file_name": file_path.name,
                        "category": file_path.parent.name,
                        "file_type": "pdf",
                        "page": page_number,
                    },
                )

                documents.append(document)

        except Exception as error:
            print(
                f"Could not read PDF file {file_path}: {error}"
            )

    return documents