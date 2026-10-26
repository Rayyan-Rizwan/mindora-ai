"""Isolated tests for the authenticated chat-conversation list endpoint.

Safety guarantees
-----------------
* ``DATABASE_URL`` is forced to a unique disposable SQLite file in the OS
  temp directory before any ``app.*`` import.
* RAG / embedding / NLP modules are stubbed in ``sys.modules`` before the
  chat service is imported, so ChromaDB and the real models are never
  opened or loaded.
* ``app.main`` is not imported; a minimal FastAPI app mounts only the chat
  router.
* All users, conversations, and messages are synthetic and non-sensitive.
"""

import os
import sys
import tempfile
import types
import unittest
import uuid
from datetime import datetime, timedelta

TEST_DB_PATH = os.path.join(
    tempfile.gettempdir(),
    f"mindora_chat_list_test_{uuid.uuid4().hex}.db",
)
os.environ["DATABASE_URL"] = "sqlite:///" + TEST_DB_PATH.replace("\\", "/")


def _install_stub(module_name, **attributes):
    module = types.ModuleType(module_name)
    module.__is_test_stub__ = True
    for attr_name, value in attributes.items():
        setattr(module, attr_name, value)
    sys.modules[module_name] = module
    return module


_install_stub(
    "app.rag.embeddings",
    MODEL_NAME="test-stub-embeddings",
    generate_embeddings=lambda texts: [],
)
_install_stub(
    "app.rag.vector_store",
    COLLECTION_NAME="mindora_knowledge",
    search_documents=lambda **kwargs: [],
    generate_document_id=lambda document: "test-id",
)
_install_stub(
    "app.rag.retriever",
    RAG_DISTANCE_THRESHOLD=1.20,
    retrieve_relevant_documents=lambda query, top_k=3: [],
)
_install_stub(
    "app.nlp.emotion_analyzer",
    analyze_emotion=lambda text: {},
)

from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app import models  # noqa: F401,E402
from app.api.v1.endpoints import chat as chat_endpoints  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.database.session import engine as configured_engine  # noqa: E402
from app.models.conversation import Conversation  # noqa: E402
from app.models.enums import SenderType, UserRole  # noqa: E402
from app.models.message import Message  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.chat_service import get_user_conversations  # noqa: E402

