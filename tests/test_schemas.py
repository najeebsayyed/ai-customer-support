from app.ai.schemas import AgentReply, Classification, Decision, Issue


def test_classification_model():
    c = Classification(
        section="paddle-boards",
        language="English",
        needs_human=False,
        reason="Customer is asking about recommended pump pressure.",
        acknowledgement="Hello, thank you for reaching out. A colleague will be in touch shortly.",
    )
    assert c.section == "paddle-boards"
    assert c.needs_human is False


def test_issue_model_defaults():
    issue = Issue(
        product="shelving",
        problem="missing-hardware",
    )
    assert issue.valve_checked is False
    assert issue.part_numbers == []
    assert issue.order_number is None


def test_decision_model():
    d = Decision(
        action="reply",
        section="paddle-boards",
        reply="Inflate your board to 15 PSI.",
        reason="Section paddle-boards provides the optimal pressure range.",
    )
    assert d.action == "reply"
    assert d.proposed_action is None


def test_agent_reply_model():
    reply = AgentReply(
        action="escalate",
        reply="Thank you, our team will review this.",
        reasoning="Customer requested a manager.",
        enough_information=True,
        promises_an_action=False,
    )
    assert reply.action == "escalate"
    assert reply.issue is None
