from uuid import UUID

from pydantic import BaseModel, Field


class AssessmentOption(BaseModel):
    label: str
    value: int


class AssessmentInstrumentResponse(BaseModel):
    code: str
    name: str
    description: str


class AssessmentQuestion(BaseModel):
    code: str
    question: str
    options: list[AssessmentOption]


class AssessmentAnswerInput(BaseModel):
    question_code: str
    answer_value: int = Field(ge=0, le=5)


class AssessmentSubmitRequest(BaseModel):
    answers: list[AssessmentAnswerInput]


class AssessmentResultResponse(BaseModel):
    assessment_id: UUID
    total_score: int
    severity_level: str
    interpretation: str
    result_data: dict


class AssessmentResponse(BaseModel):
    assessment_id: UUID
    assessment_type: str
    status: str
    questions: list[AssessmentQuestion]