TEST_ENGINE = create_engine(
    os.environ["DATABASE_URL"],
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(
    bind=TEST_ENGINE,
    autocommit=False,
    autoflush=False,
)
Base.metadata.create_all(TEST_ENGINE)

app = FastAPI()
app.include_router(chat_endpoints.router, prefix="/api/v1")


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db
client = TestClient(app)

LIST_URL = "/api/v1/chat/conversations"
HISTORY_URL = "/api/v1/chat/history/{conversation_id}"

BASE_TIME = datetime(2026, 1, 1, 12, 0, 0)


def tearDownModule():
    TEST_ENGINE.dispose()
    configured_engine.dispose()
    try:
        os.remove(TEST_DB_PATH)
    except FileNotFoundError:
        pass


def make_user(role=UserRole.USER, *, active=True):
    db = TestingSessionLocal()
    try:
        user = User(
            email=f"test-{uuid.uuid4().hex[:16]}@example.test",
            password_hash="not-a-real-hash",
            full_name="Synthetic Test User",
            role=role,
            is_verified=True,
            is_active=active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def make_conversation(user_id, *, title=None, started_at=None):
    db = TestingSessionLocal()
    try:
        conversation = Conversation(
            user_id=user_id,
            title=title,
            started_at=started_at or BASE_TIME,
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return conversation.id
    finally:
        db.close()


def make_message(conversation_id, sender, content, created_at):
    db = TestingSessionLocal()
    try:
        message = Message(
            conversation_id=conversation_id,
            sender=sender,
            content=content,
            created_at=created_at,
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message.id
    finally:
        db.close()


def auth_header(user):
    token, _jti, _expires_at = create_access_token(
        subject=str(user.id),
        role=user.role.value,
    )
    return {"Authorization": f"Bearer {token}"}


class ChatConversationListTestCase(unittest.TestCase):
    def setUp(self):
        db = TestingSessionLocal()
        try:
            db.query(Message).delete()
            db.query(Conversation).delete()
            db.query(User).delete()
            db.commit()
        finally:
            db.close()


class TestIsolation(ChatConversationListTestCase):
    def test_heavy_modules_are_stubbed_and_db_is_disposable(self):
        for module_name in (
            "app.rag.embeddings",
            "app.rag.vector_store",
            "app.rag.retriever",
            "app.nlp.emotion_analyzer",
        ):
            module = sys.modules.get(module_name)
            self.assertIsNotNone(module, module_name)
            self.assertTrue(
                getattr(module, "__is_test_stub__", False),
                f"{module_name} was not stubbed",
            )

        self.assertIn("mindora_chat_list_test_", str(TEST_ENGINE.url))
        self.assertIn("mindora_chat_list_test_", str(configured_engine.url))


class TestAuthentication(ChatConversationListTestCase):
    def test_list_requires_bearer_token(self):
        response = client.get(LIST_URL)
        self.assertEqual(response.status_code, 403)

    def test_invalid_token_is_rejected(self):
        response = client.get(
            LIST_URL,
            headers={"Authorization": "Bearer invalid-token"},
        )
        self.assertEqual(response.status_code, 401)

    def test_inactive_user_is_rejected(self):
        user = make_user(active=False)

        response = client.get(LIST_URL, headers=auth_header(user))

        self.assertEqual(response.status_code, 401)


class TestConversationListing(ChatConversationListTestCase):
    def test_lists_only_owned_conversations_newest_first(self):
        owner = make_user()
        other = make_user()

        oldest = make_conversation(owner.id, started_at=BASE_TIME)
        newest = make_conversation(
            owner.id,
            started_at=BASE_TIME + timedelta(hours=2),
        )
        other_conversation = make_conversation(
            other.id,
            started_at=BASE_TIME + timedelta(hours=1),
        )

        make_message(
            oldest,
            SenderType.USER,
            "  First   device\nmessage  ",
            BASE_TIME + timedelta(minutes=1),
        )
        make_message(
            newest,
            SenderType.USER,
            "Second device message",
            BASE_TIME + timedelta(hours=2, minutes=1),
        )
        make_message(
            other_conversation,
            SenderType.USER,
            "Other user message",
            BASE_TIME + timedelta(hours=1, minutes=1),
        )

        response = client.get(
            f"{LIST_URL}?user_id={other.id}",
            headers=auth_header(owner),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(
            [item["id"] for item in payload],
            [str(newest), str(oldest)],
        )
        self.assertEqual(payload[0]["title"], "Second device message")
        self.assertEqual(payload[1]["title"], "First device message")
        self.assertEqual(
            set(payload[0].keys()),
            {"id", "title", "started_at"},
        )
        self.assertNotIn(str(other_conversation), [item["id"] for item in payload])

    def test_empty_list_returns_empty_array(self):
        user = make_user()

        response = client.get(LIST_URL, headers=auth_header(user))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_service_limit_returns_newest_conversations(self):
        user = make_user()
        conversation_ids = [
            make_conversation(
                user.id,
                started_at=BASE_TIME + timedelta(hours=offset),
            )
            for offset in range(3)
        ]

        db = TestingSessionLocal()
        try:
            result = get_user_conversations(db, user.id, limit=2)
        finally:
            db.close()

        self.assertEqual(
            [item["id"] for item in result],
            [conversation_ids[2], conversation_ids[1]],
        )


class TestConversationTitles(ChatConversationListTestCase):
    def test_titles_prefer_stored_then_first_user_message(self):
        user = make_user()

        stored = make_conversation(
            user.id,
            title="Stored title",
            started_at=BASE_TIME,
        )
        make_message(
            stored,
            SenderType.USER,
            "Ignored first message",
            BASE_TIME + timedelta(minutes=1),
        )

        derived = make_conversation(
            user.id,
            started_at=BASE_TIME + timedelta(hours=1),
        )
        make_message(
            derived,
            SenderType.AI,
            "AI message only",
            BASE_TIME + timedelta(hours=1, minutes=1),
        )
        make_message(
            derived,
            SenderType.USER,
            "  Second\n user\tmessage  ",
            BASE_TIME + timedelta(hours=1, minutes=2),
        )

        whitespace_title = make_conversation(
            user.id,
            title="   ",
            started_at=BASE_TIME + timedelta(hours=2),
        )
        make_message(
            whitespace_title,
            SenderType.USER,
            "Fallback from whitespace",
            BASE_TIME + timedelta(hours=2, minutes=1),
        )

        no_messages = make_conversation(
            user.id,
            started_at=BASE_TIME + timedelta(hours=3),
        )

        long_title = make_conversation(
            user.id,
            started_at=BASE_TIME + timedelta(hours=4),
        )
        make_message(
            long_title,
            SenderType.USER,
            "word " * 30,
            BASE_TIME + timedelta(hours=4, minutes=1),
        )

        response = client.get(LIST_URL, headers=auth_header(user))

        self.assertEqual(response.status_code, 200)
        titles = {item["id"]: item["title"] for item in response.json()}
        self.assertEqual(titles[str(stored)], "Stored title")
        self.assertEqual(titles[str(derived)], "Second user message")
        self.assertEqual(
            titles[str(whitespace_title)],
            "Fallback from whitespace",
        )
        self.assertIsNone(titles[str(no_messages)])
        self.assertEqual(len(titles[str(long_title)]), 80)


class TestHistoryOwnership(ChatConversationListTestCase):
    def test_same_account_second_session_can_list_and_open_conversation(self):
        owner = make_user()
        conversation_id = make_conversation(
            owner.id,
            started_at=BASE_TIME,
        )
        make_message(
            conversation_id,
            SenderType.USER,
            "Hello from the laptop",
            BASE_TIME + timedelta(minutes=1),
        )
        make_message(
            conversation_id,
            SenderType.AI,
            "Hello from the assistant",
            BASE_TIME + timedelta(minutes=2),
        )
        make_message(
            conversation_id,
            SenderType.USER,
            "Following up from the phone",
            BASE_TIME + timedelta(minutes=3),
        )

        device_one_token = auth_header(owner)["Authorization"]
        device_two_token = auth_header(owner)["Authorization"]
        self.assertNotEqual(device_one_token, device_two_token)
        device_two_header = {"Authorization": device_two_token}

        list_response = client.get(LIST_URL, headers=device_two_header)
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in list_response.json()],
            [str(conversation_id)],
        )

        history_response = client.get(
            HISTORY_URL.format(conversation_id=conversation_id),
            headers=device_two_header,
        )
        self.assertEqual(history_response.status_code, 200)
        history = history_response.json()
        self.assertEqual(history["id"], str(conversation_id))
        self.assertEqual(
            [
                (message["sender"], message["content"])
                for message in history["messages"]
            ],
            [
                ("user", "Hello from the laptop"),
                ("ai", "Hello from the assistant"),
                ("user", "Following up from the phone"),
            ],
        )

    def test_other_user_cannot_open_conversation(self):
        owner = make_user()
        other = make_user()
        conversation_id = make_conversation(owner.id)
        make_message(
            conversation_id,
            SenderType.USER,
            "Private synthetic message",
            BASE_TIME + timedelta(minutes=1),
        )

        response = client.get(
            HISTORY_URL.format(conversation_id=conversation_id),
            headers=auth_header(other),
        )

        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
